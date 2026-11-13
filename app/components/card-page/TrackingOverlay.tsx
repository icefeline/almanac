'use client';

import { useEffect, useRef } from 'react';
import styles from './card-page.module.css';
import { rng } from '@/lib/utils/garden';

/**
 * A detector, running.
 *
 * Dozens of thin boxes across the whole scene that never quite stop: each re-acquires
 * something every second or two, jumping to a new place and size, now and then losing it
 * and finding it again. Straight lines join them in gradients between their colours, the
 * way a tracker joins what it has found. Move the pointer and the nearest boxes lock on to
 * it and go lime. This is the field the notes sit in; the notes themselves (BlobField) are
 * the real, labelled things in it, and none of these boxes claims to be anything else.
 *
 * Drawn on a canvas, pointer-transparent, and one still frame under reduced motion.
 */
// how far past the field's own edges the canvas reaches, so a box near an edge is drawn whole and runs on past it
const BLEED = 240;
const COUNT_WIDE = 18;
const COUNT_NARROW = 9;

const PALETTE: [number, number, number][] = [
  [43, 53, 214], // cobalt
  [226, 70, 160], // magenta
  [244, 121, 40], // orange
  [20, 160, 140], // teal
  [123, 79, 214], // violet
  [150, 190, 20], // deep lime
];
const LIME: [number, number, number] = [201, 242, 78];
const COBALT: [number, number, number] = [43, 53, 214];
const LIME_RGB: [number, number, number] = [201, 242, 78];
const same = (a: [number, number, number], b: [number, number, number]) => a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
// at night cobalt and lime trade places, like the rest of the page
const tone = (c: [number, number, number]): [number, number, number] =>
  typeof document !== 'undefined' && document.documentElement.hasAttribute('data-night')
    ? same(c, COBALT)
      ? LIME_RGB
      : same(c, LIME_RGB)
        ? COBALT
        : c
    : c;
const rgba = (c: [number, number, number], a: number) => {
  const t = tone(c);
  return `rgba(${t[0]}, ${t[1]}, ${t[2]}, ${a})`;
};

interface Box {
  x: number; y: number; w: number; h: number;
  tx: number; ty: number; tw: number; th: number;
  next: number;
  alpha: number; talpha: number;
  partners: [number, number];
  locked: boolean;
  c: number;
}

export function TrackingOverlay({ seed }: { seed: string }) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const host = canvas?.parentElement;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !host || !ctx) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    let h32 = 2166136261;
    for (let i = 0; i < seed.length; i++) h32 = Math.imul(h32 ^ seed.charCodeAt(i), 16777619);
    const r = rng(h32 >>> 0);

    const COUNT = window.innerWidth < 760 ? COUNT_NARROW : COUNT_WIDE;
    let w = 0;
    let h = 0;
    const size = () => {
      const k = Math.min(1, Math.max(0.35, w / 900));
      const bw = (14 + Math.pow(r(), 2.2) * 150) * k;
      return { bw, bh: bw * (0.45 + r() * 0.9) };
    };
    const boxes: Box[] = Array.from({ length: COUNT }, () => {
      const { bw, bh } = size();
      const x = r() * 1000;
      const y = r() * 1000;
      return {
        x, y, w: bw, h: bh, tx: x, ty: y, tw: bw, th: bh,
        next: r() * 1800,
        alpha: 1, talpha: 1,
        partners: [Math.floor(r() * COUNT), Math.floor(r() * COUNT)],
        locked: false,
        c: Math.floor(r() * PALETTE.length),
      };
    });

    const place = () => {
      const rect = host.getBoundingClientRect();
      const dpr = Math.min(2, window.devicePixelRatio || 1);
      w = rect.width;
      h = rect.height;
      canvas.width = Math.round((w + BLEED * 2) * dpr);
      canvas.height = Math.round((h + BLEED * 2) * dpr);
      canvas.style.inset = 'auto';
      canvas.style.left = `${-BLEED}px`;
      canvas.style.top = `${-BLEED}px`;
      canvas.style.width = `${w + BLEED * 2}px`;
      canvas.style.height = `${h + BLEED * 2}px`;
      // drawn in the field's own coordinates, with the bleed outside them
      ctx.setTransform(dpr, 0, 0, dpr, BLEED * dpr, BLEED * dpr);
      boxes.forEach((b) => {
        b.x = (b.tx / 1000) * w;
        b.y = (b.ty / 1000) * h;
      });
    };

    const pointer = { x: -1, y: -1, on: false };
    const onMove = (e: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointer.x = e.clientX - rect.left - BLEED;
      pointer.y = e.clientY - rect.top - BLEED;
      pointer.on = pointer.x >= 0 && pointer.y >= 0 && pointer.x <= w && pointer.y <= h;
    };

    const draw = () => {
      ctx.clearRect(-BLEED, -BLEED, w + BLEED * 2, h + BLEED * 2);
      const line = (b: Box, c: Box, alpha: number) => {
        const x1 = b.x + b.w / 2;
        const y1 = b.y + b.h / 2;
        const x2 = c.x + c.w / 2;
        const y2 = c.y + c.h / 2;
        const g = ctx.createLinearGradient(x1, y1, x2, y2);
        g.addColorStop(0, rgba(PALETTE[b.c], alpha * b.alpha));
        g.addColorStop(1, rgba(PALETTE[c.c], alpha * c.alpha));
        ctx.strokeStyle = g;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      };
      ctx.lineWidth = 1;
      boxes.forEach((b, i) => {
        if (b.alpha < 0.1) return;
        const c = boxes[(i + 1) % COUNT];
        if (c.alpha >= 0.1) line(b, c, 0.75);
        b.partners.forEach((p) => {
          if (boxes[p].alpha >= 0.1) line(b, boxes[p], 0.3);
        });
      });
      boxes.forEach((b) => {
        if (b.alpha < 0.05) return;
        const bx = Math.round(b.x) + 0.5;
        const by = Math.round(b.y) + 0.5;
        const col = PALETTE[b.c];
        ctx.strokeStyle = rgba(col, (b.locked ? 1 : 0.9) * b.alpha);
        ctx.lineWidth = b.locked ? 2 : 1.2;
        ctx.strokeRect(bx, by, Math.round(b.w), Math.round(b.h));
        ctx.fillStyle = b.locked ? rgba(LIME, 0.75 * b.alpha) : rgba(col, 0.16 * b.alpha);
        ctx.fillRect(bx, by, Math.round(b.w), Math.round(b.h));
      });
      if (pointer.on) {
        ctx.fillStyle = rgba(COBALT, 0.9);
        ctx.fillRect(pointer.x - 3, pointer.y - 3, 6, 6);
      }
    };

    place();
    draw();
    if (reduced) return;

    let raf = 0;
    let visible = true;
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      if (!visible) return;
      let near: number[] = [];
      if (pointer.on) {
        near = boxes
          .map((b, i) => ({ i, d: Math.hypot(b.x + b.w / 2 - pointer.x, b.y + b.h / 2 - pointer.y) }))
          .sort((a, b) => a.d - b.d)
          .slice(0, 3)
          .map((o) => o.i);
      }
      boxes.forEach((b, i) => {
        const locked = near.includes(i);
        b.locked = locked;
        if (locked) {
          const k = near.indexOf(i);
          b.tw = 26 + k * 22;
          b.th = 26 + k * 22;
          b.tx = ((pointer.x - b.tw / 2) / w) * 1000;
          b.ty = ((pointer.y - b.th / 2) / h) * 1000;
          b.talpha = 1;
        } else if (now > b.next) {
          const roll = r();
          if (roll < 0.62) {
            b.tx = Math.max(0, Math.min(1000, b.tx + (r() - 0.5) * 120));
            b.ty = Math.max(0, Math.min(1000, b.ty + (r() - 0.5) * 120));
          } else {
            b.tx = r() * 1000;
            b.ty = r() * 1000;
          }
          const { bw, bh } = size();
          b.tw = bw;
          b.th = bh;
          b.talpha = roll > 0.97 ? 0 : 1;
          b.next = now + 1100 + r() * 3400;
        }
        const ease = locked ? 0.4 : 0.2;
        b.x += ((b.tx / 1000) * w - b.x) * ease;
        b.y += ((b.ty / 1000) * h - b.y) * ease;
        b.w += (b.tw - b.w) * ease;
        b.h += (b.th - b.h) * ease;
        b.alpha += (b.talpha - b.alpha) * 0.35;
        b.x += (Math.random() - 0.5) * 0.7;
        b.y += (Math.random() - 0.5) * 0.7;
      });
      draw();
    };

    // Only while this scene is on screen: the boxes and the grid run well past the field's own edges, so when the scene is scrolled
    // away they must not show over the scene that has taken its place.
    const observer = new IntersectionObserver(
      ([entry]) => {
        visible = entry.isIntersecting;
        if (entry.isIntersecting) host.removeAttribute('data-away');
        else host.setAttribute('data-away', '');
      },
      { threshold: 0 },
    );
    observer.observe(host);
    const resizer = new ResizeObserver(place);
    resizer.observe(host);
    window.addEventListener('pointermove', onMove);
    raf = requestAnimationFrame(step);
    return () => {
      cancelAnimationFrame(raf);
      observer.disconnect();
      resizer.disconnect();
      window.removeEventListener('pointermove', onMove);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  return <canvas ref={ref} className={styles.trackOverlay} aria-hidden="true" />;
}

export default TrackingOverlay;
