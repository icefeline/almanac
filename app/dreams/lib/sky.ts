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
  names: (Pt & { name: string })[]; // constellation names, at their centres
  planets: (Pt & { name: string; color: string; r: number })[]; // where the planets are tonight
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
      lines: [], // filled by loadFigures when the reader turns constellations on
      names: [],
      planets: [],
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

/** The constellation figures and their names, fetched only when asked for. */
export async function loadFigures(): Promise<{ lines: Pt[][]; names: (Pt & { name: string })[] }> {
  try {
    const res = await fetch('/sky/lines.json');
    if (!res.ok) return { lines: [], names: [] };
    const j = (await res.json()) as { lines: number[][][]; names: [string, number, number][] };
    return {
      lines: j.lines.map((l) => l.map(([lon, lat]) => pt(lon, lat))),
      names: (j.names ?? []).map(([name, lon, lat]) => ({ ...pt(lon, lat), name })),
    };
  } catch {
    return { lines: [], names: [] };
  }
}

const PLANETS: { name: string; body: string; color: string; r: number }[] = [
  { name: 'mercury', body: 'Mercury', color: '#E4E0D8', r: 1.8 },
  { name: 'venus', body: 'Venus', color: '#FFF6D8', r: 3.2 },
  { name: 'mars', body: 'Mars', color: '#FF9C70', r: 2.4 },
  { name: 'jupiter', body: 'Jupiter', color: '#FFE9C4', r: 3.0 },
  { name: 'saturn', body: 'Saturn', color: '#EEDCA6', r: 2.5 },
];

/** Where the naked-eye planets are tonight, on the same sphere as the stars. Loaded with the figures, since it is the same ask. */
export async function loadPlanets(date = new Date()): Promise<SkyData['planets']> {
  try {
    const A = await import('astronomy-engine');
    const observer = new A.Observer(0, 0, 0);
    return PLANETS.map((p) => {
      const eq = A.Equator(p.body as never, date, observer, false, true); // J2000, like the stars
      let lon = eq.ra * 15;
      if (lon > 180) lon -= 360;
      return { ...pt(lon, eq.dec), name: p.name, color: p.color, r: p.r };
    });
  } catch {
    return [];
  }
}

export function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number, dpr: number, sky: SkyData, v: SkyView, t: number, o: { bright: number; size: number; magLimit: number; lines?: boolean; labels?: number } = { bright: 1, size: 1, magLimit: 6.2 }): void {
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, w, h);
  const sd0 = Math.sin(v.dec0);
  const cd0 = Math.cos(v.dec0);
  const cx = w / 2;
  const cy = h / 2;
  const S = v.scale;

  // constellation figures, under the stars, joined only where both ends are in front of the viewer
  if (o.lines && sky.lines.length) {
    ctx.strokeStyle = 'rgba(190,210,255,0.22)';
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    for (const line of sky.lines) {
      let pen = false;
      for (const p of line) {
        const dra = p.ra - v.ra0;
        const cdr = Math.cos(dra);
        const cosc = sd0 * p.sinD + cd0 * p.cosD * cdr;
        if (cosc < -0.35) {
          pen = false;
          continue;
        }
        const k = 2 / (1 + cosc);
        const x = cx - S * k * p.cosD * Math.sin(dra);
        const y = cy - S * k * (cd0 * p.sinD - sd0 * p.cosD * cdr);
        if (pen) ctx.lineTo(x, y);
        else ctx.moveTo(x, y);
        pen = true;
      }
    }
    ctx.stroke();
  }

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
    // every star is a real one, so every star scintillates a little: its own rate and phase, more for the bright ones
    if (m < 5.6) {
      const depth = m < 3 ? 0.3 : m < 4.5 ? 0.24 : 0.16;
      a *= 1 - depth * (0.5 + 0.5 * Math.sin(t * (1.4 + (i % 7) * 0.45) + i * 1.3)) * (0.6 + 0.4 * Math.sin(t * 0.9 + i * 2.1));
    }
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

  if (o.lines) {
    const proj = (p: Pt) => {
      const dra = p.ra - v.ra0;
      const cdr = Math.cos(dra);
      const cosc = sd0 * p.sinD + cd0 * p.cosD * cdr;
      if (cosc < -0.35) return null;
      const k = 2 / (1 + cosc);
      return { x: cx - S * k * p.cosD * Math.sin(dra), y: cy - S * k * (cd0 * p.sinD - sd0 * p.cosD * cdr) };
    };
    const lab = o.labels ?? 0;
    ctx.textBaseline = 'middle';
    // planets: steady, a little larger than the stars, named once you are close enough to read
    for (const pl of sky.planets) {
      const q = proj(pl);
      if (!q || q.x < -20 || q.x > w + 20 || q.y < -20 || q.y > h + 20) continue;
      ctx.fillStyle = pl.color;
      ctx.globalAlpha = 0.95;
      ctx.beginPath();
      ctx.arc(q.x, q.y, pl.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 0.18;
      ctx.beginPath();
      ctx.arc(q.x, q.y, pl.r * 2.6, 0, Math.PI * 2);
      ctx.fill();
      if (lab > 0.05) {
        ctx.globalAlpha = Math.min(1, lab) * 0.9;
        ctx.font = '12px ui-sans-serif, system-ui, sans-serif';
        ctx.textAlign = 'left';
        ctx.fillText(pl.name, q.x + pl.r + 6, q.y);
      }
    }
    if (lab > 0.05) {
      // star names, the brightest first as you come closer
      ctx.font = '11px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = '#DCE8FF';
      ctx.textAlign = 'left';
      for (const st of sky.named) {
        if (st.mag > (lab > 0.8 ? 3.2 : 2.1)) continue;
        const q = proj(st);
        if (!q || q.x < 0 || q.x > w || q.y < 0 || q.y > h) continue;
        ctx.globalAlpha = Math.min(1, lab) * 0.7;
        ctx.fillText(st.name.toLowerCase(), q.x + 7, q.y - 6);
      }
      // constellation names, spaced out so they read as titles
      ctx.font = '13px ui-sans-serif, system-ui, sans-serif';
      ctx.fillStyle = '#BFD4FF';
      ctx.textAlign = 'center';
      for (const c of sky.names) {
        const q = proj(c);
        if (!q || q.x < 20 || q.x > w - 20 || q.y < 20 || q.y > h - 20) continue;
        ctx.globalAlpha = Math.min(1, lab) * 0.75;
        ctx.fillText(c.name.split('').join('\u200A'), q.x, q.y);
      }
    }
    ctx.globalAlpha = 1;
  }
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
