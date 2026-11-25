'use client';

import { useCallback, useEffect, useRef, useState, type ChangeEvent, type DragEvent } from 'react';
import { createPortal } from 'react-dom';
import { glyph } from './pixels';
import { MenuBar } from './WinMenu';
import { analyseSong, arcAt, type Arc } from './arc';
import { feed, makeGL, type Frame, type GLViz, type ShaderViz } from './shaders';
import { TRACKS, type Track } from './tracks';

/*
 * The media player: a screen that visualises the music, a line saying what is playing and how far along, a seek bar,
 * and the usual buttons. The songs come from tracks.ts, plus anything the visitor opens from their own device.
 *
 * The sound goes through an AnalyserNode, and the screen draws what it hears, and above all when it hits. A beat
 * detector watches the low end for sudden rises; each one gives the picture a soft push and a glide of spin, and how
 * often they come sets how erratic everything gets: a slow song drifts, a fast one churns and speeds up. Nothing here
 * flashes or jumps: the beat is smoothed before the pictures see it, and brightness barely moves.
 *
 * View > visualisation picks the picture: four, all drawn on the graphics card as shaders (a kaleidoscope, a fractal, a
 * tunnel, a flow). "Fill the desktop" spreads the picture behind the whole screen (see VizLayer), and "full screen"
 * takes the browser full screen too. Where the browser has no graphics card to use, a flat kaleidoscope stands in. With
 * no music loaded the screen idles on a slow made-up signal, with a gentle pulse, so the window is never dead.
 */

type Viz = ShaderViz;
const VIZ: Viz[] = ['kaleidoscope', 'fractal', 'tunnel', 'flow', 'bubbles', 'ridges', 'contours'];

const W = 320;
const H = 180;

const G = {
  // the triangle is five wide and sits one column in, so that in an even button it is centred on the pixel grid
  play: glyph(['.X....', '.XX...', '.XXX..', '.XXXX.', '.XXXXX', '.XXXX.', '.XXX..', '.XX...', '.X....'], true),
  pause: glyph(['XXX.XXX', 'XXX.XXX', 'XXX.XXX', 'XXX.XXX', 'XXX.XXX', 'XXX.XXX', 'XXX.XXX', 'XXX.XXX', 'XXX.XXX'], true),
  stop: glyph(['XXXXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX', 'XXXXXXX'], true),
  prev: glyph(['X.......X', 'X......XX', 'X.....XXX', 'X....XXXX', 'X...XXXXX', 'X....XXXX', 'X.....XXX', 'X......XX', 'X.......X'], true),
  next: glyph(['X.......X', 'XX......X', 'XXX.....X', 'XXXX....X', 'XXXXX...X', 'XXXX....X', 'XXX.....X', 'XX......X', 'X.......X'], true),
  speaker: glyph(['...X....', '..XX..X.', 'XXXX...X', 'XXXX.X.X', 'XXXX...X', '..XX..X.', '...X....'], true),
  win: glyph(['XXXXXXXXX', 'XXXXXXXXX', 'X.......X', 'X.......X', 'X.......X', 'X.......X', 'X.......X', 'X.......X', 'XXXXXXXXX'], true),
  expand: glyph(['XXX...XXX', 'X.......X', 'X.......X', '.........', '.........', '.........', 'X.......X', 'X.......X', 'XXX...XXX'], true),
  // the same cone as the speaker, in the same place, with the sound waves left off
  mute: glyph(['...X....', '..XX....', 'XXXX....', 'XXXX....', 'XXXX....', '..XX....', '...X....'], true),
};

const fmt = (s: number) => (Number.isFinite(s) && s > 0 ? `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '00:00');
const avg = (a: Uint8Array, from: number, to: number) => {
  let t = 0;
  for (let i = from; i < to; i++) t += a[i];
  return t / Math.max(1, to - from);
};

/**
 * A kaleidoscope: one wedge of drifting, glowing beads and curves, drawn eight times round the middle and mirrored,
 * so it always comes out symmetrical. Each bead is a pitch: louder pitches are bigger and brighter, and the bass
 * spins the whole thing faster. The colours drift slowly round the wheel.
 */
function drawKaleidoscope(ctx: CanvasRenderingContext2D, freq: Uint8Array, t: number, spin: { a: number }) {
  ctx.globalCompositeOperation = 'source-over';
  ctx.fillStyle = 'rgba(6,4,22,0.22)';
  ctx.fillRect(0, 0, W, H);
  const bass = avg(freq, 0, 6) / 255;
  const mid = avg(freq, 6, 40) / 255;
  spin.a += 0.004 + bass * 0.035;
  const hue = (t * 0.02) % 360;
  const R = Math.hypot(W, H) / 2;
  const beads = 18;
  const wedges = 8;
  ctx.globalCompositeOperation = 'lighter';
  ctx.save();
  ctx.translate(W / 2, H / 2);
  for (let k = 0; k < wedges; k++) {
    for (const mirror of [1, -1]) {
      ctx.save();
      ctx.rotate(spin.a + (k * Math.PI * 2) / wedges);
      ctx.scale(1, mirror);
      let px = 0;
      let py = 0;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      const pts: [number, number, number, number][] = [];
      for (let i = 0; i < beads; i++) {
        const v = freq[Math.min(freq.length - 1, i * 5)] / 255;
        const x = 22 + (i * R * 0.5) / beads + Math.sin(t * 0.002 + i) * 5;
        const y = Math.sin(t * 0.0013 * (1 + i * 0.09) + i * 1.3) * R * 0.2 * (0.25 + v);
        pts.push([x, y, v, i]);
        ctx.quadraticCurveTo(px, py, (px + x) / 2, (py + y) / 2);
        px = x;
        py = y;
      }
      ctx.lineWidth = 0.7 + bass * 1.6;
      ctx.strokeStyle = `hsla(${hue + 200},90%,${60 + mid * 25}%,${0.18 + mid * 0.4})`;
      ctx.stroke();
      for (const [x, y, v, i] of pts) {
        ctx.fillStyle = `hsla(${hue + i * 14},95%,${46 + v * 26}%,${0.08 + v * 0.38})`;
        ctx.beginPath();
        ctx.arc(x, y, (1.2 + v * 10) * (0.55 + (i / beads) * 0.7), 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.restore();
    }
  }
  ctx.restore();
  // a small bright heart where all the wedges meet
  const g = ctx.createRadialGradient(W / 2, H / 2, 0, W / 2, H / 2, 9 + bass * 22);
  g.addColorStop(0, `hsla(${hue + 60},100%,86%,${0.2 + bass * 0.3})`);
  g.addColorStop(1, `hsla(${hue + 60},100%,50%,0)`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
}

export default function MediaPlayer({
  onClose,
  miniHost,
  showMini,
  onExpand,
}: {
  onClose: () => void;
  /** On a phone: where the small bar along the bottom goes. The player keeps playing while its window is put away. */
  miniHost?: HTMLElement | null;
  showMini?: boolean;
  onExpand?: () => void;
}) {
  const [tracks, setTracks] = useState<Track[]>(TRACKS);
  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(0.8);
  const [muted, setMuted] = useState(false);
  const [viz, setViz] = useState<Viz>('kaleidoscope');
  // a different visualisation greets each visit
  useEffect(() => setViz(VIZ[Math.floor(Math.random() * VIZ.length)]), []);
  const [fill, setFill] = useState(false); // the picture spreads behind the whole desktop
  const [problem, setProblem] = useState('');

  const audio = useRef<HTMLAudioElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const glCanvas = useRef<HTMLCanvasElement>(null);
  const gl = useRef<GLViz | null>(null);
  const [glReady, setGlReady] = useState(false);
  const picker = useRef<HTMLInputElement>(null);
  const actx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const freq = useRef(new Uint8Array(128));
  const urls = useRef<string[]>([]);
  const wantPlay = useRef(false);
  // the drawing loop reads these rather than being rebuilt each time they change
  const live = useRef({ playing: false, hasTrack: false, viz: 'kaleidoscope' as Viz, fill: false, trackKey: '' });
  live.current = { playing, hasTrack: tracks.length > 0, viz, fill, trackKey: tracks[index]?.src ?? '' };

  const track: Track | undefined = tracks[index];

  // the sound goes through an analyser on its way to the speakers; it can only be set up once, and only after a tap
  const ensureGraph = useCallback(() => {
    if (actx.current || !audio.current) return;
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    const src = ctx.createMediaElementSource(audio.current);
    const an = ctx.createAnalyser();
    an.fftSize = 512; // finer at the low end, where the beat is
    an.smoothingTimeConstant = 0.2; // little smoothing here: it only delays the beat, and the pictures smooth themselves
    src.connect(an);
    an.connect(ctx.destination);
    actx.current = ctx;
    analyser.current = an;
    freq.current = new Uint8Array(an.frequencyBinCount);
  }, []);

  const play = useCallback(async () => {
    const a = audio.current;
    if (!a || !track) return;
    ensureGraph();
    try {
      // start the song straight from the tap: a browser only allows play() inside the gesture, and waiting on the
      // audio graph first (as this used to) is exactly what made the buttons do nothing in Safari
      const started = a.play();
      void actx.current?.resume();
      await started;
      setProblem('');
    } catch {
      setProblem("can't play this file");
    }
  }, [track, ensureGraph]);

  const pause = () => audio.current?.pause();
  const toggle = () => (playing ? pause() : void play());
  const stop = () => {
    const a = audio.current;
    if (!a) return;
    a.pause();
    a.currentTime = 0;
    setTime(0);
  };
  const go = useCallback(
    (to: number) => {
      if (!tracks.length) return;
      wantPlay.current = true;
      setIndex(((to % tracks.length) + tracks.length) % tracks.length);
    },
    [tracks.length],
  );

  /*
   * The phone's own controls (lock screen, control centre, headphones, the browser's media notification) for this song.
   * Registering them is what lets them show the title and work the same in a browser tab as in the home screen app.
   */
  useEffect(() => {
    if (!('mediaSession' in navigator) || !track) return;
    const ms = navigator.mediaSession;
    try {
      ms.metadata = new MediaMetadata({ title: track.title, artist: track.artist ?? 'slow garden', album: 'slow garden' });
    } catch {}
    ms.playbackState = playing ? 'playing' : 'paused';
  }, [track, playing]);
  useEffect(() => {
    if (!('mediaSession' in navigator)) return;
    const ms = navigator.mediaSession;
    const set = (name: MediaSessionAction, fn: MediaSessionActionHandler | null) => {
      try {
        ms.setActionHandler(name, fn);
      } catch {}
    };
    set('play', () => void play());
    set('pause', () => pause());
    set('previoustrack', tracks.length > 1 ? () => go(index - 1) : null);
    set('nexttrack', tracks.length > 1 ? () => go(index + 1) : null);
    return () => {
      (['play', 'pause', 'previoustrack', 'nexttrack'] as MediaSessionAction[]).forEach((n) => set(n, null));
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [play, go, index, tracks.length]);
  // coming back to the tab or app: wake the audio graph again, which the phone suspends while we were away
  useEffect(() => {
    const back = () => {
      if (!document.hidden && audio.current && !audio.current.paused) void actx.current?.resume();
    };
    document.addEventListener('visibilitychange', back);
    return () => document.removeEventListener('visibilitychange', back);
  }, []);

  // a new song was chosen while playing (or by the buttons): start it as soon as it has loaded
  useEffect(() => {
    if (wantPlay.current && track) void play();
    wantPlay.current = false;
  }, [index, track, play]);

  useEffect(() => {
    if (audio.current) audio.current.volume = muted ? 0 : vol;
  }, [vol, muted]);

  // songs opened from the visitor's own device: kept as local addresses that only this browser can read
  const addFiles = (files: FileList | File[] | null) => {
    const songs = Array.from(files ?? []).filter((f) => f.type.startsWith('audio') || /\.(mp3|m4a|ogg|wav|flac|aac)$/i.test(f.name));
    if (!songs.length) return;
    const added = songs.map((f) => {
      const src = URL.createObjectURL(f);
      urls.current.push(src);
      return { title: f.name.replace(/\.[^.]+$/, '').toLowerCase(), src, file: f };
    });
    wantPlay.current = true;
    setTracks((t) => [...t, ...added]);
    setIndex(tracks.length);
  };
  const onPick = (e: ChangeEvent<HTMLInputElement>) => {
    addFiles(e.target.files);
    e.target.value = '';
  };
  const onDrop = (e: DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  };

  // the graphics-card canvas, if the browser has one
  useEffect(() => {
    const c = glCanvas.current;
    if (!c) return;
    gl.current = makeGL(c);
    setGlReady(!!gl.current);
    // draw at the size it is shown (up to twice over, and no more than about 900 across), so thin lines stay crisp
    // rather than being a small picture stretched up
    const fit = () => {
      const r = c.getBoundingClientRect();
      if (!r.width) return;
      const k = Math.min(window.devicePixelRatio || 1, 2);
      const w = Math.min(900, Math.max(320, Math.round(r.width * k)));
      const h = Math.max(180, Math.round((w * r.height) / r.width));
      if (c.width !== w || c.height !== h) {
        c.width = w;
        c.height = h;
      }
    };
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(c);
    return () => ro.disconnect();
  }, []);

  // read the whole song ahead of time for its shape (hushed intro, build, full beat), so the picture can follow it
  const arcRef = useRef<Arc | null>(null);
  const trackSrc = tracks[index]?.src;
  useEffect(() => {
    arcRef.current = null;
    const t = tracks[index];
    if (!t) return;
    let current = true;
    void analyseSong(t.src, t.file ?? t.src).then((a) => {
      if (current) arcRef.current = a;
    });
    return () => {
      current = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trackSrc]);

  // the drawing loop
  useEffect(() => {
    const c = canvas.current;
    const ctx = c?.getContext('2d');
    if (!c || !ctx) return;
    ctx.fillStyle = '#021a05';
    ctx.fillRect(0, 0, W, H);
    let raf = 0;
    const spin = { a: 0 };
    let drawn: string | null = null; // what is on the screen, so a paused screen can still change its look
    const idle = new Uint8Array(128);
    const silence = new Uint8Array(256);
    const smooth = new Float32Array(16); // sixteen bands, deep bass to high treble, quick to rise and slow to fall
    const bands = new Float32Array(16);
    const prevAll = new Float32Array(256);
    // for anyone who has asked their device for less motion, everything moves at a quarter of the strength
    const pace = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0.25 : 1;
    // the detector's and the pictures' memory. `alive` is how much the picture is moving: it eases up when a song plays and
    // down when it is paused, stopped or skipped, so motion slows to a stop rather than freezing; `ref` is how loud this
    // song has been lately, so a quiet song moves as much as a loud one.
    const bt = {
      fmean: 0, fdev: 0, prevFlux: 0, prevF: new Float32Array(6), last: 0, rate: 0, beat: 0, beatS: 0, chaos: 0,
      spinV: 0, spinVs: 0, spin: 0, dir: 1, clock: 0, prevNow: 0,
      alive: 0, ref: 0.3, track: null as string | null, level: 0,
      arc: 0.5, build: 0, vFast: 0, vSlow: 0, sBass: 0, sVocal: 0, sFlux: 0,
      vol: 0, vocal: 0, flux: 0, mVol: 0.4, mVocal: 0.4, mFlux: 0.4, peak: 0.5, peakAvg: 0.5, bright: 0.5, brightAvg: 0.5, pitch: 0.5, tone: 0.5,
    };
    const frame: Frame = { arc: 0.5, build: 0, sBass: 0, sVocal: 0, sFlux: 0, t: 0, bass: 0, mid: 0, high: 0, vol: 0, vocal: 0, pitch: 0.5, bright: 0.5, flux: 0, beat: 0, chaos: 0, spin: 0, bands };
    const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
    const loop = (now: number) => {
      raf = requestAnimationFrame(loop);
      const { playing: isPlaying, hasTrack, viz: mode, fill: spread, trackKey } = live.current;
      feed.on = spread;
      const key = mode + (spread ? '+fill' : '');
      const dt = bt.prevNow ? Math.min(0.05, (now - bt.prevNow) / 1000) : 0.016;
      bt.prevNow = now;

      // skipping to another song: the picture dips and swells back with the new one
      if (bt.track !== trackKey) {
        if (bt.track !== null) {
          bt.alive = Math.min(bt.alive, 0.3);
          bt.rate = 0;
          bt.beat = 0;
          bt.ref = Math.max(0.2, bt.ref * 0.7); // the next song may be a different loudness
        }
        bt.track = trackKey;
      }
      // play: it comes up in about a second. Pause, stop or skip: it winds down over a couple of seconds
      const wantAlive = !hasTrack || isPlaying ? 1 : 0;
      bt.alive += (wantAlive - bt.alive) * (1 - Math.exp(-dt * (wantAlive > bt.alive ? 2.6 : 1.0)));
      if (bt.alive < 0.002 && wantAlive === 0) bt.alive = 0;

      let f: Uint8Array;
      if (!hasTrack || (isPlaying && !analyser.current)) {
        // nothing loaded, or playing without a graph to listen to: a slow made-up signal with a gentle pulse, so the window is alive
        const pulse = Math.pow(Math.max(0, Math.sin(now * 0.0052)), 8);
        for (let i = 0; i < idle.length; i++) idle[i] = 30 + 110 * Math.abs(Math.sin(now * 0.0011 + i * 0.33)) * (1 - (i / idle.length) * 0.65) + (i < 6 ? 120 * pulse : 0);
        f = idle;
      } else if (analyser.current) {
        analyser.current.getByteFrequencyData(freq.current); // a paused song reads as silence, so everything fades by itself
        f = freq.current;
      } else {
        f = silence;
      }
      // fully wound down and nothing left in the signal: hold still and stop spending the card's time
      if (bt.alive === 0 && bt.level < 0.004 && drawn === key) return;
      drawn = key;
      const n = f.length;
      const half = n >> 1;

      // how loud this song is: a slowly moving reference, so quiet and loud songs both fill the range
      let sum = 0;
      for (let i = 1; i < half; i++) sum += f[i];
      const lvl = sum / (half - 1) / 255;
      if (lvl > bt.ref) bt.ref += (lvl - bt.ref) * 0.15;
      else if (lvl > 0.03) bt.ref += (lvl - bt.ref) * (1 - Math.exp(-dt * 0.12));
      const gain = Math.min(2.6, Math.max(0.8, 0.5 / Math.max(0.1, bt.ref)));

      for (let i = 0; i < 16; i++) {
        const lo = Math.floor(Math.pow(n, i / 16));
        const hi = Math.max(lo + 1, Math.floor(Math.pow(n, (i + 1) / 16)));
        const v = clamp01((avg(f, lo, hi) / 255) * gain);
        smooth[i] += (v - smooth[i]) * (v > smooth[i] ? 0.3 : 0.08);
        bands[i] = smooth[i];
      }
      const mean = (from: number, to: number) => {
        let s2 = 0;
        for (let i = from; i < to; i++) s2 += bands[i];
        return s2 / (to - from);
      };
      const bass = mean(0, 4);
      const mid = mean(4, 10);
      const high = mean(10, 16);
      bt.level = Math.max(bass, mid, high);

      // the whole sound: overall volume, the voice's range (about 300 Hz to 3.4 kHz), how much is changing, and where
      // the sound sits in pitch (its loudest note, and how bright it is), shown as how far it has moved from where it
      // usually sits in this song so that every song, high or low, moves the picture
      const rise = (cur: number, v: number, up: number, down: number) => cur + (v - cur) * (v > cur ? up : down);
      bt.vol = rise(bt.vol, clamp01(lvl * gain * 1.15), 0.25, 0.07);
      bt.vocal = rise(bt.vocal, clamp01((avg(f, 4, Math.min(40, half)) / 255) * gain * 1.1), 0.3, 0.08);
      let fl = 0;
      let wsum = 0;
      let csum = 0;
      let best = 0;
      let bestK = 2;
      for (let k = 1; k < half; k++) {
        if (k > 5) fl += Math.max(0, f[k] - prevAll[k]);
        prevAll[k] = f[k];
        const w = (f[k] / 255) * (f[k] / 255);
        wsum += w;
        csum += w * k;
        if (k >= 2 && k < half / 2 && f[k] > best) {
          best = f[k];
          bestK = k;
        }
      }
      bt.flux = rise(bt.flux, clamp01((fl / (255 * (half - 6))) * gain * 7), 0.4, 0.1);
      if (wsum > 0.05) {
        bt.bright += ((Math.log(Math.max(1, csum / wsum)) / Math.log(half)) - bt.bright) * 0.08;
        if (best > 70) bt.peak += ((Math.log(bestK) / Math.log(half / 2)) - bt.peak) * 0.18;
        bt.peakAvg += (bt.peak - bt.peakAvg) * (1 - Math.exp(-dt * 0.15));
        bt.brightAvg += (bt.bright - bt.brightAvg) * (1 - Math.exp(-dt * 0.15));
      }
      bt.pitch = clamp01(0.5 + (bt.peak - bt.peakAvg) * 2.6);
      bt.tone = clamp01(0.5 + (bt.bright - bt.brightAvg) * 3.2);

      // where the song is in its own arc: how intense this part is (looking a moment ahead, so the picture lifts just
      // before the music does) and whether it is building or falling away. Without the read-ahead, from the live volume.
      const shape = arcRef.current;
      let arcT = 0.6;
      let buildT = 0;
      if (hasTrack) {
        const ct = audio.current?.currentTime ?? 0;
        if (shape) {
          arcT = arcAt(shape, ct + 0.8);
          buildT = Math.max(-1, Math.min(1, (arcAt(shape, ct + 3.5) - arcAt(shape, ct)) * 2.2));
        } else {
          bt.vFast += (bt.vol - bt.vFast) * (1 - Math.exp(-dt * 0.7));
          bt.vSlow += (bt.vol - bt.vSlow) * (1 - Math.exp(-dt * 0.05));
          arcT = clamp01(0.5 + 3 * (bt.vFast - bt.vSlow));
        }
      }
      bt.arc += (arcT - bt.arc) * (1 - Math.exp(-dt * 2.5));
      bt.build += (buildT - bt.build) * (1 - Math.exp(-dt * 1.5));

      // the beat: a sudden jump in the low end (the bottom few bins) compared with how much that jumps about on this
      // song. Measured as the growth since the last frame, against a running average and spread of that growth, so it
      // finds the hits in a quiet, soft or bass-heavy song as readily as in a loud one (the old rule asked for a fixed
      // rise above the level and so went deaf on some songs for half a minute at a time).
      let flux = 0;
      for (let i = 0; i < 6; i++) {
        flux += Math.max(0, f[i] - bt.prevF[i]);
        bt.prevF[i] = f[i];
      }
      flux /= 255 * 6;
      bt.fdev += ((flux - bt.fmean) ** 2 - bt.fdev) * 0.04;
      bt.fmean += (flux - bt.fmean) * 0.04;
      const hit = flux > bt.fmean + 1.3 * Math.sqrt(bt.fdev) + 0.004 && flux > bt.prevFlux && now - bt.last > 140;
      bt.prevFlux = flux;
      if (hit) {
        const gap = (now - bt.last) / 1000;
        if (bt.last > 0 && gap < 2) bt.rate += (1 / gap - bt.rate) * 0.3; // beats a second, smoothed
        bt.last = now;
        // a soft hit in a hushed part, a full one in the thick of it
        const strength = clamp01((flux - bt.fmean) / (3 * Math.sqrt(bt.fdev) + 0.03));
        bt.beat = (0.35 + 0.65 * strength) * (0.45 + 0.55 * bt.arc);
        bt.spinV += bt.dir * (0.3 + 0.5 * bt.chaos) * (0.4 + 0.6 * bt.arc); // a push that sets the picture gliding round...
        if (Math.random() < 0.2 + 0.5 * bt.chaos) bt.dir = -bt.dir; // ...and the busier it is, the more often it changes its mind
      }
      bt.beat *= Math.exp(-dt * 5);
      // the pictures never see the hit itself, only a softened version that swells and settles
      bt.beatS += (bt.beat - bt.beatS) * (1 - Math.exp(-dt * 7));
      bt.spinV *= Math.exp(-dt * 1.2);
      bt.spinVs += (bt.spinV - bt.spinVs) * (1 - Math.exp(-dt * 5)); // and the spin speeds up and slows down gradually
      bt.spin += bt.spinVs * dt * 2.2 * bt.alive;
      bt.rate *= Math.exp(-dt * 0.12); // with no beats the tempo fades away
      // erratic = quick beats, and plenty going on
      const target = clamp01((bt.rate - 1) / 3.2) * 0.3 + clamp01(((bass + mid + high) / 3) * 1.6 - 0.25) * 0.2 + bt.arc * 0.5;
      bt.chaos += (target - bt.chaos) * (target > bt.chaos ? 0.06 : 0.02);
      // the picture's own clock runs faster the faster and harder the music is
      bt.clock += dt * pace * bt.alive * (0.35 + 0.9 * bt.arc) * (1 + bt.chaos * 2.4 + bt.beatS * 0.3);

      frame.t = bt.clock;
      frame.bass = bass;
      frame.mid = mid;
      frame.high = high;
      const drift = 1 - Math.exp(-dt * 2.2);
      bt.sBass += (bass - bt.sBass) * drift;
      bt.sVocal += (frame.vocal - bt.sVocal) * drift;
      bt.sFlux += (frame.flux - bt.sFlux) * drift;
      frame.sBass = bt.sBass;
      frame.sVocal = bt.sVocal;
      frame.sFlux = bt.sFlux;
      frame.arc = bt.arc;
      frame.build = bt.build;
      // each measure is shown partly as it is and mostly as how far it is from this song's own usual, so a song that is
      // always loud, or always sung over, still makes the picture rise and fall with its dynamics
      const rel = (x: number, m: number) => clamp01(0.3 * x + 0.7 * (0.5 + 3.4 * (x - m)));
      const slow = 1 - Math.exp(-dt * 0.25);
      bt.mVol += (bt.vol - bt.mVol) * slow;
      bt.mVocal += (bt.vocal - bt.mVocal) * slow;
      bt.mFlux += (bt.flux - bt.mFlux) * slow;
      frame.vol = rel(bt.vol, bt.mVol);
      frame.vocal = rel(bt.vocal, bt.mVocal);
      frame.pitch = bt.pitch;
      frame.bright = bt.tone;
      frame.flux = rel(bt.flux, bt.mFlux);
      frame.beat = bt.beatS * pace;
      frame.chaos = bt.chaos * pace;
      frame.spin = bt.spin * pace;
      if (spread) {
        // hand the same music to the layer behind the desktop
        feed.mode = mode;
        feed.t = frame.t;
        feed.bass = bass;
        feed.mid = mid;
        feed.high = high;
        feed.sBass = frame.sBass;
        feed.sVocal = frame.sVocal;
        feed.sFlux = frame.sFlux;
        feed.arc = frame.arc;
        feed.build = frame.build;
        feed.vol = frame.vol;
        feed.vocal = frame.vocal;
        feed.pitch = frame.pitch;
        feed.bright = frame.bright;
        feed.flux = frame.flux;
        feed.n++;
        feed.beat = frame.beat;
        feed.chaos = frame.chaos;
        feed.spin = frame.spin;
        feed.bands.set(bands);
      }
      if (gl.current && gl.current.draw(mode, frame)) return;
      // the flat stand-in, where the graphics card can't be used
      drawKaleidoscope(ctx, f, now, spin);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  // closing the window ends the music and lets go of everything it held
  useEffect(() => {
    const a = audio.current;
    const made = urls.current;
    return () => {
      a?.pause();
      made.forEach((u) => URL.revokeObjectURL(u));
      void actx.current?.close();
      actx.current = null;
      feed.on = false;
    };
  }, []);

  const fullScreen = () => {
    try {
      if (document.fullscreenElement) void document.exitFullscreen();
      else void document.documentElement.requestFullscreen();
    } catch {
      // some browsers (an iPhone's, for one) don't allow it: nothing to do
    }
  };
  const showGL = glReady;
  const status = problem
    ? problem
    : !track
      ? 'no music yet. file > open, or drop a song here'
      : `${playing ? 'playing' : time > 0 ? 'paused' : 'ready'}: ${track.artist ? `${track.artist} - ` : ''}${track.title}`;

  const shortName = track ? `${track.artist ? `${track.artist} - ` : ''}${track.title}` : 'no music yet';
  const mini = (
    <div className="wd-mini" role="region" aria-label="media player">
      <div className="wd-mini-prog" style={{ width: dur ? `${Math.min(100, (time / dur) * 100)}%` : '0%' }} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/about/icons/cd-16.png" alt="" width={16} height={16} />
      <button type="button" className="wd-mini-ttl" onClick={onExpand} title="open the player">
        <span key={problem || shortName} className={`wd-mini-run${playing ? ' is-on' : ''}`}>
          <span>{problem || shortName}</span>
          <span aria-hidden="true">{problem || shortName}</span>
        </span>
      </button>
      <button type="button" className="wd-mpb" aria-label="previous" disabled={tracks.length < 2} style={{ '--g': G.prev } as React.CSSProperties} onClick={() => go(index - 1)} />
      <button type="button" className="wd-mpb" aria-label={playing ? 'pause' : 'play'} disabled={!track} style={{ '--g': playing ? G.pause : G.play } as React.CSSProperties} onClick={toggle} />
      <button type="button" className="wd-mpb" aria-label="next" disabled={tracks.length < 2} style={{ '--g': G.next } as React.CSSProperties} onClick={() => go(index + 1)} />
      <button type="button" className="wd-mpb" aria-label="open the player" style={{ '--g': G.win } as React.CSSProperties} onClick={onExpand} />
    </div>
  );
  return (
    <>
    <div className="wd-mp" onDragOver={(e) => e.preventDefault()} onDrop={onDrop}>
      <MenuBar
        menus={[
          {
            label: 'file',
            items: [{ label: 'open...', onSelect: () => picker.current?.click() }, { label: '', sep: true }, { label: 'close', onSelect: onClose }],
          },
          {
            label: 'view',
            items: [
              ...VIZ.map((v) => ({ label: v, checked: viz === v, onSelect: () => setViz(v) })),
              { label: '', sep: true },
              { label: 'fill the desktop', checked: fill, onSelect: () => setFill((x) => !x) },
              { label: 'full screen', onSelect: fullScreen },
            ],
          },
          {
            label: 'play',
            items: [
              { label: playing ? 'pause' : 'play', disabled: !track, onSelect: toggle },
              { label: 'stop', disabled: !track, onSelect: stop },
              { label: 'previous', disabled: tracks.length < 2, onSelect: () => go(index - 1) },
              { label: 'next', disabled: tracks.length < 2, onSelect: () => go(index + 1) },
            ],
          },
        ]}
      />
      <div className="wd-mp-screen" title={`visualisation: ${viz}`} onClick={() => setViz((v) => VIZ[(VIZ.indexOf(v) + 1) % VIZ.length])}>
        <canvas ref={glCanvas} width={480} height={270} className={showGL ? undefined : 'is-off'} aria-label="music visualiser" />
        <canvas ref={canvas} width={W} height={H} className={showGL ? 'is-off' : undefined} aria-hidden="true" />
      </div>
      <div className="wd-status">
        <div className="wd-sf">{status}</div>
        <div className="wd-sf wd-mp-time">
          {fmt(time)} / {fmt(dur)}
        </div>
      </div>
      <input
        type="range"
        className="wd-range"
        aria-label="seek"
        min={0}
        max={dur || 1}
        step={0.1}
        value={Math.min(time, dur || 1)}
        disabled={!dur}
        onChange={(e) => {
          const v = Number(e.target.value);
          if (audio.current) audio.current.currentTime = v;
          setTime(v);
        }}
      />
      <div className="wd-mp-ctrls">
        <button type="button" className="wd-mpb is-big" aria-label={playing ? 'pause' : 'play'} disabled={!track} style={{ '--g': playing ? G.pause : G.play } as React.CSSProperties} onClick={toggle} />
        <button type="button" className="wd-mpb" aria-label="stop" disabled={!track} style={{ '--g': G.stop } as React.CSSProperties} onClick={stop} />
        <button type="button" className="wd-mpb" aria-label="previous" disabled={tracks.length < 2} style={{ '--g': G.prev } as React.CSSProperties} onClick={() => go(index - 1)} />
        <button type="button" className="wd-mpb" aria-label="next" disabled={tracks.length < 2} style={{ '--g': G.next } as React.CSSProperties} onClick={() => go(index + 1)} />
        <span className="wd-mp-gap" />
        <button type="button" className="wd-mpb" aria-label="fill the desktop" aria-pressed={fill} title="fill the desktop" style={{ '--g': G.expand } as React.CSSProperties} onClick={() => setFill((x) => !x)} />
        <button type="button" className="wd-mpb" aria-label={muted ? 'unmute' : 'mute'} style={{ '--g': muted ? G.mute : G.speaker } as React.CSSProperties} onClick={() => setMuted((m) => !m)} />
        <input
          type="range"
          className="wd-range wd-mp-vol"
          aria-label="volume"
          min={0}
          max={1}
          step={0.02}
          value={muted ? 0 : vol}
          onChange={(e) => {
            setVol(Number(e.target.value));
            setMuted(false);
          }}
        />
      </div>
      <audio
        ref={audio}
        src={track?.src}
        preload="auto"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => (tracks.length > 1 ? go(index + 1) : stop())}
        onTimeUpdate={(e) => setTime(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => {
          setDur(e.currentTarget.duration);
          setProblem('');
        }}
        onError={() => track && setProblem("can't play this file")}
      />
      <input ref={picker} type="file" accept="audio/*" multiple hidden onChange={onPick} />
    </div>
    {miniHost && showMini ? createPortal(mini, miniHost) : null}
    </>
  );
}
