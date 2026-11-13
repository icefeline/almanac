'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { TarotCard as TarotCardType } from '@/lib/types/tarot';
import PastCardReading from './PastCardReading';
import type { Sky } from '@/lib/data/skies';

export interface WindowRect { x: number; y: number; w: number; h: number }

interface CardWindowProps {
  date: string;
  card: TarotCardType;
  isReversed: boolean;
  /** Where the window starts, already anchored and clamped by the opener. */
  rect: WindowRect;
  z: number;
  /**
   * The sky this card was drawn under. Decided by the opener from the day's
   * own draw stamp, so it is the same sky every time this card is opened.
   */
  sky: Sky;
  onFocus: () => void;
  onClose: () => void;
}

/** Default width. Phone-ish on purpose: the reading inside is the mobile one. */
export const WIN_W = 420;
const MIN_W = 320;
const MIN_H = 240;
/**
 * Just under the 880px the reading uses to switch to its two-column desktop
 * layout. The window holds the mobile reading, so it is never allowed to get
 * wide enough to turn into a different page under the reader's hands mid-drag.
 */
const MAX_W = 860;
/** How much room the window leaves the nav at the top of the screen. */
const GAP = 12;

function navH() {
  if (typeof window === 'undefined') return 80;
  const v = parseFloat(
    getComputedStyle(document.documentElement).getPropertyValue('--nav-h'),
  );
  return Number.isFinite(v) && v > 0 ? v : 80;
}

/**
 * Keep a window whole and on screen.
 *
 * The usual desktop rule is "leave the titlebar reachable" and let the rest
 * hang off the edge. That is right for a file manager and wrong here: this
 * window is a reading surface, there is no second monitor to spill onto, and a
 * window half off the bottom is not a window the reader chose to put there —
 * it is a broken layout. So the whole thing stays inside, and the height gives
 * way before the position does.
 */
export function clampRect(r: WindowRect): WindowRect {
  if (typeof window === 'undefined') return r;
  const top = navH() + GAP;
  const bottom = window.innerHeight - GAP;
  const w = Math.max(MIN_W, Math.min(r.w, MAX_W, window.innerWidth - GAP * 2));
  const h = Math.max(MIN_H, Math.min(r.h, bottom - top));
  return {
    w, h,
    x: Math.max(GAP, Math.min(r.x, window.innerWidth - w - GAP)),
    y: Math.max(top, Math.min(r.y, bottom - h)),
  };
}

/**
 * Where a window should open for the day that was clicked.
 *
 * Beside the cell, on whichever side has room, near the height it was clicked
 * at — so the reading comes out of the day rather than appearing somewhere
 * unrelated. `index` only cascades windows that have no cell to come from.
 */
export function rectForCell(cell: DOMRect | null, index: number): WindowRect {
  const top = navH() + GAP;
  const h = typeof window === 'undefined'
    ? 560
    : Math.min(720, window.innerHeight - top - GAP);

  if (!cell) {
    const k = index % 6;
    return clampRect({ x: 240 + k * 34, y: top + k * 30, w: WIN_W, h });
  }
  const roomRight = typeof window !== 'undefined'
    && cell.right + 16 + WIN_W <= window.innerWidth - GAP;
  return clampRect({
    x: roomRight ? cell.right + 16 : cell.left - 16 - WIN_W,
    // A little above the cell, so the day itself stays visible beside its window.
    y: cell.top - 40,
    w: WIN_W,
    h,
  });
}

export default function CardWindow({
  date, card, isReversed, rect, z, onFocus, onClose,
}: CardWindowProps) {
  /**
   * Where the window is, and — while it is zoomed — where it came from, so the
   * zoom button is a toggle rather than a one-way trip.
   *
   * `restore` is part of the state rather than a ref beside it, because the
   * only place it changes is inside a `setState` updater, and an updater must
   * be a pure function of the previous state. Writing a ref from in there is a
   * side effect React is free to run twice, which it does in development —
   * zoom then un-zoomed itself on every click and the button looked dead.
   */
  const [r, setR] = useState<WindowRect & { restore: WindowRect | null }>(
    { ...rect, restore: null },
  );
  const drag = useRef<
    { mode: 'move' | 'resize'; px: number; py: number; from: WindowRect } | null
  >(null);

  const fileName = `${date.slice(5).replace('-', '-')}.TXT`;

  const begin = (mode: 'move' | 'resize') => (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    onFocus();
    drag.current = { mode, px: e.clientX, py: e.clientY, from: r };
  };

  useEffect(() => {
    const move = (e: MouseEvent) => {
      const d = drag.current;
      if (!d) return;
      const dx = e.clientX - d.px, dy = e.clientY - d.py;
      const next = clampRect(
        d.mode === 'move'
          ? { ...d.from, x: d.from.x + dx, y: d.from.y + dy }
          : { ...d.from, w: d.from.w + dx, h: d.from.h + dy },
      );
      // Moving or resizing a zoomed window is the reader choosing a size, so
      // there is nothing left to restore — the zoom button starts over.
      setR({ ...next, restore: null });
    };
    const up = () => { drag.current = null; };
    const resize = () => setR(prev => ({ ...clampRect(prev), restore: prev.restore }));
    window.addEventListener('mousemove', move);
    window.addEventListener('mouseup', up);
    window.addEventListener('resize', resize);
    return () => {
      window.removeEventListener('mousemove', move);
      window.removeEventListener('mouseup', up);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const zoom = useCallback(() => {
    onFocus();
    setR(prev => {
      if (prev.restore) return { ...clampRect(prev.restore), restore: null };
      const top = navH() + GAP;
      /*
        Taller, not wider. The reading inside is the mobile one, and it stays
        the mobile one at every size — widening the window past 880 would trip
        the reading's own layout over to the two-column desktop version, which
        is a different page, not a bigger one. What a reader wants from this
        button is more of the reading at once, and that is height.
      */
      const big = clampRect({
        x: prev.x,
        y: top,
        w: prev.w,
        h: window.innerHeight - top - GAP,
      });
      return { ...big, restore: { x: prev.x, y: prev.y, w: prev.w, h: prev.h } };
    });
  }, [onFocus]);

  return (
    <div
      role="dialog"
      aria-label={`Card reading for ${new Date(date + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`}
      onMouseDown={onFocus}
      className="sg-win hidden md:flex fixed flex-col overflow-hidden"
      style={{
        left: r.x, top: r.y, width: r.w, height: r.h, zIndex: z,
        /* the live sky is the ground; the window is a sheet of paper laid on it, in the app's own ink and paper
           (they swap at night with everything else), framed in black like the retro buttons */
        background: 'var(--w-veil)',
        backdropFilter: 'blur(10px)',
        WebkitBackdropFilter: 'blur(10px)',
        border: '2px solid #000',
        boxShadow: '5px 6px 0 rgba(9,14,7,.5)',
        '--sky-ink': 'var(--w-ink)',
        '--sky-body': 'var(--w-body)',
      } as React.CSSProperties}
    >
      <div
        onMouseDown={begin('move')}
        className="flex-none h-[30px] flex items-center gap-2 px-1.5 cursor-move"
        style={{
          background: 'var(--accent-c, #2B35D6)',
          borderBottom: '2px solid #000',
          color: 'var(--on-accent-c, #F7F4E6)',
        }}
      >
        <button
          onMouseDown={e => { e.stopPropagation(); onClose(); }}
          aria-label={`Close ${fileName}`}
          className="w-[15px] h-[15px] flex-none hover:!bg-white"
          style={{ background: '#C0C0C0', border: '2px solid #000', boxShadow: 'inset 1px 1px 0 #fff, inset -1px -1px 0 #808080' }}
        />
        <span className="flex-1 h-[11px]" style={{ background: 'repeating-linear-gradient(currentColor 0 1px, transparent 1px 3px)' }} />
        <span
          className="whitespace-nowrap"
          style={{ fontFamily: 'var(--font-vt323), monospace', fontSize: 20, letterSpacing: '.06em' }}
        >
          {fileName}
        </span>
        <span className="flex-1 h-[11px]" style={{ background: 'repeating-linear-gradient(currentColor 0 1px, transparent 1px 3px)' }} />
        <button
          onMouseDown={e => { e.stopPropagation(); zoom(); }}
          aria-label={`Zoom ${fileName}`}
          className="w-[15px] h-[15px] flex-none hover:!bg-white"
          style={{ background: '#C0C0C0', border: '2px solid #000', boxShadow: 'inset 1px 1px 0 #fff, inset -1px -1px 0 #808080' }}
        />
      </div>

      {/*
        `overscroll-contain` is the load-bearing class here. The year view keeps
        scrolling behind an open window — that is the point of a window rather
        than the sheet, which locks the body — so without it, reaching the
        bottom of a reading would carry on and scroll the year out from under
        the window the reader is still reading.

        Transparent, so the frame's sky shows through the reading.
      */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain">
        <PastCardReading date={date} card={card} isReversed={isReversed} surface="window" />
      </div>

      <div
        onMouseDown={begin('resize')}
        role="separator"
        aria-label="Resize"
        className="absolute right-0 bottom-0 w-[18px] h-[18px] cursor-nwse-resize"
        style={{
          borderLeft: '2px solid #000',
          borderTop: '2px solid #000',
          background: 'repeating-linear-gradient(135deg, #000 0 1px, transparent 1px 4px)',
        }}
      />
    </div>
  );
}
