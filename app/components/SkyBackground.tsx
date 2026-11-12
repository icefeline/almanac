'use client';

import { useEffect, useRef } from 'react';
import TimeSwitch from './TimeSwitch'; // TEMP
import { skyMoment, skyPalette, type SkyMoment, type SkyStop } from '@/lib/utils/sky-time';
import { drawGarden, gardenFor, islandPose, readDraws, type Plant } from '@/lib/utils/garden';
import { paintCreatures } from '@/lib/utils/creatures';
import { getHere } from '@/lib/utils/here';

/**
 * The sky behind everything: soft drifting clouds, ordered-dithered down to a
 * handful of colours, tinted by the real sun — and a garden growing in it.
 *
 * Fixed and inert. Rendered into a small canvas and scaled up with
 * `image-rendering: pixelated`, so every dither dot is a chunky square; the
 * 90s/2000s look is the resolution, not a filter.
 *
 * The garden (lib/utils/garden.ts) is painted as coverage into an offscreen
 * canvas, then composited in the same pass as the clouds: same Bayer matrix, same
 * lit/shaded split, palette tinted from the sky. It is made of cloud, not laid
 * over it.
 *
 * Time of day comes from lib/utils/sky-time.ts: real solar altitude when the
 * reader has a cached location, the device clock otherwise. `?sky=HH:MM` pins
 * the clock, which is how the other hours get checked without waiting for them.
 *
 * Motion is slow on purpose (~8fps) and stops under prefers-reduced-motion,
 * leaving one still frame that is refreshed each minute.
 */

let PIXEL = 2; // css px per canvas pixel; steps up to 3 if the device can't keep pace
const FPS = 8;

// 8×8 Bayer matrix, normalised to 0..1
const BAYER = (() => {
  const m4 = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5];
  const out = new Float32Array(64);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 8; x++) {
      const q = m4[(y % 4) * 4 + (x % 4)];
      const quad = (y >= 4 ? 2 : 0) + (x >= 4 ? 1 : 0);
      out[y * 8 + x] = (q * 4 + [0, 2, 3, 1][quad] + 0.5) / 64;
    }
  }
  return out;
})();

// value noise on a hashed lattice
function hash(x: number, y: number): number {
  let h = (x * 374761393 + y * 668265263) | 0;
  h = (h ^ (h >>> 13)) * 1274126177;
  return ((h ^ (h >>> 16)) >>> 0) / 4294967295;
}
function noise(x: number, y: number): number {
  const xi = Math.floor(x);
  const yi = Math.floor(y);
  const xf = x - xi;
  const yf = y - yi;
  const u = xf * xf * (3 - 2 * xf);
  const v = yf * yf * (3 - 2 * yf);
  const a = hash(xi, yi);
  const b = hash(xi + 1, yi);
  const c = hash(xi, yi + 1);
  const d = hash(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x: number, y: number): number {
  return (
    noise(x, y) * 0.62 +
    noise(x * 2.03, y * 2.03 + 11.7) * 0.28 +
    noise(x * 4.11, y * 4.11 + 3.3) * 0.1
  );
}

type RGB = [number, number, number];

function rgb(hex: string): RGB {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

function mix3(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t].map(Math.round) as RGB;
}

function smooth(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function parseOverride(): Date | null {
  try {
    const m = /[?&]sky=(\d{1,2}):(\d{2})/.exec(window.location.search);
    if (!m) return null;
    const d = new Date();
    d.setHours(Number(m[1]), Number(m[2]), 0, 0);
    return d;
  } catch {
    return null;
  }
}

export default function SkyBackground() {
  const ref = useRef<HTMLCanvasElement>(null);
  const scrimRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let override = parseOverride();
    let forced: SkyMoment | null = null; // TEMP: set by the time switcher
    let where: { latitude: number; longitude: number } | null = null;
    let palette: SkyStop = skyPalette(skyMoment(override ?? new Date(), null));
    let ramp: RGB[] = [];
    let cl: RGB = [255, 255, 255];
    let cs: RGB = [150, 180, 210];
    // the garden wears the sky's own light: cloud colours pulled toward green and pink
    let leafLit: RGB = cl;
    let leafShade: RGB = cs;
    let bloomLit: RGB = cl;
    let bloomShade: RGB = cs;
    let stars = 0;
    let open = 0;
    // each island wears its own soft colour, so they read as objects against the clouds
    let islandLit: RGB[] = [];
    let islandShade: RGB[] = [];
    let altitude = 0;
    let glow: RGB = [236, 255, 140];
    let w = 0;
    let h = 0;
    let img: ImageData | null = null;
    let raf = 0;
    let slow = 0;
    let last = 0;
    const seed = Math.random() * 1000;
    const t0 = performance.now();

    // the garden is drawn offscreen, then read back as coverage
    const gcanvas = document.createElement('canvas');
    const gctx = gcanvas.getContext('2d', { willReadFrequently: true });
    let plants: Plant[] = [];
    const seen = new Set<string>();
    // Your readings, as plants. Anything that wasn't here at mount (a card drawn while
    // the page is open) starts from seed now instead of appearing fully grown.
    const loadGarden = (initial: boolean) => {
      const next = gardenFor(readDraws(), Date.now());
      const now = (performance.now() - t0) / 1000;
      for (const p of next) {
        if (seen.has(p.id)) continue;
        seen.add(p.id);
        if (!initial) {
          p.delay = now + 0.5;
          p.duration = 20;
        }
      }
      plants = next;
    };
    loadGarden(true);

    const refreshPalette = () => {
      const m = forced ?? skyMoment(override ?? new Date(), where);
      palette = skyPalette(m);
      const top = rgb(palette.top);
      const mid = rgb(palette.mid);
      const hor = rgb(palette.horizon);
      // a 9-step ramp top → horizon; the dither picks between neighbours
      ramp = [];
      for (let k = 0; k < 9; k++) {
        const f = k / 8;
        ramp.push(f < 0.5 ? mix3(top, mid, f * 2) : mix3(mid, hor, (f - 0.5) * 2));
      }
      // brighter sky → deeper scrim, so paper-white text keeps its contrast at noon
      const lum = (c: RGB) => (0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2]) / 255;
      const bright = Math.max(lum(mid), lum(hor));
      if (scrimRef.current) scrimRef.current.style.opacity = String(0.6 + 0.4 * Math.min(1, bright * 1.4));
      cl = rgb(palette.cloudLight);
      cs = rgb(palette.cloudShade);
      leafLit = mix3(cl, [168, 214, 172], 0.6);
      leafShade = mix3(cs, [78, 140, 112], 0.55);
      bloomLit = mix3(cl, [255, 190, 208], 0.62);
      bloomShade = mix3(cs, [196, 112, 160], 0.55);
      stars = Math.max(0, Math.min(1, (-m.altitude - 3) / 9));
      // flowers open with the sun and close as it goes
      open = smooth(-5, 10, m.altitude);
      altitude = m.altitude;
      // the paper on the reading page is tinted by the hour
      document.documentElement.style.setProperty('--sky-tint', palette.mid);
      document.documentElement.style.setProperty('--sky-tint-2', palette.horizon);
      const dusk = 1 - smooth(-9, 3, m.altitude);
      document.documentElement.toggleAttribute('data-night', dusk > 0.6);
      const tints: [RGB, RGB][] = [
        [[255, 196, 150], [204, 120, 112]], // peach
        [[210, 186, 255], [128, 102, 184]], // lilac
        [[186, 238, 200], [84, 156, 134]], // mint
        [[255, 236, 160], [196, 164, 90]], // butter
        [[255, 182, 204], [196, 104, 146]], // rose
        [[164, 224, 240], [74, 146, 184]], // lagoon
      ];
      islandLit = tints.map(([lit]) => mix3(lit, cs, dusk * 0.45));
      islandShade = tints.map(([, shade]) => mix3(shade, [30, 30, 70], dusk * 0.4));
    };

    const resize = () => {
      w = Math.ceil(window.innerWidth / PIXEL);
      h = Math.ceil(window.innerHeight / PIXEL);
      canvas.width = w;
      canvas.height = h;
      gcanvas.width = w;
      gcanvas.height = h;
      img = ctx.createImageData(w, h);
    };

    const draw = (now: number) => {
      if (!img) return;
      const data = img.data;
      const t = reduced ? 0 : (now - t0) / 1000;
      const drift = t * 0.012 + seed;
      const aspect = w / h;

      // garden coverage for this frame; reduced motion gets full-grown, windless plants
      let gd: Uint8ClampedArray | null = null;
      if (gctx) {
        drawGarden(gctx, plants, w, h, reduced ? 1e6 : t, t, open, reduced);
        gd = gctx.getImageData(0, 0, w, h).data;
      }

      let i = 0;
      for (let y = 0; y < h; y++) {
        const fy = y / (h - 1);
        // horizon sits low: the sky is mostly the gradient above it
        const g = Math.min(1, fy / 0.92) * (ramp.length - 1);
        for (let x = 0; x < w; x++) {
          const bayer = BAYER[(y & 7) * 8 + (x & 7)];
          // sky: dither between the two nearest ramp steps
          const gi = Math.min(ramp.length - 2, Math.floor(g));
          const step = g - gi > bayer ? gi + 1 : gi;
          let c = ramp[step];

          // clouds: fbm drifting sideways, thicker toward the middle of the screen
          const nx = (x / w) * aspect * 1.5 + drift;
          const ny = fy * 2.4;
          const d = fbm(nx, ny + seed * 0.1);
          const band = 1 - Math.abs(fy - 0.5) * 0.5;
          const dens = d * band;
          if (dens + (bayer - 0.5) * 0.07 > 0.47) {
            // lit from above-left: compare with a nudged sample for a shaded underside
            const lit = fbm(nx - 0.05, ny - 0.09 + seed * 0.1) * band;
            c = lit + (bayer - 0.5) * 0.08 > dens ? cl : cs;
            if (dens > 0.58 && c === cs && bayer > 0.4) c = cl;
          } else if (stars > 0 && hash(x, y + 977) > 0.992 - stars * 0.006) {
            const tw = reduced ? 1 : 0.55 + 0.45 * Math.sin(t * 1.3 + x * 7.1 + y * 3.7);
            if (tw * stars > bayer * 0.9) c = cl;
          }

          // garden, on top: dithered coverage, lit from the same direction as the clouds
          if (gd) {
            const p = (y * w + x) * 4;
            const a = gd[p + 3];
            if (a > 20 && a / 255 + (bayer - 0.5) * 0.45 > 0.5) {
              const ul = x > 0 && y > 0 ? gd[((y - 1) * w + x - 1) * 4 + 3] : 0;
              const lr = x < w - 1 && y < h - 1 ? gd[((y + 1) * w + x + 1) * 4 + 3] : 0;
              const litEdge = ul < 110;
              const shadeEdge = !litEdge && lr < 110;
              if (gd[p + 2] > 100 && gd[p] < 90 && gd[p + 1] < 90) {
                // island body: plain cloud, lit on top and shading toward its underside
                const under = Math.min(1, Math.max(0, (255 - gd[p + 2]) / 105));
                const tint = Math.round(gd[p] / 12);
                const dark = shadeEdge || bayer < under * 0.95;
                c = tint >= 6 ? (dark ? cs : cl) : dark ? islandShade[tint] : islandLit[tint];
              } else {
                const bloom = gd[p + 1] > gd[p];
                const shaded = shadeEdge || (!litEdge && bayer > 0.72);
                c = bloom ? (shaded ? bloomShade : bloomLit) : shaded ? leafShade : leafLit;
              }
            }
          }

          data[i++] = c[0];
          data[i++] = c[1];
          data[i++] = c[2];
          data[i++] = 255;
        }
      }
      // the small residents, written straight onto the frame
      if (!reduced) {
        let snail = null;
        for (const p of plants) {
          if (p.species !== 'island') continue;
          const pose = islandPose(p, w, h, t, false);
          if (pose && pose.cx > pose.W && pose.cx < w - pose.W && pose.cy > 0 && pose.cy < h) {
            snail = { x: pose.cx, y: pose.cy, W: pose.W };
            break;
          }
        }
        paintCreatures(
          data,
          w,
          h,
          t,
          altitude,
          { light: cl, shade: cs, pink: bloomLit, pinkShade: bloomShade, glow },
          snail,
        );
      }
      ctx.putImageData(img, 0, 0);
    };

    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      if (document.hidden || now - last < 1000 / FPS) return;
      last = now;
      const t = performance.now();
      draw(now);
      // too slow to hold the frame rate: coarsen the grid once rather than stutter
      if (PIXEL < 3 && performance.now() - t > 90 && ++slow > 4) {
        PIXEL = 3;
        resize();
      }
    };

    resize();
    refreshPalette();
    draw(performance.now());
    if (!reduced) raf = requestAnimationFrame(loop);

    getHere({ ask: false })
      .then((here) => {
        if (here) {
          where = { latitude: here.latitude, longitude: here.longitude };
          refreshPalette();
          if (reduced) draw(performance.now());
        }
      })
      .catch(() => {});

    const replant = () => {
      loadGarden(false);
      if (reduced) draw(performance.now());
    };
    // TEMP: the time-of-day switcher below pins the sky to a chosen hour (null = live)
    const onSky = (e: Event) => {
      // detail: { altitude, morning } pins the sun; null goes back to the real sky
      const v = (e as CustomEvent<{ altitude: number; morning: boolean } | null>).detail;
      forced = v ? { altitude: v.altitude, morning: v.morning } : null;
      refreshPalette();
      if (reduced) draw(performance.now());
    };
    window.addEventListener('sg:sky', onSky);
    window.addEventListener('sg:drew', replant);
    window.addEventListener('storage', replant);
    const minute = window.setInterval(() => {
      loadGarden(false);
      refreshPalette();
      if (reduced) draw(performance.now());
    }, 60_000);
    const onResize = () => {
      resize();
      if (reduced) draw(performance.now());
    };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      window.clearInterval(minute);
      window.removeEventListener('resize', onResize);
      window.removeEventListener('sg:drew', replant);
      window.removeEventListener('sg:sky', onSky);
      window.removeEventListener('storage', replant);
    };
  }, []);

  return (
    <>
      <TimeSwitch />
      <canvas
        ref={ref}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{ width: '100%', height: '100%', imageRendering: 'pixelated' }}
      />
      {/* a light vignette, deeper when the sky is bright */}
      <div
        ref={scrimRef}
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            'radial-gradient(ellipse 80% 70% at 50% 40%, rgba(14,20,11,.16) 0%, rgba(14,20,11,.06) 60%, rgba(14,20,11,.24) 100%)',
        }}
      />
    </>
  );
}
