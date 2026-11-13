import { rng } from './garden';

/**
 * Sets a short phrase as a few lines of one or two words, each pushed in by a
 * different amount, the way the staggered headlines in a magazine spread are.
 *
 * Seeded, so a given reading always gets the same composition. The words and
 * their order are untouched: only where each line starts changes, and the page
 * ignores the offsets entirely below the wide layout.
 */
export function staggerLines(phrase: string, seed: string): { text: string; offset: string; len: number }[] {
  const words = phrase.trim().split(/\s+/).filter(Boolean);
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  const r = rng(h >>> 0);

  // group the words into lines of one or two...
  const groups: string[] = [];
  for (let i = 0; i < words.length; ) {
    const left = words.length - i;
    // two words share a line only when they are short together, so no line is long and the whole phrase can be set large
    const together = left >= 2 && words[i].length + 1 + words[i + 1].length <= 10;
    const take = together && (left === 2 ? r() < 0.55 : r() < 0.7) ? 2 : 1;
    groups.push(words.slice(i, i + take).join(' '));
    i += take;
  }
  // ...and push each one in by an uneven amount, the way a poster sets a phrase: some lines flush left, one pushed well across,
  // no two neighbours the same. (The page holds each offset back so a line never runs past the edge.)
  const steps = [0, 12, 26, 40, 52];
  const offs: number[] = [0];
  for (let i = 1; i < groups.length; i++) {
    let pick = steps[Math.floor(r() * steps.length)];
    for (let tries = 0; pick === offs[i - 1] && tries < 6; tries++) pick = steps[Math.floor(r() * steps.length)];
    offs.push(pick);
  }
  if (groups.length > 2 && Math.max(...offs) < 26) offs[Math.min(2, groups.length - 1)] = 40;
  return groups.map((text, i) => ({ text, offset: `${offs[i]}%`, len: text.length }));
}
