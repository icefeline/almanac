'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';

/**
 * The whole screen as one page of a tear-off calendar.
 *
 * A leaf of paper hangs from a bar of polished chrome across the top and covers the
 * entire site. Pull it down — from anywhere — and it tears off the bar and falls away,
 * and the card page is what was behind it. The paper is thin: before the tear you see the
 * live, dithered sky through it, and the card page fades in behind it once you start to pull.
 * One leaf, no redraws.
 *
 * What's printed on it: the day, huge, with the next day's number ghosting through
 * from the page below in pink; the weekday, month and year; the month as a little
 * grid with the days you have drawn filled in; and the moon. The moon phase is
 * computed from the date (the mean synodic month), so it is right to within a day —
 * nothing here is invented.
 */

const COMMIT_PX = 150;
const PAPER = '#F3F0E7';
/** thin paper: the live, dithered sky shows through it */
const PAPER_SEE_THROUGH = 'rgba(243, 240, 231, .52)';
const COBALT = '#2B35D6';

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

const MONTHS = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];

/** 0 = new, 0.5 = full, from the mean synodic month. */
function moonPhase(at: Date): number {
  const synodic = 29.530588853;
  const knownNew = Date.UTC(2000, 0, 6, 18, 14) / 86_400_000;
  const p = ((at.getTime() / 86_400_000 - knownNew) / synodic) % 1;
  return p < 0 ? p + 1 : p;
}

function Moon({ phase, size, ink = '#15200F' }: { phase: number; size: string; ink?: string }) {
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

  useEffect(() => {
    const page = pageRef.current;
    if (!page || disabled) return;
    const reduce = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const down = (e: PointerEvent) => {
      if (tornRef.current) return;
      dragRef.current = { active: true, startX: e.clientX, startY: e.clientY, dx: 0, dy: 0 };
      page.style.transition = 'none';
      try { page.setPointerCapture?.(e.pointerId); } catch { /* the drag still works */ }
    };
    let peeked = false;
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
        const finish = () => onDone?.();
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
      }
    };
    page.addEventListener('pointerdown', down);
    page.addEventListener('pointermove', move);
    page.addEventListener('pointerup', end);
    page.addEventListener('pointercancel', end);
    page.addEventListener('lostpointercapture', end);
    return () => {
      page.removeEventListener('pointerdown', down);
      page.removeEventListener('pointermove', move);
      page.removeEventListener('pointerup', end);
      page.removeEventListener('pointercancel', end);
      page.removeEventListener('lostpointercapture', end);
    };
  }, [onTear, onDone, onPeek, disabled]);

  const vt = 'var(--font-vt323), monospace';
  const sans = 'var(--font-dm-sans), sans-serif';
  const ink = '#15200F';
  const cell = 'clamp(7px, 1.1vw, 15px)';

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

        {/* the month number, small, top left; and the month as a grid, top right */}
        <div style={{ position: 'absolute', left: '6vw', top: '9dvh', fontFamily: vt, fontSize: 'clamp(30px, 7dvh, 92px)', lineHeight: 1 }}>
          {now.getMonth() + 1}
        </div>
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            right: '6vw',
            top: '9.4dvh',
            display: 'grid',
            gridTemplateColumns: `repeat(7, ${cell})`,
            gap: `calc(${cell} * .5)`,
            fontFamily: vt,
            fontSize: 'clamp(9px, 1.8dvh, 18px)',
            lineHeight: 1,
          }}
        >
          {['m', 't', 'w', 't', 'f', 's', 's'].map((w, i) => (
            <span key={`h${i}`} style={{ textAlign: 'center', opacity: 0.55 }}>{w}</span>
          ))}
          {Array.from({ length: lead }, (_, i) => <i key={`b${i}`} />)}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((d) => (
            <i
              key={d}
              style={{
                display: 'block',
                height: cell,
                border: `1px solid ${d === today ? 'var(--accent-c, #2B35D6)' : 'rgba(21,32,15,.35)'}`,
                background: d === today ? 'var(--accent-c, #2B35D6)' : drawn.has(d) ? ink : 'transparent',
              }}
            />
          ))}
        </div>

        {/* the day: enormous, with tomorrow's number showing through from the page below */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '14dvh',
            textAlign: 'center',
            fontFamily: vt,
            fontSize: 'min(74dvh, 52vw)',
            lineHeight: 0.74,
            letterSpacing: '-0.02em',
          }}
        >
          <span aria-hidden="true" style={{ position: 'absolute', left: 0, right: 0, color: 'color-mix(in srgb, var(--accent-c, #2B35D6) 34%, transparent)', transform: 'translate(-1.6%, 1.8%)', filter: 'blur(1.2px)' }}>
            {tomorrow}
          </span>
          <span style={{ position: 'relative' }}>{today}</span>
        </div>

        <div style={{ position: 'absolute', left: 0, right: 0, top: '80dvh', textAlign: 'center', fontFamily: sans, fontWeight: 700, fontSize: 'clamp(14px, 3.4dvh, 40px)', letterSpacing: '.14em' }}>
          {weekday}
        </div>

        <div style={{ position: 'absolute', left: '6vw', bottom: '6dvh', fontFamily: sans, fontWeight: 800, fontSize: 'clamp(20px, 5.2dvh, 64px)', letterSpacing: '-.02em' }}>
          {MONTHS[now.getMonth()]} {now.getFullYear()}
        </div>
        <div style={{ position: 'absolute', right: '6vw', bottom: '5.6dvh' }}>
          <Moon phase={moonPhase(now)} size="clamp(30px, 6.4dvh, 80px)" />
        </div>

        {/* the pull: a lime tab hanging off the bottom edge, and the instruction in cobalt */}
        <div style={{ position: 'absolute', left: '50%', bottom: 0, transform: 'translateX(-50%)', textAlign: 'center', pointerEvents: 'none' }}>
          <div style={{ fontFamily: vt, fontSize: 'clamp(16px, 3dvh, 30px)', color: 'var(--accent-c, #2B35D6)', letterSpacing: '.08em', marginBottom: 6 }}>
            &gt; pull to tear
          </div>
          <div style={{ width: 'clamp(56px, 7vw, 96px)', height: 'clamp(22px, 3.4dvh, 40px)', background: 'var(--lime-c, #C9F24E)', borderRadius: '10px 10px 0 0', display: 'grid', placeItems: 'center', fontFamily: vt, fontSize: 'clamp(18px, 3dvh, 30px)', color: 'var(--chip-ink, #2B35D6)' }}>
            ↓
          </div>
        </div>
        <div style={{ position: 'absolute', left: 0, right: 0, top: '86dvh', textAlign: 'center', fontFamily: vt, fontSize: 'clamp(12px, 2.1dvh, 20px)', letterSpacing: '.12em', opacity: 0.55, whiteSpace: 'nowrap', pointerEvents: 'none' }}>
          one draw, gone at midnight
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
