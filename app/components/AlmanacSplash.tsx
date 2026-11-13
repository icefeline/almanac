'use client';

import { useEffect, useRef } from 'react';

/**
 * The splash: the word "almanac" set big in a heavy italic, cut into hard pixels, the way the
 * Y2K posters it borrows from do it. Cobalt for the letters with a lime echo behind them that
 * dissolves into halftone dots toward the lower left, thin orbit rings stepping across the page
 * and a pair of pixel sparkles that twinkle.
 *
 * It is drawn on a small canvas (a cell is a few screen pixels) and scaled up unsmoothed, so every
 * edge is a square. Colours come from the page: `tone="light"` is the fixed cobalt and lime for
 * the cream desktop window; `tone="sky"` follows the live sky (cobalt by day, lime at night), the
 * same swap the reading page makes.
 */

// an 8x8 ordered-dither matrix, built up from the 2x2 one: sixty-four levels, so a gradient steps smoothly
const BAYER8 = (() => {
  let m = [[0, 2], [3, 1]];
  for (let n = 2; n < 8; n *= 2) {
    const next: number[][] = Array.from({ length: n * 2 }, () => Array(n * 2).fill(0));
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = m[y][x] * 4;
        next[y][x] = v;
        next[y][x + n] = v + 2;
        next[y + n][x] = v + 3;
        next[y + n][x + n] = v + 1;
      }
    }
    m = next;
  }
  return m;
})();

const COBALT = '#2B35D6';
const LIME = '#C9F24E';

function hex(c: string): [number, number, number] {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return [43, 53, 214];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function palette(tone: 'light' | 'sky') {
  if (tone === 'light') return { main: hex(COBALT), echo: hex(LIME) };
  const cs = getComputedStyle(document.documentElement);
  return {
    main: hex(cs.getPropertyValue('--accent-c') || COBALT),
    echo: hex(cs.getPropertyValue('--lime-c') || LIME),
  };
}

const smooth = (t: number) => {
  const x = Math.max(0, Math.min(1, t));
  return x * x * (3 - 2 * x);
};

export default function AlmanacSplash({ tone = 'sky' }: { tone?: 'light' | 'sky' }) {
  const wrap = useRef<HTMLDivElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const box = wrap.current;
    const canvas = cv.current;
    if (!box || !canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let base: ImageData | null = null;
    let C = 0;
    let R = 0;
    let layout = { ax: 0, ay: 0, bx: 0, by: 0 };
    let colours = palette(tone);
    let timer = 0;
    let t0 = performance.now();

    const build = () => {
      const w = box.clientWidth;
      const h = box.clientHeight;
      if (!w || !h) return;
      // a fine grid, so the dither reads as a smooth tone rather than a coarse checker
      const cell = Math.max(2, Math.min(3, Math.floor(w / 190)));
      C = Math.ceil(w / cell);
      R = Math.ceil(h / cell);
      canvas.width = C;
      canvas.height = R;
      colours = palette(tone);

      const fam =
        getComputedStyle(document.body).getPropertyValue('--font-instrument-serif').trim() || 'serif';

      // ── the word, set again and again: each line a little more broken than the one above ──
      const mk = () => {
        const c = document.createElement('canvas');
        c.width = C;
        c.height = R;
        return c;
      };
      const ROWS = 5;
      const GAP = 0.78; // the lines sit tight, nearly touching
      const tc = mk();
      const tx = tc.getContext('2d', { willReadFrequently: true })!;
      tx.font = `italic 400 100px ${fam}`;
      const m100 = tx.measureText('almanac');
      const w100 = m100.width || 400;
      const h100 = m100.actualBoundingBoxAscent + m100.actualBoundingBoxDescent || 100;
      // as wide as about three quarters of the screen (never more than ~640px), and the stack no taller than ~46% of it
      const px = Math.min(
        (100 * Math.min(C * 0.74, 640 / cell)) / w100,
        (100 * R * 0.46) / (h100 * (1 + (ROWS - 1) * GAP)),
      );
      tx.font = `italic 400 ${px}px ${fam}`;
      const m = tx.measureText('almanac');
      const asc = m.actualBoundingBoxAscent;
      const desc = m.actualBoundingBoxDescent;
      const lineH = (asc + desc) * GAP;
      const wordW = m.width;
      const wordH = asc + desc + lineH * (ROWS - 1);
      const cx = C / 2;
      const cy = R * 0.47;
      const wy0 = cy - wordH / 2;
      const x0 = cx - wordW / 2;
      tx.textAlign = 'left';
      tx.fillStyle = '#000';
      tx.strokeStyle = '#000';
      tx.lineJoin = 'round';
      tx.lineWidth = px * 0.03;
      for (let i = 0; i < ROWS; i++) {
        tx.fillText('almanac', x0, wy0 + asc + lineH * i);
        tx.strokeText('almanac', x0, wy0 + asc + lineH * i);
      }
      const clean = tx.getImageData(0, 0, C, R).data;

      // a steady pseudo-random number from three integers, so the damage is the same every draw
      const hash = (a1: number, b1: number, c1: number) => {
        let h = (Math.imul(a1, 374761393) + Math.imul(b1, 668265263) + Math.imul(c1, 2147483647)) | 0;
        h = Math.imul(h ^ (h >>> 13), 1274126177);
        return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
      };
      // the damage: from the second line down, bands of the line slip sideways, small blocks drop out,
      // and thin stripes are cut through it, more with each line
      const mask = new Uint8ClampedArray(C * R);
      for (let y = 0; y < R; y++) {
        const row = Math.max(0, Math.min(ROWS - 1, Math.floor((y - wy0) / lineH)));
        const g = Math.pow(row / (ROWS - 1), 1.15);
        const band = Math.floor(y / 3);
        const slip =
          g > 0 && hash(band, row, 7) < g * 0.55
            ? Math.round((hash(band, row, 11) - 0.5) * 2 * g * px * 0.1)
            : 0;
        for (let x = 0; x < C; x++) {
          const sx = x - slip;
          let a = sx < 0 || sx >= C ? 0 : clean[(y * C + sx) * 4 + 3];
          if (a && g > 0) {
            if (hash(x >> 1, y >> 1, row + 31) < g * 0.32) a = 0;
            else if (g > 0.5 && ((y >> 1) & 1) === 0 && hash(x >> 2, row, 5) < (g - 0.5) * 0.6) a = 0;
          }
          mask[y * C + x] = a;
        }
      }
      const cov = (x: number, y: number) =>
        x < 0 || y < 0 || x >= C || y >= R ? 0 : mask[y * C + x] / 255;
      layout = { ax: x0 + wordW, ay: wy0, bx: x0 - C * 0.02, by: wy0 + wordH };

      // ── loose rings, as on the poster: a handful of thin ellipses at different tilts and sizes, cobalt
      //    and lime, crossing one another and running off the edges, all behind the lettering ──
      const lw = Math.max(1.1, 3 / cell);
      const ring = (rx: number, ry: number, rot: number, ox: number, oy: number, width: number) => {
        const rc = mk();
        const rt = rc.getContext('2d', { willReadFrequently: true })!;
        rt.strokeStyle = '#000';
        rt.lineWidth = width;
        rt.beginPath();
        rt.ellipse(ox, oy, rx, ry, rot, 0, Math.PI * 2);
        rt.stroke();
        return rt.getImageData(0, 0, C, R).data;
      };
      const loose: { a: Uint8ClampedArray; c: 'main' | 'echo' }[] = [
        { c: 'echo', a: ring(C * 0.6, R * 0.15, 0.08, cx + C * 0.04, cy + R * 0.02, lw) },
        { c: 'main', a: ring(C * 0.62, R * 0.13, -0.14, cx - C * 0.05, cy, lw) },
        { c: 'main', a: ring(C * 0.46, R * 0.21, -0.5, cx + C * 0.1, cy - R * 0.03, lw * 0.9) },
        { c: 'echo', a: ring(C * 0.5, R * 0.19, 0.45, cx - C * 0.12, cy + R * 0.04, lw * 0.9) },
        { c: 'main', a: ring(C * 0.78, R * 0.17, 0.12, cx - C * 0.3, R * 0.08, lw) },
        { c: 'echo', a: ring(C * 0.72, R * 0.1, -0.07, cx + C * 0.26, R * 0.8, lw) },
      ];

      // ── the lime shadow: the lines, shifted down and left and blurred, so it is a soft tone to dither ──
      const dc = mk();
      const dx2 = dc.getContext('2d')!;
      const dimg = dx2.createImageData(C, R);
      for (let i = 0; i < C * R; i++) dimg.data[i * 4 + 3] = mask[i];
      dx2.putImageData(dimg, 0, 0);
      const off = Math.max(2, Math.round(px * 0.028));
      const ec = mk();
      const ex = ec.getContext('2d', { willReadFrequently: true })!;
      ex.filter = `blur(${(px * 0.022).toFixed(1)}px)`;
      ex.drawImage(dc, -off, off);
      const eMask = ex.getImageData(0, 0, C, R).data;

      // ── compose ──────────────────────────────────────────────────────────────
      const img = ctx.createImageData(C, R);
      const d = img.data;
      const put = (x: number, y: number, c: [number, number, number]) => {
        const i = (y * C + x) * 4;
        d[i] = c[0];
        d[i + 1] = c[1];
        d[i + 2] = c[2];
        d[i + 3] = 255;
      };
      
      for (let y = 0; y < R; y++) {
        for (let x = 0; x < C; x++) {
          const th = (BAYER8[y & 7][x & 7] + 0.5) / 64;
          // the rings go down first and the lettering paints over them
          for (const r of loose) if (r.a[(y * C + x) * 4 + 3] > 90) put(x, y, colours[r.c]);

          const solid = cov(x, y) > 0.5;
          // the shadow: its alpha is the tone, the ordered dither turns the tone into dots
          const tone = eMask[(y * C + x) * 4 + 3] / 255;
          // capped below full strength, so the glow stays a soft dotted tone and never fills in solid
          if (!solid && tone * 0.78 > th) put(x, y, colours.echo);
          if (solid) put(x, y, colours.main);
        }
      }
      base = img;
    };

    const star = (cx: number, cy: number, r: number, c: [number, number, number]) => {
      ctx.fillStyle = `rgb(${c[0]},${c[1]},${c[2]})`;
      const R0 = Math.max(2, Math.round(r));
      for (let k = -R0; k <= R0; k++) {
        ctx.fillRect(cx + k, cy, 1, 1);
        ctx.fillRect(cx, cy + k, 1, 1);
      }
      const dr = Math.round(R0 * 0.55);
      for (let k = 1; k <= dr; k++) {
        for (const [sx, sy] of [[1, 1], [1, -1], [-1, 1], [-1, -1]]) {
          if (k % 2 === 1) ctx.fillRect(cx + sx * k, cy + sy * k, 1, 1);
        }
      }
      // a dithered knot in the middle
      for (let a = -2; a <= 2; a++) {
        for (let b = -2; b <= 2; b++) {
          if ((a + b) % 2 === 0 && Math.abs(a) + Math.abs(b) <= 3) ctx.fillRect(cx + a, cy + b, 1, 1);
        }
      }
    };

    const draw = () => {
      if (!base) return;
      ctx.putImageData(base, 0, 0);
      const t = (performance.now() - t0) / 1000;
      const tw = (p: number) => 0.62 + 0.38 * Math.sin(t * 1.7 + p);
      const { ax, ay, bx, by } = layout;
      star(Math.round(ax + C * 0.015), Math.round(ay - C * 0.02), (C * 0.05) * (reduced ? 1 : tw(0)), colours.main);
      star(Math.round(bx), Math.round(by + C * 0.03), (C * 0.04) * (reduced ? 1 : tw(2.1)), colours.main);
    };

    const start = () => {
      build();
      draw();
      window.clearInterval(timer);
      if (!reduced) timer = window.setInterval(draw, 130);
    };

    start();
    const ro = new ResizeObserver(() => {
      start();
    });
    ro.observe(box);
    // the sky changes colour as the hour does
    const mo = new MutationObserver(() => {
      colours = palette(tone);
      build();
      draw();
    });
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-night'] });
    // the serif is only fetched once something asks for it, so ask, then draw again with the real letters
    const fam = getComputedStyle(document.body).getPropertyValue('--font-instrument-serif').trim();
    if (fam && document.fonts) {
      document.fonts.load(`italic 400 100px ${fam}`).then(() => {
        build();
        draw();
      });
    }
    t0 = performance.now();

    return () => {
      window.clearInterval(timer);
      ro.disconnect();
      mo.disconnect();
    };
  }, [tone]);

  return (
    <div ref={wrap} style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none' }}>
      <canvas
        ref={cv}
        role="img"
        aria-label="almanac"
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', imageRendering: 'pixelated' }}
      />
    </div>
  );
}
