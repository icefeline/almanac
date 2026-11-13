/**
 * Insight Structure Templates - Synthesis-Focused
 */

export interface InsightStructureTemplate {
  id: string;
  structure: string;
  bestFor: {
    transitTone: ('challenging' | 'neutral' | 'expansive')[];
    cardTone: ('challenging' | 'neutral' | 'expansive')[];
  };
  description: string;
}

export const insightStructureTemplates: InsightStructureTemplate[] = [
  {
    id: 'direct',
    structure: '{synthesis}',
    bestFor: {
      transitTone: ['challenging', 'neutral', 'expansive'],
      cardTone: ['challenging', 'neutral', 'expansive']
    },
    description: 'Just the synthesis, nothing else'
  }
];

export const natalPlanetMeanings: Record<string, string[]> = {
  sun: ['your sense of who you are', 'the part of you that wants to be seen', 'your steady centre', 'your vitality'],
  moon: ['your inner weather', 'how you feel things before you can say them', 'your instincts', 'the way you soothe yourself'],
  mercury: ['how your mind turns things over', 'your voice', 'the way you put things into words', 'your habits of thought'],
  venus: ['what you\'re drawn to', 'how you love', 'what you find beautiful', 'what you value'],
  mars: ['your drive', 'how you go after what you want', 'your temper and your nerve', 'your appetite for a fight'],
  jupiter: ['where you look for meaning', 'your sense of possibility', 'your faith in how things might turn out', 'your generosity']
};

export const transitingPlanetActions: Record<string, string[]> = {
  saturn: ['pressing on what is load-bearing', 'testing which foundations are real', 'slowing things down until they show their weight', 'asking for a more honest structure'],
  jupiter: ['widening the frame', 'making more room than usual', 'bringing in a bit of luck or generosity', 'stretching what feels possible'],
  uranus: ['loosening a habit that felt permanent', 'sending an unexpected jolt of insight', 'unsettling what had gone stale', 'nudging toward something truer'],
  neptune: ['softening edges that were too sharp', 'making what was certain a little blurry', 'raising the volume on intuition', 'asking what lies behind the story'],
  pluto: ['working at the roots', 'bringing what was buried closer to the surface', 'stirring something you\'d put away', 'wearing away what can\'t continue']
  ,mars: ['raising the heat', 'adding urgency', 'stirring courage or irritation', 'pushing for movement']
};

export const aspectDescriptions: Record<string, string[]> = {
  square: ['squaring', 'rubbing against', 'pressing on'],
  opposition: ['facing', 'pulling against', 'standing across from'],
  conjunction: ['sitting on', 'merging with', 'lying right alongside'],
  trine: ['trining', 'moving easily with', 'warming'],
  sextile: ['opening a side door to', 'offering a modest opening to', 'leaning toward']
};

export const cardArchetypeSynthesis: Record<string, { synthesis: string[]; action: string }> = {

  // ── MAJOR ARCANA ────────────────────────────────────────

  'major-0': {
    synthesis: [
      'there may be a start you keep rehearsing instead of making. {transiting_planet} is touching your {natal_planet} around {house_theme}, and the fool\'s habit of stepping before the map is finished sits close to the surface',
      'no plan around {house_theme} has become complete enough to feel safe, and it may not. {transiting_planet} on your {natal_planet} brings the edge into view, and part of you already seems to be looking over it',
      'a light-footed curiosity is hovering near {house_theme}. {transiting_planet} meets your {natal_planet} there, and the pull is toward the unplanned version of things'
    ],
    action: 'pay attention to the moment you start tidying a plan that is already good enough. let your eyes rest on something far away for a few seconds and see whether the urge to begin changes'
  },

  'major-1': {
    synthesis: [
      'what you need for {house_theme} may already be on the table. {transiting_planet} works on your {natal_planet}, and the skill you have stopped counting is the one doing the quiet work',
      'around {house_theme}, there is a gap between what you can do and what you give yourself credit for. {transiting_planet} lights your {natal_planet} and the gap becomes easier to see',
      'you are more equipped than the story you tell about {house_theme}. {transiting_planet} against your {natal_planet} puts the tools back in view'
    ],
    action: 'watch for the sentence where you say you lack something. press your thumb into your open palm and name, silently, one thing in reach that you already use well'
  },

  'major-2': {
    synthesis: [
      'a knowing is gathering around {house_theme} without much language. {transiting_planet} brushes your {natal_planet} and the quieter signals get a little louder',
      'part of you has already noticed what {house_theme} is about. {transiting_planet} meets your {natal_planet}, and what it knows may arrive as a feeling in the body before it turns into a sentence',
      'a truth is being held back, maybe by you, near {house_theme}. {transiting_planet} on your {natal_planet} makes the silence around it easier to hear'
    ],
    action: 'catch the moment you explain a feeling away. stay in your body for one slow breath before the explanation finishes'
  },

  'major-3': {
    synthesis: [
      'a slow crop near {house_theme} is growing at its own speed. {transiting_planet} warms your {natal_planet}, and the pace it keeps may not match the pace you\'ve been demanding',
      'there is a soft abundance close to {house_theme}, easier to miss when you\'re counting what\'s undone. {transiting_planet} on your {natal_planet} makes it more tangible',
      'care has been flowing outward around {house_theme}. {transiting_planet} meets your {natal_planet} and turns some of it back toward you, if you let it'
    ],
    action: 'notice where you check on something that only needs time. rest a hand on your belly or your chest for a few breaths and register what it is like to be tended'
  },

  'major-4': {
    synthesis: [
      'a boundary around {house_theme} is asking to be named. {transiting_planet} presses on your {natal_planet}, and the structure you have been holding up without applause is the one doing the work',
      'the question of who is in charge shows up near {house_theme}. {transiting_planet} against your {natal_planet} makes the answer more visible, whether it is steady or tight',
      'order in {house_theme} may feel either like shelter or like bracing. {transiting_planet} and your {natal_planet} sit in the room, and both readings might be true'
    ],
    action: 'catch the clench of a rule you are enforcing, on yourself or another person. plant both feet and check whether your shoulders can drop an inch'
  },

  'major-5': {
    synthesis: [
      'an inherited way of doing things shows up near {house_theme}. {transiting_planet} on your {natal_planet} brings it forward, and some of it may still fit while some may only be familiar',
      'there is a voice from the past in how you handle {house_theme}. {transiting_planet} meets your {natal_planet} and the voice gets harder to mistake for your own',
      'a custom or a teacher is worth looking at where {house_theme} is concerned. {transiting_planet} touches your {natal_planet}, and the difference between loyalty and habit may show'
    ],
    action: 'watch for a should that arrives sounding like someone else. let it finish, then say quietly whose voice it is'
  },

  'major-6': {
    synthesis: [
      'a choice about what you value is sitting close to {house_theme}. {transiting_planet} meets your {natal_planet}, and whichever way you lean has less to do with attraction than with who you want to be there',
      'around {house_theme}, closeness and self-respect may be pulling at different ends of the same rope. {transiting_planet} tugs your {natal_planet} and both ends become visible',
      'there may be a yes in {house_theme} that doesn\'t match what you\'ve been saying. {transiting_planet} on your {natal_planet} makes the mismatch easier to feel'
    ],
    action: 'catch the moment you soften a truth to keep the peace. press your feet into the floor and feel whether the sentence you were about to say is still true'
  },

  'major-7': {
    synthesis: [
      'there is momentum around {house_theme}, and it needs a direction more than a boost. {transiting_planet} drives your {natal_planet} and the two opposing pulls in you may be wanting the same road',
      'effort near {house_theme} may be going in two directions at once. {transiting_planet} on your {natal_planet} brings the strain into focus before it brings the speed',
      'your will is available where {house_theme} is concerned. {transiting_planet} meets your {natal_planet}, and what it needs from you is a single, clear line'
    ],
    action: 'catch the second you reach for a different task halfway through one. hold the original task in your hands, literally, for one slow breath before deciding'
  },

  'major-8': {
    synthesis: [
      'a wild feeling near {house_theme} may respond better to company than to handling. {transiting_planet} touches your {natal_planet} and the milder approach seems to be the stronger one',
      'there\'s a kind of courage around {house_theme} that doesn\'t look like courage from outside. {transiting_planet} meets your {natal_planet}, and patience carries most of it',
      'a loud feeling in {house_theme} is roaring and may only want to be heard. {transiting_planet} on your {natal_planet} softens the way you might approach it'
    ],
    action: 'watch for the instant you tighten up against a feeling. open your hands on your lap, palms up, and let the feeling be there for a few breaths'
  },

  'major-9': {
    synthesis: [
      'quiet is calling around {house_theme}. {transiting_planet} meets your {natal_planet}, and the answer you\'ve wanted may be on the far side of less noise',
      'there is a lamp lit near {house_theme} that lights only the next few steps. {transiting_planet} on your {natal_planet} is enough for tonight',
      '{house_theme} may be easier to see from a distance. {transiting_planet} touches your {natal_planet} and the pull toward solitude reads as information, not avoidance'
    ],
    action: 'notice the first place you reach for noise: a screen, a podcast, a message. put the thing down for a minute and listen to what the room sounds like'
  },

  'major-10': {
    synthesis: [
      'a tide around {house_theme} is turning and not asking permission. {transiting_planet} on your {natal_planet} marks the turn, and some of it is luck instead of your doing',
      'a pattern near {house_theme} may be repeating, or finishing. {transiting_planet} meets your {natal_planet}, and the shape of the cycle is easier to trace',
      '{house_theme} may feel like it\'s moving without you. {transiting_planet} against your {natal_planet} suggests it is a larger rhythm, not a verdict'
    ],
    action: 'catch the moment you ask when this will be over. watch something that moves, a cloud or a curtain, for ten seconds and let that be the pace'
  },

  'major-11': {
    synthesis: [
      'a truth is getting weighed near {house_theme}. {transiting_planet} meets your {natal_planet}, and fairness in this one has to include you',
      'around {house_theme}, the honest thing and the easy thing may be one inch apart. {transiting_planet} on your {natal_planet} makes the inch visible',
      'a consequence from earlier is arriving at {house_theme}. {transiting_planet} touches your {natal_planet} and the account looks clearer than it did'
    ],
    action: 'watch for the moment you tell the story so that you come out fairly. say the plainer version once, silently, and feel what it does to your jaw'
  },

  'major-12': {
    synthesis: [
      'a pause near {house_theme} is doing more than it looks like. {transiting_planet} meets your {natal_planet}, and the view from this odd angle might be the useful one',
      'waiting around {house_theme} is not nothing. {transiting_planet} on your {natal_planet} slows what you\'d like to hurry, and something shows up because of it',
      'you may be suspended near {house_theme} by choice, or by habit. {transiting_planet} touches your {natal_planet}, and the difference starts to show'
    ],
    action: 'catch the moment you try to fill a pause. let it stay empty for one full exhale and see what it holds'
  },

  'major-13': {
    synthesis: [
      'a chapter near {house_theme} has finished, or nearly. {transiting_planet} meets your {natal_planet}, and holding it up may be costing more than letting it fall',
      'an old version of how you handle {house_theme} is wearing thin. {transiting_planet} on your {natal_planet} loosens the stitching',
      'there is grief and room together around {house_theme}. {transiting_planet} touches your {natal_planet}, and they tend to arrive in the same hour'
    ],
    action: 'notice what you\'re propping up out of habit. unclench your hands and see which part of you feels relief and which part feels afraid'
  },

  'major-14': {
    synthesis: [
      'two parts of you near {house_theme} are trying to find a mix. {transiting_planet} meets your {natal_planet}, and haste is the only thing getting in the way',
      'around {house_theme}, the right proportion may be smaller than you\'ve been aiming for. {transiting_planet} on your {natal_planet} favours the slow pour',
      'you may be swinging, near {house_theme}, between too much and not enough. {transiting_planet} touches your {natal_planet} and the middle is available'
    ],
    action: 'catch the lurch toward all or nothing. take one slow sip of water and see what a measured amount of anything feels like'
  },

  'major-15': {
    synthesis: [
      'a habit near {house_theme} feels more fixed than it is. {transiting_planet} meets your {natal_planet}, and the chain is looser than the story about it',
      'a habit pays you in comfort around {house_theme}. {transiting_planet} on your {natal_planet} makes the payment visible',
      'there\'s a pull in {house_theme} you might not want to look at. {transiting_planet} touches your {natal_planet}, and looking at it is not the same as obeying it'
    ],
    action: 'watch for the pull a moment before you act on it. keep your hands still and notice where in your body it lives'
  },

  'major-16': {
    synthesis: [
      'a wall around {house_theme} is not holding, and some part of you knew. {transiting_planet} hits your {natal_planet} and the false wall goes first',
      'the foundation near {house_theme} might be shakier than it was presented. {transiting_planet} on your {natal_planet} brings it to the surface',
      'a truth about {house_theme} is getting louder than the story. {transiting_planet} meets your {natal_planet} and the noise may feel like loss before it feels like air'
    ],
    action: 'notice where you rush to repair something that is better left to clear, like silt. feel the floor under you for a moment, and register that it is still there'
  },

  'major-17': {
    synthesis: [
      'there is a thin, steady light near {house_theme}. {transiting_planet} meets your {natal_planet} and a light that was dimmed after a rough stretch is returning',
      'healing around {house_theme} is slow and quiet. {transiting_planet} touches your {natal_planet}, and it may only show as a little more room',
      'you might be a few degrees more hopeful about {house_theme} than you\'ve admitted. {transiting_planet} on your {natal_planet} lets it show'
    ],
    action: 'catch the moment you dismiss a small good feeling as naive. let it stay for a few slow breaths, hand on your chest'
  },

  'major-18': {
    synthesis: [
      'near {house_theme}, the light is poor and imagination is running loud. {transiting_planet} on your {natal_planet} makes fears and intuitions sound alike',
      'the picture around {house_theme} isn\'t clear yet, and doesn\'t have to be. {transiting_planet} meets your {natal_planet}, and the fog is part of the information',
      'the worry in {house_theme} may be older than its current reason. {transiting_planet} touches your {natal_planet} and the older layer surfaces'
    ],
    action: 'watch for the story that fills a blank with the worst case. name the feeling once, silently, and notice that it is quieter once named'
  },

  'major-19': {
    synthesis: [
      'there is plain warmth near {house_theme}, available without a reason. {transiting_planet} meets your {natal_planet} and the light seems less guarded',
      'one corner of {house_theme} may simply be going well. {transiting_planet} on your {natal_planet} makes it hard to talk yourself out of it',
      'you might be allowed to be visible around {house_theme}. {transiting_planet} touches your {natal_planet}, and the dimmer switch is within reach'
    ],
    action: 'catch the habit of adding a caveat to good news. turn your face toward any light in the room for a few seconds before saying the caveat, or not'
  },

  'major-20': {
    synthesis: [
      'a call is sounding near {house_theme}, and it\'s mostly forgiveness. {transiting_planet} meets your {natal_planet}, and the old account is ready to be read kindly',
      'a leftover from the past around {house_theme} is asking to be seen without a verdict. {transiting_planet} on your {natal_planet} opens the door a little',
      'the harshest judge near {house_theme} may be inside. {transiting_planet} touches your {natal_planet} and the voice sounds more familiar than fair'
    ],
    action: 'notice when your inner commentary turns to verdict. say your own name silently and see if the next sentence changes tone'
  },

  'major-21': {
    synthesis: [
      'a cycle around {house_theme} is closing, whether or not you\'ve marked it. {transiting_planet} meets your {natal_planet} and the edges of the thing are suddenly visible',
      'you\'ve come further near {house_theme} than the daily view lets on. {transiting_planet} on your {natal_planet} gives you a place to see it from',
      'a long stretch is nearly finished in {house_theme}. {transiting_planet} touches your {natal_planet}, and the remaining piece is smaller than it feels'
    ],
    action: 'catch the urge to move straight on to the next thing. stand still for one breath and say what the finished thing taught'
  },


  // ── CUPS ────────────────────────────────────────

  'cups-ace': {
    synthesis: [
      'a feeling is being offered near {house_theme}, and receiving it is the harder half. {transiting_planet} meets your {natal_planet}, and something raw is asking for room',
      'the cup is already overflowing around {house_theme}. {transiting_planet} touches your {natal_planet}, and being filled may feel odd after a dry stretch',
      'there may be a softening in {house_theme} you haven\'t named yet. {transiting_planet} on your {natal_planet} brings it up'
    ],
    action: 'catch the small flinch when kindness or warmth comes toward you. let a sip of something warm be exactly that for ten seconds, without a task attached'
  },

  'cups-2': {
    synthesis: [
      'someone near {house_theme} is turning toward you, or you toward them. {transiting_planet} meets your {natal_planet}, and the exchange is the kind that runs both ways',
      'around {house_theme}, reciprocity is easier to feel than to explain. {transiting_planet} on your {natal_planet} shows who\'s meeting whom',
      'a pairing in {house_theme} is asking to be seen as it is. {transiting_planet} touches your {natal_planet}, and evenness matters more than intensity'
    ],
    action: 'watch who you give more to and who gives more to you. rest your hands on a warm mug or your own forearms and register what balanced feels like'
  },

  'cups-3': {
    synthesis: [
      'there\'s company worth sitting in around {house_theme}. {transiting_planet} meets your {natal_planet}, and shared gladness might go down better than private gladness',
      'a table is set near {house_theme}, and you might be on the guest list. {transiting_planet} on your {natal_planet} turns your head toward the room',
      'joy around {house_theme} seems to be a group thing today. {transiting_planet} touches your {natal_planet}, and being seen as happy is part of it'
    ],
    action: 'notice who you think of when something good happens. keep that face in mind for a breath and see what your shoulders do'
  },

  'cups-4': {
    synthesis: [
      'an offer is open near {house_theme} and attention is turned inward. {transiting_planet} meets your {natal_planet}, and the flatness may be hiding an appetite',
      'around {house_theme}, boredom might be more like a closed door than an empty room. {transiting_planet} on your {natal_planet} knocks on it',
      'you may be declining something in {house_theme} before it has finished arriving. {transiting_planet} touches your {natal_planet}, and a second look is possible'
    ],
    action: 'catch the shrug that says nothing here is interesting. lift your eyes to the farthest point in the room and see if anything has changed in your appetite'
  },

  'cups-5': {
    synthesis: [
      'a loss near {house_theme} has your full attention, and it has earned it. {transiting_planet} meets your {natal_planet}, and what still stands waits patiently behind you',
      'grief around {house_theme} is being honest about its size. {transiting_planet} on your {natal_planet} doesn\'t hurry it',
      'you might be looking at what spilled in {house_theme}. {transiting_planet} touches your {natal_planet}, and two cups remain upright just out of view'
    ],
    action: 'notice where the sadness sits in your body and put a hand there. stay for a minute, and let the hand be the only plan'
  },

  'cups-6': {
    synthesis: [
      'an old memory surfaces near {house_theme}, soft and specific. {transiting_planet} meets your {natal_planet}, and a younger version of you has something to say',
      'around {house_theme}, a memory is doing quiet work. {transiting_planet} on your {natal_planet} warms it',
      'an early kindness is coming back around in {house_theme}. {transiting_planet} touches your {natal_planet} and the old sweetness has a use now'
    ],
    action: 'catch the memory that arrives uninvited. let it play out, then look at one thing in the room as it is today'
  },

  'cups-7': {
    synthesis: [
      'options are floating near {house_theme}, each lit differently. {transiting_planet} meets your {natal_planet}, and the daydreams are most generous at a distance',
      'around {house_theme}, imagining is easier than choosing. {transiting_planet} on your {natal_planet} makes both visible',
      'several versions of {house_theme} are on offer. {transiting_planet} touches your {natal_planet} and one of them might be tugging harder than the rest'
    ],
    action: 'catch the moment you add one more possibility to the pile. pick up any real object near you and notice what it\'s like to have only one thing in your hand'
  },

  'cups-8': {
    synthesis: [
      'a setup near {house_theme} still looks fine and has stopped feeding you. {transiting_planet} meets your {natal_planet}, and the walking-away part of you is already awake',
      'around {house_theme}, there may be a quiet leaving going on in you. {transiting_planet} on your {natal_planet} makes it audible',
      'you might have outgrown a corner of {house_theme}. {transiting_planet} touches your {natal_planet}, and the outgrowing is not a failure'
    ],
    action: 'notice the small relief you feel imagining a different arrangement. keep your breathing slow and let that relief tell you something before the argument starts'
  },

  'cups-9': {
    synthesis: [
      'a result near {house_theme} has turned out well, and you moved past it quickly. {transiting_planet} meets your {natal_planet} and slows the clock',
      'satisfaction around {house_theme} is allowed to be plain. {transiting_planet} on your {natal_planet} gives it a seat',
      'a wish touching {house_theme} may already be partly met. {transiting_planet} touches your {natal_planet}, and savouring is part of receiving'
    ],
    action: 'catch the glance toward the next thing. stay with one good detail from today for three slow breaths'
  },

  'cups-10': {
    synthesis: [
      'belonging around {house_theme} is built from small repeated things. {transiting_planet} meets your {natal_planet}, and the ordinary parts of it are easier to see',
      'a sense of home is near {house_theme}, imperfect and real. {transiting_planet} on your {natal_planet} warms it',
      'there may be people in {house_theme} who make the room softer. {transiting_planet} touches your {natal_planet}, and being held counts'
    ],
    action: 'notice one ordinary kindness that keeps a place feeling like yours. let your attention rest on it while a slow breath goes out'
  },

  'cups-page': {
    synthesis: [
      'a small, slightly odd impulse is surfacing near {house_theme}. {transiting_planet} meets your {natal_planet}, and curiosity may do better than analysis',
      'around {house_theme}, a feeling has turned up in a playful costume. {transiting_planet} on your {natal_planet} lets it say hello',
      'something bruised in {house_theme} wants to be taken seriously and not solemnly. {transiting_planet} touches your {natal_planet} and the tone of it is light'
    ],
    action: 'catch the moment you wave off an idea as silly. give it ten seconds of real attention, like you would a child\'s question'
  },

  'cups-knight': {
    synthesis: [
      'a romantic pull is moving near {house_theme}. {transiting_planet} meets your {natal_planet}, and it\'s the feeling rather than the logic that is leading',
      'around {house_theme}, you may be following a beauty you can\'t yet justify. {transiting_planet} on your {natal_planet} offers a slow, sincere ride',
      'there\'s a devotion forming in {house_theme}. {transiting_planet} touches your {natal_planet}, and it might be for a person, a craft or an idea'
    ],
    action: 'notice where the pull is strongest and whether it\'s drawn to the real thing or the picture of it. press a palm flat on a surface and feel what\'s solid'
  },

  'cups-queen': {
    synthesis: [
      'you carry more of other people\'s weather than usual near {house_theme}. {transiting_planet} meets your {natal_planet}, and your own is the one to check',
      'a steady, perceptive presence is available around {house_theme}. {transiting_planet} on your {natal_planet} deepens it, and it extends to you',
      'feeling a lot near {house_theme} may be a skill instead of a flaw. {transiting_planet} touches your {natal_planet}, and boundaries keep it clean'
    ],
    action: 'catch the moment you absorb someone else\'s mood. press a cool object to your wrist and ask in silence whose feeling this is'
  },

  'cups-king': {
    synthesis: [
      'a calm that has been earned sits near {house_theme}. {transiting_planet} meets your {natal_planet}, and feeling the wave doesn\'t need to mean obeying it',
      'around {house_theme}, there is a way to feel everything and keep your head. {transiting_planet} on your {natal_planet} makes that stance more reachable',
      'emotion and judgement may be sharing the same room in {house_theme}. {transiting_planet} touches your {natal_planet}, and neither needs to leave'
    ],
    action: 'notice the beat between a strong feeling and the reply. let that beat be a full exhale long'
  },


  // ── SWORDS ────────────────────────────────────────

  'swords-ace': {
    synthesis: [
      'a fact has gone clear near {house_theme}. {transiting_planet} meets your {natal_planet}, and a fact you can\'t unsee has come into focus',
      'around {house_theme}, a sentence you\'ve been circling is almost sayable. {transiting_planet} on your {natal_planet} sharpens it',
      'a clean cut of understanding is arriving in {house_theme}. {transiting_planet} touches your {natal_planet}, and it may feel like relief and a bruise at once'
    ],
    action: 'catch the moment before you say the true thing sharply. unclench your jaw and let one slow exhale go before you speak'
  },

  'swords-2': {
    synthesis: [
      'a decision near {house_theme} is being held at arm\'s length. {transiting_planet} meets your {natal_planet}, and keeping both options open has its own price',
      'around {house_theme}, the blindfold may be mostly habit. {transiting_planet} on your {natal_planet} loosens a corner',
      'you might already know what you\'d choose in {house_theme}. {transiting_planet} touches your {natal_planet}, and the not-looking is the part that takes energy'
    ],
    action: 'notice the topic your thoughts skate over. close your mouth, breathe out slowly, and look at it for three seconds'
  },

  'swords-3': {
    synthesis: [
      'a hurt near {house_theme} is allowed its own size. {transiting_planet} meets your {natal_planet}, and the sore spot is more honest than the explanations around it',
      'a hurt went in deep around {house_theme}. {transiting_planet} on your {natal_planet} lets it be felt without needing to repair it today',
      'grief and truth are in the same sentence near {house_theme}. {transiting_planet} touches your {natal_planet}, and the sentence doesn\'t need an ending'
    ],
    action: 'notice where the hurt lives physically. rest a hand on that spot and breathe out slowly twice'
  },

  'swords-4': {
    synthesis: [
      'rest is overdue near {house_theme}. {transiting_planet} meets your {natal_planet}, and the stillness is part of the work',
      'after a fight, around {house_theme}, comes the quiet nobody films. {transiting_planet} on your {natal_planet} offers it',
      'you might be exhausted in {house_theme} more than you\'ve admitted. {transiting_planet} touches your {natal_planet}, and a pause is not a retreat'
    ],
    action: 'catch the voice that says keep going. let your shoulders drop and rest your eyes on one still point for a full breath'
  },

  'swords-5': {
    synthesis: [
      'a fight near {house_theme} may be won and still feel empty. {transiting_planet} meets your {natal_planet}, and the cost of winning is getting clearer',
      'around {house_theme}, being right and being close pull apart. {transiting_planet} on your {natal_planet} brings that into the open',
      'an argument in {house_theme} has left a sour air. {transiting_planet} touches your {natal_planet}, and pride is guarding a bruise'
    ],
    action: 'notice the moment you reach for the last word. exhale through your mouth and see whether you still want it'
  },

  'swords-6': {
    synthesis: [
      'you may be leaving rough water near {house_theme}. {transiting_planet} meets your {natal_planet}, and the crossing is quiet more than thrilling',
      'a load is being left on the near shore around {house_theme}. {transiting_planet} on your {natal_planet} steadies the boat',
      'a calmer stretch is possible in {house_theme}. {transiting_planet} touches your {natal_planet}, and distance may be part of the healing'
    ],
    action: 'notice what you\'re still carrying across with you. set one thing down mentally and feel your hands lighten'
  },

  'swords-7': {
    synthesis: [
      'a bit of cleverness is at work near {house_theme}. {transiting_planet} meets your {natal_planet}, and the question is whether it is strategy or avoidance',
      'around {house_theme}, a shortcut might be tempting. {transiting_planet} on your {natal_planet} puts a light on it',
      'an unsaid sentence in {house_theme} is making you tiptoe. {transiting_planet} touches your {natal_planet}, and the plain version might be lighter'
    ],
    action: 'catch the glance over your shoulder. plant both feet and say the unedited sentence silently, just to hear it'
  },

  'swords-8': {
    synthesis: [
      'the cage near {house_theme} has slack in the ropes. {transiting_planet} meets your {natal_planet}, and the story of no way out has been told many times',
      'around {house_theme}, the blindfold is partly a thought. {transiting_planet} on your {natal_planet} lifts one edge',
      'a limit in {house_theme} feels solid. {transiting_planet} touches your {natal_planet}, and some of it is more flexible than it looks'
    ],
    action: 'notice the sentence that begins with I can\'t. say it again as I haven\'t, silently, and feel the difference'
  },

  'swords-9': {
    synthesis: [
      'the mind runs its worst films around {house_theme} after dark. {transiting_planet} meets your {natal_planet}, and the loop is louder than the facts',
      'worry near {house_theme} grows at night and thins at dawn. {transiting_planet} on your {natal_planet} is part of why it\'s hard to switch off',
      'a fear in {house_theme} has been on repeat. {transiting_planet} touches your {natal_planet}, and saying it aloud to someone may loosen it'
    ],
    action: 'catch the loop when it starts. put both feet on the floor and name five things you can see before going back to the thought'
  },

  'swords-10': {
    synthesis: [
      'a long thing has ended near {house_theme}, and it was hard. {transiting_planet} meets your {natal_planet}, and there is a thin dawn at the edge',
      'around {house_theme}, the worst is behind. {transiting_planet} on your {natal_planet} makes that feel believable and not merely announced',
      'a final thing is over in {house_theme}. {transiting_planet} touches your {natal_planet}, and nothing worse sits underneath it'
    ],
    action: 'notice where you\'re still holding the ending up. lie flat or lean back for a minute and let the floor take the weight'
  },

  'swords-page': {
    synthesis: [
      'a sharp little question is forming near {house_theme}. {transiting_planet} meets your {natal_planet}, and eagerness to say it is running ahead of understanding',
      'around {house_theme}, curiosity and cleverness are mixing. {transiting_planet} on your {natal_planet} wakes the watchful part of you',
      'you may be gathering information in {house_theme} faster than you digest it. {transiting_planet} touches your {natal_planet} and slows the pace'
    ],
    action: 'catch the sentence that is ready before the thought. hold it behind your teeth for one breath and check if it is kind as well as quick'
  },

  'swords-knight': {
    synthesis: [
      'your thinking is running at full gallop near {house_theme}. {transiting_planet} meets your {natal_planet}, and it\'s useful until it isn\'t',
      'around {house_theme}, directness has a place. {transiting_planet} on your {natal_planet} accelerates, and speed may flatten something that deserved a slower look',
      'certainty is arriving fast near {house_theme}. {transiting_planet} touches your {natal_planet}, and part of it is borrowed from impatience'
    ],
    action: 'notice the pace of your speech or your typing. slow down by one beat and feel the ground under your seat'
  },

  'swords-queen': {
    synthesis: [
      'you see through something near {house_theme} and it isn\'t unkind. {transiting_planet} meets your {natal_planet}, and the clear view comes without much fuss',
      'around {house_theme}, an honest assessment is available. {transiting_planet} on your {natal_planet} cools the edges',
      'candour and warmth may be able to share a sentence in {house_theme}. {transiting_planet} touches your {natal_planet}, and neither has to give way'
    ],
    action: 'catch the moment you\'re about to cut. breathe out, soften your voice a little and see if the sentence is still as sharp'
  },

  'swords-king': {
    synthesis: [
      'a judgement near {house_theme} is better made slowly. {transiting_planet} meets your {natal_planet}, and fairness is the standard that holds',
      'around {house_theme}, reason is asked to carry some mercy. {transiting_planet} on your {natal_planet} sets the weights on the scale',
      'a decision in {house_theme} may need the evidence laid out before the verdict. {transiting_planet} touches your {natal_planet}, and you can see who it touches'
    ],
    action: 'notice the urge to wrap it up quickly. sit straight, one slow breath, and picture everyone the decision touches'
  },


  // ── WANDS ────────────────────────────────────────

  'wands-ace': {
    synthesis: [
      'a match is catching near {house_theme}, before any plan exists. {transiting_planet} meets your {natal_planet}, and the pulse that jumps is information',
      'around {house_theme}, there is an itch to begin. {transiting_planet} on your {natal_planet} warms it',
      'a first move is itching in {house_theme}. {transiting_planet} touches your {natal_planet}, and the waiting for permission is the only thing in the way'
    ],
    action: 'notice where your pulse jumps when you think of starting. press your feet into the floor and let that heat stay for a few breaths'
  },

  'wands-2': {
    synthesis: [
      'the plan near {house_theme} is drawn and you\'re still on the battlements. {transiting_planet} meets your {natal_planet}, and the view is wide',
      'around {house_theme}, looking ahead has been taking up the time that going would. {transiting_planet} on your {natal_planet} turns your attention to the gate',
      'you may be weighing a leap in {house_theme}. {transiting_planet} touches your {natal_planet}, and the vision has got specific enough to try'
    ],
    action: 'catch the moment you open one more tab or note about it. stand up, roll your shoulders back, and look at the horizon through a window'
  },

  'wands-3': {
    synthesis: [
      'a venture you launched near {house_theme} is on its way out. {transiting_planet} meets your {natal_planet}, and tides are not yours to steer',
      'around {house_theme}, the groundwork was yours and the weather isn\'t. {transiting_planet} on your {natal_planet} stretches the wait',
      'ships are crossing near {house_theme}. {transiting_planet} touches your {natal_planet}, and doubt is part of the crossing, not a forecast'
    ],
    action: 'notice the tug to check for results. press your heel into the floor and rest your eyes on something far away for a few seconds'
  },

  'wands-4': {
    synthesis: [
      'there\'s a win near {house_theme} worth celebrating. {transiting_planet} meets your {natal_planet}, and the milestone is real even if the road isn\'t finished',
      'around {house_theme}, a place feels lived-in. {transiting_planet} on your {natal_planet} offers a garland',
      'you might be allowed to pause in {house_theme}. {transiting_planet} touches your {natal_planet}, and someone you\'d like beside you is in the picture'
    ],
    action: 'catch the moment you move past what went well. raise your shoulders, then drop them, and name one thing that finished'
  },

  'wands-5': {
    synthesis: [
      'friction near {house_theme} is noisy, and not all of it is harmful. {transiting_planet} meets your {natal_planet}, and some clashes sharpen things',
      'around {house_theme}, five opinions are talking over each other. {transiting_planet} on your {natal_planet} turns up the volume',
      'a rivalry in {house_theme} is more play than war. {transiting_planet} touches your {natal_planet}, and it matters whether anyone\'s getting hurt'
    ],
    action: 'notice what your body does when someone disagrees. unclench your fists and your jaw before you answer'
  },

  'wands-6': {
    synthesis: [
      'work you did near {house_theme} is being seen. {transiting_planet} meets your {natal_planet}, and taking the thanks in is part of the work',
      'around {house_theme}, a nod from someone who matters is on the way. {transiting_planet} on your {natal_planet} lifts your chin',
      'a good day in {house_theme} may be asking to be taken in. {transiting_planet} touches your {natal_planet}, and deflecting is a habit worth catching'
    ],
    action: 'catch the deflection when someone praises you. let the words sit in your chest for one slow breath before replying'
  },

  'wands-7': {
    synthesis: [
      'a position near {house_theme} is being tested. {transiting_planet} meets your {natal_planet}, and holding the ground is worth it only if it matters',
      'around {house_theme}, you\'re defending something. {transiting_planet} on your {natal_planet} reveals what it is',
      'there\'s a high point in {house_theme} you\'ve climbed to. {transiting_planet} touches your {natal_planet}, and some of the pressure is old'
    ],
    action: 'notice what you\'re protecting right now. drop your shoulders and check if the thing needs the guard'
  },

  'wands-8': {
    synthesis: [
      'things are moving quickly near {house_theme}. {transiting_planet} meets your {natal_planet}, and speed can feel both good and dizzy',
      'around {house_theme}, messages and news are travelling. {transiting_planet} on your {natal_planet} clears the sky',
      'after a still stretch, a flurry arrives in {house_theme}. {transiting_planet} touches your {natal_planet}, and a part of you wants your feet on the ground while it passes'
    ],
    action: 'catch the sense of being carried. press your feet into the floor and breathe out before you answer the next message'
  },

  'wands-9': {
    synthesis: [
      'you\'re tired and still on your feet near {house_theme}. {transiting_planet} meets your {natal_planet}, and the last stretch is shorter than it feels',
      'around {house_theme}, watchfulness has outlasted the danger. {transiting_planet} on your {natal_planet} shows how braced you are',
      'you have been through something in {house_theme} and are guarding the rest. {transiting_planet} touches your {natal_planet}, and rest is available'
    ],
    action: 'notice the braced muscles, usually jaw or shoulders. unclench them deliberately for one full breath'
  },

  'wands-10': {
    synthesis: [
      'you\'re carrying a lot near {house_theme}, nearly home. {transiting_planet} meets your {natal_planet}, and much of the load was picked up without discussion',
      'around {house_theme}, some of the bundle belongs to others. {transiting_planet} on your {natal_planet} makes the weight specific',
      'strength is real in {house_theme} and so is the weight. {transiting_planet} touches your {natal_planet}, and someone could take an end'
    ],
    action: 'catch the moment you say I\'ll just do it. set your bag, mug or phone down and feel what your arms do without it'
  },

  'wands-page': {
    synthesis: [
      'a new interest is catching your curiosity near {house_theme}. {transiting_planet} meets your {natal_planet}, and being bad at it first is fine',
      'around {house_theme}, a beginner\'s fire is lit. {transiting_planet} on your {natal_planet} brings it close',
      'there\'s an idea in {house_theme} that wants to be tried before it\'s perfect. {transiting_planet} touches your {natal_planet}, and eagerness is the best credential'
    ],
    action: 'notice the flicker of excitement before the inner critic arrives. stay with the flicker for three breaths, hands open'
  },

  'wands-knight': {
    synthesis: [
      'you\'re moving at full tilt near {house_theme}. {transiting_planet} meets your {natal_planet}, and the heat could be wanting or it could be restlessness',
      'around {house_theme}, the horse is rearing. {transiting_planet} on your {natal_planet} makes everything feel urgent',
      'a chase is on in {house_theme}. {transiting_planet} touches your {natal_planet}, and it matters what you\'re running toward'
    ],
    action: 'catch the lurch forward. plant both feet and take one full breath before the next move'
  },

  'wands-queen': {
    synthesis: [
      'warmth and nerve share the same body near {house_theme}. {transiting_planet} meets your {natal_planet}, and presence is doing most of the work',
      'around {house_theme}, being seen fully is on offer. {transiting_planet} on your {natal_planet} turns the light up',
      'you might be dimming yourself in {house_theme} for others\' comfort. {transiting_planet} touches your {natal_planet}, and the dimming is noticeable'
    ],
    action: 'notice the small way you make yourself less. straighten your spine, open your chest slightly, and breathe into it'
  },

  'wands-king': {
    synthesis: [
      'a vision near {house_theme} is able to carry other people. {transiting_planet} meets your {natal_planet}, and conviction does more than command',
      'around {house_theme}, leadership might be showing as steadiness. {transiting_planet} on your {natal_planet} gives it a spine',
      'a belief is shaping {house_theme}. {transiting_planet} touches your {natal_planet}, and your authority is quieter than you expect'
    ],
    action: 'catch the urge to push others along. straighten your back, loosen your grip and let your voice drop half a tone'
  },


  // ── PENTACLES ────────────────────────────────────────

  'pentacles-ace': {
    synthesis: [
      'a solid footing is being offered near {house_theme}. {transiting_planet} meets your {natal_planet}, and it\'s a seed, not a harvest',
      'around {house_theme}, a practical opening has appeared. {transiting_planet} on your {natal_planet} puts it within reach',
      'a small, real chance is available in {house_theme}. {transiting_planet} touches your {natal_planet}, and small may be the right size'
    ],
    action: 'notice the offer you wave off for being modest. press one palm flat on a table and feel how much it can hold'
  },

  'pentacles-2': {
    synthesis: [
      'you\'re juggling near {house_theme} and keeping it moving. {transiting_planet} meets your {natal_planet}, and balance here is a rhythm',
      'around {house_theme}, demands are competing. {transiting_planet} on your {natal_planet} shifts the swell',
      'a ball or two is wobbling in {house_theme}. {transiting_planet} touches your {natal_planet}, and a simpler week is possible'
    ],
    action: 'catch the yes that comes out before you\'ve checked your capacity. feel your feet and breathe out before the next reply'
  },

  'pentacles-3': {
    synthesis: [
      'a project near {house_theme} would be better built by more hands. {transiting_planet} meets your {natal_planet}, and a second opinion is a form of respect',
      'around {house_theme}, craft meets design. {transiting_planet} on your {natal_planet} brings someone\'s skill into the room',
      'you may have a skill in {house_theme} that somebody else needs. {transiting_planet} touches your {natal_planet}, and offering it is part of the work'
    ],
    action: 'notice where you\'re doing alone what a few hands would lighten. rest your palms on a table and think of one person who could take a corner'
  },

  'pentacles-4': {
    synthesis: [
      'holding on tightly near {house_theme} keeps things safe and close. {transiting_planet} meets your {natal_planet}, and the grip is its own cost',
      'around {house_theme}, fear of loss is steering. {transiting_planet} on your {natal_planet} makes the fear audible',
      'you might be guarding something in {house_theme} out of habit. {transiting_planet} touches your {natal_planet}, and the guard has a price'
    ],
    action: 'catch your hands closing around something. open them slowly and feel what the air does'
  },

  'pentacles-5': {
    synthesis: [
      'a lean patch near {house_theme} narrows the view. {transiting_planet} meets your {natal_planet}, and a lit window is closer than it seems',
      'around {house_theme}, you may feel left out in the cold. {transiting_planet} on your {natal_planet} makes the cold louder and the door more visible',
      'hardship in {house_theme} has made asking for help feel heavy. {transiting_planet} touches your {natal_planet}, and someone nearby would probably say yes'
    ],
    action: 'notice the person or place you\'ve stopped looking toward. lift your eyes and name one possible door'
  },

  'pentacles-6': {
    synthesis: [
      'giving and receiving are both in the room near {house_theme}. {transiting_planet} meets your {natal_planet}, and fairness runs both ways',
      'around {house_theme}, a favour is being counted. {transiting_planet} on your {natal_planet} makes the ledger visible',
      'generosity near {house_theme} may come with a string. {transiting_planet} touches your {natal_planet}, and the string is worth noticing'
    ],
    action: 'catch the tally in your head. hold out a hand, palm up, and notice which feels harder, giving or receiving'
  },

  'pentacles-7': {
    synthesis: [
      'you\'ve done the work near {house_theme} and it\'s ripening slowly. {transiting_planet} meets your {natal_planet}, and waiting is a skill',
      'around {house_theme}, there is a field you\'ve tended. {transiting_planet} on your {natal_planet} asks for patience and an honest look',
      'a long investment in {house_theme} isn\'t paying off yet. {transiting_planet} touches your {natal_planet}, and stopping would be as honest as continuing'
    ],
    action: 'notice the urge to dig up a seed to check it. keep your hands still and watch something grow, a plant or a candle flame'
  },

  'pentacles-8': {
    synthesis: [
      'the work near {house_theme} is repetitive and real. {transiting_planet} meets your {natal_planet}, and skill arrives through the doing',
      'around {house_theme}, practice is changing you by degrees. {transiting_planet} on your {natal_planet} sharpens the hands',
      'devotion to a craft shows up in {house_theme}. {transiting_planet} touches your {natal_planet}, and nobody is watching, which suits it'
    ],
    action: 'catch the moment of going through the motions. slow your hands for one task and feel the material'
  },

  'pentacles-9': {
    synthesis: [
      'you\'ve made something that\'s yours near {house_theme}. {transiting_planet} meets your {natal_planet}, and enjoying it alone isn\'t lonely when it\'s chosen',
      'around {house_theme}, ease has been earned. {transiting_planet} on your {natal_planet} lets you sit in it',
      'a garden of your own is in view in {house_theme}. {transiting_planet} touches your {natal_planet}, and polish and comfort are both permitted'
    ],
    action: 'notice what you built that you rarely look at. touch something you made, or chose, and let it be enough for a minute'
  },

  'pentacles-10': {
    synthesis: [
      'what\'s being built near {house_theme} may outlast you. {transiting_planet} meets your {natal_planet}, and belonging is made of small repeated things',
      'around {house_theme}, there\'s a long view of home. {transiting_planet} on your {natal_planet} widens it',
      'a legacy is accruing in {house_theme}. {transiting_planet} touches your {natal_planet}, and traditions and money are both part of it'
    ],
    action: 'catch the habit of counting only what\'s new. look at one old thing that has held up and feel its weight in your hand'
  },

  'pentacles-page': {
    synthesis: [
      'a practical beginning is available near {house_theme}. {transiting_planet} meets your {natal_planet}, and being a beginner takes more patience than glory',
      'around {house_theme}, a little lesson is waiting. {transiting_planet} on your {natal_planet} puts a book on the desk',
      'you may be about to learn something in {house_theme}. {transiting_planet} touches your {natal_planet}, and the first hour counts'
    ],
    action: 'notice the plan that never becomes the first hour. put your palm flat on whatever work is nearest and stay there for three breaths'
  },

  'pentacles-knight': {
    synthesis: [
      'slow and steady is the pace near {house_theme}. {transiting_planet} meets your {natal_planet}, and results are not in sight yet',
      'around {house_theme}, reliability is doing most of the work. {transiting_planet} on your {natal_planet} sets a plodding pace',
      'a long haul in {house_theme} might look dull from the inside. {transiting_planet} touches your {natal_planet}, and dull is sometimes what lasts'
    ],
    action: 'catch the voice that says nothing is changing. feel your feet steady on the ground and count three things that stayed constant'
  },

  'pentacles-queen': {
    synthesis: [
      'practical warmth is available near {house_theme}. {transiting_planet} meets your {natal_planet}, and a room, a meal or a body wants attention',
      'around {house_theme}, care has been going outward. {transiting_planet} on your {natal_planet} turns some of it toward you',
      'a sanctuary could be built in {house_theme}. {transiting_planet} touches your {natal_planet}, and the details matter'
    ],
    action: 'notice what in your physical space has been neglected. touch a surface near you and register whether it feels cared for'
  },

  'pentacles-king': {
    synthesis: [
      'a structure near {house_theme} has been built to last. {transiting_planet} meets your {natal_planet}, and stewardship matters more than accumulation',
      'around {house_theme}, resources are on your side. {transiting_planet} on your {natal_planet} asks how you\'d use them well',
      'solid ground is under {house_theme}. {transiting_planet} touches your {natal_planet}, and you might hold it lightly'
    ],
    action: 'catch the urge to clutch. open your hand and feel what it\'s like to hold something without gripping'
  }
};

export const keyPhraseTemplates = {
  challenging: ['the part that won\'t hold', 'what the pressure shows', 'a truth with edges', 'friction with a message', 'the old thing giving way', 'what you\'d rather not look at', 'the crack that lets light in', 'a plain sore spot'],
  neutral: ['between two weathers', 'a pause with a pulse', 'the held breath', 'listening sideways', 'a slow turning', 'the quiet middle', 'something silting down', 'the day\'s own pace'],
  expansive: ['a door left ajar', 'room to move', 'light at the edge', 'the unforced yes', 'ease arriving', 'warmth on the wall', 'a window opening', 'more space than expected']
};

/**
 * Which transiting planets and aspects are most resonant for each card.
 * Used to weight transit selection toward the most thematically relevant transit.
 * planets: ordered by relevance (index 0 = strongest affinity)
 * aspects: aspect types that align with this card's energy
 */
export const cardPlanetAffinity: Record<string, { planets: string[]; aspects: string[] }> = {
  // Major Arcana
  'major-0':  { planets: ['uranus', 'jupiter'],           aspects: ['trine', 'sextile', 'conjunction'] },
  'major-1':  { planets: ['mercury', 'sun'],              aspects: ['conjunction', 'trine', 'sextile'] },
  'major-2':  { planets: ['moon', 'neptune'],             aspects: ['conjunction', 'trine', 'sextile'] },
  'major-3':  { planets: ['venus', 'moon'],               aspects: ['trine', 'sextile', 'conjunction'] },
  'major-4':  { planets: ['saturn', 'mars'],              aspects: ['conjunction', 'square', 'trine'] },
  'major-5':  { planets: ['saturn', 'jupiter'],           aspects: ['conjunction', 'square', 'opposition'] },
  'major-6':  { planets: ['venus', 'mercury'],            aspects: ['conjunction', 'trine', 'sextile'] },
  'major-7':  { planets: ['mars', 'sun'],                 aspects: ['conjunction', 'square', 'trine'] },
  'major-8':  { planets: ['sun', 'venus'],                aspects: ['trine', 'sextile', 'conjunction'] },
  'major-9':  { planets: ['saturn', 'mercury'],           aspects: ['conjunction', 'square', 'opposition'] },
  'major-10': { planets: ['jupiter', 'uranus'],           aspects: ['conjunction', 'trine', 'square', 'opposition', 'sextile'] },
  'major-11': { planets: ['saturn', 'venus'],             aspects: ['conjunction', 'square', 'opposition'] },
  'major-12': { planets: ['neptune', 'saturn'],           aspects: ['square', 'opposition', 'conjunction'] },
  'major-13': { planets: ['pluto', 'saturn'],             aspects: ['square', 'opposition', 'conjunction'] },
  'major-14': { planets: ['jupiter', 'moon'],             aspects: ['trine', 'sextile', 'conjunction'] },
  'major-15': { planets: ['pluto', 'saturn'],             aspects: ['square', 'opposition', 'conjunction'] },
  'major-16': { planets: ['uranus', 'pluto'],             aspects: ['square', 'opposition', 'conjunction'] },
  'major-17': { planets: ['neptune', 'venus'],            aspects: ['trine', 'sextile', 'conjunction'] },
  'major-18': { planets: ['neptune', 'moon'],             aspects: ['square', 'opposition', 'conjunction'] },
  'major-19': { planets: ['sun', 'jupiter'],              aspects: ['trine', 'sextile', 'conjunction'] },
  'major-20': { planets: ['pluto', 'uranus'],             aspects: ['conjunction', 'square', 'trine'] },
  'major-21': { planets: ['jupiter', 'saturn'],           aspects: ['trine', 'conjunction', 'sextile'] },

  // Cups (Moon / Venus / Neptune)
  'cups-1':      { planets: ['moon', 'neptune'],          aspects: ['conjunction', 'trine', 'sextile'] },
  'cups-2':      { planets: ['venus', 'moon'],            aspects: ['conjunction', 'trine', 'sextile'] },
  'cups-3':      { planets: ['venus', 'jupiter'],         aspects: ['trine', 'sextile', 'conjunction'] },
  'cups-4':      { planets: ['moon', 'neptune'],          aspects: ['square', 'opposition', 'conjunction'] },
  'cups-5':      { planets: ['moon', 'saturn'],           aspects: ['square', 'opposition', 'conjunction'] },
  'cups-6':      { planets: ['moon', 'venus'],            aspects: ['trine', 'sextile', 'conjunction'] },
  'cups-7':      { planets: ['neptune', 'moon'],          aspects: ['square', 'opposition', 'conjunction'] },
  'cups-8':      { planets: ['saturn', 'moon'],           aspects: ['square', 'opposition', 'conjunction'] },
  'cups-9':      { planets: ['venus', 'jupiter'],         aspects: ['trine', 'sextile', 'conjunction'] },
  'cups-10':     { planets: ['moon', 'venus'],            aspects: ['trine', 'sextile', 'conjunction'] },
  'cups-page':   { planets: ['moon', 'mercury'],          aspects: ['conjunction', 'trine', 'sextile'] },
  'cups-knight': { planets: ['venus', 'mars'],            aspects: ['trine', 'conjunction', 'sextile'] },
  'cups-queen':  { planets: ['moon', 'neptune'],          aspects: ['trine', 'conjunction', 'sextile'] },
  'cups-king':   { planets: ['moon', 'saturn'],           aspects: ['trine', 'conjunction', 'sextile'] },

  // Swords (Mercury / Saturn / Mars)
  'swords-1':      { planets: ['mercury', 'uranus'],      aspects: ['conjunction', 'trine', 'sextile'] },
  'swords-2':      { planets: ['mercury', 'saturn'],      aspects: ['square', 'opposition', 'conjunction'] },
  'swords-3':      { planets: ['saturn', 'mars'],         aspects: ['square', 'opposition', 'conjunction'] },
  'swords-4':      { planets: ['saturn', 'mercury'],      aspects: ['square', 'conjunction', 'opposition'] },
  'swords-5':      { planets: ['mars', 'saturn'],         aspects: ['square', 'opposition', 'conjunction'] },
  'swords-6':      { planets: ['mercury', 'saturn'],      aspects: ['trine', 'sextile', 'conjunction'] },
  'swords-7':      { planets: ['mercury', 'uranus'],      aspects: ['conjunction', 'square', 'trine', 'sextile', 'opposition'] },
  'swords-8':      { planets: ['saturn', 'mercury'],      aspects: ['square', 'opposition', 'conjunction'] },
  'swords-9':      { planets: ['saturn', 'mars'],         aspects: ['square', 'opposition', 'conjunction'] },
  'swords-10':     { planets: ['pluto', 'saturn'],        aspects: ['conjunction', 'square', 'opposition'] },
  'swords-page':   { planets: ['mercury', 'uranus'],      aspects: ['conjunction', 'trine', 'sextile'] },
  'swords-knight': { planets: ['mars', 'mercury'],        aspects: ['conjunction', 'square', 'trine'] },
  'swords-queen':  { planets: ['saturn', 'mercury'],      aspects: ['conjunction', 'square', 'trine'] },
  'swords-king':   { planets: ['saturn', 'mercury'],      aspects: ['conjunction', 'trine', 'sextile'] },

  // Wands (Mars / Jupiter / Sun)
  'wands-1':      { planets: ['mars', 'sun'],             aspects: ['conjunction', 'trine', 'sextile'] },
  'wands-2':      { planets: ['jupiter', 'mars'],         aspects: ['conjunction', 'trine', 'sextile'] },
  'wands-3':      { planets: ['jupiter', 'sun'],          aspects: ['trine', 'sextile', 'conjunction'] },
  'wands-4':      { planets: ['jupiter', 'venus'],        aspects: ['trine', 'sextile', 'conjunction'] },
  'wands-5':      { planets: ['mars', 'uranus'],          aspects: ['square', 'opposition', 'conjunction'] },
  'wands-6':      { planets: ['sun', 'jupiter'],          aspects: ['trine', 'conjunction', 'sextile'] },
  'wands-7':      { planets: ['mars', 'saturn'],          aspects: ['square', 'opposition', 'conjunction'] },
  'wands-8':      { planets: ['mars', 'mercury'],         aspects: ['conjunction', 'trine', 'sextile'] },
  'wands-9':      { planets: ['mars', 'saturn'],          aspects: ['square', 'opposition', 'conjunction'] },
  'wands-10':     { planets: ['saturn', 'mars'],          aspects: ['square', 'conjunction', 'opposition'] },
  'wands-page':   { planets: ['mars', 'mercury'],         aspects: ['conjunction', 'trine', 'sextile'] },
  'wands-knight': { planets: ['mars', 'uranus'],          aspects: ['conjunction', 'square', 'trine'] },
  'wands-queen':  { planets: ['sun', 'mars'],             aspects: ['trine', 'conjunction', 'sextile'] },
  'wands-king':   { planets: ['sun', 'jupiter'],          aspects: ['conjunction', 'trine', 'sextile'] },

  // Pentacles (Saturn / Venus / Jupiter)
  'pentacles-1':      { planets: ['saturn', 'venus'],     aspects: ['conjunction', 'trine', 'sextile'] },
  'pentacles-2':      { planets: ['saturn', 'mercury'],   aspects: ['square', 'conjunction', 'opposition'] },
  'pentacles-3':      { planets: ['saturn', 'jupiter'],   aspects: ['trine', 'conjunction', 'sextile'] },
  'pentacles-4':      { planets: ['saturn', 'venus'],     aspects: ['square', 'conjunction', 'opposition'] },
  'pentacles-5':      { planets: ['saturn', 'mars'],      aspects: ['square', 'opposition', 'conjunction'] },
  'pentacles-6':      { planets: ['venus', 'jupiter'],    aspects: ['trine', 'sextile', 'conjunction'] },
  'pentacles-7':      { planets: ['saturn', 'jupiter'],   aspects: ['square', 'conjunction', 'trine'] },
  'pentacles-8':      { planets: ['saturn', 'mercury'],   aspects: ['conjunction', 'trine', 'square'] },
  'pentacles-9':      { planets: ['venus', 'jupiter'],    aspects: ['trine', 'sextile', 'conjunction'] },
  'pentacles-10':     { planets: ['saturn', 'jupiter'],   aspects: ['trine', 'conjunction', 'sextile'] },
  'pentacles-page':   { planets: ['saturn', 'mercury'],   aspects: ['conjunction', 'trine', 'sextile'] },
  'pentacles-knight': { planets: ['saturn', 'mars'],      aspects: ['conjunction', 'trine', 'square'] },
  'pentacles-queen':  { planets: ['venus', 'saturn'],     aspects: ['trine', 'conjunction', 'sextile'] },
  'pentacles-king':   { planets: ['saturn', 'jupiter'],   aspects: ['trine', 'conjunction', 'sextile'] },
};

/**
 * Transit action modifiers — appended to the card's action to ground it in the transit's energy.
 * Keyed by transiting planet → aspect tone.
 */
export const transitActionModifiers: Record<string, { challenging: string; neutral: string; expansive: string }> = {
  saturn: {
    challenging: 'notice what feels heavy and see which part of it has a name and a date attached',
    neutral: 'see which part of this is concrete enough to hold in one hand',
    expansive: 'watch how steady the ground feels under what you\'ve already built'
  },
  jupiter: {
    challenging: 'check where you\'re stretching further than your energy goes',
    neutral: 'notice the larger version of this and how it sits in your chest',
    expansive: 'pay attention to where there\'s genuine room and let your breath fill it'
  },
  uranus: {
    challenging: 'catch the habitual route and feel how it would be to take the side door',
    neutral: 'notice the small unexpected impulse and just let it be there',
    expansive: 'follow with your eyes whatever surprised you today'
  },
  neptune: {
    challenging: 'see what you might be projecting, and what is plainly in front of you',
    neutral: 'sit near a window, water or open air and watch what surfaces',
    expansive: 'stay with the hunch for a moment before the logic arrives'
  },
  pluto: {
    challenging: 'notice what sits one layer under the obvious feeling',
    neutral: 'go one layer deeper than you usually let yourself, just in noticing',
    expansive: 'feel what changes when you stop managing it'
  },
  mars: {
    challenging: 'feel where the heat collects in your body before it goes anywhere',
    neutral: 'move your body for a minute, even only your shoulders, and see what clears',
    expansive: 'notice how much energy is actually there right now'
  }
};
