import styles from './card-page.module.css';

/**
 * SPEC §04. `CUPS · UPRIGHT` — the machine's one-line statement of what was
 * drawn. Uppercase because it is machine copy (SPEC §1.5).
 */
export function StateLine({ suite, isReversed }: { suite: string; isReversed: boolean }) {
  const arcana = suite === 'major' ? 'MAJOR ARCANA' : suite.toUpperCase();
  return (
    <div className={styles.state}>
      <span style={{ marginRight: '1.4em' }}>{arcana}</span>{isReversed ? 'REVERSED' : 'UPRIGHT'}
    </div>
  );
}

export default StateLine;
