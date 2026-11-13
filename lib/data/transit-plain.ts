/**
 * The "what is this transit" explanation, in plain words.
 *
 * Written once, not generated: the same transit always explains itself the same
 * way, and it costs nothing per reading. Three short parts, in this order:
 * what the two planets are, why the angle between them feels the way it does,
 * and how long it lasts. It says what the reader might notice, never what will
 * happen. Voice is the app's own: lowercase, plain, no jargon left unexplained.
 */

/** "saturn is …" — the planet that is moving. */
const MOVING: Record<string, string> = {
  Sun: 'the sun is the planet of energy and attention, and of who you feel you are.',
  Moon: 'the moon is the planet of mood and comfort, how you feel and what you need to feel okay.',
  Mercury: 'mercury is the planet of talking and thinking, and how things get put into words.',
  Venus: "venus is the planet of what you enjoy, what you value and who you're warm toward.",
  Mars: 'mars is the planet of drive and temper, and how hard you push for what you want.',
  Jupiter: "jupiter is the planet of generosity and the feeling that there's more room than you thought.",
  Saturn: 'saturn is the planet of limits and slow, unglamorous work.',
  Uranus: 'uranus is the planet of sudden change and the itch to break a habit.',
  Neptune: "neptune is the planet of dreams and blur, and a longing you can't quite name.",
  Pluto: 'pluto is the planet of deep change, and of what has to end.',
  'North Node': "the north node points to the direction you're pulled toward, even when it feels unfamiliar.",
  'South Node': 'the south node points to old habits and whatever comes easily.',
  Chiron: 'chiron stands for an old bruise, and for the healing that comes from touching it.',
};

/** "your moon is …" — the point in your own chart it is touching. */
const YOURS: Record<string, string> = {
  Sun: 'your sun is your sense of self, and what you want to be seen for.',
  Moon: 'your moon is how you feel and what you need to feel okay.',
  Mercury: 'your mercury is how you think and put things into words.',
  Venus: "your venus is what you enjoy and who you're warm toward.",
  Mars: 'your mars is your drive, your temper and how you push for what you want.',
  Jupiter: 'your jupiter is your generosity and your sense of room to grow.',
  Saturn: 'your saturn is your sense of duty, and where you hold yourself to a standard.',
  Uranus: 'your uranus is your restless side, the part that wants to break a habit.',
  Neptune: 'your neptune is where you dream and let the edges blur.',
  Pluto: 'your pluto is where you are most intense and most able to change.',
  'North Node': "your north node is the direction you're growing toward.",
  'South Node': 'your south node is your old, easy habits.',
  Chiron: 'your chiron is an old bruise that also teaches you.',
};

const CONTACT: Record<string, string> = {
  square: "right now they're at an awkward angle, one pressing on the other.",
  opposition: "right now they're on opposite sides, pulling against each other.",
  conjunction: "right now they're sitting in the same spot.",
  trine: "right now they're talking easily.",
  sextile: "right now they're nodding to each other.",
};

const WHY: Record<string, { label: string; text: string }> = {
  square: {
    label: 'why it can feel like friction',
    text: "a square is two planets at right angles, so they don't agree and neither gives way. you might notice wanting one thing while the day asks for another.",
  },
  opposition: {
    label: 'why it can feel like a tug of war',
    text: 'an opposition is two planets facing each other across the chart, so it can pull in two directions. you might notice yourself swinging between two answers.',
  },
  conjunction: {
    label: 'why it feels so loud',
    text: 'a conjunction is two planets in the same spot, so their themes mix and get louder together. you might notice the same subject arriving from every side.',
  },
  trine: {
    label: 'why it feels easy',
    text: 'a trine is two planets 120° apart, which is the friendliest angle. things tend to go smoothly without much effort from you.',
  },
  sextile: {
    label: "why it's easy to miss",
    text: "a sextile is two planets 60° apart, a small opening that's easy to walk past. you might notice a chance that only helps if you take it.",
  },
};

type Phase = 'approaching' | 'peak' | 'separating';

const LASTS: Record<Phase, string> = {
  approaching: "it hasn't peaked yet, so this may build over the next few days before it eases.",
  peak: "it's exact today, so this is the loudest it gets.",
  separating: 'it has passed its peak and is easing, though what it stirred up may take a while to clear.',
};

const EASY = new Set(['trine', 'sextile']);

export interface PlainTransit {
  whatItIs: string;
  whyLabel: string;
  why: string;
  howLong: string;
}

/**
 * Plain-language explanation for a transit, or null if any piece is unknown so
 * the caller can fall back to the older wording. The phase is read from `exact`
 * and from the phase sentence an older cached reading carries, since only the
 * sentence was ever stored.
 */
export function explainTransit(args: {
  transitingPlanet: string;
  natalPlanet: string;
  aspectType: string;
  exact?: boolean;
  phaseMeaning?: string;
}): PlainTransit | null {
  const moving = MOVING[args.transitingPlanet];
  const yours = YOURS[args.natalPlanet];
  const aspect = args.aspectType?.toLowerCase();
  const why = WHY[aspect];
  if (!moving || !yours || !why) return null;

  const said = (args.phaseMeaning ?? '').toLowerCase();
  const phase: Phase =
    args.exact || /exact today|peak/.test(said)
      ? 'peak'
      : /passed|easing|separat/.test(said)
      ? 'separating'
      : 'approaching';

  let howLong = LASTS[phase];
  if (phase === 'peak') {
    howLong += EASY.has(aspect)
      ? ' days like this are easy to hurry past.'
      : ' it tends to ease after today.';
  }

  return {
    whatItIs: `${moving} ${yours} ${CONTACT[aspect]}`,
    whyLabel: why.label,
    why: why.text,
    howLong,
  };
}
