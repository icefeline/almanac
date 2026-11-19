import type { PatternSet } from './patterns';

/**
 * the reading of the six made-up sample dreams in `dreams.ts`, kept here so that opening the map costs nothing: no
 * request goes out until there are real dreams to read. the structure comes from a real reading of those dreams, and the
 * wording is written by hand to the house voice (lowercase, british spelling, a noticing prompt rather than a to-do).
 * if the sample dreams change, this has to change with them. `sampleSet` only matches the exact dreams.
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
      gist: 'something you want to reach is just past a threshold',
      meaning:
        'doors keep turning up at the exact point where a dream stops and something else begins. in one you find it, in one it is locked, in one it is simply where the steps end. there may be a decision or a conversation you know is waiting, a grief or a change you keep walking up to and not opening.',
      watch: 'notice which conversation you walk up to all week and then step back from.',
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
        "the house is yours, yet it won't hold the size or shape you remember. old ground can turn out to hold more than you gave it credit for. it might be family history, or a version of yourself you thought you'd finished with, that still has rooms you haven't walked into.",
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
        'the sea could have been frightening, and instead it is warm, then warmer. your body seems to be getting used to something large and unknown, and finding it kind. there may be a loss or a feeling you used to brace against that you can now float in.',
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
      gist: 'you are taking over the keeping of the pace',
      meaning:
        'first someone else counts while you float above, then you count your own steps down. you may be moving from being watched or timed to setting the measure yourself, perhaps with a task or a recovery that others have been keeping track of for you.',
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
        "in the first dream the voice can't get through. in the second it does, and it is your mother, talking about the moon as if it were an ordinary thing. there may be contact you are waiting for, from a person or from a part of yourself that has been hard to hear. calls that connect after calls that fail often follow a long silence.",
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
        "both dreams begin after the moment you needed to be ready. the train is already going and the exam has already started. there may be something you feel behind on that has a deadline in your head more than on any calendar, a task you feel you ought to have finished by now.",
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
    'these dreams seem to be organised around reaching something just out of reach, whether a voice, a door or a place under the water. over the weeks the missed trains and locked doors give way to a call that connects and water that grows warmer, as if the approach is slowly working.',
};
