/** A tiny pixel glyph (an arrow, a check, the window buttons' marks) as an image the CSS can use as a background. */
export function glyph(rows: string[]) {
  const h = rows.length;
  const w = rows[0].length;
  let rects = '';
  rows.forEach((row, y) => {
    let x = 0;
    while (x < w) {
      if (row[x] !== 'X') {
        x++;
        continue;
      }
      let n = 1;
      while (row[x + n] === 'X') n++;
      rects += `<rect x="${x}" y="${y}" width="${n}" height="1"/>`;
      x += n;
    }
  });
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" shape-rendering="crispEdges" fill="#000">${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
