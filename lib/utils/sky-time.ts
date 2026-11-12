/**
 * The sky as it is right now, for the dithered cloud background.
 *
 * Client-safe and dependency-free (astronomy-engine stays out of the browser
 * bundle — see sky.ts). This only has to be good enough to pick a colour, so it
 * uses the NOAA low-precision solar position rather than a full ephemeris.
 *
 * Where the reader's coordinates are cached (lib/utils/here.ts) the altitude is
 * real. Without them it falls back to the device clock at a mid-latitude, so the
 * sky still turns dawn → day → sunset → night, just not on the reader's exact
 * minute. Nothing here is sent anywhere.
 */

export interface SkyMoment {
  /** Sun altitude in degrees; below 0 is under the horizon. */
  altitude: number;
  /** Before solar noon — separates a dawn from a dusk at the same altitude. */
  morning: boolean;
}

const RAD = Math.PI / 180;

export function skyMoment(
  at: Date,
  where: { latitude: number; longitude: number } | null,
): SkyMoment {
  const start = Date.UTC(at.getUTCFullYear(), 0, 0);
  const dayOfYear = Math.floor((at.getTime() - start) / 86_400_000);
  const b = (2 * Math.PI * (dayOfYear - 81)) / 364;
  const declination = 23.44 * Math.sin((2 * Math.PI * (dayOfYear - 81)) / 365) * RAD;
  // equation of time, minutes
  const eot = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b);

  let latitude: number;
  let solarHours: number;
  if (where) {
    latitude = where.latitude;
    const utcHours = at.getUTCHours() + at.getUTCMinutes() / 60 + at.getUTCSeconds() / 3600;
    solarHours = utcHours + where.longitude / 15 + eot / 60;
  } else {
    latitude = 45;
    solarHours = at.getHours() + at.getMinutes() / 60 + at.getSeconds() / 3600;
  }
  solarHours = ((solarHours % 24) + 24) % 24;

  const hourAngle = (solarHours - 12) * 15 * RAD;
  const lat = latitude * RAD;
  const sinAlt =
    Math.sin(lat) * Math.sin(declination) +
    Math.cos(lat) * Math.cos(declination) * Math.cos(hourAngle);
  return { altitude: Math.asin(Math.max(-1, Math.min(1, sinAlt))) / RAD, morning: solarHours < 12 };
}

/** One stop on the colour ladder. Sky runs top → mid → horizon; clouds are lit or in shade. */
export interface SkyStop {
  alt: number;
  top: string;
  mid: string;
  horizon: string;
  cloudLight: string;
  cloudShade: string;
}

/**
 * Soft, slightly hazy, a little dreamy — pastel rather than saturated, so the
 * paper-white text on top stays readable at every hour. Altitudes ascend.
 */
const NIGHT: SkyStop = { alt: -14, top: '#0d1230', mid: '#1b2152', horizon: '#33306a', cloudLight: '#5d6399', cloudShade: '#1e2349' };
// the small hours: nearly black, a green-blue cast, the clouds barely lit
const DEEP: SkyStop = { alt: -34, top: '#04060f', mid: '#080d1c', horizon: '#0d1626', cloudLight: '#2a3552', cloudShade: '#0a1020' };
const DAY: SkyStop = { alt: 42, top: '#4c82c4', mid: '#86b8e0', horizon: '#cde4ee', cloudLight: '#fdfcf4', cloudShade: '#9dbbd8' };

const MORNING: SkyStop[] = [
  DEEP,
  NIGHT,
  { alt: -6, top: '#2b2f70', mid: '#8a63a2', horizon: '#f0a38c', cloudLight: '#ffcaa8', cloudShade: '#6b4b8c' },
  { alt: 1, top: '#6577b8', mid: '#eaa6b4', horizon: '#ffd7a0', cloudLight: '#fff0d4', cloudShade: '#b87f9e' },
  { alt: 12, top: '#6f9fd6', mid: '#adcfe4', horizon: '#f6e8cc', cloudLight: '#ffffff', cloudShade: '#aabfd8' },
  DAY,
];

const EVENING: SkyStop[] = [
  DAY,
  { alt: 12, top: '#5f86c6', mid: '#e8bba2', horizon: '#ffdca4', cloudLight: '#fff4de', cloudShade: '#c398aa' },
  { alt: 1, top: '#4b4c9a', mid: '#d6708c', horizon: '#ffa85e', cloudLight: '#ffdca4', cloudShade: '#9b507c' },
  { alt: -6, top: '#241f5e', mid: '#7b4b92', horizon: '#e0727c', cloudLight: '#f2a4a2', cloudShade: '#5b3b7c' },
  NIGHT,
  DEEP,
];

function mix(a: string, b: string, t: number): string {
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (shift: number) => {
    const va = (pa >> shift) & 255;
    const vb = (pb >> shift) & 255;
    return Math.round(va + (vb - va) * t);
  };
  return '#' + ((1 << 24) | (ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).slice(1);
}

/** The palette for a moment: interpolated between the two nearest stops. */
export function skyPalette(m: SkyMoment): SkyStop {
  const ladder = m.morning ? MORNING : EVENING;
  // Ladders ascend (morning) or descend (evening) in altitude; walk whichever way it runs.
  const asc = m.morning;
  const alt = m.altitude;
  const first = ladder[0];
  const last = ladder[ladder.length - 1];
  if (asc ? alt <= first.alt : alt >= first.alt) return first;
  if (asc ? alt >= last.alt : alt <= last.alt) return last;
  for (let i = 0; i < ladder.length - 1; i++) {
    const a = ladder[i];
    const b = ladder[i + 1];
    const inside = asc ? alt >= a.alt && alt <= b.alt : alt <= a.alt && alt >= b.alt;
    if (!inside) continue;
    const t = (alt - a.alt) / (b.alt - a.alt);
    return {
      alt,
      top: mix(a.top, b.top, t),
      mid: mix(a.mid, b.mid, t),
      horizon: mix(a.horizon, b.horizon, t),
      cloudLight: mix(a.cloudLight, b.cloudLight, t),
      cloudShade: mix(a.cloudShade, b.cloudShade, t),
    };
  }
  return last;
}
