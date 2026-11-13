/**
 * Insight Generator v2
 *
 * Generates natural, conversational insights by combining:
 * - Card archetypes
 * - Transit templates
 * - House contexts
 * - Insight structure templates
 */

import type { SkyReadout } from './card-readout';
import type { DetectedPattern } from './pattern-detector';
import { CardArchetype, getCardArchetype, getRandomCardPhrase } from '../data/card-archetypes';
import { getRandomTransitOpener, getTimingPhrase, planetMeanings } from '../data/transit-templates';
import { getRandomHousePhrase, getHouseEmotionalResonance, getRandomHouseQuestion, houseContexts } from '../data/house-contexts';
import {
  insightStructureTemplates,
  keyPhraseTemplates,
  natalPlanetMeanings,
  transitingPlanetActions,
  aspectDescriptions,
  cardArchetypeSynthesis,
  transitActionModifiers
} from '../data/insight-structure-templates';

export interface TransitData {
  transitingPlanet: string;
  natalPlanet: string;
  aspectType: 'square' | 'opposition' | 'conjunction' | 'trine' | 'sextile';
  phase: 'approaching' | 'peak' | 'separating';
  house: number;
  daysRemaining?: number;
}

export interface GeneratedInsight {
  keyPhrase: string;
  insight: string;
  action: string;
  transitInfo: string;
  transitExplanation: {
    transitingPlanet: string;
    transitingPlanetMeaning: string;
    natalPlanet: string;
    natalPlanetMeaning: string;
    aspectType: string;
    aspectMeaning: string;
    phaseMeaning: string;
  };
  /**
   * The reading page's margin column, cached alongside the insight.
   *
   * Kept with the reading rather than recomputed on open, so a card pulled up
   * six months later reports the sky it was actually drawn under. Optional
   * because readings cached before this existed have none, and the page omits
   * the rows it has no number for.
   */
  readout?: {
    /** Degrees from exact, for the margin's orb row. */
    orb: number | null;
    /** Whether the aspect is at peak — the log line's EXACT: YES/NO. */
    exact: boolean;
    sky: SkyReadout | null;
  };
  /**
   * Every pattern stamp worth naming that day, cached alongside the insight
   * for the same reason `readout` is: a card pulled up later should show the
   * pattern situation as it was the day it was drawn, not recomputed against
   * today's history.
   */
  patterns?: DetectedPattern[];
}

/**
 * Main insight generator
 */
export function generateInsight(
  cardId: string,
  transit: TransitData,
  isReversed: boolean = false
): GeneratedInsight | null {
  const cardArchetype = getCardArchetype(cardId, isReversed);
  if (!cardArchetype) {
    console.error(`No archetype found for card: ${cardId}`);
    return null;
  }

  // Determine the overall emotional tone
  const combinedTone = getCombinedTone(cardArchetype, transit);

  // Select appropriate structure template
  const structureTemplate = selectStructureTemplate(cardArchetype, transit, combinedTone);

  // Build the insight
  const insight = buildInsight(cardId, cardArchetype, transit, structureTemplate, combinedTone, isReversed);

  // Build a transit-aware action by blending the card's base action with the planet's modifier
  const cardSynthesisData = getCardSynthesis(cardId, cardArchetype);
  const action = buildTransitAwareAction(cardSynthesisData.action, transit, combinedTone);

  // Build the key phrase
  const keyPhrase = buildKeyPhrase(cardArchetype, transit, combinedTone);

  // Build transit info string
  const transitInfo = buildTransitInfo(transit);

  // Build transit explanation
  const transitExplanation = buildTransitExplanation(transit);

  return {
    keyPhrase,
    insight,
    action,
    transitInfo,
    transitExplanation
  };
}

/**
 * Determine the combined emotional tone
 */
function getCombinedTone(
  cardArchetype: CardArchetype['upright'],
  transit: TransitData
): 'challenging' | 'neutral' | 'expansive' {
  const transitTone = getTransitTone(transit.aspectType);

  // If both are challenging, it's challenging
  if (cardArchetype.emotionalTone === 'challenging' && transitTone === 'challenging') {
    return 'challenging';
  }

  // If both are expansive, it's expansive
  if (cardArchetype.emotionalTone === 'expansive' && transitTone === 'expansive') {
    return 'expansive';
  }

  // If one is challenging, lean challenging
  if (cardArchetype.emotionalTone === 'challenging' || transitTone === 'challenging') {
    return 'challenging';
  }

  // If one is expansive, lean expansive
  if (cardArchetype.emotionalTone === 'expansive' || transitTone === 'expansive') {
    return 'expansive';
  }

  return 'neutral';
}

function getTransitTone(aspectType: string): 'challenging' | 'neutral' | 'expansive' {
  const challenging = ['square', 'opposition'];
  const expansive = ['trine', 'sextile'];

  if (challenging.includes(aspectType)) return 'challenging';
  if (expansive.includes(aspectType)) return 'expansive';
  return 'neutral';
}

/**
 * Select appropriate structure template
 */
function selectStructureTemplate(
  cardArchetype: CardArchetype['upright'],
  transit: TransitData,
  combinedTone: 'challenging' | 'neutral' | 'expansive'
) {
  const transitTone = getTransitTone(transit.aspectType);

  // Filter templates that match the tones
  const suitableTemplates = insightStructureTemplates.filter(template => {
    const matchesTransit = template.bestFor.transitTone.includes(transitTone);
    const matchesCard = template.bestFor.cardTone.includes(cardArchetype.emotionalTone);
    return matchesTransit && matchesCard;
  });

  if (suitableTemplates.length === 0) {
    // Fallback to any template
    return insightStructureTemplates[0];
  }

  // Random selection from suitable templates
  return suitableTemplates[Math.floor(Math.random() * suitableTemplates.length)];
}

/**
 * Build the full insight text - SYNTHESIS-FOCUSED
 */
function buildInsight(
  cardId: string,
  cardArchetype: CardArchetype['upright'],
  transit: TransitData,
  structureTemplate: any,
  combinedTone: 'challenging' | 'neutral' | 'expansive',
  isReversed: boolean
): string {
  let insight = structureTemplate.structure;

  // Transiting planet (capitalize first letter)
  const transitingPlanet = transit.transitingPlanet.charAt(0).toUpperCase() + transit.transitingPlanet.slice(1);
  insight = insight.replace(/{transiting_planet}/g, transitingPlanet);

  // Natal planet
  const natalPlanet = transit.natalPlanet.charAt(0).toUpperCase() + transit.natalPlanet.slice(1);
  insight = insight.replace(/{natal_planet}/g, natalPlanet);

  // Natal planet meaning IN YOUR CHART
  const natalMeanings = natalPlanetMeanings[transit.natalPlanet.toLowerCase()] || ['your inner nature'];
  const natalPlanetMeaning = selectRandomFromArray(natalMeanings);
  insight = insight.replace(/{natal_planet_meaning}/g, natalPlanetMeaning);

  // Aspect description
  const aspectDescs = aspectDescriptions[transit.aspectType] || ['aspecting'];
  const aspectDescription = selectRandomFromArray(aspectDescs);
  insight = insight.replace(/{aspect_description}/g, aspectDescription);

  // House number and theme
  const houseContext = houseContexts[transit.house];
  const houseTheme = houseContext ? houseContext.coreThemes[0] : 'life';

  // Proper ordinal formatting (1st, 2nd, 3rd, 4th, etc.)
  const getOrdinal = (n: number) => {
    const s = ['th', 'st', 'nd', 'rd'];
    const v = n % 100;
    return n + (s[(v - 20) % 10] || s[v] || s[0]);
  };

  insight = insight.replace(/{house_number}/g, `${getOrdinal(transit.house)} house`);
  insight = insight.replace(/{house_theme}/g, houseTheme);

  // Synthesis - the combined meaning
  const cardSynthesis = getCardSynthesis(cardId, cardArchetype);
  let synthesisText = selectRandomFromArray(cardSynthesis.synthesis);
  synthesisText = synthesisText.replace(/{house_theme}/g, houseTheme);
  synthesisText = synthesisText.replace(/{transiting_planet}/g, transitingPlanet);
  synthesisText = synthesisText.replace(/{natal_planet}/g, natalPlanet);
  insight = insight.replace(/{synthesis}/g, synthesisText);

  return insight;
}

/**
 * Build emotional reality statement
 */
function buildEmotionalReality(cardArchetype: CardArchetype['upright'], transit: TransitData): string {
  const templates = {
    challenging: [
      'the edges feel sharp today',
      'there is some strain in the air',
      'something is rubbing',
      'the pressure is hard to miss',
      'a lot of small frictions'
    ],
    neutral: [
      'things are between states',
      'something is turning over',
      'a slow change is under way',
      'there is a lot being digested'
    ],
    expansive: [
      'a bit more room than usual',
      'something is loosening',
      'there is lightness near the edges',
      'an easier current is running'
    ]
  };

  const tone = cardArchetype.emotionalTone;
  return selectRandomFromArray(templates[tone]);
}

/**
 * Fill in perspective template with card-specific details
 */
function fillPerspective(template: string, cardArchetype: CardArchetype['upright']): string {
  let filled = template;

  // Replace card action
  if (filled.includes('{card_action}')) {
    const action = selectRandomFromArray(cardArchetype.actionQualities);
    filled = filled.replace('{card_action}', action);
  }

  // Replace card quality
  if (filled.includes('{card_quality}')) {
    const quality = selectRandomFromArray(cardArchetype.coreThemes);
    filled = filled.replace('{card_quality}', quality);
  }

  // Replace transit action (if present)
  if (filled.includes('{transit_action}')) {
    filled = filled.replace('{transit_action}', 'the transit');
  }

  return filled;
}

/**
 * Fill in closing template with card-specific details
 */
function fillClosing(template: string, cardArchetype: CardArchetype['upright']): string {
  let filled = template;

  if (filled.includes('{card_action}')) {
    const action = selectRandomFromArray(cardArchetype.actionQualities);
    filled = filled.replace('{card_action}', action);
  }

  if (filled.includes('{card_quality}')) {
    const quality = selectRandomFromArray(cardArchetype.coreThemes);
    filled = filled.replace('{card_quality}', quality);
  }

  return filled;
}

/**
 * Build key phrase
 */
function buildKeyPhrase(
  cardArchetype: CardArchetype['upright'],
  transit: TransitData,
  combinedTone: 'challenging' | 'neutral' | 'expansive'
): string {
  const templates = keyPhraseTemplates[combinedTone];
  let phrase = selectRandomFromArray(templates);

  // Fill in placeholders
  if (phrase.includes('{card_action}')) {
    const action = selectRandomFromArray(cardArchetype.actionQualities);
    phrase = phrase.replace('{card_action}', action);
  }

  if (phrase.includes('{card_quality}')) {
    const quality = selectRandomFromArray(cardArchetype.coreThemes);
    phrase = phrase.replace('{card_quality}', quality);
  }

  if (phrase.includes('{house_theme}')) {
    // Map house number to meaningful theme
    const houseThemeMap: Record<number, string> = {
      1: 'self',
      2: 'worth',
      3: 'voice',
      4: 'foundation',
      5: 'joy',
      6: 'work',
      7: 'relationships',
      8: 'transformation',
      9: 'beliefs',
      10: 'legacy',
      11: 'future',
      12: 'inner world'
    };
    const theme = houseThemeMap[transit.house] || 'life';
    phrase = phrase.replace('{house_theme}', theme);
  }

  return phrase;
}

/**
 * Build transit info string for marquee
 */
function buildTransitInfo(transit: TransitData): string {
  const phaseLabel = {
    approaching: 'approaching',
    peak: 'exact',
    separating: 'separating'
  }[transit.phase];

  const parts = [
    `${transit.transitingPlanet} ${transit.aspectType} ${transit.natalPlanet}`,
    phaseLabel
  ];

  if (transit.daysRemaining !== undefined) {
    parts.push(`${transit.daysRemaining} days remaining`);
  }

  return parts.join(' • ');
}

/**
 * Build transit explanation for expanded view
 */
function buildTransitExplanation(transit: TransitData) {
  const aspectMeanings: Record<string, string> = {
    square: 'a 90° angle, two planets at right angles to each other, which tends to feel like friction',
    opposition: 'a 180° angle, two planets facing across the chart, which tends to feel like a pull in two directions',
    conjunction: 'a 0° angle, two planets in the same place, so their themes mix and get louder together',
    trine: 'a 120° angle, two planets in easy contact, which tends to feel like things moving without effort',
    sextile: 'a 60° angle, two planets lightly connected, which tends to feel like a small opening you can use if you spot it'
  };

  const phaseMeanings: Record<string, string> = {
    approaching: 'the transit is still closing in on its exact point, so the feeling tends to build a little each day.',
    peak: 'the transit is exact today, which is when its themes tend to be loudest.',
    separating: 'the transit has passed its exact point and is easing off, though what it stirred up may still be silting down.'
  };

  return {
    transitingPlanet: transit.transitingPlanet,
    transitingPlanetMeaning: selectRandomFromArray(planetMeanings[transit.transitingPlanet] || ['change']),
    natalPlanet: transit.natalPlanet,
    natalPlanetMeaning: selectRandomFromArray(planetMeanings[transit.natalPlanet] || ['your nature']),
    aspectType: transit.aspectType,
    aspectMeaning: aspectMeanings[transit.aspectType],
    phaseMeaning: phaseMeanings[transit.phase]
  };
}

/**
 * Get card synthesis - archetype + synthesis messages
 */
function getCardSynthesis(cardId: string, cardArchetype: CardArchetype['upright']): { synthesis: string[]; action: string } {
  // Check if specific card has synthesis
  if (cardArchetypeSynthesis[cardId]) {
    return cardArchetypeSynthesis[cardId];
  }

  // Otherwise, use suit synthesis (e.g., 'swords-3' -> 'swords')
  const suit = cardId.split('-')[0];
  if (cardArchetypeSynthesis[suit]) {
    return cardArchetypeSynthesis[suit];
  }

  // Fallback
  return {
    synthesis: ['something is surfacing today, and it may be worth a second look'],
    action: 'notice what came up and where in your body it sits, and stay there for one slow breath'
  };
}

/**
 * Build a transit-aware action by appending the transiting planet's modifier
 * to the card's specific base action.
 */
function buildTransitAwareAction(
  cardAction: string,
  transit: TransitData,
  tone: 'challenging' | 'neutral' | 'expansive'
): string {
  const planet = transit.transitingPlanet.toLowerCase();
  const modifier = transitActionModifiers[planet];
  if (!modifier) return cardAction;

  const addendum = modifier[tone];
  if (!addendum) return cardAction;

  // Avoid redundancy: skip addendum if the card action already covers the same ground
  const cardActionLower = cardAction.toLowerCase();
  const addendumFirstWord = addendum.split(' ')[0];
  if (cardActionLower.includes(addendumFirstWord)) return cardAction;

  return `${cardAction}. ${addendum}`;
}

/**
 * Utility: Select random item from array
 */
function selectRandomFromArray<T>(array: T[]): T {
  return array[Math.floor(Math.random() * array.length)];
}
