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
    return followParentTheme();
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
