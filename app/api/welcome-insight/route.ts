import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { sanitizeText, isValidDate } from '@/lib/utils/validate';
import { calculateNatalChart } from '@/lib/utils/astrology-calculator';

import { humanise } from '@/lib/utils/humanise';
// ── 27 Nakshatras ─────────────────────────────────────────────────────────────
// In Vedic astrology the janma nakshatra (birth lunar mansion) is the most
// personal marker — more specific than rashi, unique to a ~1 day window.
// Each has a ruling planet (whose dasha themes colour the soul's path) and a
// core quality that shapes how the person experiences and moves through life.
const NAKSHATRAS = [
  { name: 'ashwini',          planet: 'ketu',    quality: 'swift and instinctive — moves before thinking, heals by doing, carries more under the surface than the speed suggests' },
  { name: 'bharani',          planet: 'venus',   quality: 'holds the full weight of experience — transformation through intensity, nothing is picked up or put down lightly' },
  { name: 'krittika',         planet: 'sun',     quality: 'cuts to what is true — high standards, a refiner not a collector, finds it hard to settle for less than the real thing' },
  { name: 'rohini',           planet: 'moon',    quality: 'deep sensory richness — creativity that needs fertile ground, drawn to beauty and rootedness, slow to leave what it loves' },
  { name: 'mrigashira',       planet: 'mars',    quality: 'perpetual seeking — always searching, never quite settled, finds meaning in the pursuit itself rather than the arrival' },
  { name: 'ardra',            planet: 'rahu',    quality: 'storm and renewal — intense emotional depth, things break down so something truer can emerge, not comfortable in stillness' },
  { name: 'punarvasu',        planet: 'jupiter', quality: 'return to light — cycles of loss and recovery, an inner resilience that keeps reconstituting itself after being scattered' },
  { name: 'pushya',           planet: 'saturn',  quality: 'nourishes everything it touches — carries others as a form of meaning, sometimes forgets to carry itself' },
  { name: 'ashlesha',         planet: 'mercury', quality: 'penetrating insight — sees through surfaces, holds on, wisdom earned through pressure rather than ease' },
  { name: 'magha',            planet: 'ketu',    quality: 'ancestral weight and authority — carries the past, leads from lineage, pride as both gift and burden' },
  { name: 'purva phalguni',   planet: 'venus',   quality: 'rest and creative pleasure — needs beauty and ease to function, generosity that comes from genuine fullness' },
  { name: 'uttara phalguni',  planet: 'sun',     quality: 'service and steadiness — takes on responsibility after the joy, builds things designed to last' },
  { name: 'hasta',            planet: 'moon',    quality: 'precise and crafted — skill in the hands and the mind, attention to detail that approaches perfectionism' },
  { name: 'chitra',           planet: 'mars',    quality: 'brilliance and craft — makes things beautiful and meaningful, becomes restless without something to build or shape' },
  { name: 'swati',            planet: 'rahu',    quality: 'independent and adaptive — bends without breaking, balance as an ongoing practice, needs space to think clearly' },
  { name: 'vishakha',         planet: 'jupiter', quality: 'driven by purpose — once the goal is set, everything else becomes noise; intensity in pursuit, difficulty letting go mid-path' },
  { name: 'anuradha',         planet: 'saturn',  quality: 'devotion and loyalty — goes all the way in, carries the weight of relationships as a form of meaning, slow to leave' },
  { name: 'jyeshtha',         planet: 'mercury', quality: 'protective elder energy — takes charge, holds others up, sometimes at great personal cost and without asking for help' },
  { name: 'mula',             planet: 'ketu',    quality: 'pulled towards roots and dissolution — not satisfied until reaching the origin of things, unafraid of what others avoid' },
  { name: 'purva ashadha',    planet: 'venus',   quality: 'fierce and undefeated — internal strength that does not advertise itself, moves with quiet conviction' },
  { name: 'uttara ashadha',   planet: 'sun',     quality: 'quiet permanence — builds slowly and lasts long, values what endures over what impresses, principled to a fault' },
  { name: 'shravana',         planet: 'moon',    quality: 'listens before it speaks — processes the world by receiving it, hears what others miss, needs to digest before responding' },
  { name: 'dhanishtha',       planet: 'mars',    quality: 'rhythm and abundance — moves between worlds easily, gathers and gives in equal measure, a certain restless vitality' },
  { name: 'shatabhisha',      planet: 'rahu',    quality: 'healing through solitude — needs space to understand things, carries a quiet depth that is not always easy to access' },
  { name: 'purva bhadrapada', planet: 'jupiter', quality: 'fire beneath the surface — intense inner life, transformation through heat, not easily read by the people around them' },
  { name: 'uttara bhadrapada',planet: 'saturn',  quality: 'still depths — slow to act but thorough, carries something ancient, not easily shaken by what rattles everyone else' },
  { name: 'revati',           planet: 'mercury', quality: 'compassionate completion — feels everything, carries others across thresholds, sometimes loses the boundary between self and world' },
];

// What the ruling planet's dasha period tends to call forward
const DASHA_THEMES: Record<string, string> = {
  ketu:    'a calling to release attachment and look inward — not what to gain but what to let go',
  venus:   'a pull towards beauty, connection, and the pleasure of being alive — and what that costs',
  sun:     'a push to stand in one\'s own authority — not borrowed, not performed',
  moon:    'a period of emotional learning — what the feelings are actually pointing to',
  mars:    'a drive towards action and will — what is worth fighting for, what isn\'t',
  rahu:    'an expansion into unfamiliar territory — desire as a teacher, restlessness as a signal',
  jupiter: 'a broadening of meaning and worldview — what is believed and why',
  saturn:  'a long slow building — patience and discipline over quick results',
  mercury: 'a sharpening of the mind and voice — what needs to be said, learned, or named',
};

// Vedic moon rashi (janma rashi) qualities — in Jyotish the moon sign is the
// primary identity marker, not the sun sign
const MOON_RASHI_QUALITIES: Record<string, string> = {
  aries:       'emotionally quick to fire and quick to recover — processes by moving, not by sitting still',
  taurus:      'needs solid ground — change shakes it harder than it shows, slow to trust but deep once it does',
  gemini:      'processes feeling through words and ideas — needs to talk through it to understand what it actually feels',
  cancer:      'carries emotion that goes back further than this lifetime — absorbs, stores, feels for everyone',
  leo:         'needs to be seen when it\'s soft, not just when it\'s shining — emotional generosity that can burn itself out',
  virgo:       'tries to organise feelings like problems to solve — some of them refuse to be organised',
  libra:       'feels through the people around it until it\'s lost track of what is actually its own',
  scorpio:     'all the way in or all the way shut — emotional intensity without much middle ground',
  sagittarius: 'needs space around its feelings — too much closeness starts to feel like confinement',
  capricorn:   'keeps vulnerability contained — letting it loose feels like losing control, even when it wouldn\'t',
  aquarius:    'needs distance to understand what it feels — raw emotion without analysis is overwhelming',
  pisces:      'absorbs everything around it — other people\'s pain becomes its own before it\'s even noticed',
};

// ── Calculations ───────────────────────────────────────────────────────────────



function getLifePathNumber(dateStr: string): number {
  const digits = dateStr.replace(/\//g, '').split('').map(Number);
  let sum = digits.reduce((a, d) => a + d, 0);
  while (sum > 9 && sum !== 11 && sum !== 22 && sum !== 33) {
    sum = sum.toString().split('').map(Number).reduce((a, d) => a + d, 0);
  }
  return sum;
}

const LIFE_PATH_NOTES: Record<number, string> = {
  1:  'a path of standing alone in leadership — isolation as the price of autonomy',
  2:  'a path of bridging people — building connection, sometimes at the cost of own voice',
  3:  'a path of expression — things fester when held in, creation as the release valve',
  4:  'a path of building structure — carries the weight of being the stable one',
  5:  'a path of freedom — figuring out how to commit without disappearing into the commitment',
  6:  'a path of care — learning where love ends and self-erasure begins',
  7:  'a path of depth — surface anything is genuinely uncomfortable',
  8:  'a path of legacy — real strength and control are not the same thing',
  9:  'a path of release — always finishing cycles before others are ready for them to end',
  11: 'a master path of extreme sensitivity — picks up frequencies others cannot hear',
  22: 'a master path of large-scale building — the vision is clear but bringing it to earth takes everything',
  33: 'a master path of healing presence — people feel it before anything is said',
};

// ── Greeting options mapped to nakshatra ruling planet ─────────────────────────
// The greeting style is chosen to match the energy of the ruling planet
const GREETING_BY_PLANET: Record<string, string[]> = {
  ketu:    ['{name}.', 'oh, {name}.'],
  venus:   ['welcome, {name}.', 'hey, {name}.'],
  sun:     ['hey, {name}.', '{name}.'],
  moon:    ['hey, {name}.', 'oh, {name}.'],
  mars:    ['hey, {name}.', 'there you are, {name}.'],
  rahu:    ['oh, {name}.', 'there you are, {name}.'],
  jupiter: ['welcome, {name}.', 'good, {name}.'],
  saturn:  ['{name}.', 'good, {name}.'],
  mercury: ['hey, {name}.', 'welcome, {name}.'],
};

// ── Route handler ─────────────────────────────────────────────────────────────

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, birthDate, birthTime, birthLocation } = body;

    if (!birthDate || !isValidDate(birthDate)) {
      return NextResponse.json({ error: 'Invalid birth date' }, { status: 400 });
    }

    const sanitizedName     = sanitizeText(name, 100) || 'friend';
    const sanitizedLocation = sanitizeText(birthLocation, 200);
    const sanitizedTime     = sanitizeText(birthTime, 5);
    const hasBirthTime      = sanitizedTime.length >= 4;
    const hasBirthLocation  = sanitizedLocation.length >= 2;

    // Compute the real chart. The janma nakshatra and moon rashi come from the
    // sidereal Moon at birth, not from a date estimate — the Moon's speed varies
    // enough that a fixed-rate approximation lands on the wrong nakshatra more
    // often than the right one.
    const [day, month, year] = birthDate.split('/').map(Number);
    const natalChart = await calculateNatalChart(
      new Date(year, month - 1, day),
      hasBirthTime ? sanitizedTime : undefined,
      hasBirthLocation ? sanitizedLocation : undefined,
    );

    if (!natalChart) {
      return NextResponse.json({ error: 'Could not calculate chart' }, { status: 500 });
    }

    const nakshatra = NAKSHATRAS[natalChart.nakshatra.index];
    const moonRashi = natalChart.moonSign;
    const lifePath  = getLifePathNumber(birthDate);

    // Pick a greeting candidate set for this nakshatra's ruling planet
    const greetingOptions = GREETING_BY_PLANET[nakshatra.planet] ?? ['{name}.'];
    const greetingHint = greetingOptions.map(g => g.replace('{name}', sanitizedName)).join(' / ');

    // nakshatraCertain is false only when no birth time was given AND the Moon
    // crossed a nakshatra boundary that day — so "no birth time" does not
    // automatically mean "uncertain".
    const dataNote = hasBirthTime && hasBirthLocation
      ? `full Jyotish context (date, time, location) — janma nakshatra, moon rashi and lagna all exact`
      : hasBirthTime
      ? `birth time given — janma nakshatra and moon rashi exact; lagna approximate without location`
      : natalChart.nakshatraCertain
      ? `no birth time, but the Moon stayed in one nakshatra all that day — janma nakshatra and moon rashi are still exact; no lagna`
      : `no birth time, and the Moon changed nakshatra that day — treat the janma nakshatra as the likelier of two; no lagna`;

    const apiKey = process.env.SLOW_GARDEN_ANTHROPIC_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
    }

    const anthropic = new Anthropic({ apiKey });

    // Variety levers: left alone, every welcome opens on the same few phrases and
    // closes on the same gesture. Each call draws a different mix.
    const OPENERS = [
      "there's", 'something in', 'a lot of what', 'for someone', 'in people with', 'what shows up',
      'the pattern', 'most of what', 'some of', 'this kind of', 'an old habit of', 'the part that',
      'it tends to be', 'underneath the', 'a certain', 'whatever it is that',
    ];
    const CLOSERS = [
      'a plain, almost offhand nod to the card waiting',
      'a small practical remark about starting now',
      'a short observation about the day itself, with the card implied',
      'something about how little needs to happen next',
      'an open-ended half-sentence feel, finishing on the card',
    ];
    const IMAGE_POOLS = [
      'rooms and thresholds', 'weather and light', 'kitchens and food', 'water and tides',
      'cloth and mending', 'gardens and soil', 'streets and travel', 'no imagery, only plain statement',
    ];
    const pickMany = <T,>(xs: T[], n: number): T[] => [...xs].sort(() => Math.random() - 0.5).slice(0, n);
    const openerHint = pickMany(OPENERS, 4).map(o => `"${o}"`).join(', ');
    const closerHint = CLOSERS[Math.floor(Math.random() * CLOSERS.length)];
    const imageHint = IMAGE_POOLS[Math.floor(Math.random() * IMAGE_POOLS.length)];

    const prompt = `You write the welcome message for Slow Garden, a tarot app grounded in Vedic astrology (Jyotish). Someone has just entered their birth details for the first time. This is what they read first — a brief, personal reflection that shows their chart has actually been considered, and opens toward their first card draw.

This app uses Jyotish, not Western astrology. That means:
- The janma nakshatra (birth lunar mansion) is the most personal and distinctive marker — let it carry most of the message
- The janma rashi (moon sign in Jyotish) is the primary identity marker — more important than the sun sign
- Do NOT write about sun sign energy as the main thing — the nakshatra and moon rashi say more
- The ruling planet of the nakshatra colours what the soul is being asked to work with

Voice (non-negotiable):
- Entirely lowercase, no em dashes, no exclamation marks
- British English spelling throughout: realise, recognise, colour, honour, favour, centre, behaviour, practise (verb), towards, grey, judgement. Never the American forms
- Perceptive friend who just looked at the chart — warm and specific, not practitioner-speak
- Begin with this greeting (choose the one that best fits the nakshatra energy): ${greetingHint}
- After the greeting: 3 sentences only. Each must open with a different word. No sentence after the greeting may start with "you"
- For this one, choose your sentence openers from these, and do not reuse any: ${openerHint}
- Be specific to the actual placements — not generic. The nakshatra quality is the anchor
- Final sentence: 5-8 words. Its job is ${closerHint}, said plainly, never as an instruction
- If you use any image at all, take it from this pool and use only one: ${imageHint}
- No nakshatra name, no rashi name, no planet name — describe the quality, embody the concept
- No: "journey", "navigate", "embrace", "explore", "tap into", "delve", "unpack", "honour", "karma", "dharma", "resonate", "lean into", "hold space", "sit with", "invite", "nudge", "something in you", "a part of you", "gentle", "gently", "quietly" (the word, not the mood), "soft", "space" as a noun for feelings
- No questions

Do not write like a language model. These are the tells:
- No "it's not X, it's Y" or "not just X but Y"
- No groups of three. With only three sentences to work with, a triad inside one of them makes the whole message a list
- No "at its core", "the real question is", "what really matters", "fundamentally", "the truth is"
- No sayings of the form "X is the Y of Z"
- No "stands as", "serves as", "represents", "is a testament to". Use is, has, does
- No trailing -ing clauses commenting on the sentence they hang off: "revealing...", "reflecting...", "speaking to..."
- Never these words: profound, vibrant, rich, crucial, key, landscape, tapestry, interplay, intricate, testament, deeply, truly, simply, powerful
- Do not flatter them. This is a description, not a compliment, and a stranger telling someone they are special reads as a horoscope in a newspaper
- Vary the sentence lengths. Three sentences of the same length is the giveaway
- The qualities you are given as source material use em dashes. That is the author's punctuation, not yours. Do not copy it

About this person:
Name: ${sanitizedName}
Janma nakshatra quality: ${nakshatra.quality}
Nakshatra ruling planet theme: ${DASHA_THEMES[nakshatra.planet]}
Janma rashi (moon sign) quality: ${MOON_RASHI_QUALITIES[moonRashi]}
Life path: ${LIFE_PATH_NOTES[lifePath] ?? lifePath}
Data: ${dataNote}

Write: greeting line + exactly 3 sentences. Total ~65-80 words. Nothing else.`;

    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 220,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = message.content[0];
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response type' }, { status: 500 });
    }

    // See lib/utils/humanise.ts: the prompt asks for no em dashes, and this is
    // the part that does not depend on being obeyed.
    return NextResponse.json({ message: humanise(content.text) });
  } catch (error) {
    console.error('Welcome insight error:', error);
    return NextResponse.json({ error: 'Failed to generate welcome message' }, { status: 500 });
  }
}
