export interface PoemLine {
  text: string;
  /** True when the line opens a new sentence: it gets a stanza's gap above it. */
  gap: boolean;
}

/**
 * Breaks a passage into short lines, the way a poem is set: at the end of each
 * sentence, and inside a long one at its commas and conjunctions. The words and
 * their order are untouched; only where the lines break and how far each is nudged
 * off centre changes. Seeded, so a given reading always sets the same way.
 */
export function poemLines(text: string, seed: string): PoemLine[] {
  const sentences = text.trim().split(/(?<=[.?!])\s+/).filter(Boolean);
  const out: string[] = [];
  for (const sentence of sentences) {
    if (sentence.length <= 42) {
      out.push(sentence);
      continue;
    }
    const parts = sentence.split(/(?<=,)\s+|\s+(?=(?:or|and|but|when|where|what|that|if|before|instead)\s)/);
    let cur = '';
    for (const part of parts) {
      const joined = cur ? `${cur} ${part}` : part;
      if (cur && joined.length > 40) {
        out.push(cur);
        cur = part;
      } else {
        cur = joined;
      }
    }
    if (cur) out.push(cur);
  }

  // a short line left on its own reads as a stray, so fold it into the next one
  const merged: string[] = [];
  for (let i = 0; i < out.length; i++) {
    const line = out[i];
    if (line.length < 14 && !/[.?!]$/.test(line) && i < out.length - 1) {
      out[i + 1] = `${line} ${out[i + 1]}`;
    } else {
      merged.push(line);
    }
  }
  return merged.map((text, i) => ({ text, gap: i > 0 && /[.?!]$/.test(merged[i - 1]) }));
}
