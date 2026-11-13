/**
 * What each scent note looks like.
 *
 * Every note in the deck is mapped to a simple silhouette of the thing it comes from —
 * a leaf, a citrus, a clove bud, a drop of resin — drawn in a 100×100 box centred on
 * the origin, so the distill scene's blobs are the notes themselves rather than
 * anonymous circles. They are deliberately plain: the dither and the warp do the rest,
 * and a plain shape stays readable through both.
 */

export type ShapeKey =
  | 'clove' | 'citrus' | 'leaf' | 'sprig' | 'flower' | 'wood' | 'resin' | 'spice'
  | 'root' | 'pod' | 'fruit' | 'smoke' | 'musk' | 'crystal' | 'blob';

const circle = (cx: number, cy: number, r: number) =>
  `M${(cx - r).toFixed(1)} ${cy.toFixed(1)}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

const flower = [0, 1, 2, 3, 4]
  .map((k) => {
    const a = ((-90 + 72 * k) * Math.PI) / 180;
    return circle(25 * Math.cos(a), 25 * Math.sin(a), 18);
  })
  .join('') + circle(0, 0, 14);

const star = (() => {
  const pts: string[] = [];
  for (let k = 0; k < 16; k++) {
    const a = ((-90 + 22.5 * k) * Math.PI) / 180;
    const r = k % 2 === 0 ? 48 : 19;
    pts.push(`${(r * Math.cos(a)).toFixed(1)} ${(r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join('L')}Z`;
})();

const sprig = (() => {
  let d = 'M-3 50L3 50L3 -46L-3 -46Z';
  for (const y of [30, 8, -14]) {
    d += `M2 ${y}C20 ${y - 16} 36 ${y - 12} 44 ${y - 6}C32 ${y + 6} 14 ${y + 6} 2 ${y}Z`;
    d += `M-2 ${y}C-20 ${y - 16} -36 ${y - 12} -44 ${y - 6}C-32 ${y + 6} -14 ${y + 6} -2 ${y}Z`;
  }
  return d + 'M0 -46C8 -52 12 -48 10 -42C4 -42 0 -44 0 -46Z';
})();

export const SHAPES: Record<ShapeKey, string> = {
  // a clove bud: a round head with four sepals on top of a tapering stem
  clove: `M-7 -6L-2 48L2 48L7 -6Z${circle(0, -24, 17)}M-17 -30L-27 -46L-8 -40ZM17 -30L27 -46L8 -40ZM-6 -40L0 -54L6 -40Z`,
  citrus: `${circle(0, 6, 42)}M0 -34C8 -50 26 -50 32 -44C24 -32 8 -30 0 -34Z`,
  leaf: 'M0 50C-36 22 -36 -24 0 -50C36 -24 36 22 0 50Z',
  sprig,
  flower,
  wood: 'M-42 14L30 -36L44 -18L-28 32ZM-4 -8L8 -36L17 -31L6 -2Z',
  resin: 'M0 -50C30 -12 42 8 42 24A42 42 0 0 1 -42 24C-42 8 -30 -12 0 -50Z',
  spice: star,
  root: 'M-32 50L-25 -42L-18 50ZM-12 50L-5 -50L2 50ZM8 50L16 -44L22 50ZM24 50L36 -30L40 50Z',
  pod: 'M-46 32C-22 -10 20 -36 46 -44C42 -30 40 -26 36 -22C10 -6 -16 26 -42 44Z',
  fruit: 'M0 -34C40 -44 50 8 30 34C16 52 -16 52 -30 34C-50 8 -40 -44 0 -34ZM2 -34C4 -46 16 -52 26 -48C22 -38 12 -32 2 -34Z',
  smoke: 'M-6 50C-32 26 14 10 -4 -8C-22 -26 12 -38 2 -52C24 -38 -6 -22 12 -8C30 8 -4 28 14 50Z',
  musk: 'M-32 -18C-12 -50 34 -40 42 -6C48 28 12 50 -18 42C-46 34 -50 -2 -32 -18Z',
  crystal: 'M0 -50L36 -14L24 42L-24 42L-36 -14Z',
  blob: circle(0, 0, 42),
};

const RULES: [RegExp, ShapeKey][] = [
  [/clove/, 'clove'],
  [/yuzu|bergamot|mandarin|lemon|grapefruit|^orange$|^lime$/, 'citrus'],
  [/blossom|rose|jasmine|violet$|iris|magnolia|mimosa|neroli|osmanthus|champaca|frangipani|lotus|lily|elderflower|poppy|chamomile|ylang|tuberose/, 'flower'],
  [/leaf|laurel|pandan|tea|eucalyptus|patchouli/, 'leaf'],
  [/thyme|sage|tarragon|hyssop|mugwort|wormwood|vervain|valerian|lavender|juniper|immortelle|coriander seed|carrot seed/, 'sprig'],
  [/cedar|cypress|hinoki|oud|sandalwood|birch|^ash$|bay/, 'wood'],
  [/frankincense|myrrh|benzoin|labdanum|honey|beeswax/, 'resin'],
  [/pepper|cardamom|cinnamon|fenugreek|ginger|saffron|anise/, 'spice'],
  [/vetiver|hay|orris|oakmoss|seaweed|rhubarb/, 'root'],
  [/vanilla|tonka|cacao/, 'pod'],
  [/peach|^fig$|cucumber|currant|bud/, 'fruit'],
  [/tobacco|tar$|petrichor/, 'smoke'],
  [/musk|ambergris|ambrette|truffle/, 'musk'],
  [/salt|stone|water/, 'crystal'],
];

/** The silhouette for a note, by what it is. Anything unrecognised is a plain blob. */
export function shapeFor(note: string): ShapeKey {
  const n = note.toLowerCase();
  for (const [re, key] of RULES) if (re.test(n)) return key;
  return 'blob';
}
