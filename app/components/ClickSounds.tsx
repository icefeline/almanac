'use client';

import { useEffect } from 'react';

/**
 * Click sounds for the retro buttons: a dry key-down tick when a button is pressed and a lighter tick
 * when it is let go, like a keyboard switch. Nothing is downloaded: the sounds are made on the spot with
 * the Web Audio API (a short burst of filtered noise and a falling square blip).
 *
 * It listens once, on the whole page, and plays for anything that can be pressed (buttons, links,
 * role=button, selects, summaries) unless it is disabled. A reader can turn it off with
 * localStorage 'slow-garden-sound' = 'off'. Browsers only allow audio after a touch or click, and the
 * first press is exactly that, so the audio engine is created then.
 */

const PRESSABLE = 'button, a[href], [role="button"], select, summary, label[for], .sg-retro';

let ac: AudioContext | null = null;

function engine(): AudioContext | null {
  if (!ac) {
    const A = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!A) return null;
    ac = new A();
  }
  if (ac.state === 'suspended') void ac.resume();
  return ac;
}

function muted(): boolean {
  try {
    return localStorage.getItem('slow-garden-sound') === 'off';
  } catch {
    return false;
  }
}

function tick(kind: 'down' | 'up') {
  const c = engine();
  if (!c) return;
  const t = c.currentTime;
  const down = kind === 'down';

  // the body of the click: a few milliseconds of noise that dies away fast, through a band filter
  const len = Math.floor(c.sampleRate * 0.03);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3);
  const noise = c.createBufferSource();
  noise.buffer = buf;
  const band = c.createBiquadFilter();
  band.type = 'bandpass';
  band.frequency.value = down ? 2200 : 3200;
  band.Q.value = 1.2;
  const noiseGain = c.createGain();
  noiseGain.gain.value = down ? 0.45 : 0.22;
  noise.connect(band).connect(noiseGain).connect(c.destination);

  // the blip: a square wave that falls quickly, higher and softer on release
  const osc = c.createOscillator();
  osc.type = 'square';
  osc.frequency.setValueAtTime(down ? 900 : 1400, t);
  osc.frequency.exponentialRampToValueAtTime(down ? 380 : 900, t + 0.04);
  const oscGain = c.createGain();
  oscGain.gain.setValueAtTime(down ? 0.05 : 0.025, t);
  oscGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  osc.connect(oscGain).connect(c.destination);

  noise.start(t);
  osc.start(t);
  osc.stop(t + 0.06);
}

export default function ClickSounds() {
  useEffect(() => {
    let pressed: Element | null = null;

    const target = (e: Event) => {
      const el = (e.target as Element | null)?.closest?.(PRESSABLE) ?? null;
      if (!el) return null;
      if ((el as HTMLButtonElement).disabled || el.getAttribute('aria-disabled') === 'true') return null;
      return el;
    };

    const down = (e: PointerEvent) => {
      if (e.button !== 0 || muted()) return;
      const el = target(e);
      if (!el) return;
      pressed = el;
      tick('down');
    };
    const up = (e: PointerEvent) => {
      const el = pressed;
      pressed = null;
      if (!el || muted()) return;
      // let go over the same thing it was pressed on
      if ((e.target as Element | null)?.closest?.(PRESSABLE) === el) tick('up');
    };
    const cancel = () => {
      pressed = null;
    };

    document.addEventListener('pointerdown', down, true);
    document.addEventListener('pointerup', up, true);
    document.addEventListener('pointercancel', cancel, true);
    return () => {
      document.removeEventListener('pointerdown', down, true);
      document.removeEventListener('pointerup', up, true);
      document.removeEventListener('pointercancel', cancel, true);
    };
  }, []);

  return null;
}
