/**
 * The small things that live in the sky garden.
 *
 * Hand-drawn pixel sprites written straight into the dithered frame after the
 * clouds and plants, so they stay hard-edged and exactly on the grid. Every
 * creature is a pure function of time (no state to keep), and what is out
 * depends on the real sun:
 *
 *   birds       by day            a loose flock crossing, wings beating
 *   butterflies by day            two green-gold ones wandering the garden, wings opening and closing
 *   moths       dusk into night   wandering near the flowers, fluttering
 *   fireflies   night             slow blinks low in the garden
 *   snail       always            crawling along the rim of an island — the brand creature
 */

type RGB = [number, number, number];

export interface CreatureColours {
  light: RGB;
  shade: RGB;
  pink: RGB;
  pinkShade: RGB;
  glow: RGB;
  /** butterfly wings and their gold edge */
  wing: RGB;
  wingEdge: RGB;
}

export interface SnailSpot {
  /** Centre of the island and its half-width, in canvas px. */
  x: number;
  y: number;
  W: number;
}

const BIRD_UP = ['X.....X', '.XX.XX.', '...X...'];
const BIRD_DOWN = ['...X...', '.XXXXX.', 'X.....X'];
const MOTH_OPEN = ['XX...XX', 'XXX.XXX', '.XXXXX.', '..X.X..'];
const MOTH_SHUT = ['..X.X..', '..XXX..', '..XXX..', '...X...'];
// g = wing, y = wing edge, b = body
const BUTTERFLY_OPEN = ['yg.....gy', 'ggg...ggg', 'ggggbgggg', '.gggbggg.', '..gybyg..', '...y.y...'];
const BUTTERFLY_SHUT = ['...g.g...', '..ggggg..', '..g.b.g..', '..gybyg..', '...yby...', '....b....'];
// p = shell light, o = shell shade, # = body
const SNAIL = ['..pppp..#', '.pooopp.#', '.popopp##', '#########', '.#######.'];

function smooth(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

function hash01(n: number): number {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
}

/**
 * @param altitude sun altitude in degrees, from skyMoment
 * @param t seconds since the sky mounted (the wind clock)
 */
export function paintCreatures(
  data: Uint8ClampedArray,
  w: number,
  h: number,
  t: number,
  altitude: number,
  c: CreatureColours,
  snail: SnailSpot | null,
): void {
  const day = smooth(-2, 12, altitude);
  const night = 1 - smooth(-9, 3, altitude);

  const put = (x: number, y: number, col: RGB) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= w || yi >= h) return;
    const i = (yi * w + xi) * 4;
    data[i] = col[0];
    data[i + 1] = col[1];
    data[i + 2] = col[2];
  };
  const blend = (x: number, y: number, col: RGB, k: number) => {
    const xi = Math.round(x);
    const yi = Math.round(y);
    if (xi < 0 || yi < 0 || xi >= w || yi >= h) return;
    const i = (yi * w + xi) * 4;
    data[i] += (col[0] - data[i]) * k;
    data[i + 1] += (col[1] - data[i + 1]) * k;
    data[i + 2] += (col[2] - data[i + 2]) * k;
  };
  const sprite = (rows: string[], x0: number, y0: number, scale: number, flip: boolean) => {
    const sw = rows[0].length;
    for (let ry = 0; ry < rows.length; ry++) {
      for (let rx = 0; rx < sw; rx++) {
        const ch = rows[ry][flip ? sw - 1 - rx : rx];
        if (ch === '.') continue;
        const col =
          ch === 'p' ? c.pink : ch === 'o' ? c.pinkShade : ch === 'g' ? c.wing : ch === 'y' ? c.wingEdge : ch === 'b' ? c.shade : c.light;
        for (let sy = 0; sy < scale; sy++) for (let sx = 0; sx < scale; sx++) put(x0 + rx * scale + sx, y0 + ry * scale + sy, col);
      }
    }
  };

  // birds: two small flocks crossing the upper sky in opposite directions
  if (day > 0.15) {
    const flock = Math.max(1, Math.round(day * 3));
    for (let f = 0; f < 2; f++) {
      const dir = f === 0 ? 1 : -1;
      const along = (((t * 0.011 * (f + 1.2) + f * 0.55) % 1.3) + 1.3) % 1.3;
      const baseX = (dir === 1 ? along - 0.15 : 1.15 - along) * w;
      const baseY = (0.1 + f * 0.17) * h;
      for (let b = 0; b < flock; b++) {
        const x = baseX - dir * b * 11;
        const y = baseY + b * 5 + Math.sin(t * 0.6 + b + f * 2) * 4;
        const up = Math.floor(t * 3 + b * 0.7 + f) % 2 === 0;
        sprite(up ? BIRD_UP : BIRD_DOWN, x, y, 2, dir === -1);
      }
    }
  }

  // butterflies: two of them, wandering low over the flowers on a warm day
  if (day > 0.3) {
    const count = day > 0.7 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      const x = w * (0.5 + 0.42 * Math.sin(t * 0.05 + i * 2.4)) + Math.sin(t * 1.3 + i) * 5;
      const y = h * (0.6 + 0.2 * Math.sin(t * 0.07 + i * 1.7)) + Math.sin(t * 4.2 + i) * 3 + Math.cos(t * 0.6 + i) * 8;
      const open = Math.floor(t * 5 + i * 0.5) % 2 === 0;
      sprite(open ? BUTTERFLY_OPEN : BUTTERFLY_SHUT, x, y, 2, Math.cos(t * 0.05 + i * 2.4) < 0);
    }
  }

  // moths: wandering loops over the garden at dusk and after
  if (night > 0.15) {
    const homes: [number, number][] = [
      [0.1, 0.76],
      [0.9, 0.72],
      [0.18, 0.42],
      [0.82, 0.3],
    ];
    const count = Math.max(1, Math.round(night * homes.length));
    for (let i = 0; i < count; i++) {
      const [hx, hy] = homes[i];
      const x = hx * w + Math.sin(t * 0.45 + i * 2) * 34 + Math.sin(t * 1.7 + i) * 6;
      const y = hy * h + Math.sin(t * 0.62 + i * 3) * 24 + Math.cos(t * 1.9 + i) * 4;
      const open = Math.floor(t * 8 + i) % 2 === 0;
      sprite(open ? MOTH_OPEN : MOTH_SHUT, x, y, 2, Math.cos(t * 0.45 + i * 2) < 0);
      // a faint halo of light around the wings
      for (const [dx, dy] of [[-2, 3], [16, 3], [7, -2], [7, 10]]) blend(x + dx, y + dy, c.glow, 0.16 * night);
    }
  }

  // fireflies: slow blinks, low in the garden
  if (night > 0.35) {
    for (let i = 0; i < 12; i++) {
      const x = hash01(i + 1) * w + Math.sin(t * 0.3 + i * 3) * 10;
      const y = (0.5 + hash01(i + 40) * 0.45) * h + Math.sin(t * 0.4 + i * 5) * 8;
      const blink = Math.sin(t * 1.1 + i * 4.3);
      if (blink > 0.45) {
        put(x, y, c.glow);
        const halo = (blink - 0.45) * 0.6 * night;
        for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) blend(x + dx, y + dy, c.glow, halo);
      }
    }
  }

  // the snail takes its time along the island's rim
  if (snail && snail.W > 20) {
    const span = snail.W * 0.55;
    const phase = t * 0.045;
    const off = Math.sin(phase) * span;
    const facing = Math.cos(phase) < 0; // crawling left
    // sit on the top slab, a little above its centreline
    sprite(SNAIL, snail.x + off - 9, snail.y - snail.W * 0.2 - 8, 2, facing);
  }
}
