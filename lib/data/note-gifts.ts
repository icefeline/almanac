import type { ShapeKey } from '@/lib/utils/scent-shapes';
import { shapeFor } from '@/lib/utils/scent-shapes';

/**
 * What each scent note gives.
 *
 * One short line per note: what it feels like, and so what it could offer someone
 * holding it. Written in the app's own voice — lowercase, noticing, never an
 * instruction — and shown when a note is touched in the distill scene. A note the
 * library does not know falls back to a line for the kind of thing it is.
 */
const GIFTS: Record<string, string> = {
  ambergris: 'salt and warm skin after a day at the sea, with something faintly animal underneath.',
  ambrette: 'a seed that smells like a cashmere cuff, close and a little musky.',
  'ambrette seed': 'the inside of a wool coat that has been worn all winter.',
  ash: 'what the grate holds the morning after, dry and finished.',
  'bay laurel': 'a green, bitter crown, the kind of pride that took some doing.',
  beeswax: 'a candle burning down in the afternoon, gold and slow.',
  benzoin: 'a sweet resin that sands off the sharp corners of a room.',
  bergamot: 'a window pushed open in a stuffy room.',
  'birch tar': 'smoke and old leather, as if something weathered had cleared its throat.',
  'black pepper': 'a dry crack, like a match being struck.',
  'blackcurrant bud': 'a sharp green tartness, the sourness of something still growing.',
  'blue lotus': 'still water with a sweetness floating on it, going nowhere in particular.',
  cacao: 'dark, bitter and a bit sleepy, the kind of warmth that slows your hands.',
  cardamom: 'a cool spice that clears the air before it warms it.',
  'carrot seed': 'damp soil and a little sweetness, plain-spoken and rooted.',
  cedar: 'a pencil shaving, dry and upright, wanting nothing from you.',
  chamomile: "a pale, apple-like calm, the sort you'd hand someone with a bruise.",
  champaca: 'heady golden flowers, almost too much, and unembarrassed about it.',
  cinnamon: 'hands around a hot cup, a close, bright warmth.',
  'coriander seed': 'a light citrus-spiced freshness, easy and open-handed.',
  cucumber: "cold green water, a quiet that doesn't need filling.",
  cypress: 'a tall resinous stillness at the edge of a garden.',
  "dragon's blood": 'a dark red resin, protective and slow to fade.',
  elderflower: 'pale honeyed lightness, like an evening that has only just started.',
  eucalyptus: 'cold, clear air let straight into the chest.',
  fenugreek: "maple and hay, a sweetness that smells like someone's kitchen.",
  fig: 'milky, green and sweet, ripening against a sunny wall.',
  'fig leaf': 'green milk and warm bark, the shade under the tree.',
  frangipani: 'creamy tropical petals, a bit indulgent and in no hurry.',
  frankincense: 'clear smoke climbing, attention turned upward.',
  'garden sage': 'dry and herbal, sure of itself without raising its voice.',
  ginger: 'a warm bright bite that gets the blood moving.',
  'green tea': 'leafy and light, awake without trying.',
  hay: 'sun-dried grass, the sweetness of a field left alone to rest.',
  hinoki: 'pale clean wood, a bath-house first thing in the morning.',
  honey: 'slow amber that coats and softens whatever it touches.',
  hyssop: 'a bitter, minty rinse, like washing something thoroughly.',
  immortelle: 'dried flowers with a curry-warm sweetness, what lasts after the bloom.',
  iris: 'cool, powdery and slightly formal, like cold hands in a good coat.',
  jasmine: "a night-blooming sweetness that's hard to ignore.",
  'jasmine grandiflorum': 'jasmine gone almost indecent, lush and a little animal.',
  'jasmine sambac': 'green, creamy jasmine, the kind strung into garlands.',
  juniper: 'gin and pine and cold air, bracing and clean.',
  'kaffir lime leaf': 'a sharp citrus-green that snaps awake in a hot pan.',
  labdanum: 'sticky amber resin, leathery and warm like a sunlit rock.',
  lavender: 'dried bundles in a drawer, an old-fashioned calm.',
  magnolia: 'a lemony, creamy bloom, large and unhurried.',
  mimosa: 'powdery yellow pollen, sunny and a bit sleepy.',
  mugwort: 'a grey-green bitterness that smells like dreams you half recall.',
  myrrh: 'a dark bitter resin, old and a little medicinal, kept for tending.',
  neroli: 'bitter orange blossom, bright and clean, almost a sigh of relief.',
  oakmoss: 'forest floor after rain, damp, green and old.',
  'orange blossom': 'honeyed white petals with a green edge, a wedding in the next street.',
  'orange blossom water': 'a faint floral sweetness from a kitchen cupboard, soft and domestic.',
  orris: 'powdered iris root, cool and dry as chalk dust.',
  osmanthus: 'apricot and leather and tea, a small gold flower with a long memory.',
  oud: 'dark, smoky wood, resinous, deep and not for everyone.',
  pandan: 'a green, nutty-sweet leaf that smells like rice cooking.',
  patchouli: 'damp earth, cocoa and old books, grounded and a bit rebellious.',
  peach: 'fuzzy skin and juice on the chin, ripe and unembarrassed.',
  petrichor: 'the smell of dry ground when the first rain hits it.',
  'pink pepper': 'a light, rosy prickle, bright but not hot.',
  poppy: 'powdery and faintly bitter, a drowsy field in bloom.',
  rhubarb: 'tart, green and slightly sour, with the crunch of early spring.',
  rose: 'petals and thorns together, soft and a little fierce.',
  'rose water': 'a delicate floral hint from a bakery or a bathroom shelf.',
  saffron: 'a dry golden filament, leathery and honeyed, expensive in the mouth.',
  sandalwood: 'creamy, soft wood, like a smooth warm bench.',
  'sea salt': 'clean mineral air and wet skin, bracing and honest.',
  seaweed: 'low tide, briny and cool, the sea at its most unglamorous.',
  'star anise': 'a sweet, licorice warmth with a faint cold edge.',
  tarragon: 'green anise on a clean plate, sharp and cheerful.',
  thyme: 'a small herb, dry and sunny, from a pot on the windowsill.',
  tobacco: 'dried leaves and honey, a warm room after the guests have gone.',
  'tomato leaf': 'a green, sharp, slightly bitter scent, the smell on your hands in the garden.',
  'tonka bean': 'vanilla with almonds and hay, like something half remembered.',
  'torch ginger': 'a pink-green flower with a spicy snap.',
  truffle: 'damp earth and something buried, rich and strange.',
  tuberose: 'an intense creamy white flower, too much and just enough.',
  valerian: 'a heavy, earthy hush, like a body asking to lie down.',
  vanilla: 'warm sweetness, the smell of being looked after.',
  vervain: 'lemony herb, bright and bracing as a splash of cold water.',
  vetiver: 'dry roots and damp earth, a steadiness that goes down deep.',
  violet: 'powdery and sweet, a faded sweet shop at the back of memory.',
  'violet leaf': 'green, watery and a touch metallic, a thin cold wire.',
  'water lily': 'cool and clear, green-sweet, calm on the surface.',
  'wet stone': 'cold mineral after rain, with nothing to prove.',
  'white cedar': 'a lighter, drier wood, clean and spare and open.',
  'white musk': 'clean laundry and warm skin, close and unremarkable in the best way.',
  'white rose': 'a cooler, greener rose, restraint with feeling underneath.',
  'white tea': 'pale, silvery and delicate, attention held lightly.',
  wormwood: "bitter and herbal, a truth that can't be swallowed quickly.",
  'ylang ylang': 'creamy, banana-sweet flowers, lush and slow.',
  yuzu: 'a bright sour edge that cuts through haze.',
};

const GENERIC: Record<ShapeKey, string> = {
  clove: 'a small hot bud, warmth held tight.',
  citrus: 'a bright, sour lift.',
  leaf: 'something green and cool.',
  sprig: 'a dry herbal steadiness.',
  flower: 'something open, soft and a little heady.',
  wood: 'dry, steady wood.',
  resin: 'a slow amber seep.',
  spice: 'a bright, close heat.',
  root: 'something earthy that goes down deep.',
  pod: 'a warm, round sweetness.',
  fruit: 'ripe, easy sweetness.',
  smoke: 'smoke that is slow to clear.',
  musk: 'a close, skin-warm hush.',
  crystal: 'something cool and mineral.',
  blob: 'a presence you can feel more than name.',
};

export function noteGift(note: string): string {
  return GIFTS[note.toLowerCase()] ?? GENERIC[shapeFor(note)];
}

/**
 * The line that ties a note to this card: where in the scent the note sits decides
 * how it speaks to one of the card's own keywords. Always "you might notice" — the
 * note reflects, it doesn't advise.
 */
export function noteTie(args: {
  card: string;
  reversed: boolean;
  tier: string;
  keyword: string;
}): string {
  const name = `${args.card}${args.reversed ? ' (reversed)' : ''}`;
  const kw = args.keyword.toLowerCase();
  const pick = <T,>(xs: T[]) => xs[(args.card.length + args.keyword.length * 3 + (args.reversed ? 1 : 0)) % xs.length];
  const top = [
    `the ${name} turns up first in ${kw}, before anything else has found its feet.`,
    `there may be a flicker of ${kw} early in the day, the way the ${name} tends to start.`,
    `${kw} is the first thing this card touches. watch where it surfaces.`,
  ];
  const heart = [
    `under the ${name}, ${kw} may be working in the background, unannounced.`,
    `the middle of the ${name} is ${kw}. you might catch it mid-sentence.`,
    `a steady drone of ${kw} sits behind this card. see when you stop hearing it.`,
  ];
  const base = [
    `after the ${name} has passed, ${kw} is what stays on the skin.`,
    `${kw} hangs about longest. there may be a trace of it tonight.`,
    `once the rest of the ${name} thins out, ${kw} is still there.`,
  ];
  return pick(args.tier === 'top' ? top : args.tier === 'heart' ? heart : base);
}

const LASTS: Record<string, string[]> = {
  top: ['the first thing to go, usually within minutes.', 'bright and brief; it is gone before the rest arrives.', 'it opens the accord and leaves early.'],
  heart: ['the body of the accord, it stays through the middle of the day.', 'what holds the middle once the top has lifted.', 'it carries the hours after the first impression.'],
  base: ['still there when the rest has gone.', 'it is what the skin keeps overnight.', 'slow to arrive and slower to leave.'],
};

/** What the note sits beside in this card's own accord, and how long it lasts. Nothing from the card's meaning. */
export function noteCompany(note: string, tier: string, mates: string[]): string {
  const lasts = LASTS[tier] ?? LASTS.heart;
  const line = lasts[note.length % lasts.length];
  if (mates.length === 0) return `alone in the ${tier} of this accord; ${line}`;
  const names = mates.length === 1 ? mates[0] : `${mates.slice(0, -1).join(', ')} and ${mates[mates.length - 1]}`;
  return `beside ${names} in the ${tier}; ${line}`;
}
