'use client';

import React, { useState, useEffect, useRef } from 'react';
import InAppBrowserNotice from './InAppBrowserNotice';

/** Desktop panel is 909 tall; the design canvas is 748, so it scales to fit exactly. */
const DESKTOP_SCALE = 909 / 748;
/**
 * Welcome-message type size (design px), shared by the title and the body so the
 * whole reading is one block. 26 is the largest size where the longest messages
 * the model returns (~600 characters) still fit the panel without scrolling:
 * VT323 advances ~0.5em, so 26px gives ~46 characters across the 599px column,
 * and 15 lines fit the 500px-tall block.
 */
const WELCOME_PX = 26;
import AsciiFlower from './AsciiFlower';
import Wordmark from './Wordmark';
import {
  ObBack, ObHead, ObFields, ObTag, ObHint, ObToggle, ObPermission, ObCta,
  fieldStyle, obValue, obPx, LIME, BONE,
  COBALT, INK,
} from './onboarding-ui';
import { clearHere, getHere, hasHere } from '@/lib/utils/here';

/** The reader's answer to "use my location", kept next to the personalise flag. */
const LOCATION_KEY = 'slow-garden-use-location';

interface OnboardingProps {
  onComplete: () => void;
}

/**
 * Collapse a part-typed date down to at most 8 digits (ddmmyyyy).
 *
 * A typed "/" means "this segment is finished", so a single-digit day or month
 * is zero-padded. Stripping separators instead shifts every later digit, which
 * turned "7/7/1993" into "77/19/93" — 8 chars, so it never hit the 10-char
 * length the continue button checks and never hit the 8-digit length the
 * validator checks either, leaving no button and no error.
 */
function toDateDigits(value: string): string {
  if (!value.includes('/')) return value.replace(/\D/g, '').slice(0, 8);
  const segments = value.split('/');
  const day = (segments[0] ?? '').replace(/\D/g, '');
  const month = (segments[1] ?? '').replace(/\D/g, '');
  const year = (segments[2] ?? '').replace(/\D/g, '');
  const paddedDay = day.length === 1 ? `0${day}` : day;
  // only pad the month once the user has moved past it (i.e. a year segment exists)
  const paddedMonth = segments.length > 2 && month.length === 1 ? `0${month}` : month;
  return `${paddedDay}${paddedMonth}${year}`.slice(0, 8);
}

/** Same idea for time: "9:30" would otherwise become "93:0". */
function toTimeDigits(value: string): string {
  if (!value.includes(':')) return value.replace(/\D/g, '').slice(0, 4);
  const segments = value.split(':');
  const hour = (segments[0] ?? '').replace(/\D/g, '');
  const minute = (segments[1] ?? '').replace(/\D/g, '');
  const paddedHour = hour.length === 1 ? `0${hour}` : hour;
  return `${paddedHour}${minute}`.slice(0, 4);
}

export default function Onboarding({ onComplete }: OnboardingProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState(''); // DD/MM/YYYY
  const [birthTime, setBirthTime] = useState('');
  const [birthLocation, setBirthLocation] = useState('');
  const [noKnowBirthTime, setNoKnowBirthTime] = useState(false);
  // Whether Claude reads their chart. Off means the plain card meaning only —
  // no API call, no quota spent. Default on, but it is a real choice.
  const [personalise, setPersonalise] = useState(true);

  /**
   * Whether the reader lets the app see where they are.
   *
   * Only feeds the reading page's sunrise and sunset — the sun came up over
   * wherever they are this morning, which is not necessarily where their chart
   * was cast. Off by default, and asked for here rather than mid-reveal: a
   * browser permission dialog landing on the card as it opens is the wrong beat
   * for that moment.
   *
   * This is the reader's stated preference and nothing else moves it. An
   * earlier version set it from whatever the browser answered, which made the
   * switch impossible to turn on once a dialog had been dismissed — it looked
   * broken, because from the reader's side it was. A browser that refuses is
   * now reported underneath instead of silently overriding the choice.
   */
  const [useLocation, setUseLocation] = useState(false);
  const [locationBlocked, setLocationBlocked] = useState(false);
  /**
   * Whether they have already tried once since being refused.
   *
   * A page cannot open the browser's own permission settings — no API exists,
   * deliberately. What it can do is ask again, which works when the reader
   * merely dismissed the dialog and does nothing once they have actually
   * denied. So the note offers the retry first, and only points at the lock
   * icon after that retry has also come back empty, rather than sending
   * everyone hunting through settings they may not need.
   */
  const [locationRetried, setLocationRetried] = useState(false);
  useEffect(() => {
    // The stored preference is what the reader chose; a cached fix is proof they
    // once said yes. Either is enough to show the switch on.
    try {
      setUseLocation(localStorage.getItem(LOCATION_KEY) === 'true' || hasHere());
    } catch {
      setUseLocation(hasHere());
    }
  }, []);

  /*
   * Onboarding opens at the top, and so does every step of it.
   *
   * Each step is meant to be met whole — a question, its field, the button.
   * Two things were putting it in part-scrolled instead. Browsers restore your
   * previous scroll position when you return to a page, which is right for a
   * document and wrong for this; and on a first visit a mobile browser will
   * nudge the page down of its own accord to start collapsing its toolbar,
   * whenever the document has any overflow at all. Chrome does both, so the
   * app opened with the top of the step already gone and the first thing a
   * reader did was scroll up to see what they had opened.
   *
   * Keyed to the step, not just to mount: moving between steps does not remount
   * anything, so without this the second step would inherit wherever the first
   * one had been left.
   *
   * Onboarding only. The card page scrolls for real — it has a reading and a
   * reflection box below the fold — and forcing that to the top would take the
   * reader away from whatever they had scrolled down to read.
   */
  useEffect(() => {
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
    window.scrollTo(0, 0);
    // Again after the browser has laid the step out and settled. A single
    // synchronous call runs before that and loses to anything the browser
    // decides to scroll afterwards.
    const frame = requestAnimationFrame(() => window.scrollTo(0, 0));
    return () => cancelAnimationFrame(frame);
  }, [currentStep]);

  const handleLocationToggle = async (on: boolean) => {
    setUseLocation(on);
    if (!on) {
      clearHere();
      setLocationBlocked(false);
      setLocationRetried(false);
      return;
    }
    // The switch is already on; this only decides whether the browser will
    // actually hand over a fix, and says so if it won't.
    const wasBlocked = locationBlocked;
    const granted = !!(await getHere({ ask: true }));
    setLocationBlocked(!granted);
    setLocationRetried(granted ? false : wasBlocked);
  };

  // Error states
  const [dateError, setDateError] = useState('');
  const [timeError, setTimeError] = useState('');
  const [locationError, setLocationError] = useState('');

  // Typewriter effect state
  const [displayedText, setDisplayedText] = useState('');
  const [isTypingComplete, setIsTypingComplete] = useState(false);

  // Draggable card state
  const [isDragging, setIsDragging] = useState(false);
  const dragCardRef = useRef<HTMLImageElement>(null);
  // Size of the card the reader actually grabbed, measured on screen at pointer-down, so the
  // dragged card (and its trail) start at exactly the size they were clicked at.
  const dragSizeRef = useRef<{ w: number; h: number } | null>(null);
  const [dragSize, setDragSize] = useState<{ w: number; h: number } | null>(null);
  const cardSize = () => dragSizeRef.current ?? (window.innerWidth < 768 ? { w: 110, h: 165 } : { w: 140, h: 210 });
  const rememberCardSize = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) return; // unmeasurable: keep the default size
    dragSizeRef.current = { w: r.width, h: r.height };
    setDragSize(dragSizeRef.current);
  };
  const dragRafRef = useRef<number | null>(null);
  const [cascadedCards, setCascadedCards] = useState<Array<{ x: number; y: number; rotation: number; id: number }>>([]);
  const [cardIdCounter, setCardIdCounter] = useState(0);
  const [shouldCrumble, setShouldCrumble] = useState(false);
  const [showLoading, setShowLoading] = useState(false);

  // Device scale for MacBook / smaller-viewport desktop layout
  const [deviceScale, setDeviceScale] = useState(1);
  const [isMobile, setIsMobile] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  /** Design canvas is 356 wide; scale it to whatever the phone actually is. */
  const [mobileScale, setMobileScale] = useState(1);

  // Location geocode feedback
  const [locationResolved, setLocationResolved] = useState<string | null>(null);
  const [locationChecking, setLocationChecking] = useState(false);
  const locationDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Claude-generated welcome message for step 3
  const [welcomeMessage, setWelcomeMessage] = useState<string | null>(null);

  /**
   * The size the reading is set at on a phone, chosen so the whole thing fits.
   *
   * The reading is written by a model and its length varies by a factor of two,
   * so no fixed size fits every one of them. Scrolling was the previous answer
   * and it was the wrong one: this screen is a single held moment, not a
   * document. So the type shrinks until the reading fits the space instead.
   *
   * Measured against the FULL text rather than the typed-so-far, or the size
   * would step down as the words arrived and the whole block would reflow on
   * every keystroke. The greeting keeps its 3:2 ratio to the body.
   */
  const messageRef = useRef<HTMLDivElement>(null);
  const [readingPx, setReadingPx] = useState(24);
  const [isLoadingWelcome, setIsLoadingWelcome] = useState(false);

  const totalSteps = 4; // 0: splash, 1: name, 2: birth, 3: personalisation, 4: reading

  /**
   * The viewport the canvas is sized against — deliberately NOT the live one.
   *
   * Mobile browsers shrink innerHeight (and fire resize) when the on-screen
   * keyboard opens. Scaling off that made the whole screen visibly shrink the
   * moment you tapped a field. A height-only shrink is always the keyboard, so
   * hold the last full height; a width change is a real rotation, so re-measure.
   */
  const baseViewportRef = useRef<{ w: number; h: number } | null>(null);
  const [baseHeight, setBaseHeight] = useState(0);

  useEffect(() => {
    const check = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const base = baseViewportRef.current;
      if (base && w === base.w && h < base.h) return; // keyboard, not a new viewport
      baseViewportRef.current = { w, h };
      setIsMobile(w < 768);
      setMobileScale(Math.min(w / 356, h / 748));
      setBaseHeight(h);
    };
    check();
    window.addEventListener('resize', check);
    window.addEventListener('orientationchange', check);
    return () => {
      window.removeEventListener('resize', check);
      window.removeEventListener('orientationchange', check);
    };
  }, []);

  useEffect(() => {
    const vv = window.visualViewport;
    if (!vv) return;
    const handler = () => {
      setKeyboardHeight(Math.max(0, window.innerHeight - vv.height - vv.offsetTop));
    };
    vv.addEventListener('resize', handler);
    vv.addEventListener('scroll', handler);
    return () => {
      vv.removeEventListener('resize', handler);
      vv.removeEventListener('scroll', handler);
    };
  }, []);

  /*
   * When the keyboard goes back down, the step is whole again.
   *
   * Focusing a field makes the browser scroll it into view, which is right —
   * you want to see what you are typing into. Dismissing the keyboard should
   * undo that, and on Safari and Brave it effectively does. Chrome leaves the
   * page where the focus scroll put it, so the step stays pushed up with its
   * back link and first line off the top, and the reader has to scroll back by
   * hand to see the screen they are already on.
   *
   * Watched on the falling edge only — when the keyboard was up and now is not.
   * Scrolling on the rising edge would fight the browser at the moment it is
   * bringing the field into view, which is the one time that scroll is wanted.
   *
   * Deferred a frame because the viewport is still settling as the keyboard
   * animates away, and a scroll issued mid-collapse is measured against a
   * height that is about to change.
   */
  const keyboardWasUp = useRef(false);
  useEffect(() => {
    const isUp = keyboardHeight > 0;
    const wasUp = keyboardWasUp.current;
    keyboardWasUp.current = isUp;
    if (!wasUp || isUp) return;

    /*
     * The keyboard dropping is not the same as the reader being finished.
     *
     * Moving from the date field to the time field collapses the keyboard for
     * a moment before the next field raises it again — the falling edge fires
     * in the middle of filling the form, and returning to the top there throws
     * the page up and away from the field just tapped. That is worse than the
     * thing being fixed, and it is what the birth details step was doing.
     *
     * So the edge is necessary but not sufficient: only go back to the top if
     * nothing is focused once the dust settles. Checked on a timer rather than
     * a frame, because focus moves between the two fields after the collapse,
     * not before it — a check on the next frame still sees the old field and
     * scrolls anyway.
     */
    const settle = setTimeout(() => {
      const active = document.activeElement;
      const stillTyping =
        !!active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA');
      if (!stillTyping) window.scrollTo(0, 0);
    }, 200);

    return () => clearTimeout(settle);
  }, [keyboardHeight]);


  // Compute the scale so the device frame + content area always fit within the viewport
  useEffect(() => {
    const computeScale = () => {
      // Leave ~5% breathing room on each dimension
      const scaleW = (window.innerWidth * 0.95) / 801;
      const scaleH = (window.innerHeight * 0.95) / 1000;
      /*
       * Grows as well as shrinks. This was capped at 1, which meant the frame
       * stopped at its design size of 801x1000 no matter how much room it had:
       * on a large display, in full screen, or at a zoomed-out page it sat as a
       * small card in a field of background. The frame is portrait, so height
       * is what binds in practice. The upper bound keeps the panel's one raster
       * asset from being pushed further than it can carry.
       */
      setDeviceScale(Math.min(2.2, scaleW, scaleH));
    };
    computeScale();
    window.addEventListener('resize', computeScale);
    return () => window.removeEventListener('resize', computeScale);
  }, []);

  /**
   * Split the reading into its greeting and body.
   *
   * The split has to come from the COMPLETE message, not the typed-so-far text:
   * mid-typewriter the blank line does not exist yet, so splitting the partial
   * string puts the whole message in the title and it renders at 36px.
   */
  useEffect(() => {
    const host = messageRef.current;
    if (!host || !welcomeMessage) return;

    const fit = () => {
      const available = host.clientHeight;
      if (!available) return;

      const probe = document.createElement('div');
      probe.style.cssText = [
        'position:absolute', 'visibility:hidden', 'pointer-events:none',
        `width:${host.clientWidth}px`, 'display:flex', 'flex-direction:column',
        `gap:${obPx(14, mobileScale)}`, 'text-transform:uppercase',
        'white-space:pre-line', 'font-family:var(--font-vt323), monospace',
      ].join(';');
      const title = document.createElement('div');
      const body = document.createElement('div');
      const [fullTitle, fullBody] = splitReading(welcomeMessage);
      title.textContent = fullTitle;
      body.textContent = fullBody;
      // letter-spacing changes where lines break, so the probe must carry it
      body.style.letterSpacing = '0.01em';
      probe.append(title, body);
      host.parentElement?.appendChild(probe);

      // Step down rather than solve: the relationship between size and wrapped
      // height is not smooth enough to invert, and a dozen reflows of one
      // hidden element costs nothing on a screen that is already waiting.
      let px = 24;
      for (; px > 13; px -= 1) {
        title.style.fontSize = obPx(px * 1.5, mobileScale);
        title.style.lineHeight = '1';
        body.style.fontSize = obPx(px, mobileScale);
        body.style.lineHeight = '1.2';
        if (probe.scrollHeight <= available) break;
      }
      probe.remove();
      setReadingPx(px);
    };

    /*
     * Driven by the box, not by the window, and always a frame late.
     *
     * A window resize listener fires before layout has settled, so the first
     * version read the old height and concluded the text still fit. Watching
     * the container itself catches every reason it can change size, and the
     * rAF makes sure what is measured is the height it actually ended up.
     */
    let frame = 0;
    let lastHeight = -1;
    const schedule = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const h = host.clientHeight;
        if (h === lastHeight) return;
        lastHeight = h;
        fit();
      });
    };

    schedule();
    const observer = new ResizeObserver(schedule);
    observer.observe(host);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [welcomeMessage, mobileScale]);

  /**
   * Where the greeting ends and the reading begins.
   *
   * Shared with the fit measurement below, which has to wrap the text exactly
   * as the render will or it measures a different number of lines. An earlier
   * version split the two differently and consistently under-measured.
   */
  const splitReading = (full: string): [string, string] => {
    let title = full.split(/\n\s*\n/)[0];
    if (title.length === full.length) {
      const firstSentence = full.match(/^[^.!?]*[.!?]/);
      if (firstSentence) title = firstSentence[0];
    }
    return [title, full.slice(title.length).replace(/^\s+/, '')];
  };

  /**
   * The check that actually guarantees it.
   *
   * The probe above predicts the size before the words arrive, so the type
   * never steps while typing. This watches what really rendered and takes
   * another point off if it still spills — a probe can be wrong, but the
   * element's own scrollHeight cannot. One point at a time, so a correction is
   * a nudge rather than a jump, and never below the floor.
   */
  useEffect(() => {
    const host = messageRef.current;
    if (!host || !welcomeMessage || readingPx <= 13) return;
    const frame = requestAnimationFrame(() => {
      if (host.scrollHeight > host.clientHeight) setReadingPx(px => Math.max(13, px - 1));
    });
    return () => cancelAnimationFrame(frame);
  }, [welcomeMessage, readingPx, displayedText]);

  const readingParts = () => {
    const full = welcomeMessage ?? '';
    // Prefer the blank line the prompt asks for, but the model does not always
    // return one — fall back to the opening sentence so the greeting still
    // reads as a title instead of the whole reading rendering at 36px.
    let fullTitle = full.split(/\n\s*\n/)[0];
    if (fullTitle.length === full.length) {
      const firstSentence = full.match(/^[^.!?]*[.!?]/);
      if (firstSentence) fullTitle = firstSentence[0];
    }
    const typed = displayedText;
    const title = typed.slice(0, fullTitle.length);
    const body = typed.length > fullTitle.length
      ? typed.slice(fullTitle.length).replace(/^\s+/, '')
      : '';
    return { title, body };
  };

  const handleNext = () => {
    if (currentStep === 3) {
      // Move to the reading immediately and fetch in parallel.
      setCurrentStep(4);

      // Opted out of personalisation? Then the welcome message must not come
      // from Claude either — use the local one and make no request at all.
      if (!personalise) {
        setWelcomeMessage(getWelcomeMessage());
        setIsLoadingWelcome(false);
        return;
      }

      setWelcomeMessage(null);
      setIsLoadingWelcome(true);
      fetch('/api/welcome-insight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          birthDate,
          birthTime: noKnowBirthTime ? '' : birthTime,
          birthLocation,
        }),
      })
        .then(res => res.json())
        .then(data => {
          setWelcomeMessage(data.message || getWelcomeMessage());
          setIsLoadingWelcome(false);
        })
        .catch(() => {
          setWelcomeMessage(getWelcomeMessage());
          setIsLoadingWelcome(false);
        });
    } else if (currentStep < totalSteps) {
      setCurrentStep(currentStep + 1);
    } else {
      localStorage.setItem('userName', name);
      localStorage.setItem('userBirthdate', birthDate);
      if (birthTime && !noKnowBirthTime) {
        localStorage.setItem('userBirthTime', birthTime);
      }
      if (birthLocation) {
        localStorage.setItem('userBirthLocation', birthLocation);
      }
      localStorage.setItem('slow-garden-personalise', personalise ? 'true' : 'false');
      localStorage.setItem(LOCATION_KEY, useLocation ? 'true' : 'false');
      localStorage.setItem('onboardingComplete', 'true');
      onComplete();
    }
  };

  /** Steps drawn on the fixed 356x748 design canvas. */
  const isDesignStep = currentStep >= 1 && currentStep <= 4;

  const canContinueFromName = name.trim().length > 0;
  const canContinueFromBirthdate = birthDate.length === 10 && !dateError;

  const handleDateChange = (value: string) => {
    // People type dates both as "07/07/1993" and "7/7/1993". Treat a typed "/" as
    // "this segment is done" and zero-pad it, rather than stripping it — stripping
    // silently repacked "7/7/1993" into "77/19/93", which never reaches 10 chars,
    // so neither the error nor the continue button ever appeared.
    const digitsOnly = toDateDigits(value);
    if (digitsOnly === '') { setBirthDate(''); setDateError(''); return; }
    let formatted = digitsOnly;
    if (digitsOnly.length >= 2) formatted = digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2);
    if (digitsOnly.length >= 4) formatted = digitsOnly.slice(0, 2) + '/' + digitsOnly.slice(2, 4) + '/' + digitsOnly.slice(4, 8);
    setBirthDate(formatted);
    if (digitsOnly.length === 8) {
      const day = parseInt(digitsOnly.slice(0, 2));
      const month = parseInt(digitsOnly.slice(2, 4));
      const year = parseInt(digitsOnly.slice(4, 8));
      const date = new Date(year, month - 1, day);
      const today = new Date();
      if (date.getMonth() + 1 !== month || date.getDate() !== day || date.getFullYear() !== year) {
        setDateError('please enter a valid date');
      } else if (date > today) {
        setDateError('birthdate cannot be in the future');
      } else { setDateError(''); }
    } else { setDateError(''); }
  };

  const handleTimeChange = (value: string) => {
    const digitsOnly = toTimeDigits(value);
    if (digitsOnly === '') { setBirthTime(''); setTimeError(''); return; }
    let formatted = digitsOnly;
    if (digitsOnly.length >= 2) formatted = digitsOnly.slice(0, 2) + ':' + digitsOnly.slice(2, 4);
    setBirthTime(formatted);
    if (digitsOnly.length === 4) {
      const hours = parseInt(digitsOnly.slice(0, 2));
      const minutes = parseInt(digitsOnly.slice(2, 4));
      if (hours > 23 || minutes > 59) { setTimeError('please enter a valid time (00:00-23:59)'); }
      else { setTimeError(''); }
    } else { setTimeError(''); }
  };

  const handleLocationChange = (value: string) => {
    setBirthLocation(value);
    setLocationResolved(null);
    if (locationDebounceRef.current) clearTimeout(locationDebounceRef.current);

    if (value.length === 0) { setLocationError(''); return; }
    if (value.includes(',')) {
      const parts = value.split(',').map(p => p.trim());
      if (parts[1] && parts[1].length > 0 && parts[1].length < 2) { setLocationError('please enter a valid location'); return; }
      if (parts[0].length < 2) { setLocationError('please enter a valid location'); return; }
      setLocationError('');
    } else {
      if (value.trim().length < 2) { setLocationError('please enter a valid location'); return; }
      setLocationError('');
    }

    if (value.trim().length >= 3) {
      locationDebounceRef.current = setTimeout(async () => {
        setLocationChecking(true);
        try {
          const res = await fetch(`/api/geocode-check?q=${encodeURIComponent(value.trim())}`);
          const data = await res.json();
          setLocationResolved(data.found ?? '');
        } catch {
          setLocationResolved('');
        } finally {
          setLocationChecking(false);
        }
      }, 800);
    }
  };

  const getSunSign = (dateStr: string): string => {
    const [day, month] = dateStr.split('/').map(num => parseInt(num));
    const m = month; const d = day;
    if ((m === 3 && d >= 21) || (m === 4 && d <= 19)) return 'aries';
    if ((m === 4 && d >= 20) || (m === 5 && d <= 20)) return 'taurus';
    if ((m === 5 && d >= 21) || (m === 6 && d <= 20)) return 'gemini';
    if ((m === 6 && d >= 21) || (m === 7 && d <= 22)) return 'cancer';
    if ((m === 7 && d >= 23) || (m === 8 && d <= 22)) return 'leo';
    if ((m === 8 && d >= 23) || (m === 9 && d <= 22)) return 'virgo';
    if ((m === 9 && d >= 23) || (m === 10 && d <= 22)) return 'libra';
    if ((m === 10 && d >= 23) || (m === 11 && d <= 21)) return 'scorpio';
    if ((m === 11 && d >= 22) || (m === 12 && d <= 21)) return 'sagittarius';
    if ((m === 12 && d >= 22) || (m === 1 && d <= 19)) return 'capricorn';
    if ((m === 1 && d >= 20) || (m === 2 && d <= 18)) return 'aquarius';
    return 'pisces';
  };

  const getLifePathNumber = (dateStr: string): number => {
    const digits = dateStr.replace(/\//g, '').split('').map(Number);
    let sum = digits.reduce((acc, digit) => acc + digit, 0);
    while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
      sum = sum.toString().split('').map(Number).reduce((acc, digit) => acc + digit, 0);
    }
    return sum;
  };

  const getMoonSign = (dateStr: string, timeStr: string): string => {
    const [day, month, year] = dateStr.split('/').map(Number);
    const dayOfYear = Math.floor((new Date(year, month - 1, day).getTime() - new Date(year, 0, 0).getTime()) / 86400000);
    const moonIndex = Math.floor((dayOfYear * 12) / 365) % 12;
    const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    return signs[moonIndex];
  };

  const getRisingSign = (dateStr: string, timeStr: string): string => {
    const [hours] = timeStr.split(':').map(Number);
    const risingIndex = Math.floor(hours / 2) % 12;
    const signs = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];
    return signs[risingIndex];
  };

  const sunInsights: { [key: string]: string } = {
    aries: "you carry more under the surface than people tend to see. there's a lot more going on than you tend to show, and that's what makes this interesting.",
    taurus: "you hold things together in ways others only notice when you stop. there's something in you that needs far more than it asks for.",
    gemini: "you think fast and feel deeply, and most people only catch one of those things. the cards tend to find both.",
    cancer: "you absorb more than you let on — other people's heaviness, old patterns, things that were never even yours. it shows up.",
    leo: "there's more tenderness in you than the confidence suggests. it's often the softer version that people actually need.",
    virgo: "you notice everything, including the things that would be easier to miss. the cards like working with that kind of attention.",
    libra: "you carry a lot for the people around you and make it look effortless. the cards are good at finding what that costs.",
    scorpio: "you already sense more than you're saying — about the situation, about people, about yourself. the cards just confirm it.",
    sagittarius: "you keep looking forward because standing still feels uncomfortable. there's usually something worth pausing for.",
    capricorn: "you hold everything together and almost never let anyone see the effort. the cards notice what you've stopped noticing about yourself.",
    aquarius: "you observe more than you participate. the cards tend to ask what you're watching from that distance.",
    pisces: "everything you feel lands twice as hard because you feel it for yourself and for everyone else. sorting that out is the real work.",
  };

  // Short mobile-only insights (1 sentence each)
  const sunInsightsMobile: { [key: string]: string } = {
    aries: "you carry more under the surface than people know.",
    taurus: "steadiness that costs more than it looks.",
    gemini: "quick on the outside, much deeper underneath.",
    cancer: "you absorb so much that isn't yours to carry.",
    leo: "more tender than the confidence suggests.",
    virgo: "you notice everything. even the things you'd rather not.",
    libra: "holding a lot together for everyone.",
    scorpio: "you already know. you're just waiting to be sure.",
    sagittarius: "always moving so you don't have to stop.",
    capricorn: "composure that takes effort they can't see.",
    aquarius: "observing from a distance, feeling it all anyway.",
    pisces: "everything lands twice as hard when you feel it for everyone.",
  };

  const moonInsightsMobile: { [key: string]: string } = {
    aries: "you process by moving, not by sitting still with it.",
    taurus: "you need solid ground. change shakes you more than anyone sees.",
    gemini: "you need to talk it through to make sense of what you feel.",
    cancer: "your emotions go back further than you — it's ancestral weight.",
    leo: "you need to be seen when you're soft, not just when you're shining.",
    virgo: "you try to organise feelings like problems to solve. some refuse to be fixed.",
    libra: "you feel through the people around you until you've lost track of what's yours.",
    scorpio: "you're all the way in or all the way shut. no in-between.",
    sagittarius: "you need space around your feelings. when it tightens, it starts to feel like captivity.",
    capricorn: "you keep vulnerability contained. letting it loose feels like losing control.",
    aquarius: "you need distance to understand what you feel. raw emotion without analysis panics you.",
    pisces: "you soak up everything around you. other people's pain becomes yours.",
  };

  const risingInsightsMobile: { [key: string]: string } = {
    aries: "you walk in direct and braced. people mistake it for fearlessness.",
    taurus: "you make people feel safe without trying, even when you're still finding your footing.",
    gemini: "you shift to match whoever's in front of you, then forget which version is actually you.",
    cancer: "you lead with softness even when you're trying to protect yourself.",
    leo: "you take up space without trying, even when you're making yourself smaller.",
    virgo: "you arrive looking put-together. no one sees how much overthinking it took.",
    libra: "you make everyone comfortable. sometimes you disappear in the process.",
    scorpio: "people feel your intensity before you've spoken. small talk is agony.",
    sagittarius: "you show up open and light. people don't realise you're just better at moving than sitting still.",
    capricorn: "you look composed and fine. they can't see the pressure you're holding inside.",
    aquarius: "you show up slightly outside the frame. people either get it or they don't.",
    pisces: "you absorb the feeling of rooms without meaning to. it takes more from you than they realise.",
  };

  const numerologyInsightsMobile: { [key: number]: string } = {
    1: "you're here to lead, even when it's isolating.",
    2: "you build bridges between people. but sometimes you've lost your own voice in the process.",
    3: "expression is what you're here to do. holding it back makes it fester.",
    4: "you're building something meant to last. the pressure of being the stable one is exhausting.",
    5: "freedom isn't optional for you. you're figuring out how to commit without disappearing.",
    6: "you're built to care for people. you're learning that martyrdom isn't love.",
    7: "you're here to go deep. surface conversations make your skin itch.",
    8: "your path is about legacy. real strength isn't the same as control.",
    9: "you're always finishing cycles, releasing things even when it hurts.",
    11: "you pick up on frequencies others can't hear. the sensitivity is overwhelming until you realise it's a gift.",
    22: "you're here to build something massive. the vision is clear but bringing it to earth takes everything.",
    33: "you carry a healing frequency people feel before you speak. the responsibility gets heavy.",
  };

  const getWelcomeMessageMobile = (): string => {
    if (!birthDate) return '';
    const sunSign = getSunSign(birthDate);
    const hasBirthTime = birthTime && !noKnowBirthTime;
    const hasLocation = birthLocation && birthLocation.trim().length >= 2;
    if (hasBirthTime && hasLocation) {
      const moonSign = getMoonSign(birthDate, birthTime);
      const risingSign = getRisingSign(birthDate, birthTime);
      return `${name}!\n${sunInsightsMobile[sunSign]}\n${moonInsightsMobile[moonSign]}\n${risingInsightsMobile[risingSign]}\nthe cards are ready — pull one!`;
    }
    if (hasBirthTime) {
      const moonSign = getMoonSign(birthDate, birthTime);
      return `${name}!\n${sunInsightsMobile[sunSign]}\n${moonInsightsMobile[moonSign]}\nthe cards are excited. pull one!`;
    }
    if (hasLocation) {
      return `${name}!\n${sunInsightsMobile[sunSign]}\nthe cards are ready for you. pull one!`;
    }
    const lifePathNumber = getLifePathNumber(birthDate);
    return `${name}!\n${sunInsightsMobile[sunSign]}\n${numerologyInsightsMobile[lifePathNumber]}\nthe cards are ready. pull one!`;
  };

  const moonInsights: { [key: string]: string } = {
    aries: "emotionally, you process by moving — you need to do something with it, not sit still.",
    taurus: "your inner world needs stability. unexpected shifts rattle you harder than most people around you know.",
    gemini: "you need to talk through what you feel to make sense of it. silence with big emotions doesn't work for you.",
    cancer: "some of what you carry emotionally is older than you — pattern, not just feeling.",
    leo: "you need to be seen when you're soft, not just when you're on.",
    virgo: "you try to organise feelings like problems to solve. some of them refuse.",
    libra: "you feel through the people around you until you've lost track of what's actually yours.",
    scorpio: "there's no in-between emotionally — all in or all the way shut.",
    sagittarius: "you need space around your feelings. too much closeness starts to feel like confinement.",
    capricorn: "vulnerability feels like losing control. you're slowly learning that it isn't.",
    aquarius: "you process feelings better from a distance. raw emotion without analysis makes things worse.",
    pisces: "you absorb everything around you. other people's pain becomes yours before you've noticed.",
  };

  const risingInsights: { [key: string]: string } = {
    aries: "you show up direct and ready, even when you're not — people read that as certainty.",
    taurus: "something in your presence makes people feel settled before you've said anything.",
    gemini: "you shift to fit whoever's in front of you, which works until you've lost track of which one is you.",
    cancer: "you lead with care even when you're trying to protect yourself — it comes through anyway.",
    leo: "you take up space effortlessly, even when you're actively trying not to.",
    virgo: "you arrive looking composed and prepared. they can't see the analysis that got you there.",
    libra: "you smooth everything over for everyone. sometimes you disappear a little in the process.",
    scorpio: "people feel the intensity before you've spoken. small talk genuinely costs you something.",
    sagittarius: "you come across bright and open. people don't realise you're just faster at moving than stopping.",
    capricorn: "you carry a composed, reliable presence. the pressure behind it isn't visible.",
    aquarius: "you arrive slightly outside the frame. people either get that or they don't.",
    pisces: "you absorb the mood of whatever room you enter. it takes more from you than it looks.",
  };

  const numerologyInsights: { [key: number]: string } = {
    1: "you're being pushed to lead, even when it feels like a solo thing.",
    2: "you build bridges between people. sometimes you lose your own voice doing it.",
    3: "expression is what you're here for. holding it in makes things worse.",
    4: "you're building something solid, and carrying the weight of being the stable one.",
    5: "freedom isn't optional for you — you're figuring out how to commit without losing yourself.",
    6: "you're built to care for people. the line between love and self-erasure is the real work.",
    7: "you're here to go deep. surface-level anything makes your skin itch.",
    8: "building something real that lasts. strength and control aren't the same thing.",
    9: "you're always releasing things that others cling to. that's the path.",
    11: "you pick up on frequencies others miss. the sensitivity is the gift, even when it's overwhelming.",
    22: "you're here to build something massive. bringing the vision down to earth is everything.",
    33: "you carry something people feel before you speak. the weight of that responsibility is real.",
  };

  const getWelcomeMessage = (): string => {
    if (!birthDate) return '';
    const sunSign = getSunSign(birthDate);
    const hasBirthTime = birthTime && !noKnowBirthTime;
    const hasLocation = birthLocation && birthLocation.trim().length >= 2;
    if (hasBirthTime && hasLocation) {
      const moonSign = getMoonSign(birthDate, birthTime);
      const risingSign = getRisingSign(birthDate, birthTime);
      return `${name}!\n\n${sunInsights[sunSign]}\n\n${moonInsights[moonSign]}\n\n${risingInsights[risingSign]}\n\nthe cards see all of it — let's find out what's up.`;
    }
    if (hasBirthTime) {
      const moonSign = getMoonSign(birthDate, birthTime);
      return `${name}!\n\n${sunInsights[sunSign]}\n\n${moonInsights[moonSign]}\n\nthe cards get it. pull one when you're ready.`;
    }
    if (hasLocation) {
      return `${name}!\n\n${sunInsights[sunSign]}\n\nthe cards get it. pull one when you're ready.`;
    }
    const lifePathNumber = getLifePathNumber(birthDate);
    return `${name}!\n\n${sunInsights[sunSign]}\n\n${numerologyInsights[lifePathNumber]}\n\nthe cards are ready whenever you are.`;
  };

  // Typewriter effect — waits for the API-generated welcome message
  useEffect(() => {
    if (currentStep === 4 && welcomeMessage !== null) {
      setDisplayedText('');
      setIsTypingComplete(false);
      const fullText = welcomeMessage;
      let currentIndex = 0;
      const typingInterval = setInterval(() => {
        if (currentIndex < fullText.length) {
          setDisplayedText(fullText.slice(0, currentIndex + 1));
          currentIndex++;
        } else {
          setIsTypingComplete(true);
          clearInterval(typingInterval);
        }
      }, 30);
      return () => clearInterval(typingInterval);
    }
  }, [currentStep, welcomeMessage]);

  // ── Drag helpers ─────────────────────────────────────────────────────────
  const addCascadeCard = (x: number, y: number) => {
    setCascadedCards(prev => {
      const lastCard = prev[prev.length - 1];
      if (lastCard) {
        const distance = Math.sqrt(Math.pow(x - lastCard.x, 2) + Math.pow(y - lastCard.y, 2));
        if (distance <= 15) return prev;
      }
      const rotation = Math.random() * 30 - 15;
      setCardIdCounter(c => c + 1);
      return [...prev, { x, y, rotation, id: prev.length }];
    });
  };

  const completeDrag = () => {
    setIsDragging(false);
    setShouldCrumble(true);
    setTimeout(() => {
      setShowLoading(true);
      localStorage.setItem('userName', name);
      localStorage.setItem('userBirthdate', birthDate);
      if (birthTime && !noKnowBirthTime) localStorage.setItem('userBirthTime', birthTime);
      if (birthLocation) localStorage.setItem('userBirthLocation', birthLocation);
      localStorage.setItem('slow-garden-personalise', personalise ? 'true' : 'false');
      localStorage.setItem(LOCATION_KEY, useLocation ? 'true' : 'false');
      localStorage.setItem('onboardingComplete', 'true');
      setTimeout(() => onComplete(), 2000);
    }, 1000);
  };

  // Mouse drag
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isTypingComplete) return;
    rememberCardSize(e.currentTarget as HTMLElement);
    e.preventDefault();
    setIsDragging(true);
    const rotation = Math.random() * 30 - 15;
    setCascadedCards([{ x: e.clientX, y: e.clientY, rotation, id: cardIdCounter }]);
    setCardIdCounter(c => c + 1);
    requestAnimationFrame(() => {
      if (dragCardRef.current) {
        const { w: cw, h: ch } = cardSize();
        dragCardRef.current.style.transform = `translate(${e.clientX - cw / 2}px, ${e.clientY - ch / 2}px)`;
      }
    });
  };

  // Touch drag
  const handleTouchStart = (e: React.TouchEvent) => {
    if (!isTypingComplete) return;
    rememberCardSize(e.currentTarget as HTMLElement);
    e.preventDefault();
    const touch = e.touches[0];
    setIsDragging(true);
    const rotation = Math.random() * 30 - 15;
    setCascadedCards([{ x: touch.clientX, y: touch.clientY, rotation, id: cardIdCounter }]);
    setCardIdCounter(c => c + 1);
    requestAnimationFrame(() => {
      if (dragCardRef.current) {
        const { w: cw, h: ch } = cardSize();
        dragCardRef.current.style.transform = `translate(${touch.clientX - cw / 2}px, ${touch.clientY - ch / 2}px)`;
      }
    });
  };

  // Global mouse listeners
  useEffect(() => {
    if (!isDragging) return;
    const handleMouseMove = (e: MouseEvent) => {
      addCascadeCard(e.clientX, e.clientY);
      if (dragRafRef.current !== null) return;
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        if (dragCardRef.current) {
          const { w: cw, h: ch } = cardSize();
          dragCardRef.current.style.transform = `translate(${e.clientX - cw / 2}px, ${e.clientY - ch / 2}px)`;
        }
      });
    };
    const handleMouseUp = () => completeDrag();
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  // Global touch listeners
  useEffect(() => {
    if (!isDragging) return;
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault();
      const touch = e.touches[0];
      addCascadeCard(touch.clientX, touch.clientY);
      if (dragRafRef.current !== null) return;
      dragRafRef.current = requestAnimationFrame(() => {
        dragRafRef.current = null;
        if (dragCardRef.current) {
          const { w: cw, h: ch } = cardSize();
          dragCardRef.current.style.transform = `translate(${touch.clientX - cw / 2}px, ${touch.clientY - ch / 2}px)`;
        }
      });
    };
    const handleTouchEnd = () => completeDrag();
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);
    return () => {
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // ── Shared input style ────────────────────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    fontFamily: 'var(--font-vt323), monospace',
    background: 'rgba(255, 255, 255, 0.12)',
    backdropFilter: 'blur(10px)',
    border: '1px solid rgba(255, 255, 255, 0.2)',
    color: '#F7F4E6',
    borderRadius: '1.5rem',   // explicit radius — prevents iOS from squaring corners on focus
    WebkitAppearance: 'none',
    appearance: 'none',
  };

  const inputErrorStyle = {
    ...inputStyle,
    border: '2px solid rgba(239, 68, 68, 0.6)',
  } as const;

  // ── Field error row — icon + message, only takes up space when shown ──────
  const FieldError = ({ message, variant }: { message: string; variant: 'dark' | 'light' }) => (
    <div className="flex items-center gap-2 mt-2 px-1">
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          width: '16px', height: '16px', minWidth: '16px', borderRadius: '50%',
          background: '#dc2626', color: '#fff', fontSize: '11px', fontWeight: 700, lineHeight: 1,
        }}
      >
        !
      </span>
      <p
        className={variant === 'dark' ? 'text-red-400 text-sm' : 'text-red-600 text-base'}
        style={{ fontFamily: 'var(--font-dm-mono), ui-monospace, monospace' }}
      >
        {message}
      </p>
    </div>
  );

  // ── Step content (MOBILE) ──────────────────────────────────────────────────────────
  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <div
            className="relative flex flex-col flex-1"
            /* reserve the CTA's band (62 tall, 34 from the bottom) so the auto
               margins below centre the wordmark in the space above the button */
            style={{ paddingBottom: `${96 * mobileScale}px` }}
          >
            {/*
              Logo group — sized off one unit so the wordmark scales with the
              viewport instead of being pinned to a fixed px size. The unit is
              width-driven (42vw, the original proportion) until the screen is
              too short for it — on a landscape phone a pure-vw wordmark grew
              taller than the viewport and pushed the CTA off-screen — so the
              height caps it. Every other measurement is a ratio of that unit,
              keeping the Figma proportions intact at any size.
              Auto margins centre it in the space above the CTA.
            */}
            <div style={{
              '--wm': 'min(42vw, 34dvh)',
              position: 'relative',
              width: '100%',
              height: 'calc(var(--wm) * 1.6)',
              marginTop: 'auto',
              marginBottom: 'auto',
              flexShrink: 0,
              overflow: 'visible',
            } as React.CSSProperties}>
              {/* Wordmark — 5a, typed out, in the same lime "glass" as before: 20% fill, 80% outline. */}
              <Wordmark
                animated="/slow-garden-wordmark-glass.webp"
                still="/slow-garden-wordmark-glass-still.png"
                alt="slow garden"
                style={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  width: '90%',
                  maxWidth: '520px',
                }}
              />
            </div>

            {/* Sits above the CTA rather than over the wordmark: the reader
                should meet the name first, and the notice only matters at the
                moment they are about to commit details to this browser. */}
            <InAppBrowserNotice scale={mobileScale} />

            {/* Continue — the same CTA the rest of the onboarding uses */}
            <ObCta scale={mobileScale} onClick={handleNext} />
          </div>
        );

      case 1:
        return (
          <div className="relative w-full h-full">
            <ObBack tone="dark" scale={mobileScale} onClick={() => setCurrentStep(0)} />
            <ObHead
              tone="dark"
              scale={mobileScale}
              title={<>WHAT&apos;S<br />YOUR NAME?</>}
              sub="FIRST NAME IS FINE"
            />
            {/* Sits under the heading, at the permissions step's height, so the
                field is still in full view once the keyboard is up — rather
                than at the canvas's midpoint where the keyboard covers it. */}
            <ObFields scale={mobileScale} top={330}>
              <div style={fieldStyle('dark', mobileScale, true, true)}>
                <span style={{ fontFamily: 'var(--font-vt323), monospace', fontSize: obPx(24, mobileScale), color: LIME }}>&gt;</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canContinueFromName) handleNext(); }}
                  placeholder="YOUR NAME"
                  autoFocus
                  style={{ ...obValue(mobileScale, true), color: BONE, textTransform: 'uppercase' }}
                />
              </div>
              <ObHint tone="dark" scale={mobileScale}>STORED ON YOUR DEVICE ONLY</ObHint>
            </ObFields>
            <ObCta scale={mobileScale} onClick={handleNext} disabled={!canContinueFromName} />
          </div>
        );

      case 2:
        return (
          <div className="relative w-full h-full">
            <ObBack tone="dark" scale={mobileScale} onClick={() => setCurrentStep(1)} />
            <ObHead
              tone="dark"
              scale={mobileScale}
              title={<>WHEN WERE<br />YOU BORN?</>}
              sub="SLOW GARDEN READS A VEDIC CHART."
            />
            <ObFields scale={mobileScale} stack top={330}>
              <div>
                <div style={fieldStyle('dark', mobileScale, birthDate.length > 0)}>
                  <input
                    type="text"
                    placeholder="DD/MM/YYYY"
                    value={birthDate}
                    onChange={(e) => handleDateChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && canContinueFromBirthdate) handleNext();
                      if (e.key === 'Backspace' && birthDate.length > 0) {
                        e.preventDefault();
                        handleDateChange(birthDate.replace(/\D/g, '').slice(0, -1));
                      }
                    }}
                    maxLength={10}
                    style={{ ...obValue(mobileScale), color: BONE }}
                  />
                  <ObTag tone="dark" scale={mobileScale} required />
                </div>
                {dateError && <FieldError message={dateError} variant="dark" />}
              </div>

              <div>
                <div style={fieldStyle('dark', mobileScale, birthTime.length > 0)}>
                  <input
                    type="text"
                    placeholder="HH:MM"
                    value={birthTime}
                    onChange={(e) => handleTimeChange(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Backspace' && birthTime.length > 0) {
                        e.preventDefault();
                        handleTimeChange(birthTime.replace(/\D/g, '').slice(0, -1));
                      }
                    }}
                    maxLength={5}
                    style={{ ...obValue(mobileScale), color: BONE }}
                  />
                  <ObTag tone="dark" scale={mobileScale} required={false} />
                </div>
                {timeError && <FieldError message={timeError} variant="dark" />}
              </div>

              <div>
                <div style={fieldStyle('dark', mobileScale, birthLocation.length > 0)}>
                  <input
                    type="text"
                    placeholder="CITY, COUNTRY"
                    value={birthLocation}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    style={{ ...obValue(mobileScale), color: BONE, textTransform: 'uppercase' }}
                  />
                  <ObTag tone="dark" scale={mobileScale} required={false} />
                </div>
                {locationError && <FieldError message={locationError} variant="dark" />}
                {!locationError && locationChecking && (
                  <ObHint tone="dark" scale={mobileScale}>CHECKING…</ObHint>
                )}
                {!locationError && !locationChecking && locationResolved !== null && (
                  <ObHint tone="dark" scale={mobileScale}>
                    {locationResolved ? `↳ ${locationResolved.toUpperCase()}` : "COULDN'T FIND THAT — TRY ANOTHER SPELLING"}
                  </ObHint>
                )}
              </div>
            </ObFields>
            <ObCta scale={mobileScale} onClick={handleNext} disabled={!canContinueFromBirthdate} />
          </div>
        );

      case 3:
        return (
          <div className="relative w-full h-full">
            <ObBack tone="dark" scale={mobileScale} onClick={() => setCurrentStep(2)} />
            <ObHead
              tone="dark"
              scale={mobileScale}
              tight
              title={<>ENABLE<br />PERMISSIONS</>}
              sub={<>BOTH ARE OPTIONAL, AND BOTH CAN BE<br />TURNED OFF ANY DAY.</>}
            />
            <ObFields scale={mobileScale} top={330}>
              <ObPermission
                tone="dark" scale={mobileScale} label="READ MY CHART"
                on={personalise} onChange={setPersonalise}
              >
                READS YOUR CHART AGAINST TODAY'S SKY, SO THE CARD CAN OPEN OUT INTO WHAT IT MIGHT MEAN FOR YOU.
              </ObPermission>
              <ObPermission
                tone="dark" scale={mobileScale} label="USE MY LOCATION"
                on={useLocation} onChange={handleLocationToggle}
              >
                SETS YOUR SUNRISE, SUNSET AND MOON PHASE FROM WHERE YOU ACTUALLY ARE.
              </ObPermission>
              {locationBlocked && (
                <ObHint tone="dark" scale={mobileScale} onClick={() => handleLocationToggle(true)}>
                  {locationRetried
                    ? 'STILL BLOCKED — ALLOW LOCATION FROM THE LOCK ICON IN YOUR ADDRESS BAR'
                    : 'YOUR BROWSER BLOCKED LOCATION — TAP TO ASK AGAIN'}
                </ObHint>
              )}
            </ObFields>
            <ObCta scale={mobileScale} onClick={handleNext} />
          </div>
        );

      case 4: {
        // The message arrives as "greeting\n\nbody". The design sets the greeting
        // as the title and the rest as body copy, so split on the first blank line.
        const { title: readingTitle, body: readingBody } = readingParts();
        return (
          /*
           * Flex column rather than absolute blocks: the reading is as long as
           * the model makes it, and on a short viewport a fixed 560-tall text
           * block ran straight through the card below it. Now the text takes
           * whatever is left after the card's row is reserved, and scrolls.
           */
          <div
            className="relative w-full h-full flex flex-col"
            style={{ paddingTop: obPx(80, mobileScale), paddingBottom: obPx(34, mobileScale) }}
          >
            {isLoadingWelcome && (
              <div className="absolute inset-0 flex items-center justify-center">
                <AsciiFlower color={LIME} label="reading your chart" />
              </div>
            )}

            {!isLoadingWelcome && (
              <div
                style={{
                  paddingLeft: obPx(24, mobileScale), paddingRight: obPx(24, mobileScale),
                  display: 'flex', flexDirection: 'column',
                  gap: obPx(14, mobileScale),
                  // Fits by shrinking, so it never scrolls and never clips.
                  flex: '1 1 auto', minHeight: 0, overflow: 'hidden',
                }}
                ref={messageRef}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-vt323), monospace',
                    fontSize: obPx(readingPx * 1.5, mobileScale),
                    lineHeight: 1, color: LIME, textShadow: '0 2px 16px rgba(0,0,0,.5)',
                    textTransform: 'uppercase',
                  }}
                >
                  {readingTitle}
                </div>
                {readingBody && (
                  <div
                    /* The pixel face here too, as on desktop — the reading is
                       one voice and was arriving in two. Set smaller than the
                       title so the hierarchy survives, and the block above it
                       scrolls rather than growing, so a long reading can never
                       reach the card below. */
                    style={{
                      fontFamily: 'var(--font-vt323), monospace',
                      fontSize: obPx(readingPx, mobileScale), letterSpacing: '0.01em',
                      lineHeight: 1.2, color: BONE, textTransform: 'uppercase',
                      textShadow: '0 2px 16px rgba(0,0,0,.5)',
                      whiteSpace: 'pre-line',
                    }}
                  >
                    {readingBody}
                  </div>
                )}
              </div>
            )}

            <div
              style={{
                paddingLeft: obPx(24, mobileScale), paddingRight: obPx(24, mobileScale),
                marginTop: obPx(20, mobileScale),
                flexShrink: 0, display: 'flex', alignItems: 'flex-end',
                gap: obPx(16, mobileScale),
                visibility: isTypingComplete && !isDragging ? 'visible' : 'hidden',
              }}
            >
              <img
                src="/card-back-swirl.png"
                alt="Card back"
                className="select-none"
                style={{
                  width: obPx(140, mobileScale), height: obPx(210, mobileScale),
                  objectFit: 'cover', cursor: 'grab',
                  userSelect: 'none', WebkitUserSelect: 'none', touchAction: 'none',
                }}
                onMouseDown={handleMouseDown}
                onTouchStart={handleTouchStart}
                draggable="false"
              />
              <span
                style={{
                  fontFamily: 'var(--font-vt323), monospace', fontSize: obPx(24, mobileScale),
                  color: LIME, paddingBottom: obPx(8, mobileScale),
                }}
              >
                ← DRAG ME
              </span>
            </div>
          </div>
        );
      }


      default:
        return null;
    }
  };

  // ── Loading screen ────────────────────────────────────────────────────────
  if (showLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center" style={{ backgroundColor: '#172211' }}>
        <div className="flex flex-col items-center gap-6">
          <AsciiFlower color={LIME} label="preparing your reading" />
          {/* The pixel face, small: this line belongs to the machine doing the
              work, not to the interface asking for something. */}
          <p
            className="text-[#C9F24E]"
            style={{
              fontFamily: 'var(--font-vt323), monospace',
              fontSize: 'clamp(14px, 3.2vw, 18px)',
              letterSpacing: '0.12em',
            }}
          >
            preparing your reading...
          </p>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────────
  return (
    <div
      className="relative min-h-screen w-full overflow-hidden"
      style={{
        // dvh, not vh: on a phone with its browser toolbars showing, 100vh is taller than what is visible, so
        // anything centred in it sits too low. min-h-screen stays as the fallback for browsers without dvh.
        minHeight: '100dvh',
        opacity: shouldCrumble ? 0 : 1,
        filter: shouldCrumble ? 'blur(20px)' : 'none',
        transition: shouldCrumble ? 'opacity 1s ease-out, filter 1s ease-out' : 'none',
      }}
    >
      {/* Background video */}
      <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover">
        <source src="/onboarding-bg.mp4" type="video/mp4" />
      </video>

      {/* Dark overlay so text is readable over video */}
      <div className="absolute inset-0 bg-[#172211]/60" />

      {/* ── MOBILE layout — full screen, no device frame ── */}
      <div
        className={`md:hidden relative z-10 flex flex-col
        ${currentStep === 0 ? '' : isDesignStep ? '' : 'px-5'}
        ${currentStep === 4 ? 'overflow-hidden' : currentStep === 0 || isDesignStep ? '' : 'py-8'}`}
        /* held at the pre-keyboard height for the same reason the scale is —
           100dvh collapses under the keyboard and drags the layout up with it */
        style={{ height: baseHeight ? `${baseHeight}px` : '100dvh' }}
      >
        {isDesignStep ? (
          /*
           * Steps 1-3 are drawn on a 356x748 canvas. The HEIGHT is held to that
           * aspect — the top-anchored fields and the bottom-anchored CTA drift
           * into each other otherwise — but the width fills the screen. Pinning
           * the width to 356 * scale too left a dead margin down both sides on
           * any phone wider than the scaled canvas; the fields inset themselves
           * by their own 24 design-px padding, which is the only gutter wanted.
           */
          <div className="flex-1 flex items-center justify-center w-full">
            <div
              className="relative w-full"
              style={{ height: 748 * mobileScale }}
            >
              {renderStepContent()}
            </div>
          </div>
        ) : (
          /* min-h-0 so the reading's scroll area can actually shrink — without it
             a flex item refuses to go below its content height and the card row
             below it is pushed off the bottom of a short screen */
          <div className="flex-1 min-h-0 flex flex-col w-full">
            {renderStepContent()}
          </div>
        )}
      </div>

      {/* ── DESKTOP layout — device frame, proportionally scaled to fit viewport ── */}
      <div className="hidden md:flex relative z-10 items-center justify-center min-h-screen" style={{ minHeight: '100dvh' }}>
        {/*
          Outer sizing box: gives the flex container real dimensions (scaled) so
          centering works correctly without relying on the absolutely-positioned children.
          translateX compensates for the screen being off-center within the 801px frame
          artwork (the frame's screen cutout sits left of canvas-center to make room for
          the fanned deck) — without it, flex centers the artwork but the readable
          header/fields inside the screen end up left-of-viewport-center. Using a transform
          (not margin) so the shift is exact — margin gets half-absorbed by flex centering.
        */}
        <div style={{ position: 'relative', width: `${801 * deviceScale}px`, height: `${1000 * deviceScale}px`, transform: `translateX(${67.935 * deviceScale}px)` }}>
          {/*
            Inner natural-size container scaled via transform.
            Both the device frame image and the content area live here at their natural
            pixel sizes, so they always stay in exact proportion regardless of viewport.
          */}
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              width: '801px',
              height: '1000px',
              transformOrigin: 'top left',
              transform: `scale(${deviceScale})`,
            }}
          >
            {/* Device frame with deck fan */}
            <img
              src="/device-frame-deck-swirl.png"
              alt=""
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '801px',
                height: '1000px',
                objectFit: 'contain',
                pointerEvents: 'none',
                zIndex: 0,
              }}
            />

            {/* Blue screen content area — positioned to sit exactly inside the device frame image */}
            <div
              className="overflow-hidden absolute z-20"
              style={{
                width: '647px',
                height: '909px',
                left: '50%',
                top: '50%',
                transform: 'translate(-60.5%, -50%)',
                background: '#F7F4E6',
              }}
            >
              {/* Card-back pattern, softened — shown on all onboarding steps */}
              <img
                src="/card-back-swirl.png"
                alt=""
                aria-hidden="true"
                style={{
                  position: 'absolute',
                  inset: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  opacity: 0.1,
                  pointerEvents: 'none',
                  zIndex: 0,
                }}
              />
              {/* Desktop content uses original dark-on-light styling */}
              <div className={`h-full overflow-y-auto ${currentStep === 0 || isDesignStep ? '' : 'px-12'}`} style={{ color: '#172211', position: 'relative', zIndex: 1 }}>

                {/* Step 0 — welcome / logo */}
                {currentStep === 0 && (
                  <div className="flex flex-col h-full" style={{ position: 'relative' }}>
                    {/* Content — flex column; font metrics from Figma ×1.1234 scale, spiral mobile-proportioned */}
                    <div style={{ position: 'absolute', inset: 0, zIndex: 1 }}>
                      {/* Logo group: full width, overflow visible so text bleeds edges.
                          Centred in the space above the CTA — the button's band
                          (62 tall, 34 from the bottom) is excluded, not divided. */}
                      <div style={{
                        position: 'absolute',
                        top: `${((909 - 96 * DESKTOP_SCALE) - 435) / 2}px`,
                        left: 0,
                        right: 0,
                        height: '435px',
                        overflow: 'visible',
                      }}>
                        {/* Wordmark — 5a, typed out, navy with a lime shadow on the light window */}
                        <Wordmark
                          animated="/slow-garden-wordmark-navy.gif"
                          still="/slow-garden-wordmark-navy-still.png"
                          alt="slow garden"
                          style={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '92%',
                          }}
                        />
                      </div>
                      {/* Continue — the same CTA the rest of the onboarding uses */}
                      <ObCta scale={DESKTOP_SCALE} onClick={handleNext} />
                    </div>
                  </div>
                )}

                {/* Steps 1-3 — the design canvas, centred in the panel */}
                {isDesignStep && (
                  <div className="h-full w-full flex items-center justify-center">
                    <div
                      className="relative w-full"
                      style={{ height: 748 * DESKTOP_SCALE }}
                    >
                      {currentStep === 1 && (
                        <>
                          <ObBack tone="light" scale={DESKTOP_SCALE} onClick={() => setCurrentStep(0)} />
                          <ObHead
                            tone="light"
                            scale={DESKTOP_SCALE}
                            title={<>WHAT&apos;S<br />YOUR NAME?</>}
                            sub="FIRST NAME IS FINE"
                          />
                          <ObFields scale={DESKTOP_SCALE} top={330}>
                            <div style={fieldStyle('light', DESKTOP_SCALE, true, true)}>
                              <span style={{ fontFamily: 'var(--font-vt323), monospace', fontSize: obPx(24, DESKTOP_SCALE), color: COBALT }}>&gt;</span>
                              <input
                                type="text"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter' && canContinueFromName) handleNext(); }}
                                placeholder="YOUR NAME"
                                autoFocus
                                style={{ ...obValue(DESKTOP_SCALE, true), color: INK, textTransform: 'uppercase' }}
                              />
                            </div>
                            <ObHint tone="light" scale={DESKTOP_SCALE}>STORED ON YOUR DEVICE ONLY</ObHint>
                          </ObFields>
                          <ObCta scale={DESKTOP_SCALE} onClick={handleNext} disabled={!canContinueFromName} />
                        </>
                      )}

                      {currentStep === 2 && (
                        <>
                          <ObBack tone="light" scale={DESKTOP_SCALE} onClick={() => setCurrentStep(1)} />
                          <ObHead
                            tone="light"
                            scale={DESKTOP_SCALE}
                            title={<>WHEN WERE<br />YOU BORN?</>}
                            sub="SLOW GARDEN READS A VEDIC CHART."
                          />
                          <ObFields scale={DESKTOP_SCALE} stack top={330}>
                            <div>
                              <div style={fieldStyle('light', DESKTOP_SCALE, birthDate.length > 0)}>
                                <input
                                  type="text"
                                  placeholder="DD/MM/YYYY"
                                  value={birthDate}
                                  onChange={(e) => handleDateChange(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Enter' && canContinueFromBirthdate) handleNext();
                                    if (e.key === 'Backspace' && birthDate.length > 0) {
                                      e.preventDefault();
                                      handleDateChange(birthDate.replace(/\D/g, '').slice(0, -1));
                                    }
                                  }}
                                  maxLength={10}
                                  style={{ ...obValue(DESKTOP_SCALE), color: INK }}
                                />
                                <ObTag tone="light" scale={DESKTOP_SCALE} required />
                              </div>
                              {dateError && <FieldError message={dateError} variant="light" />}
                            </div>

                            <div>
                              <div style={fieldStyle('light', DESKTOP_SCALE, birthTime.length > 0)}>
                                <input
                                  type="text"
                                  placeholder="HH:MM"
                                  value={birthTime}
                                  onChange={(e) => handleTimeChange(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === 'Backspace' && birthTime.length > 0) {
                                      e.preventDefault();
                                      handleTimeChange(birthTime.replace(/\D/g, '').slice(0, -1));
                                    }
                                  }}
                                  maxLength={5}
                                  style={{ ...obValue(DESKTOP_SCALE), color: INK }}
                                />
                                <ObTag tone="light" scale={DESKTOP_SCALE} required={false} />
                              </div>
                              {timeError && <FieldError message={timeError} variant="light" />}
                            </div>

                            <div>
                              <div style={fieldStyle('light', DESKTOP_SCALE, birthLocation.length > 0)}>
                                <input
                                  type="text"
                                  placeholder="CITY, COUNTRY"
                                  value={birthLocation}
                                  onChange={(e) => handleLocationChange(e.target.value)}
                                  style={{ ...obValue(DESKTOP_SCALE), color: INK, textTransform: 'uppercase' }}
                                />
                                <ObTag tone="light" scale={DESKTOP_SCALE} required={false} />
                              </div>
                              {locationError && <FieldError message={locationError} variant="light" />}
                              {!locationError && locationChecking && (
                                <ObHint tone="light" scale={DESKTOP_SCALE}>CHECKING…</ObHint>
                              )}
                              {!locationError && !locationChecking && locationResolved !== null && (
                                <ObHint tone="light" scale={DESKTOP_SCALE}>
                                  {locationResolved ? `↳ ${locationResolved.toUpperCase()}` : "COULDN'T FIND THAT — TRY ANOTHER SPELLING"}
                                </ObHint>
                              )}
                            </div>
                          </ObFields>
                          <ObCta scale={DESKTOP_SCALE} onClick={handleNext} disabled={!canContinueFromBirthdate} />
                        </>
                      )}

                      {currentStep === 4 && (() => {
                        const { title: rTitle, body: rBody } = readingParts();
                        return (
                          <>
                            {isLoadingWelcome && (
                              <div className="absolute inset-0 flex items-center justify-center">
                                <AsciiFlower color={COBALT} weight={500} label="reading your chart" />
                              </div>
                            )}

                            {!isLoadingWelcome && (
                              <div
                                style={{
                                  position: 'absolute', left: obPx(24, DESKTOP_SCALE), right: obPx(24, DESKTOP_SCALE),
                                  top: obPx(80, DESKTOP_SCALE), display: 'flex', flexDirection: 'column',
                                  gap: obPx(14, DESKTOP_SCALE),
                                  maxHeight: obPx(500, DESKTOP_SCALE), overflowY: 'auto',
                                }}
                              >
                                <div style={{
                                  fontFamily: 'var(--font-vt323), monospace', fontSize: obPx(WELCOME_PX, DESKTOP_SCALE),
                                  lineHeight: 1.15, color: COBALT, textTransform: 'uppercase',
                                }}>
                                  {rTitle}
                                </div>
                                {rBody && (
                                  <div style={{
                                    fontFamily: 'var(--font-vt323), monospace',
                                    fontSize: obPx(WELCOME_PX, DESKTOP_SCALE),
                                    lineHeight: 1.15, color: COBALT, textTransform: 'uppercase',
                                    whiteSpace: 'pre-line',
                                  }}>
                                    {rBody}
                                  </div>
                                )}
                              </div>
                            )}

                            <div
                              style={{
                                position: 'absolute', left: obPx(24, DESKTOP_SCALE), right: obPx(24, DESKTOP_SCALE),
                                bottom: obPx(34, DESKTOP_SCALE), display: 'flex', alignItems: 'flex-end',
                                gap: obPx(16, DESKTOP_SCALE),
                                visibility: isTypingComplete && !isDragging ? 'visible' : 'hidden',
                              }}
                            >
                              <img
                                src="/card-back-swirl.png"
                                alt="Card back"
                                className="select-none"
                                style={{
                                  width: obPx(140, DESKTOP_SCALE), height: obPx(210, DESKTOP_SCALE),
                                  objectFit: 'cover', cursor: 'grab',
                                  userSelect: 'none', WebkitUserSelect: 'none',
                                }}
                                onMouseDown={handleMouseDown}
                                draggable="false"
                              />
                              <span style={{
                                fontFamily: 'var(--font-vt323), monospace', fontSize: obPx(24, DESKTOP_SCALE),
                                color: COBALT, paddingBottom: obPx(8, DESKTOP_SCALE),
                              }}>
                                ← DRAG ME
                              </span>
                            </div>
                          </>
                        );
                      })()}

                      {currentStep === 3 && (
                        <>
                          <ObBack tone="light" scale={DESKTOP_SCALE} onClick={() => setCurrentStep(2)} />
                          <ObHead
                            tone="light"
                            scale={DESKTOP_SCALE}
                            tight
                            title={<>ENABLE<br />PERMISSIONS</>}
                            sub={<>BOTH ARE OPTIONAL, AND BOTH CAN BE<br />TURNED OFF ANY DAY.</>}
                          />
                          <ObFields scale={DESKTOP_SCALE} top={330}>
                            <ObPermission
                              tone="light" scale={DESKTOP_SCALE} label="READ MY CHART"
                              on={personalise} onChange={setPersonalise}
                            >
                              READS YOUR CHART AGAINST TODAY'S SKY, SO THE CARD CAN OPEN OUT INTO WHAT IT MIGHT MEAN FOR YOU.
                            </ObPermission>
                            <ObPermission
                              tone="light" scale={DESKTOP_SCALE} label="USE MY LOCATION"
                              on={useLocation} onChange={handleLocationToggle}
                            >
                              SETS YOUR SUNRISE, SUNSET AND MOON PHASE FROM WHERE YOU ACTUALLY ARE.
                            </ObPermission>
                            {locationBlocked && (
                              <ObHint tone="light" scale={DESKTOP_SCALE} onClick={() => handleLocationToggle(true)}>
                                {locationRetried
                                  ? 'STILL BLOCKED — ALLOW LOCATION FROM THE LOCK ICON IN YOUR ADDRESS BAR'
                                  : 'YOUR BROWSER BLOCKED LOCATION — CLICK TO ASK AGAIN'}
                              </ObHint>
                            )}
                          </ObFields>
                          <ObCta scale={DESKTOP_SCALE} onClick={handleNext} />
                        </>
                      )}
                    </div>
                  </div>
                )}


              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cascaded cards trail */}
      {cascadedCards.map((card, index) => {
        const { w: cw, h: ch } = dragSize ?? (isMobile ? { w: 110, h: 165 } : { w: 140, h: 210 });
        return (
          <img key={card.id} src="/card-back-swirl.png" alt="" className="rounded-2xl select-none"
            draggable="false"
            style={{
              position: 'fixed', left: card.x - cw / 2, top: card.y - ch / 2,
              width: `${cw}px`, height: `${ch}px`, objectFit: 'cover',
              transform: `rotate(${card.rotation}deg)`,
              animation: shouldCrumble ? 'sandDissolve 1.2s ease-out forwards' : 'none',
              pointerEvents: 'none', zIndex: 9000 + index,
              userSelect: 'none', WebkitUserSelect: 'none',
            }}
          />
        );
      })}

      {/* Active dragging card */}
      {isDragging && (() => {
        const { w: cw, h: ch } = dragSize ?? (isMobile ? { w: 110, h: 165 } : { w: 140, h: 210 });
        return (
          <img ref={dragCardRef} src="/card-back-swirl.png" alt="Dragging card" className="rounded-2xl shadow-2xl select-none"
            draggable="false"
            style={{
              position: 'fixed', left: 0, top: 0,
              width: `${cw}px`, height: `${ch}px`, objectFit: 'cover',
              cursor: 'grabbing', zIndex: 10000, pointerEvents: 'none',
              userSelect: 'none', WebkitUserSelect: 'none',
              willChange: 'transform',
            }}
          />
        );
      })()}
    </div>
  );
}
