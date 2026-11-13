'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { skyNow } from '@/lib/utils/sky-now';

/**
 * The whole screen as one page of a tear-off calendar.
 *
 * A leaf of paper hangs from a bar of polished chrome across the top and covers the
 * entire site. Pull it down — from anywhere — and it tears off the bar and falls away,
 * and the card page is what was behind it. The paper is thin: before the tear you see the
 * live, dithered sky through it, and the card page fades in behind it once you start to pull.
 * One leaf, no redraws.
 *
 * What's printed on it: the date inside a starburst, with the next day's star ghosting through from the page below,
 * and the month beneath it; the weekday and year in the corners; and along the bottom, small boxed notes like the ones
 * on a printed day-a-page calendar: the month as a grid with the days you have drawn filled in, the moon, and what the
 * sky is doing right now in the western and the vedic reckoning. The sky's figures are computed from the real sun and
 * moon (lib/utils/sky-now.ts), so nothing here is invented.
 */

const COMMIT_PX = 150;
// the sheet's own colours are variables: paper and dark ink by day, swapped at night (see the <style> below)
const PAPER = 'var(--t-paper)';
/** thin paper: the live, dithered sky shows through it */
const PAPER_SEE_THROUGH = 'var(--t-veil)';
const COBALT = '#2B35D6';
const INK = 'var(--t-ink)';

/** How far the leaf has been pulled off the pad, in any direction but up. */
function pullDistance(dx: number, dy: number): number {
  return Math.hypot(dx, Math.max(0, dy));
}

/** A ragged top edge, in px so it stays a tear at any screen size. Hidden under the bar at rest. */
const TORN_TOP = (() => {
  const pts: string[] = [];
  const n = 56;
  let seed = 7;
  const rnd = () => ((seed = (seed * 1664525 + 1013904223) >>> 0) / 4294967296);
  for (let i = 0; i <= n; i++) pts.push(`${((i / n) * 100).toFixed(2)}% ${(2 + rnd() * 20).toFixed(1)}px`);
  return `${pts.join(',')},100% 100%,0 100%`;
})();

function Moon({ phase, size, ink = 'var(--t-ink)' }: { phase: number; size: string; ink?: string }) {
  const r = 20;
  const k = (1 - Math.cos(phase * 2 * Math.PI)) / 2; // lit fraction
  const waxing = phase < 0.5;
  const rx = Math.abs(1 - 2 * k) * r;
  const bulge = k < 0.5 ? 0 : 1;
  const lit = waxing
    ? `M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${rx} ${r} 0 0 ${bulge ? 1 : 0} 0 ${-r}Z`
    : `M0 ${-r}A${r} ${r} 0 0 0 0 ${r}A${rx} ${r} 0 0 ${bulge ? 0 : 1} 0 ${-r}Z`;
  return (
    <svg viewBox="-24 -24 48 48" style={{ width: size, height: size }} aria-label={`moon, ${Math.round(k * 100)}% lit`} role="img">
      <circle r={r} fill="none" stroke={ink} strokeWidth="2" />
      <path d={lit} fill={ink} />
    </svg>
  );
}

/** A small seeded generator, so a given day always draws the same star. */
function seeded(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * An uneven starburst of long thin needles: eight to eleven spikes of different lengths at uneven angles, their sides
 * curving hard inward so each one runs to a fine point, meeting in a small dark body where the date sits. A scatter of
 * little squares is thrown around it. Each day's date seeds its own, so no two days print the same star.
 */
function burstFor(seed: number, aspect = 1) {
  const r = seeded(seed * 977 + 13);
  const n = 8 + Math.floor(r() * 4);
  const start = r() * Math.PI * 2;
  const lens = Array.from({ length: n }, () => 33 + r() * 17);
  // the spikes are spread unevenly, then rescaled to close the circle exactly
  const raw: number[] = [];
  let acc = 0;
  for (let i = 0; i < n; i++) {
    raw.push(acc);
    acc += 0.62 + r() * 0.76;
  }
  const ang = raw.map((v) => start + (v / acc) * Math.PI * 2);
  const at = (a: number, rad: number): [number, number] => [Math.cos(a) * rad, Math.sin(a) * rad];
  // with room to spare sideways, every spike's reach is stretched that way: the star gets wide, not just big
  const tips = ang.map((a, i) => {
    const [x, y] = at(a, lens[i]);
    return [x * aspect, y] as [number, number];
  });
  const valleys = ang.map((a, i) => {
    const b = i === n - 1 ? ang[0] + Math.PI * 2 : ang[i + 1];
    const mid = (a + b) / 2 + (r() - 0.5) * 0.1;
    const [vx, vy] = at(mid, 10 + r() * 4);
    return { p: [vx * (1 + (aspect - 1) * 0.25), vy] as [number, number] };
  });
  const f = (x: number) => x.toFixed(2);
  let d = `M${f(tips[0][0])},${f(tips[0][1])}`;
  for (let i = 0; i < n; i++) {
    const v = valleys[i];
    const nx = tips[(i + 1) % n];
    // each side bows hard toward the centre, which is what makes the spikes thin and long
    d += ` Q${f(((tips[i][0] + v.p[0]) / 2) * 0.4)},${f(((tips[i][1] + v.p[1]) / 2) * 0.4)} ${f(v.p[0])},${f(v.p[1])}`;
    d += ` Q${f(((v.p[0] + nx[0]) / 2) * 0.4)},${f(((v.p[1] + nx[1]) / 2) * 0.4)} ${f(nx[0])},${f(nx[1])}`;
  }
  d += 'Z';
  // the scatter: small squares at random around the star, a few larger
  const dots: { x: number; y: number; s: number }[] = [];
  for (let i = 0; i < 46; i++) {
    const a = r() * Math.PI * 2;
    const rad = 10 + Math.sqrt(r()) * 40;
    const [x, y] = at(a, rad);
    dots.push({ x: x * aspect, y, s: 0.7 + Math.pow(r(), 2.2) * 1.9 });
  }
  return { d, dots };
}

function Starburst({ day, seed, aspect, fill, ink, ghost = false }: { day: number; seed: number; aspect: number; fill: string; ink: string; ghost?: boolean }) {
  const star = burstFor(seed, aspect);
  return (
    <svg viewBox={`${-50 * aspect} -50 ${100 * aspect} 100`} style={{ display: 'block', width: '100%', height: '100%', overflow: 'visible' }} aria-hidden={ghost ? true : undefined} role={ghost ? undefined : 'img'} aria-label={ghost ? undefined : `the ${day}`}>
      {star.dots.map((p, i) => (
        <rect key={i} x={(p.x - p.s / 2).toFixed(2)} y={(p.y - p.s / 2).toFixed(2)} width={p.s.toFixed(2)} height={p.s.toFixed(2)} fill={fill} />
      ))}
      <path d={star.d} fill={fill} />
      <text
        x="0"
        y="1"
        textAnchor="middle"
        dominantBaseline="central"
        fontFamily="var(--font-vt323), monospace"
        fontSize={String(day > 9 ? 17 : 24)}
        fill={ink}
      >
        {day}
      </text>
    </svg>
  );
}

const GLYPH: Record<string, string> = {
  aries: '♈', taurus: '♉', gemini: '♊', cancer: '♋', leo: '♌', virgo: '♍',
  libra: '♎', scorpio: '♏', sagittarius: '♐', capricorn: '♑', aquarius: '♒', pisces: '♓',
};

/** A zodiac sign in a block: its glyph, name and how far into it. Solid for one reckoning, outlined for the other. */
function SignBlock({ sign, deg, solid }: { sign: string; deg: number; solid: boolean }) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: solid ? INK : 'transparent',
        color: solid ? PAPER : INK,
        border: `1px solid ${INK}`,
        padding: '0 0.5em',
        whiteSpace: 'nowrap',
        fontSize: '0.9em',
        fontWeight: 500,
        lineHeight: 1.35,
      }}
    >
      <span aria-hidden="true">{GLYPH[sign]}{'\uFE0E'}</span> {sign} {deg}°
    </span>
  );
}

/**
 * The room between the lines of text, holding the starburst. On a phone it is taller than wide and the star is round;
 * on a wide screen it is wider than tall, and the star is drawn to match, its spikes reaching out sideways.
 */
function StarArea({ day, tomorrow, seed, tomorrowSeed, ink, paper }: { day: number; tomorrow: number; seed: number; tomorrowSeed: number; ink: string; paper: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [aspect, setAspect] = useState(1);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const read = () => {
      const r = el.getBoundingClientRect();
      if (r.height > 0) setAspect(Math.round(Math.max(1, Math.min(2.7, r.width / r.height)) * 20) / 20);
    };
    read();
    const ro = new ResizeObserver(read);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div ref={ref} style={{ position: 'relative', flex: '1 1 0', minHeight: 0, margin: '1.2dvh 0' }}>
      <div aria-hidden="true" style={{ position: 'absolute', inset: 0, transform: 'translate(-1.2%, 2%)', filter: 'blur(1px)' }}>
        <Starburst day={tomorrow} seed={tomorrowSeed} aspect={aspect} fill="color-mix(in srgb, var(--accent-c, #2B35D6) 30%, transparent)" ink="color-mix(in srgb, var(--accent-c, #2B35D6) 60%, transparent)" ghost />
      </div>
      <div style={{ position: 'absolute', inset: 0 }}>
        <Starburst day={day} seed={seed} aspect={aspect} fill={ink} ink={paper} />
      </div>
    </div>
  );
}

function drawnDays(now: Date): Set<number> {
  const out = new Set<number>();
  if (typeof window === 'undefined') return out;
  const y = now.getFullYear();
  const m = now.getMonth();
  const n = new Date(y, m + 1, 0).getDate();
  for (let d = 1; d <= n; d++) {
    const iso = `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
    if (localStorage.getItem(`card-${iso}`)) out.add(d);
  }
  return out;
}


/* ---- the sound of a leaf coming off a pad: grains of filtered paper noise, made on the spot (Web Audio) ---- */
let audio: AudioContext | null = null;
function audioCtx(): AudioContext | null {
  try {
    if (localStorage.getItem('slow-garden-sound') === 'off') return null;
    if (!audio) {
      const A = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!A) return null;
      audio = new A();
    }
    if (audio.state === 'suspended') void audio.resume();
    return audio;
  } catch {
    return null;
  }
}
/** One short crackle of paper fibres. `at` is in seconds from now. */
function ripGrain(c: AudioContext, at: number, loud: number, bright: number) {
  const len = Math.floor(c.sampleRate * (0.02 + Math.random() * 0.03));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 1.6);
  const src = c.createBufferSource();
  src.buffer = buf;
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = (1800 + Math.random() * 2600) * bright;
  band.Q.value = 0.8;
  const g = c.createGain();
  g.gain.value = Math.min(0.5, loud) * (0.5 + Math.random() * 0.5);
  src.connect(band).connect(g).connect(c.destination);
  src.start(c.currentTime + at);
}
/** The last, long rip when the leaf comes away: a burst of grains that thins out and darkens. */
function ripOff() {
  const c = audioCtx();
  if (!c) return;
  const n = 26;
  for (let i = 0; i < n; i++) {
    const t = (i / n) * 0.5 + Math.random() * 0.012;
    const fade = 1 - i / n;
    ripGrain(c, t, 0.34 * (0.35 + fade), 0.7 + fade * 0.5);
  }
}

export default function TearSheet({
  onTear,
  onDone,
  onPeek,
  disabled = false,
}: {
  /** The tear is committed: the real card page is revealed behind the falling leaf. */
  onTear: () => void;
  /** The leaf has finished falling: the sheet can go. */
  onDone?: () => void;
  /** The leaf is being pulled (true) or has been let go (false): show the page behind it. */
  onPeek?: (peeking: boolean) => void;
  disabled?: boolean;
}) {
  const pageRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const tornRef = useRef(false);
  const dragRef = useRef({ active: false, startX: 0, startY: 0, dx: 0, dy: 0 });
  const [now] = useState(() => new Date());
  const [drawn, setDrawn] = useState<Set<number>>(new Set());
  useEffect(() => setDrawn(drawnDays(now)), [now]);

  const today = now.getDate();
  const tomorrow = new Date(now.getTime() + 86_400_000).getDate();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const lead = (new Date(now.getFullYear(), now.getMonth(), 1).getDay() + 6) % 7; // Monday first
  const weekday = now.toLocaleDateString('en-GB', { weekday: 'long' }).toUpperCase();
  const monthName = now.toLocaleDateString('en-GB', { month: 'long' });
  const sky = skyNow(now);

  useEffect(() => {
    const page = pageRef.current;
    if (!page || disabled) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    // The card page sits behind the leaf, clipped to the strip the leaf has left bare: its top edge, measured from where it
    // hung, is the line the card appears above. So the card shows as the paper passes it, not the moment you touch it.
    const root = document.documentElement;
    let baseTop = 0;
    let raf = 0;
    const follow = () => {
      const edge = Math.max(0, page.getBoundingClientRect().top - baseTop);
      // the name and the card come up together, a little more of them the further the leaf has been drawn down
      const p = Math.min(1, edge / (window.innerHeight * 0.5));
      root.style.setProperty('--tear-p', String(p * p * (3 - 2 * p)));
    };
    const chase = () => {
      follow();
      raf = requestAnimationFrame(chase);
    };
    const down = (e: PointerEvent) => {
      if (tornRef.current) return;
      baseTop = page.getBoundingClientRect().top;
      lastGrain = 0;
      audioCtx(); // a press is the gesture the browser wants before it will play sound
      dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0 };
      page.style.transition = 'none';
      try { page.setPointerCapture?.(e.pointerId); } catch { /* the drag still works */ }
    };
    let peeked = false;
    let lastGrain = 0;
    const move = (e: PointerEvent) => {
      const d = dragRef.current;
      if (!d.active || tornRef.current) return;
      d.dx = e.clientX - d.startX;
      d.dy = e.clientY - d.startY;
      if (!peeked && pullDistance(d.dx, d.dy) > 10) {
        peeked = true;
        onPeek?.(true);
      }
      const pull = Math.min(1, pullDistance(d.dx, d.dy) / 420);
      // hangs from the bar: it swings from the top as it is pulled down and aside
      page.style.transform = `translate(${d.dx * 0.6}px, ${Math.max(0, d.dy) * 0.9}px) rotate(${pull * 5 + d.dx * 0.012}deg)`;
      follow();
      // paper fibres crackle as it is drawn down: a grain for every few pixels, louder the faster it goes
      const dist = pullDistance(d.dx, d.dy);
      const step = dist - lastGrain;
      if (step > 12) {
        const c = audioCtx();
        if (c) ripGrain(c, 0, Math.min(0.3, 0.05 + step / 160), 1);
        lastGrain = dist;
      } else if (step < -40) lastGrain = dist;
    };
    const end = () => {
      const d = dragRef.current;
      if (!d.active || tornRef.current) return;
      d.active = false;
      if (pullDistance(d.dx, d.dy) > COMMIT_PX) {
        tornRef.current = true;
        const away = d.dx >= 0 ? 1 : -1;
        // the page is revealed the moment the tear commits, so the real thing — the name, the
        // words arriving, the next scene at the edge — is what the leaf falls away from
        onTear();
        ripOff();
        const finish = () => {
          cancelAnimationFrame(raf);
          root.style.removeProperty('--tear-p');
          onDone?.();
        };
        if (!reduce) raf = requestAnimationFrame(chase);
        if (barRef.current) {
          barRef.current.style.transition = 'transform .7s ease-in';
          barRef.current.style.transform = 'translateY(-130%)';
        }
        if (reduce) {
          finish();
          return;
        }
        page.style.transition = 'transform .8s cubic-bezier(.45,0,.75,.4)';
        page.style.transform = `translate(${d.dx * 0.8 + away * 140}px, ${window.innerHeight * 1.15}px) rotate(${away * 16 + d.dx * 0.012}deg)`;
        page.addEventListener('transitionend', finish, { once: true });
      } else {
        page.style.transition = 'transform .45s cubic-bezier(.2,.9,.3,1.2)';
        page.style.transform = 'none';
        peeked = false;
        onPeek?.(false);
        // the leaf springs back over the card: let it close up with it
        const t0 = performance.now();
        const settle = () => {
          follow();
          if (performance.now() - t0 < 500) raf = requestAnimationFrame(settle);
          else root.style.removeProperty('--tear-p');
        };
        raf = requestAnimationFrame(settle);
      }
    };
    page.addEventListener('pointerdown', down);
    page.addEventListener('pointermove', move);
    page.addEventListener('pointerup', end);
    page.addEventListener('pointercancel', end);
    page.addEventListener('lostpointercapture', end);
    return () => {
      cancelAnimationFrame(raf);
      page.removeEventListener('pointerdown', down);
      page.removeEventListener('pointermove', move);
      page.removeEventListener('pointerup', end);
      page.removeEventListener('pointercancel', end);
      page.removeEventListener('lostpointercapture', end);
    };
  }, [onTear, onDone, onPeek, disabled]);

  const vt = 'var(--font-vt323), monospace';
  const sans = 'var(--font-dm-sans), sans-serif';
  const ink = INK;
  // the text of the page, set like film credits: DM Mono capitals in the page's blue. A small label, then its figure.
  const label: CSSProperties = { gridColumn: 1, fontSize: '0.6em', letterSpacing: '.1em', textAlign: 'right', opacity: 0.9 };
  const value: CSSProperties = { gridColumn: 2, fontWeight: 500, fontSize: '1.08em' };
  const gap: CSSProperties = {};

  return (
    <div className="tear-root" style={{ position: 'fixed', inset: 0, zIndex: 60, pointerEvents: 'none' }}>
      <div
        ref={pageRef}
        className="tear-page"
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'auto',
          touchAction: 'none',
          cursor: 'grab',
          userSelect: 'none',
          transformOrigin: '50% 0',
          willChange: 'transform',
          color: ink,
          background: PAPER_SEE_THROUGH,
          clipPath: `polygon(${TORN_TOP})`,
          containerType: 'size',
        }}
      >
        {/* the paper's tooth: a low, fibrous noise, and a soft fall of light from the top */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            backgroundImage: [
              'linear-gradient(180deg, rgba(255,255,255,.5), transparent 24%)',
              "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='260' height='260'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.85 .3' numOctaves='3' seed='9'/><feColorMatrix values='0 0 0 0 .2  0 0 0 0 .2  0 0 0 0 .16  0 0 0 .5 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.55'/></svg>\")",
            ].join(','),
            backgroundSize: '100% 100%, 260px 260px',
          }}
        />

        {/* one column down the page: ruled lines at the top, the star taking all the room between, ruled lines at the foot */}
        <style>{`
          .tear-root { --t-ink: #15200F; --t-paper: #F3F0E7; --t-veil: rgba(243, 240, 231, .52); }
          :root[data-night] .tear-root { --t-ink: #F3F0E7; --t-paper: #14201A; --t-veil: rgba(14, 20, 17, .6); }
          .tear-col { --s: clamp(10px, min(2.2dvh, 3.5vw), 26px); font-family: var(--font-dm-mono), monospace; font-size: var(--s); letter-spacing: .04em; text-transform: uppercase; line-height: 1.4; color: ${ink}; }
          .tc-top { display: flex; flex-direction: row; justify-content: space-between; width: 100%; font-size: calc(var(--s) * 1.1); }
          .tc-wrap { display: flex; flex-direction: column; gap: 0.8em; width: 100%; }
          .tc-group { display: grid; grid-template-columns: calc(var(--s) * 4.3) 1fr; column-gap: calc(var(--s) * 0.85); row-gap: 0.12em; align-items: baseline; width: 100%; }
          .tc-signs { grid-template-columns: calc(var(--s) * 4.3) 1fr 1fr; }
          .tc-strip { display: flex; gap: 2px; min-width: 0; width: 100%; }
          .tc-strip i { flex: 1 1 0; min-width: 0; }
          @container (min-width: 900px) {
            .tear-col { --s: clamp(12px, min(1.95dvh, 1.15vw), 24px); }
            .tc-top { font-size: calc(var(--s) * 1.2); }
            .tc-wrap { display: flex; flex-direction: row; justify-content: space-between; align-items: flex-start; gap: 2em; }
            .tc-group { width: auto; grid-template-columns: calc(var(--s) * 4.3) max-content; }
            .tc-signs { grid-template-columns: calc(var(--s) * 4.3) calc(var(--s) * 9.4) calc(var(--s) * 10.4); }
            .tc-strip { width: auto; }
            .tc-strip i { flex: 0 0 clamp(4px, 0.45vw, 9px); }
          }
        `}</style>
        <div
          className="tear-col"
          style={{
            position: 'absolute',
            inset: 0,
            left: '50%',
            width: 'min(calc(100% - 40px), 1500px)',
            transform: 'translateX(-50%)',
            top: 'calc(max(34px, 6.2dvh) + 1.6dvh)',
            bottom: 'calc(max(54px, 7.5dvh))',
            display: 'flex',
            flexDirection: 'column',
            pointerEvents: 'none',
          }}
        >
          <div className="tc-top">
            <span>{weekday}</span>
            <span>{monthName} {now.getFullYear()}</span>
          </div>

          {/* the date in a starburst, with tomorrow's star showing through from the page below */}
          <StarArea day={today} tomorrow={tomorrow} seed={today + now.getMonth() * 31} tomorrowSeed={tomorrow + now.getMonth() * 31} ink={ink} paper={PAPER} />

          {/* what the sky is doing, set like film credits: a small label at the left, its figure beside it */}
          <div className="tc-wrap">
            <div className="tc-group">
              <span style={label}>moon</span>
              <span style={{ ...value, display: 'flex', alignItems: 'center', gap: '0.5em' }}>
                <Moon phase={sky.phase} size="1.25em" ink={INK} />
                {sky.lit}% lit
              </span>
              <span />
              <span style={value}>{sky.phaseName}</span>
            </div>

            <div className="tc-group tc-signs">
              <span style={label}>sun</span>
              <SignBlock sign={sky.western.sun.sign} deg={sky.western.sun.deg} solid={false} />
              <SignBlock sign={sky.vedic.sun.sign} deg={sky.vedic.sun.deg} solid={false} />
              <span style={label}>moon</span>
              <SignBlock sign={sky.western.moon.sign} deg={sky.western.moon.deg} solid={false} />
              <SignBlock sign={sky.vedic.moon.sign} deg={sky.vedic.moon.deg} solid={false} />
              <span />
              <span style={{ ...label, gridColumn: 'auto', textAlign: 'left' }}>western</span>
              <span style={{ ...label, gridColumn: 'auto', textAlign: 'left' }}>vedic</span>
            </div>

            <div className="tc-group">
              <span style={label}>nakshatra</span>
              <span style={value}>{sky.vedic.nakshatra}</span>
              <span style={label}>lunar day</span>
              <span style={value}>{sky.vedic.special ?? `${sky.vedic.paksha} ${sky.vedic.tithi}`}</span>
            </div>

            <div className="tc-group">
              <span style={label}>month</span>
              <span style={value}>{drawn.size} drawn</span>
              <span />
              <span aria-hidden="true" className="tc-strip" style={value}>
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
                  <i
                    key={d}
                    style={{
                      display: 'block',
                      height: '0.85em',
                      border: `1px solid ${d === today ? 'var(--accent-c, #2B35D6)' : 'color-mix(in srgb, var(--t-ink) 50%, transparent)'}`,
                      background: d === today ? 'var(--accent-c, #2B35D6)' : drawn.has(d) ? INK : 'transparent',
                    }}
                  />
                ))}
              </span>
            </div>
          </div>
        </div>

        {/* the pull: one lime tab hanging off the bottom edge, with the instruction written in it beside the arrow */}
        <div style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', pointerEvents: 'none' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.7em',
              padding: 'clamp(5px, 0.9dvh, 9px) clamp(12px, 1.8vw, 20px) clamp(6px, 1.1dvh, 11px)',
              background: 'var(--lime-c, #C9F24E)',
              borderRadius: '10px 10px 0 0',
              fontFamily: vt,
              fontSize: 'clamp(14px, 2.2dvh, 22px)',
              letterSpacing: '.06em',
              lineHeight: 1,
              color: 'var(--chip-ink, #2B35D6)',
              whiteSpace: 'nowrap',
            }}
          >
            <span>pull to tear</span>
            <span aria-hidden="true">↓</span>
          </div>
        </div>
      </div>

      {/* the binding: a bar of polished chrome across the top, over the leaf's torn edge */}
      <div
        ref={barRef}
        aria-hidden="true"
        style={
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 'max(34px, 6.2dvh)',
            borderRadius: '0 0 7px 7px',
            backgroundImage: [
              // the ends of the bar fall away into shadow, as a rolled edge does
              'linear-gradient(90deg, rgba(0,0,0,.5), transparent 4%, transparent 96%, rgba(0,0,0,.5))',
              // two fixed specular streaks, hard-edged where the light hits the metal
              'linear-gradient(104deg, transparent 18%, rgba(255,255,255,.55) 20%, rgba(255,255,255,.9) 21.2%, rgba(255,255,255,.2) 23.5%, transparent 26%)',
              'linear-gradient(104deg, transparent 66%, rgba(255,255,255,.4) 68%, rgba(255,255,255,.75) 69%, transparent 72.5%)',
              // chrome is a mirror of what is around it: a bright lip, dark bands, a cool band of
              // sky in the middle, dark again, a bright lower lip
              'linear-gradient(180deg, #ffffff 0%, #e6e9ee 8%, #9aa0ab 21%, #2f3239 37%, #c6d6ec 52%, #eef3fa 58%, #8e939d 68%, #272a30 80%, #bfc4cc 91%, #5f626a 100%)',
              // a fine brushed grain along its length
              'repeating-linear-gradient(90deg, rgba(255,255,255,.07) 0 1px, rgba(0,0,0,.05) 1px 3px)',
            ].join(','),
            boxShadow:
              '0 5px 12px rgba(0,0,0,.42), 0 1px 0 rgba(255,255,255,.8) inset, 0 -1px 0 rgba(0,0,0,.6) inset, 0 -3px 5px rgba(255,255,255,.25) inset',
          } as CSSProperties
        }
      >
        {['3.2vw', '96.8vw'].map((x) => (
          <i
            key={x}
            style={{
              position: 'absolute',
              left: x,
              top: '50%',
              width: 'clamp(9px, 1.1vw, 14px)',
              height: 'clamp(9px, 1.1vw, 14px)',
              transform: 'translate(-50%, -50%)',
              borderRadius: '50%',
              background: 'radial-gradient(circle at 34% 30%, #ffffff 0%, #b9bcc3 38%, #4d5058 78%, #23252a 100%)',
              boxShadow: '0 1px 2px rgba(0,0,0,.55), inset 0 -1px 1px rgba(0,0,0,.35)',
            }}
          />
        ))}
      </div>
    </div>
  );
}
