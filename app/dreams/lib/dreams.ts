/**
 * Dream store for /map. Dreams live in this browser's localStorage only
 * (no database, nothing leaves the machine). Each dream is a note: a date,
 * the text, and an ordered list of themes. Themes are the links: the same
 * theme in two dreams draws a line between them.
 */

export interface Dream {
  id: string;
  date: string; // YYYY-MM-DD
  text: string;
  themes: string[]; // ordered, normalised; order = the "scanpath" through the dream
  sample?: boolean;
  /** The reading from the interpret page, cached so reopening a dream is instant. */
  reading?: {
    reading: string;
    symbols: { name: string; note: string }[];
    actions: { do: string; why: string }[];
  };
}

export const STORAGE_KEY = 'milky.dreams.v1';

/** [[water]] and #water both count as tags. */
export function extractTags(text: string): string[] {
  const out: string[] = [];
  for (const m of text.matchAll(/\[\[([^\]]+)\]\]|#([a-z][a-z-]{1,24})/gi)) {
    out.push(m[1] ?? m[2]);
  }
  return out;
}

export function normaliseThemes(list: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of list) {
    const t = raw.trim().toLowerCase().replace(/\s+/g, ' ');
    if (t && !seen.has(t)) {
      seen.add(t);
      out.push(t);
    }
  }
  return out;
}

/** Placeholder dreams so the map isn't empty on first load. Cleared in one click. */
export const SAMPLES: Dream[] = [
  { id: 's1', date: '2026-10-02', sample: true, text: 'My house, but the rooms keep going. A door I never noticed led to water, still and very deep.', themes: ['house', 'doors', 'water'] },
  { id: 's2', date: '2026-10-09', sample: true, text: 'Running for a train that was already leaving. My phone had no signal and a voice I knew was calling from the platform.', themes: ['arriving late', 'phones', 'voice'] },
  { id: 's3', date: '2026-10-15', sample: true, text: 'Floating over the sea at night with the moon too close. The water was warm. Someone below kept counting.', themes: ['flight', 'water', 'moon', 'counting'] },
  { id: 's4', date: '2026-10-23', sample: true, text: 'Back at school for an exam I had not studied for. The hallway was my old house. The door was locked.', themes: ['exams', 'house', 'doors'] },
  { id: 's5', date: '2026-11-01', sample: true, text: 'A stranger handed me a phone that was already ringing. It was my mother, who died. We talked about the moon.', themes: ['phones', 'the dead', 'moon', 'voice'] },
  { id: 's6', date: '2026-11-11', sample: true, text: 'Stairs inside the ocean. Every step I counted, the water got warmer. At the bottom, a door.', themes: ['stairs', 'water', 'counting', 'doors'] },
];

export function loadDreams(): Dream[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed as Dream[];
    }
  } catch {
    /* private mode / corrupt value: fall through to samples */
  }
  return SAMPLES;
}

export function saveDreams(dreams: Dream[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dreams));
  } catch {
    /* storage unavailable: the map still works for this session */
  }
}

/** Patch one dream in storage (used by the interpret page to cache its reading). */
export function updateDream(id: string, patch: Partial<Dream>): void {
  saveDreams(loadDreams().map((d) => (d.id === id ? { ...d, ...patch } : d)));
}

/** For testing the map at scale: ?stress=36 on /map. Invented dreams of many kinds, never saved. */
export function stressDreams(n: number): Dream[] {
  const kinds: { a: string[]; b: string[] }[] = [
    { a: ['I was flying low over rooftops', 'I floated above a grey sea', 'I stepped off a cliff and did not fall'], b: ['everyone below was waving', 'I could not steer', 'it was calm until the ground rushed up'] },
    { a: ['I was back at school sitting an exam', 'The exam hall was my old kitchen', 'I had the wrong paper in front of me'], b: ['I had not studied a single page', 'the clock had no hands', 'a teacher I loved watched from the back'] },
    { a: ['Someone was chasing me through a car park', 'I ran down a corridor that kept getting longer', 'A shape followed me up the stairs'], b: ['my legs were wading through mud', 'I never turned around to see it', 'I woke before it caught up'] },
    { a: ['I waded into a warm ocean at night', 'The water came up through the floorboards', 'I swam through a flooded library'], b: ['the moon was far too close', 'the books floated like lilies', 'I could breathe and nobody explained why'] },
    { a: ['I found my house but the rooms kept going', 'There was a door in my flat I had never noticed', 'My childhood home had a second staircase'], b: ['every door opened onto another door', 'the last room was full of my own coats', 'someone had rearranged the furniture while I slept'] },
    { a: ['My phone rang and nobody was there', 'I tried to call my sister and the keys were wrong', 'A voice I knew was calling from the next room'], b: ['the screen kept dissolving', 'I could hear her but not answer', 'the battery sat on one percent'] },
    { a: ['My teeth started crumbling in the middle of a meeting', 'I spat out a tooth into my hand', 'I was smiling and my teeth were loose'], b: ['nobody else noticed', 'everyone pretended not to look', 'I kept talking anyway'] },
    { a: ['I ran for a train that was already leaving', 'I arrived at the airport with no passport', 'The bus pulled away just as I reached the stop'], b: ['I was holding someone else\'s luggage', 'the departures board was in a language I almost knew', 'I laughed because there was nothing else to do'] },
    { a: ['A fox sat on my bed and watched me', 'A horse walked calmly through the supermarket', 'I was feeding a crow that spoke to me'], b: ['it knew my name', 'nobody found it strange', 'it left a feather behind'] },
    { a: ['I drove down a hill and the brakes failed', 'I was driving but the seat was in the back', 'The car rolled forward with nobody at the wheel'], b: ['I stayed oddly calm', 'the road was made of wet paper', 'my father sat beside me eating an orange'] },
    { a: ['I was at a wedding that was also a funeral', 'I wore a dress made of newspaper to a ceremony', 'Everyone at the party was a stranger in my mother\'s clothes'], b: ['I had forgotten the vows', 'someone handed me a microphone', 'the cake was a house'] },
    { a: ['An old friend appeared in my kitchen', 'I met my first love on a night bus', 'My grandmother was waiting at a station'], b: ['we talked about nothing important', 'she was younger than me', 'we both knew it was a dream'] },
  ];
  const odd = ['A staircase grew out of a lake and I climbed it', 'I carried a giant clock through a market', 'The sky was printed on cloth and began to fray', 'I could taste colours and every one was warm'];
  let seed = 7;
  const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  const pick = <T,>(xs: T[]) => xs[Math.floor(rnd() * xs.length)];
  const today = Date.now();
  return Array.from({ length: n }, (_, i) => {
    const text = i % 9 === 8 ? pick(odd) + '.' : (() => { const k = kinds[Math.floor(rnd() * kinds.length)]; return `${pick(k.a)}, and ${pick(k.b)}.`; })();
    const date = new Date(today - (n - i) * 2 * 86400000 - Math.floor(rnd() * 86400000)).toISOString().slice(0, 10);
    return { id: 'x' + i, date, text, themes: [], sample: true };
  });
}

/** the local date, as YYYY-MM-DD: the night a dream belongs to */
export function localToday(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * the interpreter answers with an arc, a synthesis, symbols and a few actions. the map keeps the short form of that:
 * a reading, its symbols and its actions. a dream that gets the care note keeps only that note.
 */
export function readingFromInterpretation(data: Record<string, unknown>): { reading: NonNullable<Dream['reading']>; care: boolean } | null {
  if (typeof data.care === 'string' && data.care.trim()) return { reading: { reading: data.care, symbols: [], actions: [] }, care: true };
  const body = [data.arc, data.synthesis].filter((x): x is string => typeof x === 'string' && x.length > 0).join('\n');
  if (!body) return null;
  const symbols = Array.isArray(data.symbols) ? (data.symbols as { name?: string; note?: string }[]).filter((x) => x && x.name).map((x) => ({ name: String(x.name), note: String(x.note ?? '') })) : [];
  const actions = Array.isArray(data.actions)
    ? (data.actions as { title?: string; text?: string }[]).map((a) => ({ do: a?.title ?? '', why: a?.text ?? '' })).filter((a) => a.do)
    : [];
  return { reading: { reading: body, symbols, actions }, care: false };
}

/**
 * after a reading, keep the dream and its reading in this browser so it can show up on the map. nothing leaves the
 * device. a dream that needed the care note is never kept, and pressing interpret twice does not save it twice.
 */
export function rememberDream(text: string, data: Record<string, unknown>): void {
  try {
    const parsed = readingFromInterpretation(data);
    if (!parsed || parsed.care) return;
    const raw = localStorage.getItem(STORAGE_KEY);
    const list: Dream[] = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) return;
    const clean = text.trim();
    const date = localToday();
    if (list.some((d) => d.text === clean && d.date === date)) return;
    const id = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : String(Date.now());
    list.push({ id, date, text: clean, themes: [], reading: parsed.reading });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    /* storage unavailable: the reading still shows on the page */
  }
}
