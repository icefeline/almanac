/**
 * The scent recipe for every card in the deck, in perfumery's three-tier form.
 *
 * Authored, and the single source for the reading page's distill block. A
 * six-note accord used to sit alongside this, normalised to a fixed length; it
 * disagreed with these recipes on 45 of the 78 cards and has been removed,
 * since two lists of notes for one card is one too many.
 *
 * Counts run from five to eleven. Nothing downstream may assume six.
 *
 * The tiers are ordered by volatility, not importance: top notes are what you
 * meet first and lose within minutes, heart notes are the body of the thing,
 * base notes are what is still on skin hours later. That maps onto a day, which
 * is why it suits a one-card-a-day app — see the note at the bottom of this file.
 *
 * Keys are card ids from tarot-deck.ts. All 78 cards are covered.
 */

export interface CardScent {
  /** First impression. Bright, volatile, gone quickly. */
  top: string[];
  /** The body of the accord. */
  heart: string[];
  /** What lingers. */
  base: string[];
}

export const cardScents: Record<string, CardScent> = {
  'major-0': {
    top: ['bergamot', 'mimosa'],
    heart: ['elderflower', 'hay'],
    base: ['white cedar'],
  },
  'major-1': {
    top: ['black pepper', 'bergamot'],
    heart: ['tobacco', 'honey'],
    base: ['frankincense', 'labdanum'],
  },
  'major-2': {
    top: ['sea salt', 'yuzu'],
    heart: ['blue lotus', 'orris'],
    base: ['myrrh', 'oakmoss'],
  },
  'major-3': {
    top: ['peach', 'rose'],
    heart: ['tuberose', 'fig', 'honey'],
    base: ['sandalwood'],
  },
  'major-4': {
    top: ['black pepper', 'cardamom'],
    heart: ['tobacco', 'cedar'],
    base: ['labdanum', 'birch tar'],
  },
  'major-5': {
    top: ['bay laurel', 'cardamom'],
    heart: ['frankincense', 'frangipani', 'beeswax'],
    base: ['sandalwood', 'myrrh'],
  },
  'major-6': {
    top: ['rose', 'neroli'],
    heart: ['jasmine sambac', 'honey'],
    base: ['sandalwood', 'ambrette seed'],
  },
  'major-7': {
    top: ['ginger', 'black pepper'],
    heart: ['bay laurel', 'tobacco'],
    base: ['cedar', 'vetiver'],
  },
  'major-8': {
    top: ['pink pepper', 'saffron'],
    heart: ['rose', 'honey'],
    base: ['sandalwood', 'immortelle'],
  },
  'major-9': {
    top: ['hinoki', 'mugwort'],
    heart: ['frankincense', 'garden sage'],
    base: ['cedar', 'ash'],
  },
  'major-10': {
    top: ['star anise', 'cardamom'],
    heart: ['cinnamon', 'honey'],
    base: ['tonka bean', 'frankincense'],
  },
  'major-11': {
    top: ['yuzu', 'violet leaf'],
    heart: ['iris', 'vervain'],
    base: ['vetiver', 'sea salt'],
  },
  'major-12': {
    top: ['petrichor', 'violet leaf'],
    heart: ['blue lotus', 'oakmoss'],
    base: ['vetiver', 'myrrh'],
  },
  'major-13': {
    top: ['rhubarb', 'cypress'],
    heart: ['myrrh', 'immortelle'],
    base: ['oakmoss', 'vetiver', 'patchouli'],
  },
  'major-14': {
    top: ['bergamot', 'coriander seed'],
    heart: ['rose', 'honey', 'chamomile'],
    base: ['sandalwood', 'benzoin'],
  },
  'major-15': {
    top: ['blackcurrant bud', 'ginger'],
    heart: ['tuberose', 'ylang ylang', 'tobacco', 'cacao'],
    base: ['labdanum', 'oud', 'birch tar'],
  },
  'major-16': {
    top: ['black pepper', 'ginger'],
    heart: ['dragon\'s blood', 'tobacco'],
    base: ['birch tar', 'ash'],
  },
  'major-17': {
    top: ['neroli', 'mimosa'],
    heart: ['rose water', 'iris'],
    base: ['white musk'],
  },
  'major-18': {
    top: ['mugwort', 'seaweed'],
    heart: ['jasmine sambac', 'blue lotus'],
    base: ['oakmoss', 'ambergris', 'myrrh'],
  },
  'major-19': {
    top: ['orange blossom', 'yuzu'],
    heart: ['immortelle', 'honey'],
    base: ['saffron', 'sandalwood'],
  },
  'major-20': {
    top: ['frankincense', 'bergamot'],
    heart: ['hyssop', 'frangipani'],
    base: ['myrrh', 'oud'],
  },
  'major-21': {
    top: ['bergamot', 'cardamom'],
    heart: ['rose', 'jasmine', 'fig'],
    base: ['sandalwood', 'oakmoss', 'vetiver', 'ambrette'],
  },
  'cups-ace': {
    top: ['orange blossom water', 'yuzu'],
    heart: ['white rose', 'magnolia'],
    base: ['white musk'],
  },
  'cups-2': {
    top: ['neroli', 'bergamot'],
    heart: ['rose', 'jasmine sambac'],
    base: ['sandalwood', 'ambrette seed'],
  },
  'cups-3': {
    top: ['mandarin', 'pink pepper'],
    heart: ['osmanthus', 'elderflower', 'honey'],
    base: ['white tea'],
  },
  'cups-4': {
    top: ['green tea', 'cucumber'],
    heart: ['chamomile', 'hay'],
    base: ['oakmoss', 'orris'],
  },
  'cups-5': {
    top: ['petrichor'],
    heart: ['violet', 'iris', 'chamomile'],
    base: ['oakmoss', 'wet stone'],
  },
  'cups-6': {
    top: ['peach', 'mandarin'],
    heart: ['pandan', 'rose', 'honey', 'chamomile'],
    base: ['vanilla', 'orris'],
  },
  'cups-7': {
    top: ['blackcurrant bud', 'star anise'],
    heart: ['jasmine grandiflorum', 'ylang ylang', 'tuberose'],
    base: ['poppy', 'myrrh'],
  },
  'cups-8': {
    top: ['sea salt', 'cypress'],
    heart: ['mugwort', 'chamomile'],
    base: ['oakmoss', 'myrrh'],
  },
  'cups-9': {
    top: ['bergamot', 'cardamom'],
    heart: ['rose', 'jasmine', 'honey', 'fig'],
    base: ['sandalwood', 'tonka bean'],
  },
  'cups-10': {
    top: ['neroli', 'mandarin'],
    heart: ['rose', 'orange blossom', 'honey', 'chamomile'],
    base: ['sandalwood', 'beeswax', 'benzoin'],
  },
  'cups-page': {
    top: ['yuzu', 'elderflower'],
    heart: ['violet', 'water lily'],
    base: ['white musk', 'seaweed'],
  },
  'cups-knight': {
    top: ['bergamot', 'neroli'],
    heart: ['rose', 'jasmine sambac', 'ylang ylang'],
    base: ['sandalwood', 'ambergris'],
  },
  'cups-queen': {
    top: ['sea salt', 'mandarin'],
    heart: ['rose', 'jasmine', 'blue lotus', 'magnolia'],
    base: ['sandalwood', 'ambergris', 'oakmoss'],
  },
  'cups-king': {
    top: ['cypress', 'bergamot'],
    heart: ['chamomile', 'champaca', 'tobacco'],
    base: ['oakmoss', 'myrrh', 'ambergris'],
  },
  'swords-ace': {
    top: ['yuzu', 'kaffir lime leaf'],
    heart: ['violet leaf', 'vetiver'],
    base: ['hinoki'],
  },
  'swords-2': {
    top: ['bergamot', 'cucumber'],
    heart: ['iris', 'violet leaf'],
    base: ['white musk'],
  },
  'swords-3': {
    top: ['rhubarb', 'black pepper'],
    heart: ['iris', 'wormwood'],
    base: ['wet stone', 'oakmoss'],
  },
  'swords-4': {
    top: ['eucalyptus', 'lavender'],
    heart: ['chamomile', 'hinoki'],
    base: ['cedar', 'hay'],
  },
  'swords-5': {
    top: ['black pepper', 'ginger'],
    heart: ['tobacco', 'wormwood'],
    base: ['birch tar'],
  },
  'swords-6': {
    top: ['sea salt', 'bergamot'],
    heart: ['violet leaf', 'iris'],
    base: ['cypress', 'oakmoss'],
  },
  'swords-7': {
    top: ['black pepper', 'coriander seed'],
    heart: ['tobacco', 'tarragon'],
    base: ['vetiver', 'ambrette seed'],
  },
  'swords-8': {
    top: ['cypress', 'juniper'],
    heart: ['mugwort', 'wormwood'],
    base: ['oakmoss', 'vetiver'],
  },
  'swords-9': {
    top: ['black pepper', 'ginger'],
    heart: ['valerian', 'wormwood'],
    base: ['myrrh', 'birch tar'],
  },
  'swords-10': {
    top: ['rhubarb', 'black pepper'],
    heart: ['iris', 'wormwood', 'tobacco'],
    base: ['birch tar', 'oakmoss', 'ash'],
  },
  'swords-page': {
    top: ['yuzu', 'pink pepper'],
    heart: ['violet leaf', 'green tea'],
    base: ['vetiver'],
  },
  'swords-knight': {
    top: ['black pepper', 'ginger', 'bergamot'],
    heart: ['tobacco', 'bay laurel'],
    base: ['cedar', 'vetiver'],
  },
  'swords-queen': {
    top: ['bergamot', 'violet leaf'],
    heart: ['iris', 'wormwood', 'tarragon'],
    base: ['vetiver', 'cypress'],
  },
  'swords-king': {
    top: ['black pepper', 'cardamom'],
    heart: ['bay laurel', 'tobacco', 'hinoki'],
    base: ['cedar', 'vetiver', 'oakmoss'],
  },
  'wands-ace': {
    top: ['torch ginger', 'ginger', 'pink pepper'],
    heart: ['dragon\'s blood', 'cinnamon'],
    base: ['cedar'],
  },
  'wands-2': {
    top: ['bergamot', 'black pepper'],
    heart: ['tobacco', 'bay laurel'],
    base: ['cedar', 'frankincense'],
  },
  'wands-3': {
    top: ['bergamot', 'cardamom'],
    heart: ['tobacco', 'saffron'],
    base: ['frankincense', 'sandalwood'],
  },
  'wands-4': {
    top: ['cinnamon', 'orange blossom'],
    heart: ['rose', 'honey'],
    base: ['sandalwood', 'beeswax'],
  },
  'wands-5': {
    top: ['black pepper', 'ginger', 'pink pepper'],
    heart: ['dragon\'s blood', 'tobacco'],
    base: ['cedar', 'hay'],
  },
  'wands-6': {
    top: ['bergamot', 'cardamom'],
    heart: ['bay laurel', 'saffron', 'honey'],
    base: ['frankincense', 'sandalwood'],
  },
  'wands-7': {
    top: ['black pepper', 'ginger'],
    heart: ['dragon\'s blood', 'tobacco', 'thyme'],
    base: ['vetiver', 'cedar'],
  },
  'wands-8': {
    top: ['yuzu', 'ginger', 'pink pepper'],
    heart: ['cardamom', 'star anise'],
    base: ['cedar'],
  },
  'wands-9': {
    top: ['black pepper', 'cypress'],
    heart: ['tobacco', 'thyme', 'dragon\'s blood'],
    base: ['vetiver', 'oakmoss', 'labdanum'],
  },
  'wands-10': {
    top: ['black pepper'],
    heart: ['tobacco', 'hay', 'cedar'],
    base: ['vetiver', 'labdanum', 'patchouli'],
  },
  'wands-page': {
    top: ['ginger', 'pink pepper', 'yuzu'],
    heart: ['cardamom', 'dragon\'s blood'],
    base: ['cedar'],
  },
  'wands-knight': {
    top: ['black pepper', 'ginger', 'cinnamon'],
    heart: ['dragon\'s blood', 'tobacco', 'saffron'],
    base: ['cedar', 'birch tar'],
  },
  'wands-queen': {
    top: ['torch ginger', 'pink pepper', 'bergamot'],
    heart: ['rose', 'cinnamon', 'saffron', 'honey'],
    base: ['sandalwood', 'labdanum'],
  },
  'wands-king': {
    top: ['black pepper', 'cardamom'],
    heart: ['tobacco', 'bay laurel', 'dragon\'s blood'],
    base: ['cedar', 'frankincense', 'labdanum'],
  },
  'pentacles-ace': {
    top: ['fig leaf', 'carrot seed'],
    heart: ['orris', 'beeswax'],
    base: ['sandalwood', 'vetiver'],
  },
  'pentacles-2': {
    top: ['bergamot', 'pink pepper'],
    heart: ['ginger', 'honey'],
    base: ['vetiver', 'hay'],
  },
  'pentacles-3': {
    top: ['cardamom', 'black pepper'],
    heart: ['pandan', 'hay', 'beeswax', 'tobacco'],
    base: ['sandalwood', 'cedar', 'oakmoss'],
  },
  'pentacles-4': {
    top: ['black pepper'],
    heart: ['patchouli', 'tobacco'],
    base: ['labdanum', 'vetiver', 'oakmoss'],
  },
  'pentacles-5': {
    top: ['cypress', 'wet stone'],
    heart: ['mugwort', 'hay'],
    base: ['oakmoss', 'vetiver', 'birch tar'],
  },
  'pentacles-6': {
    top: ['bergamot', 'coriander seed'],
    heart: ['fig', 'honey', 'tobacco'],
    base: ['sandalwood', 'beeswax'],
  },
  'pentacles-7': {
    top: ['tomato leaf', 'cardamom'],
    heart: ['fig', 'hay', 'honey'],
    base: ['vetiver', 'oakmoss', 'patchouli'],
  },
  'pentacles-8': {
    top: ['black pepper', 'coriander seed'],
    heart: ['beeswax', 'hay', 'tobacco'],
    base: ['sandalwood', 'cedar', 'oakmoss'],
  },
  'pentacles-9': {
    top: ['fig', 'bergamot'],
    heart: ['rose', 'honey', 'magnolia'],
    base: ['sandalwood', 'orris', 'beeswax'],
  },
  'pentacles-10': {
    top: ['fig', 'cardamom'],
    heart: ['pandan', 'rose', 'honey', 'tobacco', 'patchouli'],
    base: ['sandalwood', 'oakmoss', 'vetiver', 'beeswax', 'orris'],
  },
  'pentacles-page': {
    top: ['fig leaf', 'coriander seed'],
    heart: ['carrot seed', 'hay'],
    base: ['vetiver', 'oakmoss'],
  },
  'pentacles-knight': {
    top: ['black pepper', 'cardamom'],
    heart: ['hay', 'tobacco', 'patchouli'],
    base: ['vetiver', 'cedar', 'oakmoss'],
  },
  'pentacles-queen': {
    top: ['fig', 'cardamom'],
    heart: ['pandan', 'rose', 'honey', 'champaca', 'fenugreek'],
    base: ['sandalwood', 'beeswax', 'oakmoss'],
  },
  'pentacles-king': {
    top: ['fig', 'black pepper'],
    heart: ['tobacco', 'truffle', 'patchouli'],
    base: ['sandalwood', 'oakmoss', 'vetiver', 'labdanum'],
  },
};

/** The accord for a card, or null if the id is unknown. */
export function getCardScent(cardId: string): CardScent | null {
  return cardScents[cardId] ?? null;
}

/** All notes for a card, top through base, for a single-line rendering. */
export function flattenScent(scent: CardScent): string[] {
  return [...scent.top, ...scent.heart, ...scent.base];
}

/**
 * Count how often each note appears across a set of drawn cards — for a
 * year-in-review ("your year smelled of vetiver, honey and oakmoss"), or to
 * find the through-line in a run of readings. Returns notes most-frequent first.
 */
export function dominantNotes(cardIds: string[], limit = 5): Array<{ note: string; count: number }> {
  const tally = new Map<string, number>();
  for (const id of cardIds) {
    const scent = cardScents[id];
    if (!scent) continue;
    for (const note of flattenScent(scent)) {
      tally.set(note, (tally.get(note) ?? 0) + 1);
    }
  }
  return [...tally.entries()]
    .map(([note, count]) => ({ note, count }))
    .sort((a, b) => b.count - a.count || a.note.localeCompare(b.note))
    .slice(0, limit);
}

/**
 * The memory a card carries, for the distill block on the reading page.
 *
 * Not an interpretation and not a second meaning — a plain memory a stranger
 * would recognise: a room, a time of day, a small human act. The card's essence
 * arrives through the scene rather than being stated by it, which is why none
 * of these name or explain the botanicals sitting beside them in the accord.
 *
 * Authored per card, roughly fifty words each. Any card missing an entry simply
 * renders its distill block without the paragraph.
 */
export const cardMemories: Record<string, string> = {
  // ── Major Arcana ──────────────────────────────────────────────────────────
  'major-0': "You left the house with almost nothing in the bag. The air was colder and cleaner than you'd braced for, and for a while there was only your own footsteps, a bird you couldn't name, a road that went somewhere you hadn't settled on. Walking felt lighter than any plan had.",
  'major-1': "Your uncle could fix anything with whatever was already in the drawer: a screwdriver, a rubber band, half a candle. He went quiet and squinted at the problem, and you learned to trust that squint before you knew why. When he finished it worked, and he never mentioned it. You watched his hands closely, even then.",
  'major-2': "At one woman's door the tea was poured before you knocked. She asked nothing. The quiet in her front room didn't wait for you to fill it, and you walked out carrying something you hadn't walked in with. She never brought it up. You still can't say what she taught you, only that it took.",
  'major-3': "A friend's mother fed you before you knew you were hungry. Peaches going soft on her counter, somebody's laundry warm off the line, her hand flat on your back as she asked nothing about your face. You had two helpings without meaning to. She moved around her kitchen as if she'd been waiting all week for you.",
  'major-4': "At the head of the table sat a grandfather who never raised his voice. He carved, and the room arranged itself around him, plates passed in the order he chose, and no one thought it odd. You first understood authority by watching him: it didn't announce itself, and it didn't have to.",
  'major-5': "The temple, the church, the mosque, whichever one it was, at an hour that always felt too early. Everyone said words you didn't yet understand, all at once, and the sound settled somewhere in you to wait. Years later, far from home, you caught yourself humming a bar of it in the shower. It had got in.",
  'major-6': "You and someone else fell asleep on the same sofa by accident. Sun on the wall, laughter from the street, the small weight of another person breathing beside you. You woke first and lay very still so they could keep sleeping. In that suspended minute you realised this was the thing you'd been trying to name.",
  'major-7': "The morning of the exam, or the interview, or the long drive across a country you'd never crossed. The bag was packed the night before and checked twice. Coffee made, keys left where you'd put them on purpose. Nothing left to decide, only the road ahead and your held breath and the motion of something finally committed to.",
  'major-8': "A mother in a supermarket aisle held her child through a tantrum. She wasn't embarrassed or in a hurry, and she didn't try to end it faster than it wanted to end. Her hand stayed on the small back until the storm passed. By the end the child was quiet, reaching up for her fingers.",
  'major-9': "There's an hour around four in the morning that belongs to no one. A small light above the stove, the fridge cycling, the house making the sounds it makes when it thinks it's alone. Nobody needs anything for a while. You sit with your tea, and for once you don't have to be anyone to anyone.",
  'major-10': "A song came on in the taxi on the very day you'd been thinking about them. A stranger quoted a line you'd read that morning. You told nobody, because they would say it meant nothing, and you were fairly sure it did. The world winks sometimes. You allowed yourself to wink back.",
  'major-11': "The elder listened to both sides, then sat silent for a long minute before she spoke. When she did, both people went still. Neither was happy with what she said, and both could tell it was fair. That afternoon you saw that a true judgement is a cost, and the judge pays part of it.",
  'major-12': "Fevers shift the ceiling. You couldn't move and eventually quit trying, the fan turning slowly overhead, time behaving oddly. From that angle you saw something you'd been wrong about, and it was so plain you nearly laughed. Nothing had changed in the room. You had finally been still long enough to look.",
  'major-13': "Clearing a house after a funeral is its own kind of labour. Clothes that still smelled of them, the tin of tea they always bought, shoes lined up by the door as if they'd be back by dinner. You packed boxes, cried, kept packing. Somewhere in the work you were turning into someone who could do this, and the room started to open.",
  'major-14': "An aunt at the stove could taste a pot and know what it wanted. A pinch more salt, a squeeze of lime, ten minutes with the lid on. She never measured, and the dish came out right every time, and she was never surprised. She had been listening to it the whole way through.",
  'major-15': "Small compulsions have a gravity of their own. A third drink you knew you shouldn't have, the message sent at one in the morning, the thing you kept returning to because it produced a feeling, even a wrong one. You knew the whole time, and the knowing was part of the pull. After a while you stopped expecting it to stop you.",
  'major-16': "The phone rang at the wrong hour and you knew before you picked it up. The floor you'd been standing on turned out not to be there. From that minute onward everything would be counted as before and after. There was nothing yet to say about it. You stood in the hall with the phone still warm in your hand.",
  'major-17': "The first proper shower after a long illness is close to resurrection. Window cracked open, water on skin that hadn't felt much in weeks, a slow return to yourself in small increments. Nothing had been solved. You simply remembered that you were here, in a body, able to stand in warm water and be a little grateful.",
  'major-18': "Strange cities behave differently after dark. You took a wrong turn on purpose and followed a light that was doing odd things between the buildings. Dogs barked behind a wall, a radio played through someone's window, your footsteps came back louder than they should. The mind showed you things that weren't quite there. A few of them, you decided later, had been.",
  'major-19': "A child ran across the courtyard to show you something. A stone, a beetle, a drawing, whatever it was, it was the most important thing in the world for the length of the run. You caught them and looked at what they held and gave it your whole attention. Later you couldn't recall what it was, only their face when you took it seriously.",
  'major-20': "A message arrived from someone you hadn't spoken to in years, and it sat unopened for an afternoon. When you read it twice, the old feeling came up softer, or clearer, or both. You knew what was being asked and you knew what you'd answer. There was a quiet in you that hadn't been there the last time.",
  'major-21': "On the last night of a long trip you sat on the balcony with the person you'd travelled with, and neither of you needed to speak for long stretches. Everything you'd set out to do had got done, along with a few things you hadn't planned, and both kinds counted. Tomorrow you'd go home slightly changed. That had been the reason for going.",

  // ── Cups ──────────────────────────────────────────────────────────────────
  'cups-ace': "Someone handed you tea after a long journey, already the right temperature, already sweet the way you take it, and you'd never said. You held it in both hands before drinking, because the holding was part of it. The hard bits of getting there began to loosen, one warm minute at a time.",
  'cups-2': "A friend said the thing you'd both been circling for months, quietly, in the middle of an ordinary conversation, as if it had been on the table all along. Neither of you moved. A promise got made without being named, and both of you knew it, and both of you kept it.",
  'cups-3': "A birthday in someone's small kitchen, three of you laughing at a remark made an hour earlier that had only just landed. Food mostly gone, no one leaving. Afterwards you couldn't say what was funny, only that your face ached and everyone was there together, on one of those nights.",
  'cups-4': "You turned down an offer you couldn't make yourself want: a trip, a job, an evening out. You said no without knowing why. Some part of you had already turned to the wall before your mouth caught up. It wasn't the offer's fault. You weren't there for it yet, and forcing it wouldn't have brought you.",
  'cups-5': "Grief has its own hour in the kitchen at eight in the morning. You stood with your hands not knowing what to do, the kettle boiled and forgotten. Three things had spilled and two were still upright, and you couldn't see the two yet. That was allowed. Nobody was asking you to see them today.",
  'cups-6': "You walked into a house you hadn't entered in twenty years: a cousin's, a grandmother's, a friend's you'd lost touch with. Your body remembered the corridor before your mind did. For one full second you were seven. You told nobody, because it felt like something private.",
  'cups-7': "Some evenings the future shows up as too many open tabs. Every option shimmering, none close enough to touch, all equally possible and equally unreal. You went to bed without picking one, and by morning half of them had closed themselves. Not choosing is sometimes how you find out what you wanted.",
  'cups-8': "One night you packed a small bag and went, with no scene. You had built the thing you were leaving and it was good, and it had stopped being yours. You shut the door without slamming it. Nobody heard you go, which was what you needed. Leaving well is a skill.",
  'cups-9': "You cooked for yourself on a night in and it came out better than you expected, a small miracle. You ate slowly, with nobody to perform for and nobody to please, just the food and a good silence. You went back for a second helping and felt no guilt about it.",
  'cups-10': "Evenings on the veranda with family, each in their own conversation, children underfoot, someone laughing loud enough to be heard three rooms away. You looked around and something in you said, quite clearly, this is what it was all for. It wasn't perfect and none of it was. It was enough.",
  'cups-page': "A child brought you a shell and told you a whole story about it, half invented and entirely meant. You listened without correcting a thing, since the story wasn't the point. They ran off for the next find, and you kept the shell longer than you'd planned.",
  'cups-knight': "Someone wrote you a letter by hand. No text, no email, a folded page in an envelope with your name in ink. They had thought of you for the whole length of the writing, and you could feel it in the paper. You read it twice, put it somewhere safe, and thought of them all afternoon.",
  'cups-queen': "You rang a friend at a bad hour and she didn't ask you to explain. She listened, and she knew when to speak and when to let the silence carry it. After the call the trouble was still there, but it had become something you could carry. Her doing.",
  'cups-king': "Your father stayed calm when the news was bad. He wasn't distant or unfeeling, only steady in a way that let the rest of the family breathe. He asked one clear question and then made the tea. Later, alone, he let himself feel it. You didn't see that part, and you knew it happened.",

  // ── Swords ────────────────────────────────────────────────────────────────
  'swords-ace': "A sentence arrived whole, the one you'd been trying to write all week, clear as glass and impossible to unsee. You wrote it down before it could leave. Everything that had been tangled was suddenly plain. Clarity tends to come like that, in one go, and it helps to have a pen nearby.",
  'swords-2': "A decision you've been avoiding can sit on the table far longer than it should. You'd read both emails four times by now. Either answer would cost something, and you couldn't yet tell which cost you were more willing to pay. You closed the laptop, made another coffee, and the decision waited, patient as a cat.",
  'swords-3': "You read the message twice to be sure what it said. There was nothing to do with your hands and nothing to tell anyone, just the fact of it lodged in your chest. Some griefs are simple and complete, and adding to them only tampers with them.",
  'swords-4': "Every house has a chair nobody else sits in. You folded into yours after a long week, light going soft, the house finally quiet. Curtains half drawn, phone left in another room on purpose, one long exhale you hadn't known you were holding. You didn't dream. You woke different.",
  'swords-5': "You won the argument and, walking away, knew you'd lost something in the winning. The room afterwards: cold coffee, the other person's chair still pushed back at an angle. You had been right, and made sure everyone knew, and now the silence was yours to sit in alone.",
  'swords-6': "Buses at dawn, ferries, flights before sunrise. Everyone quiet, the sky going its slow blue, the water or the road carrying you where it was going. You didn't look back at what you were leaving and you didn't feel brave. You were tired and pointed the other way, and that was enough to get moving.",
  'swords-7': "Small lies weigh little until they don't. You told one nobody caught, almost harmless, and watched yourself tell it, and knew you'd have to remember it later. It sat in you like a stone in a shoe, there with every step. Small things stop being small when you're the one carrying them.",
  'swords-8': "Some mornings every option looks shut. Walls up, no visible door, the light coming in at the wrong angle. You'd built most of the walls yourself and forgotten. Anyone standing beside you would have seen the way out at once, but you were alone in the room, so you didn't.",
  'swords-9': "Three in the morning and the light's on again. You'd stared at the ceiling long enough to hear the fridge cycle three times, the same thought returning each time wearing something a little worse. You knew it would look smaller by daylight. That didn't help yet, though it was true, and it did end.",
  'swords-10': "The end of something you'd been holding together too long. Face down on the bed, phone somewhere on the floor, the specific relief of not having to hold it any more. It couldn't get worse from there, and in an odd small way that was where something began. You just had to lie there for a while first.",
  'swords-page': "Teenagers at the dinner table who've read one book and keep bringing it up. Half right, half naive, entirely convinced. You remember being that certain once, and almost miss the sharpness it had before life complicated it. Let them have it. It doesn't last.",
  'swords-knight': "A friend told you the truth without softening it, in the middle of the street, before you were ready. You were furious for a day. By the end of the week you knew they were right, and by the end of the month you were glad it had been them.",
  'swords-queen': "She'd lost a lot and didn't hide it, and she didn't let it turn her cruel. She saw through most things, was gentle where it mattered and sharp where it counted, and you always wanted her on your side of a hard conversation. From her you learned that clarity and kindness aren't opposites.",
  'swords-king': "The judge, the professor, the elder who could hold a hard truth without dressing it up or apologising. He didn't need to be liked, and that was part of why you leaned in when he spoke. You wrote things down afterwards so you wouldn't forget, and for years you quoted him without noticing.",

  // ── Wands ─────────────────────────────────────────────────────────────────
  'wands-ace': "An idea woke you at five and wouldn't let you back to sleep. You got up and wrote it down in the dark, half legible, not caring. Something was starting, and you could feel the heat of it in your chest. You didn't know what yet. You didn't need to.",
  'wands-2': "A rooftop, after you'd decided and before you'd told anyone, has a particular hush. Looking out at the city you were about to leave, or the one you were about to move to, the world felt wide and yours in a way it hadn't before. You took a long breath and kept the moment to yourself. Once you told people it would become something else.",
  'wands-3': "The morning after you sent the application, the pitch, the proposal, there was nothing to do but wait. You made breakfast slowly and drank your coffee at the window. Somewhere out of sight the future was assembling itself, and for once you let it, without reaching in to adjust.",
  'wands-4': "A wedding, a housewarming, a graduation, fairy lights strung wherever they'd hang. Aunties running the kitchen, uncles arguing over the music, somebody pressing into your hand a drink you hadn't asked for that turned out to be exactly right. This was the good part, and you knew to notice it while it was still happening.",
  'wands-5': "A group project where no one would stop talking over anyone else, each person wanting to be the one who was right, and nothing getting decided. You went home with an aching jaw. Nothing terrible had happened, exactly, and nothing useful had either, and you weren't sure which was more tiring.",
  'wands-6': "Some walks home are just walks home, and some come after the news. The sun set in that gold way that felt like the sky knew. You wanted to tell everybody and also keep it to yourself for one more hour. You had worked on this longer than most people realised, and now it was here and it was yours.",
  'wands-7': "In the meeting you were the only one holding a position, and you knew you had to hold it. Steadily, with no heat. People pushed and you stayed where you were. You went home tired. You hadn't backed down, and that mattered more than winning would have.",
  'wands-8': "The messages wouldn't stop for a week: calls, emails, one thing after another, all of it moving quickly in the direction you'd hoped for. You caught up with none of it and it didn't matter, since the momentum was doing the work. You'd rest at the weekend, or when it was over. Either way was fine.",
  'wands-9': "The night before the last day of a hard thing, you are nearly done and nearly broken, and you know both. You slept badly. You got up and did it anyway. That is what nine of anything means: one more push and you're through.",
  'wands-10': "Halfway up four flights with the shopping, it hit you that you'd said yes to too many things again. Nobody had asked you to carry all of it. You had, and here you were, out of breath, head starting to pound, wondering when you'd learn. Some burdens are honest, and some are how you show love badly.",
  'wands-page': "A friend rang, excited about a new plan, the fifth of the year. You listened, because one of them might be the one, and even the ones that weren't are part of the making. Their enthusiasm was catching even when it was slightly ridiculous. That was the point of them.",
  'wands-knight': "Your cousin booked the flight before deciding where to stay, and would figure it out, because he always did, mostly. The stories he came back with were worth the small chaos, worth the calls at odd hours asking for help with whatever he'd got himself into. Life was more interesting with him in it, and everyone knew.",
  'wands-queen': "Some women walk into a room and it rearranges itself around them, and they aren't doing anything to cause it. She knew exactly what she brought and didn't apologise. She was warm to the people she liked and had little to give the rest, with no time for pretending she couldn't tell the difference. Sit near her at dinner if you can.",
  'wands-king': "A founder who could look at a mess and see the shape of what it would become. He'd bet on himself enough times to know how the odds really worked. When he asked you to help build something, you believed you could, and that belief was half of what made it possible. That was his actual gift.",

  // ── Pentacles ─────────────────────────────────────────────────────────────
  'pentacles-ace': "Someone handed you an envelope, an offer, a packet of seeds, without making a fuss. You held it in your palm and felt the weight, small and real, and knew this one could grow if you gave it what it needed. Beginnings don't always announce themselves. Some just arrive.",
  'pentacles-2': "For a few weeks you were holding three jobs and a family situation and still remembering the milk. You weren't graceful about any of it, but you did it. Some days that is what balance looks like: not elegant, just kept up. You were tired and you were managing, and both were true.",
  'pentacles-3': "The kitchen at the temple, the church, the community hall. Three women chopping, two men at the stove, someone's kid handing out plates. Nobody in charge, everyone knowing what to do, the meal somehow arriving on time. This is how things get made when nobody needs credit.",
  'pentacles-4': "Tins under the bed, accounts you tell nobody about, a count made twice before spending. You'd been without once and it left a mark, and you weren't wrong to be careful. You were starting to be a little too careful, though, and some small voice in you had noticed.",
  'pentacles-5': "There are winters you'd rather not remember. Walking past a warm restaurant window with almost nothing in your pocket, the help you didn't ask for because you didn't know how. It ended eventually. You still flinch at certain streets, and you're gentler than most with anyone you see out in the cold.",
  'pentacles-6': "A neighbour left a bag of mangoes at your door when the tree fruited, no note, no expectation. Later, when you had extra rice, you took some over. Nobody kept score, and both of you understood that without saying it.",
  'pentacles-7': "Some mornings you look over what you've built, the garden, the business, the child, and can't yet tell if it's working. You've done the work and it's the plant's turn, with nothing left but to wait and water. You went inside and made lunch, which was still yours to do.",
  'pentacles-8': "The apprentice at the bench did the same small movement for the two-thousandth time, not bored, getting better in a way only she could feel. The master watched without a word, and that was the compliment. Skill builds like this, quietly, one repetition at a time, and nobody outside the room notices for years.",
  'pentacles-9': "Afternoons in your own garden at a house you bought yourself, with coffee made exactly how you like it and no one to answer to for an hour. You'd earned the quiet, you knew it, and you weren't apologising to anyone. This was what all the working had been for.",
  'pentacles-10': "A family isn't built in one lifetime. At the grandparents' house on a holiday afternoon, three generations shared one room, someone asleep on the sofa, a dish that has been cooked in that kitchen for forty years. This is what your people made, over long stretches you weren't around for. You were inside it, in the middle of a long chain, and could feel it.",
  'pentacles-page': "A child saved for the thing, counting coins from the jar each week, slow and patient and entirely serious. You wanted to hand over the rest, and you didn't, because it wasn't the point and even they knew it. The saving was the lesson, more than the buying.",
  'pentacles-knight': "A friend who said he'd help you move turned up at eight with coffee and a plan. He wasn't fast or fancy, only thorough. Everything ended up where it should be. He left before you could thank him twice, being that kind of man, and you were lucky to know him.",
  'pentacles-queen': "An aunt's house was always warm, the kitchen always had food ready, and the cats came when she called. She didn't fuss when you visited. She made sure you were fed and had somewhere comfortable to sit. You slept well whenever you stayed, and only years later did you understand why.",
  'pentacles-king': "An old man had owned the shop forty years and knew every regular by name and what they'd come in for. He never chased growth. The shop was good, the workers were paid on time, the family was fed. He built something that lasted and never needed to tell you, and that was part of why it did.",
};

/**
 * The same recipe, read the other way up.
 *
 * The scents do not change when a card reverses — a reversal is not a different
 * accord, it is the same accord on a different day, and the deck's notes were
 * chosen for the card rather than for its orientation. What changes is what the
 * accord is doing to you, so only the memory has a second version.
 *
 * These are darker than their upright twins on purpose, and they are not their
 * opposites. Most hold two failures at once — the thing done too much and the
 * same thing not done at all — because that is how a reversal actually arrives:
 * not as the inverse of the card but as its energy gone wrong in one of two
 * directions, and rarely with the reader certain which one they are in.
 *
 * Keys are card ids from tarot-deck.ts, in the same order as cardMemories
 * above. All 78 cards are covered; Distill falls back to the upright memory if
 * one is ever missing, so a gap reads as unwritten rather than as blank.
 */
export const cardMemoriesReversed: Record<string, string> = {
  // ── Major Arcana ────────────────────────────────────────────────────────────
  'major-0': "The keys have been in your hand for weeks. You've rehearsed leaving so often the rehearsal has started to feel like the thing itself. Or you flung a bag together once and ran at the wrong door, because wanting to be elsewhere was doing the choosing. Morning keeps finding you where the night left you.",
  'major-1': "Half a dozen jobs begun and none finished, tools all over the bench, that steady focus you used to trust gone somewhere it won't answer to. Or the skill ran ahead into rooms it had no business in, mending what wasn't broken. Either way the hand no longer remembers the exact shape of what it holds.",
  'major-2': "The door that used to open before you knocked stays shut, and the tea nobody offers has a quiet of its own. Knowing can be hoarded or it can be drowned in chatter, and both leave the room empty. Whatever used to reach you sideways through her stillness has stopped coming, and neither of you says so.",
  'major-3': "The peaches on the counter went soft and then bad because nobody ate them. You cooked for everyone and skipped your own supper, or you stopped cooking altogether and called it independence. The kitchen smells of someone else's effort, and your own appetite has gone quiet where you can't hear it.",
  'major-4': "The grandfather at the head of the table has tightened. He raises his voice now, or he is absent, and either way the room no longer arranges itself, it braces. Rules multiply to cover a fear nobody names. You can tell the difference now between a boundary that shelters and one that is only a wall.",
  'major-5': "The prayer is still recited, mouths moving, but the sound has stopped settling anywhere in you. Or you walked out of the building slamming the door and found the silence outside as loud. You can't tell whether you're losing something worth keeping or shedding a coat that never fitted.",
  'major-6': "You woke on the sofa and the other person had already gone to another room. Two people being polite about a distance neither will measure. Or you said yes to something with your mouth and no with your stomach, and you've been editing yourself for weeks to keep a peace that costs more than it brings.",
  'major-7': "The engine is running and the car is going nowhere, or it's going somewhere too quickly with nobody at the wheel. Two horses, two directions, and you braced in between. You've packed and unpacked the same bag, and you can't recall which direction you were facing when you started.",
  'major-8': "The child's tantrum met either with a raised voice or with a blank wall, and neither helped. A feeling so big you clamped down on it and called it calm, or let it run and then felt ashamed for a week. Somewhere under both, the small thing still waits to be held.",
  'major-9': "The lamp is lit and no one is carrying it. You've been quiet so long it has turned into hiding, and the empty house isn't peaceful any more, only empty. Or the noise is so constant you can't find a gap to listen through. Four in the morning arrives and you scroll through it.",
  'major-10': "A coincidence passed and you read it as an insult. The same week, the same quarrel, the same low door at the end of the corridor, and you've started calling it fate when part of it is a groove you keep wearing deeper. The wheel hasn't stopped. You've just stopped looking up at it.",
  'major-11': "The elder is quiet and you can't tell if it's fairness or avoidance. A story got tilted at the edges so you'd come out well, and you've been reciting it long enough that it sounds true. There's an account somewhere, unsettled, and you've been careful not to walk past it.",
  'major-12': "The fever wouldn't break and the stillness had nothing in it. Waiting for a message that isn't coming, waiting for permission, waiting because moving would mean choosing. You called it patience. It started to feel like standing in a queue for a counter that closed years ago.",
  'major-13': "The shoes are still by the door. The tin of tea has been refilled as if it were needed. Something finished a long time ago is being kept alive by effort alone, and you're exhausted from the upkeep. Or you swept it all out in an afternoon, so fast the grief hasn't caught up.",
  'major-14': "The pot boiled over twice. Too much salt, then none, then a hurry to rescue it with lime. An auntie's calm was never about the measuring, and you've been measuring harder and getting further from it. Numbing and distraction have been standing in for patience this week.",
  'major-15': "The chain hangs loose at your neck and you've started to see that. It's strange, the day it stops feeling like fate. Or you keep returning to the thing by a smaller door, one more time, to prove you can stop. Both feel like freedom and neither quite is.",
  'major-16': "You felt the tremor and carried on setting the table. Beams propped against a wall that is already leaning, a little more plaster each week. Or the collapse happened privately and you've been dressed and smiling since. The phone hasn't rung and you're still waiting for it.",
  'major-17': "The shower ran cold and you stood in it anyway. A hope you'd once had has gone thin, and you've caught yourself measuring your path against everyone else's. The stars are still up there. You've been looking down, and it hasn't helped.",
  'major-18': "The fog is lifting and it's not all pleasant. A story you'd been telling about the dark turned out to have a very ordinary explanation, and you're a bit embarrassed. Or the fog hasn't lifted, and you've stopped asking it to. The dog has stopped howling, and the wolf hasn't gone far.",
  'major-19': "A child ran across the courtyard and you waved them off, preoccupied. A good result arrived and you shrugged it away before it could land. The sun is out and you're indoors, listing the reasons you don't deserve it, and the reasons are all very reasonable.",
  'major-20': "The message sat unopened for days, then weeks. Or you read it and heard only a verdict. The old trumpet is still going and you can't make out the note over the louder one inside. You're waiting for someone to say changing is allowed. Nobody will, and you may already know that.",
  'major-21': "On the last night of the trip you didn't go to the balcony. Nearly all the work is done, and one piece remains that you've been walking around for a week. Or you rushed the ending and now it doesn't feel complete. Finishing means starting again, and part of you would rather not.",

  // ── Cups ────────────────────────────────────────────────────────────────────
  'cups-ace': "The cup was handed to you and your hands stayed in your lap. It cooled where it stood. Something hurt you once and you've been polite about it since, keeping the door a careful finger's width shut. What's offered goes past you. Or you take everything and feel nothing, the cup refilling over a dry bottom.",
  'cups-2': "You and the friend both nod and the conversation circles. One of you carries most of the weight, or you both pretend the warmth is still there. The unspoken sentence sits between the two cups. It's been there long enough to gather dust and neither of you picks it up.",
  'cups-3': "The party went on and you left early without saying why. Or you stayed and counted who was doing better than you. The laughter in the next room sounded like a language you'd forgotten. A friendship you used to water has gone dry because nobody wanted to be the one to call first.",
  'cups-4': "You weren't offered something, or you didn't see it. Either way the grey has settled, and everything looks like a repeat. Something has begun, though, at the edge of the room: a tug, a small curiosity. You nearly missed it, and nearly dismissed it too.",
  'cups-5': "The spilled cups have been stared at for so long that grief has become a kind of address. Or you've turned round at last and seen the bridge, and you're a little angry it was always there. Both are honest. Mourning is allowed to be a place you live for a while, and also to end.",
  'cups-6': "You opened the old house and it was smaller than you remembered, and sadder. Or you've been keeping the past at arm's length so firmly that nothing from it can help. The golden afternoon has been polished so many times it's lost the grain. Today, with its ordinary light, is waiting quietly.",
  'cups-7': "The tabs are closing one by one and you can't tell if that's clarity or tiredness. Or you've kept them all open for so long that choosing has begun to feel like betrayal. A wish dissolves, and what's underneath is plainer and a lot more yours.",
  'cups-8': "You still haven't packed. The bag sits by the door and you step round it each morning. Staying out of habit, or fear of the empty stretch after a goodbye, or the sunk cost of everything poured in already. Or you left in a rage and the leaving didn't fix what you carried out with you.",
  'cups-9': "The meal came out right and you didn't taste it. The thing you wished for arrived, and it's slightly beside the point. A hollow place where the feeling should be. Or comfort has turned into smugness, and the plate gets refilled out of habit instead of hunger.",
  'cups-10': "The veranda is full and the conversations don't meet. The picture on the postcard doesn't match the house. Someone is missing, or someone is there and out of reach, and you keep comparing the real evening with one that never existed. The ordinary good thing is still on the table, if you look.",
  'cups-page': "The child's shell was met with a distracted nod. Or you performed delight you didn't feel. An odd little impulse arrived this week, to draw, to write, to ring someone, and you called it silly before it finished its sentence. It left a faint embarrassment behind, like laughing at the wrong place.",
  'cups-knight': "The handwritten letter was beautiful and arrived with nothing behind it. Or you wrote one yourself and never posted it. A lover of ideas who has never met the actual person; an affection that lives on the page and doesn't survive a Tuesday. Mood has been steering, and promises have been quietly outrunning follow-through.",
  'cups-queen': "You answered the late call and took on the whole weight of it. Hours later you can't tell whose feeling is whose, and your own has gone under. Or you've shut the door on everyone, to stay dry. Care that forgets its source runs out, and it has begun to.",
  'cups-king': "The father who stayed calm has become a locked room. Or feeling is being used like a lever, applied where it will get the result. A tide of mood, then a wall. In between, nobody says what's actually the matter, and the tea goes cold.",

  // ── Swords ──────────────────────────────────────────────────────────────────
  'swords-ace': "The sentence arrived and you said it too sharply. Or it never came, and the fog stays thick no matter how many times you walk through it. Truth has been used as a tool for scoring points. It doesn't light the room that way, and it leaves the speaker feeling oddly alone.",
  'swords-2': "The blindfold is slipping. For months you kept both emails unanswered, and now somebody else has answered for you. What you see turns out to be what you already suspected. A choice made late is still yours if you own it, though it's harder to feel proud of.",
  'swords-3': "You found a way to carry on without looking at the hurt, and it works until it's quiet. Work, noise, other people's trouble, all of it good company for the ache. Or the swords are beginning to slide out and the first relief is nearly as painful as the wound.",
  'swords-4': "The chair stays empty. You keep going, past the point where going helps, jaw tight, sleep shallow. Or you took to bed and stayed there so long it turned into a place to hide. A pause with purpose is different from an escape, and your body can tell which one this is.",
  'swords-5': "The argument has gone on past its reason, and now it's pride doing the talking. Or you walked away and you're still replaying it in the shower, drafting the better sentence. Someone is being unkind and calling it honesty. Someone else is learning, slowly, what winning costs.",
  'swords-6': "The ferry hasn't left and you're standing on the dock with your bag. Staying with a known pain feels safer than crossing choppy water. Or you got on and kept looking back, so that the passage never quite happened. The far shore is still there, quiet.",
  'swords-7': "The small lie is getting bigger. Or someone has found out and the air in the room has cooled. You've kept tiptoeing past the same spot for weeks. Coming clean usually feels worse in the anticipating than in the telling, and you may already know that.",
  'swords-8': "The ropes are slack and you haven't tested them. Or the blindfold slipped and you saw how much of the cage was a thought. Waiting to be rescued has become a habit, and the habit has a comfort to it. One small step within reach has gone untried.",
  'swords-9': "Morning came, and the thought is still there, but smaller. Or it isn't smaller and it has moved to the daytime. A fear that's been feeding on itself eventually runs short of food. Saying it aloud to another person is the oldest remedy, and the least used.",
  'swords-10': "You are trying to resurrect something that has finished. Or you've started to stand and are surprised by how thin the dawn is. It couldn't get worse and it hasn't. The wreckage is being clung to out of loyalty. Letting an ending be an ending is a quiet kind of mercy.",
  'swords-page': "The teenager's sharp tongue has turned meanness, or the questions are being collected like stamps, never used. A clever remark made you feel strong for a minute and left a faint sourness after. Quick isn't the same as kind, and you know the difference.",
  'swords-knight': "Your friend's truth landed and you fired back before it had settled. Or you've been wavering, a horse at the gate, never going. Speed has overtaken thought and left bruises on people you meant to protect. A breath before the next sprint would cost almost nothing.",
  'swords-queen': "Clarity has chilled into something colder. A sharp assessment came out as a wound. Or you see something clearly and are politely not saying so. The woman who was gentle where it mattered is nowhere in the room, and the room feels it.",
  'swords-king': "The judge is dogmatic, or absent. A rule got applied because it was easy, and the person standing there was not a rule. Or a decision has been put off because it's hard and somebody else will have to make it. Reason without mercy tends to be right and alone.",

  // ── Wands ───────────────────────────────────────────────────────────────────
  'wands-ace': "The idea woke you at five and you went back to sleep. It's in a drawer now, with its own slight glow. Or you started it, and the match went out. Waiting for the right moment has worked so well that the moment never turns up.",
  'wands-2': "On the rooftop you made no decision. You came down the stairs with the plan still folded in your pocket. Dithering feels like prudence from the inside. Or you leapt in a panic with no clear idea of where. The horizon is vague because making it specific would mean committing to it.",
  'wands-3': "The morning after sending it, nothing came back. You've started doubting the whole thing for want of evidence, and you keep checking the inbox. Or you're pulling on the rope to hurry the ships. Some things take longer than any estimate, and tugging doesn't help.",
  'wands-4': "The fairy lights stayed in their box. Everybody else celebrated and you skipped to the next task before the cake was cut. Or the party's on and the foundations are shaky and nobody mentions it. Happiness seems to need an invitation you haven't received.",
  'wands-5': "The group argument has gone quiet, but not settled. A sharp conversation was avoided in the name of peace and it's still sitting in the room. Or it ended and you're wrestling with it inside, alone. Either say the thing outright, or put the staff down.",
  'wands-6': "The applause was thin, or came for the wrong thing. You've done well and felt little. Perhaps the wish was for someone's approval, and the achievement was only the road. Pride is a bit loud. Doubt is louder, in the small hours.",
  'wands-7': "You've been defending the same ground for so long you've forgotten what's on it. Or you've given up a position that mattered. Tired from holding a line out of habit; picking fights that don't need picking. Some of what was worth guarding last year doesn't need you now.",
  'wands-8': "The messages stopped and the quiet is suspicious. Or they all arrived at once, crossed, mistimed, half the plans slipping. Speed that isn't pointing anywhere gets tiring quickly. You'd like your feet back on the ground for a minute.",
  'wands-9': "The last day of the hard thing, and you've nothing left. Or the danger ended weeks ago and you're still bracing, shoulders by your ears. Struggle gets so familiar that peace feels suspicious. Rest is on offer and you've been too braced to take it.",
  'wands-10': "Four flights up with the shopping and the bag finally split. Or you handed it over and felt guilty for a week. A belief that nobody else would do it right keeps the weight in place. Setting down one wand would cost something. So does carrying all of them.",
  'wands-page': "The friend's fifth plan sounds exactly like the first four, and you didn't ask how the others went. Or you were the one with the plan, all talk, nothing started, afraid of looking foolish. A beginner is allowed to look like one. Enthusiasm needs somewhere to go.",
  'wands-knight': "Your cousin's enthusiasm collided with a wall. He burned bright and then out, and somebody else made the calls to clean it up. Or the horse never left the stable, all that heat going nowhere. Impulse has run ahead of intention, and it's starting to sting.",
  'wands-queen': "She walked into the room and quietly made herself smaller. Or she performed a confidence that wasn't there, and everyone saw it. Dimming so other people can be comfortable is a form of going cold. Bravado is power's cheap costume.",
  'wands-king': "The founder's vision has become pressure. Or the reins are lying on the floor because holding them feels like too much. Pushing people on fear gets results for a while and then costs more than it gains. Control keeps borrowing conviction's coat.",

  // ── Pentacles ───────────────────────────────────────────────────────────────
  'pentacles-ace': "The envelope was on the table, unopened, until it went stale. A small chance was waved off for being small. Or a glittering plan drew attention away from the dull, real ground. A seed doesn't sprout in a pocket, and the pocket is where it's been.",
  'pentacles-2': "A ball dropped, then another. Three jobs, a family situation, and the milk forgotten again. Saying yes to everything left you present for nothing. Or you've stopped juggling entirely and the sky is full of everything you didn't catch. A simpler week would be allowed.",
  'pentacles-3': "The kitchen at the community hall was short of hands, and nobody said so. You were doing alone what ten could have done. Or the team was there and everyone was competing for credit. Somebody's work is going unacknowledged, maybe yours.",
  'pentacles-4': "The tin under the bed is full and the hand around it has gone white. Or the money has been spent so freely it doesn't register. The line between caution and hoarding is thin, and you've crossed it in both directions this year. A middle way exists.",
  'pentacles-5': "The warm window was across the street and you didn't cross. The cold may be easing; a little help is in sight, maybe was all along. Or you've turned down every offer, out of pride, and you're colder than you needed to be. Being helped doesn't make you less capable.",
  'pentacles-6': "A mango bag came with a string tied round the handle. Or you've given so much you've begun keeping score. The scales are crooked. Gifts are being counted, and the person counting is you. Receiving may be the harder half.",
  'pentacles-7': "The plant isn't growing as hoped, or you've dug it up to check. Weeks of watering with nothing showing, and doubt coming in the wet. It's possible to walk away from a field a week before it comes in. It's also possible that the field was the wrong one.",
  'pentacles-8': "The apprentice's hands are on the bench and her mind is somewhere else. Going through the motions, cutting a corner. The work was once a pleasure and has turned into a chore. Boredom may signal that it stopped being a challenge. Recommit, or move on honestly.",
  'pentacles-9': "The garden is lovely and there's nobody to show. Or the lovely surface is covering a crack you'd rather not look at. A great deal of effort goes into looking like it's all in hand. Asking for help and admitting how things stand might be a relief.",
  'pentacles-10': "The grandparents' house felt smaller and the dish tasted different. The family is strained, or the inheritance turned out other than expected. Wealth got put before people at some point. What you hoped to build may need redefining.",
  'pentacles-page': "The child's jar sits untouched. The plan is eternal and the doing never starts. Shiny things are good at pulling attention from slow ones. A chance to learn is sitting unused, and the first hour of the real work is still waiting.",
  'pentacles-knight': "Your friend, once steady, has become stuck. The routine runs on and the purpose has left. Or he hurried and something got dropped. Stubbornness can look like perseverance from inside. Sometimes the faithful thing is to change course.",
  'pentacles-queen': "The kitchen was warm, and the person running it hasn't eaten. Everyone else's meals get cooked, hers get skipped. A room, a budget, a body has been neglected, and caretaking has become a way to avoid her own life. Coming first, just this once, might be a kind of care.",
  'pentacles-king': "The shopkeeper has begun to count too hard, or has stopped looking at the books. Success soured into greed, or the accounts have been left to themselves. Wealth ran ahead of values at some point. Holding what you have a little more lightly is still possible.",
};
