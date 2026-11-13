import type { ReactNode } from 'react';
import styles from './card-page.module.css';

/**
 * Picks out, in colour, the words in a passage that echo the card.
 *
 * Magazines point at the words that matter by changing how they are set. Here the
 * words that matter are the ones that tie the page together: wherever the reading
 * (or the meaning) uses a word the card's own keywords or the key phrase
 * already used, it is set in the accent. Nothing is added or reworded — the text is
 * the text, split around the matches — and a match is a plain word-stem, so
 * "confusion" picks up "confused" and nothing cleverer than that.
 */

const SKIP = new Set(['about', 'their', 'there', 'where', 'which', 'would', 'could', 'these', 'those', 'being', 'through', 'before', 'after', 'while', 'other']);

export function stemsOf(terms: string[]): string[] {
  const out = new Set<string>();
  for (const term of terms) {
    for (const word of term.toLowerCase().split(/[^a-z]+/)) {
      if (word.length < 5 || SKIP.has(word)) continue;
      out.add(word.slice(0, Math.max(4, Math.min(6, word.length - 2))));
    }
  }
  return [...out];
}

export function emphasise(text: string, terms: string[]): ReactNode[] {
  const stems = stemsOf(terms);
  if (stems.length === 0 || !text) return [text];
  const pattern = new RegExp(`\\b((?:${stems.join('|')})[a-z]*)`, 'gi');
  return text.split(pattern).map((part, i) =>
    i % 2 === 1 ? (
      <span key={i} className={styles.hl}>
        {part}
      </span>
    ) : (
      part
    ),
  );
}

/** The first sentence, set larger as a lead-in, then the rest at body size. */
export function withLead(text: string, terms: string[]): ReactNode {
  const match = /^(.+?[.!?])(\s+)([\s\S]*)$/.exec(text.trim());
  if (!match) return <span className={styles.lead}>{emphasise(text, terms)}</span>;
  return (
    <>
      <span className={styles.lead}>{emphasise(match[1], terms)}</span>
      {match[2]}
      {emphasise(match[3], terms)}
    </>
  );
}

/**
 * The reading set as short paragraphs: the same words, in the same order, broken after every second sentence (or sooner when
 * a paragraph has already run long), the first sentence of the first paragraph set larger as the lead-in. A long unbroken
 * block is hard to read in a narrow column; the breaks give the eye somewhere to rest.
 */
export function withParagraphs(text: string, terms: string[]): ReactNode {
  const sentences = text.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
  const paras: string[][] = [];
  let cur: string[] = [];
  for (const sentence of sentences) {
    cur.push(sentence);
    if (cur.length >= 2 || cur.join(' ').length >= 170) {
      paras.push(cur);
      cur = [];
    }
  }
  if (cur.length) paras.push(cur);
  return paras.map((para, i) => (
    <span key={i} className={styles.para}>
      {i === 0 ? (
        <>
          <span className={styles.lead}>{emphasise(para[0], terms)}</span>
          {para.length > 1 ? ' ' : ''}
          {emphasise(para.slice(1).join(' '), terms)}
        </>
      ) : (
        emphasise(para.join(' '), terms)
      )}
    </span>
  ));
}
