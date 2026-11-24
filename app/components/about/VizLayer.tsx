'use client';

import { useEffect, useRef } from 'react';
import { feed, makeGL } from './shaders';

/*
 * The layer behind the whole desktop. While the media player is set to "fill the desktop", the music's picture is drawn
 * here, edge to edge, and the icons and windows float over it: you are inside the kaleidoscope, not looking at one.
 * It draws whatever the player writes to `feed`, and does nothing (and costs nothing) the rest of the time.
 */
export default function VizLayer() {
  const canvas = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const c = canvas.current;
    if (!c) return;
    const gl = makeGL(c);
    if (!gl) return;
    // a canvas of about 700px on its long side, stretched over the screen: plenty for soft colour, and light on the card
    const size = () => {
      const w = c.clientWidth || 1;
      const h = c.clientHeight || 1;
      const k = Math.min(1, 700 / Math.max(w, h));
      c.width = Math.max(2, Math.round(w * k));
      c.height = Math.max(2, Math.round(h * k));
    };
    size();
    const ro = new ResizeObserver(size);
    ro.observe(c);
    let raf = 0;
    let lastT = -1;
    let lastMode = '';
    let lastW = 0;
    const loop = () => {
      raf = requestAnimationFrame(loop);
      c.classList.toggle('is-on', feed.on);
      if (!feed.on) return;
      // draw only when something moved: a paused song holds its picture without keeping the card busy
      if (feed.t === lastT && feed.mode === lastMode && c.width === lastW) return;
      lastT = feed.t;
      lastMode = feed.mode;
      lastW = c.width;
      gl.draw(feed.mode, feed);
    };
    raf = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, []);

  return <canvas ref={canvas} className="ad-bgviz" aria-hidden="true" />;
}
