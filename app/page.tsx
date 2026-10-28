'use client';

import { useState, useEffect, useRef } from 'react';
import TarotCard from './components/TarotCard';
import SaveStatus from './components/SaveStatus';
import ScrollVeil from './components/ScrollVeil';
import YearView from './components/YearView';
import Onboarding from './components/Onboarding';
import TearOffPage from './components/TearOffPage';
import GroundTexture from './components/GroundTexture';
import AsciiFlower from './components/AsciiFlower';
import CardSelector from './components/CardSelector';
import ShareModal from './components/ShareModal';
import { LABEL_TYPE } from './components/type';
import cardPage from './components/card-page/card-page.module.css';
import { CardName } from './components/card-page';
import { TarotCard as TarotCardType } from '@/lib/types/tarot';
import { tarotDeck } from '@/lib/data/tarot-deck';

type View = 'card' | 'year';

const SCATTER_CARD_IMAGES = [
  '/cards/major-0-fool.png',
  '/cards/major-1-magician.png',
  '/cards/major-2-high-priestess.png',
  '/cards/major-3-empress.png',
  '/cards/major-4-emperor.png',
  '/cards/major-5-hierophant.png',
  '/cards/major-6-lovers.png',
  '/cards/major-7-chariot.png',
  '/cards/major-8-strength.png',
  '/cards/major-9-hermit.png',
  '/cards/major-10-wheel-of-fortune.png',
  '/cards/major-11-justice.png',
  '/cards/major-12-hanged-man.png',
  '/cards/major-13-death.png',
  '/cards/major-14-temperance.png',
  '/cards/major-15-devil.png',
  '/cards/major-16-tower.png',
  '/cards/major-17-star.png',
  '/cards/major-18-moon.png',
  '/cards/major-19-sun.png',
  '/cards/major-20-judgement.png',
  '/cards/major-21-world.png',
  '/cards/cups-ace.png',
  '/cards/cups-2.png',
  '/cards/cups-3.png',
  '/cards/cups-4.png',
  '/cards/cups-5.png',
  '/cards/cups-6.png',
  '/cards/cups-7.png',
  '/cards/cups-8.png',
  '/cards/cups-9.png',
  '/cards/cups-10.png',
  '/cards/cups-page.png',
  '/cards/cups-knight.png',
  '/cards/cups-queen.png',
  '/cards/cups-king.png',
  '/cards/wands-ace.png',
  '/cards/wands-2.png',
  '/cards/wands-3.png',
  '/cards/wands-4.png',
  '/cards/wands-5.png',
  '/cards/wands-6.png',
  '/cards/wands-7.png',
  '/cards/wands-8.png',
  '/cards/wands-9.png',
  '/cards/wands-10.png',
  '/cards/wands-page.png',
  '/cards/wands-knight.png',
  '/cards/wands-queen.png',
  '/cards/wands-king.png',
  '/cards/swords-ace.png',
  '/cards/swords-2.png',
  '/cards/swords-3.png',
  '/cards/swords-4.png',
  '/cards/swords-5.png',
  '/cards/swords-6.png',
  '/cards/swords-7.png',
  '/cards/swords-8.png',
  '/cards/swords-9.png',
  '/cards/swords-10.png',
  '/cards/swords-page.png',
  '/cards/swords-knight.png',
  '/cards/swords-queen.png',
  '/cards/swords-king.png',
  '/cards/pentacles-ace.png',
  '/cards/pentacles-2.png',
  '/cards/pentacles-3.png',
  '/cards/pentacles-4.png',
  '/cards/pentacles-5.png',
  '/cards/pentacles-6.png',
  '/cards/pentacles-7.png',
  '/cards/pentacles-8.png',
  '/cards/pentacles-9.png',
  '/cards/pentacles-10.png',
  '/cards/pentacles-page.png',
  '/cards/pentacles-knight.png',
  '/cards/pentacles-queen.png',
  '/cards/pentacles-king.png',
];

const buildShuffleData = () => {
  // Gentle clockwise revolve
  const revolveRad = (72 * Math.PI) / 180;
  const cos = Math.cos(revolveRad);
  const sin = Math.sin(revolveRad);

  return SCATTER_CARD_IMAGES.map(() => {
    // ~20% of cards stay near centre — fills the hole in the middle
    const isCenter = Math.random() < 0.2;
    const tx = isCenter ? (Math.random() - 0.5) * 400 : (Math.random() - 0.5) * 1800;
    const ty = isCenter ? (Math.random() - 0.5) * 300 : (Math.random() - 0.5) * 1200;
    const tz = 0; // no depth scaling — all cards same size
    const isReversed = Math.random() > 0.5;
    const spinDuration = 5 + Math.random() * 7;
    const spinReverse = Math.random() > 0.5;
    return {
      tx, ty, tz,
      rtx: tx * cos - ty * sin,
      rty: tx * sin + ty * cos,
      rotateX: 0,
      rotateY: 0,
      rotateZ: isReversed ? 180 + (Math.random() - 0.5) * 40 : (Math.random() - 0.5) * 60,
      spinDuration, spinReverse,
    };
  });
};

/**
 * A date as the reader's own calendar has it, never UTC.
 *
 * Every date key in the app is local — the card is for the day you are living
 * in, not the day in Greenwich. Mixing the two is invisible in Europe and wrong
 * for eight hours a day east of it: a reader at UTC+8 between midnight and 8am
 * gets yesterday's ISO date, so anything comparing the two decides the day is
 * not today and quietly disappears.
 */
function toLocalDateString(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function localDateString(): string {
  return toLocalDateString(new Date());
}

/** One full open-and-close of the loading flower. */
const MIN_LOADING_MS = 2600;

interface JournalEntry {
  date: string;
  cardId: string;
  hasJournal: boolean;
  reflection?: string;
  isReversed?: boolean;
}

export default function Home() {
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [currentView, setCurrentView] = useState<View>('card');
  const [card, setCard] = useState<TarotCardType | null>(null);
  const [isReversed, setIsReversed] = useState(false);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  /**
   * The loader is a flower that takes a moment to open, and the work behind it
   * usually finishes before it has. Cutting it off mid-unfurl made the app feel
   * like it flinched, so the screen is held for one full breath either way.
   */
  const loadStartedAt = useRef(Date.now());
  const finishLoading = () => {
    const elapsed = Date.now() - loadStartedAt.current;
    const remaining = Math.max(0, MIN_LOADING_MS - elapsed);
    if (remaining === 0) setIsLoading(false);
    else setTimeout(() => setIsLoading(false), remaining);
  };
  const [dateString, setDateString] = useState('');
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [viewingPastCard, setViewingPastCard] = useState(false);
  /*
   * The share sheet.
   *
   * Lives on the card page rather than inside the lime module, because a share
   * card carries only fixed card data — the name, keywords, description, scent
   * recipe. None of the personalised reading and none of the reflection. So it
   * has to work on a day the quota is spent or personalisation is switched
   * off, when the module is showing something else entirely.
   */
  const [shareOpen, setShareOpen] = useState(false);

  // Shuffle animation — single boolean so React never re-renders mid-animation
  const [isAnimating, setIsAnimating] = useState(false);
  const [scatterFading, setScatterFading] = useState(false);
  const shuffleData = useRef<Array<{ tx: number; ty: number; tz: number; rtx: number; rty: number; rotateX: number; rotateY: number; rotateZ: number; spinDuration: number; spinReverse: boolean }>>([]);
  const convergeTarget = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
  const cardAnchorRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLDivElement>(null);
  // a very faint blur behind the top buttons once the page has scrolled, so the text passing under them stays quiet
  const [scrolled, setScrolled] = useState(false);
  // phones: today / year / save fold into one square button at the corner, so the top of the page stays quiet
  const [navOpen, setNavOpen] = useState(false);
  useEffect(() => {
    if (!navOpen) return;
    const away = (e: PointerEvent) => {
      if (!(e.target as Element | null)?.closest?.('[aria-label="View switcher"]')) setNavOpen(false);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [navOpen]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  const shuffledImages = useRef<string[]>([...SCATTER_CARD_IMAGES]);
  const [pendingAutoReveal, setPendingAutoReveal] = useState(false);
  const [animateReveal, setAnimateReveal] = useState(false);
  // Direct DOM refs — JS drives all transforms so React can't interrupt transitions
  const cardRefsRef = useRef<(HTMLDivElement | null)[]>([]);
  const spinnerRefsRef = useRef<(HTMLDivElement | null)[]>([]);
  const animateCardsRef = useRef<(() => void) | null>(null);

  // JS-driven group rotation (avoids CSS animation restart on speed change)
  const groupRotRef = useRef<HTMLDivElement>(null);
  const groupAngleRef = useRef(0);
  const rafIdRef = useRef<number | null>(null);
  const lastTsRef = useRef<number | null>(null);
  const speedRef = useRef(0);
  const targetSpeedRef = useRef(0);

  // Fire animateCardsRef after React commits the overlay DOM (refs are populated)
  useEffect(() => {
    if (!isAnimating || !animateCardsRef.current) return;
    const fn = animateCardsRef.current;
    animateCardsRef.current = null;
    requestAnimationFrame(() => requestAnimationFrame(() => fn()));
  }, [isAnimating]);


  /*
   * The nav's height, published as --nav-h.
   *
   * Anything that has to sit directly beneath it — the page's top padding, the
   * year view's sticky header — used to hard-code 3.5rem/5rem. Those were only
   * ever guesses at the rendered height, and they stopped being true the moment
   * the nav's type changed: 3px of page content showed through under the bar on
   * a phone, and the year header tucked 9px behind it on desktop. Measured, the
   * offset cannot drift again. The height already includes the safe-area inset,
   * since the nav pads itself by it.
   */
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;
    const publish = () => {
      document.documentElement.style.setProperty('--nav-h', `${nav.getBoundingClientRect().height}px`);
    };
    publish();
    const observer = new ResizeObserver(publish);
    observer.observe(nav);
    return () => observer.disconnect();
    // The loading screen and onboarding both return before the nav renders, so
    // on first mount there is nothing to measure. Re-run once it exists.
  }, [isLoading, showOnboarding]);

  useEffect(() => {
    // Check if onboarding has been completed
    const onboardingComplete = localStorage.getItem('onboardingComplete');
    if (!onboardingComplete) {
      setShowOnboarding(true);
      finishLoading();
    } else {
      loadTodaysCard();
      loadJournalEntries();
    }
  }, []);

  // Reload journal entries when switching to year view
  useEffect(() => {
    if (currentView === 'year') {
      loadJournalEntries();
    }
  }, [currentView]);

  const loadTodaysCard = (autoReveal = false) => {
    try {
      const today = localDateString();

      // Check if a card has already been drawn today
      const storedCardId = localStorage.getItem(`card-${today}`);
      const storedReversed = localStorage.getItem(`reversed-${today}`);

      let todayCard: TarotCardType | null = null;
      let todayReversed = false;

      if (storedCardId) {
        // Re-use the card drawn earlier today — stays consistent all day
        todayCard = tarotDeck.find(c => c.id === storedCardId) ?? null;
        todayReversed = storedReversed === 'true';
      }

      if (!todayCard) {
        // First draw of the day — pick a truly random card, like pulling from a real deck
        const randomIndex = Math.floor(Math.random() * tarotDeck.length);
        todayCard = tarotDeck[randomIndex];
        todayReversed = Math.random() < 0.30; // 30% chance reversed

        // Commit to localStorage immediately so it's stable for the rest of the day
        localStorage.setItem(`card-${today}`, todayCard.id);
        localStorage.setItem(`reversed-${today}`, todayReversed.toString());
      }

      setCard(todayCard);
      setIsReversed(todayReversed);
      setDateString(today);

      const lastDrawDate = localStorage.getItem('lastDrawDate');
      const wasRevealed = localStorage.getItem('cardRevealed') === 'true';

      if (lastDrawDate === today && wasRevealed) {
        setCurrentView('card');
        setPendingAutoReveal(true); // play deck scatter → reveal
      } else if (autoReveal) {
        // Auto-reveal after onboarding (first time only)
        setCurrentView('card');
        setIsRevealed(true);
        localStorage.setItem('lastDrawDate', today);
        localStorage.setItem('cardRevealed', 'true');
        loadJournalEntries();
      }

      finishLoading();
    } catch (error) {
      console.error('Failed to load card:', error);
      finishLoading();
    }
  };

  const loadJournalEntries = () => {
    // Load all journal entries from localStorage
    const entries: JournalEntry[] = [];

    // Get all cards drawn
    const cardsDrawn = new Set<string>();
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key?.startsWith('card-')) {
        const date = key.replace('card-', '');
        cardsDrawn.add(date);
      }
    }

    // Build entries for all cards drawn
    cardsDrawn.forEach(date => {
      const reflection = localStorage.getItem(`reflection-${date}`);
      const cardId = localStorage.getItem(`card-${date}`);
      const isReversed = localStorage.getItem(`reversed-${date}`) === 'true';

      if (cardId) {
        entries.push({
          date,
          cardId,
          hasJournal: !!reflection && reflection.trim().length > 0,
          reflection: reflection || undefined,
          isReversed
        });
      }
    });

    setJournalEntries(entries);
  };


  const runScatterAnimation = (onComplete: () => void) => {
    // Ensure card is face-down during scatter — prevents flash of revealed card
    setIsRevealed(false);
    // Measure the card IMAGE specifically (not the full TarotCard component which includes text below)
    const cardEl = cardAnchorRef.current?.querySelector('[data-card-image]') as HTMLElement | null;
    const measureEl = cardEl ?? cardAnchorRef.current;
    if (measureEl) {
      const rect = measureEl.getBoundingClientRect();
      convergeTarget.current = {
        x: rect.left + rect.width / 2 - window.innerWidth / 2,
        y: rect.top + rect.height / 2 - window.innerHeight / 2,
      };
    }
    // Fisher-Yates shuffle so different cards appear on top each time
    const imgs = [...SCATTER_CARD_IMAGES];
    for (let i = imgs.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [imgs[i], imgs[j]] = [imgs[j], imgs[i]];
    }
    shuffledImages.current = imgs;
    shuffleData.current = buildShuffleData();
    // Start JS-driven group rotation loop
    if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
    groupAngleRef.current = 0;
    speedRef.current = 0;
    targetSpeedRef.current = 55;
    lastTsRef.current = null;

    const tick = (ts: number) => {
      if (lastTsRef.current !== null) {
        const dt = Math.min((ts - lastTsRef.current) / 1000, 0.05);
        const lerpFactor = targetSpeedRef.current === 0 ? 5 : (speedRef.current > targetSpeedRef.current ? 1.5 : 3);
        speedRef.current += (targetSpeedRef.current - speedRef.current) * Math.min(dt * lerpFactor, 1);
        groupAngleRef.current += speedRef.current * dt;
        if (groupRotRef.current) groupRotRef.current.style.transform = `rotateZ(${groupAngleRef.current}deg)`;
      }
      lastTsRef.current = ts;
      rafIdRef.current = requestAnimationFrame(tick);
    };
    rafIdRef.current = requestAnimationFrame(tick);

    // Store animation logic — useEffect will call it after React commits the overlay
    animateCardsRef.current = () => {
      const n = shuffledImages.current.length;

      // Phase 1: burst scatter — set transition + transform directly on each card DOM element
      cardRefsRef.current.forEach((el, i) => {
        if (!el) return;
        const data = shuffleData.current[i];
        if (!data) return;
        el.style.opacity = '1';
        el.style.transition = 'transform 1.8s cubic-bezier(0.12, 1, 0.2, 1)';
        el.style.transform = `translate3d(${data.tx}px, ${data.ty}px, ${data.tz}px) rotateX(${data.rotateX}deg) rotateY(${data.rotateY}deg) rotateZ(${data.rotateZ}deg)`;
      });
      // Keep individual card spins running — part of one continuous motion
      spinnerRefsRef.current.forEach((el, i) => {
        if (!el) return;
        const data = shuffleData.current[i];
        if (!data) return;
        el.style.animation = `cardDrift ${data.spinDuration.toFixed(1)}s linear infinite ${data.spinReverse ? 'reverse' : 'normal'}`;
      });

      // Slow group rotation after burst
      setTimeout(() => { targetSpeedRef.current = 10; }, 700);

      // Phase 2: converge — compute local target using inverse group rotation so cards
      // converge to the correct SCREEN position even while the group is still rotating
      setTimeout(() => {
        const rad = (groupAngleRef.current * Math.PI) / 180;
        const cx = convergeTarget.current.x;
        const cy = convergeTarget.current.y;
        const lx = cx * Math.cos(rad) + cy * Math.sin(rad);
        const ly = -cx * Math.sin(rad) + cy * Math.cos(rad);

        // Decelerate group rotation smoothly
        targetSpeedRef.current = 0;

        cardRefsRef.current.forEach((el, i) => {
          if (!el) return;
          const data = shuffleData.current[i];
          if (!data) return;
          const deckFan = (i / n - 0.5) * 14;
          const deckRz = Math.abs(data.rotateZ) > 90 ? 180 + deckFan : deckFan;
          el.style.transition = 'transform 2.2s cubic-bezier(0.4, 0, 0.2, 1)';
          el.style.transform = `translate3d(${lx}px, ${ly}px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(${deckRz}deg)`;
        });
        // Stop per-card spin for clean deck formation
        spinnerRefsRef.current.forEach(el => { if (el) el.style.animation = 'none'; });

        // Cover fades in over the converging scatter while card reveals underneath
        setTimeout(() => { setScatterFading(true); onComplete(); }, 300);
        setTimeout(() => {
          setIsAnimating(false);
          setScatterFading(false);
          if (rafIdRef.current) cancelAnimationFrame(rafIdRef.current);
        }, 2800);
      }, 2200);
    };

    setIsAnimating(true);
  };

  // Auto-reveal animation for returning users: scatter → revolve right → converge → reveal
  useEffect(() => {
    if (!pendingAutoReveal || !card) return;
    setPendingAutoReveal(false);
    setIsRevealed(true);
  }, [pendingAutoReveal, card]);

  /**
   * Reveal after the tear. No slot-reel here — the tear was the reveal gesture,
   * and running the reel on top of it would be two reveal animations competing.
   */
  const handleTearReveal = () => revealCard({ animate: false });

  const handleRevealCard = () => revealCard({ animate: true });

  const revealCard = ({ animate }: { animate: boolean }) => {
    setIsRevealed(true);
    setAnimateReveal(animate);
    const today = localDateString();
    localStorage.setItem('lastDrawDate', today);
    localStorage.setItem('cardRevealed', 'true');
    // Card is already stored in localStorage from loadTodaysCard — no re-save needed
    // Refresh journal entries to show the new card in year view
    loadJournalEntries();
  };

  /**
   * Length of the reflection as last committed, so the saved line can appear on
   * blur. A length rather than the text itself: nothing here needs the content,
   * and holding a second copy of it in state would only invite the two to drift.
   */
  const [savedLength, setSavedLength] = useState(0);

  const handleJournalChange = (value: string) => {
    localStorage.setItem(`reflection-${dateString}`, value);
    loadJournalEntries(); // Refresh entries
  };

  /**
   * SPEC §10, the input block, handed to TarotCard so it renders inside the
   * reading page's own ground and measure. The state stays here: the text and
   * its per-date key belong to the page, not to the card.
   *
   * The saved line is the confirmation the spec asks for and updates on blur —
   * writing happens on every keystroke as it always has, but a line that
   * flickered on each character would be noise rather than reassurance.
   */
  const renderInputBlock = () => {
    // Local, because dateString is. This compared against the UTC date and so
    // hid the whole block — prompt, textarea and saved line — for the first
    // hours of every day east of Greenwich.
    const isToday = dateString === localDateString();
    const reflection = localStorage.getItem(`reflection-${dateString}`) || '';

    // A past day with nothing written has no log to show.
    if (!isToday && !reflection.trim()) return null;

    const hasSavedLog = isToday ? savedLength > 0 : reflection.trim().length > 0;

    return (
      <section className={`${cardPage.col} ${cardPage.input}`}>
        {/* INPUT is an instruction, and there is nothing to input on a day
            that has already been written. A past log is just named. */}
        <div className={cardPage.prompt}>&gt; {isToday ? 'INPUT YOUR_THOUGHTS' : 'YOUR_THOUGHTS'}</div>
        {isToday ? (
          <textarea
            aria-label="Write your reflection on today's card"
            rows={4}
            placeholder="spill your thoughts here"
            defaultValue={reflection}
            onChange={(e) => handleJournalChange(e.target.value)}
            onBlur={(e) => setSavedLength(e.target.value.trim().length)}
          />
        ) : (
          <div className={cardPage.entry}>{reflection}</div>
        )}
        {/* Directly under the writing it is confirming. Below the share button
            it read as a receipt for the share rather than for the log, and sat
            far enough from the textarea to be answering nothing in particular.
            Only a log that has something in it can confirm itself.

            Hidden rather than absent, so its line is reserved either way. The
            confirmation arrives on blur, and if it took up no room until then
            it would shove the share button down at the moment the reader looked
            away from the textarea — the one thing on the page that is supposed
            to be reassuring, moving something under their thumb. */}
        <div
          className={cardPage.saved}
          style={{ visibility: hasSavedLog ? 'visible' : 'hidden' }}
          aria-hidden={!hasSavedLog}
        >
          &gt; SAVED TO {dateString}.LOG <span className={cardPage.cursor}>_</span>
        </div>

        <button
          type="button"
          onClick={() => setShareOpen(true)}
          className={cardPage.share}
        >
          &gt; SHARE THIS CARD
        </button>
      </section>
    );
  };

  const handleDateClick = (date: string) => {
    const entry = journalEntries.find(e => e.date === date);
    if (!entry) return; // No card for this date

    /*
     * The card that was actually drawn that day.
     *
     * This was missing, and everything around it disguised the fact: the date
     * changed, the orientation changed, the view changed, and the card itself
     * stayed whatever was already loaded — which on the way in from the year
     * view is always today's. So a past day opened today's card wearing an
     * older date, and it read as the app refusing to leave today.
     *
     * The drawer never had the bug because YearView resolves the card from the
     * entry itself before rendering. Desktop had no equivalent, so it is done
     * here, from the same entry, and both routes now show what was drawn.
     */
    const drawnCard = tarotDeck.find(c => c.id === entry.cardId);
    if (!drawnCard) return; // an id with no card behind it: leave the view alone

    const reversed = localStorage.getItem(`reversed-${date}`) === 'true';

    setCard(drawnCard);
    setDateString(date);
    setIsReversed(reversed);
    setIsRevealed(true);
    setViewingPastCard(true);

    // On desktop, navigate to card view
    // On mobile, the drawer will open (handled in YearView)
    if (window.innerWidth >= 768) {
      window.scrollTo({ top: 0, behavior: 'instant' });
      setCurrentView('card');
    }
  };

  const handleReset = () => {
    /*
     * Development only. Resets today and leaves history alone.
     *
     * "Today" is more than the card: the cached insight is keyed by card AND
     * date, so leaving it behind means the next draw can surface the previous
     * card's reading against a new card. The draw timestamp and today's entry
     * in the reading-day quota are the same kind of leftover — without them a
     * reset day still shows the old "drawn at" and still counts against the
     * seven free readings, which makes testing the quota impossible.
     *
     * Memory notes survive on purpose. They are the app's accumulated sense of
     * a person across many days, not a property of today, and wiping them here
     * would make every reset also a test of the cold-start prompt. Use the full
     * reset for that.
     */
    const today = localDateString();
    localStorage.removeItem('lastDrawDate');
    localStorage.removeItem('cardRevealed');
    localStorage.removeItem(`card-${today}`);
    localStorage.removeItem(`reversed-${today}`);
    localStorage.removeItem(`reflection-${today}`);
    localStorage.removeItem(`drawn-at-${today}`);
    localStorage.removeItem('testSeed'); // clean up old workaround

    // Cached insights are keyed insight-[cardId]-[date]; the card id is not
    // known here (it is about to be redrawn), so clear every insight for today.
    for (const key of Object.keys(localStorage)) {
      if (key.startsWith('insight-') && key.endsWith(`-${today}`)) {
        localStorage.removeItem(key);
      }
    }

    // Give today's free reading back, so the quota can be exercised repeatedly.
    try {
      const days = JSON.parse(localStorage.getItem('slow-garden-reading-days') || '[]');
      if (Array.isArray(days)) {
        localStorage.setItem(
          'slow-garden-reading-days',
          JSON.stringify(days.filter((d: unknown) => d !== today))
        );
      }
    } catch {
      // malformed quota store — leave it; the full reset clears it outright
    }

    // Reset view — next loadTodaysCard will draw a fresh random card
    setCurrentView('card');
    setIsRevealed(false);
    loadTodaysCard();
  };

  const handleFullReset = () => {
    // Clear everything including onboarding
    localStorage.clear();
    window.location.reload();
  };

  const generateRandomCards = () => {
    // Generate 60 random cards across the year
    const today = new Date();
    const year = today.getFullYear();
    const usedDates = new Set<number>();

    // Generate 60 unique random day numbers (0-364)
    while (usedDates.size < 60) {
      usedDates.add(Math.floor(Math.random() * 365));
    }

    // Convert to dates and save cards
    usedDates.forEach(dayOfYear => {
      const date = new Date(year, 0, dayOfYear + 1);
      const dateString = toLocalDateString(date);
      const randomCard = tarotDeck[Math.floor(Math.random() * tarotDeck.length)];
      const isReversed = Math.random() > 0.5;

      localStorage.setItem(`card-${dateString}`, randomCard.id);
      localStorage.setItem(`reversed-${dateString}`, isReversed.toString());
    });

    loadJournalEntries();
  };

  const handleOnboardingComplete = () => {
    setShowOnboarding(false);
    // Deliberately NOT auto-revealed. A new person lands on the sealed tear-off
    // page and pulls it themselves — that gesture is the product, and handing
    // them an already-open card skips the one thing the whole app is built on.
    loadTodaysCard(false);
    loadJournalEntries();
  };

  const handleSelectCard = (cardId: string, reversed: boolean) => {
    // Find the card in the deck
    const selectedCard = tarotDeck.find(c => c.id === cardId);
    if (selectedCard) {
      setCard(selectedCard);
      setIsReversed(reversed);
      setIsRevealed(true);
      setCurrentView('card');
      setDateString(localDateString());
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#172211] text-[#C9F24E]" style={{ minHeight: '100dvh' }}>
        <AsciiFlower label="loading slow garden" />
      </div>
    );
  }

  if (showOnboarding) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  return (
    <main className="min-h-screen flex flex-col bg-[#172211]" style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}>
      <GroundTexture />

      {/*
        No bar: no background or rule behind it, and no wordmark. A very faint blur fades in only while scrolled. Just the view buttons (today, year) and
        the save icon, floating over the page. The height is still measured below (--nav-h) so the content
        starts under them wherever they end up.
      */}
      <div ref={navRef} className="fixed top-0 left-0 right-0 z-40 pointer-events-none" style={{
        paddingTop: 'env(safe-area-inset-top, 0px)',
      }}>
        <ScrollVeil show={scrolled} />
        {/* Keeps the nav's measured height where the old row had it; the buttons themselves stack at the right and
            hang below it, so the page content is not pushed down by the stack. */}
        <div className="max-w-7xl mx-auto px-4 md:px-8 py-2 md:py-4" style={{ minHeight: 'clamp(46px, 7vw, 72px)' }}>
          {/* View Toggle Buttons */}
          <div className="absolute right-3 md:right-5 top-2 md:top-4 flex flex-col items-end gap-2 pointer-events-auto" role="navigation" aria-label="View switcher">
            <button
              type="button"
              className="md:hidden sg-osbtn flex items-center justify-center"
              style={{ width: 34, height: 34 }}
              aria-expanded={navOpen}
              aria-label={navOpen ? 'Close menu' : 'Open menu'}
              onClick={() => setNavOpen((o) => !o)}
            >
              <svg width="14" height="14" viewBox="0 0 14 14" fill="currentColor" aria-hidden="true">
                {navOpen ? (
                  <path d="M2 2l10 10M12 2L2 12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="square" fill="none" />
                ) : (
                  <>
                    <rect x="1" y="1" width="5" height="5" />
                    <rect x="8" y="1" width="5" height="5" />
                    <rect x="1" y="8" width="5" height="5" />
                    <rect x="8" y="8" width="5" height="5" />
                  </>
                )}
              </svg>
            </button>
            <div className={`${navOpen ? 'flex' : 'hidden'} md:flex flex-col items-end gap-2`} onClick={() => setNavOpen(false)}>
            <button
              onClick={() => {
                setViewingPastCard(false);
                window.scrollTo({ top: 0, behavior: 'instant' });
                setCurrentView('card');
              }}
              aria-pressed={currentView === 'card'}
              aria-label="View today's card"
              className="sg-osbtn px-3 md:px-5 py-1.5 md:py-2 w-[4.6rem] md:w-[5.4rem] text-center"
              style={{ ...LABEL_TYPE, fontSize: 'clamp(9px, 2.2vw, 11px)', letterSpacing: '0.16em' }}
            >
              today
            </button>
            <button
              onClick={() => setCurrentView('year')}
              aria-pressed={currentView === 'year'}
              aria-label="View year history"
              className="sg-osbtn px-3 md:px-5 py-1.5 md:py-2 w-[4.6rem] md:w-[5.4rem] text-center"
              style={{ ...LABEL_TYPE, fontSize: 'clamp(9px, 2.2vw, 11px)', letterSpacing: '0.16em' }}
            >
              year
            </button>

            <SaveStatus />

            {/* Development Reset Buttons */}
            {process.env.NODE_ENV === 'development' && (
              <div className="hidden md:flex gap-3">
                <button
                  onClick={handleReset}
                  className="px-3 py-1.5 rounded-full text-sm bg-[#172211] text-[#C9F24E] border border-[#C9F24E]/30 hover:border-[#C9F24E]/60 transition-all"
                  title="Reset today's card"
                  style={{ fontFamily: 'var(--font-dm-mono), ui-monospace, monospace' }}
                >
                  ↻
                </button>
                <button
                  onClick={generateRandomCards}
                  className="px-3 py-1.5 rounded-full text-xs bg-[#172211] text-[#C9F24E] border border-[#C9F24E]/30 hover:border-[#C9F24E]/60 transition-all"
                  title="Generate 60 random cards"
                  style={{ fontFamily: 'var(--font-dm-mono), ui-monospace, monospace' }}
                >
                  60
                </button>
                <button
                  onClick={handleFullReset}
                  className="px-3 py-1.5 rounded-full text-sm bg-[#172211] text-[#C9F24E] border border-[#C9F24E]/30 hover:border-[#C9F24E]/60 transition-all"
                  title="Full reset (including onboarding)"
                  style={{ fontFamily: 'var(--font-dm-mono), ui-monospace, monospace' }}
                >
                  🔄
                </button>
                <button
                  onClick={() => runScatterAnimation(() => {})}
                  disabled={isAnimating}
                  className="px-3 py-1.5 rounded-full text-xs bg-[#172211] text-[#C9F24E] border border-[#C9F24E]/30 hover:border-[#C9F24E]/60 transition-all disabled:opacity-40"
                  title="Preview scatter animation"
                  style={{ fontFamily: 'var(--font-dm-mono), ui-monospace, monospace' }}
                >
                  ✦
                </button>
              </div>
            )}
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="pt-safe-nav flex-1">
        {currentView === 'card' && card && (
          /* Less room above than below, and the same in both states.
             The reading opened a long way under the nav, with a band of empty
             ground that read as a gap rather than as margin. The top is now
             half what it was; the bottom keeps its depth so the page still
             ends on air rather than on an edge.

             Both states carry identical vertical padding on purpose. The
             sealed page holds the revealed page's exact layout open behind the
             tear-off — see the invisible CardName below — so a difference here
             would move the card at the moment of opening, which is the one
             moment it has to be still. */
          <div className={isRevealed ? 'pt-3 pb-6 md:pt-5 md:pb-10' : 'max-w-4xl mx-auto px-4 md:px-8 pt-3 pb-6 md:pt-5 md:pb-10'}>
            {/* Once revealed, the reading page governs its own measure
                (1080px), so the wrapper steps out of the way. Sealed, the
                tear-off still wants the narrow column. */}
            {/* Hidden rather than absent while sealed: it develops in with the
                rest of the page, and its space is already held so the card
                below it does not move when it appears. */}
            <div
              /* The page's own 8px top padding and the name's 4px margin are
                 already 12px of this gap, so this only carries the remainder:
                 12 on a phone, 20 on a desktop.

                 Nothing on a phone — the date belongs to the name under it, and
                 at the size the name takes there, 18px read as two separate
                 lines rather than a heading with its date. The desktop keeps
                 8px, where the name is large enough to want the air. */
              className="text-center md:mb-2"
              style={{ visibility: isRevealed ? 'visible' : 'hidden' }}
            >
              <p
                className="text-[#C9F24E]"
                /* The nav's own size, clamp(9px, 2.2vw, 11px) — the date and the
                   today/year buttons are both machine voice labelling the same
                   view, and the date being the larger of the two made it look
                   like a heading competing with the card's name. Its wider
                   tracking stays: it is a line of its own, not a pill. */
                style={{ fontSize: 'clamp(9px, 2.2vw, 11px)', letterSpacing: '0.18em', fontFamily: 'var(--font-dm-mono), ui-monospace, monospace' }}
              >
                {new Date(dateString + 'T00:00:00').toLocaleDateString('en-GB', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric'
                }).toLowerCase()}
              </p>
            </div>

            {/*
              The card name's space, held open before the tear.

              Once revealed the reading page puts the name above the card, which
              used to push the card down the screen at the moment of opening —
              the one moment it should be still. Rendering the real name here,
              invisible, reserves exactly its height for this card at this width,
              so the card sits where it will sit and the tear develops the page
              around it rather than moving it.

              It goes above the anchor, not inside: TearOffPage is absolute
              inset-0 within the anchor and centres itself there, so anything
              added inside would drag the calendar off the card.

              The shell, and its width, are both load-bearing.

              The reading measures itself against the shell — that element is
              the query container — and the real one is a child of the page,
              the full width of the window. This copy is inside the centred
              max-w-4xl column, which is 832px on a desktop where the reading
              gets 1397. Left alone it therefore asked a narrower container the
              same question and got the phone's answer: a 52px name reserving
              about 70px too little, a calendar sitting that much too high, and
              the card dropping to its real place the instant it was torn —
              exactly what this block exists to prevent.

              So the shell here is pinned to the viewport, which is what the
              real one resolves to. The overflow is hidden on the wrapper
              because a 100vw child of a padded, centred column hangs off the
              right of it; only the height of this thing is ever used.
            */}
            {!isRevealed && (
              <div aria-hidden="true" className="pointer-events-none overflow-hidden" style={{ visibility: 'hidden' }}>
                <div className={cardPage.shell} style={{ width: '100vw' }}>
                  <div className={cardPage.page}>
                    <div className={cardPage.col}>
                      <CardName name={card.name} />
                    </div>
                  </div>
                </div>
                {/* the plate's own margin above the card */}
                <div className="h-[18px] md:h-[26px]" />
              </div>
            )}

            {/* Card Display — ref wraps TarotCard so getBoundingClientRect gives exact card position.
                While unrevealed, the tear-off page covers the card; tearing it is the reveal. */}
            <div ref={cardAnchorRef} className="relative">
              <TarotCard
                card={card}
                isReversed={isReversed}
                isRevealed={isRevealed}
                animateReveal={animateReveal}
                // the tear page is covering the card, so put the real art
                // underneath it — tearing then uncovers the card itself
                artVisibleEarly={!isRevealed}
                userName={localStorage.getItem('userName') || undefined}
                cardDate={dateString}
                footer={isRevealed ? renderInputBlock() : undefined}
              />
              {!isRevealed && (
                <TearOffPage onTear={handleTearReveal} disabled={isAnimating} />
              )}
            </div>

            {/* Shuffle Animation Overlay — transforms driven entirely by JS refs, not React state */}
            {isAnimating && (
              <>
                <div style={{ position: 'fixed', inset: 0, background: 'rgba(23, 34, 17, 0.85)', zIndex: 99, pointerEvents: 'none' }} />
                <div style={{ position: 'fixed', inset: 0, zIndex: 100, pointerEvents: 'none', perspective: '420px', perspectiveOrigin: '50% 38%' }}>
                  <div ref={groupRotRef} style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    {shuffledImages.current.map((src, i) => {
                      const data = shuffleData.current[i] ?? { rotateZ: 0 };
                      const deckFan = (i / shuffledImages.current.length - 0.5) * 14;
                      const deckRz = Math.abs(data.rotateZ) > 90 ? 180 + deckFan : deckFan;
                      return (
                        <div
                          key={`${src}-${i}`}
                          ref={el => {
                            cardRefsRef.current[i] = el;
                            // Set initial transform via ref (not JSX style) so React re-renders can't reset it
                            if (el) el.style.transform = `translate3d(${convergeTarget.current.x}px, ${convergeTarget.current.y}px, 0px) rotateX(0deg) rotateY(0deg) rotateZ(${deckRz}deg)`;
                          }}
                          style={{ position: 'absolute', width: 'clamp(200px, 28vw, 320px)', aspectRatio: '2/3', zIndex: i }}
                        >
                          <div ref={el => { spinnerRefsRef.current[i] = el; }} style={{ width: '100%', height: '100%' }}>
                            <img src={src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '12px', display: 'block' }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {/* Cover overlay — fades IN while card reveals underneath */}
                <div style={{ position: 'fixed', inset: 0, zIndex: 101, pointerEvents: 'none', background: '#172211',
                  opacity: scatterFading ? 1 : 0, transition: scatterFading ? 'opacity 1.4s ease-in' : 'none' }} />
              </>
            )}

          </div>
        )}

        {currentView === 'year' && (
          <YearView
            year={new Date().getFullYear()}
            journalEntries={journalEntries}
            onDateClick={handleDateClick}
            onNavigateToToday={() => {
              setViewingPastCard(false);
              window.scrollTo({ top: 0, behavior: 'instant' });
              setCurrentView('card');
            }}
            currentDate={localDateString()}
          />
        )}
      </div>

      {shareOpen && card && (
        <ShareModal
          card={card}
          isReversed={isReversed}
          date={dateString ? new Date(`${dateString}T00:00:00`) : new Date()}
          drawnAt={typeof window !== 'undefined' ? localStorage.getItem(`drawn-at-${dateString}`) ?? undefined : undefined}
          onClose={() => setShareOpen(false)}
        />
      )}

      {/* Development Card Selector */}
      {process.env.NODE_ENV === 'development' && (
        <CardSelector onSelectCard={handleSelectCard} />
      )}
    </main>
  );
}
