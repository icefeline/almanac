'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import styles from './card-page.module.css';
import { BAYER8, skyPalette } from '../dither';

/**
 * The card name. On the reading page it is set in pixels: the name is drawn small in a serif or a sans and
 * scaled up without smoothing, so every edge is a square, the way a bitmap face looks. The real heading
 * stays in the page, transparent and the same size, so the layout, the text and a screen reader are unchanged.
 *
 * The face is picked with localStorage 'sg-namefont': 'dither' (the default: a serif italic in chunky pixels with a
 * dithered lime shadow, like the splash), 'serif', 'sans', 'sixtyfour' or 'plain'.
 */
/**
 * Short names stay on one line. Anything longer is stacked on two, split before the suit ("two of / swords") or,
 * failing that, where the two lines come out closest in length ("the / hermit", "wheel of / fortune").
 */
function stack(name: string): string[] {
  const words = name.toLowerCase().split(/\s+/).filter(Boolean);
  if (name.length <= 8 || words.length < 2) return [name.toLowerCase()];
  const of = words.indexOf('of');
  if (of > 0 && of < words.length - 1) return [words.slice(0, of + 1).join(' '), words.slice(of + 1).join(' ')];
  let best = 1;
  let gap = Infinity;
  for (let i = 1; i < words.length; i++) {
    const g = Math.abs(words.slice(0, i).join(' ').length - words.slice(i).join(' ').length);
    if (g < gap) {
      gap = g;
      best = i;
    }
  }
  return [words.slice(0, best).join(' '), words.slice(best).join(' ')];
}

export function CardName({ name }: { name: string }) {
  // stacked, and as wide as the screen, on a phone; one line on a wide screen
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width: 760px)');
    const read = () => setPhone(mq.matches);
    read();
    mq.addEventListener('change', read);
    return () => mq.removeEventListener('change', read);
  }, []);
  const lines = phone ? stack(name) : [name.toLowerCase()];
  const h1 = useRef<HTMLHeadingElement>(null);
  const cv = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const el = h1.current;
    const canvas = cv.current;
    if (!el || !canvas) return;

    let fitTries = 0;
    let shrink = 1; // how much smaller than the first measure the name has had to go to fit what is actually drawn
    const draw = () => {
      let mode = 'dither';
      try {
        mode = localStorage.getItem('sg-namefont') || 'dither';
      } catch {
        /* storage unavailable: the default */
      }
      el.dataset.face = mode;
      if (mode !== 'dither') canvas.removeAttribute('style');
      if (mode === 'plain' || mode === 'sixtyfour') {
        canvas.width = 0;
        canvas.height = 0;
        return;
      }
      if (mode === 'dither') {
        // measuring or drawing in a stand-in face gives a wrong size (too large, and clipped): wait until the serif is in;
        // the font events below draw again as it arrives
        const fam = getComputedStyle(document.body).getPropertyValue('--font-instrument-serif');
        if (document.fonts && !document.fonts.check(`italic 400 100px ${fam}`)) return;
        if (phone) {
          // the widest line takes (nearly) the whole width, as large as the height allows
          const probe = document.createElement('canvas').getContext('2d')!;
          probe.font = `italic 400 100px ${getComputedStyle(document.body).getPropertyValue('--font-instrument-serif')}`;
          const widest = Math.max(...lines.map((l) => probe.measureText(l).width), 1);
          const fit = Math.min((el.clientWidth * 0.97 * 100) / widest, window.innerHeight * 0.21, window.innerWidth * 0.26) * shrink;
          if (Math.abs(parseFloat(el.style.fontSize || '0') - fit) > 0.5) el.style.fontSize = `${fit}px`;
        } else if (el.style.fontSize) {
          el.style.fontSize = '';
        }
      } else if (el.style.fontSize) {
        el.style.fontSize = '';
      }
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      if (mode === 'dither') {
        // room around the text for the shadow
        const padX = fs * 0.12;
        const padY = fs * 0.3;
        const w = el.clientWidth + padX * 2;
        const h = el.clientHeight + padY * 2;
        if (!el.clientWidth || !el.clientHeight) return;
        const cell = Math.max(2, Math.round(fs / 30));
        const C = Math.ceil(w / cell);
        const R = Math.ceil(h / cell);
        canvas.width = C;
        canvas.height = R;
        // laid over the text with the room for the shadow on every side, at exactly the size of the pixel grid
        canvas.style.inset = 'auto';
        canvas.style.left = `${-padX}px`;
        canvas.style.top = `${-padY}px`;
        canvas.style.width = `${C * cell}px`;
        canvas.style.height = `${R * cell}px`;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;
        const fam = getComputedStyle(document.body).getPropertyValue('--font-instrument-serif');
        const px = fs / cell;
        const tc = document.createElement('canvas');
        tc.width = C;
        tc.height = R;
        const tx = tc.getContext('2d', { willReadFrequently: true })!;
        tx.font = `italic 400 ${px}px ${fam}`;
        tx.textAlign = 'center';
        tx.textBaseline = 'middle';
        tx.fillStyle = '#000';
        tx.strokeStyle = '#000';
        tx.lineJoin = 'round';
        tx.lineWidth = px * 0.05; // the hairlines of a high-contrast face would drop out at this size
        // each line is centred in its own line box, measured the way the (transparent) heading lays out
        const lineH = (parseFloat(cs.lineHeight) || fs * 0.9) / cell;
        // Check the name against what is actually drawn: measured in the very context it is painted in, the widest line must fit the
        // heading's own width. If it does not (a different browser's font metrics, or a face that arrived late), the size is cut to
        // fit and the name drawn again, so it can never be clipped at the sides.
        const real = Math.max(...lines.map((l) => tx.measureText(l).width)) * cell;
        const room = el.clientWidth * 0.97;
        if (phone && real > room && fitTries < 5) {
          fitTries += 1;
          shrink = Math.max(0.4, shrink * (room / real));
          requestAnimationFrame(draw);
          return;
        }
        fitTries = 0;
        lines.forEach((text, i) => {
          const cy = padY / cell + lineH * (i + 0.5) + px * 0.04;
          tx.fillText(text, C / 2, cy);
          tx.strokeText(text, C / 2, cy);
        });
        const mask = tx.getImageData(0, 0, C, R).data;
        // the lime shadow: the word shifted down and left and blurred, turned into dots by the ordered dither
        const off = Math.max(2, Math.round(px * 0.03));
        const ec = document.createElement('canvas');
        ec.width = C;
        ec.height = R;
        const ex = ec.getContext('2d', { willReadFrequently: true })!;
        ex.filter = `blur(${(px * 0.022).toFixed(1)}px)`;
        ex.drawImage(tc, -off, off);
        const eMask = ex.getImageData(0, 0, C, R).data;
        const pal = skyPalette();
        const img = ctx.createImageData(C, R);
        const d = img.data;
        for (let y = 0; y < R; y++) {
          for (let x = 0; x < C; x++) {
            const i = (y * C + x) * 4;
            const th = (BAYER8[y & 7][x & 7] + 0.5) / 64;
            const solid = mask[i + 3] > 127;
            const tone = eMask[i + 3] / 255;
            let c: [number, number, number] | null = null;
            if (solid) c = pal.main;
            else if (tone * 0.78 > th) c = pal.echo;
            if (c) {
              d[i] = c[0];
              d[i + 1] = c[1];
              d[i + 2] = c[2];
              d[i + 3] = 255;
            }
          }
        }
        ctx.putImageData(img, 0, 0);
        return;
      }
      const w = el.clientWidth;
      const h = el.clientHeight;
      if (!w || !h) return;
      // one square is about a twentieth of the type size
      const cell = Math.max(2, Math.round(fs / 20));
      const C = Math.ceil(w / cell);
      const R = Math.ceil(h / cell);
      canvas.width = C;
      canvas.height = R;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) return;
      const body = getComputedStyle(document.body);
      const fam = mode === 'serif' ? body.getPropertyValue('--font-dm-serif') : body.getPropertyValue('--font-dm-sans');
      const weight = mode === 'serif' ? 400 : 700;
      ctx.clearRect(0, 0, C, R);
      ctx.font = `${weight} ${fs / cell}px ${fam}`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#000';
      ctx.fillText(name, C / 2, R / 2 + (fs / cell) * 0.04);
      // hard edges: every pixel is fully the ink or fully clear
      const ink = cs.getPropertyValue('--ink').trim() || '#1B2616';
      const probe = document.createElement('canvas').getContext('2d')!;
      probe.fillStyle = ink;
      probe.fillRect(0, 0, 1, 1);
      const [r, g, b] = probe.getImageData(0, 0, 1, 1).data;
      const img = ctx.getImageData(0, 0, C, R);
      for (let i = 0; i < img.data.length; i += 4) {
        const on = img.data[i + 3] > 120;
        img.data[i] = r;
        img.data[i + 1] = g;
        img.data[i + 2] = b;
        img.data[i + 3] = on ? 255 : 0;
      }
      ctx.putImageData(img, 0, 0);
    };

    draw();
    const ro = new ResizeObserver(draw);
    ro.observe(el);
    const mo = new MutationObserver(draw);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-night'] });
    // The name is measured in the serif face, and until that face is in, the measure is of a stand-in a different width,
    // which draws the name too large. Ask for the face outright (ready can resolve before anything has asked), and
    // draw again whenever a font finishes arriving.
    const fam = getComputedStyle(document.body).getPropertyValue('--font-instrument-serif');
    document.fonts?.load(`italic 400 100px ${fam}`).then(draw, () => {});
    document.fonts?.ready.then(draw);
    document.fonts?.addEventListener?.('loadingdone', draw);
    window.addEventListener('sg:namefont', draw);
    return () => {
      document.fonts?.removeEventListener?.('loadingdone', draw);
      ro.disconnect();
      mo.disconnect();
      window.removeEventListener('sg:namefont', draw);
    };
  }, [name, phone, lines.join('|')]);

  return (
    <h1
      ref={h1}
      className={styles.cardname}
      data-text={name}
      data-lines={lines.length}
      aria-label={name}
      style={{ '--len': name.length } as CSSProperties}
    >
      {lines.map((l, i) => (
        <span key={i} style={{ display: 'block' }}>
          {l}
        </span>
      ))}
      <canvas ref={cv} aria-hidden="true" className={styles.nameCanvas} />
    </h1>
  );
}

export default CardName;
