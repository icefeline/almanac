'use client';

import { useEffect, useRef, type ReactNode } from 'react';
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
export function Journey({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

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

    // Every scene fits the screen: if one's contents run past the bottom, the whole scene is
    // scaled down just enough to sit inside it. Nothing is ever scrolled to.
    let fitRaf = 0;
    const fitAll = () => {
      fitRaf = 0;
      el.querySelectorAll<HTMLElement>(`.${styles.scene}`).forEach((scene) => {
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
    <div ref={ref} className={styles.journey} tabIndex={0} role="region" aria-label="The reading. Scroll sideways.">
      <div className={styles.track}>{children}</div>
    </div>
  );
}

/**
 * One scene of the journey: a small label at the top, the scene's one hero in the
 * middle. Every scene is built the same way, so they read as one thing. `hero` is the opening scene, the card.
 */
export function Scene({ children, hero = false, name }: { children: ReactNode; hero?: boolean; name?: string }) {
  return (
    <section className={`${styles.scene} ${hero ? styles.sceneHero : ''}`}>
      {/* the label and the hero are one centred group, so there is no dead space between them */}
      <div className={styles.sceneStack}>
        {name && <div className={styles.sceneLabel}>{name}</div>}
        {children}
      </div>
    </section>
  );
}
