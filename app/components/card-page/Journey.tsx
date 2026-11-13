'use client';

import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import styles from './card-page.module.css';

/**
 * The reading as one horizontal journey.
 *
 * Every category of the reading is a scene, each taking most of the screen, laid
 * end to end so the edge of the next is always showing. You move through them the
 * way you'd expect with nothing on screen to operate:
 *
 *   - a trackpad swipe or touch drag works natively
 *   - the mouse wheel glides it sideways continuously, and hands the wheel back to
 *     the page at either end
 *   - a mouse can click and drag it
 *
 * Nothing else is on screen but the scenes. Only laid out sideways on
 * the page surface (`.sheet`); a year-view window keeps the plain vertical stack,
 * where the scenes are just blocks.
 */
/** A square-ended arrow, pointing right and turned by `turn` degrees. */
function CueArrow({ turn }: { turn: number }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true" style={{ transform: `rotate(${turn}deg)` }}>
      <path d="M3 12h17M13 5l7 7-7 7" stroke="currentColor" strokeWidth="3.4" strokeLinecap="square" />
    </svg>
  );
}

export function Journey({ children, cue = true }: { children: ReactNode; /** Show the arrows that say which way there is more. Off while the leaf still covers the page. */ cue?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [more, setMore] = useState({ right: false, down: false });
  const seenRight = useRef(false);
  // once the reader has moved to another scene themselves, the right tab has done its job and does not come back (on this device)
  const markSeen = useCallback(() => {
    if (seenRight.current) return;
    seenRight.current = true;
    try { localStorage.setItem('sg-cue-seen-right', '1'); } catch { /* the tab just stays gone for this visit */ }
  }, []);
  useEffect(() => {
    try { seenRight.current = localStorage.getItem('sg-cue-seen-right') === '1'; } catch { /* first-time behaviour */ }
  }, []);

  // Which tab to show, one at a time, as the reader moves:
  //   - at rest on a scene that goes on below: the down tab; it goes as soon as they start scrolling down
  //   - at the foot of such a scene, or at rest on one that fits: the right tab; it goes as soon as they start moving right
  //     (or back up the scene)
  // Nothing shows while the strip is between two scenes.
  const measure = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    const scenes = Array.from(el.querySelectorAll<HTMLElement>(`.${styles.scene}`));
    if (!scenes.length) return;
    const at = scenes.reduce((best, sc) => (Math.abs(sc.offsetLeft - el.scrollLeft) < Math.abs(best.offsetLeft - el.scrollLeft) ? sc : best), scenes[0]);
    const atRest = Math.abs(at.offsetLeft - el.scrollLeft) < 8;
    const next = el.scrollLeft < el.scrollWidth - el.clientWidth - 12;
    const scrollable = at.scrollHeight > at.clientHeight + 12;
    const atTop = at.scrollTop < 8;
    const atBottom = at.scrollTop + at.clientHeight >= at.scrollHeight - 12;
    const down = atRest && scrollable && atTop;
    const right = !seenRight.current && atRest && next && (!scrollable || atBottom);
    setMore((m) => (m.right === right && m.down === down ? m : { right, down }));
  }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    measure();
    el.addEventListener('scroll', measure, { capture: true, passive: true });
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    const mo = new MutationObserver(measure);
    mo.observe(el, { childList: true, subtree: true });
    const t = window.setInterval(measure, 1200); // fonts, images and the reading arriving change heights without an event
    return () => {
      el.removeEventListener('scroll', measure, true);
      ro.disconnect();
      mo.disconnect();
      clearInterval(t);
    };
  }, [measure]);
  const goRight = () => {
    const el = ref.current;
    if (!el) return;
    const lefts = Array.from(el.querySelectorAll<HTMLElement>(`.${styles.scene}`)).map((s) => s.offsetLeft);
    const next = lefts.find((l) => l > el.scrollLeft + 8);
    if (next !== undefined) {
      markSeen();
      el.scrollTo({ left: next, behavior: 'smooth' });
    }
  };
  const goDown = () => {
    const el = ref.current;
    if (!el) return;
    const scenes = Array.from(el.querySelectorAll<HTMLElement>(`.${styles.scene}`));
    const at = scenes.reduce((best, sc) => (Math.abs(sc.offsetLeft - el.scrollLeft) < Math.abs(best.offsetLeft - el.scrollLeft) ? sc : best), scenes[0]);
    at.scrollBy({ top: at.clientHeight * 0.8, behavior: 'smooth' });
  };

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // The wheel glides the whole strip sideways, continuously: each tick pushes a target and the
    // strip eases toward it, so it carries on a moment after you stop, like a trackpad. Nothing
    // snaps to a scene. At either end the wheel goes back to the page.
    let target = el.scrollLeft;
    let raf = 0;
    const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const max = () => el.scrollWidth - el.clientWidth;
    const stop = () => {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
    };
    const glide = () => {
      const before = el.scrollLeft;
      const d = target - before;
      if (Math.abs(d) < 0.75) {
        stop();
        return;
      }
      el.scrollLeft = before + d * 0.14;
      // the end of the strip (or anything else) stopped it: let go rather than push forever
      if (Math.abs(el.scrollLeft - before) < 0.3) {
        stop();
        return;
      }
      raf = requestAnimationFrame(glide);
    };

    const onWheel = (e: WheelEvent) => {
      // a real sideways gesture (trackpad) already does the right thing
      if (Math.abs(e.deltaX) >= Math.abs(e.deltaY)) {
        stop();
        return;
      }
      if (!raf) target = el.scrollLeft;
      const direction = e.deltaY > 0 ? 1 : -1;
      if (direction > 0) markSeen();
      if ((direction < 0 && target <= 1) || (direction > 0 && target >= max() - 1)) return;
      e.preventDefault();
      const unit = e.deltaMode === 1 ? 32 : 1;
      target = Math.max(0, Math.min(max(), target + e.deltaY * unit * 1.1));
      if (reduced()) {
        el.scrollLeft = target;
        return;
      }
      if (!raf) raf = requestAnimationFrame(glide);
    };

    // The card scene fits the screen: if its contents run past the bottom it is scaled down just enough to sit inside it.
    // Every other scene is as tall as its words and scrolls up and down inside itself.
    let fitRaf = 0;
    const fitAll = () => {
      fitRaf = 0;
      el.querySelectorAll<HTMLElement>(`.${styles.sceneHero}`).forEach((scene) => {
        const stack = scene.firstElementChild as HTMLElement | null;
        if (!stack) return;
        stack.style.zoom = '';
        stack.style.width = '';
        stack.style.height = '';
        if (stack.scrollHeight <= stack.clientHeight + 1) return;
        for (let z = 0.96; z > 0.4; z -= 0.04) {
          stack.style.zoom = String(z);
          stack.style.width = `${100 / z}%`;
          stack.style.height = `${100 / z}%`;
          if (stack.scrollHeight <= stack.clientHeight + 1) break;
        }
      });
    };
    const queueFit = () => {
      if (!fitRaf) fitRaf = requestAnimationFrame(fitAll);
    };
    queueFit();
    const ro = new ResizeObserver(queueFit);
    ro.observe(el);
    const mo = new MutationObserver(queueFit);
    mo.observe(el, { childList: true, subtree: true, characterData: true });
    window.addEventListener('resize', queueFit);

    let startX = 0;
    let startLeft = 0;
    let dragging = false;
    let moved = false;

    const onDown = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse' || e.button !== 0) return;
      // leave the writing box, links and buttons alone
      if ((e.target as HTMLElement).closest('textarea, input, button, a, summary, select')) return;
      dragging = true;
      moved = false;
      startX = e.clientX;
      startLeft = el.scrollLeft;
    };
    const onMove = (e: PointerEvent) => {
      if (!dragging) return;
      const dx = e.clientX - startX;
      if (!moved && Math.abs(dx) < 4) return;
      if (!moved) {
        moved = true;
        el.classList.add(styles.dragging);
      }
      el.scrollLeft = startLeft - dx;
    };
    const onUp = () => {
      if (!dragging) return;
      if (moved && el.scrollLeft > startLeft + 8) markSeen();
      dragging = false;
      el.classList.remove(styles.dragging);
    };
    // a drag that moved is not a click
    const onClick = (e: MouseEvent) => {
      if (moved) {
        e.preventDefault();
        e.stopPropagation();
        moved = false;
      }
    };

    // On a touch screen one swipe moves exactly one scene. The strip follows the finger while it is down; when it lifts, a
    // flick or a drag of more than a thumb's width goes on to the next scene (or back to the last), and anything shorter
    // settles where it was. Vertical swipes are left to the scene, which scrolls up and down on its own.
    const touchScreen = window.matchMedia('(pointer: coarse)').matches;
    let tx = 0;
    let ty = 0;
    let tl = 0;
    let tt = 0;
    let axis: '' | 'x' | 'y' = '';
    let dxNow = 0;
    const sceneLefts = () => Array.from(el.querySelectorAll<HTMLElement>(`.${styles.scene}`)).map((s) => s.offsetLeft);
    const nearest = (lefts: number[], x: number) => lefts.reduce((best, l, i) => (Math.abs(l - x) < Math.abs(lefts[best] - x) ? i : best), 0);
    const onTouchStart = (e: TouchEvent) => {
      if (!touchScreen || e.touches.length !== 1) return;
      stop();
      tx = e.touches[0].clientX;
      ty = e.touches[0].clientY;
      tl = el.scrollLeft;
      tt = performance.now();
      axis = '';
      dxNow = 0;
    };
    const onTouchMove = (e: TouchEvent) => {
      if (!touchScreen || e.touches.length !== 1) return;
      const dx = e.touches[0].clientX - tx;
      const dy = e.touches[0].clientY - ty;
      if (!axis && (Math.abs(dx) > 8 || Math.abs(dy) > 8)) axis = Math.abs(dx) > Math.abs(dy) * 1.2 ? 'x' : 'y';
      if (axis !== 'x') return;
      dxNow = dx;
      el.classList.add(styles.swiping);
      el.scrollLeft = tl - dx;
    };
    const onTouchEnd = () => {
      if (!touchScreen || axis !== 'x') return;
      axis = '';
      const lefts = sceneLefts();
      const from = nearest(lefts, tl);
      const v = dxNow / Math.max(1, performance.now() - tt); // px per ms, negative = towards the next scene
      let to = from;
      if (dxNow < -40 || v < -0.35) to = from + 1;
      else if (dxNow > 40 || v > 0.35) to = from - 1;
      to = Math.max(0, Math.min(lefts.length - 1, to));
      el.classList.remove(styles.swiping);
      if (to > from) markSeen();
      el.scrollTo({ left: lefts[to], behavior: reduced() ? 'auto' : 'smooth' });
    };
    el.addEventListener('touchstart', onTouchStart, { passive: true });
    el.addEventListener('touchmove', onTouchMove, { passive: true });
    el.addEventListener('touchend', onTouchEnd, { passive: true });
    el.addEventListener('touchcancel', onTouchEnd, { passive: true });

    el.addEventListener('wheel', onWheel, { passive: false });
    // a finger or a click takes the strip back from the glide
    el.addEventListener('touchstart', stop, { passive: true });
    el.addEventListener('pointerdown', stop);
    el.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    el.addEventListener('click', onClick, true);
    return () => {
      cancelAnimationFrame(fitRaf);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('resize', queueFit);
      stop();
      el.removeEventListener('touchstart', stop);
      el.removeEventListener('touchstart', onTouchStart);
      el.removeEventListener('touchmove', onTouchMove);
      el.removeEventListener('touchend', onTouchEnd);
      el.removeEventListener('touchcancel', onTouchEnd);
      el.removeEventListener('pointerdown', stop);
      el.removeEventListener('wheel', onWheel);
      el.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
      el.removeEventListener('click', onClick, true);
    };
  }, []);

  return (
    <>
      <div ref={ref} className={styles.journey} tabIndex={0} role="region" aria-label="The reading. Scroll sideways.">
        <div className={styles.track}>{children}</div>
      </div>
      {/* two paper tabs in the lime of the pull tab on the leaf: one hangs off the foot of the screen when there is more of this
          scene below, one off the right edge when there is another scene beside it */}
      {cue && more.down && (
        <button type="button" className={styles.tabDown} onClick={goDown} aria-label="Scroll down">
          <span>scroll</span>
          <CueArrow turn={90} />
        </button>
      )}
      {cue && more.right && (
        <button type="button" className={styles.tabRight} onClick={goRight} aria-label="Next section">
          <CueArrow turn={0} />
        </button>
      )}
    </>
  );
}

/**
 * One scene of the journey: a small label at the top, the scene's one hero in the
 * middle. Every scene is built the same way, so they read as one thing. `hero` is the opening scene, the card.
 */
export function Scene({ children, hero = false, name, hint }: { children: ReactNode; hero?: boolean; name?: string; hint?: string }) {
  return (
    <section className={`${styles.scene} ${hero ? styles.sceneHero : ''}`}>
      {/* the label and the hero are one centred group, so there is no dead space between them */}
      <div className={styles.sceneStack}>
        {name && <div className={styles.sceneLabel}>{name}</div>}
        {hint && <div className={styles.sceneHint}>{hint}</div>}
        {children}
      </div>
    </section>
  );
}
