'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { loadDreams, readingFromInterpretation, saveDreams, stressDreams, type Dream } from '../lib/dreams';
import { KIND_LABEL, dreamsKey, loadCachedPatterns, sampleSet, saveCachedPatterns, tagPatterns, type Pattern, type PatternSet } from '../lib/patterns';
import { RAD, drawSky, loadSky, moonPhase, type SkyData } from '../lib/sky';

/**
 * /map: the sky of your dreams, over the real sky.
 * - Dreams are drifting dither blobs; you can drag them.
 * - Patterns are the four-point stars: specific things that recur across dreams, found by reading the whole journal.
 *   Dashed threads join each pattern to the dreams it shows up in, and gold arcs join patterns to each other.
 * - Click anything to read what it means. Zoom all the way into a dream to see its details, right here.
 * - Behind it all: ~5,000 real stars and the constellation lines. Panning the map turns the sky.
 */

const YELLOW = '#F3F35C';
const GOLD = '#FFD98A';
const ICE = '#A8E3EE';
const LINE_COLS = ['#A8E3EE', '#FFD98A', '#FF9B7A', '#7FE0C8', '#B7C8FF', '#FFB3D9']; // one colour per pattern thread
const INK = '#060A15';
const DEEP_K = 4.5; // zoom level that counts as "all the way in"

/** Nebula hues, one per dream: [core, mid, edge]. */
const NEBULA: [string, string, string][] = [
  ['#FFF3D9', '#FF9B7A', '#D6336C'],
  ['#E6FFFB', '#5CD9D0', '#1B7FA6'],
  ['#FFF6D6', '#FFC85C', '#E0662B'],
  ['#EAF2FF', '#6FA3FF', '#2B3FB5'],
  ['#FFE9F2', '#FF7EB0', '#B02A5E'],
];

/** A backdrop is a whole night: the glow behind everything, the colours of the dreams, how the stars and stipple look. */
interface Backdrop {
  id: string;
  name: string;
  bg: string;
  palette: [string, string, string][];
  starBright: number;
  starSize: number;
  magLimit: number;
  tint: string; // the colour of the drifting stipple
  accent: string; // flecks and chunky dots
  stipple: number; // how strong the stipple is
  swatch: string;
}
const BACKDROPS: Backdrop[] = [
  {
    id: 'nebula',
    name: 'nebula',
    bg: `radial-gradient(ellipse at 22% 18%, rgba(20,56,196,0.78), transparent 58%), radial-gradient(ellipse at 85% 80%, rgba(210,70,110,0.3), transparent 48%), radial-gradient(ellipse at 70% 15%, rgba(20,150,165,0.28), transparent 45%), radial-gradient(ellipse at 15% 88%, rgba(235,140,50,0.2), transparent 45%), ${INK}`,
    palette: NEBULA,
    starBright: 1,
    starSize: 1,
    magLimit: 6.2,
    tint: '#EAF2FF',
    accent: YELLOW,
    stipple: 1,
    swatch: 'linear-gradient(135deg,#1B7FA6,#D6336C,#E0662B)',
  },
  {
    id: 'deep',
    name: 'deep night',
    bg: 'radial-gradient(ellipse at 25% 15%, rgba(24,44,120,0.35), transparent 55%), radial-gradient(ellipse at 80% 90%, rgba(20,30,70,0.3), transparent 50%), #02030A',
    palette: [['#F2F6FF', '#8FB0FF', '#2B3FB5'], ['#EAF2FF', '#9FB8E8', '#3A4A80'], ['#FFF6E0', '#E3C27A', '#7A5A22'], ['#E6FFFB', '#7FD0C8', '#1B5F78'], ['#FFF1F6', '#D49AB8', '#6A2A50']],
    starBright: 1.45,
    starSize: 1.15,
    magLimit: 6.2,
    tint: '#CFE0FF',
    accent: '#BFD2FF',
    stipple: 0.55,
    swatch: 'linear-gradient(135deg,#02030A,#18307A)',
  },
  {
    id: 'starry',
    name: 'starry',
    bg: 'linear-gradient(112deg, transparent 26%, rgba(170,185,255,0.10) 41%, rgba(255,238,215,0.22) 50%, rgba(170,185,255,0.10) 59%, transparent 74%), radial-gradient(ellipse at 20% 15%, rgba(40,60,160,0.5), transparent 55%), radial-gradient(ellipse at 85% 85%, rgba(30,90,140,0.35), transparent 50%), #060A22',
    palette: [['#FFFBEA', '#FFD98A', '#C9831E'], ['#FFFFFF', '#BFD6FF', '#4A63B8'], ['#FFF4D6', '#FFB870', '#B24A1A'], ['#F2FFFB', '#9EE6D6', '#2C7A74'], ['#FFF0F0', '#FFB3A6', '#A8402E']],
    starBright: 1.9,
    starSize: 1.4,
    magLimit: 6.5,
    tint: '#FFF6E0',
    accent: '#FFE9A8',
    stipple: 0.8,
    swatch: 'linear-gradient(135deg,#060A22,#FFE9A8)',
  },
  {
    id: 'cobalt',
    name: 'cobalt',
    bg: 'radial-gradient(ellipse at 50% 0%, rgba(80,120,255,0.55), transparent 62%), radial-gradient(ellipse at 20% 100%, rgba(10,20,140,0.6), transparent 55%), #1A2FD4',
    palette: [['#FFFFFF', '#E4ECFF', '#8FA6FF'], ['#FFFFE6', '#F3F35C', '#B8B214'], ['#FFFFFF', '#CFE0FF', '#5C7DFF'], ['#FFFDE0', '#FFF07A', '#C9A91A'], ['#F5F8FF', '#BDD0FF', '#3B5CE8']],
    starBright: 1.1,
    starSize: 1,
    magLimit: 5.6,
    tint: '#FFFFFF',
    accent: YELLOW,
    stipple: 1.7,
    swatch: 'linear-gradient(135deg,#1A2FD4,#F3F35C)',
  },
  {
    id: 'ember',
    name: 'ember',
    bg: 'radial-gradient(ellipse at 20% 20%, rgba(255,90,40,0.38), transparent 55%), radial-gradient(ellipse at 85% 80%, rgba(190,30,60,0.36), transparent 50%), radial-gradient(ellipse at 60% 10%, rgba(255,170,60,0.2), transparent 45%), #0C0507',
    palette: [['#FFF1D6', '#FF9B5C', '#C2381A'], ['#FFE9D9', '#FF7A5C', '#A52424'], ['#FFF6D6', '#FFC85C', '#D4631A'], ['#FFE8EC', '#FF8FA3', '#9C2A48'], ['#FFF3E0', '#FFB070', '#8A3A14']],
    starBright: 1.1,
    starSize: 1,
    magLimit: 6.1,
    tint: '#FFE9D6',
    accent: '#FFB45C',
    stipple: 1,
    swatch: 'linear-gradient(135deg,#C2381A,#FFC85C)',
  },
  {
    id: 'aurora',
    name: 'aurora',
    bg: 'radial-gradient(ellipse at 25% 20%, rgba(20,170,140,0.4), transparent 55%), radial-gradient(ellipse at 80% 15%, rgba(40,110,200,0.35), transparent 50%), radial-gradient(ellipse at 60% 95%, rgba(30,160,90,0.28), transparent 50%), #03100E',
    palette: [['#EAFFF6', '#5CE6B4', '#14806A'], ['#E6FBFF', '#5CC8E6', '#1B6AA6'], ['#F2FFE8', '#B6F06A', '#3F8A1C'], ['#E6FFFB', '#7FF0D8', '#1F7A80'], ['#F0FFFB', '#8FD9FF', '#2A5FA0']],
    starBright: 1.15,
    starSize: 1.05,
    magLimit: 6.2,
    tint: '#E6FFF6',
    accent: '#9FF2D0',
    stipple: 0.9,
    swatch: 'linear-gradient(135deg,#14806A,#5CC8E6)',
  },
];

type Sel =
  | { kind: 'dream'; id: string }
  | { kind: 'pattern'; id: string }
  | { kind: 'edge'; dream: string; pattern: string }
  | { kind: 'plink'; a: string; b: string }
  | { kind: 'sky' };

interface SimNode {
  id: string; // 'd:<dream id>' or 'p:<pattern id>'
  kind: 'pattern' | 'dream';
  label: string;
  r: number;
  count: number;
  phase: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  pinned?: boolean; // held by the pointer while dragging
  svx: number; // smoothed velocity: edge dots trail behind it
  svy: number;
  px: number;
  py: number;
  hx: number; // a loose home to drift toward, so dreams scatter across the page
  hy: number;
  sx: number; // each blob has its own stretch, tilt, lumpiness and dither coarseness
  sy: number;
  rot: number;
  lobe: number;
  cs: number;
  z: number; // distance: 0 is near, 1 is deep in
  zt: number; // where it settles when nothing is selected
}
interface SimLink {
  a: string;
  b: string;
  kind: 'dp' | 'dd' | 'pp'; // pattern to its first dream, dream to the next dream along a pattern, or pattern to pattern
  detail?: string;
  why?: string;
  rest?: number; // this thread's own natural length, so no two are alike
  pat?: string; // the pattern this thread belongs to
  dest?: string; // the dream this thread arrives at
}
interface Cam {
  x: number; // world point at the anchor
  y: number;
  k: number;
  ax: number; // anchor, in screen px
  ay: number;
  rot: number; // radians; the map turns a little when it flies into something
}

const hand: CSSProperties = { fontFamily: 'var(--font-schoolbell)', letterSpacing: '0.06em' };
const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));
/** World to screen and back, through the camera's anchor, zoom and rotation. */
function toScreen(c: Cam, x: number, y: number): { x: number; y: number } {
  const cs = Math.cos(c.rot);
  const sn = Math.sin(c.rot);
  const dx = x - c.x;
  const dy = y - c.y;
  return { x: c.ax + c.k * (dx * cs - dy * sn), y: c.ay + c.k * (dx * sn + dy * cs) };
}
function toWorld(c: Cam, sx: number, sy: number): { x: number; y: number } {
  const cs = Math.cos(c.rot);
  const sn = Math.sin(c.rot);
  const dx = (sx - c.ax) / c.k;
  const dy = (sy - c.ay) / c.k;
  return { x: c.x + dx * cs + dy * sn, y: c.y - dx * sn + dy * cs };
}

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}
function fmt(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}
function fmtLong(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}
function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0;
  return Math.abs(h % 628) / 100;
}
/** Uniform random in [0,1) from a string and a salt (cyrb53), so a dream always lands in the same place but its place is pure chance. */
function rand01(str: string, salt = 0): number {
  let h1 = 0xdeadbeef ^ salt;
  let h2 = 0x41c6ce57 ^ salt;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ ch, 2654435761);
    h2 = Math.imul(h2 ^ ch, 1597334677);
  }
  h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909);
  h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909);
  return (4294967296 * (2097151 & h2) + (h1 >>> 0)) / 9007199254740992;
}
/** A concave four-point star, like the stars on a constellation chart. */
function starPath(x: number, y: number, R: number): string {
  const c = R * 0.16;
  return `M${x} ${y - R}Q${x + c} ${y - c} ${x + R} ${y}Q${x + c} ${y + c} ${x} ${y + R}Q${x - c} ${y + c} ${x - R} ${y}Q${x - c} ${y - c} ${x} ${y - R}Z`;
}

/**
 * A hand-drawn, looping line from A to B, in the spirit of Jeremy Bearimy: time doesn't run straight, so neither do these.
 * The line wanders off the straight path and throws in curls. The seed keeps each line's character stable; `t` makes it breathe.
 */
function inkPath(ax: number, ay: number, bx: number, by: number, seed: number, t: number, loops: number, size: number, at?: number, slack = 1, calm = 1): string {
  return inkPathFull(ax, ay, bx, by, seed, t, loops, size, at, slack, calm).d;
}
/**
 * A hand-drawn, looping line from A to B, in the spirit of Jeremy Bearimy: time doesn't run straight, so neither do these.
 * Every line gets a lazy arc, three layers of wander, big loops at random spots, and tiny curls like the flourishes in the lettering.
 * `slack` is how loose the string hangs, `calm` quietens it for the lines words ride on. The seed fixes each line's character; `t` makes it breathe.
 */
function inkPathFull(ax: number, ay: number, bx: number, by: number, seed: number, t: number, loops: number, size: number, at?: number, slack = 1, calm = 1): { d: string; len: number } {
  const dx = bx - ax;
  const dy = by - ay;
  const L = Math.hypot(dx, dy) || 1;
  const ux = dx / L;
  const uy = dy / L;
  const nx = -uy;
  const ny = ux;
  const N = Math.max(40, Math.min(170, Math.round(L / 3)));
  const key = 'ink' + seed.toFixed(5);
  const rr = (k: number) => rand01(key, k);

  type Win = { t0: number; tw: number; R: number; dir: number };
  const wins: Win[] = [];
  const addWin = (centre: number, Lw: number, Rk: number, dir: number) => {
    const tw = Lw / L;
    if (tw > 0.45) return;
    const t0 = clamp(centre - tw / 2, 0.03, 0.97 - tw);
    if (wins.some((w) => t0 < w.t0 + w.tw + 0.015 && t0 + tw > w.t0 - 0.015)) return; // never loop over another loop
    wins.push({ t0, tw, R: (Lw / (2 * Math.PI)) * Rk, dir });
  };
  if (L >= 90) {
    const big = slack < 0.3 ? (rr(1) < 0.35 ? 1 : 0) : Math.max(1, Math.round(loops * (0.5 + slack * 0.6)));
    for (let k = 0; k < big; k++) {
      const c = k === 0 && at !== undefined ? at : 0.08 + rr(10 + k) * 0.84;
      const Lw = clamp(L * (0.12 + rr(20 + k) * 0.14), 34, 110);
      addWin(c, Lw, (1.5 + rr(30 + k) * 0.9) * size * (0.7 + slack * 0.4), rr(40 + k) > 0.5 ? 1 : -1);
    }
    if (calm > 0.5) {
      const mini = Math.floor(rr(2) * (1 + slack * 2.4) * Math.min(4, L / 160)); // tiny curls, like the flourishes in the lettering
      for (let k = 0; k < mini; k++) addWin(0.06 + rr(50 + k) * 0.88, 16 + rr(60 + k) * 14, 1.8 + rr(70 + k) * 0.6, rr(80 + k) > 0.5 ? 1 : -1);
    }
  }

  const bendAmp = L * (rr(3) - 0.5) * (0.18 + 0.3 * (Math.min(slack, 1.6) / 1.6)) * calm; // a lazy arc, a different one each time
  const A = Math.min(70, L * 0.07) * (0.45 + 0.55 * slack) * calm;
  const f1 = 1.1 + rr(4) * 1.4;
  const f2 = 2.4 + rr(5) * 2.6;
  const f3 = 5 + rr(6) * 4;
  const p1 = rr(7) * 6.283;
  const p2 = rr(8) * 6.283;
  const p3 = rr(9) * 6.283;
  const pts: [number, number][] = [];
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const env = Math.sin(Math.PI * u);
    let along = L * u;
    let side = bendAmp * env + Math.pow(env, 0.7) * (A * Math.sin(6.283 * f1 * u + p1 + t * 0.35) + A * 0.55 * Math.sin(6.283 * f2 * u + p2 - t * 0.5) + A * 0.3 * Math.sin(6.283 * f3 * u + p3));
    for (const w of wins) {
      if (u > w.t0 && u < w.t0 + w.tw) {
        const tau = (u - w.t0) / w.tw;
        along += w.R * Math.sin(2 * Math.PI * tau);
        side += w.dir * w.R * (1 - Math.cos(2 * Math.PI * tau));
      }
    }
    pts.push([ax + ux * along + nx * side, ay + uy * along + ny * side]);
  }
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2;
    const my = (pts[i][1] + pts[i + 1][1]) / 2;
    d += `Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)}`;
  }
  let len = 0;
  for (let i = 1; i < pts.length; i++) len += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  return { d: d + `L${pts[N][0].toFixed(1)} ${pts[N][1].toFixed(1)}`, len };
}

const sentences = (t: string): string[] => (t.match(/[^.!?]+[.!?]+["”)]*|\S[^.!?]*$/g) ?? [t]).map((x) => x.trim()).filter(Boolean);

/** The three colours of each backdrop, used to draw its pixel-art swatch. */
const PX: Record<string, [string, string, string]> = {
  nebula: ['#1B7FA6', '#D6336C', '#E0662B'],
  deep: ['#02030A', '#18307A', '#8FB0FF'],
  starry: ['#060A22', '#FFE9A8', '#BFD6FF'],
  cobalt: ['#1A2FD4', '#F3F35C', '#FFFFFF'],
  ember: ['#C2381A', '#FF7A5C', '#FFC85C'],
  aurora: ['#14806A', '#5CC8E6', '#B6F06A'],
};
const BAYER4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);

/** A tiny dithered circle in a backdrop's colours: the night sky, pixelated. */
function PixelSky({ colors, n = 10, cell = 3 }: { colors: [string, string, string]; n?: number; cell?: number }) {
  const cells: ReactNode[] = [];
  const c = (n - 1) / 2;
  for (let j = 0; j < n; j++) {
    for (let i = 0; i < n; i++) {
      if (Math.hypot(i - c, j - c) > n / 2 - 0.35) continue;
      const v = ((i + j) / (2 * (n - 1))) * 2; // 0 to 2 across the circle, diagonally
      const k = Math.min(1, Math.floor(v));
      const pick = v - k > BAYER4[(j & 3) * 4 + (i & 3)] ? k + 1 : k;
      cells.push(<rect key={i + '-' + j} x={i * cell} y={j * cell} width={cell} height={cell} fill={colors[pick]} />);
    }
  }
  return (
    <svg width={n * cell} height={n * cell} viewBox={`0 0 ${n * cell} ${n * cell}`} shapeRendering="crispEdges" aria-hidden>
      {cells}
    </svg>
  );
}

/** A raised grey button in the old operating-system style; pressed in when it is the one chosen. */
const bevel = (pressed: boolean): CSSProperties => ({
  width: 46,
  height: 46,
  padding: 0,
  display: 'grid',
  placeItems: 'center',
  cursor: 'pointer',
  background: '#D4D0C8',
  border: '2px solid',
  borderColor: pressed ? '#404040 #FFFFFF #FFFFFF #404040' : '#FFFFFF #404040 #404040 #FFFFFF',
  boxShadow: pressed ? 'inset 1px 1px 0 #808080' : 'inset -1px -1px 0 #808080, inset 1px 1px 0 #DFDFDF',
});

function MoonGlyph({ phase, size = 22 }: { phase: number; size?: number }) {
  const R = size / 2 - 1;
  const c = size / 2;
  const k = Math.cos(phase * 2 * Math.PI);
  const rx = Math.abs(k) * R;
  const d = `M${c} ${c - R}A${R} ${R} 0 0 1 ${c} ${c + R}A${rx} ${R} 0 0 ${k > 0 ? 0 : 1} ${c} ${c - R}Z`;
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-hidden>
      <circle cx={c} cy={c} r={R} fill="rgba(255,255,255,0.12)" />
      <path d={d} fill="#FFF3D9" transform={phase < 0.5 ? undefined : `translate(${size} 0) scale(-1 1)`} />
    </svg>
  );
}

export default function DreamMap() {
  const pathname = usePathname();
  const home = pathname?.startsWith('/dreams') ? '/dreams' : '/'; // the interpreter is the front page on the milky address, /dreams elsewhere
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [ready, setReady] = useState(false);
  const [sel, setSel] = useState<Sel | null>(null);
  const [hover, setHover] = useState<string | null>(null);
  const [skyId, setSkyId] = useState('nebula');
  const [pressing, setPressing] = useState(false);
  const [, setTick] = useState(0);
  const [size, setSize] = useState({ w: 900, h: 640 });

  const [set, setSet] = useState<PatternSet | null>(null);
  const [skyStatus, setSkyStatus] = useState<'idle' | 'reading' | 'error'>('idle');
  const [skyReady, setSkyReady] = useState(false);
  const [deep, setDeep] = useState(false);
  const [deepRead, setDeepRead] = useState<{ id: string; status: 'loading' | 'error' } | null>(null);

  const [msg, setMsg] = useState('');

  const rootRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skyCanvasRef = useRef<HTMLCanvasElement>(null);
  const fxCanvasRef = useRef<HTMLCanvasElement>(null);
  const moonTodayRef = useRef(moonPhase(todayStr()));
  const skyRef = useRef<SkyData | null>(null);
  const focusRef = useRef<{ ids: Set<string>; dimming: boolean }>({ ids: new Set(), dimming: false });
  const nodesRef = useRef<SimNode[]>([]);
  const linksRef = useRef<SimLink[]>([]);
  const alphaRef = useRef(1);
  const sizeRef = useRef(size);
  const selRef = useRef<Sel | null>(null);
  const effRef = useRef<PatternSet>({ patterns: [], links: [], throughline: '' });
  const camRef = useRef<Cam>({ x: 0, y: 0, k: 0.8, ax: 450, ay: 320, rot: 0 });
  const followRef = useRef(false);
  const fitRef = useRef(true);
  const deepRef = useRef(false);
  const movedRef = useRef(false);
  const reduceRef = useRef(false);
  const timeRef = useRef(0);
  const keyRef = useRef('');
  const stressRef = useRef(false);
  const backdropRef = useRef<Backdrop>(BACKDROPS[0]);
  const typeStartRef = useRef(0);
  const fitAgeRef = useRef(0);
  const cursorRef = useRef({ x: -9999, y: -9999, vx: 0, vy: 0, active: false });
  sizeRef.current = size;
  selRef.current = sel;

  useEffect(() => {
    const st = process.env.NODE_ENV === 'production' ? 0 : Number(new URLSearchParams(window.location.search).get('stress')); // the test crowd is for development only
    stressRef.current = st > 0;
    setDreams(st > 0 ? stressDreams(st) : loadDreams());
    try {
      const v = localStorage.getItem('milky.backdrop');
      if (v && BACKDROPS.some((b) => b.id === v)) setSkyId(v);
    } catch {
      /* the default backdrop is fine */
    }
    setReady(true);
    reduceRef.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem('milky.backdrop', skyId);
    } catch {
      /* optional */
    }
  }, [skyId, ready]);
  useEffect(() => {
    if (ready && !stressRef.current) saveDreams(dreams);
  }, [dreams, ready]);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setSize({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setSize({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    let alive = true;
    loadSky().then((s) => {
      if (alive && s) {
        skyRef.current = s;
        setSkyReady(true);
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  // ---- patterns: read the whole journal for what recurs ----
  const fetchPatterns = useCallback(async (key: string, ds: Dream[]) => {
    keyRef.current = key;
    setSkyStatus('reading');
    try {
      const res = await fetch('/api/dreams/patterns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ dreams: ds.map((d) => ({ id: d.id, date: d.date, text: d.text, themes: d.themes })) }),
      });
      const data = await res.json();
      if (!res.ok || !Array.isArray(data.patterns)) throw new Error('no patterns');
      if (keyRef.current !== key) return; // the journal changed while we were reading
      const next: PatternSet = { patterns: data.patterns, links: Array.isArray(data.links) ? data.links : [], throughline: typeof data.throughline === 'string' ? data.throughline : '' };
      if (!stressRef.current) saveCachedPatterns(key, next);
      setSet(next);
      setSkyStatus('idle');
    } catch {
      if (keyRef.current === key) setSkyStatus('error');
    }
  }, []);

  useEffect(() => {
    if (!ready) return;
    if (dreams.length < 2) {
      setSet(null);
      return;
    }
    const key = dreamsKey(dreams);
    const cached = sampleSet(key) ?? loadCachedPatterns(key); // the made-up sample dreams ship with their patterns, so opening the map costs nothing
    if (cached) {
      keyRef.current = key;
      setSet(cached);
      setSkyStatus('idle');
      return;
    }
    const id = window.setTimeout(() => fetchPatterns(key, dreams), 1000);
    return () => window.clearTimeout(id);
  }, [dreams, ready, fetchPatterns]);

  /** The patterns on show: the real reading when we have it, recurring tags until then. */
  const eff: PatternSet = useMemo(() => {
    const ids = new Set(dreams.map((d) => d.id));
    if (set) {
      const ps = set.patterns.map((p) => ({ ...p, dreams: p.dreams.filter((x) => ids.has(x.id)) })).filter((p) => p.dreams.length >= 1);
      if (ps.length) {
        const pids = new Set(ps.map((p) => p.id));
        return { patterns: ps, links: set.links.filter((l) => pids.has(l.a) && pids.has(l.b)), throughline: set.throughline };
      }
    }
    return tagPatterns(dreams);
  }, [set, dreams]);
  const byId = useMemo(() => new Map(dreams.map((d) => [d.id, d])), [dreams]);
  const patternById = useMemo(() => new Map(eff.patterns.map((p) => [p.id, p])), [eff]);
  const patternsOfDream = useMemo(() => {
    const m = new Map<string, Pattern[]>();
    for (const p of eff.patterns) for (const x of p.dreams) m.set(x.id, [...(m.get(x.id) ?? []), p]);
    return m;
  }, [eff]);
  effRef.current = eff;

  // Rebuild the graph when the data changes, keeping positions of nodes that already exist.
  useEffect(() => {
    const prev = new Map(nodesRef.current.map((n) => [n.id, n]));
    const specs = [
      ...eff.patterns.map((p) => ({ id: 'p:' + p.id, kind: 'pattern' as const, label: p.name, count: p.dreams.length, r: (5 + 2.4 * Math.sqrt(p.dreams.length)) * 1.4, z0: rand01('p:' + p.id, 7) * 0.6 })),
      ...dreams.map((d) => ({ id: 'd:' + d.id, kind: 'dream' as const, label: d.date, count: 1, r: 18 * Math.pow(6, rand01('d:' + d.id, 8)), z0: rand01('d:' + d.id, 7) * 0.9 })),
    ];
    // A huge field, sized to the crowd. Each thing takes a random spot, retrying a few times only to avoid landing on top of another.
    // Few dreams sit close, with some breathing room kept between them. As the journal grows the field grows too, the spacing rule fades
    // away, and placement becomes plain chance, with random clumps and voids.
    const crowd = clamp((specs.length - 10) / 50, 0, 1);
    const area = Math.max(1.8e6, specs.length * (2.2e5 + crowd * 1.4e5));
    const fw = Math.sqrt(area * 1.5);
    const fh = fw / 1.5;
    const taken: { x: number; y: number; r: number }[] = [];
    for (const sp of specs) {
      const o = prev.get(sp.id);
      if (o) taken.push({ x: o.x, y: o.y, r: o.r });
    }
    const spots = new Map<string, { x: number; y: number }>();
    for (const sp of [...specs].sort((a, b) => a.id.localeCompare(b.id))) {
      if (prev.has(sp.id)) continue;
      let x = 0;
      let y = 0;
      for (let a = 0; a < 40; a++) {
        x = (rand01(sp.id, 100 + a) - 0.5) * fw;
        y = (rand01(sp.id, 200 + a) - 0.5) * fh;
        // in a big journal, sometimes land near a random earlier one: clumps and voids, like real chance
        if (crowd > 0.3 && taken.length && rand01(sp.id, 300 + a) < 0.35 * crowd) {
          const q = taken[Math.floor(rand01(sp.id, 400 + a) * taken.length)];
          const ang = rand01(sp.id, 500 + a) * 6.283;
          const dist = q.r + sp.r + 60 + rand01(sp.id, 600 + a) * 600;
          x = q.x + Math.cos(ang) * dist;
          y = q.y + Math.sin(ang) * dist;
        }
        const room = (1 - crowd) * ((sp.r + 40) * 1.8 + 140); // the spacing rule, fading to nothing as it gets crowded
        if (room < 1 || taken.every((q) => Math.hypot(q.x - x, q.y - y) > (q.r + sp.r) * (1 - crowd) * 1.5 + room * 0.6)) break;
      }
      taken.push({ x, y, r: sp.r });
      spots.set(sp.id, { x, y });
    }
    nodesRef.current = specs.map((sp): SimNode => {
      const old = prev.get(sp.id);
      const spot = spots.get(sp.id);
      return {
        id: sp.id,
        kind: sp.kind,
        label: sp.label,
        count: sp.count,
        r: sp.r,
        phase: rand01(sp.id, 1) * 6.28,
        x: old?.x ?? spot?.x ?? 0,
        y: old?.y ?? spot?.y ?? 0,
        vx: old?.vx ?? 0,
        vy: old?.vy ?? 0,
        svx: old?.svx ?? 0,
        svy: old?.svy ?? 0,
        px: old?.px ?? NaN,
        py: old?.py ?? NaN,
        hx: 0,
        hy: 0,
        sx: 0.55 + rand01(sp.id, 2) * 1.2,
        sy: 0.55 + rand01(sp.id, 3) * 1.2,
        rot: rand01(sp.id, 4) * 6.28,
        lobe: 0.5 + rand01(sp.id, 5) * 1.7,
        cs: 0.9 + rand01(sp.id, 6) * 0.9,
        z: old?.z ?? sp.z0,
        zt: sp.z0,
      };
    });
    const dateOf = new Map(dreams.map((d) => [d.id, d.date]));
    linksRef.current = [
      ...eff.patterns.flatMap((p) => {
        const ds = [...p.dreams].sort((x, y) => (dateOf.get(x.id) ?? '').localeCompare(dateOf.get(y.id) ?? ''));
        if (!ds.length) return [];
        const out: SimLink[] = [{ a: 'd:' + ds[0].id, b: 'p:' + p.id, kind: 'dp', detail: ds[0].detail, pat: p.id, dest: ds[0].id, rest: 220 + (hash(p.id + ds[0].id) / 6.28) * 800 }];
        for (let k = 1; k < ds.length; k++) out.push({ a: 'd:' + ds[k - 1].id, b: 'd:' + ds[k].id, kind: 'dd', detail: ds[k].detail, pat: p.id, dest: ds[k].id, rest: 160 + (hash(p.id + ds[k].id) / 6.28) * 950 });
        return out;
      }),
      ...eff.links.map((l): SimLink => ({ a: 'p:' + l.a, b: 'p:' + l.b, kind: 'pp', why: l.why, rest: 500 + (hash(l.a + l.b) / 6.28) * 800 })),
    ];
    alphaRef.current = 1;
    if (!selRef.current) fitRef.current = true;
  }, [dreams, eff]);

  const select = useCallback((s: Sel | null) => {
    setSel(s);
    typeStartRef.current = performance.now();
    followRef.current = !!s;
    fitRef.current = !s;
    deepRef.current = false;
    setDeep(false);
  }, []);

  /** Fly into a dream and show its details in place. */
  const diveInto = useCallback((id: string) => {
    setSel({ kind: 'dream', id });
    typeStartRef.current = performance.now();
    followRef.current = true;
    fitRef.current = false;
    deepRef.current = true;
    setDeep(true);
  }, []);

  /** Where the camera wants to be for the current selection (or the whole sky). */
  function cameraTarget(nodes: SimNode[]): Cam | null {
    const { w, h } = sizeRef.current;
    const narrow = w < 720;
    const s = selRef.current;
    const ax = narrow ? w / 2 : s ? w * 0.29 : w / 2;
    const ay = narrow ? (s ? h * 0.27 : h / 2) : h / 2;
    const idx = new Map(nodes.map((n) => [n.id, n]));
    if (s?.kind === 'dream' && followRef.current && deepRef.current) {
      const n = idx.get('d:' + s.id);
      return n ? { x: n.x, y: n.y, k: 5.2, ax: w / 2, ay: h / 2, rot: 0 } : null;
    }
    const availW = narrow ? w * 0.85 : s ? w * 0.42 : w * 0.9;
    const availH = narrow ? (s ? h * 0.38 : h * 0.8) : h * 0.72;
    let ids: string[] | null = null;
    let lo = 0.6;
    let hi = 1.5;
    if (s && followRef.current) {
      const eff = effRef.current;
      if (s.kind === 'dream') {
        ids = ['d:' + s.id]; // frame the dream itself; its patterns can be a whole universe away
        lo = 1.1;
        hi = 3;
      } else if (s.kind === 'pattern') {
        const p = eff.patterns.find((q) => q.id === s.id);
        void p;
        ids = ['p:' + s.id];
        lo = 0.7;
        hi = 2.2;
      } else if (s.kind === 'edge') {
        ids = ['d:' + s.dream];
        lo = 1;
        hi = 2.6;
      } else if (s.kind === 'plink') {
        ids = ['p:' + s.a];
        lo = 0.8;
        hi = 2;
      }
      // 'sky': frame everything, leaving room for the card
    } else if (!fitRef.current) {
      return null;
    }
    // Each thing it flies into turns the map by its own small angle, so no two arrivals feel the same.
    let rot = 0;
    if (s && followRef.current) {
      const key = s.kind === 'dream' || s.kind === 'pattern' ? s.id : s.kind === 'edge' ? s.dream + s.pattern : s.kind === 'plink' ? s.a + s.b : 'sky';
      const r = (hash(key) / 6.28 - 0.5) * 0.6;
      rot = Math.abs(r) < 0.12 ? (r < 0 ? -0.12 : 0.12) : r;
    }
    const pts = (ids ?? nodes.map((n) => n.id)).map((id) => idx.get(id)).filter((n): n is SimNode => !!n);
    if (!pts.length) return null;
    const x0 = Math.min(...pts.map((n) => n.x - n.r));
    const x1 = Math.max(...pts.map((n) => n.x + n.r));
    const y0 = Math.min(...pts.map((n) => n.y - n.r));
    const y1 = Math.max(...pts.map((n) => n.y + n.r));
    const k = clamp(Math.min(availW / (x1 - x0 + 140), availH / (y1 - y0 + 140)), lo, hi);
    return { x: (x0 + x1) / 2, y: (y0 + y1) / 2, k, ax, ay, rot };
  }

  // Force simulation, camera, the real sky and the dither dreams: one animation loop. It never fully settles, so the sky keeps drifting.
  useEffect(() => {
    let raf = 0;
    const step = () => {
      const nodes = nodesRef.current;
      const alpha = alphaRef.current;
      const idx = new Map(nodes.map((n) => [n.id, n]));
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          let dx = b.x - a.x;
          let dy = b.y - a.y;
          const d2 = Math.max(dx * dx + dy * dy, 60);
          const d = Math.sqrt(d2);
          const k = 0; // nothing pushes or pulls things into a layout
          const reach = a.kind === 'pattern' && b.kind === 'pattern' ? 900 : a.kind === 'dream' && b.kind === 'dream' ? 260 : 420; // short reach, so dreams can crowd together and leave real gaps
          if (d > reach) continue;
          const f = Math.min((k / d2) * alpha, 7); // capped so close pairs can't be flung across the sky
          dx /= d;
          dy /= d;
          a.vx -= dx * f;
          a.vy -= dy * f;
          b.vx += dx * f;
          b.vy += dy * f;
          const min = a.r + b.r + 24;
          if (d < min) {
            const push = (min - d) * 0.2;
            a.vx -= dx * push;
            a.vy -= dy * push;
            b.vx += dx * push;
            b.vy += dy * push;
          }
        }
      }
      for (const l of linksRef.current) {
        const a = idx.get(l.a);
        const b = idx.get(l.b);
        if (!a || !b) continue;
        const dx = b.x - a.x;
        const dy = b.y - a.y;
        const d = Math.max(Math.hypot(dx, dy), 1);
        const rest = l.rest !== undefined ? l.rest + (l.kind === 'pp' ? 0 : l.kind === 'dd' ? a.r + b.r : a.r) : l.kind === 'pp' ? 440 : l.kind === 'dd' ? a.r + b.r + 140 : a.r + 200;
        const f = (d - rest) * 0 * Math.max(alpha, 0.35);
        a.vx += (dx / d) * f;
        a.vy += (dy / d) * f;
        b.vx -= (dx / d) * f;
        b.vy -= (dy / d) * f;
      }
      const sl = selRef.current;
      const forward = sl ? (sl.kind === 'dream' ? ['d:' + sl.id] : sl.kind === 'pattern' ? ['p:' + sl.id] : sl.kind === 'edge' ? ['d:' + sl.dream, 'p:' + sl.pattern] : sl.kind === 'plink' ? ['p:' + sl.a, 'p:' + sl.b] : []) : [];
      for (const n of nodes) {
        n.z += ((forward.includes(n.id) ? 0 : n.zt) - n.z) * 0.05;
        if (n.pinned) {
          n.vx = 0;
          n.vy = 0;
          continue;
        }
        n.vx += Math.sin(timeRef.current * 0.3 + n.phase * 3) * 0.02; // slow drift, never symmetrical
        n.vy += Math.cos(timeRef.current * 0.27 + n.phase * 2) * 0.02;
        if (alpha <= 0.04) {
          n.vx += (Math.random() - 0.5) * 0.05;
          n.vy += (Math.random() - 0.5) * 0.05;
        }
        n.vx = clamp(n.vx * 0.82, -25, 25);
        n.vy = clamp(n.vy * 0.82, -25, 25);
        n.x += n.vx;
        n.y += n.vy;
      }
      alphaRef.current = Math.max(0.03, alpha * 0.985);
    };
    const moveCam = () => {
      const t = cameraTarget(nodesRef.current);
      if (!t) return;
      const c = camRef.current;
      const e = reduceRef.current ? 1 : 0.1;
      c.x += (t.x - c.x) * e;
      c.y += (t.y - c.y) * e;
      c.k += (t.k - c.k) * e;
      c.ax += (t.ax - c.ax) * e;
      c.ay += (t.ay - c.ay) * e;
      c.rot += (t.rot - c.rot) * e;
    };

    const fit = (c: HTMLCanvasElement, w: number, h: number, dpr: number) => {
      if (c.width !== Math.round(w * dpr) || c.height !== Math.round(h * dpr)) {
        c.width = Math.round(w * dpr);
        c.height = Math.round(h * dpr);
      }
    };

    /** The real sky. Panning the map turns it; zooming in drifts it closer. */
    const drawRealSky = (t: number) => {
      const c = skyCanvasRef.current;
      const sky = skyRef.current;
      if (!c || !sky) return;
      const { w, h } = sizeRef.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      fit(c, w, h, dpr);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      const cam = camRef.current;
      const drift = reduceRef.current ? 0 : t * 0.3; // the sky slowly turns, like the earth under it
      drawSky(
        ctx,
        w,
        h,
        dpr,
        sky,
        {
          ra0: ((((75 + cam.x * 0.05 + drift) % 360) + 360) % 360) * RAD,
          dec0: clamp(12 - cam.y * 0.04, -70, 80) * RAD,
          scale: (Math.max(w, h) / 2 / 0.83) * (0.8 + 0.12 * Math.log2(1 + cam.k)),
        },
        t,
        { bright: backdropRef.current.starBright, size: backdropRef.current.starSize, magLimit: backdropRef.current.magLimit }
      );
    };

    const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16);
    const G = 3; // dither cell, in world units

    // Seeded, so the ribbons and specks are the same every load.
    const rnd = (() => {
      let seed = 12345;
      return () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    })();
    const gauss = () => Math.sqrt(-2 * Math.log(rnd() + 1e-9)) * Math.cos(6.283 * rnd());
    // Streams of stipple. Each follows a meandering curve through a few wandering control points, so there is no
    // ellipse or ring anywhere: the first two meander near the dreams, the rest wander across the whole page.
    const ribbons = Array.from({ length: 7 }, (_, i) => ({
      cluster: i < 2,
      pts: Array.from({ length: 7 }, () => ({ bx: rnd(), by: rnd(), ax: 0.05 + rnd() * 0.12, ay: 0.05 + rnd() * 0.12, fx: 0.03 + rnd() * 0.07, fy: 0.03 + rnd() * 0.07, p1: rnd() * 6.283, p2: rnd() * 6.283 })),
      width: 0.02 + rnd() * 0.05,
      twist: 0.6 + rnd() * 1.6,
      off: rnd() * 6.283,
      parts: Array.from({ length: i < 2 ? 2000 : 500 + Math.floor(rnd() * 1000) }, () => ({ s: rnd(), w: Math.max(-1, Math.min(1, gauss() * 0.55)), sz: 0.7 + rnd() * 1.2, a: 0.25 + rnd() * 0.6, ox: 0, oy: 0, vx: 0, vy: 0 })),
    }));
    // Loose dust: stretched, tilted wisps rather than round clumps, with chunky yellow dots low on the page.
    const dust = (() => {
      const out: { x: number; y: number; sz: number; a: number; yel: boolean; ox: number; oy: number; vx: number; vy: number }[] = [];
      for (let c = 0; c < 20; c++) {
        const cx = rnd();
        const cy = rnd();
        const sp = 0.025 + rnd() * 0.09;
        const stretch = 1 + rnd() * 2.6;
        const rot = rnd() * 3.14;
        const yellowPatch = cy > 0.55 && rnd() < 0.45;
        const n = 70 + Math.floor(rnd() * 160);
        for (let k = 0; k < n; k++) {
          const gx = gauss() * sp * stretch;
          const gy = gauss() * sp * 0.7;
          // a little domain warp so the edges are never clean
          const x = cx + gx * Math.cos(rot) - gy * Math.sin(rot);
          const y = cy + gx * Math.sin(rot) + gy * Math.cos(rot);
          out.push({ x: x + 0.03 * Math.sin(y * 11 + c), y: y + 0.03 * Math.sin(x * 9 + c * 2), sz: yellowPatch ? 2 + rnd() * 2.2 : 0.7 + rnd() * 1.1, a: yellowPatch ? 0.5 + rnd() * 0.4 : 0.2 + rnd() * 0.5, yel: yellowPatch, ox: 0, oy: 0, vx: 0, vy: 0 });
        }
      }
      for (let k = 0; k < 500; k++) out.push({ x: rnd(), y: rnd(), sz: 0.6 + rnd() * 1, a: 0.15 + rnd() * 0.35, yel: false, ox: 0, oy: 0, vx: 0, vy: 0 });
      return out;
    })();
    // Shared state for the flow: a slow clock that quickens a little when blobs are moving (eased, never jumped).
    const orbit = { cx: 0, cy: 0, spread: 200, e: 0, flowT: 0, last: 0, init: false };
    /** Catmull-Rom point and tangent along a list of control points. */
    const cr = (P: { x: number; y: number }[], s: number) => {
      const n = P.length - 1;
      const u = Math.min(0.9999, s) * n;
      const k = Math.floor(u);
      const f = u - k;
      const p0 = P[Math.max(0, k - 1)];
      const p1 = P[k];
      const p2 = P[k + 1];
      const p3 = P[Math.min(n, k + 2)];
      const f2 = f * f;
      const f3 = f2 * f;
      return {
        x: 0.5 * (2 * p1.x + (-p0.x + p2.x) * f + (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * f2 + (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * f3),
        y: 0.5 * (2 * p1.y + (-p0.y + p2.y) * f + (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * f2 + (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * f3),
        tx: 0.5 * (-p0.x + p2.x + 2 * (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * f + 3 * (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * f2),
        ty: 0.5 * (-p0.y + p2.y + 2 * (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * f + 3 * (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * f2),
      };
    };
    const specks = Array.from({ length: 150 }, () => ({ x: rnd(), y: rnd(), w: 1 + rnd() * 2.5, h: 1 + rnd() * 2, a: 0.25 + rnd() * 0.45 }));
    /** The poster layer: a halftone dot grid, twisting ribbons of white stipple, yellow flecks, and tonight's real moon. */
    const drawFx = (t: number) => {
      const c = fxCanvasRef.current;
      if (!c) return;
      const { w, h } = sizeRef.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      fit(c, w, h, dpr);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, w, h);
      const cam = camRef.current;
      const px = -cam.x * 0.03;
      const py = -cam.y * 0.03;

      // ---- the live bit: blobs and cursor, in screen space ----
      const bd = backdropRef.current;
      const dt = orbit.last ? Math.min(0.05, t - orbit.last) : 0.016;
      orbit.last = t;
      const reduce = reduceRef.current;
      const blobs = nodesRef.current
        .filter((n) => n.kind === 'dream')
              .map((n) => {
          const fz = 1 - 0.35 * n.z;
          const sp = toScreen({ ...cam, k: cam.k * fz }, n.x, n.y);
          const rc = Math.cos(cam.rot);
          const rs = Math.sin(cam.rot);
          const vwx = n.svx * cam.k * fz;
          const vwy = n.svy * cam.k * fz;
          return { x: sp.x, y: sp.y, r: n.r * cam.k * fz, vx: clamp(vwx * rc - vwy * rs, -12, 12), vy: clamp(vwx * rs + vwy * rc, -12, 12), held: !!n.pinned };
        });
      let tcx = w / 2;
      let tcy = h / 2;
      let tsp = Math.min(w, h) * 0.3;
      let energy = 0;
      if (blobs.length) {
        tcx = blobs.reduce((a, b) => a + b.x, 0) / blobs.length;
        tcy = blobs.reduce((a, b) => a + b.y, 0) / blobs.length;
        tsp = clamp(Math.sqrt(blobs.reduce((a, b) => a + (b.x - tcx) ** 2 + (b.y - tcy) ** 2, 0) / blobs.length), 90, Math.min(w, h) * 0.45);
        energy = clamp((blobs.reduce((a, b) => a + Math.hypot(b.vx, b.vy), 0) / blobs.length) * 0.25 + (blobs.some((b) => b.held) ? 0.2 : 0), 0, 1);
      }
      if (!orbit.init) {
        orbit.cx = tcx;
        orbit.cy = tcy;
        orbit.spread = tsp;
        orbit.init = true;
      }
      // everything eases: slow to pick up, slower to let go
      orbit.cx += (tcx - orbit.cx) * 0.03;
      orbit.cy += (tcy - orbit.cy) * 0.03;
      orbit.spread += (tsp - orbit.spread) * 0.03;
      orbit.e += (energy - orbit.e) * (energy > orbit.e ? 0.04 : 0.012);
      if (!reduce) orbit.flowT += dt * (0.05 + orbit.e * 0.3);
      const flowT = orbit.flowT;
      const breath = reduce ? 1 : 0.92 + 0.08 * Math.sin(t * 0.55); // the whole field slowly breathes
      const cu = cursorRef.current;
      cu.vx *= 0.94;
      cu.vy *= 0.94;
      const cvx = clamp(cu.vx, -14, 14);
      const cvy = clamp(cu.vy, -14, 14);

      // halftone grid: glows softly near blobs and the cursor
      const GS = 14;
      const ox0 = (((px * 6) % GS) + GS) % GS;
      const oy0 = (((py * 6) % GS) + GS) % GS;
      ctx.fillStyle = '#BED7FF';
      for (let y = oy0 - GS; y < h + GS; y += GS) {
        for (let x = ox0 - GS; x < w + GS; x += GS) {
          let near = 0;
          if (!reduce) {
            for (const b of blobs) {
              const R = b.r * 2.2 + 60;
              const dx = x - b.x;
              const dy = y - b.y;
              const d2 = dx * dx + dy * dy;
              if (d2 < R * R) near = Math.max(near, (1 - Math.sqrt(d2) / R) ** 2);
            }
            if (cu.active) {
              const d2 = (x - cu.x) ** 2 + (y - cu.y) ** 2;
              if (d2 < 130 * 130) near = Math.max(near, (1 - Math.sqrt(d2) / 130) ** 2);
            }
          }
          ctx.globalAlpha = 0.05 + 0.3 * near;
          const sz = 1.1 + near * 1.6;
          ctx.fillRect(x - sz / 2, y - sz / 2, sz, sz);
        }
      }

      /**
       * How a dot moves, like grains in slow water: it is carried by a gentle swirling current, nudged away by blobs and
       * the cursor, dragged a little way along with whatever passes, and then eases home. Capped, damped and heavy,
       * so it never snaps and never races.
       */
      const react = (p: { ox: number; oy: number; vx: number; vy: number }, bx: number, by: number) => {
        const X = bx + p.ox;
        const Y = by + p.oy;
        // the ambient current: divergence-free, so it swirls without bunching up
        const a1 = X * 0.008 + flowT * 0.6;
        const b1 = Y * 0.011 - flowT * 0.4;
        const a2 = (X + Y) * 0.006 + flowT * 0.3;
        const fx = (0.011 * Math.sin(a1) * Math.cos(b1) + 0.0036 * Math.cos(a2)) * 60;
        const fy = -(0.008 * Math.cos(a1) * Math.sin(b1) + 0.0036 * Math.cos(a2)) * 60;
        let ax = ((fx * 30 - p.ox) * 0.012);
        let ay = ((fy * 30 - p.oy) * 0.012);
        let wx = 0;
        let wy = 0;
        let wt = 0;
        if (!reduce) {
          for (const b of blobs) {
            const R = b.r * 2.2 + 60;
            const dx = X - b.x;
            const dy = Y - b.y;
            const d2 = dx * dx + dy * dy;
            if (d2 > R * R) continue;
            const d = Math.sqrt(d2) || 1;
            const q = 1 - d / R;
            const f = q * q * (3 - 2 * q); // smoothstep: no hard edge to the influence
            const sw = 0.025 + Math.min(Math.hypot(b.vx, b.vy), 10) * 0.01;
            ax += (dx / d) * f * 0.09 - (dy / d) * f * sw;
            ay += (dy / d) * f * 0.09 + (dx / d) * f * sw;
            wx += b.vx * f;
            wy += b.vy * f;
            wt += f;
          }
          if (cu.active) {
            const dx = X - cu.x;
            const dy = Y - cu.y;
            const d2 = dx * dx + dy * dy;
            if (d2 < 120 * 120) {
              const d = Math.sqrt(d2) || 1;
              const q = 1 - d / 120;
              const f = q * q * (3 - 2 * q);
              ax += (dx / d) * f * 0.1 - (dy / d) * f * 0.03;
              ay += (dy / d) * f * 0.1 + (dx / d) * f * 0.03;
              wx += cvx * f;
              wy += cvy * f;
              wt += f;
            }
          }
          if (wt > 0.001) {
            // slowly dragged along with whatever is passing, at a fraction of its speed
            const k = Math.min(1, wt) * 0.035;
            ax += (wx / Math.max(wt, 1) * 0.4 - p.vx) * k;
            ay += (wy / Math.max(wt, 1) * 0.4 - p.vy) * k;
          }
        }
        p.vx = (p.vx + ax) * 0.95;
        p.vy = (p.vy + ay) * 0.95;
        const sp = Math.hypot(p.vx, p.vy);
        if (sp > 4) {
          p.vx *= 4 / sp;
          p.vy *= 4 / sp;
        }
        p.ox += p.vx;
        p.oy += p.vy;
        return 1 + Math.min(0.5, sp * 0.12); // disturbed dots catch the light a little
      };

      // streams of stipple, drifting over the whole page
      const m = Math.min(w, h);
      const wobT = reduce ? 0 : flowT;
      ctx.fillStyle = bd.tint;
      for (const rb of ribbons) {
        const cps = rb.pts.map((c) => {
          const wx = Math.sin(wobT * c.fx * 6 + c.p1) * c.ax;
          const wy = Math.cos(wobT * c.fy * 6 + c.p2) * c.ay;
          return rb.cluster
            ? { x: orbit.cx + (c.bx - 0.5 + wx) * orbit.spread * 3.2 + px * 2, y: orbit.cy + (c.by - 0.5 + wy) * orbit.spread * 2.6 + py * 2 }
            : { x: (c.bx + wx) * w + px * 2, y: (c.by + wy) * h + py * 2 };
        });
        for (const p of rb.parts) {
          const c = cr(cps, p.s);
          const tl = Math.hypot(c.tx, c.ty) || 1;
          const nx = -c.ty / tl;
          const ny = c.tx / tl;
          const wd = m * rb.width * (0.35 + Math.sin(Math.PI * p.s)) * breath;
          const lat = wd * p.w * Math.cos(6.283 * (p.s * rb.twist + wobT * 0.4) + rb.off); // opens out and narrows, never regular
          const bx = c.x + nx * lat;
          const by = c.y + ny * lat;
          const glow = reduce ? 1 : react(p, bx, by);
          ctx.globalAlpha = Math.min(1, p.a * (1 - Math.abs(p.w) * 0.35) * 0.95 * glow * bd.stipple);
          ctx.fillRect(bx + p.ox, by + p.oy, p.sz, p.sz);
        }
      }

      // loose dust and chunky yellow dots, scattered everywhere
      for (const d of dust) {
        const bx = d.x * w + px * 3;
        const by = d.y * h + py * 3;
        const glow = reduce ? 1 : react(d, bx, by);
        ctx.globalAlpha = Math.min(1, d.a * glow * breath * Math.min(1.2, bd.stipple));
        ctx.fillStyle = d.yel ? bd.accent : bd.tint;
        if (d.yel) {
          ctx.beginPath();
          ctx.arc(bx + d.ox, by + d.oy, d.sz * 0.5, 0, 6.283);
          ctx.fill();
        } else ctx.fillRect(bx + d.ox, by + d.oy, d.sz, d.sz);
      }

      // flecks
      ctx.fillStyle = bd.accent;
      for (const s of specks) {
        ctx.globalAlpha = s.a * 0.7;
        ctx.fillRect((((s.x * w + px * 3) % w) + w) % w, (((s.y * h + py * 3) % h) + h) % h, s.w, s.h);
      }

      // tonight's real moon, as a yellow dither disc
      const mp = moonTodayRef.current.phase;
      const R = Math.max(26, Math.min(44, Math.min(w, h) * 0.06));
      const mx = w * 0.86 + px * 4;
      const my = h * 0.22 + py * 4;
      const kk = Math.cos(mp * 2 * Math.PI);
      const g = 3.4;
      for (let j = -R; j <= R; j += g) {
        for (let i = -R; i <= R; i += g) {
          const u = i / R;
          const v = j / R;
          if (u * u + v * v > 1) continue;
          const lit = (mp < 0.5 ? u : -u) > kk * Math.sqrt(1 - v * v);
          if ((lit ? 0.95 : 0.14) <= BAYER[(Math.round(j / g) & 3) * 4 + (Math.round(i / g) & 3)]) continue;
          ctx.globalAlpha = lit ? 0.95 : 0.5;
          ctx.fillStyle = lit ? YELLOW : '#EAF2FF';
          ctx.fillRect(mx + i - 1.2, my + j - 1.2, 2.4, 2.4);
        }
      }
      ctx.globalAlpha = 1;
    };
    /** Each dream is a dither field in its own local grid, so the dots belong to the blob and travel with it. */
    const drawDreams = (t: number) => {
      const c = canvasRef.current;
      if (!c) return;
      const { w, h } = sizeRef.current;
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      fit(c, w, h, dpr);
      const ctx = c.getContext('2d');
      if (!ctx) return;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, c.width, c.height);
      const cam = camRef.current;
      const rc = Math.cos(cam.rot);
      const rs = Math.sin(cam.rot);
      const { ids, dimming } = focusRef.current;
      const reduce = reduceRef.current;
      const cell = nodesRef.current.length > 40 ? 4.5 : 3; // coarser dither when there are many blobs
      for (const n of [...nodesRef.current].sort((a, b) => b.z - a.z)) {
        if (n.kind !== 'dream') continue;
        const kk = cam.k * (1 - 0.35 * n.z); // far blobs are drawn as if the camera were further away: smaller, and slower to move when you pan
        const sp = toScreen({ ...cam, k: kk }, n.x, n.y);
        const reach = n.r * kk * 2.3 + 40;
        if (sp.x < -reach || sp.x > w + reach || sp.y < -reach || sp.y > h + reach) continue; // off screen
        const kb = kk * Math.max(1, 13 / (n.r * kk)); // never smaller than about 13 px across
        ctx.setTransform(dpr * kb * rc, dpr * kb * rs, -dpr * kb * rs, dpr * kb * rc, dpr * (sp.x - kb * (n.x * rc - n.y * rs)), dpr * (sp.y - kb * (n.x * rs + n.y * rc)));
        const pal = backdropRef.current.palette;
        const cols = pal[Math.floor(n.phase * 100) % pal.length];
        const cl = cell * n.cs;
        const cr = Math.cos(n.rot);
        const sr = Math.sin(n.rot);
        ctx.globalAlpha = (dimming && !ids.has(n.id) ? 0.3 : 1) * (1 - 0.28 * n.z); // a light distance haze
        const halo = ctx.createRadialGradient(n.x, n.y, 0, n.x, n.y, n.r * 2.1);
        halo.addColorStop(0, cols[1] + '99');
        halo.addColorStop(1, cols[1] + '00');
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(n.x, n.y, n.r * 2.1, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = cols[1] + '3c';
        ctx.beginPath();
        for (let q = 0; q <= 28; q++) {
          const a = (q / 28) * Math.PI * 2;
          const rb = n.r * (1.05 + (reduce ? 0 : 1) * n.lobe * (0.1 * Math.sin(3 * a + t * 0.9 + n.phase) + 0.06 * Math.sin(5 * a - t * 0.7 + n.phase * 2)));
          const ex = Math.cos(a) * rb * n.sx;
          const ey = Math.sin(a) * rb * n.sy;
          const X = n.x + ex * cr - ey * sr;
          const Y = n.y + ex * sr + ey * cr;
          if (q) ctx.lineTo(X, Y);
          else ctx.moveTo(X, Y);
        }
        ctx.closePath();
        ctx.fill();

        const lagX = reduce ? 0 : clamp(-n.svx * 5, -26, 26);
        const lagY = reduce ? 0 : clamp(-n.svy * 5, -26, 26);
        const N = Math.ceil((n.r * 1.3 * Math.max(n.sx, n.sy)) / cl);
        const buckets: number[][] = [[], [], []];
        for (let j = -N; j <= N; j++) {
          for (let i = -N; i <= N; i++) {
            const lx = i * cl;
            const ly = j * cl;
            // squash and tilt the field, so no two blobs share a silhouette
            const ux = (lx * cr + ly * sr) / n.sx;
            const uy = (-lx * sr + ly * cr) / n.sy;
            const r = Math.hypot(ux, uy);
            if (r > n.r * 1.3) continue;
            const a = Math.atan2(uy, ux);
            const rb = n.r * (1 + (reduce ? 0 : 1) * n.lobe * (0.1 * Math.sin(3 * a + t * 0.9 + n.phase) + 0.06 * Math.sin(5 * a - t * 0.7 + n.phase * 2)));
            const q = r / rb;
            if (q > 1.05) continue;
            const hl = Math.hypot(ux + n.r * 0.25, uy + n.r * 0.25) / (n.r * 1.1);
            const v = Math.pow(1 - Math.min(1, q), 0.7) * 0.75 + (1 - Math.min(1, hl)) * 0.35 + 0.18 * Math.sin(ux * 0.23 + t * 0.5 + n.phase) * Math.sin(uy * 0.19 - t * 0.4);
            if (v * (1 - 0.12 * n.z) <= BAYER[(j & 3) * 4 + (i & 3)]) continue; // far blobs are sparser
            const hsh = Math.abs(Math.sin(i * 12.9898 + j * 78.233) * 43758.5453) % 1;
            const f = (0.35 + 0.65 * Math.min(1, q)) * (0.5 + 0.5 * hsh); // edge dots lag most
            buckets[v > 0.72 ? 0 : v > 0.42 ? 1 : 2].push(n.x + lx + lagX * f, n.y + ly + lagY * f);
          }
        }
        const d = cl * 0.88;
        for (let b = 0; b < 3; b++) {
          ctx.fillStyle = cols[b];
          const xy = buckets[b];
          for (let k = 0; k < xy.length; k += 2) ctx.fillRect(xy[k] - d / 2, xy[k + 1] - d / 2, d, d);
        }
      }
      ctx.globalAlpha = 1;
    };
    const trackAndDraw = (now: number) => {
      for (const n of nodesRef.current) {
        if (Number.isNaN(n.px)) {
          n.px = n.x;
          n.py = n.y;
        }
        n.svx = n.svx * 0.82 + (n.x - n.px) * 0.18;
        n.svy = n.svy * 0.82 + (n.y - n.py) * 0.18;
        n.px = n.x;
        n.py = n.y;
      }
      drawFx(now / 1000);
      drawRealSky(now / 1000);
      drawDreams(now / 1000);
    };

    if (reduceRef.current) {
      for (let i = 0; i < 300; i++) step();
      moveCam();
      trackAndDraw(performance.now());
      setTick((t) => t + 1);
    }
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      timeRef.current = now / 1000;
      step();
      moveCam();
      // Framing happens once. After a couple of seconds the camera lets go, so it never keeps recentring on a drifting universe.
      if (fitRef.current && !selRef.current) {
        if (++fitAgeRef.current > 140) {
          fitRef.current = false;
          fitAgeRef.current = 0;
        }
      } else fitAgeRef.current = 0;
      // Zooming all the way into a selected dream opens its details in place; zooming back out closes them.
      const s = selRef.current;
      const k = camRef.current.k;
      if (s?.kind === 'dream' && k >= DEEP_K && !deepRef.current) {
        deepRef.current = true;
        followRef.current = true; // ease the dream to the middle of the view
        fitRef.current = false;
        setDeep(true);
      } else if (deepRef.current && !followRef.current && (k < 3.4 || s?.kind !== 'dream')) {
        deepRef.current = false;
        setDeep(false);
      }
      trackAndDraw(now);
      setTick((t) => (t + 1) % 1e9);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // The loop reads everything through refs, so it runs once.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Pan, wheel-zoom, pinch, and dragging dreams and stars.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const ptrs = new Map<number, { x: number; y: number }>();
    let start = { x: 0, y: 0 };
    let dragNode: SimNode | null = null;
    const free = () => {
      followRef.current = false;
      fitRef.current = false;
    };
    const zoomAt = (sx: number, sy: number, f: number) => {
      const c = camRef.current;
      const nk = clamp(c.k * f, 0.25, 8);
      const wp = toWorld(c, sx, sy);
      c.k = nk;
      const sp = toScreen(c, wp.x, wp.y); // where that point landed after the zoom; slide the camera so it stays under the cursor
      const rc = Math.cos(c.rot);
      const rs = Math.sin(c.rot);
      const ddx = sp.x - sx;
      const ddy = sp.y - sy;
      c.x += (ddx * rc + ddy * rs) / c.k;
      c.y += (-ddx * rs + ddy * rc) / c.k;
      free();
    };
    const local = (e: { clientX: number; clientY: number }) => {
      const r = root.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };
    const onWheel = (e: WheelEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-scroll]')) return; // let cards and panels scroll
      e.preventDefault();
      const p = local(e);
      zoomAt(p.x, p.y, Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0015)));
    };
    const onDown = (e: PointerEvent) => {
      if (e.target instanceof Element && e.target.closest('[data-ui]')) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (ptrs.size === 1) {
        movedRef.current = false;
        start = { x: e.clientX, y: e.clientY };
        const el = e.target instanceof Element ? e.target.closest('[data-node]') : null;
        dragNode = el ? nodesRef.current.find((n) => n.id === el.getAttribute('data-node')) ?? null : null;
      } else if (dragNode) {
        dragNode.pinned = false;
        dragNode = null;
      }
    };
    const onMove = (e: PointerEvent) => {
      const prev = ptrs.get(e.pointerId);
      if (!prev) return;
      const c = camRef.current;
      if (ptrs.size === 1) {
        if (!movedRef.current && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5) movedRef.current = true;
        if (movedRef.current && dragNode) {
          const p = local(e);
          dragNode.pinned = true;
          const wp = toWorld(c, p.x, p.y);
          const fd = 1 - 0.35 * dragNode.z;
          dragNode.x = c.x + (wp.x - c.x) / fd;
          dragNode.y = c.y + (wp.y - c.y) / fd;
          alphaRef.current = Math.max(alphaRef.current, 0.45);
        } else if (movedRef.current) {
          const ddx = e.clientX - prev.x;
          const ddy = e.clientY - prev.y;
          c.x -= (ddx * Math.cos(c.rot) + ddy * Math.sin(c.rot)) / c.k;
          c.y -= (-ddx * Math.sin(c.rot) + ddy * Math.cos(c.rot)) / c.k;
          free();
        }
      } else if (ptrs.size === 2) {
        const other = [...ptrs.entries()].find(([id]) => id !== e.pointerId)?.[1];
        if (other) {
          const d0 = Math.hypot(prev.x - other.x, prev.y - other.y);
          const d1 = Math.hypot(e.clientX - other.x, e.clientY - other.y);
          const mid = local({ clientX: (e.clientX + other.x) / 2, clientY: (e.clientY + other.y) / 2 });
          if (d0 > 0) zoomAt(mid.x, mid.y, d1 / d0);
          const ddx = (e.clientX - prev.x) / 2;
          const ddy = (e.clientY - prev.y) / 2;
          c.x -= (ddx * Math.cos(c.rot) + ddy * Math.sin(c.rot)) / c.k;
          c.y -= (-ddx * Math.sin(c.rot) + ddy * Math.cos(c.rot)) / c.k;
          movedRef.current = true;
        }
      }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
    };
    const onUp = (e: PointerEvent) => {
      ptrs.delete(e.pointerId);
      if (dragNode) {
        dragNode.pinned = false;
        dragNode = null;
      }
    };
    const onHover = (e: PointerEvent) => {
      const p = local(e);
      const c = cursorRef.current;
      if (c.active) {
        c.vx = c.vx * 0.6 + (p.x - c.x) * 0.4;
        c.vy = c.vy * 0.6 + (p.y - c.y) * 0.4;
      }
      c.x = p.x;
      c.y = p.y;
      c.active = true;
    };
    const onLeave = () => {
      cursorRef.current.active = false;
    };
    root.addEventListener('pointermove', onHover);
    root.addEventListener('pointerleave', onLeave);
    root.addEventListener('wheel', onWheel, { passive: false });
    root.addEventListener('pointerdown', onDown);
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
    window.addEventListener('pointercancel', onUp);
    return () => {
      root.removeEventListener('pointermove', onHover);
      root.removeEventListener('pointerleave', onLeave);
      root.removeEventListener('wheel', onWheel);
      root.removeEventListener('pointerdown', onDown);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      window.removeEventListener('pointercancel', onUp);
    };
  }, []);

  function exitDeep() {
    if (sel?.kind === 'dream') select({ kind: 'dream', id: sel.id });
    else select(null);
  }

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (deepRef.current) {
        const s = selRef.current;
        select(s?.kind === 'dream' ? { kind: 'dream', id: s.id } : null);
      } else select(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [select]);

  function zoomButton(f: number) {
    const c = camRef.current;
    c.k = clamp(c.k * f, 0.25, 8); // anchor stays put, so this zooms about the focus
    followRef.current = false;
    fitRef.current = false;
  }

  // The reading for a dream, shown in place when you zoom all the way in (cached on the dream after the first time).
  async function loadReading(d: Dream) {
    setDeepRead({ id: d.id, status: 'loading' });
    try {
      const res = await fetch('/api/dreams/interpret', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: d.text, readingLength: 'medium', symbolCount: 4 }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error('no reading');
      const parsed = readingFromInterpretation(data);
      if (!parsed) throw new Error('no reading');
      const reading = parsed.reading;
      setDreams((ds) => ds.map((x) => (x.id === d.id ? { ...x, reading } : x)));
      setDeepRead(null);
    } catch {
      setDeepRead({ id: d.id, status: 'error' });
    }
  }

  function copyNote(d: Dream) {
    const pats = (patternsOfDream.get(d.id) ?? []).filter((p) => p.kind !== 'tag');
    const links = [...d.themes.map((t) => `[[${t}]]`), ...pats.map((p) => `[[${p.name}]]`)];
    const note = `---\ndate: ${d.date}\ntags: [dream]\n---\n\n${d.text}\n\n${links.join(' ')}\n`;
    navigator.clipboard?.writeText(note).then(
      () => setMsg('copied, ready to paste into obsidian.'),
      () => setMsg('couldn’t copy.')
    );
  }

  // ---- render ----
  const { w, h } = size;
  const narrow = w < 720;
  const cam = camRef.current;
  // Everything is drawn at its depth: far nodes sit closer to the middle and smaller, and drift slower. Far ones are painted first.
  const nodes = nodesRef.current
    .map((n) => {
      const f = 1 - 0.35 * n.z;
      return { ...n, x: cam.x + f * (n.x - cam.x), y: cam.y + f * (n.y - cam.y), r: n.r * f };
    })
    .sort((a, b) => b.z - a.z);
  const pos = new Map(nodes.map((n) => [n.id, n]));
  const tNow = reduceRef.current ? 0 : timeRef.current;
  const S = (x: number, y: number) => toScreen(cam, x, y);

  const focusIds = useMemo(() => {
    const s = new Set<string>();
    const addDream = (id: string) => {
      s.add('d:' + id);
      for (const p of patternsOfDream.get(id) ?? []) s.add('p:' + p.id);
    };
    const addPattern = (id: string) => {
      s.add('p:' + id);
      for (const x of patternById.get(id)?.dreams ?? []) s.add('d:' + x.id);
    };
    if (sel) {
      if (sel.kind === 'dream') addDream(sel.id);
      else if (sel.kind === 'pattern') addPattern(sel.id);
      else if (sel.kind === 'edge') {
        s.add('d:' + sel.dream);
        s.add('p:' + sel.pattern);
      } else if (sel.kind === 'plink') {
        s.add('p:' + sel.a);
        s.add('p:' + sel.b);
      }
    } else if (hover) {
      if (hover.startsWith('d:')) addDream(hover.slice(2));
      else addPattern(hover.slice(2));
    }
    return s;
  }, [sel, hover, patternsOfDream, patternById]);
  const dimming = focusIds.size > 0;
  // With a big journal the overview goes quiet: threads fade and only the strongest patterns keep a label, until you hover, tap or zoom.
  const crowded = eff.patterns.length > 6 || dreams.length > 14;
  focusRef.current = { ids: focusIds, dimming };
  const focusNodeId = sel ? (sel.kind === 'dream' ? 'd:' + sel.id : sel.kind === 'pattern' ? 'p:' + sel.id : null) : hover;

  const ranked = [...eff.patterns].sort((a, b) => b.dreams.length - a.dreams.length || a.name.localeCompare(b.name));
  const rankOf = new Map(ranked.map((p, i) => [p.id, i + 1]));
  const moonNow = moonTodayRef.current;
  const backdrop = BACKDROPS.find((b) => b.id === skyId) ?? BACKDROPS[0];
  backdropRef.current = backdrop;
  const dates = dreams.map((d) => d.date).sort();
  const corner: CSSProperties = { fontFamily: 'var(--font-geist)', fontWeight: 600, fontSize: 14, lineHeight: 1.15, color: YELLOW, pointerEvents: 'none' };
  const coord = (n: SimNode) => `x: ${Math.round(n.x + 500)}, y: ${Math.round(n.y + 350)}`;

  const CARD_W = 340;
  const cardStyle: CSSProperties = narrow
    ? { left: 12, right: 12, bottom: 12, maxHeight: '46vh' }
    : { left: clamp(w * 0.52, 16, w - CARD_W - 16), top: 72, width: CARD_W, maxHeight: h - 92 };

  const input: CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.22)',
    borderRadius: 8,
    color: '#fff',
    padding: '9px 11px',
    fontFamily: 'var(--font-geist)',
    fontSize: 14,
    outline: 'none',
  };
  const btn: CSSProperties = {
    cursor: 'pointer',
    background: 'transparent',
    border: `1px solid ${YELLOW}`,
    borderRadius: 999,
    color: YELLOW,
    padding: '6px 14px',
    fontFamily: 'var(--font-schoolbell)',
    fontSize: 14,
    letterSpacing: '0.06em',
    textTransform: 'uppercase',
  };
  const ghost: CSSProperties = { ...btn, borderColor: 'rgba(255,255,255,0.3)', color: 'rgba(255,255,255,0.8)' };
  const glass: CSSProperties = {
    position: 'absolute',
    background: 'rgba(8,14,30,0.84)',
    border: '1px solid rgba(120,200,225,0.35)',
    borderRadius: 14,
    backdropFilter: 'blur(10px)',
    padding: 18,
    overflowY: 'auto',
    color: '#fff',
    pointerEvents: 'auto',
    boxShadow: '0 10px 40px rgba(0,0,0,0.45)',
    animation: 'mapIn 0.28s ease-out',
  };
  const closeBtn: CSSProperties = { background: 'none', border: 0, color: 'rgba(255,255,255,0.6)', cursor: 'pointer', fontSize: 18 };
  const linkBtn: CSSProperties = { background: 'none', border: 0, color: GOLD, cursor: 'pointer', padding: 0, font: 'inherit', textAlign: 'left', textDecoration: 'underline', textDecorationColor: 'rgba(255,217,138,0.4)' };

  const selDream = sel?.kind === 'dream' ? byId.get(sel.id) : undefined;
  const selPattern = sel?.kind === 'pattern' ? patternById.get(sel.id) : sel?.kind === 'edge' ? patternById.get(sel.pattern) : undefined;
  const edgeDetail = sel?.kind === 'edge' ? selPattern?.dreams.find((x) => x.id === sel.dream)?.detail : '';
  const hasSamples = dreams.some((d) => d.sample);
  const retry = () => fetchPatterns(dreamsKey(dreams), dreams);
  const moon = selDream ? moonPhase(selDream.date) : null;

  useEffect(() => {
    if (!deep || !selDream || selDream.reading) return;
    if (deepRead && deepRead.id === selDream.id) return;
    loadReading(selDream);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deep, selDream?.id]);


  // ---- the writing ----
  // Short things are handwritten on the looping lines. The full reading is plain text set straight on the sky, in a readable typeface.
  type WItem = { text: string; tone: 'plain' | 'accent' | 'quote' | 'dim' };
  const FS = 22;
  
  const clip = (t: string, max: number) => (t.length <= max ? t : t.slice(0, max).replace(/\s+\S*$/, '').replace(/[,;:]$/, '') + '…');
  let title = '';
  let kicker = '';
  const items: WItem[] = []; // on the lines
  let blockLabel = '';
  const blockParas: string[] = []; // as plain text
  const blockLinks: { lead?: string; text: string; go: Sel }[] = [];
  if (!deep) {
    if (selPattern) {
      title = selPattern.name;
      kicker = `${KIND_LABEL[selPattern.kind]}, in ${selPattern.dreams.length} ${selPattern.dreams.length === 1 ? 'dream' : 'dreams'}`;
      if (sel?.kind === 'edge' && edgeDetail) {
        const d0 = edgeDetail.replace(/[.!?"”]+$/, '').replace(/^["“]/, '');
        items.push({ text: `in the ${byId.get(sel.dream) ? fmt(byId.get(sel.dream)!.date) : ''} dream, ${/^I[ '’]/.test(d0) ? d0 : d0.charAt(0).toLowerCase() + d0.slice(1)}.`, tone: 'quote' });
      }
      const gist = selPattern.gist || (selPattern.meaning ? clip(sentences(selPattern.meaning)[0], 70) : '');
      if (gist) items.push({ text: gist, tone: 'plain' });
      else if (skyStatus === 'reading') items.push({ text: 'reading the sky…', tone: 'dim' });
      else if (skyStatus === 'error') items.push({ text: 'couldn’t read the sky just now.', tone: 'dim' });
      if (selPattern.watch) items.push({ text: selPattern.watch, tone: 'accent' });
      if (selPattern.meaning) {
        blockLabel = 'what it means';
        blockParas.push(...selPattern.meaning.split(/\n+/).filter(Boolean));
      }
      for (const l of eff.links.filter((q) => q.a === selPattern.id || q.b === selPattern.id)) {
        const other = patternById.get(l.a === selPattern.id ? l.b : l.a);
        if (other) blockLinks.push({ lead: other.name, text: l.why, go: { kind: 'plink', a: l.a, b: l.b } });
      }
    } else if (sel?.kind === 'plink' && patternById.get(sel.a) && patternById.get(sel.b)) {
      title = `${patternById.get(sel.a)!.name} + ${patternById.get(sel.b)!.name}`;
      kicker = 'how these join';
      const why = eff.links.find((q) => (q.a === sel.a && q.b === sel.b) || (q.a === sel.b && q.b === sel.a))?.why;
      if (why) items.push({ text: clip(why, 120), tone: 'plain' });
    } else if (sel?.kind === 'sky') {
      title = 'what the sky says';
      kicker = `${dreams.length} dreams, ${eff.patterns.length} patterns`;
      if (eff.throughline) {
        items.push({ text: clip(sentences(eff.throughline)[0], 100), tone: 'plain' });
        blockLabel = 'the whole sky';
        blockParas.push(...eff.throughline.split(/\n+/).filter(Boolean));
      } else if (skyStatus === 'reading') items.push({ text: 'reading the sky…', tone: 'dim' });
      else items.push({ text: dreams.length < 2 ? 'interpret another dream and the patterns appear.' : 'no reading yet.', tone: 'dim' });
      for (const q of ranked) blockLinks.push({ lead: q.name, text: `in ${q.dreams.length} ${q.dreams.length === 1 ? 'dream' : 'dreams'}`, go: { kind: 'pattern', id: q.id } });
    } else if (selDream) {
      title = fmtLong(selDream.date);
      kicker = `${moon ? `${moon.name} that night, about ${Math.round(moon.illum * 100)}% lit` : ''}${selDream.sample ? ', sample' : ''}`;
      const carried = patternsOfDream.get(selDream.id) ?? [];
      if (carried.length) items.push({ text: `it carries ${carried.length < 2 ? carried[0].name : carried.slice(0, -1).map((q) => q.name).join(', ') + ' and ' + carried[carried.length - 1].name}.`, tone: 'accent' });
      blockLabel = 'the dream';
      blockParas.push(selDream.text);
    }
  }
  const focusPt = (() => {
    if (!sel) return null;
    const at = (id: string) => {
      const n = pos.get(id);
      return n ? { x: S(n.x, n.y).x, y: S(n.x, n.y).y } : null;
    };
    if (sel.kind === 'pattern') return at('p:' + sel.id);
    if (sel.kind === 'dream') return at('d:' + sel.id);
    if (sel.kind === 'sky') return { x: w * 0.3, y: h * 0.5 };
    const a = at(sel.kind === 'edge' ? 'd:' + sel.dream : 'p:' + sel.a);
    const b = at(sel.kind === 'edge' ? 'p:' + sel.pattern : 'p:' + sel.b);
    return a && b ? { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } : null;
  })();
  const startX = (focusPt?.x ?? w * 0.3) + 24;
  // Each line on the looping path is one whole sentence. If it is too long for the path it gets smaller, never broken onto a second line.
  const availPx = Math.max(260, (w - 40 - startX) * 1.1 * 0.7);
  const maxChars = Math.floor(availPx / (14 * 0.55));
  const wrapped: { text: string; tone: WItem['tone']; fs: number }[] = items.map((it) => {
    const text = clip(it.text, maxChars);
    return { text, tone: it.tone, fs: clamp(availPx / (text.length * 0.55), 14, FS) };
  });
  let typed = Math.floor((timeRef.current * 1000 - typeStartRef.current) / 14);
  const inkColour: Record<WItem['tone'], string> = { plain: '#FFFFFF', accent: YELLOW, quote: GOLD, dim: 'rgba(244,246,255,0.75)' };
  const LINE_GAP = 84;
  const geo = narrow
    ? []
    : wrapped.map((ln, i) => {
        const y1 = 112 + i * LINE_GAP;
        const x1 = w - 40;
        const fy = focusPt?.y ?? h / 2;
        const y0 = y1 + (fy - y1) * 0.08; // rows run almost parallel, so they never cross near the start
        const { d, len } = inkPathFull(startX, y0, x1, y1, 2.3 + i * 1.37, 0, 1, 1.4, 0.93, 0.5, 0.25); // the curl is the flourish after the text
        const shown = ln.text.slice(0, clamp(typed, 0, ln.text.length));
        typed -= ln.text.length;
        return { id: `ink${i}`, d, off: Math.round(len * 0.1), shown, fs: ln.fs, fill: inkColour[ln.tone], stroke: ln.tone === 'accent' ? YELLOW : ICE };
      });
  // The title sits just under whatever you tapped, so it stays close to the thing it names.
  const focusNode = sel ? pos.get(sel.kind === 'dream' ? 'd:' + sel.id : sel.kind === 'pattern' ? 'p:' + sel.id : '') : undefined;
  const focusR = focusNode ? focusNode.r * cam.k * 1.15 : 34;
  const titleW = Math.min(w * 0.42, 420);
  const titleLeft = sel?.kind === 'sky' ? 20 : clamp((focusPt?.x ?? 20) - 24, 16, Math.max(16, w - titleW - 16));
  const titleTop = sel?.kind === 'sky' ? 62 : clamp((focusPt?.y ?? 120) + focusR + 16, 70, Math.max(70, h - 190));
  const titleInColumn = !deep && !!sel && !!title; // every title lives above its text, in the same column
  const blockTop = titleInColumn ? 112 + wrapped.length * LINE_GAP + 16 : Math.max(112 + wrapped.length * LINE_GAP + 28, h * 0.34);
  // what is left of the typing clock after the handwritten lines carries on into the plain text; hidden letters hold their place so nothing jumps
  let rem = typed;
  const typeOn = (t: string): [string, string] => {
    const n = clamp(rem, 0, t.length);
    rem -= t.length;
    return [t.slice(0, n), t.slice(n)];
  };
  const textShadow = {} as CSSProperties; // no shadows or outlines: the vignette does the work
  const quiet: CSSProperties = { background: 'none', border: 0, padding: 0, cursor: 'pointer', color: YELLOW, ...hand, fontSize: 14, textDecoration: 'underline', textDecorationColor: 'rgba(243,243,92,0.4)', textTransform: 'none' };

  const titleBlock = (
    <>
      <div style={{ fontFamily: 'var(--font-doto)', fontWeight: 900, fontSize: narrow ? 20 : 26, textTransform: 'uppercase', color: YELLOW, lineHeight: 1.15 }}>{title}</div>
      {kicker && <div style={{ ...hand, fontSize: 14, opacity: 0.85, marginTop: 6 }}>{kicker}</div>}
      <div data-ui style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginTop: 10, pointerEvents: 'auto' }}>
        {sel?.kind === 'dream' && selDream && (
          <>
            <button style={quiet} onClick={() => diveInto(selDream.id)}>dive in →</button>
            <button style={quiet} onClick={() => copyNote(selDream)}>copy as note</button>
            <button style={quiet} onClick={() => { setDreams((d) => d.filter((x) => x.id !== selDream.id)); select(null); }}>delete</button>
          </>
        )}
        {sel?.kind === 'edge' && <button style={quiet} onClick={() => select({ kind: 'dream', id: sel.dream })}>open this dream →</button>}
        {(skyStatus === 'error' || (sel?.kind === 'sky' && !eff.throughline && dreams.length >= 2)) && <button style={quiet} onClick={retry}>read the sky again</button>}
        <button style={{ ...quiet, opacity: 0.6 }} onClick={() => select(null)}>close ×</button>
      </div>
      {msg && <div style={{ fontSize: 12, color: YELLOW, marginTop: 8 }}>{msg}</div>}
    </>
  );

  return (
    <div
      ref={rootRef}
      style={{
        position: 'fixed',
        inset: 0,
        overflow: 'hidden',
        touchAction: 'none',
        color: '#fff',
        fontFamily: 'var(--font-geist), Helvetica, sans-serif',
        background: backdrop.bg,
        cursor: movedRef.current ? 'grabbing' : 'grab',
      }}
      onClick={() => {
        if (movedRef.current) return;
        if (sel) select(null);
      }}
    >
      <canvas ref={fxCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <canvas ref={skyCanvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />
      <canvas ref={canvasRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }} />

      <svg width={w} height={h} style={{ position: 'absolute', inset: 0, display: 'block' }}>
        <defs>
          <radialGradient id="haloGold" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor={GOLD} stopOpacity="0.5" />
            <stop offset="100%" stopColor={GOLD} stopOpacity="0" />
          </radialGradient>
        </defs>

        <g transform={`translate(${cam.ax} ${cam.ay}) rotate(${(cam.rot * 180) / Math.PI}) scale(${cam.k}) translate(${-cam.x} ${-cam.y})`}>
          {linksRef.current.map((l, li) => {
            const a = pos.get(l.a);
            const b = pos.get(l.b);
            if (!a || !b) return null;
            if (l.kind === 'pp') {
              const len = Math.hypot(b.x - a.x, b.y - a.y);
              const seed = rand01((l.pat ?? '') + l.a + l.b, 11) * 1000;
              const pslack = 0.3 + rand01(l.a + l.b, 9) * 1.6;
              const d = inkPath(a.x, a.y, b.x, b.y, seed, tNow, len > 200 ? 2 : 1, 1.3, undefined, pslack);
              const d2 = inkPath(a.x, a.y, b.x, b.y, seed, tNow + 4, len > 200 ? 2 : 1, 1.3, undefined, pslack);
              const isSel = sel?.kind === 'plink' && ((l.a === 'p:' + sel.a && l.b === 'p:' + sel.b) || (l.a === 'p:' + sel.b && l.b === 'p:' + sel.a));
              const on = !dimming || (focusIds.has(l.a) && focusIds.has(l.b));
              const related = dimming && on;
              const lit = !!sel && related;
              const hovered = !sel && related;
              const why = isSel ? l.why ?? '' : '';
              const wfs = Math.min(15 / cam.k, (len * 1.05 * 0.8) / (Math.max(why.length, 8) * 0.55));
              return (
                <g key={l.a + l.b + 'pp'}>
                  <path d={d2} fill="none" stroke={isSel ? YELLOW : GOLD} strokeWidth={0.8} strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={lit ? 0.45 : dimming ? 0.02 : 0.08} />
                  {(lit || isSel) && <path d={d} fill="none" stroke={isSel ? YELLOW : GOLD} strokeWidth={8} strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.18} />}
                  <path id={`lk${li}`} d={d} fill="none" stroke={isSel ? YELLOW : GOLD} strokeWidth={isSel ? 2.8 : lit ? 2.4 : hovered ? 1.6 : 1} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={isSel ? 1 : lit ? 1 : hovered ? 0.6 : dimming ? 0.04 : 0.18} />
                  {why && (
                    <text fontSize={wfs} fill="#fff" style={{ fontFamily: 'var(--font-schoolbell)'}}>
                      <textPath href={`#lk${li}`} startOffset="6%">{why}</textPath>
                    </text>
                  )}
                  <path
                    d={d}
                    fill="none"
                    stroke="rgba(0,0,0,0)"
                    strokeWidth={18}
                    vectorEffect="non-scaling-stroke"
                    pointerEvents="stroke"
                    style={{ cursor: 'pointer' }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (movedRef.current) return;
                      select({ kind: 'plink', a: l.a.slice(2), b: l.b.slice(2) });
                    }}
                  />
                </g>
              );
            }
            const isSel = sel?.kind === 'edge' && sel.dream === l.dest && sel.pattern === l.pat;
            const on = !dimming || (l.kind === 'dd' ? focusIds.has('p:' + l.pat) && (focusIds.has(l.a) || focusIds.has(l.b)) : focusIds.has(l.a) && focusIds.has(l.b));
            const lineCol = LINE_COLS[Math.floor(hash(l.pat ?? l.b) * 100) % LINE_COLS.length];
            const related = dimming && on; // this string belongs to what is focused
            const lit = !!sel && related; // clicked: it lights up
            const hovered = !sel && related; // only hovering: a half glow
            const len = Math.hypot(b.x - a.x, b.y - a.y);
            const seed = rand01((l.pat ?? '') + l.a + l.b, 11) * 1000;
            const loops = len > 110 ? Math.max(1, Math.min(7, Math.floor(len / 320))) : 0;
            const slack = 0.25 + rand01((l.pat ?? '') + l.a + l.b, 9) * 1.7; // some strings are pulled almost straight, some hang loose
            const d = inkPath(a.x, a.y, b.x, b.y, seed, tNow, loops, 1, undefined, slack);
            const d2 = inkPath(a.x, a.y, b.x, b.y, seed, tNow + 4, loops, 1, undefined, slack);
            // The exact detail from the dream is written along its thread.
            const q = l.detail ?? '';
            const showQuote = !deep && !!q && ((sel?.kind === 'pattern' && l.pat === sel.id) || (sel?.kind === 'dream' && l.dest === sel.id) || isSel);
            const qfs = Math.min(15 / cam.k, (len * 1.05 * 0.8) / (Math.max(q.length, 8) * 0.55));
            return (
              <g key={l.a + l.b + (l.pat ?? '') + l.kind}>
                {d2 && <path d={d2} fill="none" stroke={isSel ? YELLOW : lineCol} strokeWidth={0.8} strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={lit ? 0.45 : dimming ? 0.02 : 0.07} />}
                {(lit || isSel) && <path d={d} fill="none" stroke={isSel ? YELLOW : lineCol} strokeWidth={7} strokeLinecap="round" vectorEffect="non-scaling-stroke" opacity={0.18} />}
                <path id={`lk${li}`} d={d} fill="none" stroke={isSel ? YELLOW : lineCol} strokeWidth={isSel ? 2.6 : lit ? 2.2 : hovered ? 1.5 : 0.9} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" opacity={isSel ? 1 : lit ? 1 : hovered ? 0.6 : dimming ? 0.04 : 0.15} />
                {showQuote && (
                  <text fontSize={qfs} fill="#fff" style={{ fontFamily: 'var(--font-schoolbell)', fontStyle: 'italic'}}>
                    <textPath href={`#lk${li}`} startOffset="8%">“{q}”</textPath>
                  </text>
                )}
                <path
                  d={d}
                  fill="none"
                  stroke="rgba(0,0,0,0)"
                  strokeWidth={18}
                  vectorEffect="non-scaling-stroke"
                  pointerEvents="stroke"
                  style={{ cursor: 'pointer' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (movedRef.current) return;
                    select({ kind: 'edge', dream: l.dest ?? l.a.slice(2), pattern: l.pat ?? l.b.slice(2) });
                  }}
                />
              </g>
            );
          })}

          {nodes
            .filter((n) => n.kind === 'dream')
            .map((n) => {
              const dim = dimming && !focusIds.has(n.id);
              const active = focusNodeId === n.id || (sel?.kind === 'edge' && sel.dream === n.id.slice(2));
              return (
                <g
                  key={n.id}
                  opacity={(dim ? 0.22 : 1) * (1 - 0.35 * n.z)}
                  style={{ cursor: 'grab' }}
                  onPointerEnter={() => setHover(n.id)}
                  onPointerLeave={() => setHover(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (movedRef.current) return;
                    select({ kind: 'dream', id: n.id.slice(2) });
                  }}
                >
                  {/* the blob itself is drawn on the canvas; this is its hit area and detection box */}
                  <circle cx={n.x} cy={n.y} r={n.r * 1.15} fill="rgba(0,0,0,0)" data-node={n.id} />
                  {(active || hover === n.id || cam.k > 1.7) && <rect x={n.x - n.r * 1.3} y={n.y - n.r * 1.3} width={n.r * 2.6} height={n.r * 2.6} fill="none" stroke={YELLOW} strokeWidth={active ? 1.5 : 0.8} opacity={active ? 1 : 0.5} vectorEffect="non-scaling-stroke" pointerEvents="none" />}
                </g>
              );
            })}

          {nodes
            .filter((n) => n.kind === 'pattern')
            .map((n) => {
              const dim = dimming && !focusIds.has(n.id);
              const isSel = (sel?.kind === 'pattern' && 'p:' + sel.id === n.id) || (sel?.kind === 'edge' && 'p:' + sel.pattern === n.id) || (sel?.kind === 'plink' && (n.id === 'p:' + sel.a || n.id === 'p:' + sel.b));
              const R = n.r * 1.6;
              return (
                <g
                  key={n.id}
                  opacity={(dim ? 0.22 : 1) * (1 - 0.35 * n.z)}
                  style={{ cursor: 'grab' }}
                  onPointerEnter={() => setHover(n.id)}
                  onPointerLeave={() => setHover(null)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (movedRef.current) return;
                    select({ kind: 'pattern', id: n.id.slice(2) });
                  }}
                >
                  {/* a gaze-plot fixation: a numbered blue circle, bigger the more often it comes back */}
                  <circle cx={n.x} cy={n.y} r={R * 1.45} fill="none" stroke="rgba(170,195,255,0.35)" strokeWidth={1} vectorEffect="non-scaling-stroke" />
                  <circle cx={n.x} cy={n.y} r={R * 0.95} fill="rgba(30,70,255,0.62)" stroke={isSel ? YELLOW : '#C9D8FF'} strokeWidth={isSel ? 2.4 : 1.4} vectorEffect="non-scaling-stroke" />
                  <text x={n.x} y={n.y + R * 0.3} textAnchor="middle" fill="#fff" fontSize={R * 0.95} style={{ fontFamily: 'var(--font-doto)', fontWeight: 900 }}>{n.count}</text>
                  <circle cx={n.x} cy={n.y} r={R * 1.3} fill="rgba(0,0,0,0)" data-node={n.id} />
                </g>
              );
            })}
          {sel?.kind === 'dream' &&
            (() => {
              const d = byId.get(sel.id);
              if (!d) return null;
              const low = d.text.toLowerCase();
              // the order the patterns showed up in the dream's own words
              const mine = (patternsOfDream.get(d.id) ?? [])
                .map((p, i) => {
                  const det = p.dreams.find((x) => x.id === d.id)?.detail ?? '';
                  const at = det ? low.indexOf(det.toLowerCase().slice(0, 14)) : -1;
                  return { p, at: at < 0 ? 1e6 + i : at };
                })
                .sort((a, b) => a.at - b.at)
                .map((x) => x.p);
              const pts = mine.map((p) => pos.get('p:' + p.id)).filter((n): n is SimNode => !!n);
              if (!pts.length) return null;
              return (
                <g pointerEvents="none">
                  <polyline points={pts.map((n) => `${n.x},${n.y}`).join(' ')} fill="none" stroke={YELLOW} strokeWidth={1.4} vectorEffect="non-scaling-stroke" opacity={0.9} />
                  {pts.map((n, i) => (
                    <g key={n.id}>
                      <circle cx={n.x} cy={n.y} r={n.r * 2.3} fill="none" stroke={YELLOW} strokeWidth={1.4} vectorEffect="non-scaling-stroke" />
                      <text x={n.x + n.r * 1.7} y={n.y - n.r * 1.4} fill={YELLOW} fontSize={n.r * 1.5} style={{ fontFamily: 'var(--font-doto)', fontWeight: 900 }}>{i + 1}</text>
                    </g>
                  ))}
                </g>
              );
            })()}
        </g>
      </svg>

      {/* the vignette: when you fly into something the edges fall away to dark, so words can simply be written on the sky */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          opacity: sel && !deep ? 1 : deep ? 0.55 : 0,
          transition: 'opacity 0.9s ease',
          background: `radial-gradient(ellipse 60% 72% at ${cam.ax}px ${cam.ay}px, rgba(3,5,14,0) 0%, rgba(3,5,14,0.3) 55%, rgba(3,5,14,0.9) 100%), linear-gradient(90deg, rgba(3,5,14,0) 38%, rgba(3,5,14,0.55) 100%)`,
        }}
      />

      {/* Screen-space overlay: pills, labels, coordinate tags, cards. Only the marked bits take clicks. */}
      <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
        {nodes
          .filter((n) => n.kind === 'pattern')
          .map((n) => {
            const dim = dimming && !focusIds.has(n.id);
            if (crowded && n.count < 3 && !focusIds.has(n.id) && hover !== n.id && cam.k < 1.3) return null;
            return (
              <button
                key={n.id}
                data-ui
                onClick={(e) => {
                  e.stopPropagation();
                  select({ kind: 'pattern', id: n.id.slice(2) });
                }}
                onPointerEnter={() => setHover(n.id)}
                onPointerLeave={() => setHover(null)}
                style={{
                  position: 'absolute',
                  left: S(n.x, n.y).x + n.r * 1.6 * cam.k * 1.2 + 6,
                  top: S(n.x, n.y).y,
                  transform: 'translateY(-50%)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  maxWidth: 240,
                  padding: '3px 11px',
                  borderRadius: 999,
                  border: `1px solid ${focusNodeId === n.id ? YELLOW : 'rgba(170,195,255,0.55)'}`,
                  background: 'rgba(30,70,255,0.22)',
                  color: '#fff',
                  fontFamily: 'var(--font-geist)',
                  fontSize: 12,
                  whiteSpace: 'nowrap',
                  cursor: 'pointer',
                  pointerEvents: 'auto',
                  opacity: dim ? 0.25 : 1,
                  backdropFilter: 'blur(3px)',
                }}
              >
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.label}</span>
              </button>
            );
          })}

        {nodes
          .filter((n) => n.kind === 'dream')
          .map((n) => {
            const active = focusNodeId === n.id || (sel?.kind === 'edge' && sel.dream === n.id.slice(2));
            const dim = dimming && !focusIds.has(n.id);
            if (!(cam.k > 1.7 || active || hover === n.id)) return null;
            return (
              <div key={n.id}>
                <div style={{ position: 'absolute', left: S(n.x, n.y + n.r * 1.45).x, top: S(n.x, n.y + n.r * 1.45).y, transform: `translate(-50%, 0) rotate(${cam.rot}rad)`, transformOrigin: '50% 0', background: 'rgba(236,240,248,0.92)', color: INK, padding: '1px 7px', fontFamily: 'var(--font-geist)', fontWeight: 600, fontSize: 11, opacity: dim ? 0.25 : 1, whiteSpace: 'nowrap' }}>{fmt(n.label)}</div>
                {!deep && <div style={{ position: 'absolute', left: S(n.x - n.r * 1.3, n.y - n.r * 1.3).x, top: S(n.x - n.r * 1.3, n.y - n.r * 1.3).y, transform: `translate(0, -100%) rotate(${cam.rot}rad)`, transformOrigin: '0 100%', fontSize: 10, color: YELLOW, opacity: active ? 1 : 0.55, fontFamily: 'var(--font-geist)', whiteSpace: 'nowrap' }}>{coord(n)}</div>}
              </div>
            );
          })}

        {/* top bar */}
        <div data-ui style={{ position: 'absolute', top: 16, left: 20, right: 20, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10, flexWrap: 'wrap', pointerEvents: 'none' }}>
          <div style={{ display: 'flex', gap: 18, alignItems: 'baseline', pointerEvents: 'auto' }}>
            <span style={{ fontFamily: 'var(--font-doto)', fontWeight: 900, fontSize: 20, color: YELLOW, textTransform: 'uppercase' }}>dream map</span>
            <Link href={home} style={{ color: 'rgba(255,255,255,0.75)', textDecoration: 'none', fontSize: 13 }}>
              interpret
            </Link>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', pointerEvents: 'auto', flexWrap: 'wrap' }}>
            {skyStatus === 'reading' && <span style={{ ...hand, fontSize: 13, color: GOLD, animation: 'mapPulse 1.6s ease-in-out infinite' }}>reading the sky…</span>}
            {skyStatus === 'error' && (
              <button style={{ ...ghost, borderColor: 'rgba(255,217,138,0.5)', color: GOLD }} onClick={retry}>
                couldn’t read the sky, try again
              </button>
            )}
            {hasSamples && (
              <button style={ghost} onClick={() => { setDreams((d) => d.filter((x) => !x.sample)); select(null); }}>
                clear samples
              </button>
            )}
            <button style={ghost} onClick={() => select({ kind: 'sky' })}>the sky</button>
            <button style={{ ...ghost, padding: '6px 12px' }} aria-label="zoom in" onClick={() => zoomButton(1.4)}>+</button>
            <button style={{ ...ghost, padding: '6px 12px' }} aria-label="zoom out" onClick={() => zoomButton(1 / 1.4)}>−</button>
            <button style={ghost} onClick={() => select(null)}>fit</button>
          </div>
        </div>

        {!narrow && !sel && (
          <>
            <div style={{ position: 'absolute', left: 20, top: '46%', ...corner }}>
              {dreams.length} {dreams.length === 1 ? 'dream' : 'dreams'}<br />
              {dates.length ? (dates[0] === dates[dates.length - 1] ? fmt(dates[0]) : `${fmt(dates[0])} to ${fmt(dates[dates.length - 1])}`) : ''}
            </div>
            <div style={{ position: 'absolute', right: 20, top: '46%', textAlign: 'right', ...corner }}>
              {eff.patterns.length} {eff.patterns.length === 1 ? 'pattern' : 'patterns'}<br />
              that come back
            </div>
          </>
        )}

        {!sel && (
          <div style={{ position: 'absolute', left: 20, bottom: 24, ...hand, fontSize: 13, opacity: 0.6, pointerEvents: 'none', display: narrow ? 'none' : 'block' }}>
            drag to pan the sky, scroll to zoom, tap a dream, a circle or a thread
          </div>
        )}
        <div data-ui style={{ position: 'absolute', right: narrow ? 18 : 28, bottom: narrow ? 18 : 74, display: narrow && sel ? 'none' : 'block', pointerEvents: 'none' }}>
          {/* One button. Each press moves to the next night sky. */}
          <button
            aria-label={`change the backdrop, now ${backdrop.name}`}
            title={backdrop.name}
            onClick={(e) => {
              e.stopPropagation();
              setSkyId(BACKDROPS[(BACKDROPS.findIndex((b) => b.id === skyId) + 1) % BACKDROPS.length].id);
            }}
            onPointerDown={() => setPressing(true)}
            onPointerUp={() => setPressing(false)}
            onPointerLeave={() => setPressing(false)}
            style={{ ...bevel(pressing), pointerEvents: 'auto' }}
          >
            <PixelSky colors={PX[backdrop.id] ?? PX.nebula} />
          </button>
        </div>
        {!narrow && (
          <div style={{ position: 'absolute', right: 20, bottom: 24, textAlign: 'right', pointerEvents: 'none', fontFamily: 'var(--font-geist)' }}>
            <div style={{ ...corner, fontSize: 13 }}>tonight’s moon: {moonNow.name}</div>
            {skyReady && <div style={{ fontSize: 10, opacity: 0.4, marginTop: 2 }}>stars: Hipparcos via d3-celestial</div>}
          </div>
        )}
        {ready && dreams.length === 0 && <div style={{ position: 'absolute', inset: 0, display: 'grid', placeItems: 'center', ...hand, fontSize: 18, opacity: 0.8 }}>nothing in the sky yet. interpret a dream and it shows up here.</div>}

        {/* ---- the writing ---- */}
        {!deep && title && !titleInColumn && (
          <div style={{ position: 'absolute', left: titleLeft, top: titleTop, maxWidth: narrow ? '86vw' : titleW, pointerEvents: 'none', ...textShadow }}>
            {titleBlock}
          </div>
        )}
        {!deep && !narrow && geo.length > 0 && (
          <svg width={w} height={h} style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
            {geo.map((g) => (
              <path key={g.id} id={g.id} d={g.d} fill="none" stroke={g.stroke} strokeWidth={0.9} strokeLinecap="round" opacity={0.35} />
            ))}
            {geo.map((g) => (
              <text key={'t' + g.id} fill={g.fill} style={{ fontFamily: 'var(--font-schoolbell)', fontSize: g.fs, letterSpacing: '0.04em' }}>
                <textPath href={'#' + g.id} startOffset={g.off}>{g.shown}</textPath>
              </text>
            ))}
          </svg>
        )}
        {!deep && !narrow && (blockParas.length > 0 || blockLinks.length > 0 || titleInColumn) && (
          <div data-ui data-scroll style={{ position: 'absolute', right: 0, top: blockTop, width: 'min(450px, 40vw)', maxHeight: h - blockTop - 96, overflowY: 'auto', padding: '18px 30px 18px 64px', pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
            {titleInColumn && <div style={{ marginBottom: 20 }}>{titleBlock}</div>}
            {blockLabel && <div style={{ ...hand, fontSize: 14, color: YELLOW, marginBottom: 8 }}>{blockLabel}</div>}
            {blockParas.map((para, i) => (
              <p key={i} style={{ margin: '0 0 12px', fontFamily: 'var(--font-geist)', fontSize: 16, lineHeight: 1.6, color: '#F2F4FF' }}>{(() => { const [a, b] = typeOn(para); return (<><span>{a}</span><span style={{ opacity: 0 }}>{b}</span></>); })()}</p>
            ))}
            {blockLinks.length > 0 && (
              <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
                {blockLinks.map((l, i) => (
                  <button key={i} onClick={() => select(l.go)} style={{ background: 'none', border: 0, padding: 0, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-geist)', fontSize: 14, lineHeight: 1.45, color: 'rgba(244,246,255,0.82)' }}>{(() => { const [a, b] = typeOn(l.lead ?? ''); const [c, d] = typeOn(l.text); return (<>{l.lead && <span style={{ display: 'block', ...hand, color: GOLD, fontSize: 14 }}>{a}<span style={{ opacity: 0 }}>{b}</span></span>}<span>{c}</span><span style={{ opacity: 0 }}>{d}</span></>); })()}</button>
                ))}
              </div>
            )}
          </div>
        )}
        {!deep && narrow && (items.length > 0 || blockParas.length > 0 || titleInColumn) && (
          <div data-ui data-scroll style={{ position: 'absolute', left: 0, right: 0, bottom: 0, maxHeight: '46vh', overflowY: 'auto', padding: '36px 18px 74px', pointerEvents: 'auto' }} onClick={(e) => e.stopPropagation()}>
            {titleInColumn && <div style={{ marginBottom: 14 }}>{titleBlock}</div>}
            {items.map((it, i) => (
              <p key={i} style={{ margin: '0 0 8px', fontFamily: 'var(--font-schoolbell)', fontSize: 20, lineHeight: 1.35, color: inkColour[it.tone], ...textShadow }}>{it.text}</p>
            ))}
            {blockParas.map((para, i) => (
              <p key={'b' + i} style={{ margin: '10px 0 0', fontFamily: 'var(--font-geist)', fontSize: 15.5, lineHeight: 1.6, color: '#F2F4FF', ...textShadow }}>{para}</p>
            ))}
            {blockLinks.map((l, i) => (
              <button key={'l' + i} onClick={() => select(l.go)} style={{ display: 'block', background: 'none', border: 0, padding: 0, marginTop: 8, cursor: 'pointer', textAlign: 'left', fontFamily: 'var(--font-geist)', fontSize: 14, lineHeight: 1.45, color: 'rgba(244,246,255,0.82)' }}>{l.lead && <span style={{ display: 'block', ...hand, color: GOLD, fontSize: 14 }}>{l.lead}</span>}{l.text}</button>
            ))}
          </div>
        )}

        {/* all the way in: the dream world, set like a poster straight onto the sky */}
        {deep && selDream && (
          <div data-ui style={{ position: 'absolute', inset: 0, pointerEvents: 'none', ...textShadow }}>
            <div style={{ position: 'absolute', top: 62, left: 0, right: 0, textAlign: 'center' }}>
              <div style={{ fontFamily: 'var(--font-doto)', fontWeight: 900, fontSize: narrow ? 20 : 28, textTransform: 'uppercase', color: YELLOW }}>{fmtLong(selDream.date)}</div>
              {moon && (
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, opacity: 0.85, marginTop: 6 }}>
                  <MoonGlyph phase={moon.phase} /> {moon.name} that night, about {Math.round(moon.illum * 100)}% lit
                </div>
              )}
              <div style={{ marginTop: 8, pointerEvents: 'auto' }}>
                <button style={quiet} onClick={exitDeep}>zoom out ↙</button>
                <button style={{ ...quiet, marginLeft: 14 }} onClick={() => copyNote(selDream)}>copy as note</button>
              </div>
              {msg && <div style={{ fontSize: 12, color: YELLOW, marginTop: 6 }}>{msg}</div>}
            </div>
            <div data-scroll style={narrow ? { position: 'absolute', left: 0, right: 0, bottom: 0, top: 170, overflowY: 'auto', padding: '0 18px 30px', pointerEvents: 'auto', background: 'linear-gradient(rgba(6,10,21,0), rgba(6,10,21,0.85) 12%)' } : { display: 'contents' }}>
              <div data-scroll style={narrow ? {} : { position: 'absolute', left: 28, top: 150, width: 'min(340px, 30vw)', maxHeight: 'calc(100% - 210px)', overflowY: 'auto', pointerEvents: 'auto' }}>
                <div style={{ ...hand, fontSize: 13, color: YELLOW, marginBottom: 6 }}>the dream</div>
                <p style={{ margin: '0 0 22px', fontSize: 17, lineHeight: 1.55 }}>{selDream.text}</p>
                {(patternsOfDream.get(selDream.id) ?? []).length > 0 && (
                  <>
                    <div style={{ ...hand, fontSize: 13, color: GOLD, marginBottom: 8 }}>it carries</div>
                    {(patternsOfDream.get(selDream.id) ?? []).map((p) => (
                      <div key={p.id} style={{ marginBottom: 12 }}>
                        <button style={{ ...quiet, color: GOLD, fontFamily: 'var(--font-geist)', fontSize: 15, textTransform: 'none' }} onClick={() => select({ kind: 'pattern', id: p.id })}>{p.name}</button>
                        {p.dreams.find((x) => x.id === selDream.id)?.detail && <div style={{ opacity: 0.75, fontSize: 13, fontStyle: 'italic', marginLeft: 18 }}>“{p.dreams.find((x) => x.id === selDream.id)?.detail}”</div>}
                      </div>
                    ))}
                  </>
                )}
              </div>
              <div data-scroll style={narrow ? { marginTop: 18 } : { position: 'absolute', right: 28, top: 150, width: 'min(380px, 32vw)', maxHeight: 'calc(100% - 210px)', overflowY: 'auto', pointerEvents: 'auto' }}>
                <div style={{ ...hand, fontSize: 13, color: YELLOW, marginBottom: 6 }}>the reading</div>
                {selDream.reading ? (
                  <>
                    {selDream.reading.reading.split(/\n+/).filter(Boolean).map((para, i) => (
                      <p key={i} style={{ margin: '0 0 10px', fontSize: 14.5, lineHeight: 1.55 }}>{para}</p>
                    ))}
                    {selDream.reading.symbols.length > 0 && (
                      <>
                        <div style={{ ...hand, fontSize: 13, color: GOLD, margin: '16px 0 6px' }}>what showed up</div>
                        {selDream.reading.symbols.map((sy2) => (
                          <div key={sy2.name} style={{ fontSize: 14, lineHeight: 1.45, marginBottom: 6 }}>
                            <span style={{ textTransform: 'uppercase', fontFamily: 'var(--font-doto)', fontWeight: 900, fontSize: 13 }}>{sy2.name}</span>
                            <span style={{ opacity: 0.85 }}> {sy2.note}</span>
                          </div>
                        ))}
                      </>
                    )}
                    {selDream.reading.actions.length > 0 && (
                      <>
                        <div style={{ ...hand, fontSize: 13, color: GOLD, margin: '16px 0 6px' }}>things to try</div>
                        {selDream.reading.actions.map((a, i) => (
                          <div key={i} style={{ fontSize: 14, lineHeight: 1.45, marginBottom: 8 }}>
                            <span style={{ color: YELLOW }}>{String(i + 1).padStart(2, '0')} </span>
                            {a.do}
                            <div style={{ opacity: 0.7, fontSize: 13 }}>{a.why}</div>
                          </div>
                        ))}
                      </>
                    )}
                  </>
                ) : deepRead?.id === selDream.id && deepRead.status === 'error' ? (
                  <div>
                    <p style={{ margin: '0 0 8px', fontSize: 14, opacity: 0.8 }}>the reading didn’t come back.</p>
                    <button style={quiet} onClick={() => loadReading(selDream)}>try again</button>
                  </div>
                ) : (
                  <p style={{ margin: 0, fontSize: 14, opacity: 0.8 }}>reading this dream…</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes mapIn { from { opacity: 0; transform: translateY(8px) scale(0.98); } to { opacity: 1; transform: none; } }
        @keyframes mapPulse { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
        .deep-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 32px; }
        @media (max-width: 760px) { .deep-grid { grid-template-columns: 1fr; gap: 20px; } }
        @media (prefers-reduced-motion: reduce) { * { animation: none !important; } }
      `}</style>
    </div>
  );
}
