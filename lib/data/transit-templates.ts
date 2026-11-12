/**
 * Transit Interpretation Templates
 *
 * Natural language templates for describing transits and their psychological impact.
 */

export interface TransitTemplate {
  transitType: string; // e.g., "square", "opposition", "conjunction"
  emotionalTone: 'challenging' | 'neutral' | 'expansive';
  openingPhrases: string[]; // Ways to introduce this transit naturally
  psychologicalImpact: string[]; // What it feels like
  timingPhrases: {
    approaching: string[];
    peak: string[];
    separating: string[];
  };
}

export const transitTemplates: Record<string, TransitTemplate> = {
  square: {
    transitType: 'square',
    emotionalTone: 'challenging',
    openingPhrases: [
      '{planet1} square {planet2} is closing in',
      '{planet1} is squaring your {planet2}',
      'that {planet1}-{planet2} square is almost exact',
      '{planet1} square {planet2} - the tension is building'
    ],
    psychologicalImpact: [
      'everything feels like friction',
      'the pressure is building',
      'you\'re feeling the push to act',
      'the tension demanding attention',
      'something has to give'
    ],
    timingPhrases: {
      approaching: [
        'the intensity is building as it gets closer',
        'you\'re in the approach - feeling it build',
        'the pressure mounting as it closes in'
      ],
      peak: [
        'it\'s exact right now - the peak of intensity',
        'this is the moment - exact and demanding',
        'the transit is exact - everything\'s at maximum'
      ],
      separating: [
        'it\'s separating now - the intensity easing',
        'past exact, but the lessons are still landing',
        'the pressure releasing as it moves away'
      ]
    }
  },

  opposition: {
    transitType: 'opposition',
    emotionalTone: 'challenging',
    openingPhrases: [
      '{planet1} opposite {planet2}',
      '{planet1} is directly opposing your {planet2}',
      'that {planet1}-{planet2} opposition',
      '{planet1} facing off with your {planet2}'
    ],
    psychologicalImpact: [
      'you\'re being pulled in two directions',
      'the either/or feeling',
      'the tension of opposites',
      'trying to balance extremes',
      'both sides demanding attention'
    ],
    timingPhrases: {
      approaching: [
        'the polarization building',
        'feeling more pulled as it approaches',
        'the two sides getting clearer'
      ],
      peak: [
        'at the peak - the full opposition',
        'both sides at maximum - exact opposition',
        'the standoff is exact'
      ],
      separating: [
        'past exact - finding middle ground',
        'the opposition easing, integration possible',
        'moving past the peak tension'
      ]
    }
  },

  conjunction: {
    transitType: 'conjunction',
    emotionalTone: 'neutral',
    openingPhrases: [
      '{planet1} meets {planet2}',
      '{planet1} conjunct your {planet2}',
      '{planet1} is merging with your {planet2}',
      '{planet1} and {planet2} together'
    ],
    psychologicalImpact: [
      'two forces becoming one',
      'a merging of energies',
      'intensification through union',
      'doubling down',
      'the blend of themes'
    ],
    timingPhrases: {
      approaching: [
        'the energies starting to blend',
        'coming together slowly',
        'the merge beginning'
      ],
      peak: [
        'exact conjunction - fully merged',
        'the meeting point - exact',
        'complete union right now'
      ],
      separating: [
        'separating but still connected',
        'the merge complete, now integrating',
        'moving apart but changed'
      ]
    }
  },

  trine: {
    transitType: 'trine',
    emotionalTone: 'expansive',
    openingPhrases: [
      '{planet1} trine {planet2}',
      '{planet1} is harmonizing with your {planet2}',
      '{planet1} and {planet2} in easy flow',
      'that smooth {planet1}-{planet2} trine'
    ],
    psychologicalImpact: [
      'things flowing more easily',
      'the ease surprising you',
      'natural harmony',
      'doors opening smoothly',
      'alignment without effort'
    ],
    timingPhrases: {
      approaching: [
        'the ease building',
        'flow starting to arrive',
        'things getting smoother'
      ],
      peak: [
        'maximum ease - exact trine',
        'the flow at its best',
        'perfect harmony right now'
      ],
      separating: [
        'the ease fading but lessons remain',
        'past peak but still flowing',
        'the window closing gently'
      ]
    }
  },

  sextile: {
    transitType: 'sextile',
    emotionalTone: 'expansive',
    openingPhrases: [
      '{planet1} sextile {planet2}',
      '{planet1} supporting your {planet2}',
      'that helpful {planet1}-{planet2} angle',
      '{planet1} and {planet2} in support'
    ],
    psychologicalImpact: [
      'opportunities if you reach for them',
      'support available',
      'helpful energy present',
      'doors slightly ajar',
      'possibilities within reach'
    ],
    timingPhrases: {
      approaching: [
        'the support growing',
        'opportunities emerging',
        'help on the way'
      ],
      peak: [
        'maximum support available',
        'the opportunity window wide open',
        'help at its strongest'
      ],
      separating: [
        'the window closing',
        'support fading but not gone',
        'past the peak of ease'
      ]
    }
  }
};

/**
 * Planet meanings for context
 */
export const planetMeanings: Record<string, string[]> = {
  Sun: ['identity', 'vitality', 'the core of you', 'what you stand for', 'the part that wants to be seen'],
  Moon: ['mood', 'what you need', 'your inner weather', 'home', 'the way you comfort yourself'],
  Mercury: ['talk', 'the mind', 'how you put things into words', 'daily thinking', 'what you tell yourself'],
  Venus: ['affection', 'taste', 'what you value', 'pleasure', 'how you meet people'],
  Mars: ['drive', 'temper', 'appetite', 'nerve', 'how you push'],
  Jupiter: ['growth', 'generosity', 'belief', 'luck', 'a wider view'],
  Saturn: ['limits', 'duty', 'what has to be built slowly', 'authority', 'what lasts'],
  Uranus: ['sudden shifts', 'restlessness', 'breaking with habit', 'surprise', 'room to be odd'],
  Neptune: ['dreams', 'blur', 'longing', 'faith', 'what lies under the surface'],
  Pluto: ['deep change', 'power', 'what has to end', 'the underneath', 'compulsion and release'],
  'North Node': ['the direction you lean toward', 'growth', 'what is unfamiliar and calling', 'a longer purpose'],
  'South Node': ['old habits', 'what comes easily', 'what you are leaving', 'the familiar groove'],
  Chiron: ['an old tenderness', 'healing', 'a wound that teaches', 'where it hurts and helps']
};

/**
 * Get a random opening phrase for a transit
 */
export function getRandomTransitOpener(transitType: string, planet1: string, planet2: string): string {
  const template = transitTemplates[transitType.toLowerCase()];
  if (!template) return '';

  const phrases = template.openingPhrases;
  const chosen = phrases[Math.floor(Math.random() * phrases.length)];

  return chosen
    .replace('{planet1}', planet1)
    .replace('{planet2}', planet2);
}

/**
 * Get timing phrase based on phase
 */
export function getTimingPhrase(transitType: string, phase: 'approaching' | 'peak' | 'separating'): string {
  const template = transitTemplates[transitType.toLowerCase()];
  if (!template) return '';

  const phrases = template.timingPhrases[phase];
  return phrases[Math.floor(Math.random() * phrases.length)];
}
