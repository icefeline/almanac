/**
 * The card reading page, section by section, built to the design bundle's
 * build/SPEC.md. Every piece here is presentational and prop-driven —
 * TarotCard owns the data and this directory owns the page.
 *
 * The rules, the spine and the layout grids live in card-page.module.css
 * rather than in a component, since all of them change at the 880px layer.
 */

export { CardName } from './CardName';
export { Plate } from './Plate';
export { StateLine } from './StateLine';
export { Readout } from './Readout';
export { Keywords } from './Keywords';
export { KeywordRing } from './KeywordRing';
export { Journey, Scene } from './Journey';
export { MeaningScene } from './MeaningScene';
export { AboutScene } from './AboutScene';
export { DistillScene } from './DistillScene';
export { Meaning } from './Meaning';
export { Distill } from './Distill';
export { Module } from './Module';
export { PatternStamps } from './PatternStamp';
export type { MarginRow } from './types';
export { default as styles } from './card-page.module.css';
