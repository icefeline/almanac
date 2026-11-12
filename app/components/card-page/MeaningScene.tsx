'use client';

import { useLayoutEffect, useRef } from 'react';
import styles from './card-page.module.css';
import { emphasise } from './emphasise';
import { poemLines } from '@/lib/utils/poem';

/**
 * The card's meaning set the way a poem is on a page: short lines flush left in
 * stanzas (a stanza per sentence), in columns that fill the whole screen. The type
 * is fitted — the largest size at which all of it still sits inside the page — so a
 * short meaning is set huge and a long one smaller, and either way it fills the
 * page. The words that echo the card's keywords are in the accent. Nothing is added
 * or reworded.
 */
export function MeaningScene({ lede, terms }: { lede: string; terms: string[]; seed?: string }) {
  const lines = poemLines(lede, lede);
  const ref = useRef<HTMLParagraphElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      let lo = 16;
      let hi = 240;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        el.style.fontSize = `${mid}px`;
        // columns fill to the page's height, then spill sideways: that is "too big"
        if (el.scrollWidth <= el.clientWidth + 1) lo = mid;
        else hi = mid;
      }
      el.style.fontSize = `${lo}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [lede]);

  return (
    <section className={styles.meaningScene}>
      <p ref={ref} className={styles.poem}>
        {lines.map((line, i) => (
          <span key={i} className={`${styles.poemLine} ${line.gap ? styles.poemGap : ''}`}>
            {emphasise(line.text, terms)}
          </span>
        ))}
      </p>
    </section>
  );
}

export default MeaningScene;
