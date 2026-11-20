/**
 * The way into the dream map: the page you are on is dithered away into the map's night, and the map is dithered back out of it.
 * It is one ordered-dither pattern (the same Bayer grid the dream blobs use) played in both directions: cells fill in as the
 * threshold rises, and the map's own page empties them again in the reverse order. The overlay is a plain canvas on the body,
 * so it survives the client-side navigation between the two pages.
 */

const ID = 'milky-dither';
const CELL = 7; // size of one dither cell, in screen pixels
const NIGHT = [6, 10, 21]; // the map's own ground

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

function reduced() {
  return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}

function overlay(): HTMLCanvasElement {
  let c = document.getElementById(ID) as HTMLCanvasElement | null;
  if (!c) {
    c = document.createElement('canvas');
    c.id = ID;
    c.setAttribute('aria-hidden', 'true');
    c.style.cssText = 'position:fixed;inset:0;width:100vw;height:100vh;z-index:2147483000;image-rendering:pixelated;pointer-events:auto;';
    document.body.appendChild(c);
  }
  const w = Math.ceil(window.innerWidth / CELL);
  const h = Math.ceil(window.innerHeight / CELL);
  if (c.width !== w || c.height !== h) {
    c.width = w;
    c.height = h;
  }
  return c;
}

/** Draw every cell whose threshold is below `p` (0 shows the page, 1 hides it). */
function paint(c: HTMLCanvasElement, p: number) {
  const ctx = c.getContext('2d');
  if (!ctx) return;
  const img = ctx.createImageData(c.width, c.height);
  const d = img.data;
  for (let y = 0; y < c.height; y++) {
    for (let x = 0; x < c.width; x++) {
      if (BAYER[(y % 8) * 8 + (x % 8)] < p) {
        const i = (y * c.width + x) * 4;
        d[i] = NIGHT[0];
        d[i + 1] = NIGHT[1];
        d[i + 2] = NIGHT[2];
        d[i + 3] = 255;
      }
    }
  }
  ctx.putImageData(img, 0, 0);
}

function run(from: number, to: number, ms: number, done: () => void) {
  const c = overlay();
  const t0 = performance.now();
  const frame = (now: number) => {
    const t = Math.min(1, (now - t0) / ms);
    paint(c, from + (to - from) * ease(t));
    if (t < 1) requestAnimationFrame(frame);
    else done();
  };
  requestAnimationFrame(frame);
}

/** Dither the current page away, then call `then` (to navigate). The overlay stays up until the next page calls `ditherReveal`. */
export function ditherCover(then: () => void): void {
  if (reduced()) {
    then();
    return;
  }
  run(0, 1, 650, then);
  // if the next page never comes to take it down, don't leave the screen covered
  window.setTimeout(ditherReveal, 6000);
}

/** Called by the map when it is ready: dither the night away to show it. Does nothing if there is no overlay to take down. */
export function ditherReveal(): void {
  const c = document.getElementById(ID) as HTMLCanvasElement | null;
  if (!c) return;
  if (reduced()) {
    c.remove();
    return;
  }
  run(1, 0, 900, () => c.remove());
}
