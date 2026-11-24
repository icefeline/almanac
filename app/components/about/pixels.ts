/** A tiny pixel glyph (an arrow, a check, the window buttons' marks) as an image the CSS can use as a background. */
export function glyph(rows: string[], even = false) {
  // `even` pads the picture to an even width and height, so that centred in a button (all of them an even size) it lands
  // on whole pixels, as it would in Windows, instead of straddling two
  const h = rows.length;
  const w = rows[0].length;
  const cw = even ? w + (w % 2) : w;
  const ch = even ? h + (h % 2) : h;
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
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}" viewBox="0 0 ${cw} ${ch}" shape-rendering="crispEdges" fill="#000">${rects}</svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
