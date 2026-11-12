import { rng } from './garden';

/**
 * Sets a short phrase as a few lines of one or two words, each pushed in by a
 * different amount, the way the staggered headlines in a magazine spread are.
 *
 * Seeded, so a given reading always gets the same composition. The words and
 * their order are untouched: only where each line starts changes, and the page
 * ignores the offsets entirely below the wide layout.
 */
export function staggerLines(phrase: string, seed: string): { text: string; offset: string }[] {
  const words = phrase.trim().split(/\s+/).filter(Boolean);
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const r = rng(h >>> 0);

  // group the words into lines of one or two...
  const groups: string[] = [];
  for (let i = 0; i < words.length; ) {
    const left = words.length - i;
    const take = left >= 2 && (left === 2 ? r() < 0.55 : r() < 0.7) ? 2 : 1;
    groups.push(words.slice(i, i + take).join(' '));
    i += take;
  }
  // ...and step each one further across than the last, so the phrase runs down the
  // page on a diagonal, the way it is read: a cascade, not a scatter
  const step = groups.length > 1 ? Math.min(14, 42 / (groups.length - 1)) : 0;
  const lines = groups.map((text, i) => ({ text, offset: `${(i * step).toFixed(1)}%` }));
  return lines;
}
