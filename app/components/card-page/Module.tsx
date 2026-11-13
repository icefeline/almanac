'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { staggerLines } from '@/lib/utils/stagger';
import { emphasise, withParagraphs } from './emphasise';
import styles from './card-page.module.css';
import { PatternStamps } from './PatternStamp';

/** The pattern cards are held back for now: they crowd the reading. Flip this to bring them back. */
const SHOW_PATTERNS = false;
import type { DetectedPattern } from '@/lib/utils/pattern-detector';

/**
 * How the module fills in.
 *
 * The log prints a line at a time rather than the whole block landing at once,
 * so the wait reads as the machine working through it: the command, then the
 * thinking, then what it found in the chart, then the read. A terminal echoing
 * its own progress, not decoration — which is what keeps it on the right side
 * of the spec's "nothing animates".
 *
 * The two waiting lines are held by the fetch, not by a stopwatch: `thinking`
 * only decides when the first swaps to the second, and whichever is showing
 * stays until the answer is actually back. An earlier version expired them on a
 * fixed timer and left the block empty for as long as the request took.
 *
 * `body` is the one deliberate pause — the read is held a beat after the
 * transit line so the two don't arrive together and lose the sense of one
 * following from the other.
 *
 * `pattern` holds the stamp row back a further beat past the body, so it
 * reads as something the machine noticed after finishing the read, not as
 * one more paragraph landing in the same breath.
 */
const STAGE_MS = { thinking: 700, body: 900, pattern: 1500 } as const;

/** The glyphs an ephemeris uses, so the log line reads as a real transit line. */
const ASPECT_GLYPH: Record<string, string> = {
  conjunction: '☌',
  sextile: '⚹',
  square: '□',
  trine: '△',
  opposition: '☍',
};

interface TransitExplanation {
  transitingPlanet: string;
  transitingPlanetMeaning: string;
  natalPlanet: string;
  natalPlanetMeaning: string;
  aspectType: string;
  aspectMeaning: string;
  phaseMeaning: string;
}

interface ModuleProps {
  keyPhrase: string;
  insight: string;
  action?: string;
  transitExplanation?: TransitExplanation;
  /** Whether the aspect is at peak — the log line's EXACT: YES/NO. */
  exact?: boolean;
  isLoading?: boolean;
  isRateLimited?: boolean;
  hasError?: boolean;
  onRetry?: () => void;
  /** The ask screen's second link — fetches today's reading right away, no code needed. */
  onContinue?: () => void;
  /** Every pattern worth naming today, if the recent draws or the live sky turned any up. */
  patterns?: DetectedPattern[];
  /** Seeds where the key phrase's lines start, so the same reading always sets the same way. */
  seed?: string;
  /** The card's own words, so the read can pick them out wherever it echoes them. */
  terms?: string[];
}

/**
 * SPEC §09. The lime module: the machine's log, then the personalised read.
 *
 * Everything in here is VT323 including the headline — SPEC §1.1 assigns the
 * whole module to that one voice, which is what makes it read as a single
 * utterance rather than as a card with a title on it. The log lines sit inside
 * the module rather than above it (SPEC §1.4).
 *
 * This replaced the old ActiveInsight panel, which has since been deleted. It
 * keeps that component's three states — waiting, rate-limited, and the read
 * itself — and drops its scrolling transit ticker, the last animated thing
 * below the card. The explanation the ticker used to open is still here, as a
 * static toggle.
 */
export function Module({
  keyPhrase,
  insight,
  action,
  transitExplanation,
  exact,
  isLoading,
  isRateLimited,
  hasError,
  onRetry,
  onContinue,
  patterns,
  seed,
  terms = [],
}: ModuleProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  /** Which of the two waiting lines is showing. Only ever advances 0 → 1. */
  const [waiting, setWaiting] = useState(0);
  useEffect(() => {
    if (!isLoading) return;
    setWaiting(0);
    const timer = setTimeout(() => setWaiting(1), STAGE_MS.thinking);
    return () => clearTimeout(timer);
  }, [isLoading]);

  /**
   * Whether the read itself has been let through, a beat behind the transit
   * line above it.
   *
   * A reading that was already cached never waited, so it starts open and the
   * pause is skipped — the delay belongs to the arrival of an answer, not to
   * every viewing of one.
   */
  const [bodyShown, setBodyShown] = useState(!isLoading);
  useEffect(() => {
    if (isLoading) {
      setBodyShown(false);
      return;
    }
    const timer = setTimeout(() => setBodyShown(true), STAGE_MS.body);
    return () => clearTimeout(timer);
  }, [isLoading]);

  /**
   * The pattern stamp row, held back until after the body has had its own
   * moment — same reasoning as `bodyShown`, one stage later. A cached
   * reading skips the wait entirely, same as the body does.
   */
  const [patternShown, setPatternShown] = useState(!isLoading);
  useEffect(() => {
    if (isLoading) {
      setPatternShown(false);
      return;
    }
    const timer = setTimeout(() => setPatternShown(true), STAGE_MS.pattern);
    return () => clearTimeout(timer);
  }, [isLoading]);

  const transitLine = (() => {
    if (!transitExplanation?.transitingPlanet || !transitExplanation.natalPlanet) return null;
    const glyph = ASPECT_GLYPH[transitExplanation.aspectType?.toLowerCase()] ?? '·';
    const exactness = exact === undefined ? '' : ` EXACT: ${exact ? 'YES' : 'NO'}`;
    return `> TRANSIT: ${transitExplanation.transitingPlanet.toUpperCase()} ${glyph} ${transitExplanation.natalPlanet.toUpperCase()}${exactness}`;
  })();

  return (
    <section className={styles.module}>
      <div className={styles.log}>&gt; READ CARD --VERBOSE</div>

      {/* The waiting line occupies the transit line's place until the chart has
          actually been read, so the block grows downward instead of shuffling.
          No spinner: the cursor is the only thing on this page allowed to move
          (SPEC §5). */}
      {isLoading && (
        <div className={styles.log}>
          {waiting < 1 ? <>&gt; THINKING...</> : <>&gt; READING CHART...</>}
          <span className={styles.cursor}>_</span>
        </div>
      )}

      {!isLoading && transitLine && <div className={styles.log}>{transitLine}</div>}

      {/* while the read is on its way the page is not empty: the phrase's place holds the
          machine's own words, with its cursor */}
      {(isLoading || !bodyShown) && (
        <h2 className={styles.phrase} aria-hidden="true">
          <span className={styles.line} style={{ '--o': '0%' } as CSSProperties}>
            reading
          </span>
          <span className={styles.line} style={{ '--o': '14%' } as CSSProperties}>
            the chart<span className={styles.cursor}>_</span>
          </span>
        </h2>
      )}

      {isLoading || !bodyShown ? null : hasError ? (
        <>
        <h2 className={styles.phrase}>
          {staggerLines('no connection to the reading', seed ?? 'offline').map((line, i) => (
            <span key={i} className={styles.line} style={{ '--o': line.offset } as CSSProperties}>
              {line.text}
            </span>
          ))}
        </h2>
        <div style={{ marginTop: 12 }}>
          <p className={styles.moduleQuiet}>&gt; NO CONNECTION TO THE READING.</p>
          {onRetry && (
            <button type="button" className={`${styles.moduleRetry} sg-retro`} onClick={onRetry}>
              retry
            </button>
          )}
        </div>
        </>
      ) : isRateLimited && !insight ? (
        <>
          <h2>thank you for using slow garden</h2>
          <p>
            if this has meant something to you, a small contribution goes directly toward
            keeping it running :-)
          </p>
          {/* `explain`, not `try`: same spacing, no rule. Both links are the
              sentence above them carried to its conclusion, not a new
              section, so they share one line and one voice rather than
              reading as two competing asks. */}
          <div className={styles.explain} style={{ display: 'flex', alignItems: 'baseline', gap: 16, flexWrap: 'wrap' }}>
            <a
              href="https://buymeacoffee.com/shxntxnx"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.coffeeLink}
            >
              <p style={{ margin: 0 }}>buy me a coffee →</p>
            </a>
            {onContinue && (
              <button
                type="button"
                onClick={onContinue}
                style={{
                  color: 'inherit',
                  textDecoration: 'underline',
                  textUnderlineOffset: '4px',
                  background: 'none',
                  border: 0,
                  padding: 0,
                  cursor: 'pointer',
                }}
              >
                <p style={{ margin: 0 }}>continue with reading →</p>
              </button>
            )}
          </div>
        </>
      ) : (
        <>
          <h2 className={styles.phrase}>
            {staggerLines(keyPhrase || 'what this could mean for you', seed ?? keyPhrase).map((line, i) => (
              <span key={i} className={styles.line} style={{ '--o': line.offset } as CSSProperties}>
                {line.text}
              </span>
            ))}
          </h2>
          <p className={styles.insight}>{withParagraphs(insight, [keyPhrase, ...terms])}</p>

          {SHOW_PATTERNS && patternShown && patterns && patterns.length > 0 && <PatternStamps patterns={patterns} />}

          {action && (
            <div className={styles.try}>
              <div className={styles.tryLabel}>
                <span className={styles.mark}>&gt; try this</span>
              </div>
              <p className={styles.pull}>{emphasise(action, [keyPhrase, ...terms])}</p>
            </div>
          )}

          {transitExplanation?.transitingPlanetMeaning && (
            <div className={styles.explain}>
              <button
                type="button"
                className={`${styles.moduleRetry} sg-retro`}
                style={{ marginTop: 0 }}
                onClick={() => setIsExpanded(!isExpanded)}
                aria-expanded={isExpanded}
              >
                {isExpanded ? 'close' : 'what is this transit'}
              </button>
              {isExpanded && (
                <p style={{ marginTop: 10 }}>
                  {transitExplanation.transitingPlanet} ({transitExplanation.transitingPlanetMeaning})
                  is making a {transitExplanation.aspectType} ({transitExplanation.aspectMeaning}) to
                  your natal {transitExplanation.natalPlanet} (
                  {transitExplanation.natalPlanetMeaning}). {transitExplanation.phaseMeaning}
                </p>
              )}
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default Module;
