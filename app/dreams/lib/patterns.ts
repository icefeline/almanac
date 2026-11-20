import { INDEX } from './symbolIndex';
import { SAMPLES, localToday, type Dream } from './dreams';
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

const NUM = ['', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];
const num = (n: number) => NUM[n] || String(n);
const DAY = 86400000;
const dayMs = (iso: string) => new Date(iso + 'T00:00:00').getTime();
const longDate = (iso: string) => new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'long' }).toLowerCase();
const lowerFirst = (t: string) => (/^I[ '’]/.test(t) ? t : t.charAt(0).toLowerCase() + t.slice(1));

/** How long the dreams span, said the way a person would say it. */
function spanWords(days: number): string {
  if (days < 1) return 'one night';
  if (days < 14) return `about ${days === 1 ? 'a day' : num(days) === String(days) ? days + ' days' : num(days) + ' days'}`;
  if (days < 60) return `about ${num(Math.round(days / 7))} weeks`;
  return `about ${num(Math.round(days / 30))} months`;
}

/** The sentence of a dream that mentions this tag, in the dreamer's own words. */
function quoteFor(text: string, tag: string): string {
  const words = tag.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !['the', 'and'].includes(w)).map((w) => w.replace(/(ing|es|s)$/, ''));
  if (!words.length) return '';
  const sentence = text.split(/(?<=[.!?])\s+/).find((x) => words.some((w) => w.length > 2 && x.toLowerCase().includes(w)));
  return sentence ? lowerFirst(sentence.replace(/[.!?"”]+$/, '').trim()) : '';
}

/**
 * Offline fallback: tags that recur in 2+ dreams, with a plain reading worked out from the dreams themselves. It says only
 * what can be proved (the dreamer's own sentences, the dates, which tags travel together) plus the one vetted line from the
 * symbol index. No model is involved, so it is shorter and plainer than the real reading and is labelled that way.
 */
export function tagPatterns(dreams: Dream[]): PatternSet {
  const map = new Map<string, Dream[]>();
  for (const d of dreams) for (const t of d.themes) map.set(t, [...(map.get(t) ?? []), d]);
  const today = dayMs(localToday());
  const patterns: Pattern[] = [...map.entries()]
    .filter(([, ds]) => ds.length > 1)
    .map(([t, ds]) => {
      const sorted = [...ds].sort((a, b) => a.date.localeCompare(b.date));
      const quotes = sorted.map((d) => quoteFor(d.text, t));
      const parts: string[] = [];
      const span = Math.round((dayMs(sorted[sorted.length - 1].date) - dayMs(sorted[0].date)) / DAY);
      parts.push(`${t} turns up in ${num(ds.length)} dreams, across ${spanWords(span)}.`);
      const shown = quotes.map((q, i) => ({ q, i })).filter((x) => x.q).slice(0, 3);
      if (shown.length >= 2) {

        const bits = shown.map((x, k) => `${k === 0 ? 'in one' : k === shown.length - 1 && shown.length === ds.length ? 'in the last' : k === 1 && shown.length === 2 && ds.length === 2 ? 'in the other' : 'in another'} '${x.q}'`);

        parts.push(bits.slice(0, -1).join(', ') + ' and ' + bits[bits.length - 1] + '.');
      }
      const others = (sorted[0].themes ?? []).filter((o) => o !== t && sorted.every((d) => d.themes.includes(o)));
      if (others.length) parts.push(`each time it came with ${others.slice(0, 2).join(' and ')}.`);
      const note = INDEX.find((e) => e.name === t)?.note;
      if (note) parts.push(note.replace(/(^|[.!?]\s+)([A-Z])/g, (_m, a: string, b: string) => a + b.toLowerCase()));
      const last = sorted[sorted.length - 1];
      const ago = Math.round((today - dayMs(last.date)) / DAY);
      if (ago >= 0) parts.push(`the most recent was on ${longDate(last.date)}${ago === 0 ? ', today' : ago === 1 ? ', yesterday' : `, ${ago} days ago`}.`);
      return {
        id: 'tag:' + t,
        name: t,
        kind: 'tag' as const,
        dreams: sorted.map((d, i) => ({ id: d.id, detail: quotes[i] })),
        gist: parts[0].replace(/\.$/, ''),
        meaning: parts.join(' '),
        watch: '',
      };
    });
  return { patterns, links: [], throughline: '' };
}

const CACHE = 'milky.patterns.v5';

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
