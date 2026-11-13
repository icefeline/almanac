/**
 * Card Archetypes
 *
 * Core psychological and emotional themes for each tarot card.
 * Used to generate natural, conversational insights.
 * Includes both upright and reversed meanings.
 */

export interface CardArchetype {
  id: string;
  name: string;
  upright: {
    coreThemes: string[];
    emotionalTone: 'challenging' | 'neutral' | 'expansive';
    psychologicalFocus: string[];
    actionQualities: string[];
    naturalPhrases: string[];
  };
  reversed: {
    coreThemes: string[];
    emotionalTone: 'challenging' | 'neutral' | 'expansive';
    psychologicalFocus: string[];
    actionQualities: string[];
    naturalPhrases: string[];
  };
}

export const cardArchetypes: Record<string, CardArchetype> = {
  // MAJOR ARCANA
  'major-0': {
    id: 'major-0',
    name: 'The Fool',
    upright: {
      coreThemes: ['a clean start', 'light luggage', 'trust without proof', 'curiosity', 'stepping off the edge'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['moving before the map is done', 'being a beginner on purpose', 'tolerating not knowing'],
      actionQualities: ['setting out', 'going lightly', 'following a hunch', 'saying yes before the plan'],
      naturalPhrases: [
        'a start still half in the drawer',
        'the unplanned morning',
        'a cliff edge in good weather',
        'walking with nothing in the bag'
      ]
    },
    reversed: {
      coreThemes: ['hesitation dressed as sense', 'naivety', 'stalled plans', 'a jump without looking', 'sleepwalking toward risk'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['caution that has stopped being wisdom', 'leaping blind', 'staying put out of habit'],
      actionQualities: ['over-planning', 'stalling', 'rushing', 'looking only at the sky'],
      naturalPhrases: [
        'the fifth revision of the plan',
        'a door left unopened',
        'a leap taken half-blind',
        'the old bruise talking'
      ]
    }
  },

  'major-13': {
    id: 'major-13',
    name: 'Death',
    upright: {
      coreThemes: ['an ending', 'clearing', 'shedding a skin', 'what falls away', 'making room'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['letting something finish', 'grieving and clearing together', 'releasing what\'s already gone'],
      actionQualities: ['ending', 'clearing out', 'mourning', 'letting go'],
      naturalPhrases: [
        'something finished that won\'t reopen',
        'clothes still smelling of them',
        'compost for what follows',
        'a bag packed for good'
      ]
    },
    reversed: {
      coreThemes: ['clinging', 'dragging an ending out', 'fear of what follows', 'unfinished goodbyes'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['propping up what\'s done', 'effort spent on upkeep', 'staying in a role that\'s over'],
      actionQualities: ['holding on', 'delaying', 'keeping it alive', 'avoiding the door'],
      naturalPhrases: [
        'shoes still by the door',
        'the tin of tea refilled',
        'an ending held off',
        'effort poured into upkeep'
      ]
    }
  },

  'major-16': {
    id: 'major-16',
    name: 'The Tower',
    upright: {
      coreThemes: ['sudden truth', 'what breaks', 'the false wall falling', 'shock of the real', 'an opening'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['seeing what wasn\'t solid', 'losing a structure', 'the air after the collapse'],
      actionQualities: ['breaking', 'seeing', 'clearing', 'losing footing'],
      naturalPhrases: [
        'lightning on a crown',
        'a certainty that stopped holding',
        'a phone call at the wrong hour',
        'walls coming down'
      ]
    },
    reversed: {
      coreThemes: ['a delayed collapse', 'averted disaster', 'propping things up', 'fearing the fall'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['beams against a leaning wall', 'rebuilding on the same footing', 'a private collapse, outwardly fine'],
      actionQualities: ['propping', 'avoiding', 'patching', 'waiting for the call'],
      naturalPhrases: [
        'plaster falling a little each week',
        'a tremor ignored',
        'rebuilding on faulty ground',
        'a collapse carried off-stage'
      ]
    }
  },

  'major-17': {
    id: 'major-17',
    name: 'The Star',
    upright: {
      coreThemes: ['quiet hope', 'mending', 'openness', 'trust returning', 'calm after the storm'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['refilling a spoonful at a time', 'believing in small mending', 'being soothed'],
      actionQualities: ['pouring', 'healing', 'resting under open sky', 'refilling'],
      naturalPhrases: [
        'a jug poured onto the ground',
        'the shower after illness',
        'a thin steady light',
        'small good things getting stronger'
      ]
    },
    reversed: {
      coreThemes: ['dimmed faith', 'discouragement', 'losing the thread', 'comparing paths'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['feeling the sky empty', 'giving up a dream because it looked foolish', 'measuring yourself against others'],
      actionQualities: ['losing heart', 'comparing', 'looking down', 'abandoning a hope'],
      naturalPhrases: [
        'a star unseen because you\'re looking down',
        'a dream set aside as silly',
        'the trust that thinned',
        'a path measured against everyone else\'s'
      ]
    }
  },

  'major-9': {
    id: 'major-9',
    name: 'The Hermit',
    upright: {
      coreThemes: ['solitude', 'a small lantern', 'searching inward', 'private wisdom', 'quiet that clarifies'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['stepping back to hear yourself', 'seeking without an audience', 'trusting a slow answer'],
      actionQualities: ['withdrawing', 'reflecting', 'walking alone', 'keeping a lamp lit'],
      naturalPhrases: [
        'a lantern lighting a few steps',
        'the quiet hour',
        'less company, fewer opinions',
        'the long walk home'
      ]
    },
    reversed: {
      coreThemes: ['loneliness', 'hiding', 'shutting out', 'too much noise'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['solitude gone sour', 'running from your own company', 'a signal drowned by chatter'],
      actionQualities: ['withdrawing too long', 'scrolling at four a.m.', 'refusing company', 'avoiding stillness'],
      naturalPhrases: [
        'a lamp lit with no one carrying it',
        'a house too quiet',
        'being alone as a closed door',
        'noise filling every gap'
      ]
    }
  },

  'major-1': {
    id: 'major-1',
    name: 'The Magician',
    upright: {
      coreThemes: ['skill in plain sight', 'focus', 'know-how', 'making things happen', 'using what\'s to hand'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['seeing your own resources', 'matching intention to effort', 'trusting your hands'],
      actionQualities: ['making', 'focusing', 'gathering tools', 'pointing attention'],
      naturalPhrases: [
        'the tools already on the table',
        'a skill you\'ve stopped counting',
        'hands that know the job',
        'what\'s within arm\'s reach'
      ]
    },
    reversed: {
      coreThemes: ['showmanship', 'misdirection', 'talent spent elsewhere', 'polish over substance', 'self-doubt'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['using ability to impress', 'underrating what you have', 'performing competence'],
      actionQualities: ['posing', 'scattering effort', 'hiding behind cleverness', 'second-guessing'],
      naturalPhrases: [
        'the show running ahead of the substance',
        'half-finished jobs',
        'a gift left in the drawer',
        'a story polished for the audience'
      ]
    }
  },

  'major-2': {
    id: 'major-2',
    name: 'The High Priestess',
    upright: {
      coreThemes: ['quiet knowing', 'the unsaid', 'intuition', 'stillness', 'hidden layers'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['trusting an inner signal', 'letting things stay unclear', 'listening to the body'],
      actionQualities: ['listening', 'waiting', 'sensing', 'keeping silent on purpose'],
      naturalPhrases: [
        'a hunch that came whole',
        'a flat note in the conversation',
        'the knowing before the words',
        'what the body already said'
      ]
    },
    reversed: {
      coreThemes: ['muffled instinct', 'withheld truth', 'secrets', 'noise over signal'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['explaining away a feeling', 'ignoring your gut', 'keeping something back'],
      actionQualities: ['overthinking', 'hushing intuition', 'hiding', 'talking over it'],
      naturalPhrases: [
        'the feeling explained away',
        'the quiet gone strange',
        'an inconvenient hunch relabelled as overthinking',
        'something kept from yourself'
      ]
    }
  },

  'major-3': {
    id: 'major-3',
    name: 'The Empress',
    upright: {
      coreThemes: ['slow growth', 'lushness', 'tending', 'creative ripening', 'sensual comfort'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['letting things grow at their own pace', 'receiving care', 'enjoying the body'],
      actionQualities: ['tending', 'nourishing', 'making', 'resting in plenty'],
      naturalPhrases: [
        'something growing on its own schedule',
        'a table already laid',
        'the soft work of making',
        'being fed'
      ]
    },
    reversed: {
      coreThemes: ['a dry creative spell', 'smothering', 'self-neglect', 'over-giving'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['running on empty', 'caring for everyone but yourself', 'perfectionism choking a project'],
      actionQualities: ['overgiving', 'neglecting', 'clamping down on growth', 'skipping meals'],
      naturalPhrases: [
        'the garden watered and the gardener forgotten',
        'a project checked on every hour',
        'tiredness spoken to harshly',
        'an unfed appetite'
      ]
    }
  },

  'major-4': {
    id: 'major-4',
    name: 'The Emperor',
    upright: {
      coreThemes: ['steady structure', 'shelter', 'firm edges', 'being the stable one', 'order that works'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['setting limits kindly', 'taking responsibility', 'holding the line'],
      actionQualities: ['organising', 'protecting', 'deciding', 'setting terms'],
      naturalPhrases: [
        'a rule that tells everyone where they stand',
        'the routine that holds',
        'the chair at the head of the table',
        'firm edges'
      ]
    },
    reversed: {
      coreThemes: ['rigidity', 'domination', 'control for its own sake', 'coldness'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['gripping the reins', 'enforcing rules nobody wrote', 'using discipline as punishment'],
      actionQualities: ['clamping down', 'policing', 'refusing to bend', 'losing flexibility'],
      naturalPhrases: [
        'order gone hard',
        'the rule with no author',
        'fear dressed as authority',
        'a grip so tight nothing moves'
      ]
    }
  },

  'major-5': {
    id: 'major-5',
    name: 'The Hierophant',
    upright: {
      coreThemes: ['inherited wisdom', 'shared ritual', 'teachers', 'belonging', 'custom'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['weighing tradition against habit', 'learning from elders', 'keeping what feeds you'],
      actionQualities: ['studying', 'observing custom', 'joining', 'passing things on'],
      naturalPhrases: [
        'a recipe handed down',
        'a prayer said in unison',
        'a teacher\'s voice',
        'customs worth keeping'
      ]
    },
    reversed: {
      coreThemes: ['dogma', 'conformity', 'fear of questioning', 'an outgrown rule'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['following a rule you never chose', 'seeking approval', 'swallowing teachings whole'],
      actionQualities: ['questioning', 'leaving', 'testing the creed', 'going your own way'],
      naturalPhrases: [
        'a belief held because everyone holds it',
        'a should in someone else\'s voice',
        'the group whose approval you chase',
        'a teaching that needs tasting'
      ]
    }
  },

  'major-6': {
    id: 'major-6',
    name: 'The Lovers',
    upright: {
      coreThemes: ['choosing with your values', 'closeness', 'being known', 'alignment', 'a deliberate yes'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['choosing who you want to be', 'showing up whole', 'meeting someone\'s eyes'],
      actionQualities: ['choosing', 'committing', 'opening up', 'aligning'],
      naturalPhrases: [
        'two chairs pulled close',
        'a yes beneath the obvious yes',
        'being seen and seeing back',
        'the decision that is about values'
      ]
    },
    reversed: {
      coreThemes: ['a quiet mismatch', 'compromised values', 'avoided choice', 'distance'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['editing yourself to stay close', 'saying yes with your mouth and no with your stomach', 'dodging a decision'],
      actionQualities: ['compromising', 'evading', 'going quiet', 'hiding a part of yourself'],
      naturalPhrases: [
        'a peace kept at a cost',
        'the sentence left out of the conversation',
        'two people being polite about a gap',
        'a choice put off'
      ]
    }
  },

  'major-7': {
    id: 'major-7',
    name: 'The Chariot',
    upright: {
      coreThemes: ['forward drive', 'willpower', 'direction', 'self-command', 'momentum with a purpose'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['pulling opposing urges into one line', 'choosing a road', 'steering from within'],
      actionQualities: ['driving', 'committing', 'focusing', 'holding the reins'],
      naturalPhrases: [
        'two sphinxes pulling one way',
        'a goal that deserves full attention',
        'no reins, only will',
        'the road ahead'
      ]
    },
    reversed: {
      coreThemes: ['scattered effort', 'forcing', 'aimlessness', 'a stalled engine'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['too many things at once', 'pushing harder because the choice isn\'t made', 'spinning wheels'],
      actionQualities: ['lurching', 'forcing', 'dithering', 'spreading thin'],
      naturalPhrases: [
        'an engine running with no destination',
        'two horses in different directions',
        'effort mistaken for direction',
        'a bag packed and unpacked'
      ]
    }
  },

  'major-8': {
    id: 'major-8',
    name: 'Strength',
    upright: {
      coreThemes: ['coaxing courage', 'patience', 'kindness toward fear', 'quiet resolve', 'soft authority'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['keeping company with a wild feeling', 'staying steady', 'being kind to the animal in you'],
      actionQualities: ['coaxing', 'enduring', 'staying close', 'softening your grip'],
      naturalPhrases: [
        'a hand on a lion\'s jaw',
        'patience reaching what force can\'t',
        'a feeling kept company',
        'steadiness that doesn\'t announce itself'
      ]
    },
    reversed: {
      coreThemes: ['raw nerves', 'self-doubt', 'holding in too hard', 'a temper let loose'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['swinging between spilling and clamping', 'mistaking suppression for strength', 'fear of your own force'],
      actionQualities: ['bottling', 'exploding', 'shaming', 'forcing'],
      naturalPhrases: [
        'the lion off the leash or in a muzzle',
        'feelings called self-control',
        'something asking to be heard more quietly',
        'a tantrum met with a blank wall'
      ]
    }
  },

  'major-10': {
    id: 'major-10',
    name: 'Wheel of Fortune',
    upright: {
      coreThemes: ['turning', 'luck', 'the larger pattern', 'cycles', 'change in motion'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['accepting what isn\'t yours to steer', 'seeing the shape of a cycle', 'riding the turn'],
      actionQualities: ['watching', 'adapting', 'waiting out', 'moving with it'],
      naturalPhrases: [
        'a wheel already turning',
        'a change that arrived uninvited',
        'the same week coming round again',
        'luck not being yours to steer'
      ]
    },
    reversed: {
      coreThemes: ['stuck loops', 'bad timing', 'resisting the turn', 'feeling at the mercy of things'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['repeating a pattern', 'calling habit fate', 'blaming the weather'],
      actionQualities: ['resisting', 'looping', 'hiding behind luck', 'waiting for a break'],
      naturalPhrases: [
        'the same quarrel on the same corridor',
        'a groove worn deeper',
        'fate invoked for a habit',
        'the wheel unnoticed overhead'
      ]
    }
  },

  'major-11': {
    id: 'major-11',
    name: 'Justice',
    upright: {
      coreThemes: ['fair accounting', 'consequence', 'honesty', 'clear judgement', 'owning your part'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['telling the plain version', 'weighing everyone, yourself included', 'accepting what follows'],
      actionQualities: ['weighing', 'deciding', 'admitting', 'setting straight'],
      naturalPhrases: [
        'scales that don\'t flatter',
        'a conversation where honest and easy diverge',
        'a record put right',
        'accuracy over comfort'
      ]
    },
    reversed: {
      coreThemes: ['bias', 'evasion', 'tilted scales', 'dodged consequences'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['a story bent to look better', 'a double standard', 'unpaid debts'],
      actionQualities: ['excusing yourself', 'stalling', 'blaming', 'minimising'],
      naturalPhrases: [
        'a story tilted at the edges',
        'an account left untouched',
        'the standard for others not applied at home',
        'fairness that stops at yourself'
      ]
    }
  },

  'major-12': {
    id: 'major-12',
    name: 'The Hanged Man',
    upright: {
      coreThemes: ['a deliberate pause', 'surrender', 'the upside-down view', 'waiting on purpose', 'stillness'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['letting go of the push', 'seeing from a new angle', 'being stopped by choice'],
      actionQualities: ['pausing', 'yielding', 'looking differently', 'waiting'],
      naturalPhrases: [
        'a pause filed under wasted time',
        'the view from upside down',
        'being stopped, and seeing more',
        'a held breath that does work'
      ]
    },
    reversed: {
      coreThemes: ['limbo', 'pointless sacrifice', 'stalling', 'refusing to release'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['waiting for permission', 'martyring yourself', 'a queue for a closed counter'],
      actionQualities: ['stalling', 'sacrificing for nothing', 'clinging', 'stuck patience'],
      naturalPhrases: [
        'stillness that isn\'t doing anything',
        'a long wait for an answer that won\'t arrive',
        'patience used as cover',
        'a sacrifice made for no one'
      ]
    }
  },

  'major-14': {
    id: 'major-14',
    name: 'Temperance',
    upright: {
      coreThemes: ['blending', 'measure', 'patience', 'the middle ground', 'slow mixing'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['finding the right proportion', 'letting opposites mix', 'moving at a deliberate crawl'],
      actionQualities: ['mixing', 'moderating', 'pouring in a thin stream', 'testing'],
      naturalPhrases: [
        'two cups poured between',
        'one foot on land, one in water',
        'the right amount, smaller than expected',
        'a blend that needs time'
      ]
    },
    reversed: {
      coreThemes: ['too much too fast', 'swinging between extremes', 'impatience', 'no common ground'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['forcing a blend before it\'s ready', 'numbing to skip discomfort', 'excess'],
      actionQualities: ['rushing', 'overcorrecting', 'numbing', 'lurching'],
      naturalPhrases: [
        'the pot boiled over twice',
        'too much salt, then none',
        'hurry to rescue it',
        'small excesses doing the talking'
      ]
    }
  },

  'major-15': {
    id: 'major-15',
    name: 'The Devil',
    upright: {
      coreThemes: ['attachment', 'habit loops', 'temptation', 'the shadow', 'comfortable bondage'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['seeing what holds you', 'admitting what the habit pays', 'looking without obeying'],
      actionQualities: ['noticing', 'admitting', 'looking at', 'testing the chain'],
      naturalPhrases: [
        'chains loose enough to lift off',
        'a pattern that pays in comfort',
        'a pull you\'d rather not look at',
        'a screen, a person, a story'
      ]
    },
    reversed: {
      coreThemes: ['loosening grip', 'seeing the pattern', 'unhooking', 'slow release'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['an attachment starting to look like a choice', 'fearing the freedom', 'relief arriving out of order'],
      actionQualities: ['unhooking', 'questioning', 'stepping back', 'testing the door'],
      naturalPhrases: [
        'a link slackening',
        'a need becoming a choice',
        'the thing seen without wanting it',
        'one more return to prove you can stop'
      ]
    }
  },

  'major-18': {
    id: 'major-18',
    name: 'The Moon',
    upright: {
      coreThemes: ['dreamlike uncertainty', 'half-light', 'undercurrents', 'imagination', 'things not yet clear'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['living with not knowing', 'hearing a hunch through worry', 'letting the fog be'],
      actionQualities: ['sensing', 'wandering', 'wondering', 'waiting for light'],
      naturalPhrases: [
        'a dog and a wolf howling at a moon',
        'fear and intuition sounding alike',
        'a strange city at night',
        'the worry older than its cause'
      ]
    },
    reversed: {
      coreThemes: ['fog lifting', 'seeing through it', 'fear loosening', 'the truth surfacing'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['a story about the dark with an ordinary explanation', 'loitering in confusion because it\'s familiar', 'clarity arriving and not being welcome'],
      actionQualities: ['seeing through', 'admitting', 'uncovering', 'clearing up'],
      naturalPhrases: [
        'the dog stopped howling and the wolf is still near',
        'a fog thinning by the hour',
        'a story no longer holding'
      ]
    }
  },

  'major-19': {
    id: 'major-19',
    name: 'The Sun',
    upright: {
      coreThemes: ['plain warmth', 'vitality', 'daylight clarity', 'being seen', 'simple joy'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['enjoying something without a footnote', 'letting yourself be visible', 'accepting good news'],
      actionQualities: ['basking', 'playing', 'shining', 'delighting'],
      naturalPhrases: [
        'a child on a white horse',
        'sunflowers along the wall',
        'a patch of light on a table',
        'a laugh that needs no reason'
      ]
    },
    reversed: {
      coreThemes: ['dimmed joy', 'muted pleasure', 'doubting good news', 'cloud cover'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['waving off what went well', 'feeling undeserving', 'indoors on a sunny day'],
      actionQualities: ['downplaying', 'shrinking', 'deflecting', 'hiding the shine'],
      naturalPhrases: [
        'the sun behind cloud',
        'success shrugged off',
        'the last warm thing you moved past too quickly',
        'a list of reasons not to shine'
      ]
    }
  },

  'major-20': {
    id: 'major-20',
    name: 'Judgement',
    upright: {
      coreThemes: ['a call heard', 'reckoning', 'forgiveness', 'waking up', 'answering something old'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['looking at the past kindly', 'being called by your own life', 'letting a verdict go'],
      actionQualities: ['answering', 'forgiving', 'waking', 'looking back'],
      naturalPhrases: [
        'a trumpet over open coffins',
        'an old message finally opened',
        'something asking for acknowledgement',
        'a version of you ready to rise'
      ]
    },
    reversed: {
      coreThemes: ['harsh self-verdict', 'ignoring the call', 'waiting for permission', 'an unforgiven past'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['self-judgement posing as honesty', 'asking leave you don\'t need', 'a louder trumpet inside'],
      actionQualities: ['judging yourself', 'stalling', 'waiting', 'silencing the call'],
      naturalPhrases: [
        'the inner critic with its own trumpet',
        'a message left unopened for weeks',
        'permission awaited that nobody will give'
      ]
    }
  },

  'major-21': {
    id: 'major-21',
    name: 'The World',
    upright: {
      coreThemes: ['completion', 'arrival', 'wholeness', 'a circle closing', 'integration'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['seeing how far you\'ve come', 'letting something be finished', 'knowing what it taught'],
      actionQualities: ['finishing', 'arriving', 'gathering', 'marking an ending'],
      naturalPhrases: [
        'a dancer in a laurel wreath',
        'the last night of the trip',
        'a long thing come round',
        'everything on the table done'
      ]
    },
    reversed: {
      coreThemes: ['loose ends', 'unfinished business', 'shortcuts', 'almost there'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['avoiding the last step', 'holding off an ending because it means a beginning', 'rushing and not feeling complete'],
      actionQualities: ['loitering', 'skipping', 'circling', 'hedging'],
      naturalPhrases: [
        'a finish line close and uncrossed',
        'one piece being walked around',
        'an ending that doesn\'t feel like one'
      ]
    }
  },

  // WANDS (Action, Passion, Will)
  'wands-ace': {
    id: 'wands-ace',
    name: 'Ace of Wands',
    upright: {
      coreThemes: ['a struck match', 'the urge to begin', 'creative heat', 'raw potential', 'eagerness'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['saying yes before the plan', 'noticing where your pulse jumps'],
      actionQualities: ['striking', 'starting', 'scribbling in the dark', 'catching'],
      naturalPhrases: [
        'an idea at five a.m.',
        'a hand holding a sprouting wand',
        'heat in the chest',
        'a start with no plan'
      ]
    },
    reversed: {
      coreThemes: ['a damp match', 'ideas left in a drawer', 'a stalled start', 'flat energy'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['waiting for the right moment until none comes', 'an idea phosphorescing in a drawer', 'a match that went out'],
      actionQualities: ['waiting', 'delaying', 'sitting on it', 'doubting'],
      naturalPhrases: [
        'the idea shelved after waking you',
        'the right moment that never arrives',
        'a struck match with nowhere to go'
      ]
    }
  },

  'wands-2': {
    id: 'wands-2',
    name: 'Two of Wands',
    upright: {
      coreThemes: ['looking ahead', 'the plan', 'a wide view', 'weighing a leap', 'ambition'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['turning a vision into a first mile', 'leaving the battlements'],
      actionQualities: ['planning', 'surveying', 'holding', 'deciding'],
      naturalPhrases: [
        'a globe in one hand',
        'a rooftop hush before telling anyone',
        'a plan drawn and not yet walked',
        'the wide view'
      ]
    },
    reversed: {
      coreThemes: ['over-preparing', 'cold feet', 'a blurry goal', 'dithering'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['planning as a place to hide', 'a vision kept vague to avoid committing', 'a leap made in panic'],
      actionQualities: ['dithering', 'polishing the plan', 'panicking', 'delaying'],
      naturalPhrases: [
        'a plan folded in a pocket',
        'prudence that\'s really fear',
        'a horizon vague on purpose'
      ]
    }
  },

  'wands-7': {
    id: 'wands-7',
    name: 'Seven of Wands',
    upright: {
      coreThemes: ['holding the high ground', 'standing firm', 'being tested', 'guarding a boundary', 'nerve'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['asking what\'s worth defending', 'holding steady without heat'],
      actionQualities: ['defending', 'holding', 'staying put', 'not backing down'],
      naturalPhrases: [
        'a position held in the meeting',
        'one boot of each kind in the rush',
        'people pushing and you staying where you are',
        'tired and unbowed'
      ]
    },
    reversed: {
      coreThemes: ['worn out', 'needless defensiveness', 'giving way', 'picking fights'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['defending ground you\'ve forgotten the point of', 'a position given up that mattered', 'guarding what no longer needs it'],
      actionQualities: ['bristling', 'yielding', 'fighting', 'tiring'],
      naturalPhrases: [
        'a line held from habit',
        'a hill defended past its use',
        'the guard no longer protecting anything'
      ]
    }
  },

  'wands-3': {
    id: 'wands-3',
    name: 'Three of Wands',
    upright: {
      coreThemes: ['a far horizon', 'things in motion', 'seeds sprouting', 'looking out', 'patience paying off'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['trusting what you launched', 'letting the tide do its part'],
      actionQualities: ['watching', 'waiting', 'trusting', 'launching'],
      naturalPhrases: [
        'ships crossing a calm sea',
        'the morning after sending it',
        'groundwork done and weather not yours',
        'a long view over water'
      ]
    },
    reversed: {
      coreThemes: ['slow returns', 'impatience', 'ships not yet in', 'wavering faith'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['doubting the work for want of evidence', 'checking the inbox', 'tugging the rope to hurry things'],
      actionQualities: ['checking', 'doubting', 'tugging', 'fretting'],
      naturalPhrases: [
        'nothing back after sending',
        'the inbox refreshed again',
        'ships that take longer than any estimate'
      ]
    }
  },

  'wands-4': {
    id: 'wands-4',
    name: 'Four of Wands',
    upright: {
      coreThemes: ['homecoming', 'a festive pause', 'a lived-in place', 'a gathering', 'milestone'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['letting something finished be enjoyed', 'calling someone to the garland'],
      actionQualities: ['celebrating', 'gathering', 'resting', 'arriving'],
      naturalPhrases: [
        'a garland held up by four wands',
        'fairy lights on a rooftop',
        'aunties running the kitchen',
        'a drink you didn\'t ask for that was just right'
      ]
    },
    reversed: {
      coreThemes: ['rushing past', 'unsettled home', 'joy cut short', 'a shaky foundation'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['skipping to the next task before the cake', 'a party on a shaky floor', 'happiness waiting on a summons'],
      actionQualities: ['skipping', 'postponing', 'avoiding', 'unsettling'],
      naturalPhrases: [
        'the fairy lights left in the box',
        'a party with the cracks unmentioned',
        'a milestone stepped over'
      ]
    }
  },

  'wands-5': {
    id: 'wands-5',
    name: 'Five of Wands',
    upright: {
      coreThemes: ['friction', 'competition', 'clashing views', 'a crowded room', 'rough play'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['telling creative friction from noise', 'asking who gets hurt'],
      actionQualities: ['arguing', 'jostling', 'competing', 'talking over'],
      naturalPhrases: [
        'five staffs and no clear winner',
        'a meeting where everyone talks',
        'five opinions on one dishwasher',
        'a jaw stiff from smiling after the group project'
      ]
    },
    reversed: {
      coreThemes: ['easing tension', 'dodged confrontation', 'inner wrestling', 'truce'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['peace kept by avoidance', 'a sharp conversation left unsaid', 'a fight with yourself'],
      actionQualities: ['dodging', 'muttering', 'truce-making', 'wrestling inside'],
      naturalPhrases: [
        'the quiet that hasn\'t cleared',
        'a conversation avoided in the name of peace',
        'a staff to be put down or used'
      ]
    }
  },

  'wands-6': {
    id: 'wands-6',
    name: 'Six of Wands',
    upright: {
      coreThemes: ['recognition', 'a public win', 'earned confidence', 'being applauded', 'a good day'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['taking praise in', 'letting a result sink in'],
      actionQualities: ['riding', 'accepting', 'walking tall', 'being thanked'],
      naturalPhrases: [
        'a rider with a laurel wand',
        'the walk home after the news',
        'a nod from someone whose opinion counts',
        'work finally seen'
      ]
    },
    reversed: {
      coreThemes: ['unseen effort', 'a flat victory', 'chasing approval', 'pride getting loud'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['applause that came for the wrong thing', 'success that felt like little', 'waiting for someone\'s nod'],
      actionQualities: ['waving it off', 'performing', 'chasing', 'doubting'],
      naturalPhrases: [
        'thin applause',
        'an achievement as the road to approval',
        'doubt louder at night'
      ]
    }
  },

  'wands-8': {
    id: 'wands-8',
    name: 'Eight of Wands',
    upright: {
      coreThemes: ['swift movement', 'things arriving', 'news travelling', 'a rush of progress', 'open sky'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['keeping your feet while things move', 'letting speed be good'],
      actionQualities: ['arriving', 'flying', 'answering', 'catching up'],
      naturalPhrases: [
        'eight wands through a clear sky',
        'a week of messages',
        'a flurry after a long stillness',
        'momentum doing the work'
      ]
    },
    reversed: {
      coreThemes: ['too fast', 'held up', 'crossed wires', 'losing the pace'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['speed pointing nowhere', 'plans slipping', 'wanting the ground back'],
      actionQualities: ['rushing', 'stalling', 'crossing', 'fumbling'],
      naturalPhrases: [
        'messages crossed and mistimed',
        'a pace you can\'t hold',
        'the quiet that\'s suspicious'
      ]
    }
  },

  'wands-9': {
    id: 'wands-9',
    name: 'Nine of Wands',
    upright: {
      coreThemes: ['weariness with grit', 'one more push', 'a guarded stance', 'staying power', 'battle-worn'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['acknowledging how tired you are', 'finding the last stretch shorter than it feels'],
      actionQualities: ['enduring', 'guarding', 'standing', 'bandaged and upright'],
      naturalPhrases: [
        'a bandaged figure before a fence of wands',
        'the night before the last day',
        'nearly done and nearly broken',
        'getting up and doing it anyway'
      ]
    },
    reversed: {
      coreThemes: ['burned out', 'jumpiness', 'no fight left', 'bracing for nothing'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['watchfulness that outlasted the danger', 'struggle so familiar peace feels suspicious', 'shoulders by your ears'],
      actionQualities: ['bracing', 'refusing rest', 'flinching', 'guarding'],
      naturalPhrases: [
        'rest offered and too braced to take',
        'a danger that ended weeks ago',
        'a jaw clenched out of habit'
      ]
    }
  },

  'wands-10': {
    id: 'wands-10',
    name: 'Ten of Wands',
    upright: {
      coreThemes: ['a heavy load', 'too many yeses', 'duty', 'carrying everything', 'nearly there'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['seeing which bundles are actually yours', 'asking who could take an end'],
      actionQualities: ['carrying', 'plodding', 'hauling', 'saying yes'],
      naturalPhrases: [
        'ten wands in one bundle',
        'four flights with the shopping',
        'a promise made months ago',
        'strength that is real and so is the weight'
      ]
    },
    reversed: {
      coreThemes: ['setting it down', 'handing off', 'buckling', 'shedding weight'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['a belief that nobody else would do it right', 'the bag finally splitting', 'guilt for a week after handing it over'],
      actionQualities: ['refusing help', 'collapsing', 'martyring', 'overcommitting'],
      naturalPhrases: [
        'the one wand not yet set down',
        'the guilt after handing over',
        'a load carried for love shown badly'
      ]
    }
  },

  // CUPS (Emotion, Relationships, Intuition)
  'cups-ace': {
    id: 'cups-ace',
    name: 'Ace of Cups',
    upright: {
      coreThemes: ['an offered feeling', 'overflow', 'warmth arriving unasked', 'a fresh warmth', 'creative flow'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['receiving instead of managing', 'letting something in', 'being filled'],
      actionQualities: ['accepting', 'opening', 'receiving', 'softening'],
      naturalPhrases: [
        'a cup already overflowing',
        'a warmth being handed over',
        'tea at the right temperature',
        'an opening you didn\'t ask for'
      ]
    },
    reversed: {
      coreThemes: ['a shut heart', 'numbness', 'withheld feeling', 'running dry'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['keeping the door a finger\'s width open', 'guarding after a hurt', 'taking everything and feeling nothing'],
      actionQualities: ['guarding', 'deflecting', 'holding back', 'going numb'],
      naturalPhrases: [
        'a cup left to cool',
        'the door kept politely ajar',
        'kindness passing by',
        'a full cup over a dry bottom'
      ]
    }
  },

  'cups-2': {
    id: 'cups-2',
    name: 'Two of Cups',
    upright: {
      coreThemes: ['mutual regard', 'a pairing', 'reciprocity', 'even exchange', 'being met'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['letting someone see you back', 'meeting halfway', 'a two-way attention'],
      actionQualities: ['pairing', 'meeting', 'reciprocating', 'turning toward'],
      naturalPhrases: [
        'two cups raised',
        'the conversation that runs both ways',
        'being seen and seeing back',
        'ease between two people'
      ]
    },
    reversed: {
      coreThemes: ['lopsided giving', 'crossed wires', 'cooling', 'performed closeness'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['one person carrying the weight', 'a warmth gone off', 'the unsaid sentence'],
      actionQualities: ['over-giving', 'withholding', 'pretending', 'avoiding the topic'],
      naturalPhrases: [
        'the sentence left out of the conversation',
        'two cups and one effort',
        'warmth that has cooled',
        'closeness performed'
      ]
    }
  },

  'cups-3': {
    id: 'cups-3',
    name: 'Three of Cups',
    upright: {
      coreThemes: ['friendship', 'a full table', 'shared gladness', 'togetherness', 'celebration'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['being happy in company', 'letting people see you glad', 'counting your people'],
      actionQualities: ['gathering', 'celebrating', 'toasting', 'laughing together'],
      naturalPhrases: [
        'three cups raised',
        'a messy kitchen at midnight',
        'a joke that earns a second laugh',
        'your face stiff from smiling'
      ]
    },
    reversed: {
      coreThemes: ['pulling away', 'a hollow party', 'too much, too often', 'comparison'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['stepping back from people', 'measuring who\'s doing better', 'a friendship gone dry'],
      actionQualities: ['withdrawing', 'comparing', 'over-indulging', 'leaving early'],
      naturalPhrases: [
        'the party on and the mood off',
        'a friend waiting for a call',
        'laughter from the next room',
        'leaving without saying why'
      ]
    }
  },

  'cups-4': {
    id: 'cups-4',
    name: 'Four of Cups',
    upright: {
      coreThemes: ['flatness', 'withdrawn attention', 'an overlooked offer', 'turning inward', 'restlessness'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['noticing what you decline before it finishes arriving', 'boredom as a closed door'],
      actionQualities: ['withdrawing', 'brooding', 'folding your arms', 'looking away'],
      naturalPhrases: [
        'three cups before you and a fourth unseen',
        'a shrug at anything offered',
        'a no you couldn\'t explain',
        'the grey week'
      ]
    },
    reversed: {
      coreThemes: ['waking up', 'appetite returning', 'looking up', 'a first yes'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['a faint curiosity at the edge of the room', 'the grey lifting', 'wanting something again'],
      actionQualities: ['looking up', 'reaching', 'noticing', 'saying yes'],
      naturalPhrases: [
        'a tug you nearly dismissed',
        'appetite coming back before you trust it',
        'a second look at the offer'
      ]
    }
  },

  'cups-5': {
    id: 'cups-5',
    name: 'Five of Cups',
    upright: {
      coreThemes: ['loss', 'grief', 'spilled hopes', 'sorrow', 'mourning'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['letting the sadness be its own size', 'not hurrying the grief', 'the standing cups waiting'],
      actionQualities: ['grieving', 'mourning', 'staring', 'staying with it'],
      naturalPhrases: [
        'three spilled cups',
        'the kitchen at eight in the morning',
        'a kettle boiled and forgotten',
        'two cups upright out of view'
      ]
    },
    reversed: {
      coreThemes: ['turning round', 'grief loosening', 'what remains', 'recovery'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['grief become an address', 'moving on feeling disloyal', 'a bridge that was always there'],
      actionQualities: ['turning', 'accepting', 'carrying on', 'looking behind'],
      naturalPhrases: [
        'the head turning by degrees',
        'the spilled cups stared at too long',
        'the bridge seen at last'
      ]
    }
  },

  'cups-6': {
    id: 'cups-6',
    name: 'Six of Cups',
    upright: {
      coreThemes: ['nostalgia', 'childhood', 'an old kindness', 'reunion', 'simple sweetness'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['letting a memory warm you', 'asking what you loved at seven', 'meeting your younger self'],
      actionQualities: ['remembering', 'revisiting', 'gifting', 'going back'],
      naturalPhrases: [
        'a smell that carries a corridor',
        'a courtyard in the sun',
        'a cup of flowers offered',
        'a cousin\'s house'
      ]
    },
    reversed: {
      coreThemes: ['living in yesterday', 'rose-tinted memory', 'refusing to look back', 'old habits'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['polishing a golden age', 'keeping the past at arm\'s length', 'a house smaller than you remembered'],
      actionQualities: ['idealising', 'clinging', 'avoiding the past', 'comparing'],
      naturalPhrases: [
        'a memory polished so often it\'s lost its grain',
        'today\'s ordinary light dismissed',
        'the old house too small'
      ]
    }
  },

  'cups-7': {
    id: 'cups-7',
    name: 'Seven of Cups',
    upright: {
      coreThemes: ['daydreams', 'too many options', 'imagining', 'temptation', 'wishful thinking'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['noticing which wishes are costumes', 'enjoying dreams without deciding', 'sorting want from plan'],
      actionQualities: ['dreaming', 'browsing', 'fancying', 'postponing'],
      naturalPhrases: [
        'seven cups in a cloud',
        'evenings with too many tabs',
        'a heat-haze none of them can touch',
        'options that close themselves by morning'
      ]
    },
    reversed: {
      coreThemes: ['clearing the fog', 'sorting wish from plan', 'choosing', 'coming to earth'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['keeping everything open until choosing feels like betrayal', 'a wish dissolving into something plainer'],
      actionQualities: ['deciding', 'discarding', 'pruning', 'committing'],
      naturalPhrases: [
        'the tabs closing one by one',
        'the plain thing underneath',
        'a choice that doesn\'t shut every door'
      ]
    }
  },

  'cups-8': {
    id: 'cups-8',
    name: 'Eight of Cups',
    upright: {
      coreThemes: ['walking away', 'outgrowing', 'a quiet leaving', 'looking for more', 'lasting emptiness'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['admitting a good thing has stopped feeding you', 'leaving without a villain'],
      actionQualities: ['leaving', 'packing', 'climbing', 'going by moonlight'],
      naturalPhrases: [
        'a brief bag by the door',
        'a good thing that isn\'t yours any more',
        'the door shut without slamming',
        'a staff and a long road'
      ]
    },
    reversed: {
      coreThemes: ['loitering', 'staying out of habit', 'postponed departure', 'clinging to comfort'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['sunk cost', 'fear of the stretch after a goodbye', 'leaving in a rage and bringing it along'],
      actionQualities: ['staying', 'stalling', 'stepping round the bag', 'pretending it still works'],
      naturalPhrases: [
        'the bag you step round each morning',
        'a comfort that\'s costing more',
        'a leaving that didn\'t fix what you carried out'
      ]
    }
  },

  'cups-9': {
    id: 'cups-9',
    name: 'Nine of Cups',
    upright: {
      coreThemes: ['contentment', 'a wish granted', 'savouring', 'gratitude', 'a good table'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['taking satisfaction at face value', 'noticing what already worked out'],
      actionQualities: ['savouring', 'sitting back', 'eating without hurry', 'enjoying'],
      naturalPhrases: [
        'a meal that came out right',
        'arms folded in contentment',
        'a second helping without guilt',
        'a wish already partly met'
      ]
    },
    reversed: {
      coreThemes: ['an empty win', 'wanting the wrong thing', 'smugness', 'indulgence'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['the prize that doesn\'t taste of anything', 'a goal that came off someone else\'s list', 'plates refilled by habit'],
      actionQualities: ['overdoing', 'chasing', 'posturing', 'numbing'],
      naturalPhrases: [
        'the thing you wished for arriving beside the point',
        'a hollow where the feeling should be',
        'appetite gone out of the win'
      ]
    }
  },

  'cups-10': {
    id: 'cups-10',
    name: 'Ten of Cups',
    upright: {
      coreThemes: ['belonging', 'home', 'steady joy', 'a full house', 'family'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['noticing the ordinary things that make a place home', 'being held by your people'],
      actionQualities: ['gathering', 'sharing', 'sitting together', 'staying'],
      naturalPhrases: [
        'evenings on the veranda',
        'children underfoot',
        'someone laughing three rooms away',
        'a dish cooked in the same kitchen for decades'
      ]
    },
    reversed: {
      coreThemes: ['strain at home', 'a picture-perfect ideal', 'distance', 'disappointed hopes'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['comparing the real house to a postcard', 'someone missing or out of reach', 'a gathering where the talk doesn\'t meet'],
      actionQualities: ['idealising', 'distancing', 'comparing', 'bracing'],
      naturalPhrases: [
        'the postcard that doesn\'t match the household',
        'conversations that don\'t meet',
        'the ordinary good thing overlooked'
      ]
    }
  },

  // SWORDS (Mind, Conflict, Truth)
  'swords-ace': {
    id: 'swords-ace',
    name: 'Ace of Swords',
    upright: {
      coreThemes: ['sudden clarity', 'a clean cut of truth', 'a sharp idea', 'breakthrough', 'plain speech'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['saying the true thing precisely', 'catching the thought before it leaves'],
      actionQualities: ['clarifying', 'naming', 'cutting through', 'writing it down'],
      naturalPhrases: [
        'a sentence arriving whole',
        'a fact you can\'t unsee',
        'clear as glass',
        'tangles going plain'
      ]
    },
    reversed: {
      coreThemes: ['mental fog', 'blunt words', 'muddled thinking', 'truth as a weapon'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['scoring points with the truth', 'confusion that doesn\'t lift', 'sharpness aimed outward'],
      actionQualities: ['bluntness', 'muddle', 'wounding', 'stalling'],
      naturalPhrases: [
        'a sentence said too sharply',
        'the fog that stays',
        'truth that doesn\'t light the room'
      ]
    }
  },

  'swords-2': {
    id: 'swords-2',
    name: 'Two of Swords',
    upright: {
      coreThemes: ['standoff', 'a choice held off', 'not looking', 'a held breath', 'balance by force'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['noticing what you\'re keeping at arm\'s length', 'admitting you half-know'],
      actionQualities: ['hesitating', 'shielding', 'weighing', 'keeping both options'],
      naturalPhrases: [
        'a blindfold and two crossed swords',
        'two emails read four times',
        'a decision patient as a cat',
        'staying put as a choice'
      ]
    },
    reversed: {
      coreThemes: ['the blindfold slipping', 'a decision forced', 'pretending to be unsure', 'facing it'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['late choices', 'looking at what you\'ve avoided', 'owning a decision made for you'],
      actionQualities: ['deciding at last', 'opening your eyes', 'admitting', 'choosing'],
      naturalPhrases: [
        'a choice made late and owned',
        'the answer you already suspected',
        'a decision someone else made for you'
      ]
    }
  },

  'swords-3': {
    id: 'swords-3',
    name: 'Three of Swords',
    upright: {
      coreThemes: ['heartbreak', 'a hard truth sinking in', 'sorrow', 'betrayal', 'rain on glass'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['letting a hurt be its own size', 'not hurrying repair', 'grief without a fix'],
      actionQualities: ['smarting', 'admitting', 'crying', 'staying with it'],
      naturalPhrases: [
        'a heart pierced against a grey sky',
        'a message read twice',
        'a grief that is simple and complete',
        'the sentence that went in deep'
      ]
    },
    reversed: {
      coreThemes: ['mending', 'forgiving', 'a hurt dodged', 'numbing out'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['carrying on to avoid looking', 'noise as company for a sore place', 'relief that almost hurts'],
      actionQualities: ['distracting', 'numbing', 'avoiding', 'letting go finger by finger'],
      naturalPhrases: [
        'swords sliding out',
        'work and noise as cover',
        'the first relief nearly as painful as the wound'
      ]
    }
  },

  'swords-5': {
    id: 'swords-5',
    name: 'Five of Swords',
    upright: {
      coreThemes: ['a hollow win', 'conflict', 'winning at a cost', 'sour air', 'taking more than your share'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['seeing what winning cost', 'asking whether you\'d rather be right or close'],
      actionQualities: ['arguing', 'scoring', 'gathering', 'walking away'],
      naturalPhrases: [
        'the room after an argument',
        'cold coffee and a pushed-back chair',
        'being right and announcing it',
        'the quiet you sit in alone'
      ]
    },
    reversed: {
      coreThemes: ['making peace', 'laying a grudge down', 'regret', 'owning the damage'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['a fight past its reason', 'pride doing the talking', 'replaying the better sentence'],
      actionQualities: ['apologising', 'letting go', 'reflecting', 'withdrawing'],
      naturalPhrases: [
        'the argument carried into the shower',
        'unkindness called honesty',
        'learning, bill by bill, what winning costs'
      ]
    }
  },

  'swords-4': {
    id: 'swords-4',
    name: 'Four of Swords',
    upright: {
      coreThemes: ['rest', 'recovery', 'a deliberate pause', 'quiet', 'recharging'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['taking rest as part of the work', 'stopping after a fight'],
      actionQualities: ['resting', 'withdrawing', 'recovering', 'lying still'],
      naturalPhrases: [
        'a chair nobody else sits in',
        'curtains half drawn',
        'phone in another room on purpose',
        'a long exhale held for weeks'
      ]
    },
    reversed: {
      coreThemes: ['restlessness', 'running on empty', 'hiding in rest', 'no real break'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['pushing past the point where pushing helps', 'bed as a hiding place', 'a pause without a purpose'],
      actionQualities: ['overworking', 'hiding', 'bingeing sleep', 'avoiding stillness'],
      naturalPhrases: [
        'an empty chair',
        'a jaw clenched through the night',
        'rest that\'s really an escape'
      ]
    }
  },

  'swords-6': {
    id: 'swords-6',
    name: 'Six of Swords',
    upright: {
      coreThemes: ['passage', 'leaving a hard place', 'calmer water', 'quiet distance', 'moving on'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['carrying only what you need across', 'crossing without ceremony'],
      actionQualities: ['leaving', 'crossing', 'poling on', 'travelling light'],
      naturalPhrases: [
        'a ferry at dawn',
        'a bus before sunrise',
        'tiredness pointed the other way',
        'the near shore left behind'
      ]
    },
    reversed: {
      coreThemes: ['stuck at the shore', 'unfinished business', 'a rough crossing', 'reluctance'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['staying with a known pain', 'looking back the whole way over', 'a bag held on the dock'],
      actionQualities: ['loitering', 'hesitating', 'glancing back', 'clinging'],
      naturalPhrases: [
        'standing on the dock with the bag',
        'the far shore waiting patiently',
        'a passage that never quite happened'
      ]
    }
  },

  'swords-7': {
    id: 'swords-7',
    name: 'Seven of Swords',
    upright: {
      coreThemes: ['a hushed scheme', 'a shortcut', 'being sly', 'taking without asking', 'strategy'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['asking whether it\'s clever or evasive', 'seeing what you\'d say plainly'],
      actionQualities: ['planning', 'tiptoeing', 'smoothing over', 'keeping quiet'],
      naturalPhrases: [
        'a scant lie with a long shadow',
        'swords carried off in the night',
        'looking back over your shoulder',
        'a stone in a shoe'
      ]
    },
    reversed: {
      coreThemes: ['getting found out', 'coming clean', 'confession', 'the cover slipping'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['a lie getting bigger', 'the air cooling when someone knows', 'tiptoeing past the same spot'],
      actionQualities: ['confessing', 'unravelling', 'admitting', 'being found'],
      naturalPhrases: [
        'the lie sitting like a stone',
        'a room gone cooler',
        'the plain version waiting to be told'
      ]
    }
  },

  'swords-8': {
    id: 'swords-8',
    name: 'Eight of Swords',
    upright: {
      coreThemes: ['feeling boxed in', 'binding', 'a story of no way out', 'self-made limits', 'blinkers'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['seeing how slack the ropes are', 'asking who decided you can\'t'],
      actionQualities: ['stalling', 'waiting', 'telling yourself no', 'staying put'],
      naturalPhrases: [
        'a blindfold and loose ropes',
        'eight swords in a ring',
        'a wall you built and forgot',
        'the way out obvious to anyone but you'
      ]
    },
    reversed: {
      coreThemes: ['the blindfold lifting', 'seeing the way out', 'taking back a say', 'slack ropes'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['a rescue awaited so long it\'s a habit', 'the comfort of being stuck', 'a small step untried'],
      actionQualities: ['removing', 'testing', 'stepping', 'admitting'],
      naturalPhrases: [
        'the ropes never tested',
        'a habit of waiting to be rescued',
        'one small step within reach'
      ]
    }
  },

  'swords-9': {
    id: 'swords-9',
    name: 'Nine of Swords',
    upright: {
      coreThemes: ['night worry', 'racing thoughts', 'dread', 'sleepless', 'a mind on repeat'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['asking whether it\'s true or only loud', 'saying the fear out loud'],
      actionQualities: ['lying awake', 'looping', 'fretting', 'counting the fridge cycles'],
      naturalPhrases: [
        'three in the morning with the light on',
        'a thought returning in a worse coat',
        'a fear that thins by dawn',
        'the ceiling studied'
      ]
    },
    reversed: {
      coreThemes: ['easing', 'hope back', 'reaching out', 'the loop breaking'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['worry moved into the daytime', 'a fear running out of food', 'telling someone out loud'],
      actionQualities: ['telling someone', 'interrupting', 'easing', 'sleeping'],
      naturalPhrases: [
        'morning smaller than the night',
        'the oldest remedy and the least used',
        'a thought finally said aloud'
      ]
    }
  },

  'swords-10': {
    id: 'swords-10',
    name: 'Ten of Swords',
    upright: {
      coreThemes: ['a hard ending', 'rock bottom', 'a betrayal', 'the last straw', 'finality'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['letting an ending be an ending', 'lying still until you can stand'],
      actionQualities: ['ending', 'collapsing', 'resting', 'letting go'],
      naturalPhrases: [
        'face down on the bed',
        'relief at not having to hold it',
        'a thin dawn on the horizon',
        'nothing worse underneath'
      ]
    },
    reversed: {
      coreThemes: ['getting up', 'recovery', 'refusing to let it end', 'slow dawn'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['resurrecting what finished', 'clinging to wreckage', 'loyalty to the ruin'],
      actionQualities: ['standing', 'grieving', 'releasing', 'resisting'],
      naturalPhrases: [
        'the wreckage held out of loyalty',
        'a dawn thinner than expected',
        'an ending allowed to be one'
      ]
    }
  },

  // PENTACLES (Material, Body, Earth, Resources)
  'pentacles-ace': {
    id: 'pentacles-ace',
    name: 'Ace of Pentacles',
    upright: {
      coreThemes: ['a seed of substance', 'a practical opening', 'something real to hold', 'a plot of ground', 'prosperity beginning'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['saying yes plainly to a modest offer', 'starting at the size you can hold'],
      actionQualities: ['planting', 'accepting', 'starting small', 'holding'],
      naturalPhrases: [
        'an envelope passed across without comment',
        'a coin above a garden gate',
        'a slight chance that could grow',
        'weight in the palm'
      ]
    },
    reversed: {
      coreThemes: ['a chance let slip', 'a shaky promise', 'fool\'s gold', 'poor footing'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['an offer waved off for being small', 'a glittering plan distracting from dull ground', 'a seed kept in a pocket'],
      actionQualities: ['dismissing', 'chasing', 'pocketing', 'postponing'],
      naturalPhrases: [
        'an envelope gone stale on the table',
        'a seed that never leaves the pocket',
        'the dull real ground overlooked'
      ]
    }
  },

  'pentacles-3': {
    id: 'pentacles-3',
    name: 'Three of Pentacles',
    upright: {
      coreThemes: ['working together', 'a shared build', 'craft', 'each doing their part', 'skills combining'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['asking for a second pair of hands', 'offering your skill'],
      actionQualities: ['building', 'consulting', 'collaborating', 'carving'],
      naturalPhrases: [
        'an arch under construction',
        'a kitchen at the temple with no one in charge',
        'a mason, a monk and a plan',
        'a meal arriving on time'
      ]
    },
    reversed: {
      coreThemes: ['going it alone', 'crossed purposes', 'sloppy teamwork', 'unshared credit'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['doing alone what ten could do', 'competing for credit', 'work unacknowledged'],
      actionQualities: ['competing', 'shouldering', 'sniping', 'stepping back'],
      naturalPhrases: [
        'a hall kitchen short of hands and nobody saying so',
        'credit scrambled',
        'your own work going unmentioned'
      ]
    }
  },

  'pentacles-2': {
    id: 'pentacles-2',
    name: 'Two of Pentacles',
    upright: {
      coreThemes: ['juggling', 'keeping pace', 'flexibility', 'a shifting balance', 'making do'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['riding the swell', 'finding balance as a rhythm'],
      actionQualities: ['juggling', 'adjusting', 'jostling', 'keeping it moving'],
      naturalPhrases: [
        'two coins on an infinity loop',
        'three jobs and a family and the milk remembered',
        'balance that\'s kept up and not elegant',
        'ships on big waves'
      ]
    },
    reversed: {
      coreThemes: ['dropped balls', 'too many yeses', 'tangled priorities', 'swamped'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['saying yes to everything and being present for nothing', 'a ball already falling', 'a week that needs simplifying'],
      actionQualities: ['overcommitting', 'dropping', 'dithering', 'stopping altogether'],
      naturalPhrases: [
        'the milk forgotten again',
        'a sky full of what you didn\'t catch',
        'a simpler week allowed'
      ]
    }
  },

  'pentacles-4': {
    id: 'pentacles-4',
    name: 'Four of Pentacles',
    upright: {
      coreThemes: ['holding tight', 'security', 'guarding what\'s mine', 'staying put', 'saving'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['seeing what the grip costs', 'asking what\'s worth keeping'],
      actionQualities: ['saving', 'guarding', 'counting', 'clutching'],
      naturalPhrases: [
        'a coin balanced on the head and two beneath the feet',
        'a tin under the bed',
        'counting twice before spending',
        'being careful after a hard year'
      ]
    },
    reversed: {
      coreThemes: ['loosening the grip', 'spending too freely', 'hoarding', 'shaky finances'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['the hand around the tin gone white', 'spending so freely it doesn\'t register', 'crossing the line both ways'],
      actionQualities: ['releasing', 'scattering', 'clutching', 'swinging'],
      naturalPhrases: [
        'a tin full and a hand pale around it',
        'money going out unnoticed',
        'the thin line between care and hoarding'
      ]
    }
  },

  'pentacles-5': {
    id: 'pentacles-5',
    name: 'Five of Pentacles',
    upright: {
      coreThemes: ['a lean patch', 'cold and alone', 'struggle', 'feeling left out', 'not looking up'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['noticing the lit window', 'asking for the help that\'s near'],
      actionQualities: ['trudging', 'enduring', 'shivering', 'passing by'],
      naturalPhrases: [
        'two figures in snow past a church window',
        'a warm restaurant with nothing in your pocket',
        'help you didn\'t ask for because you didn\'t know how',
        'winters you\'d rather forget'
      ]
    },
    reversed: {
      coreThemes: ['things thawing', 'help in sight', 'recovering', 'coming in from the cold'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['turning down every offer from pride', 'colder than needed', 'a door that was there all along'],
      actionQualities: ['accepting', 'thawing', 'stepping in', 'asking'],
      naturalPhrases: [
        'a window lit across the street',
        'a pride that cost warmth',
        'help in sight and held off'
      ]
    }
  },

  'pentacles-6': {
    id: 'pentacles-6',
    name: 'Six of Pentacles',
    upright: {
      coreThemes: ['fair exchange', 'sharing', 'giving and receiving', 'kindness with a ledger', 'support'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['noticing which is harder, giving or receiving', 'sharing without an invoice'],
      actionQualities: ['giving', 'receiving', 'sharing', 'weighing'],
      naturalPhrases: [
        'a merchant with scales',
        'a bag of mangoes at the door',
        'a bowl of rice carried over',
        'no one keeping score'
      ]
    },
    reversed: {
      coreThemes: ['uneven giving', 'strings attached', 'owing', 'stinginess'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['a gift with a string round the handle', 'the one counting is you', 'receiving as the hard half'],
      actionQualities: ['tallying', 'hoarding', 'over-giving', 'resenting'],
      naturalPhrases: [
        'mangoes with a string tied on',
        'scales crooked',
        'the ledger kept in your head'
      ]
    }
  },

  'pentacles-7': {
    id: 'pentacles-7',
    name: 'Seven of Pentacles',
    upright: {
      coreThemes: ['waiting on growth', 'the long view', 'a pause to assess', 'tended and unripe', 'steady effort'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['watering without asking for proof', 'telling patience from sunk cost'],
      actionQualities: ['tending', 'waiting', 'watering', 'assessing'],
      naturalPhrases: [
        'a man leaning on his hoe',
        'a garden looked over',
        'the plant\'s turn now',
        'lunch made while it grows'
      ]
    },
    reversed: {
      coreThemes: ['impatience', 'poor yield', 'quitting early', 'second-guessing the plot'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['digging up the seed to check it', 'walking off a field a week before it comes in', 'wondering if it\'s the wrong field'],
      actionQualities: ['checking', 'abandoning', 'doubting', 'uprooting'],
      naturalPhrases: [
        'weeks of watering with nothing showing',
        'a seed dug up to look',
        'a field that may be the wrong one'
      ]
    }
  },

  'pentacles-8': {
    id: 'pentacles-8',
    name: 'Eight of Pentacles',
    upright: {
      coreThemes: ['practice', 'skill through repetition', 'devotion to craft', 'diligence', 'patient mastery'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['working for the work\'s sake', 'getting better where nobody sees'],
      actionQualities: ['practising', 'carving', 'repeating', 'showing up'],
      naturalPhrases: [
        'an apprentice at the bench',
        'the same small movement two thousand times',
        'a master watching without a word',
        'skill building unnoticed'
      ]
    },
    reversed: {
      coreThemes: ['going through the motions', 'cutting corners', 'boredom', 'careless work'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['a craft turned to chore', 'a mind elsewhere while hands work', 'recommitting or moving on honestly'],
      actionQualities: ['drifting', 'skimping', 'coasting', 'stopping'],
      naturalPhrases: [
        'hands on the bench and mind somewhere else',
        'a pleasure gone to chore',
        'a corner cut when no one was looking'
      ]
    }
  },

  'pentacles-9': {
    id: 'pentacles-9',
    name: 'Nine of Pentacles',
    upright: {
      coreThemes: ['self-reliance', 'a garden of one\'s own', 'refined comfort', 'earned ease', 'poise'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['enjoying what you built alone', 'taking the quiet as earned'],
      actionQualities: ['enjoying', 'tending', 'wandering a vineyard', 'sitting back'],
      naturalPhrases: [
        'a falcon on a gloved hand',
        'coffee made exactly how you like it',
        'a house bought yourself',
        'an hour with no one to answer to'
      ]
    },
    reversed: {
      coreThemes: ['lonely luxury', 'keeping up appearances', 'dependence', 'thin comfort'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['a lovely surface over a crack', 'effort spent looking like it\'s all in hand', 'a garden with no one to show'],
      actionQualities: ['performing', 'hiding', 'depending', 'polishing'],
      naturalPhrases: [
        'a garden with no one to show',
        'a crack under the polish',
        'help unasked for because things must look fine'
      ]
    }
  },

  'pentacles-10': {
    id: 'pentacles-10',
    name: 'Ten of Pentacles',
    upright: {
      coreThemes: ['legacy', 'family ground', 'what\'s handed down', 'roots', 'lasting security'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['seeing the long chain you\'re part of', 'building something that outlasts you'],
      actionQualities: ['inheriting', 'gathering', 'passing on', 'staying'],
      naturalPhrases: [
        'three generations in one room',
        'a dish cooked in the same kitchen for forty years',
        'someone asleep on the sofa',
        'a house with a long history'
      ]
    },
    reversed: {
      coreThemes: ['a shaky inheritance', 'family strain', 'wealth without warmth', 'a cracked foundation'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['a house smaller than remembered', 'money put before people', 'an inheritance other than expected'],
      actionQualities: ['dividing', 'hoarding', 'drifting', 'resenting'],
      naturalPhrases: [
        'the grandparents\' house gone smaller',
        'a family strained',
        'what you hoped to build needing redefining'
      ]
    }
  },

  // COURT CARDS - WANDS
  'wands-page': {
    id: 'wands-page',
    name: 'Page of Wands',
    upright: {
      coreThemes: ['eagerness', 'a fresh try', 'bold curiosity', 'new ideas', 'beginner\'s fire'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['being happy to be bad at it first', 'following excitement without a destination'],
      actionQualities: ['trying', 'exploring', 'chattering', 'tinkering'],
      naturalPhrases: [
        'the friend\'s fifth plan',
        'a wand held like a discovery',
        'a desert with pyramids behind',
        'an appetite for something you can\'t do yet'
      ]
    },
    reversed: {
      coreThemes: ['all talk', 'half-started things', 'procrastination', 'shaky nerve'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['fear of looking foolish', 'a string of ideas never begun', 'enthusiasm without a place to go'],
      actionQualities: ['talking', 'postponing', 'dabbling', 'hiding'],
      naturalPhrases: [
        'the fifth plan sounding like the first four',
        'ideas talked about and not started',
        'a beginner afraid of looking like one'
      ]
    }
  },

  'wands-knight': {
    id: 'wands-knight',
    name: 'Knight of Wands',
    upright: {
      coreThemes: ['bold pursuit', 'a rush of heat', 'adventure', 'dash', 'full-tilt confidence'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['asking whether the heat is wanting or restlessness', 'moving with intention'],
      actionQualities: ['charging', 'chasing', 'booking the flight', 'improvising'],
      naturalPhrases: [
        'a rearing horse in the desert',
        'the cousin who figures it out',
        'a story worth the small chaos',
        'fire and not much hesitation'
      ]
    },
    reversed: {
      coreThemes: ['hasty', 'burning out', 'scattered heat', 'impulse in charge'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['impulse running ahead of intention', 'heat with nowhere to go', 'another person cleaning up the mess'],
      actionQualities: ['bolting', 'flaring', 'stalling', 'burning'],
      naturalPhrases: [
        'a horse that never left the stable',
        'a burn bright then out',
        'the calls to clean it up'
      ]
    }
  },

  'wands-queen': {
    id: 'wands-queen',
    name: 'Queen of Wands',
    upright: {
      coreThemes: ['radiance', 'self-possession', 'warmth with nerve', 'charisma', 'independence'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['being fully present without shoving', 'saying what you bring'],
      actionQualities: ['radiating', 'welcoming', 'claiming', 'holding court'],
      naturalPhrases: [
        'a sunflower in the hand',
        'a room rearranging itself',
        'warmth for the ones she likes',
        'a black cat at her feet'
      ]
    },
    reversed: {
      coreThemes: ['dimming down', 'performed confidence', 'envy', 'a bruised ego'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['making yourself smaller to keep others comfortable', 'bravado as power\'s costume', 'seeing through a posture'],
      actionQualities: ['shrinking', 'performing', 'sulking', 'bluffing'],
      naturalPhrases: [
        'walking into the room and making herself smaller by inches',
        'a confidence everyone saw through',
        'fire gone inward'
      ]
    }
  },

  'wands-king': {
    id: 'wands-king',
    name: 'King of Wands',
    upright: {
      coreThemes: ['vision', 'bold command', 'conviction', 'a leader others follow', 'big-picture energy'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['standing behind what you believe', 'leading by steadiness'],
      actionQualities: ['envisioning', 'inspiring', 'building', 'staking'],
      naturalPhrases: [
        'a throne of lions and salamanders',
        'the founder who sees the shape of a mess',
        'a belief that makes it possible for others',
        'the odds understood'
      ]
    },
    reversed: {
      coreThemes: ['bossiness', 'ego', 'all push', 'dropped reins'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['pressure in the place of vision', 'reins left on the floor', 'fear used as fuel'],
      actionQualities: ['pushing', 'dominating', 'abdicating', 'bluffing'],
      naturalPhrases: [
        'a vision hardened into pressure',
        'control borrowing conviction\'s coat',
        'reins lying where they fell'
      ]
    }
  },

  // COURT CARDS - CUPS
  'cups-page': {
    id: 'cups-page',
    name: 'Page of Cups',
    upright: {
      coreThemes: ['a creative itch', 'a message from the heart', 'curiosity', 'soft feeling', 'openness'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['taking a whim seriously', 'letting a feeling turn up in costume', 'curiosity over analysis'],
      actionQualities: ['doodling', 'wondering', 'trying', 'letting be silly'],
      naturalPhrases: [
        'a fish popping up to say hello',
        'an idea that arrived sideways',
        'an urge to draw, write or ring someone',
        'a story told about a shell'
      ]
    },
    reversed: {
      coreThemes: ['emotional awkwardness', 'dismissed ideas', 'escapism', 'performing feelings'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['calling a nudge silly before it finishes', 'acting delighted you aren\'t', 'shyness about the whim'],
      actionQualities: ['dismissing', 'faking', 'hiding', 'avoiding'],
      naturalPhrases: [
        'a sentence cut off by embarrassment',
        'a distracted nod at the child',
        'a whim waved away'
      ]
    }
  },

  'cups-knight': {
    id: 'cups-knight',
    name: 'Knight of Cups',
    upright: {
      coreThemes: ['romance', 'following a feeling', 'devotion', 'charm', 'idealism'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['trusting a pull you can\'t justify', 'offering something sincerely', 'being drawn by beauty'],
      actionQualities: ['pursuing', 'offering', 'riding at a walk', 'carrying something carefully'],
      naturalPhrases: [
        'a cup held out like something that might spill',
        'a handwritten letter',
        'a pull toward beauty you\'d be shy to explain',
        'a slow, sincere approach'
      ]
    },
    reversed: {
      coreThemes: ['empty gestures', 'mood-driven', 'fantasy over fact', 'jealousy'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['loving the idea of someone', 'charm covering a lack of follow-through', 'a letter that never posted'],
      actionQualities: ['posturing', 'drifting', 'promising', 'sulking'],
      naturalPhrases: [
        'an affection that lives on paper',
        'a promise outrunning the follow-through',
        'mood steering the week'
      ]
    }
  },

  'cups-queen': {
    id: 'cups-queen',
    name: 'Queen of Cups',
    upright: {
      coreThemes: ['compassion', 'emotional depth', 'intuitive care', 'a steady heart', 'listening'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['reading someone\'s weather without being carried off', 'keeping your own footing'],
      actionQualities: ['listening', 'tending', 'steadying', 'sensing'],
      naturalPhrases: [
        'an ornate closed cup',
        'the friend you ring at a bad hour',
        'a silence that carries',
        'knowing when to speak'
      ]
    },
    reversed: {
      coreThemes: ['soaking up others\' moods', 'overwhelm', 'poor boundaries', 'withdrawing'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['not knowing whose feeling is whose', 'your own going under', 'shutting the door to stay dry'],
      actionQualities: ['absorbing', 'drowning', 'closing off', 'over-caring'],
      naturalPhrases: [
        'a well that runs dry',
        'someone else\'s mood on your skin',
        'care that forgot where it started'
      ]
    }
  },

  'cups-king': {
    id: 'cups-king',
    name: 'King of Cups',
    upright: {
      coreThemes: ['emotional steadiness', 'generosity', 'calm under waves', 'mature feeling', 'wise counsel'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['feeling a great deal and keeping your head', 'making room for the storm'],
      actionQualities: ['steadying', 'counselling', 'holding', 'staying present'],
      naturalPhrases: [
        'a throne on rough water',
        'the father who made the tea',
        'one clear question',
        'feeling it later, alone'
      ]
    },
    reversed: {
      coreThemes: ['manipulative moods', 'shutting down', 'volatility', 'distance'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['using feeling as leverage', 'a room gone cold', 'swinging between flooding and shutdown'],
      actionQualities: ['steering with mood', 'withdrawing', 'erupting', 'stonewalling'],
      naturalPhrases: [
        'a locked room where a steady person was',
        'mood as a lever',
        'the thing nobody says about what\'s wrong'
      ]
    }
  },

  // COURT CARDS - SWORDS
  'swords-page': {
    id: 'swords-page',
    name: 'Page of Swords',
    upright: {
      coreThemes: ['quick questions', 'an alert mind', 'new ideas', 'watchfulness', 'eagerness to learn'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['asking before concluding', 'checking what you\'ve heard'],
      actionQualities: ['asking', 'watching', 'testing', 'scribbling'],
      naturalPhrases: [
        'a sword held aloft on a windy hill',
        'a teenager with one book',
        'the sentence ready before the thought',
        'wanting to know'
      ]
    },
    reversed: {
      coreThemes: ['barbed talk', 'gossip', 'collecting without using', 'criticism for sport'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['cleverness that tears down', 'facts hoarded and idle', 'a tongue quicker than kindness'],
      actionQualities: ['sniping', 'hoarding', 'showing off', 'prying'],
      naturalPhrases: [
        'the remark that left a sour taste',
        'questions kept like stamps',
        'quick that isn\'t kind'
      ]
    }
  },

  'swords-knight': {
    id: 'swords-knight',
    name: 'Knight of Swords',
    upright: {
      coreThemes: ['swift decision', 'directness', 'all-in thinking', 'courage of conviction', 'ambition'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['asking where certainty serves and where it flattens'],
      actionQualities: ['charging', 'arguing', 'pushing', 'speaking plainly'],
      naturalPhrases: [
        'a gallop across a windy field',
        'a friend who told you the truth in the street',
        'speed and certainty arriving together',
        'thinking at full tilt'
      ]
    },
    reversed: {
      coreThemes: ['rash', 'bulldozing', 'sharp-tongued', 'a rushed plan'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['reply before the truth had cleared', 'wavering at the gate', 'speed overtaking thought'],
      actionQualities: ['rushing', 'blurting', 'wavering', 'bruising'],
      naturalPhrases: [
        'a horse at the gate that never goes',
        'bruises on people you meant to protect',
        'one breath before the next sprint'
      ]
    }
  },

  'swords-queen': {
    id: 'swords-queen',
    name: 'Queen of Swords',
    upright: {
      coreThemes: ['clear sight', 'candour', 'independence', 'a sharp eye', 'discernment'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['seeing through it without making a fuss', 'being honest and warm in one sentence'],
      actionQualities: ['assessing', 'seeing', 'speaking plainly', 'cooling the edges'],
      naturalPhrases: [
        'a profile against cloud',
        'the woman who was kind where it mattered',
        'an honest assessment',
        'clarity with no cruelty'
      ]
    },
    reversed: {
      coreThemes: ['a cold edge', 'bitterness', 'harsh judgement', 'looking away'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['clarity that chilled', 'a wound called a sharp remark', 'politely not saying what you see'],
      actionQualities: ['cutting', 'withholding', 'sneering', 'watching'],
      naturalPhrases: [
        'an obvious thing left unsaid',
        'sharp where kindness was needed',
        'a room that feels the chill'
      ]
    }
  },

  'swords-king': {
    id: 'swords-king',
    name: 'King of Swords',
    upright: {
      coreThemes: ['fair judgement', 'thought-out authority', 'clear reasoning', 'principle', 'the final word'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['laying out the evidence before the verdict', 'being fair as well as right'],
      actionQualities: ['judging', 'reasoning', 'weighing', 'deciding'],
      naturalPhrases: [
        'a straight back on a throne',
        'the elder who didn\'t need to be liked',
        'a hard truth held without dressing it up',
        'a standard that holds'
      ]
    },
    reversed: {
      coreThemes: ['cold command', 'using logic to win', 'dogmatism', 'abdicating the decision'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['a rule applied because it\'s easy', 'a decision put off for somebody else to make', 'reason without mercy'],
      actionQualities: ['dictating', 'deferring', 'ruling', 'avoiding'],
      naturalPhrases: [
        'right and alone',
        'a person standing where a rule was applied',
        'a decision circled because it\'s uncomfortable'
      ]
    }
  },

  // COURT CARDS - PENTACLES
  'pentacles-page': {
    id: 'pentacles-page',
    name: 'Page of Pentacles',
    upright: {
      coreThemes: ['a first lesson', 'practical curiosity', 'groundwork', 'studiousness', 'a modest start'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['starting as someone who doesn\'t yet know', 'giving the first hour its due'],
      actionQualities: ['studying', 'saving', 'practising', 'starting small'],
      naturalPhrases: [
        'a coin studied like a rare find',
        'a child counting coins from a jar',
        'a book on the desk',
        'the saving as the lesson'
      ]
    },
    reversed: {
      coreThemes: ['procrastination', 'a plan with no doing', 'distraction', 'a wasted chance'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['the plan that never becomes the first hour', 'shiny things pulling from slow ones', 'a chance to learn left unused'],
      actionQualities: ['postponing', 'planning', 'wandering', 'dabbling'],
      naturalPhrases: [
        'a jar left untouched',
        'an eternal plan',
        'the real work still waiting'
      ]
    }
  },

  'pentacles-knight': {
    id: 'pentacles-knight',
    name: 'Knight of Pentacles',
    upright: {
      coreThemes: ['reliability', 'the long haul', 'methodical effort', 'dependability', 'slow and sure'],
      emotionalTone: 'neutral',
      psychologicalFocus: ['turning up again without results in sight', 'trusting a slow build'],
      actionQualities: ['plodding', 'checking', 'finishing', 'turning up'],
      naturalPhrases: [
        'a friend with coffee at eight and a plan',
        'a dark horse standing still in a ploughed field',
        'the thorough way',
        'dull that lasts'
      ]
    },
    reversed: {
      coreThemes: ['a rut', 'stubbornness', 'dullness', 'careless haste'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['routine whose purpose has left', 'hurry where care was needed', 'stubbornness mistaken for perseverance'],
      actionQualities: ['grinding', 'hurrying', 'digging in', 'coasting'],
      naturalPhrases: [
        'a routine running on after its purpose',
        'a dropped thing from haste',
        'faithfulness that needs a new course'
      ]
    }
  },

  'pentacles-queen': {
    id: 'pentacles-queen',
    name: 'Queen of Pentacles',
    upright: {
      coreThemes: ['practical warmth', 'comfort made real', 'generosity', 'embodied care', 'a well-kept home'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['attending to a room, a meal, a body', 'being fed as well as feeding'],
      actionQualities: ['cooking', 'tending', 'warming', 'arranging'],
      naturalPhrases: [
        'an aunt\'s warm house',
        'cats that come when called',
        'a plate and somewhere comfortable to sit',
        'care in the details'
      ]
    },
    reversed: {
      coreThemes: ['neglecting yourself', 'hovering care', 'money worries', 'a tired house'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['everyone else\'s meals cooked and yours skipped', 'a room, a budget or a body neglected', 'caretaking as a way to avoid your own life'],
      actionQualities: ['hovering', 'skipping', 'fretting', 'overgiving'],
      naturalPhrases: [
        'the kitchen warm and the cook unfed',
        'caretaking that dodges your own life',
        'coming first just this once'
      ]
    }
  },

  'pentacles-king': {
    id: 'pentacles-king',
    name: 'King of Pentacles',
    upright: {
      coreThemes: ['abundance well kept', 'stewardship', 'solid ground', 'practical mastery', 'a lasting build'],
      emotionalTone: 'expansive',
      psychologicalFocus: ['holding resources lightly', 'using what you have well'],
      actionQualities: ['building', 'keeping', 'paying on time', 'looking after'],
      naturalPhrases: [
        'a shopkeeper of forty years',
        'a throne of bulls',
        'workers paid on time',
        'a thing that lasted because he never needed to say so'
      ]
    },
    reversed: {
      coreThemes: ['greed', 'clutching', 'carelessness with resources', 'stubbornness'],
      emotionalTone: 'challenging',
      psychologicalFocus: ['counting too hard or not looking at the books', 'wealth running ahead of values', 'accounts left to themselves'],
      actionQualities: ['hoarding', 'neglecting', 'refusing', 'clutching'],
      naturalPhrases: [
        'a shop counted too hard or not at all',
        'wealth that outran values',
        'holding things a little more lightly still possible'
      ]
    }
  }
};

/**
 * Get card archetype by ID and orientation
 */
export function getCardArchetype(cardId: string, isReversed: boolean = false): CardArchetype['upright'] | undefined {
  const card = cardArchetypes[cardId];
  if (!card) return undefined;

  return isReversed ? card.reversed : card.upright;
}

/**
 * Get a random natural phrase for a card
 */
export function getRandomCardPhrase(cardId: string, isReversed: boolean = false): string {
  const archetype = getCardArchetype(cardId, isReversed);
  if (!archetype) return '';

  const phrases = archetype.naturalPhrases;
  return phrases[Math.floor(Math.random() * phrases.length)];
}
