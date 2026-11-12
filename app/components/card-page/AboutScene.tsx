import styles from './card-page.module.css';
import { emphasise } from './emphasise';
import { FitText } from './FitText';

/**
 * The card's own description, set as one big justified block of italic capitals
 * that fills the whole page edge to edge, like the headline lines in a magazine.
 * The words that echo the card's keywords are in the accent.
 */
export function AboutScene({ text, terms }: { text: string; terms: string[] }) {
  return (
    <section className={styles.aboutScene}>
      <FitText className={styles.aboutFit} max={220}>
        {emphasise(text, terms)}
      </FitText>
    </section>
  );
}

export default AboutScene;
