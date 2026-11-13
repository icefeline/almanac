/**
 * The sky right now, in plain words, for the tear-off calendar page.
 *
 * Client-safe and dependency-free (astronomy-engine stays out of the browser bundle: see sky.ts). The sun's and moon's
 * positions use the low-precision series from the Astronomical Almanac with the moon's largest correction terms, good to
 * about a third of a degree, which is plenty to name a sign, a nakshatra, a lunar day and a phase. Where a body is
 * within that margin of a boundary the name may be a day off, and nothing here claims more than that.
 *
 * Both traditions from the same two longitudes:
 *   western   tropical signs
 *   vedic     sidereal signs (Lahiri ayanamsa), the lunar day (tithi) and the moon's nakshatra
 */

const RAD = Math.PI / 180;

const SIGNS = ['aries', 'taurus', 'gemini', 'cancer', 'leo', 'virgo', 'libra', 'scorpio', 'sagittarius', 'capricorn', 'aquarius', 'pisces'];

const NAKSHATRAS = [
  'ashwini', 'bharani', 'krittika', 'rohini', 'mrigashira', 'ardra', 'punarvasu', 'pushya', 'ashlesha',
  'magha', 'purva phalguni', 'uttara phalguni', 'hasta', 'chitra', 'swati', 'vishakha', 'anuradha',
  'jyeshtha', 'mula', 'purva ashadha', 'uttara ashadha', 'shravana', 'dhanishta', 'shatabhisha',
  'purva bhadrapada', 'uttara bhadrapada', 'revati',
];

const norm = (d: number) => ((d % 360) + 360) % 360;

/** Days since J2000.0 (2000-01-01 12:00 UT). */
function daysSinceJ2000(at: Date): number {
  return at.getTime() / 86_400_000 - 10957.5;
}

export function sunLongitude(at: Date): number {
  const n = daysSinceJ2000(at);
  const L = 280.46 + 0.9856474 * n;
  const g = (357.528 + 0.9856003 * n) * RAD;
  return norm(L + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g));
}

export function moonLongitude(at: Date): number {
  const n = daysSinceJ2000(at);
  const L = 218.316 + 13.176396 * n; // mean longitude
  const M = (134.963 + 13.064993 * n) * RAD; // moon's mean anomaly
  const D = (297.85 + 12.190749 * n) * RAD; // mean elongation
  const Ms = (357.529 + 0.98560028 * n) * RAD; // sun's mean anomaly
  const F = (93.272 + 13.22935 * n) * RAD; // moon's argument of latitude
  return norm(
    L +
      6.289 * Math.sin(M) +
      1.274 * Math.sin(2 * D - M) +
      0.658 * Math.sin(2 * D) +
      0.214 * Math.sin(2 * M) -
      0.186 * Math.sin(Ms) -
      0.114 * Math.sin(2 * F),
  );
}

/** Lahiri ayanamsa, degrees: about 23.86 at 2000, drifting 50.3 arc-seconds a year. */
export function lahiri(at: Date): number {
  const years = daysSinceJ2000(at) / 365.25;
  return 23.857 + years * 0.013972;
}

const signOf = (lon: number) => ({ sign: SIGNS[Math.floor(norm(lon) / 30)], deg: Math.floor(norm(lon) % 30) });

export interface SkyNow {
  /** The moon's phase as a fraction of the cycle: 0 new, 0.5 full. */
  phase: number;
  /** Percent of the moon's face that is lit. */
  lit: number;
  phaseName: string;
  waxing: boolean;
  western: { sun: { sign: string; deg: number }; moon: { sign: string; deg: number } };
  vedic: {
    sun: { sign: string; deg: number };
    moon: { sign: string; deg: number };
    nakshatra: string;
    /** Lunar day, 1 to 15 in each half of the month. */
    tithi: number;
    paksha: 'shukla' | 'krishna';
    /** A name for the day when it is a special one. */
    special: 'purnima' | 'amavasya' | null;
  };
}

export function skyNow(at: Date): SkyNow {
  const sun = sunLongitude(at);
  const moon = moonLongitude(at);
  const aya = lahiri(at);
  const elong = norm(moon - sun);
  const lit = Math.round(((1 - Math.cos(elong * RAD)) / 2) * 100);

  let phaseName: string;
  if (elong < 6 || elong >= 354) phaseName = 'new moon';
  else if (elong < 84) phaseName = 'waxing crescent';
  else if (elong < 96) phaseName = 'first quarter';
  else if (elong < 174) phaseName = 'waxing gibbous';
  else if (elong < 186) phaseName = 'full moon';
  else if (elong < 264) phaseName = 'waning gibbous';
  else if (elong < 276) phaseName = 'last quarter';
  else phaseName = 'waning crescent';

  const tithiIndex = Math.floor(elong / 12); // 0..29
  const tithi = (tithiIndex % 15) + 1;
  const paksha = tithiIndex < 15 ? 'shukla' : 'krishna';
  const special = tithiIndex === 14 ? 'purnima' : tithiIndex === 29 ? 'amavasya' : null;

  const moonSid = norm(moon - aya);
  return {
    phase: elong / 360,
    lit,
    phaseName,
    waxing: elong < 180,
    western: { sun: signOf(sun), moon: signOf(moon) },
    vedic: {
      sun: signOf(norm(sun - aya)),
      moon: signOf(moonSid),
      nakshatra: NAKSHATRAS[Math.floor(moonSid / (360 / 27))],
      tithi,
      paksha,
      special,
    },
  };
}
