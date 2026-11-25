/*
 * The shape of a song, read ahead of time.
 *
 * Listening live only tells the picture what is happening now. A song has an arc: a hushed start, a build, a lift into the
 * full beat, a breakdown. So the whole file is read once (it has to be downloaded anyway) and boiled down to one number
 * four times a second: how intense the music is there, from 0 (the song's quietest, sparest moment) to 1 (its fullest).
 * The player then looks a little ahead of the playhead, so the picture starts to lift just before the music does.
 *
 * Intensity is loudness, weight in the low end, and how many hits and changes are landing, each measured against the
 * song's own range, so a quiet song's chorus is as intense as a loud song's.
 */

/** Intensity per quarter-second, 0 to 1. */
export type Arc = Float32Array;
export const ARC_RATE = 4;

const cache = new Map<string, Promise<Arc | null>>();

/** Reads a song (an address on this site, or a file the visitor picked) into its arc. Null if it can't be read. */
export function analyseSong(key: string, source: string | File): Promise<Arc | null> {
  let hit = cache.get(key);
  if (!hit) {
    hit = read(source).catch(() => null);
    cache.set(key, hit);
  }
  return hit;
}

async function read(source: string | File): Promise<Arc | null> {
  const bytes = typeof source === 'string' ? await (await fetch(source)).arrayBuffer() : await source.arrayBuffer();
  const Ctx = window.OfflineAudioContext || (window as unknown as { webkitOfflineAudioContext?: typeof OfflineAudioContext }).webkitOfflineAudioContext;
  if (!Ctx) return null;
  const buf = await new Ctx(1, 1, 44100).decodeAudioData(bytes);
  const sr = buf.sampleRate;
  const a = buf.getChannelData(0);
  const b = buf.numberOfChannels > 1 ? buf.getChannelData(1) : a;
  const hop = Math.floor(sr / ARC_RATE);
  const n = Math.floor(a.length / hop);
  if (n < 8) return null;

  // per window: loudness, the low end (a gentle low-pass), and the change in each since the window before
  const rms = new Float32Array(n);
  const low = new Float32Array(n);
  let lp = 0;
  const k = 1 - Math.exp((-2 * Math.PI * 220) / sr);
  for (let w = 0; w < n; w++) {
    let s = 0;
    let l = 0;
    const from = w * hop;
    for (let i = from; i < from + hop; i += 2) {
      const x = (a[i] + b[i]) * 0.5;
      s += x * x;
      lp += (x - lp) * k;
      l += lp * lp;
    }
    rms[w] = Math.sqrt(s / (hop / 2));
    low[w] = Math.sqrt(l / (hop / 2));
  }
  const onset = new Float32Array(n);
  for (let w = 1; w < n; w++) onset[w] = Math.max(0, low[w] - low[w - 1]) + Math.max(0, rms[w] - rms[w - 1]) * 0.6;

  // each measure against the song's own quiet and loud (10th and 95th percentile), then blended
  const norm = (v: Float32Array) => {
    const s = Array.from(v).sort((x, y) => x - y);
    const lo = s[Math.floor(s.length * 0.1)];
    const hi = Math.max(lo + 1e-6, s[Math.floor(s.length * 0.95)]);
    return Float32Array.from(v, (x) => Math.min(1, Math.max(0, (x - lo) / (hi - lo))));
  };
  const nr = norm(rms);
  const nl = norm(low);
  // onsets are spiky: count them over a couple of seconds first
  const busy = new Float32Array(n);
  for (let w = 0; w < n; w++) {
    let t = 0;
    for (let j = Math.max(0, w - 4); j <= Math.min(n - 1, w + 4); j++) t += onset[j];
    busy[w] = t;
  }
  const nb = norm(busy);
  const raw = new Float32Array(n);
  for (let w = 0; w < n; w++) raw[w] = 0.5 * nr[w] + 0.25 * nl[w] + 0.25 * nb[w];
  // smoothed over about 1.5 seconds, so it reads as sections and builds rather than single hits
  const out = new Float32Array(n);
  for (let w = 0; w < n; w++) {
    let t = 0;
    let c = 0;
    for (let j = Math.max(0, w - 3); j <= Math.min(n - 1, w + 3); j++) {
      t += raw[j];
      c++;
    }
    out[w] = t / c;
  }
  // and stretched to use the whole range, since the blend sits mid-way
  return norm(out);
}

/** The intensity at a moment in the song (seconds), with a straight line between the quarter-seconds. */
export function arcAt(arc: Arc, seconds: number): number {
  const p = Math.max(0, Math.min(arc.length - 1, seconds * ARC_RATE));
  const i = Math.floor(p);
  const j = Math.min(arc.length - 1, i + 1);
  return arc[i] + (arc[j] - arc[i]) * (p - i);
}
