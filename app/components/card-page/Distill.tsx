import styles from './card-page.module.css';
import { cardMemories, cardMemoriesReversed, cardScents } from '@/lib/data/card-scents';
import { distillRows, dotLeader, slotIndex, widestNote } from '@/lib/utils/card-readout';

/**
 * SPEC §08. The card's notes, and the memory they carry.
 *
 * Every note in the recipe, not a fixed six. The recipes run from five notes to
 * eleven, and the memory paragraphs were written against all of them — printing
 * only the first six would have quietly dropped material the prose is leaning
 * on.
 *
 * The ASCII drawing that bleeds off the top-right in the reference is not here:
 * the `asc-` set covers a handful of notes out of the deck's full palette, so
 * most cards would show a drawing belonging to a note they don't contain. The
 * block clips its own overflow already, so the layer can be dropped back in when
 * the drawings are complete without moving anything else.
 */
export function Distill({
  cardId,
  isReversed = false,
  shares = [],
  flat = false,
}: {
  cardId: string;
  isReversed?: boolean;
  /** Each note's share of the accord, in the notes' own order. Empty if unwritten. */
  shares?: number[];
  /** Set out in the open instead of folded — for the sideways reading, where it has a pane of its own. */
  flat?: boolean;
}) {
  const scent = cardScents[cardId];
  if (!scent) return null;

  const rows = distillRows(scent);
  if (rows.length === 0) return null;

  /*
    The notes are the card's, whichever way up it came. The memory is not: a
    reversal is the same accord doing something else to you, so it gets its own
    passage. Falls back to the upright one rather than showing nothing, so a
    missing reversal reads as unwritten instead of as a blank block.
  */
  const memory = (isReversed ? cardMemoriesReversed[cardId] : undefined) ?? cardMemories[cardId];
  const names = rows.map(row => row.note.toUpperCase());
  const widest = widestNote(names);

  const body = (
    <>
      {memory && <p className={styles.memory}>{memory}</p>}

      <div className={styles.notes}>
        {rows.map((row, i) => {
          const name = names[i];
          return (
            <div key={`${row.tier}-${row.note}-${i}`}>
              {slotIndex(i)} {name}{' '}
              <span className={styles.dots}>
                {dotLeader(name, widest)} {row.verb}
                {shares[i] != null ? `  ${shares[i]}%` : ''}
              </span>
            </div>
          );
        })}
      </div>

      {/* A ratio here would always be N of N: there is one recipe per card and
          it is always whole, so the count is the only honest thing to print. */}
      <div className={styles.done}>
        &gt; DONE. {rows.length} NOTES WRITTEN
      </div>
    </>
  );

  const label = (
    <span className={styles.prompt}>&gt; DISTILL --NOTES {rows.length}</span>
  );

  return (
    <section className={styles.distill}>
      {flat ? (
        <>
          {label}
          {body}
        </>
      ) : (
        // Folded by default: the memory and the notes are a second reading of the
        // card, there for the asking rather than competing with the first.
        <details>
          <summary className={styles.fold}>{label}</summary>
          {body}
        </details>
      )}
    </section>
  );
}

export default Distill;
