import { INDEX } from './symbolIndex';
import { SAMPLES, type Dream } from './dreams';
import { SAMPLE_PATTERNS } from './samplePatterns';

/**
 * A pattern is a specific thing that recurs across several dreams (a shape of events, a place, a figure,
 * a feeling), found by /api/patterns reading the whole journal. Patterns replace plain tags as the stars on the map.
 */
export type PatternKind = 'motif' | 'place' | 'figure' | 'feeling' | 'action' | 'sense' | 'arc' | 'tag';

export interface Pattern {
  id: string;
  name: string;
  kind: PatternKind;
  dreams: { id: string; detail: string }[]; // the specific detail from each dream
  gist?: string; // the takeaway in a few words, short enough to write on a line
  meaning: string;
  watch: string;
}
export interface PatternLink {
  a: string;
  b: string;
  why: string;
}
export interface PatternSet {
  patterns: Pattern[];
  links: PatternLink[];
  throughline: string;
}

export const KIND_LABEL: Record<PatternKind, string> = {
  motif: 'a recurring image',
  place: 'a recurring place',
  figure: 'a recurring figure',
  feeling: 'a recurring feeling',
  action: 'a recurring action',
  sense: 'a recurring sense',
  arc: 'a recurring shape of events',
  tag: 'a theme you tagged',
};

/** Changes whenever the journal's content does, so the cached reading is reused only when it still applies. */
export function dreamsKey(dreams: Dream[]): string {
  const s = [...dreams]
    .sort((a, b) => a.id.localeCompare(b.id))
    .map((d) => d.id + '|' + d.text + '|' + d.themes.join(','))
    .join('\n');
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0;
  return h.toString(36) + ':' + dreams.length;
}

/** Offline fallback: tags that recur in 2+ dreams, shown as plain patterns until a real reading arrives. */
export function tagPatterns(dreams: Dream[]): PatternSet {
  const map = new Map<string, string[]>();
  for (const d of dreams) for (const t of d.themes) map.set(t, [...(map.get(t) ?? []), d.id]);
  const patterns: Pattern[] = [...map.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([t, ids]) => ({
      id: 'tag:' + t,
      name: t,
      kind: 'tag' as const,
      dreams: ids.map((id) => ({ id, detail: '' })),
      meaning: INDEX.find((e) => e.name === t)?.note ?? '',
      watch: '',
    }));
  return { patterns, links: [], throughline: '' };
}

const CACHE = 'milky.patterns.v4';

export function loadCachedPatterns(key: string): PatternSet | null {
  try {
    const c = JSON.parse(localStorage.getItem(CACHE) || 'null');
    return c && c.key === key ? (c.set as PatternSet) : null;
  } catch {
    return null;
  }
}

export function saveCachedPatterns(key: string, set: PatternSet): void {
  try {
    localStorage.setItem(CACHE, JSON.stringify({ key, set }));
  } catch {
    /* cache is optional */
  }
}

let sampleKey: string | null = null;
/** the made-up sample dreams ship with their patterns already read, so opening the map costs nothing */
export function sampleSet(key: string): PatternSet | null {
  if (!SAMPLE_PATTERNS) return null;
  sampleKey ??= dreamsKey(SAMPLES);
  return key === sampleKey ? SAMPLE_PATTERNS : null;
}
