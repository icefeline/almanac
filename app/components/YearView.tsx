'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import PastCardReading from './PastCardReading';
import CardWindow, { rectForCell, WindowRect } from './CardWindow';
import { skyForDraw, type Sky } from '@/lib/data/skies';
import { TarotCard as TarotCardType } from '@/lib/types/tarot';
import { tarotDeck } from '@/lib/data/tarot-deck';
import { LABEL_TYPE } from './type';

interface JournalEntry {
  date: string;
  cardId: string;
  hasJournal: boolean;
  isReversed?: boolean;
}

interface YearViewProps {
  year: number;
  journalEntries: JournalEntry[];
  onDateClick: (date: string) => void;
  onNavigateToToday: () => void;
  currentDate: string;
}

const WEEKDAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

// CSS mask layers that punch perforation holes along all 4 edges of the stamp body.
// Each gradient is opaque (black) at hole positions, transparent elsewhere.
// `subtract` composite removes the opaque circles from the accumulated base rectangle.
const STAMP_MASK = [
  `radial-gradient(circle at 50% 0,    black 2.5px, transparent 2.5px) top  left / 5px 5px repeat-x`,
  `radial-gradient(circle at 50% 100%, black 2.5px, transparent 2.5px) bottom left / 5px 5px repeat-x`,
  `radial-gradient(circle at 0%  50%,  black 2.5px, transparent 2.5px) top  left / 5px 5px repeat-y`,
  `radial-gradient(circle at 100% 50%, black 2.5px, transparent 2.5px) top right / 5px 5px repeat-y`,
  `linear-gradient(black, black)`,
].join(', ');

const MONTH_NAMES = [
  'january', 'february', 'march', 'april', 'may', 'june',
  'july', 'august', 'september', 'october', 'november', 'december'
];

interface CalendarDay {
  date: string;
  day: number;
  isCurrentMonth: boolean;
}

function buildCalendarDays(year: number, monthIndex: number): CalendarDay[] {
  const firstDay = new Date(year, monthIndex, 1);
  const daysInMonth = new Date(year, monthIndex + 1, 0).getDate();

  // Monday-first: JS getDay() returns 0=Sun, so (0+6)%7=6, (1+6)%7=0=Mon, etc.
  const startOffset = (firstDay.getDay() + 6) % 7;

  const days: CalendarDay[] = [];

  // Previous month overflow
  const prevMonthLastDay = new Date(year, monthIndex, 0).getDate();
  const prevMonth = monthIndex === 0 ? 11 : monthIndex - 1;
  const prevYear = monthIndex === 0 ? year - 1 : year;
  for (let i = startOffset - 1; i >= 0; i--) {
    const day = prevMonthLastDay - i;
    const date = `${prevYear}-${String(prevMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    days.push({ date, day, isCurrentMonth: false });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const date = `${year}-${String(monthIndex + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date, day: d, isCurrentMonth: true });
  }

  // Next month overflow to complete the last row
  const nextMonth = monthIndex === 11 ? 0 : monthIndex + 1;
  const nextYear = monthIndex === 11 ? year + 1 : year;
  const remaining = (7 - (days.length % 7)) % 7;
  for (let d = 1; d <= remaining; d++) {
    const date = `${nextYear}-${String(nextMonth + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    days.push({ date, day: d, isCurrentMonth: false });
  }

  return days;
}

function getCardFilename(cardId: string, cardName: string): string {
  if (cardId.startsWith('major-')) {
    const namePart = cardName.toLowerCase().replace(/\s+/g, '-').replace(/^the-/, '');
    return `${cardId}-${namePart}`;
  }
  return cardId;
}

// Hand-drawn vertical line for desktop
const VerticalLine = ({ isToday }: { isToday?: boolean }) => {
  const wobble = useMemo(() => {
    const points = [];
    for (let i = 0; i <= 10; i++) {
      const y = 2 + i * 2;
      const x = 2 + (Math.random() - 0.5) * 0.8;
      points.push(`${x},${y}`);
    }
    return points.join(' ');
  }, []);

  return (
    <svg viewBox="0 0 4 24" className="w-full h-full">
      <polyline
        points={wobble}
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
        className="text-[#C9F24E]"
        opacity={isToday ? '0.6' : '0.2'}
      />
    </svg>
  );
};

// Desktop mini tarot card
const MiniTarotCard = ({ cardId, cardName, isToday }: { cardId: string; cardName: string; isToday?: boolean }) => (
  <div className={`w-full h-full rounded overflow-hidden ${isToday ? 'ring-2 ring-[#C9F24E] shadow-lg' : 'shadow-sm'}`}>
    <img
      src={`/cards/${getCardFilename(cardId, cardName)}.png`}
      alt={cardName}
      className="w-full h-full object-cover"
    />
  </div>
);

export default function YearView({ year, journalEntries, onDateClick, onNavigateToToday, currentDate }: YearViewProps) {
  const currentMonthIndex = new Date(currentDate + 'T00:00:00').getMonth();

  const [animating, setAnimating] = useState(true);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedCard, setSelectedCard] = useState<TarotCardType | null>(null);

  // Swipe-to-close gesture state
  const touchStartY = useRef<number>(0);
  const [drawerTranslateY, setDrawerTranslateY] = useState(0);
  const savedScrollY = useRef(0);
  /**
   * The sheet element, held in state rather than in a ref.
   *
   * A ref does not tell an effect when it was filled. The sheet only renders
   * once `selectedCard` has resolved, which happens a render after `drawerOpen`
   * turns true — so an effect keyed on `drawerOpen` ran while the ref was still
   * null, returned early, and never ran again, because its dependency never
   * changed a second time. The listeners were never attached at all.
   *
   * A callback ref puts the node itself in the dependency array, so the effect
   * runs exactly when the element mounts, whichever render that turns out to be.
   */
  const [sheetEl, setSheetEl] = useState<HTMLDivElement | null>(null);

  /**
   * The past readings open on the desktop, front-most last.
   *
   * Desktop used to leave the year entirely to read a past card, which is a
   * heavy price for a glance at one day — you lost your place in the grid and
   * had to come back to it. These are the desktop counterpart to the mobile
   * sheet: same reading, but the year stays where it was, behind them, and
   * several days can be held open beside each other.
   */
  const [openWins, setOpenWins] = useState<
    { date: string; rect: WindowRect; z: number; sky: Sky }[]
  >([]);
  const topZ = useRef(60);

  const openWindow = (date: string, cell: HTMLElement | null) => {
    setOpenWins(prev => {
      const already = prev.find(w => w.date === date);
      // Clicking a day that is already open raises it rather than stacking a
      // second copy of the same reading.
      if (already) {
        return prev.map(w => w.date === date ? { ...w, z: ++topZ.current } : w);
      }
      const rect = rectForCell(cell?.getBoundingClientRect() ?? null, prev.length);
      // The hour the card was drawn, not the hour it is being read — so a
      // window's colours are a property of that day, and reopening it a month
      // later brings back the same sky.
      return prev.concat({ date, rect, z: ++topZ.current, sky: skyForDraw(date) });
    });
  };

  const closeWindow = (date: string) =>
    setOpenWins(prev => prev.filter(w => w.date !== date));

  // Esc closes the front window, the way it closes the sheet's backdrop.
  useEffect(() => {
    if (!openWins.length) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      const front = openWins.reduce((a, b) => (b.z > a.z ? b : a));
      closeWindow(front.date);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [openWins]);

  /** Whether the current touch is dragging the sheet rather than scrolling it. */
  const draggingSheet = useRef(false);
  /**
   * How far the sheet has been dragged, mirrored out of state so touchend can
   * read it synchronously. It was read inside a `setDrawerTranslateY` updater,
   * which is meant to be a pure function of the previous state — closing the
   * drawer from inside one is a side effect React is free to run twice or not
   * at all.
   */
  const dragY = useRef(0);
  /** Last touch position and time, for the flick speed measured on release. */
  const lastY = useRef(0);
  const lastMoveAt = useRef(0);
  const velocity = useRef(0);
  /**
   * Whether the sheet is on its way out.
   *
   * Dismissal used to unmount the drawer the instant the threshold was crossed,
   * so the sheet vanished from wherever the thumb left it and the year view was
   * simply there. This carries it the rest of the way down first: the drag ends
   * where the animation begins, and the reader watches the thing they were
   * holding leave rather than blink out of existence.
   */
  const [closing, setClosing] = useState(false);
  /**
   * Whether the sheet has finished arriving.
   *
   * The entrance used to be a CSS class, `animate-slide-up`, declared with
   * `forwards` — and an animation's fill value outranks an inline style. So the
   * class pinned `transform` to translateY(0) for the whole life of the sheet
   * and every transform the drag set was silently discarded. The gesture code
   * was correct and the sheet simply could not move.
   *
   * One owner of `transform` now, which is React. The sheet mounts sitting a
   * full height below its place and is released on the next frame, so the
   * arrival animates for the same reason the exit does.
   */
  const [entered, setEntered] = useState(false);
  const closeTimer = useRef<number | null>(null);

  // Two frames, not one: the first commits the starting transform, the second
  // changes it. Setting both in the same frame gives the browser one style to
  // compute and nothing to animate between.
  useEffect(() => {
    if (!sheetEl) { setEntered(false); return; }
    let second = 0;
    const first = requestAnimationFrame(() => { second = requestAnimationFrame(() => setEntered(true)); });
    return () => { cancelAnimationFrame(first); cancelAnimationFrame(second); };
  }, [sheetEl]);

  // Ref to scroll mobile view to current month on mount
  const currentMonthRef = useRef<HTMLDivElement>(null);
  const yearHeaderRef = useRef<HTMLDivElement>(null);

  /**
   * Whether the header has caught on the nav.
   *
   * The gradient is a scrim for content passing underneath, so it has nothing
   * to do until something is passing. At rest the year sits below the nav with
   * clear ground above it, and a band of gradient starting a few dozen pixels
   * down the screen read as a misplaced object rather than as a fade. It is
   * painted only once the header is actually pinned.
   */
  const [isPinned, setIsPinned] = useState(false);
  useEffect(() => {
    const header = yearHeaderRef.current;
    if (!header) return;
    const check = () => {
      const navH = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
      ) || (window.innerWidth >= 768 ? 80 : 56);
      // A pixel of slack: sub-pixel layout means the two are rarely exactly equal.
      setIsPinned(header.getBoundingClientRect().top <= navH + 1);
    };
    check();
    window.addEventListener('scroll', check, { passive: true });
    window.addEventListener('resize', check);
    return () => {
      window.removeEventListener('scroll', check);
      window.removeEventListener('resize', check);
    };
  }, []);

  const daysWithCards = journalEntries.length;

  const cardLookup = useMemo(() => {
    const map = new Map<string, TarotCardType>();
    tarotDeck.forEach(card => map.set(card.id, card));
    return map;
  }, []);

  const cardMap = useMemo(() => {
    const map = new Map<string, JournalEntry>();
    journalEntries.forEach(entry => map.set(entry.date, entry));
    return map;
  }, [journalEntries]);

  // Pre-compute calendar days for all 12 months
  const allMonthCalendarDays = useMemo(() => {
    return MONTH_NAMES.map((_, i) => buildCalendarDays(year, i));
  }, [year]);

  // Cascading flip animation
  useEffect(() => {
    setAnimating(true);
    const maxDelay = journalEntries.length * 15;
    const timer = setTimeout(() => setAnimating(false), maxDelay + 500);
    return () => clearTimeout(timer);
  }, []);

  // Scroll to current month after the first paint so getBoundingClientRect is accurate
  useEffect(() => {
    requestAnimationFrame(() => {
      if (!currentMonthRef.current) return;
      // Same measured height the sticky header sits at, rather than a third
      // copy of the guess.
      const navHeight = parseFloat(
        getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
      ) || (window.innerWidth >= 768 ? 80 : 56);
      const stickyHeight = yearHeaderRef.current?.offsetHeight ?? 88;
      const gap = 16;
      const elementTop = currentMonthRef.current.getBoundingClientRect().top + window.scrollY;
      window.scrollTo({ top: elementTop - navHeight - stickyHeight - gap, behavior: 'instant' });
    });
  }, []);

  // Look up past card directly from stored cardId — never re-fetch from API
  // (the API doesn't know the user's birthdate so would return a different card)
  const selectedEntry = selectedDate ? journalEntries.find(e => e.date === selectedDate) : null;
  useEffect(() => {
    if (selectedDate && selectedEntry) {
      const card = cardLookup.get(selectedEntry.cardId) ?? null;
      setSelectedCard(card);
    } else {
      setSelectedCard(null);
    }
  }, [selectedDate, selectedEntry, cardLookup]);

  // Lock body scroll when drawer is open (iOS-safe: position:fixed approach)
  useEffect(() => {
    if (drawerOpen) {
      savedScrollY.current = window.scrollY;
      document.body.style.position = 'fixed';
      document.body.style.top = `-${savedScrollY.current}px`;
      document.body.style.width = '100%';
    } else {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
      window.scrollTo(0, savedScrollY.current);
      setDrawerTranslateY(0);
    }
    return () => {
      document.body.style.position = '';
      document.body.style.top = '';
      document.body.style.width = '';
    };
  }, [drawerOpen]);

  const closeDrawer = () => setDrawerOpen(false);

  /** How long the sheet takes to leave, and the easing it leaves on. */
  const EXIT_MS = 260;
  const EXIT_EASE = 'cubic-bezier(0.32, 0.72, 0, 1)';

  /**
   * Sends the sheet the rest of the way down, then unmounts it.
   *
   * Continues from wherever the drag ended rather than restarting, so a sheet
   * already 200px down travels the remaining distance instead of jumping back
   * and replaying. The timer is the completion signal rather than transitionend:
   * a transition that never starts, because the sheet is already at the target,
   * fires no event, and the drawer would stay open forever.
   */
  const dismissDrawer = () => {
    const height = sheetEl?.getBoundingClientRect().height ?? window.innerHeight;
    setClosing(true);
    setDrawerTranslateY(height);
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
    closeTimer.current = window.setTimeout(() => {
      closeDrawer();
      setClosing(false);
      closeTimer.current = null;
    }, EXIT_MS);
  };

  // A drawer unmounted mid-exit, by a route change or a re-render, must not
  // leave its timer to fire into nothing.
  useEffect(() => () => {
    if (closeTimer.current) window.clearTimeout(closeTimer.current);
  }, []);

  /**
   * Pull-to-close, listening on the whole sheet rather than on the handle alone.
   *
   * The handle was a 44px target on a sheet that covers the screen, and the only
   * other way out was a backdrop sliver a few points tall. Miss both and the
   * drawer could not be dismissed at all — on a home-screen install, where there
   * is no browser chrome to fall back to, that meant force-quitting the app.
   *
   * The sheet is also its own scroller, so a downward drag is ambiguous: it
   * means "scroll up through the reading" until the content is at the top, and
   * only then "put the sheet away". That is the check below, taken once at
   * touchstart — deciding per-frame would let a fast flick change its mind
   * halfway through and jump the sheet.
   *
   * The listener is registered natively so it can be non-passive. Without
   * preventDefault iOS runs its own rubber-band underneath the drag, which is
   * the "it just pulls the whole screen down" in the report.
   */
  useEffect(() => {
    const sheet = sheetEl;
    if (!sheet) return;

    const setY = (dy: number) => {
      dragY.current = dy;
      setDrawerTranslateY(dy);
    };

    const onTouchStart = (e: TouchEvent) => {
      const y = e.touches[0].clientY;
      touchStartY.current = y;
      lastY.current = y;
      lastMoveAt.current = performance.now();
      velocity.current = 0;
      /*
        Undecided, on purpose.
        
        This used to claim the gesture whenever the sheet was at the top —
        which it always is the moment it opens. An upward swipe meant to read
        the card was then treated as a drag, clamped to zero because the sheet
        cannot go above rest, and preventDefault'd so the scroller never saw
        it. scrollTop could not leave zero, so the next touch made the same
        decision, and the content could not be scrolled at all.
        
        Direction is what separates the two gestures, and direction is not
        known yet at touchstart. The handover below already reads it correctly
        for both — down at the top hands the sheet the gesture, anything else
        leaves it with the scroller — so the honest starting position is that
        nobody owns it.
      */
      draggingSheet.current = false;
      dragY.current = 0;
    };

    const onTouchMove = (e: TouchEvent) => {
      const y = e.touches[0].clientY;

      // Speed of the last moment of the drag, in px per ms, positive downward.
      // Kept per-move rather than measured across the whole gesture: what
      // decides a flick is how fast the thumb was going when it left, not its
      // average over a drag that may have paused halfway.
      const now = performance.now();
      const elapsed = now - lastMoveAt.current;
      if (elapsed > 0) velocity.current = (y - lastY.current) / elapsed;
      lastY.current = y;
      lastMoveAt.current = now;

      if (!draggingSheet.current) {
        // The scroller has run out of content and the thumb is still coming
        // down, so the sheet takes the gesture over without it being released.
        //
        // Deciding this once at touchstart is what made the drawer feel stuck:
        // a sheet scrolled even slightly down treated the whole gesture as a
        // scroll, so closing it took a drag to reach the top, a lift, and then
        // a second drag. iOS hands over mid-gesture and so does this now.
        //
        // The origin is rebased to where the thumb is at handover rather than
        // where the gesture began. Using the original start would jump the
        // sheet down by everything already spent on scrolling.
        if (sheet.scrollTop <= 0 && y > touchStartY.current) {
          draggingSheet.current = true;
          touchStartY.current = y;
        } else {
          return;
        }
      }

      const dy = y - touchStartY.current;

      // Once the sheet has the gesture it keeps it until the thumb lifts, and
      // follows in both directions: down away from rest, back up towards it.
      //
      // It used to give the gesture back to the scroller the moment dy went
      // negative, snapping home. A thumb does not travel in one direction — it
      // wobbles a pixel upward constantly — so a drag would cancel itself
      // partway and have to be started again. That is the drawer "needing
      // several drags", and it is what a native sheet never does.
      //
      // Clamped at zero so the sheet cannot be pulled above where it rests.
      // Dragging up past that point simply holds it at rest rather than
      // handing back mid-gesture; the scroller gets its turn on the next touch.
      e.preventDefault();
      setY(Math.max(0, dy));
    };

    const onTouchEnd = () => {
      if (!draggingSheet.current) return;
      draggingSheet.current = false;
      // Read from the ref, not from a state updater. The distance is needed as
      // a plain value here so the decision to close is an ordinary side effect
      // rather than something smuggled into React's reducer.
      const dy = dragY.current;
      const speed = velocity.current;
      dragY.current = 0;
      velocity.current = 0;

      // Distance or intent. 80px is the deliberate pull; the second clause is
      // the flick — a short, fast push downward that every native sheet treats
      // as a dismissal, and that felt ignored here because only distance
      // counted. 0.5px/ms is about 500px a second, well above a drag that
      // happens to end while still moving.
      if (dy > 80 || (dy > 24 && speed > 0.5)) dismissDrawer();
      else setDrawerTranslateY(0);
    };

    sheet.addEventListener('touchstart', onTouchStart, { passive: true });
    sheet.addEventListener('touchmove', onTouchMove, { passive: false });
    sheet.addEventListener('touchend', onTouchEnd);
    sheet.addEventListener('touchcancel', onTouchEnd);
    return () => {
      sheet.removeEventListener('touchstart', onTouchStart);
      sheet.removeEventListener('touchmove', onTouchMove);
      sheet.removeEventListener('touchend', onTouchEnd);
      sheet.removeEventListener('touchcancel', onTouchEnd);
    };
  }, [sheetEl]);

  const handleDayClick = (
    date: string,
    hasCard: boolean,
    isToday: boolean,
    cell?: HTMLElement,
  ) => {
    if (!hasCard) return;
    if (window.innerWidth < 768) {
      if (isToday) {
        onDateClick(date);
        onNavigateToToday();
      } else {
        setSelectedDate(date);
        setDrawerOpen(true);
      }
    } else if (isToday) {
      // Today is not a past card — it is the reading you are living in, and it
      // still belongs on its own page.
      onDateClick(date);
    } else {
      openWindow(date, cell ?? null);
    }
  };

  // No ground of its own: an opaque fill on the root painted over the fixed
  // GroundTexture, so the year sat on flat green while the reading page sat on
  // paper tooth. The two views share one screen and should share its floor.
  //
  // The year travels before it pins. A sticky element whose natural position is
  // already at its pinned offset never moves, which is why the header sat
  // motionless at the top no matter how far the page scrolled. The spacer above
  // it gives it somewhere to come from: at rest the year sits below the nav, and
  // it rises with the page until the header catches at --nav-h. The spacer is
  // outside the header, so the gradient still reaches the nav the moment it
  // pins rather than floating below it.
  return (
    <div className="relative min-h-screen">

      {/* The dark fade lives at the very top of the screen, full width, and eases out downward, so it has no band and
          no edge of its own: it only darkens what is scrolling up under the nav and the pinned year. */}
      <div
        aria-hidden="true"
        className="fixed top-0 left-0 right-0 z-10 pointer-events-none transition-opacity duration-500"
        style={{
          opacity: isPinned ? 1 : 0,
          height: 'calc(var(--nav-h, 3.5rem) + 8.5rem)',
          background:
            'linear-gradient(to bottom, rgba(23,34,17,.94) 0%, rgba(23,34,17,.9) 18%, rgba(23,34,17,.78) 34%, rgba(23,34,17,.6) 50%, rgba(23,34,17,.4) 64%, rgba(23,34,17,.22) 78%, rgba(23,34,17,.08) 90%, rgba(23,34,17,0) 100%)',
        }}
      />

      {/* What the year rises through. */}
      <div className="h-10 md:h-16" />

      {/* Sticky header */}
      <div
        ref={yearHeaderRef}
        className={`sticky z-20 pb-3 md:pb-8 transition-opacity duration-300 ${
          ''
        }`}
        /* Flush against the nav: a hard-coded offset left a strip of scrolling
           content visible between the two the moment the nav resized. */
        style={{ top: 'var(--nav-h, 3.5rem)' }}
      >
        {/* Kept tight: this padding is inside the sticky box, so it is the gap
            between the nav and the year once pinned. */}
        <div className="text-center pt-3 md:pt-4 px-4 md:px-8">
          <h1
            className="text-[#C9F24E] mb-1"
            /* The pixel face, as on the tear-off calendar — this is the same
               number in the same role. Sized up from the mono it replaces:
               VT323 sits small for its point size. */
            style={{
              fontFamily: 'var(--font-vt323), monospace',
              fontSize: 'clamp(30px, 6.5vw, 46px)',
              letterSpacing: '0.14em',
              lineHeight: 1,
            }}
          >
            {year}
          </h1>
          <p
            className="text-[#F7F4E6] opacity-70"
            style={{ ...LABEL_TYPE, fontSize: 'clamp(11px, 2.6vw, 14px)', letterSpacing: '0.14em' }}
          >
            {daysWithCards} {daysWithCards === 1 ? 'day' : 'days'} drawn
          </p>
        </div>
      </div>

      {/* ── ALL SCREENS: 12 months, vertically scrollable, single column ── */}
      <div className="px-4 pb-16">
        <div className="max-w-sm md:max-w-2xl lg:max-w-4xl xl:max-w-5xl mx-auto">
        {MONTH_NAMES.map((monthName, monthIndex) => {
          const isCurrentMonth = monthIndex === currentMonthIndex;
          const monthDays = allMonthCalendarDays[monthIndex];

          return (
            <div
              key={monthName}
              ref={isCurrentMonth ? currentMonthRef : undefined}
              className="mb-10"
              style={{ scrollMarginTop: 'calc(var(--nav-h, 3.5rem) + 36px)' }}
            >
              {/* Month name — intentionally small */}
              <h2
                className={`mb-3 ${isCurrentMonth ? 'text-[#C9F24E]' : 'text-[#C9F24E]/50'}`}
                style={LABEL_TYPE}
              >
                {monthName}
              </h2>

              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-0.5 mb-0.5">
                {WEEKDAYS.map(wd => (
                  <div
                    key={wd}
                    className="text-center text-[#C9F24E] opacity-35"
                    style={{
                      fontSize: '10px',
                      fontFamily: 'var(--font-vt323), monospace',
                      letterSpacing: '0.04em',
                      paddingBottom: '4px'
                    }}
                  >
                    {wd}
                  </div>
                ))}
              </div>

              {/* Calendar day grid */}
              <div
                className="grid grid-cols-7 gap-0.5"
                role="grid"
                aria-label={`${monthName} ${year}`}
              >
                {monthDays.map(({ date, day, isCurrentMonth: isCurrMonth }) => {
                  const entry = isCurrMonth ? cardMap.get(date) : undefined;
                  const isToday = date === currentDate;
                  const hasCard = !!entry;
                  const isReversed = entry?.isReversed || false;
                  const cardData = entry ? cardLookup.get(entry.cardId) : null;

                  return (
                    <div
                      key={date}
                      role="gridcell"
                      className={`relative overflow-hidden rounded-sm aspect-[2/3] ${!isCurrMonth ? 'opacity-20' : ''} ${isToday ? 'ring-1 ring-[#C9F24E]' : ''}`}
                    >
                      <button
                        onClick={e => isCurrMonth && handleDayClick(date, hasCard, isToday, e.currentTarget)}
                        className={`w-full h-full relative block ${hasCard && isCurrMonth ? 'cursor-pointer active:opacity-75' : 'cursor-default'}`}
                        tabIndex={hasCard && isCurrMonth ? 0 : -1}
                        aria-label={
                          isCurrMonth
                            ? `${day} ${monthName}${isToday ? ', today' : ''}${hasCard ? `, ${isReversed ? 'reversed' : 'upright'} card` : ''}`
                            : undefined
                        }
                      >
                        {/* Stamp or empty cell */}
                        {hasCard && cardData ? (
                          /* STAMP: cream body, perforated edges, card image inset, day as denomination */
                          <div className="absolute inset-0 bg-[#172211]">
                            <div
                              className="absolute inset-0"
                              style={{
                                background: '#C9F24E',
                                mask: STAMP_MASK,
                                maskComposite: 'subtract, subtract, subtract, subtract, add',
                                WebkitMask: STAMP_MASK,
                                WebkitMaskComposite: 'destination-out, destination-out, destination-out, destination-out, source-over',
                              } as React.CSSProperties}
                            >
                              {/* Card image — centred with equal cream border on all sides */}
                              <div
                                className={`absolute ${isReversed ? 'rotate-180' : ''}`}
                                style={{ inset: '4px' }}
                              >
                                <img
                                  src={`/cards/${getCardFilename(entry!.cardId, cardData.name)}.png`}
                                  alt={cardData.name}
                                  className="w-full h-full object-cover"
                                  loading="lazy"
                                />
                              </div>
                              {/* Day number — top-left, same style as empty cells */}
                              <span
                                className="absolute top-0.5 left-1 leading-none select-none z-10"
                                style={{
                                  fontSize: '9px',
                                  fontFamily: 'var(--font-vt323), monospace',
                                  color: '#172211',
                                  opacity: 0.7,
                                }}
                              >
                                {day}
                              </span>
                            </div>
                          </div>
                        ) : (
                          /* Empty cell */
                          <div className="absolute inset-0 bg-[#172211] border border-[#C9F24E]/10 rounded-sm" />
                        )}

                        {/* Date number — only shown on empty cells */}
                        {!hasCard && (
                          <span
                            className="absolute top-0.5 left-1 leading-none z-10 select-none text-[#C9F24E]/30"
                            style={{ fontSize: '9px', fontFamily: 'var(--font-vt323), monospace' }}
                          >
                            {day}
                          </span>
                        )}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
        </div>
      </div>

      {/* Bottom drawer — past card detail (mobile) */}
      {drawerOpen && selectedDate && selectedCard && selectedEntry && (
        <>
          {/* Backdrop */}
          {/* The scrim thins as the sheet is pulled down, so the gesture reads
              as one movement rather than a panel sliding over a static wall.
              Tied to the drag rather than to a class so it tracks the thumb. */}
          <div
            className="md:hidden fixed inset-0 bg-[#172211]/60 backdrop-blur-sm z-40"
            onClick={dismissDrawer}
            aria-hidden="true"
            style={{
              opacity: closing ? 0 : Math.max(0, 1 - drawerTranslateY / 320),
              transition: closing
                ? `opacity ${EXIT_MS}ms ${EXIT_EASE}`
                : drawerTranslateY === 0
                ? 'opacity 0.3s ease'
                : 'none',
            }}
          />
          {/* Drawer panel */}
          <div
            ref={setSheetEl}
            /* 86dvh, not 94vh — the sheet stops short of the top instead of
               running under the status bar — the handle clears it by about the
               width of a thumb, which is where are.na puts theirs. The sheet
               can stand this tall because the pull now works anywhere on it;
               at 94vh the backdrop was the only way out and far too thin to
               be one. vh was the wrong unit besides: it ignores the home
               indicator, which is exactly the space a home-screen install has
               and a browser tab does not.

               No top border. A lime rule across the head of the sheet drew a
               line under nothing — the rounded corners and the ground change
               already say where the sheet starts. */
            className="md:hidden fixed bottom-0 left-0 right-0 bg-[#172211] rounded-t-3xl shadow-2xl z-50 max-h-[92dvh] overflow-y-auto"
            role="dialog"
            aria-modal="true"
            aria-label={`Card reading for ${new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
            style={{
              transform: entered ? `translateY(${drawerTranslateY}px)` : 'translateY(100%)',
              /* No transition while a thumb is on it — the sheet must sit exactly
                 where the finger is. The settle back to rest and the exit both
                 animate; the exit is the same curve iOS uses for sheets. */
              transition: !entered
                ? 'none'
                : closing
                ? `transform ${EXIT_MS}ms ${EXIT_EASE}`
                : drawerTranslateY === 0
                ? `transform 300ms ${EXIT_EASE}`
                : 'none',
            }}
          >
            {/* Drag handle — touch target for swipe-to-close */}
            <div className="sticky top-0 pt-3 pb-6 -mb-4 flex justify-center rounded-t-3xl z-10 cursor-grab active:cursor-grabbing">
              {/* Solid behind the handle, then fading out beneath it, so content
                  scrolling under is fed out rather than cut along a hard line.
                  That fade is the intent and stays.

                  It starts 2px above the sheet's own top edge, which is the
                  only part that is a fix. The sheet carries both a radius and a
                  transform, so its clipped content rasterises on a different
                  pixel grid from this scrim; at a fractional offset — the sheet
                  sits at x.96 on a 2x screen — the two disagreed by a hairline
                  and a sliver of moving content showed along the join. Starting
                  above the edge means there is no shared boundary to disagree
                  about. The overhang is clipped by the sheet's own overflow.

                  It has to be transparent again by 42px, where the date sits:
                  covering the seam is not worth hiding the day. The bar is
                  relative so it paints above the scrim. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute inset-x-0 rounded-t-3xl"
                style={{
                  top: '-2px',
                  height: '44px',
                  /* Same height, softer fall. The solid part now ends at 34%
                     rather than 50% and the stops in between are closer
                     together in value, so the scrim reads as a fade rather than
                     as a band with an edge on it. Still fully opaque across the
                     sheet's own top edge, which is the part that was covering
                     the hairline. */
                  background:
                    'linear-gradient(to bottom, #172211 0%, #172211 34%, rgba(23,34,17,0.72) 58%, rgba(23,34,17,0.34) 78%, rgba(23,34,17,0) 100%)',
                }}
              />
              <div className="relative w-12 h-1.5 bg-[#C9F24E]/40 rounded-full" />
            </div>

            {/* No horizontal padding of its own: the reading page rendered
                inside carries the 20px gutter, and stacking the two left the
                card measurably narrower here than on the main screen. */}
            {/* Starts below the fade rather than inside it. The handle's
                gradient overlaps the content by design, and the date is the
                first thing it reaches. */}
            {/* The date rides just under the handle's gradient, which now
                fades out 42px from the top of the sticky block — the same
                point this padding brings the date to. Anything more read as
                the date floating between the handle and the card rather than
                belonging to either. */}
            <PastCardReading
              date={selectedDate}
              card={selectedCard}
              isReversed={selectedEntry.isReversed || false}
            />
          </div>
        </>
      )}

      {/* Past readings, open over the year (desktop). No backdrop and no body
          scroll lock, unlike the sheet: the year behind them stays live, which
          is the whole reason these are windows and not a second drawer. */}
      {openWins.map(w => {
        const entry = journalEntries.find(e => e.date === w.date);
        const card = entry ? cardLookup.get(entry.cardId) : null;
        if (!entry || !card) return null;
        return (
          <CardWindow
            key={w.date}
            date={w.date}
            card={card}
            isReversed={entry.isReversed || false}
            rect={w.rect}
            z={w.z}
            sky={w.sky}
            onFocus={() => setOpenWins(prev =>
              // Already front-most: don't churn state on every mousedown.
              prev.every(v => v.z <= w.z)
                ? prev
                : prev.map(v => v.date === w.date ? { ...v, z: ++topZ.current } : v)
            )}
            onClose={() => closeWindow(w.date)}
          />
        );
      })}
    </div>
  );
}
