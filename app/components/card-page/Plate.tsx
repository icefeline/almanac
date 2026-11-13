import type { ReactNode } from 'react';
import styles from './card-page.module.css';
import { slotIndex } from '@/lib/utils/card-readout';
import type { MarginRow } from './types';

/**
 * SPEC §03. The card image flanked by its two margin columns.
 *
 * The image is passed in as children rather than rendered here: on this page it
 * is still the app's own card element, carrying the reveal states and the slot
 * overlay, and the plate has no business knowing about any of that.
 *
 * Both margins are hidden below 880px, where the left column's figures reappear
 * as the Readout strip and the percentages drop out entirely — six more numbers
 * beside a phone-width card is noise, not data.
 */
export function Plate({
  left,
  shares,
  ring,
  children,
}: {
  left: MarginRow[];
  /** The six note percentages, in the accord's own order. Empty if unwritten. */
  shares: number[];
  /** The keyword ring, drawn around the card. Wide layouts only (see .ring). */
  ring?: ReactNode;
  children: ReactNode;
}) {
  return (
    <div className={styles.plate}>
      <div className={styles.marginL}>
        {left.map(row => (
          <div key={row.label}>
            {row.value} <span>{row.label}</span>
          </div>
        ))}
      </div>

      <div className={styles.plateCenter}>
        {ring}
        {children}
      </div>

      <div className={styles.marginR}>
        {shares.map((share, i) => (
          <div key={i}>
            <span>{slotIndex(i)}</span> {share}%
          </div>
        ))}
      </div>
    </div>
  );
}

export default Plate;
