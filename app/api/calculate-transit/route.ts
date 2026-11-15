import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import {
  calculateNatalChart, calculateActiveTransits, getDominantTransit, grahaPositionsAt, getRetrogradePlanets,
} from '@/lib/utils/astrology-calculator';
import { buildVedicContext, describeVedicContext } from '@/lib/utils/vedic-signal';
import { cardPlanetAffinity } from '@/lib/data/insight-structure-templates';
import { getCardArchetype, cardArchetypes } from '@/lib/data/card-archetypes';
import { sanitizeText, isValidDate, isValidTime } from '@/lib/utils/validate';
import { skyFor } from '@/lib/utils/sky';
import { zoneForCoordinates } from '@/lib/utils/birth-instant';


import { humaniseFields } from '@/lib/utils/humanise';
const HOUSE_THEMES: Record<number, string> = {
  1: 'identity and how you show up',
  2: 'self-worth and resources',
  3: 'voice, communication, and learning',
  4: 'home, roots, and foundation',
  5: 'creativity, play, and joy',
  6: 'work, health, and daily life',
  7: 'relationships and partnerships',
  8: 'transformation, intimacy, and shared power',
  9: 'beliefs, meaning, and expansion',
  10: 'career, legacy, and public life',
  11: 'community, future, and belonging',
  12: 'inner world, patterns, and solitude',
};

/**
 * The sky where the reader is.
 *
 * `here` comes from the browser and is therefore untrusted: anything that isn't
 * a real coordinate pair is treated as absent, which costs the two sun rows and
 * nothing else. The zone is derived from the same coordinates so the times are
 * printed on the reader's own clock.
 */
function readerSky(at: Date, here: unknown) {
  const coords = here as { latitude?: unknown; longitude?: unknown } | null | undefined;
  const latitude = Number(coords?.latitude);
  const longitude = Number(coords?.longitude);

  const usable =
    Number.isFinite(latitude) && Number.isFinite(longitude) &&
    Math.abs(latitude) <= 90 && Math.abs(longitude) <= 180 &&
    !(latitude === 0 && longitude === 0);

  // Moon phase needs no location, so an unlocated reader still gets that row.
  if (!usable) return skyFor(at, 0, 0, null);

  return skyFor(at, latitude, longitude, zoneForCoordinates(latitude, longitude));
}

interface ClaudeInsight {
  keyPhrase: string;
  insight: string;
  action: string;
  memoryNote: string;
}

/**
 * Keeps whole sentences up to a word budget. The first sentence is always kept,
 * even if it alone is over, because a clipped half-sentence reads worse than a
 * long one. Anything after the budget is dropped.
 */
function clipToSentences(text: string, maxWords: number): string {
  const sentences = text.trim().match(/[^.!?]+[.!?]+(?:\s|$)|[^.!?]+$/g) ?? [text];
  const kept: string[] = [];
  let words = 0;
  for (const sentence of sentences) {
    const n = sentence.trim().split(/\s+/).filter(Boolean).length;
    if (kept.length > 0 && words + n > maxWords) break;
    kept.push(sentence.trim());
    words += n;
  }
  return kept.join(' ');
}

/** Roughly how far each planet travels in a day, in degrees. Enough to turn an orb into "about N days". */
const DAILY_MOTION: Record<string, number> = {
  moon: 13, sun: 1, mercury: 1.2, venus: 1.1, mars: 0.5,
  jupiter: 0.15, saturn: 0.08, uranus: 0.04, neptune: 0.02, pluto: 0.015,
};

/**
 * How close the transit is to exact, in plain words. The dates on a transit are
 * a window around today, so the honest number is the orb: degrees from exact,
 * divided by how fast the planet moves. These are facts about the sky, so naming
 * them is not predicting anything in the reader's life.
 */
function describeTiming(t: { transitingPlanet: string; orb: number; phase: string }): string {
  const speed = DAILY_MOTION[String(t.transitingPlanet).toLowerCase()] ?? 0.5;
  const days = t.orb / speed;
  const past = t.phase === 'separating' || t.phase === 'integration';
  if (t.orb < 0.3 || t.phase === 'peak') return 'at its peak right now, as strong as it gets';
  const span =
    days < 1 ? 'within a day'
    : days < 14 ? `about ${Math.round(days)} day${Math.round(days) === 1 ? '' : 's'}`
    : days < 75 ? `about ${Math.round(days / 7)} weeks`
    : `about ${Math.max(2, Math.round(days / 30))} months`;
  const slow = days >= 75 ? ' (a slow, long-running influence, felt in the background more than in any one day)' : '';
  return (past ? `${span} past its peak and easing` : `${span} from its peak and building`) + slow;
}

async function generateClaudeInsight(
  cardId: string,
  isReversed: boolean,
  transitingPlanet: string,
  natalPlanet: string,
  aspectType: string,
  phase: string,
  house: number,
  memoryNotes: string[],
  recentCards: string[],
  sunSign: string,
  moonSign: string,
  nakshatraName: string,
  hasBirthTime: boolean,
  hasBirthLocation: boolean,
  vedicContext: string,
  timing: string,
  retrogrades: string[],
): Promise<ClaudeInsight | null> {
  const cardArchetype = getCardArchetype(cardId, isReversed);
  if (!cardArchetype) return null;

  const orientation = isReversed ? 'reversed' : 'upright';
  const cardName = cardArchetypes[cardId]?.name || cardId;
  const houseTheme = HOUSE_THEMES[house] || 'life';
  const coreThemes = cardArchetype.coreThemes.join(', ');
  const emotionalTone = cardArchetype.emotionalTone;

  const aspectMeaning: Record<string, string> = {
    square: 'tension and friction demanding action',
    opposition: 'polarity pulling in two directions',
    conjunction: 'energies merging and intensifying',
    trine: 'natural flow and ease',
    sextile: 'opportunity opening up',
  };

  const planetMeaning: Record<string, string> = {
    saturn: 'structure, limits, and what\'s actually real',
    jupiter: 'expansion, meaning, and opportunity',
    uranus: 'sudden change, disruption, and authenticity',
    neptune: 'dissolution, intuition, and what\'s unseen',
    pluto: 'power, transformation, and what can\'t be avoided',
    mars: 'will, action, and urgency',
    sun: 'identity and life force',
    moon: 'emotion and instinct',
    mercury: 'mind and communication',
    venus: 'love and values',
  };

  const phaseMeaning: Record<string, string> = {
    approaching: 'building in intensity',
    peak: 'exact and at full strength right now',
    separating: 'easing but still integrating',
    beginning: 'just starting to form',
    integration: 'settling into you',
  };

  // The action follows the card's own territory, as rules and not as a list: swords are
  // the mind, cups the feelings, wands energy and drive, pentacles the body, money and the
  // house. The model invents the move fresh each time. A fixed pool repeats even when it
  // is drawn at random, so the only random lever left is the medium it is built around.
  const ACTION_TERRITORY: Record<string, string> = {
    swords: 'the mind: thoughts, words, doubts, reasoning, decisions. Play with thinking itself: rename it, argue with it, cut it, order it, say it in a different voice, test it on something outside your head. Paper, voice, a phone and a coin are all fair tools',
    cups: 'feelings and the people around them: mood, closeness, memory, grief, tenderness. Make a feeling physical or shared: give something, taste something, remember something exactly, listen to something, put a feeling somewhere outside yourself',
    wands: 'energy, drive, anger and creativity: starting, spending energy, courage. Make it kinetic or a little reckless: a dare, a mess made on purpose, something tried badly, something started and stopped on a timer',
    pentacles: 'the body, money, food, the house and work: what you can touch and fix. Make it tactile and practical: handle, count, cook, move, clean, buy, mend, carry',
  };
  const suitName = cardId.slice(0, cardId.indexOf('-'));
  const territory =
    ACTION_TERRITORY[suitName] ??
    'whichever of the four territories (mind, feeling, energy, body) the reading is closest to; treat the card as a big life theme and pick the territory that fits it';
  const pick = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];
  const ACTION_MEDIA = [
    'a piece of paper', 'your own voice', 'an object already within reach', 'another person',
    'a timer', 'the phone in your hand', 'your hands', 'a particular place in the room or house',
  ];
  const actionMedium = pick(ACTION_MEDIA);

  // Variety levers. Left alone, the model lands on the same few openings,
  // images and sentence shapes day after day. Each reading gets one angle,
  // one sentence plan and one pool of imagery drawn at random, so two readings
  // of the same card do not read as the same reading.
  const OPENING_ANGLES = [
    'open on something small and physical they may be doing or feeling right now, then bring the card in',
    'open by stating the card\'s pattern flatly as a plain observation, then let the transit complicate it',
    'open on the house area as a place (a room, a doorway, a table), then show what the card and transit are doing there',
    'open on a contradiction they are carrying without having named it',
    'open on the pressure or opening in the transit, then say what exactly it is pressing on',
    'open on the story they probably tell themselves about this, then on the small gap between it and what is happening',
    'open mid-thought, as if continuing something they were already half-saying to themselves',
  ];
  const SENTENCE_PLANS = [
    'three sentences, the middle one the longest',
    'two sentences of roughly equal weight, joined by the logic and not by a conjunction',
    'three sentences, the last one short',
    'two sentences, the second shorter than the first',
    'one plain sentence and then one that runs on a little',
  ];
  const IMAGE_POOLS = [
    'kitchens, food and the small chores around them',
    'weather, light and the time of day',
    'cloth, thread, mending and clothes',
    'water, tides, and things that float or sink',
    'paper, handwriting and the margins of things',
    'gardens, soil and what grows slowly',
    'streets, trains, doorways and thresholds',
    'rooms, furniture and the things on shelves',
    'sound, silence and the hum of a house',
    'no imagery at all, only plain direct statement',
  ];
  const openingAngle = pick(OPENING_ANGLES);
  const sentencePlan = pick(SENTENCE_PLANS);
  const imagePool = pick(IMAGE_POOLS);

  // Build the memory context block if we have history
  let memoryContext = '';
  if (memoryNotes.length > 0 || recentCards.length > 0) {
    memoryContext = `Background on this person. Use it to make the reading specific to them: you may say plainly that a pattern has been showing up ("that is the second cups card this week", "the same worry keeps coming back"). Do not pretend to remember conversations, do not say "as I've noticed", and never quote a note back word for word.

${memoryNotes.length > 0 ? `Recent patterns:\n${memoryNotes.map(n => `- ${n}`).join('\n')}` : ''}
${recentCards.length > 0 ? `\nCards drawn recently: ${recentCards.join(', ')}` : ''}

`;
  }

  const dataNote = !hasBirthTime && !hasBirthLocation
    ? `Birth time and location were not provided. The house and rising sign data is estimated. Weight your insight on the card themes and sun sign, using the transit as general planetary weather rather than a precise personal placement.`
    : !hasBirthTime
    ? `Birth time was not provided. The house position is estimated. Weight the card themes and sun sign heavily; use the transit as supporting context.`
    : !hasBirthLocation
    ? `Birth location was not provided. House cusps are estimated. Use the transit planet energies but treat the house activation lightly.`
    : '';

  const prompt = `${memoryContext}You write the personalised synthesis for a tarot app called Slow Garden. This is the "what this could mean for you" section — the part that makes the reading feel like it was written specifically for this person.

Write it as a tarot reader would say it, sat across a table from this one person, having turned the card over and then looked up at them. It is spoken, direct, and in second person ("you"), the way someone talks out loud when they are looking at you and not at a page: short, specific, a little wry, never ceremonial. The person has already read what the card means on the screen, so do not tell them. Never describe the card, summarise its meaning, or say what it traditionally stands for. Use it only as the angle you are speaking from, one image or one word at most, and spend every other word on them: what this week may be like for them, today, in particular.

The app exists to help people see themselves more clearly, not to tell them what to do or think. Hold up a mirror at the right angle so they can find the thing themselves. Think less therapist, more the friend who says the true thing across the table, plainly, and then passes the bread.

Astrology context: Vedic sidereal zodiac (Lahiri ayanamsa), Whole Sign houses.

Voice (these matter):
- Entirely lowercase, no em dashes
- British English spelling throughout: realise, recognise, colour, honour, favour, centre, behaviour, practise (verb), towards, grey, judgement. Never the American forms
- Sound like a perceptive friend, not a practitioner
- Be specific about the feeling, not about invented events. Name the emotional state exactly, the timing of the transit, and the part of life it is working on in plain words (home, money, friends, work). Never invent a person, a conversation, a message or an incident you have not been told about
- No "journey", "navigate", "embrace", "explore", "tap into", "delve", "unpack", "honour your", "give yourself permission", "notice", "noticing", "landing", "sense of", "lean into", "hold space", "sit with", "sit in", "make space", "invite", "invitation", "nudge", "unfold", "land" (as a verb for ideas), "resonate", "stirring", "shift" and "shifting" used abstractly, "something in you", "a part of you", "the way you"
- Write with a novelist's vocabulary: exact, concrete, a little unexpected. Name the texture of the moment instead of its category (a dull day is threadbare or listless, a mood is brackish or febrile, someone avoiding a thing is skirting it, a feeling that will not shift is a pall or an inertia). Use one or two uncommon words at most, ones a curious reader would still follow, and never stack adjectives. If you are about to write quietly, gently, softly, deeper, tender, space or small, find the more exact word. Do not use the same verb or noun twice in one reading. To say what they might be experiencing, use forms like "you may catch yourself", "it may show up as", "there may be" or "you might find", and vary them
- No questions anywhere in the insight or action (the card already asks them)
- Do not restate or paraphrase the card meaning or anything it says about the card. It is already on screen above this
- Do not explain the transit in general terms — tell them what THIS transit means in THEIR life right now
- You may name their moon sign or nakshatra once, if it sharpens the point. Use only the sidereal values given below, never a western sign

Do not write like a language model. These are the tells:
- No "it's not X, it's Y", "not just X but Y", or any sentence built on a correction
- No groups of three. Two things, or four, or one. A triad is the shape a machine reaches for when it has nothing to add
- No "at its core", "the real question is", "what really matters", "fundamentally", "the truth is". They announce depth instead of having it
- No sayings of the form "X is the Y of Z" — "grief is the language of love" and anything like it
- No "stands as", "serves as", "represents", "marks", "is a testament to". Use is, has, does
- No trailing -ing clauses that comment on the sentence they hang off: "revealing...", "reflecting...", "speaking to...", "highlighting...", "a reminder that..."
- Never these words: version, draft, thread, loop, profound, vibrant, rich, crucial, key, landscape, tapestry, interplay, intricate, testament, deeply, truly, simply, powerful
- Do not end on reassurance or a lift. Stop on the last real observation, even if it sits badly. The discomfort is the point
- Vary the sentence lengths. Do not write three medium sentences in a row
- No one-word or fragment sentences for drama
- The phrases you are given as source material use em dashes. That is the author's punctuation, not yours. Do not copy it

${dataNote ? `Data note: ${dataNote}` : ''}

About this person:
- Janma nakshatra: ${nakshatraName} — fixed at birth, the deepest layer of how they are built
- Moon sign / janma rashi (sidereal): ${moonSign} — in Jyotish this is the primary sign, how they actually feel and process
- Sun sign (sidereal): ${sunSign} — secondary here; the outward-facing self, not the core
- Card drawn: ${cardName} (${orientation})
- Card themes: ${coreThemes}
- Emotional tone of this card: ${emotionalTone}

What's happening in their chart right now.

This is read the Jyotish way, in layers that move at different speeds: the dasha
is the chapter they are years into, the gochara is where the grahas are sitting
relative to their birth Moon, and the drishti is what has its attention on what
today. The chapter is the backdrop; the strongest thread is the foreground. Let
the two speak to each other — a small daily pressure inside a long chapter reads
very differently from the same pressure inside a different one.

${vedicContext}

Supporting western-style reading of the same sky, use only if it adds something:
- ${transitingPlanet} ${aspectType} ${natalPlanet}, ${phaseMeaning[phase] || phase}
- landing in the ${house}th house: ${houseTheme}

Specifics you may name, because they are plain facts about the sky:
- Timing of this transit: ${timing}
- Life area it is working on: ${houseTheme}
${retrogrades.length ? `- Retrograde right now: ${retrogrades.join(', ')} (revisiting rather than advancing)\n` : ''}
For this reading only, so it does not sound like yesterday's:
- Angle: ${openingAngle}
- Sentence plan for "insight": ${sentencePlan}
- If you use an image at all, take it from this pool and use only one: ${imagePool}
- Keep to the plan above even if another shape feels more natural. Naturalness is how the repeats get in

Write a JSON object with exactly these four fields:

Length: this is read on a phone and a desktop in a few seconds, so be specific and brief. Every sentence must carry a concrete feeling or fact. Cut anything that only sounds wise.

"keyPhrase": 3-5 words. The headline for this specific moment, something that could only come from this card and this transit. Not a platitude. Lowercase.

"insight": at most 60 words, two or three sentences, in everyday words. Speak to the feeling that the chart and the card point at together, and say what it could mean for them today. The reader must be able to say in one sentence what it told them. Order: first, name plainly the emotional weather they may be in (a mood, a pressure, a restlessness, a softness, with its quality: what it is like to be inside it). Second, say why it is this strong or this stuck, using the transit in plain words with its timing. Third, say what it could mean: what the feeling is asking for, or what it is not a sign of. Use "may" and "might", never "will". Do not use a metaphor as the main content. At most one image in the whole reading, and only after the plain statement. Never build the reading on a single repeated word or metaphor: use each noun once. No advice, no questions.

"action": one sentence, at most 25 words. Something to do or try today, invented fresh for this reading, in the territory of this card: ${territory}. Treat it as a small experiment or a game, the kind of thing that makes the reader smile or raise an eyebrow, and that they can do in under ten minutes with what is within reach. Make it oddly precise (a number, a duration, a particular object). It must fit the feeling the insight named. This time, build it around: ${actionMedium}. If the first idea that comes to mind is a common one, throw it out and take a stranger one. Do not write anything that sounds like wellness advice (deep breathing, journaling, meditating, gratitude lists, drinking water, taking a walk). A body move is fine only if it has a twist you would not find on a wellness site.
Do not open with \"notice\". Vary how the action begins, and never start it with a body part.

"memoryNote": One sentence, lowercase. An honest private note about what's active in this person's inner life right now — written as a theme, not an event. No card names, no planet names, no "they" or "you". Pattern language only ("tension between X and Y" or "themes of A surfacing alongside B").

Return only valid JSON, no markdown, no extra text.`;

  const apiKey = process.env.SLOW_GARDEN_ANTHROPIC_KEY;
  if (!apiKey) {
    console.error('SLOW_GARDEN_ANTHROPIC_KEY not set');
    return null;
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const message = await anthropic.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 350,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    const content = message.content[0];
    if (content.type !== 'text') return null;

    // Strip markdown code fences if Claude wrapped the JSON
    const rawText = content.text.trim().replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(rawText) as ClaudeInsight;

    // Basic validation
    if (!parsed.keyPhrase || !parsed.insight || !parsed.action) return null;

    // The prompt asks for no em dashes and mostly gets its way. This is the
    // part that does not depend on being obeyed — see lib/utils/humanise.ts.
    // Length is the other thing the prompt asks for and cannot guarantee, so
    // it is enforced here too: whole sentences only, never cut mid-thought.
    parsed.insight = clipToSentences(parsed.insight, 65);
    parsed.action = clipToSentences(parsed.action, 30);
    parsed.keyPhrase = parsed.keyPhrase.split(/\s+/).slice(0, 6).join(' ');

    return humaniseFields(parsed);
  } catch (error) {
    console.error('Claude insight generation failed:', error);
    return null;
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { birthDate, birthTime, birthLocation, seed, cardId, isReversed, memoryNotes, recentCards, here } = body;

    if (!birthDate || !isValidDate(birthDate)) {
      return NextResponse.json(
        { error: 'Invalid birth date' },
        { status: 400 }
      );
    }

    const sanitizedBirthTime = birthTime ? sanitizeText(birthTime, 5) : null;
    if (sanitizedBirthTime && !isValidTime(sanitizedBirthTime)) {
      return NextResponse.json({ error: 'Invalid birth time' }, { status: 400 });
    }

    const sanitizedLocation = sanitizeText(birthLocation, 200);
    const sanitizedCardId = sanitizeText(cardId, 50);
    const sanitizedMemoryNotes = Array.isArray(memoryNotes)
      ? memoryNotes.slice(0, 10).map((n: unknown) => sanitizeText(n, 200))
      : [];
    const sanitizedRecentCards = Array.isArray(recentCards)
      ? recentCards.slice(0, 10).map((c: unknown) => sanitizeText(c, 50))
      : [];

    // Parse birth date
    const [day, month, year] = birthDate.split('/').map(Number);
    const parsedBirthDate = new Date(year, month - 1, day);

    // Calculate natal chart (positions are now sidereal — Lahiri ayanamsa applied)
    const natalChart = await calculateNatalChart(
      parsedBirthDate,
      sanitizedBirthTime || undefined,
      sanitizedLocation || undefined
    );

    if (!natalChart) {
      return NextResponse.json(
        { error: 'Failed to calculate natal chart' },
        { status: 500 }
      );
    }

    // Calculate current active transits
    const activeTransits = await calculateActiveTransits(natalChart);

    // Get the most relevant transit for this card (affinity-weighted, seed for tie-breaking)
    const dominantTransit = getDominantTransit(activeTransits, seed, sanitizedCardId);

    if (!dominantTransit) {
      return NextResponse.json(
        { error: 'No active transits found' },
        { status: 404 }
      );
    }

    // Use the sidereal sun sign from the calculated natal chart
    // (natalChart.sunSign is already Lahiri sidereal after the calculator update)
    const sunSign = natalChart.sunSign;

    // The Jyotish read: dasha, gochara, drishti, dignity. This is what the
    // reading leads on — the western transit above is kept as a supporting
    // detail rather than the whole story.
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const vedic = buildVedicContext(
      natalChart,
      grahaPositionsAt(now),
      grahaPositionsAt(tomorrow),
      now,
      typeof seed === 'number' ? seed : 0.5,
      cardPlanetAffinity[sanitizedCardId]?.planets ?? [],
    );
    const vedicContext = describeVedicContext(vedic, natalChart);

    // Generate Claude insight (with memory context if available)
    const claudeInsight = await generateClaudeInsight(
      sanitizedCardId,
      isReversed || false,
      dominantTransit.transitingPlanet,
      dominantTransit.natalPlanet,
      dominantTransit.aspect,
      dominantTransit.phase,
      dominantTransit.house,
      sanitizedMemoryNotes,
      sanitizedRecentCards,
      sunSign,
      natalChart.moonSign,
      natalChart.nakshatra.name,
      !!sanitizedBirthTime,
      !!sanitizedLocation,
      vedicContext,
      describeTiming(dominantTransit),
      getRetrogradePlanets(now),
    );

    return NextResponse.json({
      dominantTransit,
      allTransits: activeTransits,
      retrogradePlanets: getRetrogradePlanets(now),
      claudeInsight,
      // The reading page's margin column.
      //
      // Sunrise and sunset are for where the READER is, not where their chart
      // was cast — the sun came up over wherever they are this morning. The
      // client sends those coordinates when it has them; without them the rows
      // are dropped rather than answered with a sunrise somewhere else.
      sky: readerSky(now, here),
      vedic: {
        mahadasha: vedic.dasha?.maha.lord ?? null,
        antardasha: vedic.dasha?.antar.lord ?? null,
        lead: vedic.lead ? { kind: vedic.lead.kind, actor: vedic.lead.actor } : null,
        sadeSati: vedic.sadeSati,
      },
    });
  } catch (error) {
    console.error('Transit calculation error:', error);
    return NextResponse.json(
      { error: 'Failed to calculate transit' },
      { status: 500 }
    );
  }
}
