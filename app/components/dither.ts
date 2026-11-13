/**
 * Shared bits of the pixel/dither look used by the splash lettering and the card name.
 */

// an 8x8 ordered-dither matrix, built up from the 2x2 one: sixty-four levels, so a gradient steps smoothly
export const BAYER8: number[][] = (() => {
  let m = [[0, 2], [3, 1]];
  for (let n = 2; n < 8; n *= 2) {
    const next: number[][] = Array.from({ length: n * 2 }, () => Array(n * 2).fill(0));
    for (let y = 0; y < n; y++) {
      for (let x = 0; x < n; x++) {
        const v = m[y][x] * 4;
        next[y][x] = v;
        next[y][x + n] = v + 2;
        next[y + n][x] = v + 3;
        next[y + n][x + n] = v + 1;
      }
    }
    m = next;
  }
  return m;
})();

export type RGB = [number, number, number];

export function hexToRgb(c: string): RGB {
  const m = /^#?([0-9a-f]{6})$/i.exec(c.trim());
  if (!m) return [43, 53, 214];
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

/** The page's two accents: cobalt and lime by day, swapped at night. */
export function skyPalette(): { main: RGB; echo: RGB } {
  const cs = getComputedStyle(document.documentElement);
  return {
    main: hexToRgb(cs.getPropertyValue('--accent-c') || '#2B35D6'),
    echo: hexToRgb(cs.getPropertyValue('--lime-c') || '#C9F24E'),
  };
}
