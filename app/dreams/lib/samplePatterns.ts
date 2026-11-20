import type { PatternSet } from './patterns';

/**
 * the reading of the six made-up sample dreams in `dreams.ts`, kept here so that opening the map costs nothing: no
 * request goes out until there are real dreams to read. the structure comes from a real reading of those dreams, and the
 * wording is written by hand to the voice in the patterns route: one specific paragraph per pattern, built from the dreams'
 * own objects, how the thing changes between appearances, what is missing, and one attributed idea. lowercase, british
 * spelling. if the sample dreams change, this has to change with them. `sampleSet` only matches the exact dreams.
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
        "the door has been to three places. it opened onto still, deep water in the house where you'd never noticed it before, it stood locked at the end of a hallway that was your old home, and it waited at the bottom of the stairs you counted down one by one. the same door gave you a different reason to stop each time, and by the last one the water around you had already gone warm. researchers who study repeating dreams often say a mind goes back to what it hasn't finished, and the order here fits that: something you couldn't see, then couldn't open, then walked a whole staircase towards. the part worth watching is who you were counting for, because a few dreams earlier someone else was doing it for you.",
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
        "the house refuses to stay the size you remember. in one dream the rooms go on past where any house could end, and three weeks on, the school hallway you're sent down for an exam you haven't studied for turns out to be your old home. dream readers often treat the house as the mind's default picture of the self, so extra rooms tend to read as extra history. nothing in either dream says you went into any of them. the exam arrives inside the house, which puts the unprepared feeling where you grew up, and what stays unexplained is the one door in that hallway that was locked.",
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
        "the water is the one thing in these dreams that was allowed to frighten you and didn't. it starts out still and very deep behind a door you'd never noticed, turns warm under a moon hung too close over the sea, and gets warmer with every step on the stairs inside the ocean. the direction never changes: the further in you go, the kinder it gets. dream readers commonly take water for feeling, and temperature is the easy way to tell which feeling it is. maybe that's a loss, or something you've braced against for years. the odd detail is that nobody is in the water with you, only a voice somewhere keeping count.",
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
        "the counting changes hands. over the sea someone below keeps the count while you float, and in the stairs inside the ocean it's you, step by step, with the water warming each time you say a number. dream readers often link counting to timing, a wait that has an end. what's missing is the figure: in neither dream do you say what you're counting towards, and the second one stops at a door. so you may be moving from being timed to setting the pace, or taking over a count someone else was keeping for you. there may be something in your week with a number on it that nobody says out loud.",
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
        "the voice reaches you through a bad line first and a stranger's hand second. on the platform you can hear someone you know and can't get a signal, and three weeks later the phone is already ringing when it's handed to you, and it's your mother, and she talks about the moon. nothing urgent, no message to carry. people who have lost someone often report exactly this kind of dream, an ordinary talk, and say they're the ones that stay. the moon was hanging too close over the sea more than two weeks before, so the conversation may have been on its way for a while. the part nobody explains is the stranger who passed you the phone.",
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
        "both dreams start after the moment that could have gone right. the train is already leaving while you run for it, and the exam is already in front of you with nothing studied. neither one shows the instant you decided anything, only you arriving in the middle of a consequence. surveys of common dreams keep putting being late and unprepared near the top, so the shape is shared, but the furnishings are yours. on the platform there's a voice you know, and in the exam hall the corridor is your old house. the lateness comes with company, which is the detail to watch, because a deadline with someone fond waiting inside it is hardly an emergency.",
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
    "across six dreams, from the second of october to the eleventh of november, you keep arriving at the edge of something: a train already gone, a door that's locked, a call with no signal, an exam already under way. but the edges change as they go. the water turns from still and deep to warm, the counting passes from someone else to you, and the phone that wouldn't connect becomes an ordinary conversation about the moon. researchers who study dreams often say a mind works at what it hasn't finished until it can be handled, and these read like something unfinished becoming handleable. the last dream ends at the bottom of the stairs, at a door you haven't opened, and it's the first time you walked all the way down on your own.",
};
