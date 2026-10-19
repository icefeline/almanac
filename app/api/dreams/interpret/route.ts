import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export type ReadingLength = 'short' | 'medium' | 'long';

interface InterpretRequest {
  text: string;
  readingLength?: ReadingLength;
  symbolCount?: number;
  /** earlier dreams, newest first. optional; nothing in the app sends these yet. */
  pastDreams?: string[];
}

interface Action {
  kind: 'lucky' | 'think';
  title: string;
  text: string;
}

interface Lens {
  name: string;
  reading: string;
}

interface InterpretResult {
  arc: string;
  tension: { central: string; odd: string };
  lenses: Lens[];
  recurring: string;
  synthesis: string;
  actions: Action[];
  symbols: { name: string; note: string }[];
  /** set only when the dream involves abuse or assault; everything else is then empty */
  care: string;
}

const LENS_COUNT: Record<ReadingLength, number> = {
  short: 2,
  medium: 3,
  long: 3,
};

const MAX_PAST_DREAMS = 5;

/**
 * Reads the dream as a story first and then through named traditions, each
 * attributed, rather than listing themes. Lowercase and British spelling are
 * stated explicitly rather than left to house style, since this is the only
 * place in slow-garden that writes prose without a human editing it afterwards.
 */
function buildSystemPrompt(lenses: number, max: number): string {
  return (
    'You interpret dreams as a careful, well-read reader, not an oracle. Treat the dream as a story with a shape, ' +
    'then read it through other ways of seeing, each attributed and each allowed to be partial. Register: ' +
    'plain, curious and a little playful, a widely read friend rather than a clinician. You may enjoy the ' +
    'strange and the folkloric, but you never claim it as fact. No reassurance padding. Never claim ' +
    'certainty. Never predict events, deaths or illness, including when a folk or occult source would. Never say "you will", "you should" or "you need to". ' +
    'Write the way a perceptive friend talks across a table: short sentences, everyday words, concrete ' +
    'things, and address the person directly as "you" (never "the dreamer"). Avoid abstract nouns and ' +
    'academic phrasing such as "the effort of separation", "maternal sphere", "psychic" or "liminal"; say the ' +
    'plain thing instead. A reader should never need to reread a sentence. No markdown, no headings, no lists, no em ' +
    'dashes. Write entirely in lowercase, including the start of sentences. Use British English spelling ' +
    'throughout.\n\n' +
    'Work in this order.\n' +
    '1. arc: state the dream\'s arc in one sentence: what the dreamer wanted or faced, what got in the way, how it ended.\n' +
    '2. tension: find the central tension and the one detail that does not fit. Build everything after this around those two.\n' +
    '3. lenses: choose up to ' +
    lenses +
    ' lenses, and choose them the way a well-read, slightly mischievous friend would: the ones that best ' +
    'illuminate what THIS dream is doing for THIS person, judged from its own details, setting, images and ' +
    'the way it is told. No lens is a default and there is no fixed list. Range freely and mix kinds: a ' +
    'psychological school or sleep science; a religious or folk dream tradition from anywhere in the world; ' +
    'the cultural history of an image (what a house, a train, a river, a wedding or a tooth has meant in ' +
    'different places and periods); symbolism from myth, fairy tale, art and literature; and the woo: dream ' +
    'dictionaries, omen lore and superstition, astrology and planetary correspondences, numerology, tarot ' +
    '(the dream as a card it resembles, which suits this app), animal and plant lore, alchemy, spirit and ' +
    'ancestor traditions. At least one lens should be culturally or symbolically grounded rather than ' +
    'psychological, and when it fits, at least one should be properly woo, offered with a wink and framed as ' +
    '"in folk belief" or "tarot would say", never as fact and never as a prediction. Prefer lenses whose ' +
    'premises pull in different directions, and drop one the moment it repeats another. If the dream\'s ' +
    'setting points to a specific culture or place, let that weigh in, but never assume the dreamer\'s ' +
    'background from a name or a word. Do not force a tradition onto a dream it does not fit. For ' +
    'each lens return {"name": the tradition in a few words, "reading": 3-4 sentences that open with that ' +
    'lens\'s premise about what dreams are, attributed to the tradition or thinker, and then read the whole ' +
    'dream through it}. ' +
    'If you are unsure what a tradition actually says, say so ' +
    'inside the reading instead of inventing it. Present traditions as traditions, never as settled fact.\n' +
    '4. recurring: only if earlier dreams are supplied in the message, name any recurring motif and how it has ' +
    'changed, in two or three sentences. Otherwise return an empty string.\n' +
    '5. synthesis: this is the part the whole reading is for, so give it weight. Write about ' +
    '140 to 180 words in one or two short paragraphs separated by \\n. It must land like a small jolt of recognition, not a ' +
    'summary. Build it in four moves, in plain words and without labelling them. First, commit to one ' +
    'specific, slightly daring claim about what the dream is really about, resting on the central tension, the sentence the person might ' +
    'repeat to a friend. Second, show what in the dream proves it, using the odd detail. Third, say what ' +
    'kind of real situation this probably sits on top of (a decision they are circling, a person they are ' +
    'still carrying, a role they have outgrown, something they are waiting to be allowed to do), naming two ' +
    'or three concrete possibilities with "maybe" and "if" so they can recognise their own, since you do not ' +
    'know their life. Fourth, end on what changes if this is true: how it could alter the way they move ' +
    'through today, what they might notice, say or stop doing, written as a possibility and not an order. ' +
    'Let your voice vary from dream to dream instead of ' +
    'following one template: you may open with \"this dream reads as\", or with the claim itself, or with a ' +
    'brief human reaction first. When a dream is genuinely rare, funny, tender, eerie or unusually vivid, react ' +
    'the way a person would, in a few words ("oh, this is a good one", "huh, the boat is doing a lot of work ' +
    'here", "that detail made me smile"), then get to the point. Do this only when it is true of this dream, ' +
    'perhaps one reading in three, and never as a tic or with exclamation marks piled up. Match the mood of ' +
    'the dream: lighter for a funny one, gentler for a sad one. Do not hedge inside the first claim. Do not decorate it with metaphor. Do not repeat the lens ' +
    'readings.\n' +
    '7. actions: exactly 3 things for the dreamer to take away, at least one of kind "lucky" and at least one ' +
    'of kind "think". Each is {"kind": "lucky" or "think", "title": two or three words, a label, "text": one ' +
    'or two short sentences}. "lucky" ones are small, concrete, charming things to do or carry today that ' +
    'borrow from the folk and woo lenses you used (a colour to wear, a number, a direction to walk, an object ' +
    'to put in a pocket, a small ritual of crossing a threshold) and are framed as luck-lore, never as ' +
    'a promise or a prediction. "think" ones are a question to turn over, rooted in the dreamer\'s own words, ' +
    'quoting or echoing a phrase they used. Never use vague verbs like reflect, explore, sit with, honour or ' +
    'consider, and no therapy referrals.\n' +
    '8. symbols: at most ' +
    max +
    ' entries of {"name": short label, "note": one sentence on what it appears to be doing in THIS dream}, ' +
    'drawn from the dream itself.\n\n' +
    'If the dream involves abuse or assault, lead with care and skip symbol decoding and the lenses: return ' +
    '{"care": two or three gentle sentences that acknowledge it and say that how it felt matters more than any ' +
    'reading, "arc": "", "tension": {"central": "", "odd": ""}, "lenses": [], "recurring": "", "synthesis": "", ' +
    '"actions": [], "symbols": []}.\n\n' +
    'Return ONLY valid JSON, no code fence. Inside any string value never use double quotation marks (use ' +
    'single quotes for quoted words) and never use a raw line break; use \\n where a break is needed. Keys: "arc", "tension" ({"central": string, "odd": ' +
    'string}), "lenses", "recurring", "synthesis", "actions", "symbols", "care" (an empty string ' +
    'unless the abuse rule applies).'
  );
}

function str(value: unknown): string {
  return typeof value === 'string' ? value.trim() : '';
}

export async function POST(request: Request) {
  const apiKey = process.env.SLOW_GARDEN_ANTHROPIC_KEY;
  if (!apiKey) {
    console.error('SLOW_GARDEN_ANTHROPIC_KEY not set');
    return NextResponse.json({ error: 'reading didn’t come back. try again.' }, { status: 500 });
  }

  let body: InterpretRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'not enough to go on. a few sentences.' }, { status: 400 });
  }

  const text = typeof body.text === 'string' ? body.text.trim() : '';
  if (text.length < 12) {
    return NextResponse.json({ error: 'not enough to go on. a few sentences.' }, { status: 400 });
  }

  const readingLength: ReadingLength = body.readingLength ?? 'medium';
  const lensCount = LENS_COUNT[readingLength] ?? LENS_COUNT.medium;
  const max = typeof body.symbolCount === 'number' ? body.symbolCount : 4;

  const pastDreams = Array.isArray(body.pastDreams)
    ? body.pastDreams.filter((d): d is string => typeof d === 'string' && d.trim().length > 0).slice(0, MAX_PAST_DREAMS)
    : [];

  let userMessage = 'Dream:\n\n' + text;
  if (pastDreams.length > 0) {
    userMessage +=
      '\n\nEarlier dreams from the same person, newest first:\n\n' +
      pastDreams.map((d, i) => `${i + 1}. ${d.trim()}`).join('\n\n');
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    // the model occasionally returns malformed JSON; one retry clears almost all of it
    let data: Record<string, any> | null = null;
    let raw = '';
    for (let attempt = 0; attempt < 2 && !data; attempt++) {
      const response = await anthropic.messages.create({
        model: 'claude-sonnet-5-5',
        max_tokens: 3500,
        system: buildSystemPrompt(lensCount, max),
        messages: [{ role: 'user', content: userMessage }],
      });
      raw = response.content.map((block) => (block.type === 'text' ? block.text : '')).join('');
      const match = raw.match(/\{[\s\S]*\}/);
      try {
        data = JSON.parse(match ? match[0] : raw);
      } catch {
        console.error('Dream interpretation returned malformed JSON, attempt', attempt + 1);
      }
    }
    if (!data) throw new Error('malformed JSON after retry');

    const result: InterpretResult = {
      arc: str(data.arc),
      tension: {
        central: str(data.tension?.central),
        odd: str(data.tension?.odd),
      },
      lenses: Array.isArray(data.lenses)
        ? data.lenses
            .map((l: Record<string, unknown>) => ({ name: str(l?.name), reading: str(l?.reading) }))
            .filter((l: Lens) => l.name && l.reading)
            .slice(0, lensCount)
        : [],
      recurring: pastDreams.length > 0 ? str(data.recurring) : '',
      synthesis: str(data.synthesis),
      actions: Array.isArray(data.actions)
        ? data.actions
            .map((a: Record<string, unknown>) => ({
              kind: (a?.kind === 'think' ? 'think' : 'lucky') as Action['kind'],
              title: str(a?.title),
              text: str(a?.text),
            }))
            .filter((a: Action) => a.title && a.text)
            .slice(0, 3)
        : [],
      symbols: Array.isArray(data.symbols)
        ? data.symbols.filter((s: { name?: unknown }) => s && s.name).slice(0, max)
        : [],
      care: str(data.care),
    };

    if (!result.care && !result.synthesis) {
      return NextResponse.json({ error: 'reading didn’t come back. try again.' }, { status: 502 });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Dream interpretation failed:', error);
    return NextResponse.json({ error: 'reading didn’t come back. try again.' }, { status: 502 });
  }
}
