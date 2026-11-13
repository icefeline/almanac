import styles from './card-page.module.css';
import { emphasise } from './emphasise';

/**
 * SPEC §07. The traditional meaning: a lede addressed to the reader, then a
 * smaller third-person line describing the figure on the card.
 *
 * The sub is the deck's own `description`, which is already written in exactly
 * that register — this is where the old standalone "about this card" block
 * ended up, rather than trailing the page after the personalised read.
 *
 * The lede speaks to the reader and the sub speaks about the card. Set in
 * DM Mono, uppercase and justified, it reads as a printed caption rather
 * than a continuation of the lede's own voice — the aside no longer needs
 * parentheses to say so.
 */
export function Meaning({ lede, sub, terms = [] }: { lede: string; sub?: string; terms?: string[] }) {
  return (
    <section className={styles.meaning}>
      <div className={styles.prompt}>&gt; MEANING</div>
      <p className={styles.lede}>{emphasise(lede, terms)}</p>
      {sub && (
        <details className={styles.more}>
          <summary className={styles.fold}>about this card</summary>
          <p className={styles.sub}>{sub}</p>
        </details>
      )}
    </section>
  );
}

export default Meaning;
