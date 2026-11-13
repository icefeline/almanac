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
import AlmanacSplash from './AlmanacSplash';
import SkyBackground from './SkyBackground';
import {
  ObBack, ObHead, ObFields, ObTag, ObHint, ObToggle, ObPermission, ObCta,
  fieldStyle, obValue, obPx, LIME, BONE, bodyOf,
  COBALT, INK,
} from './onboarding-ui';
import type { Tone } from './onboarding-ui';
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
  // the sky sets data-night on the page once the sun is down; the step screens follow it
  const [night, setNight] = useState(false);
  useEffect(() => {
    const el = document.documentElement;
    const read = () => setNight(el.hasAttribute('data-night'));
    read();
    const mo = new MutationObserver(read);
    mo.observe(el, { attributes: true, attributeFilter: ['data-night'] });
    return () => mo.disconnect();
  }, []);

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
      setMobileScale(Math.min(w / 356, h / 748, w >= 768 ? 1.3 : Infinity));
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
        setDateError('that date isn’t quite right. try dd/mm/yyyy.');
      } else if (date > today) {
        setDateError('that date hasn’t happened yet. check the year?');
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
      if (hours > 23 || minutes > 59) { setTimeError('that time isn’t quite right. use 24-hour time, like 14:30.'); }
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
      if (parts[1] && parts[1].length > 0 && parts[1].length < 2) { setLocationError('try a city and a country.'); return; }
      if (parts[0].length < 2) { setLocationError('try a city and a country.'); return; }
      setLocationError('');
    } else {
      if (value.trim().length < 2) { setLocationError('try a city and a country.'); return; }
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
    aries: "you tend to start before you're sure. the sureness usually turns up on the way, and sometimes a day late.",
    taurus: "you're the one who stays put when things get loud. it looks like calm from the outside, and takes more holding than anyone sees.",
    gemini: "your mind runs two or three threads at once, and your feelings follow the quieter one. people mostly hear the quick one.",
    cancer: "you remember how a room felt long after you've left it. what you carry for other people is rarely on any list.",
    leo: "you light up a room easily. what's harder is being looked at on the days you'd rather be soft and unlit.",
    virgo: "you notice the loose thread before anyone else does, and then you notice yourself noticing it. both are tiring.",
    libra: "you smooth things over so well that nobody asks what it costs. you'd probably like to be asked.",
    scorpio: "you usually know what's going on before anyone says it. what you do with the knowing is slower, and private.",
    sagittarius: "you keep one eye on the next place. staying put can feel like a small emergency, even when nothing's wrong.",
    capricorn: "you carry a lot and make it look like nothing. the weight is real, even on days nobody checks.",
    aquarius: "you watch from a step back and see more because of it. the distance is part of how you care.",
    pisces: "you pick up the mood in a room before you've decided to. it can be hard to tell whose feeling you're holding.",
  };

  // Short mobile-only insights (1 sentence each)
  const moonInsights: { [key: string]: string } = {
    aries: "feelings go quickly for you, like weather you walk straight through. sitting still with one is the unfamiliar part.",
    taurus: "your inner life wants steadiness. a sudden change can rattle it for days, even when you're calm about it out loud.",
    gemini: "you find out what you feel by saying it. a long silence around something big can leave you guessing.",
    cancer: "some of what you feel is older than you are. it can trace back to a kitchen you stood in as a child.",
    leo: "you'd like to be seen when you're soft, and not only when you're doing well.",
    virgo: "you sort feelings the way you'd sort a problem. a few won't go into any pile.",
    libra: "you feel things through the people near you, sometimes until you can't say which feelings began with you.",
    scorpio: "it's usually all or nothing in here. the middle is a place you rarely get to rest.",
    sagittarius: "your feelings need room around them. close attention can start to feel like a fence.",
    capricorn: "you keep what's tender contained. letting it out can feel like dropping something you were told to hold.",
    aquarius: "you need a little distance to tell what you feel. when a feeling arrives without any, it's a lot.",
    pisces: "you take on the mood around you and only later wonder whose it was.",
  };

  const risingInsights: { [key: string]: string } = {
    aries: "you walk in direct and a little braced, and people often read that as fearlessness.",
    taurus: "people feel at ease near you, usually before you've found your own footing.",
    gemini: "you shift a little to match whoever you're with, and later wonder which version was yours.",
    cancer: "you lead with softness, even on days you're guarding something.",
    leo: "you take up room without trying, even on the days you're making yourself smaller.",
    virgo: "you arrive looking put together. nobody sees the overthinking that got you there.",
    libra: "you make people comfortable, and sometimes leave yourself out of the room.",
    scorpio: "your intensity arrives a beat before you do. small talk takes real effort.",
    sagittarius: "you come across open and light, and a little hard to pin down.",
    capricorn: "you look composed. the pressure stays on the inside, where nobody can see it.",
    aquarius: "you stand slightly outside the frame. some people get it right away, and some never will.",
    pisces: "you soak up a room without meaning to, and it costs you more than it shows.",
  };

  const numerologyInsights: { [key: number]: string } = {
    1: "you end up leading, even when it's lonely up there.",
    2: "you build bridges between people, and now and then lose your own voice on the way across.",
    3: "you seem made for expression, and it sours when you keep it in.",
    4: "you build things to last. being the steady one gets tiring.",
    5: "freedom matters a great deal to you. the harder work is committing without disappearing into it.",
    6: "you're made to care for people. you may be learning that martyrdom isn't love.",
    7: "you go deep, and surface chatter sets your teeth on edge.",
    8: "legacy is the theme. real strength and control turn out to be different things.",
    9: "you're always finishing something, letting go even when it hurts.",
    11: "you pick up frequencies other people miss. the sensitivity overwhelms you until you find a use for it.",
    22: "the vision is clear. bringing it down to earth takes everything you have.",
    33: "people feel something healing in you before you've said a word, and the weight of that grows.",
  };

  const getWelcomeMessage = (): string => {
    if (!birthDate) return '';
    const sunSign = getSunSign(birthDate);
    const hasBirthTime = birthTime && !noKnowBirthTime;
    const hasLocation = birthLocation && birthLocation.trim().length >= 2;
    if (hasBirthTime && hasLocation) {
      const moonSign = getMoonSign(birthDate, birthTime);
      const risingSign = getRisingSign(birthDate, birthTime);
      return `${name},\n\n${sunInsights[sunSign]}\n\n${moonInsights[moonSign]}\n\n${risingInsights[risingSign]}\n\nthat's the whole chart. pull a card whenever you like.`;
    }
    if (hasBirthTime) {
      const moonSign = getMoonSign(birthDate, birthTime);
      return `${name},\n\n${sunInsights[sunSign]}\n\n${moonInsights[moonSign]}\n\nthat's what the chart shows so far. pull a card when you feel like it.`;
    }
    if (hasLocation) {
      return `${name},\n\n${sunInsights[sunSign]}\n\nthat's what the chart shows so far. pull a card when you feel like it.`;
    }
    const lifePathNumber = getLifePathNumber(birthDate);
    return `${name},\n\n${sunInsights[sunSign]}\n\n${numerologyInsights[lifePathNumber]}\n\nthat's a first sketch of you. pull a card when you're ready.`;
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
    // the step screens sit straight on the live sky: cobalt and ink by day, lime and bone at night
    const T: Tone = night ? 'dark' : 'light';
    const ACC = night ? LIME : COBALT;
    switch (currentStep) {
      case 0:
        return (
          <div
            className="relative flex flex-col flex-1"
            /* reserve the CTA's band (62 tall, 34 from the bottom) so the auto
               margins below centre the wordmark in the space above the button */
            style={{ paddingBottom: `${96 * mobileScale}px` }}
          >
            {/* The splash: "almanac" in pixels, orbit rings and sparkles over the live sky. */}
            <AlmanacSplash tone="sky" />

            {/* Sits above the CTA rather than over the wordmark: the reader
                should meet the name first, and the notice only matters at the
                moment they are about to commit details to this browser. */}
            <InAppBrowserNotice scale={mobileScale} />

            {/* Continue — the same CTA the rest of the onboarding uses */}
            <ObCta raise={64} tone={night ? 'dark' : 'light'} scale={mobileScale} onClick={handleNext} />
          </div>
        );

      case 1:
        return (
          <div className="relative w-full h-full">
            <ObBack tone={T} scale={mobileScale} onClick={() => setCurrentStep(0)} />
            <ObHead
              tone={T}
              scale={mobileScale}
              title={<>WHAT&apos;S<br />YOUR NAME?</>}
              eyebrow="▸ HELLO"
              sub="FIRST NAME ONLY, IF YOU LIKE."
            />
            {/* Sits under the heading, at the permissions step's height, so the
                field is still in full view once the keyboard is up — rather
                than at the canvas's midpoint where the keyboard covers it. */}
            <ObFields scale={mobileScale} top={330}>
              <div style={fieldStyle(T, mobileScale, true, true)}>
                <span style={{ fontFamily: 'var(--font-vt323), monospace', fontSize: obPx(24, mobileScale), color: ACC }}>&gt;</span>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && canContinueFromName) handleNext(); }}
                  placeholder="YOUR NAME"
                  autoFocus
                  style={{ ...obValue(mobileScale, true), color: bodyOf(T), textTransform: 'uppercase' }}
                />
              </div>
              <ObHint tone={T} scale={mobileScale}>SAVED ON THIS DEVICE. THERE IS NO ACCOUNT.</ObHint>
              <ObCta inline tone={night ? 'dark' : 'light'} scale={mobileScale} onClick={handleNext} disabled={!canContinueFromName} />
            </ObFields>
          </div>
        );

      case 2:
        return (
          <div className="relative w-full h-full">
            <ObBack tone={T} scale={mobileScale} onClick={() => setCurrentStep(1)} />
            <ObHead
              tone={T}
              scale={mobileScale}
              title={<>WHEN WERE<br />YOU BORN?</>}
              eyebrow="▸ YOUR STARS"
              sub="ONLY THE DATE IS NEEDED. TIME AND PLACE MAKE YOUR CHART MORE EXACT."
            />
            <ObFields scale={mobileScale} stack top={330}>
              <div>
                <div style={fieldStyle(T, mobileScale, birthDate.length > 0)}>
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
                    style={{ ...obValue(mobileScale), color: bodyOf(T) }}
                  />
                  <ObTag tone={T} scale={mobileScale} required />
                </div>
                {dateError && <FieldError message={dateError} variant={T} />}
              </div>

              <div>
                <div style={fieldStyle(T, mobileScale, birthTime.length > 0)}>
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
                    style={{ ...obValue(mobileScale), color: bodyOf(T) }}
                  />
                  <ObTag tone={T} scale={mobileScale} required={false} />
                </div>
                {timeError && <FieldError message={timeError} variant={T} />}
              </div>

              <div>
                <div style={fieldStyle(T, mobileScale, birthLocation.length > 0)}>
                  <input
                    type="text"
                    placeholder="CITY, COUNTRY"
                    value={birthLocation}
                    onChange={(e) => handleLocationChange(e.target.value)}
                    style={{ ...obValue(mobileScale), color: bodyOf(T), textTransform: 'uppercase' }}
                  />
                  <ObTag tone={T} scale={mobileScale} required={false} />
                </div>
                {locationError && <FieldError message={locationError} variant={T} />}
                {!locationError && locationChecking && (
                  <ObHint tone={T} scale={mobileScale}>LOOKING FOR THAT PLACE…</ObHint>
                )}
                {!locationError && !locationChecking && locationResolved !== null && (
                  <ObHint tone={T} scale={mobileScale}>
                    {locationResolved ? `↳ ${locationResolved.toUpperCase()}` : "NO MATCH FOR THAT. TRY A CITY AND COUNTRY, LIKE LISBON, PORTUGAL."}
                  </ObHint>
                )}
              </div>
              <ObCta inline tone={night ? 'dark' : 'light'} scale={mobileScale} onClick={handleNext} disabled={!canContinueFromBirthdate} />
            </ObFields>
          </div>
        );

      case 3:
        return (
          <div className="relative w-full h-full">
            <ObBack tone={T} scale={mobileScale} onClick={() => setCurrentStep(2)} />
            <ObHead
              tone={T}
              scale={mobileScale}
              tight
              eyebrow="▸ LAST ONE"
              title={<>TWO SMALL<br />CHOICES</>}
              sub={<>BOTH ARE OPTIONAL. SAY NO TO EITHER<br />AND THE APP STILL WORKS.</>}
            />
            <ObFields scale={mobileScale} top={330}>
              <ObPermission
                tone={T} scale={mobileScale} label="PERSONAL READINGS"
                on={personalise} onChange={setPersonalise}
              >
                SENDS YOUR BIRTH DETAILS TO CLAUDE SO EACH READING IS ABOUT YOU. OFF, AND YOU GET THE CARD'S GENERAL MEANING.
              </ObPermission>
              <ObPermission
                tone={T} scale={mobileScale} label="WHERE YOU ARE"
                on={useLocation} onChange={handleLocationToggle}
              >
                USES YOUR LOCATION FOR YOUR SUNRISE, SUNSET AND MOON PHASE. WITHOUT IT, THOSE ARE GENERIC.
              </ObPermission>
              {locationBlocked && (
                <ObHint tone={T} scale={mobileScale} onClick={() => handleLocationToggle(true)}>
                  {locationRetried
                    ? 'STILL NOT ALLOWED. YOU CAN SWITCH IT ON FROM THE LOCK ICON IN YOUR ADDRESS BAR.'
                    : 'YOUR BROWSER SAID NO TO LOCATION. TAP TO ASK AGAIN.'}
                </ObHint>
              )}
              <ObCta inline tone={night ? 'dark' : 'light'} scale={mobileScale} onClick={handleNext} />
            </ObFields>
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
                <AsciiFlower color={ACC} label="reading your chart" />
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
                    lineHeight: 1, color: ACC, textShadow: night ? '0 2px 16px rgba(0,0,0,.5)' : undefined,
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
                      lineHeight: 1.2, color: bodyOf(T), textTransform: 'uppercase',
                      textShadow: night ? '0 2px 16px rgba(0,0,0,.5)' : undefined,
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
                  color: ACC, paddingBottom: obPx(8, mobileScale),
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
      data-onboarding=""
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
      {/* Real-time dithered sky, same as the main app. Brings its own scrim. */}
      <SkyBackground />

      {/* ── MOBILE layout — full screen, no device frame ── */}
      <div
        className={`${currentStep === 0 ? 'md:hidden' : ''} relative z-10 flex flex-col
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
              style={{ height: 748 * mobileScale, maxWidth: isMobile ? undefined : 356 * mobileScale }}
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
      {/* ── DESKTOP splash — no window: the poster sits straight on the live sky ── */}
      {currentStep === 0 && (
        <div className="hidden md:block fixed inset-0 z-10">
          <AlmanacSplash tone="sky" />
          <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 'min(100%, 560px)', transform: 'translateX(-50%)' }}>
            <ObCta raise={80} tone={night ? 'dark' : 'light'} scale={DESKTOP_SCALE} onClick={handleNext} />
          </div>
        </div>
      )}


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
