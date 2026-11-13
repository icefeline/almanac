'use client';

import { useEffect, useRef, useState } from 'react';
import styles from './card-page.module.css';
import { tarotDeck } from '@/lib/data/tarot-deck';

/**
 * The card's keywords, set on arcs around it like the rings of words in the
 * vellum reference: the ones that describe how the card came up today sit close
 * and crisp, and the ones from its other side sit further out, ghosted and
 * mirrored, the way type printed on the back of a sheet shows through.
 *
 * Both sets are the deck's own words — the near ring is `activeKeywords`, the
 * far ring is the same card the other way up — so nothing is invented.
 *
 * It spins. When the card arrives — and again whenever you come back to it or click
 * it — every word is its own wheel: it whirls round the card on its own track, cycling
 * through other cards' keywords, and slows and stops at its own moment, reading as the
 * right word only as it nearly stops, like the reels of a fruit machine settling. Reduced motion skips it and shows the
 * words. Drawn in card-relative units (the card is 100 wide, 150
 * tall, centred on the origin) and sized as a multiple of the card, so the ring
 * grows and shrinks with it. Only shown where the page is wide; below 880px the
 * plain keyword list takes over, since a ring twice the card's width does not fit
 * a phone.
 */

const RAD = Math.PI / 180;

// [rx, ry] for each lane. Words alternate lanes so neighbours never share a path.
// The card is 100 wide, so at the angles words sit the arc must still clear x = ±50.
const NEAR: [number, number][] = [
  [70, 92],
  [80, 101],
];
const FAR: [number, number][] = [
  [92, 108],
  [102, 117],
];

// where each word sits on its arc, in degrees clockwise from east. Right-hand
// words read downward and left-hand words read upward, so their tops always
// face outward.
const NEAR_SLOTS = [-21, 3, 32, 152, 207];
const FAR_SLOTS = [-28, 10, 34, 150, 205];

function arc(rx: number, ry: number, centre: number, half = 32): string {
  const p = (deg: number) => `${(rx * Math.cos(deg * RAD)).toFixed(2)} ${(ry * Math.sin(deg * RAD)).toFixed(2)}`;
  return `M ${p(centre - half)} A ${rx} ${ry} 0 0 1 ${p(centre + half)}`;
}

/** Longer words get a smaller face so they stay inside their own stretch of arc. */
function size(word: string): number {
  return Math.min(6.4, 58 / (word.length * 0.7));
}

// every keyword in the deck, for the words to tumble through
const POOL = Array.from(new Set(tarotDeck.flatMap((c) => [...c.uprightKeywords, ...c.reversedKeywords])));
const pick = () => POOL[Math.floor(Math.random() * POOL.length)];

export function KeywordRing({ near, far }: { near: string[]; far: string[] }) {
  const inner = near.slice(0, 5);
  const outer = far.slice(0, 5);
  const svgRef = useRef<SVGSVGElement>(null);
  const [spin, setSpin] = useState<{ near: string[]; far: string[]; nearA: number[]; farA: number[] } | null>(null);
  const key = `${inner.join('|')}~${outer.join('|')}`;

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let raf = 0;

    const start = () => {
      cancelAnimationFrame(raf);
      const t0 = performance.now();
      // every word is its own wheel: its own number of turns, its own direction and its own
      // moment of stopping, the near ring first and the far ring a little after
      const wheel = (i: number, base: number) => ({
        dur: base + i * 430 + Math.random() * 350,
        turns: 3 + Math.floor(Math.random() * 3),
        dir: Math.random() < 0.5 ? 1 : -1,
      });
      const wn = inner.map((_, i) => wheel(i, 1700));
      const wf = outer.map((_, i) => wheel(i, 2000));
      const total = Math.max(...wn.map((w) => w.dur), ...wf.map((w) => w.dur));
      const lastTick: number[] = [];
      const shown: Record<string, string> = {};
      const state = (w: { dur: number; turns: number; dir: number }, key: string, word: string, t: number) => {
        const p = Math.min(1, t / w.dur);
        // fast at first, then slowing hard until it stops
        const angle = w.dir * w.turns * 360 * Math.pow(1 - p, 4);
        // it is gibberish while it is moving fast, and reads as itself as it nearly stops
        const interval = 55 + 240 * p;
        if (p >= 0.82) shown[key] = word;
        else if (t - (lastTick as unknown as Record<string, number>)[key] > interval || shown[key] === undefined) {
          shown[key] = pick();
          (lastTick as unknown as Record<string, number>)[key] = t;
        }
        return { angle, text: shown[key] };
      };
      const loop = (now: number) => {
        const t = now - t0;
        const n = inner.map((word, i) => state(wn[i], `n${i}`, word, t));
        const f = outer.map((word, i) => state(wf[i], `f${i}`, word, t));
        setSpin({
          near: n.map((o) => o.text),
          far: f.map((o) => o.text),
          nearA: n.map((o) => o.angle),
          farA: f.map((o) => o.angle),
        });
        if (t < total) raf = requestAnimationFrame(loop);
        else setSpin(null);
      };
      raf = requestAnimationFrame(loop);
    };

    // spin whenever the card scene comes (back) into view, and when the card is clicked
    const host = svg.parentElement;
    let wasIn = false;
    const observer = new IntersectionObserver(
      ([entry]) => {
        const nowIn = entry.isIntersecting && entry.intersectionRatio > 0.6;
        if (nowIn && !wasIn) start();
        wasIn = nowIn;
      },
      { threshold: [0, 0.6] },
    );
    if (host) {
      observer.observe(host);
      host.addEventListener('click', start);
    }
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      host?.removeEventListener('click', start);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  if (inner.length === 0) return null;
  const shownNear = spin ? spin.near : inner;
  const shownFar = spin ? spin.far : outer;

  return (
    <svg
      ref={svgRef}
      className={styles.ring}
      viewBox="-114 -128 228 256"
      role="img"
      aria-label={`Keywords: ${inner.join(', ')}`}
      focusable="false"
    >
      <defs>
        <filter id="ring-soft" x="-5%" y="-5%" width="110%" height="110%">
          <feGaussianBlur stdDeviation="0.22" />
        </filter>
      </defs>

      <g>
      {/* the back of the sheet: mirrored, faint, a little out of focus */}
      <g transform="scale(-1 1)" className={styles.ringFar} filter="url(#ring-soft)" aria-hidden="true">
        {shownFar.map((word, i) => {
          const [rx, ry] = FAR[i % FAR.length];
          const id = `ring-far-${i}`;
          return (
            <g key={i} transform={`rotate(${(spin?.farA?.[i] ?? 0).toFixed(2)})`}>
              <path id={id} d={arc(rx, ry, FAR_SLOTS[i])} fill="none" />
              <text fontSize={size(word)}>
                <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
                  {word.toUpperCase()}
                </textPath>
              </text>
            </g>
          );
        })}
      </g>

      {/* the front: crisp ink */}
      <g className={styles.ringNear}>
        {shownNear.map((word, i) => {
          const [rx, ry] = NEAR[i % NEAR.length];
          const id = `ring-near-${i}`;
          return (
            <g key={i} transform={`rotate(${(spin?.nearA?.[i] ?? 0).toFixed(2)})`}>
              <path id={id} d={arc(rx, ry, NEAR_SLOTS[i])} fill="none" />
              <text fontSize={size(word)}>
                <textPath href={`#${id}`} startOffset="50%" textAnchor="middle">
                  {word.toUpperCase()}
                </textPath>
              </text>
            </g>
          );
        })}
      </g>
      </g>
    </svg>
  );
}

export default KeywordRing;
