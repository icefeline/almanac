'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TarotCard from '../../components/TarotCard';
import { tarotDeck } from '@/lib/data/tarot-deck';
import { styles as cardPage } from '../../components/card-page';
import type { TarotCard as TarotCardType } from '@/lib/types/tarot';

/**
 * A past day's reading, on its own, for the year view's windows to show in a frame.
 *
 * The reading is built against the size of the screen it is on (viewport units all through it), so the one way
 * to give a window the real layout, phone or wide, is to put it in a document whose screen is the window. This is
 * that document: the same reading the page shows, with nothing around it, on a see-through ground so the window's
 * own paper shows behind it. The look of the hour (day or night, the accent) is copied from the page that
 * opened it, and kept in step.
 */
const THEME_VARS = ['--accent-c', '--on-accent-c', '--lime-c', '--chip-ink'];

function followParentTheme() {
  let parentRoot: HTMLElement | null = null;
  try {
    parentRoot = window.parent !== window ? window.parent.document.documentElement : null;
  } catch {
    parentRoot = null;
  }
  if (!parentRoot) return () => {};
  const root = document.documentElement;
  const copy = () => {
    const cs = getComputedStyle(parentRoot!);
    for (const v of THEME_VARS) {
      const val = cs.getPropertyValue(v).trim();
      if (val) root.style.setProperty(v, val);
    }
    if (parentRoot!.hasAttribute('data-night')) root.setAttribute('data-night', '');
    else root.removeAttribute('data-night');
  };
  copy();
  const mo = new MutationObserver(copy);
  mo.observe(parentRoot, { attributes: true, attributeFilter: ['style', 'data-night'] });
  return () => mo.disconnect();
}

export default function ReadingEmbed() {
  const { date } = useParams<{ date: string }>();
  const [state, setState] = useState<{ card: TarotCardType; reversed: boolean; note: string | null } | null | undefined>(undefined);

  useEffect(() => {
    document.documentElement.setAttribute('data-embed', '');
    const stopFollowing = followParentTheme();
    // The strip should open on the card. While the page settles (fonts, the card art, the shrink-to-fit, the
    // insight arriving) something moves it on to another scene, so until the reader touches it, it is held at the start.
    let touched = false;
    const touch = () => { touched = true; };
    window.addEventListener('pointerdown', touch);
    window.addEventListener('wheel', touch, { passive: true });
    window.addEventListener('touchstart', touch, { passive: true });
    window.addEventListener('keydown', touch);
    const hold = (e: Event) => {
      const el = e.target as HTMLElement;
      if (!touched && el.getAttribute?.('role') === 'region' && el.scrollLeft !== 0) el.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
    };
    document.addEventListener('scroll', hold, true);
    // ...and put back at the start now and as the page settles, in case it moved before there was a scroll to hear
    const home = () => {
      const el = document.querySelector<HTMLElement>('[role="region"]');
      if (!touched && el && el.scrollLeft !== 0) el.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
    };
    const timers = [0, 150, 400, 900, 1800, 3000, 5000].map((ms) => window.setTimeout(home, ms));
    return () => {
      timers.forEach(clearTimeout);
      stopFollowing();
      document.removeEventListener('scroll', hold, true);
      window.removeEventListener('pointerdown', touch);
      window.removeEventListener('wheel', touch);
      window.removeEventListener('touchstart', touch);
      window.removeEventListener('keydown', touch);
    };
  }, []);

  useEffect(() => {
    try {
      const id = localStorage.getItem(`card-${date}`);
      const card = id ? tarotDeck.find((c) => c.id === id) : undefined;
      if (!card) {
        setState(null);
        return;
      }
      setState({
        card,
        reversed: localStorage.getItem(`reversed-${date}`) === 'true',
        note: localStorage.getItem(`reflection-${date}`),
      });
    } catch {
      setState(null);
    }
  }, [date]);

  if (!state) return state === null ? <p style={{ padding: 24, fontFamily: 'var(--font-dm-mono), monospace' }}>nothing drawn that day</p> : null;

  return (
    <>
      <style>{`html, body { background: transparent !important; } body { overflow: hidden; }`}</style>
      <TarotCard
        card={state.card}
        isReversed={state.reversed}
        isRevealed
        cardDate={date}
        footer={
          state.note && state.note.trim() ? (
            <section className={`${cardPage.col} ${cardPage.input}`}>
              <div className={cardPage.prompt}>&gt; YOUR_THOUGHTS</div>
              <div className={cardPage.entry}>{state.note}</div>
            </section>
          ) : undefined
        }
      />
    </>
  );
}
