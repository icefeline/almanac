import type { PatternSet } from './patterns';

/**
 * the reading of the six made-up sample dreams in `dreams.ts`, kept here so that opening the map costs nothing: no
 * request goes out until there are real dreams to read. the structure comes from a real reading of those dreams, and the
 * wording is written by hand to the interpreter's voice: a finding about the whole pattern rather than a tour of the dreams,
 * in four moves (a claim, what proves it, the real situations it may sit on, what you might notice), calm, lowercase,
 * british spelling. if the sample dreams change, this has to change with them. `sampleSet` only matches the exact dreams.
 */
export const SAMPLE_PATTERNS: PatternSet | null = {
  patterns: [
    {
      id: 'p1',
      name: 'a door waiting at the edge',
      kind: 'motif',
      dreams: [
        { id: 's1', detail: 'A door I never noticed led to water' },
        { id: 's4', detail: 'The door was locked' },
        { id: 's6', detail: 'At the bottom, a door' },
      ],
      gist: 'something you keep walking up to and never open',
      meaning:
        "the door sits at the exact point where a dream runs out: the bottom of a staircase, the end of a hallway. when it's described at all, it's locked. maybe there's a conversation you know is waiting, or a grief you've walked up to a few times without going in. if that's near the mark, you might notice what happens in your day just before you turn back.",
      watch: 'notice which conversation you walk up to and then step back from.',
    },
    {
      id: 'p2',
      name: 'a familiar house with wrong rooms',
      kind: 'place',
      dreams: [
        { id: 's1', detail: 'My house, but the rooms keep going' },
        { id: 's4', detail: 'The hallway was my old house' },
      ],
      gist: 'your old home is still bigger than you thought',
      meaning:
        "the house is yours, but it won't hold the size you remember. rooms keep going, and a hallway turns out to be the place you grew up in. old ground can hold more than you gave it credit for. maybe that's family history, or a version of yourself you thought you'd finished with. if so, you might notice which room you've never once gone into.",
      watch: 'notice which room of your past you steer around.',
    },
    {
      id: 'p3',
      name: 'warm water that holds you',
      kind: 'sense',
      dreams: [
        { id: 's3', detail: 'The water was warm' },
        { id: 's6', detail: 'the water got warmer' },
      ],
      gist: 'comfort is meeting you where you braced for threat',
      meaning:
        "water could have been the frightening part, and here it's warm, then warmer the further in you go. that reads as a body getting used to something large and unknown, and finding it kind. maybe there's a loss, or a feeling you've braced against for a long time. if so, you might notice the first moment this week you stop bracing and let it carry you.",
      watch: 'notice the moment you stop bracing against a feeling and let it carry you.',
    },
    {
      id: 'p4',
      name: 'counting that moves from them to you',
      kind: 'action',
      dreams: [
        { id: 's3', detail: 'Someone below kept counting' },
        { id: 's6', detail: 'Every step I counted' },
      ],
      gist: "you're taking over the keeping of the pace",
      meaning:
        "someone else does the counting from below, and later you count your own steps. that handover reads as moving from being timed to setting the measure yourself. maybe it's a task, a recovery or a stretch of life that other people have been keeping track of for you. if that's right, you might notice where you could set the pace and nobody would stop you.",
      watch: 'notice one thing this week where you could set the pace yourself.',
    },
    {
      id: 'p5',
      name: 'a known voice on the phone',
      kind: 'figure',
      dreams: [
        { id: 's2', detail: 'My phone had no signal and a voice I knew was calling' },
        { id: 's5', detail: 'It was my mother, who died. We talked about the moon.' },
      ],
      gist: 'someone you know is trying to reach you',
      meaning:
        "a voice you know keeps trying to get through a phone that won't cooperate, and when it finally does, it talks about something ordinary. what's wanted looks more like contact than news. maybe it's a person you've been meaning to call, or a part of yourself that's been hard to hear. if so, you might notice which call or message you keep letting ring.",
      watch: 'notice which call or message you have been letting ring.',
    },
    {
      id: 'p6',
      name: 'arriving unready and behind',
      kind: 'feeling',
      dreams: [
        { id: 's2', detail: 'a train that was already leaving' },
        { id: 's4', detail: 'an exam I had not studied for' },
      ],
      gist: 'you feel a step behind something already underway',
      meaning:
        "the dream starts after the moment that mattered: the train is already leaving, the exam already under way. maybe there's something you feel you ought to have finished by now, with a deadline that lives more in your head than on any calendar. if so, you might notice who set it.",
      watch: 'notice one thing you feel late for and who set that deadline.',
    },
  ],
  links: [
    { a: 'p1', b: 'p2', why: 'the door turns up inside the house, so the past hides the threshold' },
    { a: 'p3', b: 'p4', why: 'the counting happens over or inside the warming water' },
    { a: 'p4', b: 'p1', why: 'counting steps down is how you reach the door at the bottom' },
    { a: 'p6', b: 'p5', why: 'missing the train leaves the voice calling, and later it connects' },
  ],
  throughline:
    "these dreams keep stopping you just short of something: a door, a voice, a way down to the water. they also get kinder as they go, with a call that finally connects and water that turns warm. maybe there's something real you've been circling, a conversation or a loss, that's closer to reachable than it used to be. if so, you might notice what feels different this week.",
};
