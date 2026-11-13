'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import styles from './card-page.module.css';
import { TrackingOverlay } from './TrackingOverlay';

export interface Blob {
  n: number;
  x: number;
  y: number;
  rad: number;
  share: number;
  note: string;
  tier: 'top' | 'heart' | 'base';
  verb: string;
  /** The note's silhouette, a path in a 100-wide box centred on the origin. */
  shape: string;
  /** How the note might help, in a short line under the blob. */
  caption: string;
  /** What the note calls up: a scene the smell belongs to. */
  calls: string;
  /** What the note gives, in a line. */
  gives: string;
  /** How it speaks to this card. */
  tie: string;
}

const W = 1000;
const H = 1000;
const ACCENT = 'var(--accent-c, #2B35D6)';
const LIME = 'var(--lime-c, #C9F24E)';

/** The colour of each stage of the scent: the fast ones cool, the slow ones deep. */
const TIER_COLOUR = { top: 'var(--accent-c, #2B35D6)', heart: '#D6368F', base: '#7B4FD6' } as const;

/**
 * How each stage of a scent moves, because it is how it behaves: top notes evaporate
 * first, so they shake and wander; the heart sways; the base is heavy and barely moves,
 * and is hardest to pick up.
 */
const VOLATILITY = {
  top: { amp: 28, freq: 0.9, tremor: 1.9, mass: 1 },
  heart: { amp: 14, freq: 0.5, tremor: 0.7, mass: 1.7 },
  base: { amp: 5, freq: 0.22, tremor: 0.18, mass: 3 },
} as const;

/** Breaks a caption into short lines of an SVG's width. */
function wrap(text: string, max = 24, lines = 3): string[] {
  const words = text.split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length > max && cur) {
      out.push(cur);
      cur = w;
    } else {
      cur = (cur + ' ' + w).trim();
    }
  }
  if (cur) out.push(cur);
  if (out.length > lines) {
    const kept = out.slice(0, lines);
    kept[lines - 1] += '…';
    return kept;
  }
  return out;
}

/**
 * The scent notes, tracked.
 *
 * Every note is a blob in its own silhouette — a leaf, a citrus, a blade of vetiver —
 * boxed and tagged by the tracker that follows it, carrying its slice of the card's
 * memory. A line walks from note to note in the order the scent unfolds, top to
 * heart to base, with a pulse running along it. They are alive: each moves the way its
 * stage of the scent does (see VOLATILITY), can be picked up and thrown, and pushes its
 * neighbours aside. Touch one — here or in the list beside it — to read what it gives you.
 * Everything moves directly on the SVG, not through React, so it stays smooth; under
 * reduced motion it is the still drawing.
 */
export function BlobField({ blobs: raw, tierY }: { blobs: Blob[]; tierY: Record<string, number> }) {
  const svgRef = useRef<SVGSVGElement>(null);
  // On a tall screen the field is cropped to the screen's own shape, so the notes fill it
  // instead of sitting small in a square. `aspect` is the field's width over its height.
  const [aspect, setAspect] = useState(1);
  // how many drawing units one screen pixel is: the labels are sized in screen pixels times this, so they stay readable however small the field is drawn
  const [unit, setUnit] = useState(1);
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    const read = () => {
      const r = svg.getBoundingClientRect();
      if (r.width > 0 && r.height > 0) {
        setAspect(r.width / r.height);
        setUnit(H / r.height);
      }
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(svg);
    return () => ro.disconnect();
  }, []);
  // on a tall phone the notes sit between the heading and the floating pill, not under them
  const mapY = (y: number) => H * (0.07 + ((y / H - 0.16) / 0.68) * 0.72);
  const vw = aspect < 1 ? Math.round(H * aspect) : W;
  const vx = (W - vw) / 2;
  // pull the notes' homes in so they all sit inside what is visible
  const blobs = useMemo(() => {
    const k = vw < W ? Math.min(1, (vw * 0.82) / 600) : 1;
    const r = vw < W ? 0.6 : 1;
    return raw.map((b) => ({ ...b, x: W / 2 + (b.x - W / 2) * k, y: vw < W ? mapY(b.y) : b.y, rad: b.rad * r }));
  }, [raw, vw]);
  const cores = useRef<(SVGPathElement | null)[]>([]);
  const bodies = useRef<(SVGGElement | null)[]>([]);
  const segs = useRef<(SVGPathElement | null)[]>([]);
  const pulse = useRef<SVGCircleElement>(null);
  const [sel, setSel] = useState(-1);
  const picked = sel >= 0 ? blobs[sel] : null;
  const cardRef = useRef<HTMLDivElement>(null);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  // with a mouse, the reading follows the cursor once a note is picked; on touch it stays in its corner
  useEffect(() => {
    const track = (e: PointerEvent) => { lastPointer.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener('pointermove', track, { passive: true });
    window.addEventListener('pointerdown', track, { passive: true });
    return () => {
      window.removeEventListener('pointermove', track);
      window.removeEventListener('pointerdown', track);
    };
  }, []);

  // put the reading away: Escape, or a press anywhere that is not a note
  useEffect(() => {
    if (sel < 0) return;
    const away = (e: PointerEvent) => {
      const t = e.target as Element | null;
      if (t?.closest?.('[role="button"][aria-label$="what it gives."]')) return;
      if (cardRef.current?.contains(t)) return;
      setSel(-1);
    };
    const esc = (e: KeyboardEvent) => { if (e.key === 'Escape') setSel(-1); };
    window.addEventListener('pointerdown', away);
    window.addEventListener('keydown', esc);
    return () => {
      window.removeEventListener('pointerdown', away);
      window.removeEventListener('keydown', esc);
    };
  }, [sel]);

  useEffect(() => {
    const card = cardRef.current;
    const parent = card?.offsetParent as HTMLElement | null;
    if (!card || !parent || !picked) return;
    if (!window.matchMedia('(pointer: fine)').matches || window.innerWidth <= 760) return;
    const place = () => {
      const p = lastPointer.current;
      if (!p) return;
      const pr = parent.getBoundingClientRect();
      const k = parent.offsetWidth ? pr.width / parent.offsetWidth : 1;
      const px = (p.x - pr.left) / k;
      const py = (p.y - pr.top) / k;
      const w = card.offsetWidth;
      const h = card.offsetHeight;
      let x = px + 20;
      let y = py + 20;
      if (x + w > parent.offsetWidth - 8) x = px - 20 - w;
      if (y + h > parent.offsetHeight - 8) y = py - 20 - h;
      card.style.left = `${Math.max(8, x)}px`;
      card.style.top = `${Math.max(8, y)}px`;
      card.style.bottom = 'auto';
    };
    card.style.transition = 'left .12s ease-out, top .12s ease-out';
    place();
    window.addEventListener('pointermove', place, { passive: true });
    return () => {
      window.removeEventListener('pointermove', place);
      card.style.left = card.style.top = card.style.bottom = card.style.transition = '';
    };
  }, [picked]);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    const sim = blobs.map((b) => ({ x: b.x, y: b.y, vx: 0, vy: 0, phase: b.n * 1.7 }));
    const pointer = { x: 0, y: 0 };
    // each wire has a rest length a little longer than the gap between homes, so it hangs slack;
    // a note can be pulled a long way, but only to the end of its wires
    const rest = blobs.slice(0, -1).map((b, i) => Math.hypot(blobs[i + 1].x - b.x, blobs[i + 1].y - b.y) * 1.22);
    const MAX_PULL = 460;
    // a coiled cord: this many turns per wire, drawn as loops that open up as the cord is stretched
    const turns = rest.map((r) => Math.max(7, Math.round(r / 17)));
    const LOOP = 9;
    let drag = -1;
    let hover = -1;
    let travelled = 0;
    let visible = true;
    let raf = 0;

    const toSvg = (e: PointerEvent) => {
      const pt = svg.createSVGPoint();
      pt.x = e.clientX;
      pt.y = e.clientY;
      const m = svg.getScreenCTM();
      const p = m ? pt.matrixTransform(m.inverse()) : { x: 0, y: 0 };
      return { x: p.x, y: p.y };
    };

    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      if (!visible) return;
      const t = now / 1000;

      for (let i = 0; i < blobs.length; i++) {
        const b = blobs[i];
        const s = sim[i];
        const v = VOLATILITY[b.tier];
        if (i === drag) {
          let px = pointer.x;
          let py = pointer.y;
          const hx = px - b.x;
          const hy = py - b.y;
          const hd = Math.hypot(hx, hy);
          if (hd > MAX_PULL) { px = b.x + (hx / hd) * MAX_PULL; py = b.y + (hy / hd) * MAX_PULL; }
          s.vx = ((px - s.x) * 0.4) / v.mass;
          s.vy = ((py - s.y) * 0.4) / v.mass;
        } else {
          // home, wandering around it at this stage's own pace
          const tx = b.x + Math.sin(t * v.freq + s.phase) * v.amp;
          const ty = b.y + Math.cos(t * v.freq * 0.86 + s.phase * 1.3) * v.amp - (b.tier === 'top' ? Math.abs(Math.sin(t * 0.35 + s.phase)) * 10 : 0);
          s.vx += ((tx - s.x) * 0.045) / v.mass;
          s.vy += ((ty - s.y) * 0.045) / v.mass;
        }
        for (let j = i + 1; j < blobs.length; j++) {
          const o = sim[j];
          const dx = s.x - o.x;
          const dy = s.y - o.y;
          const d = Math.hypot(dx, dy) || 0.01;
          const min = (b.rad + blobs[j].rad) * 0.82;
          if (d < min) {
            const f = (min - d) * 0.03;
            const nx = dx / d;
            const ny = dy / d;
            if (i !== drag) { s.vx += (nx * f) / v.mass; s.vy += (ny * f) / v.mass; }
            if (j !== drag) { o.vx -= (nx * f) / VOLATILITY[blobs[j].tier].mass; o.vy -= (ny * f) / VOLATILITY[blobs[j].tier].mass; }
          }
        }
        // the wire to the next note: once it runs out of slack it tugs both ends
        if (i < blobs.length - 1) {
          const o = sim[i + 1];
          const dx = o.x - s.x;
          const dy = o.y - s.y;
          const d = Math.hypot(dx, dy) || 0.01;
          if (d > rest[i]) {
            const f = (d - rest[i]) * 0.02;
            const nx = dx / d;
            const ny = dy / d;
            if (i !== drag) { s.vx += (nx * f) / v.mass; s.vy += (ny * f) / v.mass; }
            if (i + 1 !== drag) { o.vx -= (nx * f) / VOLATILITY[blobs[i + 1].tier].mass; o.vy -= (ny * f) / VOLATILITY[blobs[i + 1].tier].mass; }
          }
        }
        s.vx *= 0.82;
        s.vy *= 0.82;
        s.x += s.vx;
        s.y += s.vy;

        const amp = i === drag ? 3.4 : i === hover ? v.tremor + 1.6 : v.tremor;
        const jx = (Math.random() - 0.5) * amp;
        const jy = (Math.random() - 0.5) * amp;
        cores.current[i]?.setAttribute(
          'transform',
          `translate(${(s.x + jx).toFixed(2)} ${(s.y + jy).toFixed(2)}) scale(${((b.rad * 0.78) / 50).toFixed(3)})`,
        );
        bodies.current[i]?.setAttribute('transform', `translate(${(s.x - b.x + jx).toFixed(2)} ${(s.y - b.y + jy).toFixed(2)})`);
      }

      // the line from note to note, and a pulse running along it: the scent unfolding
      const wire = (i: number) => {
        const a = sim[i];
        const c = sim[i + 1];
        const d = Math.hypot(c.x - a.x, c.y - a.y);
        // a hanging wire: a parabola whose sag follows how much slack is left
        const sag = d < rest[i] ? Math.sqrt((3 * d * (rest[i] - d)) / 8) : 0;
        return { a, c, sag, taut: d >= rest[i] * 0.985 };
      };
      for (let i = 0; i < blobs.length - 1; i++) {
        const seg = segs.current[i];
        if (!seg) continue;
        const { a, c, sag } = wire(i);
        const d = Math.hypot(c.x - a.x, c.y - a.y);
        const qx = (a.x + c.x) / 2;
        const qy = (a.y + c.y) / 2 + sag * 2;
        // pulled past its rest length the coil thins out and its loops open; slack, it bunches
        const stretch = d / rest[i];
        const r = LOOP * (stretch > 1 ? Math.max(0.45, 1 / stretch) : 1);
        const N = turns[i] * 10;
        let path = '';
        for (let k = 0; k <= N; k++) {
          const t = k / N;
          const u = 1 - t;
          const cx = u * u * a.x + 2 * u * t * qx + t * t * c.x;
          const cy = u * u * a.y + 2 * u * t * qy + t * t * c.y;
          let tx = 2 * u * (qx - a.x) + 2 * t * (c.x - qx);
          let ty = 2 * u * (qy - a.y) + 2 * t * (c.y - qy);
          const tl = Math.hypot(tx, ty) || 1;
          tx /= tl;
          ty /= tl;
          // taper to nothing at both ends, so the cord leaves each note cleanly
          const env = Math.min(1, t * 14, (1 - t) * 14);
          const ph = t * turns[i] * Math.PI * 2;
          const side = Math.sin(ph) * r * env;
          const along = Math.cos(ph) * r * 1.15 * env;
          path += `${k === 0 ? 'M' : 'L'}${(cx - ty * side + tx * along).toFixed(1)} ${(cy + tx * side + ty * along).toFixed(1)}`;
        }
        seg.setAttribute('d', path);
        seg.style.strokeWidth = stretch > 1 ? String(Math.max(0.9, 1.7 / stretch)) : '1.7';
      }
      if (blobs.length > 1 && pulse.current) {
        const u = ((t % 11) / 11) * (blobs.length - 1);
        const i = Math.min(blobs.length - 2, Math.floor(u));
        const f = u - i;
        const { a, c, sag } = wire(i);
        const qx = (a.x + c.x) / 2;
        const qy = (a.y + c.y) / 2 + sag * 2;
        const w0 = (1 - f) * (1 - f);
        const w1 = 2 * (1 - f) * f;
        const w2 = f * f;
        pulse.current.setAttribute('cx', (w0 * a.x + w1 * qx + w2 * c.x).toFixed(1));
        pulse.current.setAttribute('cy', (w0 * a.y + w1 * qy + w2 * c.y).toFixed(1));
        bodies.current.forEach((el, k) => {
          if (!el) return;
          if (Math.abs(u - k) < 0.35) el.setAttribute('data-lit', '');
          else el.removeAttribute('data-lit');
        });
      }
    };

    const cleanups: (() => void)[] = [];
    bodies.current.forEach((el, i) => {
      if (!el) return;
      // native listeners, so the strip's own drag doesn't also start
      const down = (e: PointerEvent) => {
        e.stopPropagation();
        drag = i;
        travelled = 0;
        const p = toSvg(e);
        pointer.x = p.x;
        pointer.y = p.y;
      };
      const enter = () => (hover = i);
      const leave = () => {
        if (hover === i) hover = -1;
      };
      el.addEventListener('pointerdown', down);
      el.addEventListener('pointerenter', enter);
      el.addEventListener('pointerleave', leave);
      cleanups.push(() => {
        el.removeEventListener('pointerdown', down);
        el.removeEventListener('pointerenter', enter);
        el.removeEventListener('pointerleave', leave);
      });
    });

    const move = (e: PointerEvent) => {
      if (drag < 0) return;
      const p = toSvg(e);
      travelled += Math.hypot(p.x - pointer.x, p.y - pointer.y);
      pointer.x = p.x;
      pointer.y = p.y;
    };
    const up = () => {
      if (drag < 0) return;
      // a tap, not a drag: pick the note, and give it a small kick
      if (travelled < 6) {
        const hit = drag;
        setSel((cur) => (cur === hit ? -1 : hit));
        const a = Math.random() * Math.PI * 2;
        sim[drag].vx += Math.cos(a) * 9;
        sim[drag].vy += Math.sin(a) * 9;
        navigator.vibrate?.(14);
      }
      drag = -1;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);

    const observer = new IntersectionObserver(([entry]) => (visible = entry.isIntersecting), { threshold: 0 });
    observer.observe(svg);

    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      cleanups.forEach((fn) => fn());
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
    };
  }, [blobs]);

  return (
    <div className={styles.distillBody}>
      <svg
        ref={svgRef}
        className={styles.blobField}
        viewBox={`${vx} 0 ${vw} ${H}`}
        style={{ '--u': unit } as React.CSSProperties}
        role="img"
        aria-label={`Scent notes: ${blobs.map((b) => b.note).join(', ')}`}
      >
        <defs>
          <pattern id="blob-dots" width="7" height="7" patternUnits="userSpaceOnUse">
            <circle cx="3.5" cy="3.5" r="2.3" fill={ACCENT} />
          </pattern>
          <pattern id="blob-grid" width="80" height="80" patternUnits="userSpaceOnUse">
            <path d="M38 40H42M40 38V42" stroke={ACCENT} strokeWidth="1" strokeLinecap="round" />
          </pattern>
          <filter id="blob-warp" x="-35%" y="-35%" width="170%" height="170%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="2" seed="5" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="24" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          {/* metaballs: blur, then threshold the alpha, so shapes that touch run together */}
          <filter id="blob-goo" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="10" result="b" />
            <feColorMatrix in="b" mode="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -10" />
          </filter>
        </defs>

        {/* the calibration grid and one guide for each stage of the scent */}
        <rect className={styles.grid} x={vx} width={vw} height={H} fill="url(#blob-grid)" />
        {Object.entries(tierY).map(([tier, y]) => (
          <g key={tier}>
            <line className={styles.guide} x1={vx} x2={vx + vw} y1={vw < W ? mapY(y * H) : y * H} y2={vw < W ? mapY(y * H) : y * H} />
            <text className={styles.guideLabel} x={vx + 4} y={(vw < W ? mapY(y * H) : y * H) - 8}>
              {tier.toUpperCase()}
            </text>
          </g>
        ))}

        {/* the line the scent follows, note to note, each leg in its stage's colour */}
        {blobs.slice(0, -1).map((b, i) => (
          <path
            key={b.n}
            ref={(el) => { segs.current[i] = el; }}
            className={styles.leg}
            fill="none"
            d={`M${b.x} ${b.y}L${blobs[i + 1].x} ${blobs[i + 1].y}`}
            style={{ stroke: TIER_COLOUR[b.tier] }}
          />
        ))}

        {/* the solid lime cores, merged where they touch */}
        <g filter="url(#blob-goo)">
          {blobs.map((b, i) => (
            <path
              key={b.n}
              ref={(el) => { cores.current[i] = el; }}
              d={b.shape}
              transform={`translate(${b.x} ${b.y}) scale(${((b.rad * 0.78) / 50).toFixed(3)})`}
              fill={LIME}
            />
          ))}
        </g>

        {blobs.map((b, i) => {
          const half = b.rad + 16;
          const c = 14; // corner bracket length
          const x0 = b.x - half;
          const y0 = b.y - half;
          const x1 = b.x + half;
          const y1 = b.y + half;
          const col = TIER_COLOUR[b.tier];
          return (
            <g
              key={b.n}
              ref={(el) => { bodies.current[i] = el; }}
              className={styles.blobBody}
              data-sel={sel === i ? '' : undefined}
              role="button"
              tabIndex={0}
              aria-label={`${b.note}: ${b.tier} note. Press to read what it gives.`}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSel(i);
                }
              }}
            >
              <circle cx={b.x} cy={b.y} r={half} fill="transparent" />
              <g filter="url(#blob-warp)">
                <path
                  d={b.shape}
                  transform={`translate(${b.x} ${b.y}) scale(${(b.rad / 50).toFixed(3)})`}
                  fill="url(#blob-dots)"
                />
              </g>
              <path
                className={styles.trackBox}
                style={{ stroke: col }}
                d={`M${x0} ${y0 + c}V${y0}H${x0 + c} M${x1 - c} ${y0}H${x1}V${y0 + c} M${x1} ${y1 - c}V${y1}H${x1 - c} M${x0 + c} ${y1}H${x0}V${y1 - c}`}
              />
              <path className={styles.trackBox} style={{ stroke: col }} d={`M${b.x - 6} ${b.y}H${b.x + 6} M${b.x} ${b.y - 6}V${b.y + 6}`} />
              <text className={styles.tag} x={x0} y={y0 - (vw < W ? 6 * unit : 9)}>
                {String(b.n).padStart(2, '0')} {b.note.toUpperCase()}
              </text>
              <text className={styles.tagSub} style={{ fill: col }} x={x0} y={y1 + (vw < W ? 13 * unit : 18)}>
                <tspan>{b.tier.toUpperCase()}</tspan>
                <tspan dx="14">{b.share}%</tspan>
                <tspan dx="14">{b.verb}</tspan>
              </text>
              {wrap(b.caption).map((line, k) => (
                <text key={k} className={styles.caption} x={x0} y={vw < W ? y1 + 27 * unit + k * 14 * unit : y1 + 38 + k * 17}>
                  {line}
                </text>
              ))}
            </g>
          );
        })}

        {blobs.length > 1 && <circle ref={pulse} className={styles.pulse} r="9" cx={blobs[0].x} cy={blobs[0].y} />}
      </svg>

      {/* the detector, over everything: this is the field the notes sit in */}
      <TrackingOverlay seed={blobs.map((b) => b.note).join('|')} />

      {/* what the touched note gives, pinned to the page */}
      {picked && (
      <div ref={cardRef} className={styles.noteCard} aria-live="polite">
          <>
            <div className={styles.noteName}>
              <span className={styles.noteCursor} aria-hidden="true">&gt;</span>{picked.note}
            </div>
            <div className={styles.noteMeta}>
              <span>{picked.tier}</span>
              <span className={styles.noteChip}>{picked.verb}</span>
              <span>{picked.share}%</span>
            </div>
            <dl className={styles.noteRows}>
              <dt>the smell</dt>
              <dd><span className={styles.noteStrip}>{picked.gives}</span></dd>
              {picked.tie && (
                <>
                  <dt>what it says</dt>
                  <dd><span className={styles.noteStrip}>{picked.tie}</span></dd>
                </>
              )}
              <dt>what it calls up</dt>
              <dd><span className={styles.noteStrip}>{picked.calls}</span></dd>
            </dl>
          </>
      </div>
      )}
    </div>
  );
}

export default BlobField;
