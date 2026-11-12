/**
 * The garden that grows in the sky.
 *
 * Pure canvas drawing and plant data — no React, no storage reads. SkyBackground
 * owns the canvas and turns what is drawn here into dithered cloud: this file
 * paints coverage only, in two channels so the compositor knows what it is
 * looking at:
 *
 *   red   → leaf, stem, trunk  (tinted soft green in the sky)
 *   green → flower, bell, fruit (tinted soft pink in the sky)
 *
 * Everything is measured in canvas pixels of the dither grid, so a plant is the
 * same number of dots wherever it grows. Positions are fractions of the
 * viewport so the garden re-flows on resize.
 */

export type Species = 'flower' | 'fern' | 'tree' | 'bell' | 'reed' | 'thistle' | 'vine' | 'island';

/** What an island carries on its back. */
export type Flora = 'tree' | 'gate' | 'sundial' | 'flower';

export interface Plant {
  id: string;
  species: Species;
  /** 0..1 across the width. */
  x: number;
  /** +1 grows up from the bottom edge, −1 hangs down from the top. */
  dir: 1 | -1;
  /** Fully grown height as a fraction of the viewport height. */
  height: number;
  /** Sideways lean at the tip, as a fraction of height (signed). */
  lean: number;
  /** Sway phase, radians. */
  phase: number;
  /** Seconds after mount before this one starts growing. */
  delay: number;
  /** Seconds from seed to full height. */
  duration: number;
  /** 0..1 of full height this plant has reached in real life (age-based). */
  maturity: number;
  /** Islands only: top of the island as a fraction of viewport height. */
  y?: number;
  /** Islands only: what grows on it. */
  flora?: Flora;
  /** Islands only: index into ISLAND_TINTS (0–5); 7 is plain cloud. */
  tint?: number;
}

const LEAF = 'rgb(255,0,0)';
const FLOWER = 'rgb(0,255,0)';

function smooth(e0: number, e1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - e0) / (e1 - e0)));
  return t * t * (3 - 2 * t);
}

/** Small deterministic RNG so a garden grows the same way every time. */
export function rng(seed: number): () => number {
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
 * The wild garden every sky starts with. Plants hug the sides, top and bottom,
 * so the middle of the screen — where the calendar card, the paper sheet and the
 * onboarding frame sit — stays open sky.
 */
export function ambientPlants(): Plant[] {
  const r = rng(7);
  const spec: [Species, number, number, 1 | -1][] = [
    ['flower', 0.06, 0.34, 1],
    ['fern', 0.15, 0.27, 1],
    ['tree', 0.92, 0.3, 1],
    ['bell', 0.83, 0.33, 1],
    ['reed', 0.975, 0.25, 1],
    ['thistle', 0.25, 0.2, 1],
    ['vine', 0.035, 0.4, -1],
    ['fern', 0.9, 0.24, -1],
    ['bell', 0.13, 0.22, -1],
    ['flower', 0.71, 0.15, 1],
    ['flower', 0.31, 0.12, 1],
  ];
  const wild: Plant[] = spec.map(([species, x, height, dir], i) => ({
    id: `wild-${i}`,
    species,
    x,
    dir,
    height,
    lean: (r() - 0.5) * 0.5,
    phase: r() * Math.PI * 2,
    delay: i * 0.45,
    duration: 9 + r() * 6,
    maturity: 1,
  }));
  const island = (id: string, x: number, y: number, size: number, flora: Flora, delay: number, tint: number): Plant => ({
    id,
    species: 'island',
    x,
    y,
    flora,
    tint,
    dir: 1,
    height: size,
    lean: 0,
    phase: r() * Math.PI * 2,
    delay,
    duration: 14,
    maturity: 1,
  });
  // the first island leads the list so it is always kept; the rest go as your garden fills
  return [
    island('wild-island-0', 0.62, 0.17, 0.3, 'tree', 14, 4),
    ...wild.slice(0, 5),
    island('wild-island-1', 0.22, 0.7, 0.24, 'sundial', 40, 5),
    ...wild.slice(5),
  ];
}

/* ── the garden that is yours ──────────────────────────────────────────────
 *
 * One plant per day you drew a card. Nothing new is stored: the draws are the
 * `card-YYYY-MM-DD` / `reversed-YYYY-MM-DD` keys the app already keeps, and the
 * plants are derived from them each time, so the same history always grows the
 * same garden. Nothing here leaves the device.
 *
 *   suit    → species   cups: bells · wands: ferns and vines · swords: thistle
 *                       and reeds · pentacles: fruiting trees · major: tall flowers
 *   rank    → height    court cards stand tallest
 *   age     → maturity  real days since the draw; a seedling today, grown by ~30 days
 *   upright → grows up from below; reversed → hangs down from above
 */

export interface Draw {
  /** Local calendar day, YYYY-MM-DD. */
  date: string;
  cardId: string;
  reversed: boolean;
}

/** Every drawn day on this device, oldest first. Empty during SSR or when storage is blocked. */
export function readDraws(): Draw[] {
  const out: Draw[] = [];
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      const m = key ? /^card-(\d{4}-\d{2}-\d{2})$/.exec(key) : null;
      if (!m || !key) continue;
      const cardId = localStorage.getItem(key);
      if (!cardId) continue;
      out.push({ date: m[1], cardId, reversed: localStorage.getItem(`reversed-${m[1]}`) === 'true' });
    }
  } catch {
    return [];
  }
  return out.sort((a, b) => (a.date < b.date ? -1 : 1));
}

const COURT: Record<string, number> = { page: 11, knight: 12, queen: 13, king: 14, ace: 1 };

/** "cups-ace" → ['cups', 1]; "major-12" → ['major', 12]. Unknown ids fall back to a flower. */
function parseCard(id: string): [string, number] {
  const [suit, rank] = id.split('-');
  const n = COURT[rank] ?? Number(rank);
  return [suit, Number.isFinite(n) ? n : 5];
}

function dayNumber(date: string): number {
  const [y, m, d] = date.split('-').map(Number);
  return Math.floor(Date.UTC(y, m - 1, d) / 86_400_000);
}

const GOLDEN = 0.6180339887;

/**
 * @param nowMs the current time, for age; passed in so the garden is testable.
 * At most the most recent 40 days are planted, so a long history thins into the
 * past rather than choking the sky.
 */
export function plantsFromHistory(draws: Draw[], nowMs: number): Plant[] {
  const today = Math.floor(nowMs / 86_400_000);
  return draws.slice(-40).map((d) => {
    const [suit, rank] = parseCard(d.cardId);
    const day = dayNumber(d.date);
    const r = rng(day * 131 + rank * 7 + suit.length);

    let species: Species = 'flower';
    if (suit === 'cups') species = 'bell';
    else if (suit === 'wands') species = rank % 2 ? 'fern' : 'vine';
    else if (suit === 'swords') species = rank % 2 ? 'thistle' : 'reed';
    else if (suit === 'pentacles') species = 'tree';

    // the golden ratio walks consecutive days apart; it is by calendar day, not by
    // position in the list, so an old plant never shuffles when a new one is added
    const u = (day * GOLDEN) % 1;
    const x = u < 0.5 ? 0.02 + u * 0.44 : 0.76 + (u - 0.5) * 0.44;

    const court = rank >= 11 && suit !== 'major';
    const height =
      suit === 'major' ? 0.28 + (Math.min(rank, 21) / 21) * 0.14 : court ? 0.3 + r() * 0.08 : 0.13 + rank * 0.016;

    const age = Math.max(0, today - day);
    if (suit === 'major') {
      // the major arcana are islands: they drift, so where they start doesn't matter much
      const flora: Flora = (['tree', 'gate', 'sundial', 'flower'] as const)[rank % 4];
      const high = r() < 0.6;
      return {
        id: `draw-${d.date}`,
        species: 'island',
        x: (day * GOLDEN) % 1,
        y: high ? 0.07 + r() * 0.2 : 0.58 + r() * 0.2,
        flora,
        tint: (day * 5 + rank) % 6,
        dir: 1,
        height: 0.2 + (Math.min(rank, 21) / 21) * 0.14,
        lean: 0,
        phase: r() * Math.PI * 2,
        // islands don't sprout: they arrive, from an edge, a little while after you look up
        delay: age === 0 ? 8 : 10 + r() * 40,
        duration: 1,
        maturity: 1,
      } satisfies Plant;
    }
    return {
      id: `draw-${d.date}`,
      species,
      x,
      dir: d.reversed ? -1 : 1,
      height,
      lean: (r() - 0.5) * 0.5,
      phase: r() * Math.PI * 2,
      delay: age === 0 ? 0 : r() * 6,
      duration: age === 0 ? 20 : 8 + r() * 6,
      maturity: 0.35 + 0.65 * smooth(0, 30, age),
    } satisfies Plant;
  });
}

/**
 * The whole sky: your plants, with a few of the wild ones left among them while
 * the garden is young. By about nine readings it is entirely yours.
 */
export function gardenFor(draws: Draw[], nowMs: number): Plant[] {
  const all = plantsFromHistory(draws, nowMs);
  // Islands drift across the whole sky, so more than a few turn it into a crowd:
  // the four most recent major arcana float, the rest have set down as memory.
  const islands = all.filter((p) => p.species === 'island').slice(-4);
  const mine = [...all.filter((p) => p.species !== 'island'), ...islands];
  const wild = ambientPlants();
  const keep = Math.max(2, wild.length - mine.length);
  // wild islands only while you have fewer than two of your own
  const wildKept = wild.slice(0, keep).filter((p) => p.species !== 'island' || islands.length < 2);
  return [...wildKept, ...mine];
}

type Pt = [number, number];

/** How far a plant has grown: its sprouting animation times its real-world age. */
export function plantGrowth(p: Plant, grow: number): number {
  return smooth(0, 1, (grow - p.delay) / p.duration) * p.maturity;
}

const ISLAND_TINTS = 6;

/**
 * Where an island is right now, in canvas px, or null while it is out of sight.
 *
 * Islands don't grow. After `delay` seconds each one drifts in from an edge of the
 * sky, crosses it slowly, leaves, rests offscreen a while, then comes back from
 * whichever edge the next cycle picks — so they arrive and depart from every
 * direction over a session. `still` (reduced motion) parks them at home instead.
 */
export function islandPose(
  p: Plant,
  w: number,
  h: number,
  t: number,
  still: boolean,
): { cx: number; cy: number; W: number } | null {
  const W = p.height * h * 0.55;
  const bob = still ? 0 : Math.sin(t * 0.4 + p.phase) * h * 0.008;
  if (still) return { cx: p.x * w, cy: (p.y ?? 0.2) * h, W };

  const local = t - p.delay;
  if (local < 0) return null;
  const crossing = 170 + (p.phase % 1) * 110; // seconds edge to edge: unhurried
  const rest = 20 + ((p.phase * 3) % 1) * 40;
  const cycle = crossing + rest;
  const k = Math.floor(local / cycle);
  const u = (local - k * cycle) / crossing;
  if (u > 1) return null;

  const r = rng(Math.floor(p.phase * 10000) + k * 7919);
  const pick = r();
  const m = W * 1.5; // far enough off the edge that nothing pops in
  const along = (a: number, b: number) => a + (b - a) * u;
  const y1 = 0.08 + r() * 0.74;
  const y2 = Math.min(0.85, Math.max(0.06, y1 + (r() - 0.5) * 0.4));
  const x1 = 0.08 + r() * 0.84;
  const x2 = Math.min(0.95, Math.max(0.05, x1 + (r() - 0.5) * 0.4));
  let cx: number;
  let cy: number;
  if (pick < 0.35) {
    cx = along(-m, w + m); // in from the left
    cy = along(y1, y2) * h;
  } else if (pick < 0.7) {
    cx = along(w + m, -m); // in from the right
    cy = along(y1, y2) * h;
  } else if (pick < 0.85) {
    cx = along(x1, x2) * w; // sinking in from above
    cy = along(-m, h + m);
  } else {
    cx = along(x1, x2) * w; // rising in from below
    cy = along(h + m, -m);
  }
  return { cx, cy: cy + bob, W };
}

/** The red channel carries the island's tint (×12); 84 (= 7) means plain cloud, used for gates and sundials. */
const MASS_LIGHT = 'rgb(84,0,255)';

/**
 * A floating island: a slab of cloud with a billowing belly and roots hanging
 * from it, carrying a little flora. The body is painted in the blue channel,
 * darkening toward the bottom — the compositor reads that as light and shade,
 * so the island is lit from above like every cloud.
 */
function drawIsland(
  g: CanvasRenderingContext2D,
  p: Plant,
  w: number,
  h: number,
  sway: number,
  open: number,
  still: boolean,
): void {
  const pose = islandPose(p, w, h, sway, still);
  if (!pose) return;
  const { cx, cy, W } = pose;
  // fully off screen: nothing to paint
  if (cx < -W * 2 || cx > w + W * 2 || cy < -W * 2 || cy > h + W * 2) return;

  const tintR = ((p.tint ?? 0) % ISLAND_TINTS) * 12;
  const grad = g.createLinearGradient(0, cy - W * 0.2, 0, cy + W * 0.95);
  grad.addColorStop(0, `rgb(${tintR},0,255)`);
  grad.addColorStop(1, `rgb(${tintR},0,150)`);
  g.fillStyle = grad;
  const blob = (ox: number, oy: number, rx: number, ry: number) => {
    g.beginPath();
    g.ellipse(cx + ox * W, cy + oy * W, rx * W, ry * W, 0, 0, Math.PI * 2);
    g.fill();
  };
  blob(0, 0, 1, 0.2); // the flat top
  blob(-0.45, 0.14, 0.4, 0.3); // the belly, in lobes like a cumulus
  blob(0, 0.28, 0.5, 0.38);
  blob(0.44, 0.14, 0.36, 0.28);
  g.beginPath(); // taper to a root-ball
  g.moveTo(cx - W * 0.62, cy + W * 0.2);
  g.quadraticCurveTo(cx - W * 0.2, cy + W * 0.95, cx, cy + W * 1.05);
  g.quadraticCurveTo(cx + W * 0.2, cy + W * 0.95, cx + W * 0.62, cy + W * 0.2);
  g.fill();

  // roots, trailing in the wind
  g.strokeStyle = LEAF;
  g.lineWidth = Math.max(1.2, W * 0.018);
  g.lineCap = 'round';
  for (let k = 0; k < 5; k++) {
    const x0 = cx + (k - 2) * W * 0.26;
    const len = W * (0.3 + 0.28 * (((k * 37 + 11) % 5) / 5));
    const sway2 = Math.sin(sway * 0.8 + p.phase + k) * W * 0.07;
    g.beginPath();
    g.moveTo(x0, cy + W * (0.32 + 0.1 * (1 - Math.abs(k - 2) / 2)));
    g.quadraticCurveTo(x0 + sway2 * 0.6, cy + W * 0.6 + len * 0.5, x0 + sway2, cy + W * 0.55 + len);
    g.stroke();
  }

  // what grows on its back
  const baseY = cy - W * 0.13;
  const wind = Math.sin(sway * 0.7 + p.phase) * W * 0.04;
  const stem = (x: number, y: number, hgt: number, width: number, colour: string) => {
    g.strokeStyle = colour;
    g.lineWidth = width;
    g.beginPath();
    g.moveTo(x, y);
    g.quadraticCurveTo(x + wind * 0.4, y - hgt * 0.5, x + wind, y - hgt);
    g.stroke();
  };
  const disc = (x: number, y: number, rx: number, ry: number, colour: string) => {
    g.fillStyle = colour;
    g.beginPath();
    g.ellipse(x, y, Math.max(0.6, rx), Math.max(0.6, ry), 0, 0, Math.PI * 2);
    g.fill();
  };
  switch (p.flora) {
    case 'gate': {
      const gh = W * 0.8;
      stem(cx - W * 0.28, baseY, gh, Math.max(2, W * 0.06), MASS_LIGHT);
      stem(cx + W * 0.28, baseY, gh, Math.max(2, W * 0.06), MASS_LIGHT);
      g.strokeStyle = MASS_LIGHT;
      g.lineWidth = Math.max(2, W * 0.06);
      g.beginPath();
      g.arc(cx + wind, baseY - gh, W * 0.28, Math.PI, 0);
      g.stroke();
      disc(cx + wind * 0.5, baseY - W * 0.1, W * 0.07, W * 0.07, FLOWER);
      break;
    }
    case 'sundial': {
      stem(cx, baseY, W * 0.34, Math.max(2.5, W * 0.08), MASS_LIGHT);
      disc(cx + wind * 0.3, baseY - W * 0.36, W * 0.3, W * 0.07, MASS_LIGHT);
      stem(cx + wind * 0.3, baseY - W * 0.36, W * 0.22, Math.max(1.4, W * 0.035), LEAF);
      break;
    }
    case 'flower': {
      for (const [ox, hh] of [[-0.4, 0.55], [0, 0.8], [0.4, 0.5]]) {
        const fx = cx + ox * W;
        stem(fx, baseY, W * hh, Math.max(1.4, W * 0.03), LEAF);
        const r = W * 0.1 * (0.3 + 0.7 * open);
        for (let k = 0; k < 7; k++) {
          const a = (k / 7) * Math.PI * 2;
          disc(fx + wind + Math.cos(a) * r, baseY - W * hh + Math.sin(a) * r, W * 0.06 * (0.45 + 0.55 * open), W * 0.035, FLOWER);
        }
      }
      break;
    }
    case 'tree':
    default: {
      const th = W * 0.7;
      stem(cx, baseY, th, Math.max(2.2, W * 0.055), LEAF);
      const top: Pt = [cx + wind, baseY - th];
      for (const [ox, oy] of [[0, 0], [-0.22, 0.08], [0.22, 0.08], [-0.1, -0.18], [0.12, -0.16]]) {
        disc(top[0] + ox * W, top[1] + oy * W, W * 0.3, W * 0.25, LEAF);
      }
      for (const [ox, oy] of [[-0.2, 0.12], [0.2, 0.1], [0, -0.22], [0.28, -0.04]]) {
        disc(top[0] + ox * W, top[1] + oy * W, W * 0.04, W * 0.04, FLOWER);
      }
    }
  }
}

/**
 * Paint every plant. `grow` is seconds since the sky mounted (drives the
 * sprouting); `sway` is the wind clock, kept separate so reduced-motion can
 * freeze the wind without stunting the plants; `open` is 0..1, how far the
 * flowers have opened (the real sun, decided by the caller).
 */
export function drawGarden(
  g: CanvasRenderingContext2D,
  plants: Plant[],
  w: number,
  h: number,
  grow: number,
  sway: number,
  open: number,
  still = false,
): void {
  g.clearRect(0, 0, w, h);
  g.lineCap = 'round';
  g.lineJoin = 'round';

  for (const p of plants) {
    if (p.species === 'island') {
      drawIsland(g, p, w, h, still ? 0 : sway, open, still);
      continue;
    }
    const growth = plantGrowth(p, grow);
    if (growth <= 0.01) continue;
    const H = p.height * h * growth;
    const bx = p.x * w;
    const by = p.dir === 1 ? h + 2 : -2;
    const wind = (s: number): number =>
      (Math.sin(sway * 0.7 + p.phase + s * 2.2) * 0.07 + Math.sin(sway * 0.29 + p.phase * 1.7) * 0.035) *
      H * s * s;

    const N = 18;
    const pts: Pt[] = [];
    for (let i = 0; i <= N; i++) {
      const s = i / N;
      pts.push([bx + p.lean * H * s * s + wind(s), by - p.dir * H * s]);
    }
    const tip = pts[N];
    const stroke = (from: Pt, to: Pt, width: number, colour: string) => {
      g.strokeStyle = colour;
      g.lineWidth = width;
      g.beginPath();
      g.moveTo(from[0], from[1]);
      g.lineTo(to[0], to[1]);
      g.stroke();
    };
    const stem = (width: number, upto = N) => {
      g.strokeStyle = LEAF;
      g.lineWidth = width;
      g.beginPath();
      g.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i <= upto; i++) g.lineTo(pts[i][0], pts[i][1]);
      g.stroke();
    };
    const disc = (cx: number, cy: number, rx: number, ry: number, rot: number, colour: string) => {
      g.fillStyle = colour;
      g.beginPath();
      g.ellipse(cx, cy, Math.max(0.6, rx), Math.max(0.6, ry), rot, 0, Math.PI * 2);
      g.fill();
    };
    const sw = Math.max(1.5, H * 0.014);

    switch (p.species) {
      case 'fern': {
        stem(sw);
        for (let i = 3; i <= N - 1; i++) {
          const s = i / N;
          const L = H * 0.24 * (1 - s * 0.78);
          const [x, y] = pts[i];
          const droop = Math.sin(sway * 0.9 + p.phase + i * 0.5) * L * 0.12;
          for (const side of [-1, 1]) {
            g.strokeStyle = LEAF;
            g.lineWidth = Math.max(1.2, sw * 0.7);
            g.beginPath();
            g.moveTo(x, y);
            g.quadraticCurveTo(x + side * L * 0.6, y - p.dir * L * 0.5, x + side * L, y - p.dir * L * 0.1 + droop);
            g.stroke();
          }
        }
        break;
      }
      case 'vine': {
        stem(sw);
        for (let i = 2; i <= N; i += 2) {
          const [x, y] = pts[i];
          const side = i % 4 === 0 ? 1 : -1;
          const r = H * 0.035 * (1 - (i / N) * 0.4);
          disc(x + side * r * 1.2, y, r * 1.1, r * 0.7, side * 0.5, LEAF);
        }
        // curled tip
        g.strokeStyle = LEAF;
        g.lineWidth = Math.max(1.2, sw * 0.7);
        g.beginPath();
        g.arc(tip[0] + H * 0.03, tip[1], H * 0.03, Math.PI, Math.PI * 2.6);
        g.stroke();
        break;
      }
      case 'bell': {
        stem(sw, N - 4);
        // the top of the stem arches over and the bells hang from it
        for (let k = 0; k < 4; k++) {
          const i = N - 4 + k;
          const [x, y] = pts[i];
          const ring = Math.sin(sway * 1.1 + p.phase + k) * H * 0.012;
          stroke(pts[i], [x + H * 0.04 + ring, y + p.dir * H * 0.06], Math.max(1.1, sw * 0.6), LEAF);
          disc(x + H * 0.04 + ring, y + p.dir * H * 0.1, H * 0.028, H * 0.042, 0, FLOWER);
        }
        break;
      }
      case 'tree': {
        stem(Math.max(2.4, H * 0.03), N - 3);
        const base = pts[N - 3];
        const lobes: Pt[] = [
          [0, 0],
          [-0.12, 0.05],
          [0.12, 0.05],
          [-0.06, -0.09],
          [0.07, -0.08],
        ];
        for (const [ox, oy] of lobes) {
          disc(
            base[0] + ox * H + Math.sin(sway * 0.6 + p.phase + ox * 9) * H * 0.01,
            base[1] + oy * H * -p.dir,
            H * 0.15,
            H * 0.125,
            0,
            LEAF,
          );
        }
        for (const [ox, oy] of [[-0.1, 0.08], [0.1, 0.06], [0.0, -0.12], [0.14, -0.02]]) {
          disc(base[0] + ox * H, base[1] + oy * H * -p.dir, H * 0.02, H * 0.02, 0, FLOWER);
        }
        break;
      }
      case 'reed': {
        for (const [off, hh] of [[-0.03, 0.85], [0, 1], [0.03, 0.75]]) {
          g.strokeStyle = LEAF;
          g.lineWidth = Math.max(1.3, sw * 0.8);
          g.beginPath();
          const upto = Math.floor(N * hh);
          g.moveTo(pts[0][0] + off * H, pts[0][1]);
          for (let i = 1; i <= upto; i++) g.lineTo(pts[i][0] + off * H, pts[i][1]);
          g.stroke();
          const top = pts[upto];
          disc(top[0] + off * H, top[1] + p.dir * H * 0.03, H * 0.016, H * 0.05, 0, FLOWER);
        }
        break;
      }
      case 'thistle': {
        stem(sw);
        for (let k = 0; k < 7; k++) {
          const a = -Math.PI / 2 + (k - 3) * 0.42;
          const L = H * 0.09;
          stroke(tip, [tip[0] + Math.cos(a) * L, tip[1] + Math.sin(a) * L * -p.dir], Math.max(1.1, sw * 0.6), LEAF);
        }
        disc(tip[0], tip[1], H * 0.045, H * 0.04, 0, FLOWER);
        disc(pts[9][0] - H * 0.05, pts[9][1], H * 0.05, H * 0.022, -0.6, LEAF);
        break;
      }
      case 'flower':
      default: {
        stem(sw);
        disc(pts[8][0] + H * 0.06, pts[8][1], H * 0.06, H * 0.025, -0.5, LEAF);
        disc(pts[5][0] - H * 0.055, pts[5][1], H * 0.055, H * 0.022, 0.5, LEAF);
        const petals = 8;
        const r = H * 0.1 * (0.3 + 0.7 * open);
        const pr = H * 0.06 * (0.45 + 0.55 * open);
        for (let k = 0; k < petals; k++) {
          const a = (k / petals) * Math.PI * 2 + sway * 0.05;
          disc(tip[0] + Math.cos(a) * r, tip[1] + Math.sin(a) * r, pr, pr * 0.55, a, FLOWER);
        }
        disc(tip[0], tip[1], H * 0.035, H * 0.035, 0, LEAF);
        break;
      }
    }
  }
}
