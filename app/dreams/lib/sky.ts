/**
 * The real sky behind the map: ~5,000 naked-eye stars (Hipparcos, via d3-celestial) and constellation lines,
 * drawn with a stereographic projection so constellations keep their true shape. Panning the map turns the sky.
 * Data: /public/sky/stars.json, /public/sky/lines.json (see README.txt there).
 */

export const RAD = Math.PI / 180;

interface Pt {
  ra: number;
  dec: number;
  sinD: number;
  cosD: number;
}
export interface SkyData {
  n: number;
  ra: Float32Array;
  dec: Float32Array;
  sinD: Float32Array;
  cosD: Float32Array;
  mag: Float32Array;
  bucket: Uint8Array;
  named: (Pt & { name: string; mag: number })[];
  lines: Pt[][];
}
export interface SkyView {
  ra0: number; // radians, where the view is centred
  dec0: number;
  scale: number; // px per stereographic unit
}

/** Star colour from B-V: blue-white, white, cream, orange, red-orange. */
const COLS = ['#AFC6FF', '#E8EEFF', '#FFF4E0', '#FFD9A8', '#FFB38A'];
const bucketOf = (bv: number) => (bv < 0 ? 0 : bv < 0.45 ? 1 : bv < 0.8 ? 2 : bv < 1.3 ? 3 : 4);
const pt = (lon: number, lat: number): Pt => ({ ra: lon * RAD, dec: lat * RAD, sinD: Math.sin(lat * RAD), cosD: Math.cos(lat * RAD) });

export async function loadSky(): Promise<SkyData | null> {
  try {
    const sres = await fetch('/sky/stars.json');
    if (!sres.ok) return null;
    const s = await sres.json();
    const rows = s.stars as number[][];
    // Sorted by colour so drawing only switches fill style five times a frame.
    const order = rows.map((_, i) => i).sort((a, b) => bucketOf(rows[a][3]) - bucketOf(rows[b][3]));
    const n = rows.length;
    const sky: SkyData = {
      n,
      ra: new Float32Array(n),
      dec: new Float32Array(n),
      sinD: new Float32Array(n),
      cosD: new Float32Array(n),
      mag: new Float32Array(n),
      bucket: new Uint8Array(n),
      named: (s.named as [string, number, number, number][]).map(([name, lon, lat, mag]) => ({ ...pt(lon, lat), name, mag })),
      lines: [], // constellation lines are no longer drawn: too busy behind everything else
    };
    order.forEach((src, i) => {
      const [lon, lat, mag, bv] = rows[src];
      sky.ra[i] = lon * RAD;
      sky.dec[i] = lat * RAD;
      sky.sinD[i] = Math.sin(lat * RAD);
      sky.cosD[i] = Math.cos(lat * RAD);
      sky.mag[i] = mag;
      sky.bucket[i] = bucketOf(bv);
    });
    return sky;
  } catch {
    return null;
  }
}

export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, sky: SkyData, v: SkyView, t: number, o: { bright: number; size: number; magLimit: number } = { bright: 1, size: 1, magLimit: 6.2 }): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const sd0 = Math.sin(v.dec0);
  const cd0 = Math.cos(v.dec0);
  const cx = w / 2;
  const cy = h / 2;
  const S = v.scale;

  // stars
  let cur = -1;
  for (let i = 0; i < sky.n; i++) {
    const dra = sky.ra[i] - v.ra0;
    const cdr = Math.cos(dra);
    const cosc = sd0 * sky.sinD[i] + cd0 * sky.cosD[i] * cdr;
    if (cosc < -0.35) continue;
    const k = 2 / (1 + cosc);
    const x = cx - S * k * sky.cosD[i] * Math.sin(dra);
    const y = cy - S * k * (cd0 * sky.sinD[i] - sd0 * sky.cosD[i] * cdr);
    if (x < -6 || x > w + 6 || y < -6 || y > h + 6) continue;
    const m = sky.mag[i];
    if (m > o.magLimit) continue;
    const r = Math.min(2.8 * o.size, Math.max(0.45, (0.4 + (6.1 - m) * 0.36) * o.size));
    let a = Math.min(1, (0.22 + (6.1 - m) * 0.14) * o.bright);
    if (m < 4.5) a *= 0.88 + 0.12 * Math.sin(t * 1.7 + i * 1.3); // a little twinkle for the bright ones
    if (sky.bucket[i] !== cur) {
      cur = sky.bucket[i];
      ctx.fillStyle = COLS[cur];
    }
    ctx.globalAlpha = a;
    if (r > 1.3) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillRect(x - r, y - r, r * 2, r * 2);
    }
  }
  ctx.globalAlpha = 1;
}

/** Approximate moon phase on the night of a date (good to within a few hours; plenty for "waxing crescent"). */
export function moonPhase(iso: string): { illum: number; name: string; phase: number } {
  const ms = new Date(iso + 'T02:00:00').getTime();
  const syn = 29.530588853;
  const days = (ms - Date.UTC(2000, 0, 6, 18, 14)) / 86400000;
  const phase = (((days % syn) + syn) % syn) / syn; // 0 new, 0.5 full
  const illum = (1 - Math.cos(phase * 2 * Math.PI)) / 2;
  const name =
    phase < 0.03 || phase > 0.97 ? 'new moon'
    : phase < 0.22 ? 'waxing crescent'
    : phase < 0.28 ? 'first quarter'
    : phase < 0.47 ? 'waxing gibbous'
    : phase < 0.53 ? 'full moon'
    : phase < 0.72 ? 'waning gibbous'
    : phase < 0.78 ? 'last quarter'
    : 'waning crescent';
  return { illum, name, phase };
}
