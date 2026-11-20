/**
 * The way into the dream map: the page you are on is dithered away into the map's own sky, and the map is dithered back out of it.
 * It is one ordered-dither pattern (the same Bayer grid the dream blobs use) played in both directions: cells fill in as the
 * threshold rises, and the map's page empties them again in the reverse order. The cells are painted in the colours of the sky
 * the map is about to open under, so the page goes from cobalt to that sky and never passes through black. The overlay is a
 * plain canvas on the body, so it survives the client-side navigation between the two pages.
 */

const ID = 'milky-dither';
const CELL = 2; // one dither cell, in screen pixels: finer than the dots in the map
const MAX = 0.9; // the sky never quite covers the page, so the two cross over and there is no solid moment in between
const FALLBACK = [14, 22, 66, 255]; // if a sky can't be painted

/** An 8 by 8 ordered-dither (Bayer) matrix, built the usual way. */
const BAYER: number[] = (() => {
  let m = [0];
  let n = 1;
  while (n < 8) {
    const next = new Array(n * 2 * n * 2).fill(0);
    for (let y = 0; y < n; y++)
      for (let x = 0; x < n; x++) {
        const v = m[y * n + x] * 4;
        next[y * 2 * n + x] = v;
        next[y * 2 * n + x + n] = v + 2;
        next[(y + n) * 2 * n + x] = v + 3;
        next[(y + n) * 2 * n + x + n] = v + 1;
      }
    m = next;
    n *= 2;
  }
  return m.map((v) => (v + 0.5) / 64);
})();

const ease = (t: number) => (t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2);

/** An ease with surges and lulls in it, a little different each time: the dither rushes, hesitates, rushes again. */
let wob = { f: 5.5, ph: 0, a: 0.04 };
const vary = (t: number) => Math.min(1, Math.max(0, ease(t) + wob.a * Math.sin(wob.f * Math.PI * t + wob.ph) * (1 - Math.abs(2 * t - 1))));
const reseed = () => (wob = { f: 4 + Math.random() * 4, ph: Math.random() * Math.PI * 2, a: 0.035 + Math.random() * 0.025 });

/** Smooth value noise over the cells, so different parts of the screen arrive earlier or later than others. */
function noiseField(w: number, h: number): Float32Array {
  const G = 26;
  const gw = Math.ceil(w / G) + 2;
  const gh = Math.ceil(h / G) + 2;
  const lat = Float32Array.from({ length: gw * gh }, () => Math.random());
  const out = new Float32Array(w * h);
  for (let y = 0; y < h; y++) {
    const fy = y / G;
    const y0 = Math.floor(fy);
    const ty = fy - y0;
    const sy = ty * ty * (3 - 2 * ty);
    for (let x = 0; x < w; x++) {
      const fx = x / G;
      const x0 = Math.floor(fx);
      const tx = fx - x0;
      const sx = tx * tx * (3 - 2 * tx);
      const a = lat[y0 * gw + x0] * (1 - sx) + lat[y0 * gw + x0 + 1] * sx;
      const b = lat[(y0 + 1) * gw + x0] * (1 - sx) + lat[(y0 + 1) * gw + x0 + 1] * sx;
      out[y * w + x] = a * (1 - sy) + b * sy;
    }
  }
  return out;
}

function reduced() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

// ---- painting a sky from its CSS definition ----
// Every sky is a base colour under some `radial-gradient(ellipse at X% Y%, colour, transparent N%)` glows and, in one case, a
// `linear-gradient(angle, stops)` band. That is all this needs to read.

/** Split on commas that are not inside brackets. */
function splitTop(s: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let cur = '';
  for (const ch of s) {
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ',' && depth === 0) {
      out.push(cur.trim());
      cur = '';
    } else cur += ch;
  }
  if (cur.trim()) out.push(cur.trim());
  return out;
}

/** The inside of `name( ... )`. */
function inner(layer: string): string {
  return layer.slice(layer.indexOf('(') + 1, layer.lastIndexOf(')'));
}

/** A colour as [r, g, b, a], whatever notation it was written in. */
function rgba(ctx: CanvasRenderingContext2D, col: string): [number, number, number, number] {
  ctx.fillStyle = '#000';
  ctx.fillStyle = col;
  const v = ctx.fillStyle as string;
  if (v.startsWith('#')) {
    const n = parseInt(v.slice(1), 16);
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255, 1];
  }
  const m = v.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0, 1];
  return [m[0], m[1], m[2], m[3] ?? 1];
}
const css = (c: [number, number, number, number], a = c[3]) => `rgba(${c[0]},${c[1]},${c[2]},${a})`;

function paintSky(bg: string, w: number, h: number): Uint8ClampedArray | null {
  try {
    const cv = document.createElement('canvas');
    cv.width = w;
    cv.height = h;
    const ctx = cv.getContext('2d', { willReadFrequently: true });
    if (!ctx) return null;
    const layers = splitTop(bg);
    ctx.fillStyle = layers[layers.length - 1];
    ctx.fillRect(0, 0, w, h);
    for (let k = layers.length - 2; k >= 0; k--) {
      const L = layers[k];
      const parts = splitTop(inner(L));
      if (L.startsWith('radial-gradient')) {
        const at = parts[0].match(/at\s+([\d.]+)%\s+([\d.]+)%/);
        if (!at) continue;
        const cx = (Number(at[1]) / 100) * w;
        const cy = (Number(at[2]) / 100) * h;
        const c = rgba(ctx, parts[1]);
        const end = Number(parts[2].match(/([\d.]+)%/)?.[1] ?? 100) / 100;
        // an ellipse reaching the farthest corner: the farthest-side ellipse scaled by root two
        const rx = Math.SQRT2 * Math.max(cx, w - cx);
        const ry = Math.SQRT2 * Math.max(cy, h - cy);
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(rx, ry);
        const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
        g.addColorStop(0, css(c));
        g.addColorStop(Math.min(1, end), css(c, 0)); // fades to nothing in its own hue, as CSS does
        ctx.fillStyle = g;
        ctx.fillRect(-cx / rx, -cy / ry, w / rx, h / ry);
        ctx.restore();
      } else if (L.startsWith('linear-gradient')) {
        const deg = parseFloat(parts[0]);
        const a = (deg * Math.PI) / 180;
        const len = Math.abs(w * Math.sin(a)) + Math.abs(h * Math.cos(a));
        const dx = Math.sin(a);
        const dy = -Math.cos(a);
        const g = ctx.createLinearGradient(w / 2 - (dx * len) / 2, h / 2 - (dy * len) / 2, w / 2 + (dx * len) / 2, h / 2 + (dy * len) / 2);
        const stops = parts.slice(1).map((p) => {
          const m = p.match(/^(.*?)\s+([\d.]+)%$/);
          return { col: m ? m[1] : p, at: m ? Number(m[2]) / 100 : 0 };
        });
        const solid = stops.find((s) => s.col !== 'transparent');
        const base = solid ? rgba(ctx, solid.col) : ([0, 0, 0, 1] as [number, number, number, number]);
        for (const s of stops) g.addColorStop(Math.min(1, Math.max(0, s.at)), s.col === 'transparent' ? css(base, 0) : s.col);
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, w, h);
      }
    }
    return ctx.getImageData(0, 0, w, h).data;
  } catch {
    return null;
  }
}

// ---- the overlay ----

interface Cover {
  c: HTMLCanvasElement;
  img: ImageData;
  thr: Float32Array;
}
let cover: Cover | null = null;

function makeCover(bg: string): Cover {
  document.getElementById(ID)?.remove();
  const w = Math.ceil(window.innerWidth / CELL);
  const h = Math.ceil(window.innerHeight / CELL);
  const c = document.createElement('canvas');
  c.id = ID;
  c.width = w;
  c.height = h;
  c.setAttribute('aria-hidden', 'true');
  c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483000;image-rendering:pixelated;pointer-events:auto;';
  document.body.appendChild(c);
  const ctx = c.getContext('2d')!;
  const img = ctx.createImageData(w, h);
  const sky = paintSky(bg, w, h);
  const thr = new Float32Array(w * h);
  const field = noiseField(w, h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      // mostly the ordered dither, tilted by the noise so the cells don't all arrive together
      thr[i] = 0.55 * BAYER[(y % 8) * 8 + (x % 8)] + 0.45 * field[i];
      const o = i * 4;
      img.data[o] = sky ? sky[o] : FALLBACK[0];
      img.data[o + 1] = sky ? sky[o + 1] : FALLBACK[1];
      img.data[o + 2] = sky ? sky[o + 2] : FALLBACK[2];
    }
  }
  // spread the thresholds evenly over 0 to 1 (mixing in the noise bunches them up), so that p really is the share of the screen covered
  const BINS = 512;
  const hist = new Float32Array(BINS);
  for (let i = 0; i < thr.length; i++) hist[Math.min(BINS - 1, Math.floor(thr[i] * BINS))]++;
  const cdf = new Float32Array(BINS);
  let run = 0;
  for (let b = 0; b < BINS; b++) {
    cdf[b] = (run + hist[b] / 2) / thr.length; // the middle of this bin's share
    run += hist[b];
  }
  for (let i = 0; i < thr.length; i++) thr[i] = cdf[Math.min(BINS - 1, Math.floor(thr[i] * BINS))];
  return { c, img, thr };
}

/** Show every cell whose threshold is below `p` (0 shows the page, 1 hides it). */
function paint(cv: Cover, p: number) {
  const d = cv.img.data;
  const t = cv.thr;
  for (let i = 0; i < t.length; i++) d[i * 4 + 3] = t[i] < p ? 255 : 0;
  cv.c.getContext('2d')?.putImageData(cv.img, 0, 0);
}

function run(cv: Cover, from: number, to: number, ms: number, done: () => void) {
  const t0 = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - t0) / ms);
    paint(cv, from + (to - from) * vary(t));
    if (t < 1) requestAnimationFrame(frame);
    else done();
  };
  requestAnimationFrame(frame);
}

/**
 * Dither the current page away into the sky described by `bg`, then call `then` (to navigate). The overlay stays up until the
 * next page calls `ditherReveal`.
 */
export function ditherCover(bg: string, then: () => void): void {
  if (reduced()) {
    then();
    return;
  }
  reseed();
  cover = makeCover(bg);
  run(cover, 0, MAX, 800, then);
  // if the next page never comes to take it down, don't leave the screen covered
  window.setTimeout(ditherReveal, 6000);
}

/** Called by the map when it is ready: dither the sky away to show the map. Does nothing if there is no overlay to take down. */
export function ditherReveal(): void {
  const el = document.getElementById(ID);
  if (!el) return;
  if (!cover || cover.c !== el || reduced()) {
    el.remove();
    cover = null;
    return;
  }
  const cv = cover;
  reseed();
  run(cv, MAX, 0, 1100, () => {
    cv.c.remove();
    if (cover === cv) cover = null;
  });
}
