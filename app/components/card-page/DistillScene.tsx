import styles from './card-page.module.css';
import { BlobField } from './BlobField';
import { cardMemories, cardMemoriesReversed, cardScents } from '@/lib/data/card-scents';
import { distillRows } from '@/lib/utils/card-readout';
import { rng } from '@/lib/utils/garden';
import { SHAPES, shapeFor } from '@/lib/utils/scent-shapes';
import { noteGift } from '@/lib/data/note-gifts';
import { noteCalls, noteHelp, noteSays } from '@/lib/data/note-reads';
import { tarotDeck } from '@/lib/data/tarot-deck';

/**
 * The card's scent notes as a live tracking patch: each note is a blob the system
 * has found, merged where blobs touch like metaballs, boxed and labelled, with a
 * dotted line walking from one to the next over a faint calibration grid.
 *
 * Perfumery's own structure lays it out — a guide for each tier, top notes high,
 * heart in the middle, base low — and a blob's size is that note's share of the
 * accord, the same percentage the notes carry everywhere else. The blobs are
 * alive (BlobField): they drift, tremble, can be picked up and thrown, and push each
 * other aside. The memory on the left names the notes in the accent, so the words and
 * the blobs point at each other.
 */
const W = 1000;
const H = 1000;
const TIER_Y = { top: 0.16, heart: 0.5, base: 0.84 } as const;

export function DistillScene({
  cardId,
  cardName,
  keywords,
  isReversed,
  shares,
}: {
  cardId: string;
  cardName: string;
  /** The card's keywords for the way up it came, for tying each note to it. */
  keywords: string[];
  isReversed: boolean;
  shares: number[];
}) {
  const scent = cardScents[cardId];
  if (!scent) return null;
  const rows = distillRows(scent);
  if (rows.length === 0) return null;
  const memory = (isReversed ? cardMemoriesReversed[cardId] : undefined) ?? cardMemories[cardId];

  let h = 2166136261;
  for (let i = 0; i < cardId.length; i++) h = Math.imul(h ^ cardId.charCodeAt(i), 16777619);
  const r = rng(h >>> 0);

  const group: Record<string, number[]> = { top: [], heart: [], base: [] };
  rows.forEach((row, i) => group[row.tier].push(i));

  const deckCard = tarotDeck.find((c) => c.id === cardId);
  const full = (isReversed ? deckCard?.reversedMeaning : deckCard?.uprightMeaning) ?? deckCard?.description ?? '';
  // the first sentence or two: what the card usually means, in the deck's own words
  const typical = (full.match(/[^.?!]+[.?!]/g) ?? [full]).slice(0, 2).join(' ').trim().toLowerCase();

  const blobs = rows.map((row, i) => {
    const mates = group[row.tier];
    const k = mates.indexOf(i);
    const x = ((k + 0.5) / mates.length) * W * 0.6 + W * 0.2;
    const y = TIER_Y[row.tier] * H + (k % 2 === 0 ? -34 : 34);
    const share = shares[i] ?? 15;
    return {
      x,
      y,
      rad: 34 + share * 4.6,
      row,
      share,
      n: i + 1,
    };
  });

  return (
    <section className={styles.distillScene}>
      {/* the memory, in full, for anyone not watching the boxes */}
      {memory && <p className="sr-only">{memory}</p>}

      <BlobField
        tierY={TIER_Y}
        blobs={blobs.map((b) => ({
          n: b.n,
          x: b.x,
          y: b.y,
          rad: b.rad,
          share: b.share,
          note: b.row.note,
          tier: b.row.tier as 'top' | 'heart' | 'base',
          verb: b.row.verb,
          shape: SHAPES[shapeFor(b.row.note)],
          caption: noteHelp(b.row.note),
          calls: noteCalls(b.row.note),
          gives: noteGift(b.row.note),
          tie: noteSays(b.row.note),
        }))}
      />

    </section>
  );
}

export default DistillScene;
