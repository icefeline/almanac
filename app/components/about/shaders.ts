/*
 * The media player's trippy pictures, drawn on the graphics card by small fragment shaders. Every pixel of the screen
 * runs the same little program, which is handed the time and what the music is doing, and works out its own colour.
 * Written for this page; the look is in the spirit of the psychedelic WebGL visualisers around, with none of their code.
 *
 * They are meant to be filled edge to edge, so you feel inside them rather than looking at a picture: there is no
 * dark border, the middle is never fixed, the eye wanders, and the zoom never ends (three layers zoom in at different
 * phases and fade into one another, so there is always another level to fall into).
 *
 * What they are handed (see Frame): loudness in the bass, mids and highs, and sixteen finer bands; `beat`, a pulse that
 * jumps to 1 on every hit and dies away; `chaos`, how fast and busy the music is, from calm to frantic; and `spin`, an
 * angle that every hit nudges one way or the other. A hit gives the picture a soft push in and a glide of spin. The
 * faster the beats, the faster time itself runs, and the harder everything is warped. Everything is kept smooth: there
 * are no flashes, bursts or rings on a hit, and brightness barely moves, so a fast song makes it wild but never jumpy.
 */

export type ShaderViz = 'kaleidoscope' | 'fractal' | 'tunnel' | 'flow' | 'hatch' | 'ridges' | 'contours';
export const SHADER_VIZ: ShaderViz[] = ['kaleidoscope', 'fractal', 'tunnel', 'flow', 'hatch', 'ridges', 'contours'];
export const isShader = (v: string): v is ShaderViz => (SHADER_VIZ as string[]).includes(v);

/** What the music is doing, one frame at a time. */
export interface Frame {
  /** The picture's own clock: it runs faster when the music is fast and busy. */
  t: number;
  bass: number;
  mid: number;
  high: number;
  /** How intense this part of the song is compared with the rest of it: 0 its hushed, sparest moments, 1 its fullest. */
  arc: number;
  /** Whether the song is building (towards 1) or falling away (towards -1) over the next few seconds. */
  build: number;
  /** How loud it is overall, 0 to 1, relative to the song's own level. */
  vol: number;
  /** How much is going on in the voice's range (roughly 300 Hz to 3.4 kHz): singing, speech, the lead instrument. */
  vocal: number;
  /** Where the loudest note sits compared with where it usually sits in this song: 0.5 is usual, up is higher. */
  pitch: number;
  /** How bright the sound is compared with usual (0.5): dull and warm below, shimmering above. */
  bright: number;
  /** How much the sound is changing from moment to moment: notes arriving, texture, rhythm that isn't the kick. */
  flux: number;
  /** The same bass, voice and change, but drifting rather than darting (about half a second to follow): for shapes and flow. */
  sBass: number;
  sVocal: number;
  sFlux: number;
  /** Rises and falls smoothly with each hit (never a jump). */
  beat: number;
  /** 0 calm, 1 frantic: how quick the beats are and how much is going on. */
  chaos: number;
  /** An angle (radians) kicked to and fro by each hit. */
  spin: number;
  /** Sixteen bands, deep bass to high treble. */
  bands: Float32Array;
}

/**
 * What the player is hearing, shared with the layer behind the desktop so the same picture can fill the whole screen.
 * The player writes it every frame; the layer reads it.
 */
export const feed: Frame & { on: boolean; mode: ShaderViz; n: number } = {
  on: false,
  mode: 'kaleidoscope',
  t: 0,
  bass: 0,
  mid: 0,
  high: 0,
  arc: 0.5,
  build: 0,
  sBass: 0,
  sVocal: 0,
  sFlux: 0,
  vol: 0,
  vocal: 0,
  pitch: 0.5,
  bright: 0.5,
  flux: 0,
  beat: 0,
  chaos: 0,
  spin: 0,
  bands: new Float32Array(16),
  /** Counts frames, so the layer behind the desktop knows when there is something new to draw. */
  n: 0,
};

const HEAD = `
#extension GL_OES_standard_derivatives : enable
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform vec2 uRes;
uniform float uTime;
uniform float uBass;
uniform float uMid;
uniform float uHigh;
uniform float uSBass;
uniform float uSVocal;
uniform float uSFlux;
uniform float uArc;
uniform float uBuild;
uniform float uVol;
uniform float uVocal;
uniform float uPitch;
uniform float uBright;
uniform float uFlux;
uniform float uBeat;
uniform float uChaos;
uniform float uSpin;
uniform float uBands[16];

// a colour that cycles through the rainbow as t grows
vec3 pal(float t) { return 0.5 + 0.5 * cos(6.28318 * (t + vec3(0.0, 0.33, 0.67))); }
mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }
float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}
float fbm(vec2 p) {
  float v = 0.0, a = 0.5;
  for (int i = 0; i < 4; i++) { v += a * noise(p); p = p * 2.02 + vec2(1.7, 9.2); a *= 0.5; }
  return v;
}
// fold the plane into one wedge, mirrored n times round the origin: the heart of a kaleidoscope
vec2 kfold(vec2 uv, float n) {
  float a = atan(uv.y, uv.x);
  float r = length(uv);
  float seg = 6.28318 / n;
  a = abs(mod(a, seg) - seg * 0.5);
  return r * vec2(cos(a), sin(a));
}
// ordered (bayer) dither at a chunky, resolution-independent cell size, so gradients break into stippled pixels
float bayer2(vec2 a) { a = floor(a); return fract(a.x / 2.0 + a.y * a.y * 0.75); }
float bayer4(vec2 a) { return bayer2(0.5 * a) * 0.25 + bayer2(a); }
float bayer8(vec2 a) { return bayer4(0.5 * a) * 0.25 + bayer2(a); }
vec3 quant(vec3 c, float n, float d) { return floor(c * n + d) / n; }
float cell() { return max(1.0, floor(uRes.y / 130.0)); }
float dith() { return bayer8(floor(gl_FragCoord.xy / cell())); }
// six hard, acid, retro-future inks: hot pink, electric cyan, acid lime, uv violet, signal orange, chrome yellow
vec3 pick(float i) {
  i = mod(floor(i), 6.0);
  if (i < 1.0) return vec3(1.0, 0.1, 0.8);
  if (i < 2.0) return vec3(0.0, 0.95, 1.0);
  if (i < 3.0) return vec3(0.78, 1.0, 0.0);
  if (i < 4.0) return vec3(0.38, 0.1, 1.0);
  if (i < 5.0) return vec3(1.0, 0.33, 0.0);
  return vec3(1.0, 0.9, 0.0);
}
vec3 hot(float i) { return pick(4.0 + mod(floor(i), 3.0)); }   // orange, yellow, pink
vec3 cool(float i) { return pick(1.0 + mod(floor(i), 3.0)); }  // cyan, lime, violet
// each of the three new pictures has its own flat colour blocks, none shared:
// synthwave sunset (bubbles): hot pink, orange, sun yellow, purple, then deep indigo
vec3 sw(float i) {
  i = mod(floor(i), 4.0);
  if (i < 1.0) return vec3(1.0, 0.16, 0.43);
  if (i < 2.0) return vec3(1.0, 0.54, 0.0);
  if (i < 3.0) return vec3(1.0, 0.83, 0.0);
  return vec3(0.48, 0.12, 0.64);
}
// cyber grid (ridges): electric blue, cyan, mint, pale ice
vec3 cg(float i) {
  i = mod(floor(i), 4.0);
  if (i < 1.0) return vec3(0.1, 0.4, 1.0);
  if (i < 2.0) return vec3(0.0, 0.94, 1.0);
  if (i < 3.0) return vec3(0.25, 1.0, 0.72);
  return vec3(0.8, 0.94, 1.0);
}
// space-age poster (contours): cream, orange, teal, mustard, brick
vec3 sp(float i) {
  i = mod(floor(i), 5.0);
  if (i < 1.0) return vec3(0.96, 0.9, 0.74);
  if (i < 2.0) return vec3(0.95, 0.4, 0.08);
  if (i < 3.0) return vec3(0.0, 0.5, 0.52);
  if (i < 4.0) return vec3(0.95, 0.7, 0.1);
  return vec3(0.5, 0.12, 0.1);
}
// crt scanlines and a hard posterise, the last thing every picture goes through
vec3 retro(vec3 c, float d) {
  float row = floor(gl_FragCoord.y / cell());
  c *= 0.84 + 0.16 * mod(row, 2.0);
  return quant(clamp(c, 0.0, 1.0), 4.0, d * 0.75 + 0.12);
}
// four kinds of kaleidoscope, so the new pictures needn't all bloom into the same flower. every one is built from
// mirrors, so every join is a reflection:
//  0 a fan: a wedge fold round a centre that wanders about, so only part of the flower is ever in view
//  1 a mirror tile: the plane is a grid of cells, each the reflection of its neighbour
//  2 a fold-and-turn: fold across an axis, turn, fold again; it grows a crystal that is no flower at all
//  3 a mirrored strip: a butterfly down the middle, repeated up the page in mirrored bands
vec2 kal(vec2 uv, float mode, float t) {
  if (mode < 0.5) {
    vec2 c = 0.45 * vec2(sin(t * 0.11), cos(t * 0.13));
    return kfold(uv - c, 7.0) * 1.2;
  } else if (mode < 1.5) {
    vec2 p = uv * 2.2 + vec2(t * 0.05, t * 0.035);
    return (abs(fract(p * 0.5) - 0.5) * 2.0 - 0.5) * 0.9;
  } else if (mode < 2.5) {
    vec2 p = uv * 1.7;
    for (int i = 0; i < 4; i++) {
      p = abs(p) - vec2(0.24, 0.13);
      p = rot(0.85 + 0.08 * sin(t * 0.1 + float(i))) * p;
    }
    return p * 0.9;
  }
  vec2 p = uv * 1.3 + vec2(0.0, t * 0.04);
  return vec2(abs(p.x), abs(fract(p.y * 0.9 + 0.5) - 0.5) * 1.2) * 1.1;
}
// gentle tone mapping, so loud passages brighten without burning out to white
vec3 soft(vec3 c) { return 1.0 - exp(-c * 1.25); }
`;

const BODY: Record<ShaderViz, string> = {
  // three layers of warped, drifting colour, each folded into a different mirror, zooming forever
  kaleidoscope: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  uv *= 1.0 - 0.05 * uBeat - 0.05 * uVol - 0.07 * uBuild;
  uv += (0.14 + 0.12 * uChaos) * vec2(sin(t * 0.13), cos(t * 0.11));
  uv = rot(t * 0.05 + uSpin) * uv;
  // the voice opens the folds out, a brighter sound draws finer detail, and the sound's pitch turns the colours
  float warp = 2.4 * (0.55 + 0.6 * uArc + 1.5 * uChaos + 0.9 * uVocal + 0.5 * uFlux);
  vec3 col = vec3(0.0);
  for (int k = 0; k < 3; k++) {
    float fk = float(k);
    float ph = fract(t * 0.06 + fk / 3.0);
    float zoom = exp2(ph * 3.0);
    float fade = sin(ph * 3.14159);
    vec2 p = kfold(uv * zoom, 6.0 + 2.0 * fk);
    p = rot(fk * 1.1 + t * 0.04) * p;
    vec2 q = vec2(fbm(p * 2.0 + vec2(0.0, t * 0.1)), fbm(p * 2.0 + vec2(5.2, 1.3) - t * 0.08));
    float f = fbm(p * (2.2 + 1.4 * uBright) + warp * q + uBass * 0.8);
    vec3 c = pal(f * 1.4 + fk * 0.2 + t * 0.04 + uHigh * 0.3 + uSpin * 0.05 + (uPitch - 0.5) * 0.7);
    c *= 0.3 + 1.2 * smoothstep(0.2, 0.85, f);
    col += c * fade * 0.62;
  }
  float r = length(uv);
  float ring = 0.0;
  for (int i = 0; i < 8; i++) {
    float rr = fract(r * 1.3 - t * 0.07 - 0.125 * float(i));
    ring += uBands[i * 2] * smoothstep(0.09, 0.0, abs(rr - 0.5));
  }
  col += pal(r * 1.4 + t * 0.1 + 0.3) * ring * 0.55;
  col *= (0.55 + 0.35 * uArc) + 0.3 * uBass + 0.35 * uVol;
  gl_FragColor = vec4(soft(col), 1.0);
}`,

  // a fractal world of folded space (a Kali set), mirrored, with its orbit traps lit up as colour
  fractal: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  uv *= 1.0 - 0.04 * uBeat;
  uv += 0.1 * vec2(cos(t * 0.09), sin(t * 0.12));
  uv = rot(t * 0.04 + uSpin * 0.7) * uv * (1.3 + 0.45 * sin(t * 0.07) - 0.3 * uVol - 0.25 * uBuild);
  vec2 p = kfold(uv, 6.0) * 1.15;
  vec2 c = vec2(0.64 + 0.1 * sin(t * 0.11) + uBass * 0.06 + 0.02 * uBeat * sin(t * 1.5) + 0.05 * (uPitch - 0.5),
                0.5 + 0.09 * cos(t * 0.09) + 0.05 * uChaos * sin(t * 1.7) + 0.07 * uVocal);
  float trap = 1000.0;
  float acc = 0.0;
  for (int i = 0; i < 9; i++) {
    p = abs(p) / max(dot(p, p), 0.0001) - c;
    float d = length(p);
    trap = min(trap, d);
    acc += exp(-d * 2.2);
  }
  float g = exp(-trap * 3.0);
  vec3 col = pal(trap * 1.2 + t * 0.05 + uHigh * 0.4 + uSpin * 0.05 + (uPitch - 0.5) * 0.7) * (0.03 + 2.1 * g * g);
  col += pal(acc * 0.1 + 0.35) * acc * 0.016 * (0.6 + uMid * 1.2 + uVocal * 1.2 + uFlux * 0.8);
  col *= (0.5 + 0.35 * uArc) + 0.35 * uBass + 0.35 * uVol;
  gl_FragColor = vec4(soft(col), 1.0);
}`,

  // falling down a mirrored tunnel of spokes and rings, towards a light that flares with the bass
  tunnel: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  uv *= 1.0 - 0.04 * uBeat - 0.03 * uVol - 0.06 * uBuild;
  uv += 0.08 * vec2(sin(t * 0.17), cos(t * 0.13));
  uv = rot(sin(t * 0.2) * 0.5 + uSpin * 0.6) * uv;
  vec2 f = kfold(uv, 12.0);
  float r = length(f) + 0.0001;
  float a = atan(f.y, f.x);
  float z = 0.35 / r + t * 0.7 + uBass * 1.2 + uVol * 0.6;
  float spokes = 0.5 + 0.5 * sin(a * (20.0 + 6.0 * uArc + 14.0 * uChaos + 10.0 * uVocal) + z * 0.9 + t * 0.4 + uMid * 3.0);
  float rings = 0.5 + 0.5 * sin(z * (5.5 + 3.0 * uChaos + 2.0 * uBright));
  float v = smoothstep(0.3, 0.95, spokes * rings);
  vec3 col = pal(z * 0.1 + a * 1.2 + uHigh * 0.4 + uSpin * 0.05 + (uPitch - 0.5) * 0.7) * (0.15 + 1.4 * v);
  col += pal(z * 0.05 + 0.5) * 0.05 / (r + 0.05) * (0.3 + uBass * 1.0 + uBeat * 0.3 + uVol * 0.5 + uFlux * 0.4);
  col *= (0.6 + 0.45 * uArc) * smoothstep(0.0, 0.14, r);
  gl_FragColor = vec4(soft(col), 1.0);
}`,

  // slow liquid colour, mirrored, folded over itself and pushed about by the bass
  flow: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  vec2 p = kfold(rot(t * 0.04 + uSpin * 0.6) * uv * (3.8 - 0.5 * uVol) * (1.0 - 0.04 * uBeat), 6.0);
  float amp = 0.7 * (0.6 + 0.5 * uArc + 1.3 * uChaos + 0.8 * uVocal + 0.4 * uFlux);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    p += amp * vec2(sin(p.y * 1.7 + t * 0.4 + fi + uBass * 2.2), cos(p.x * 1.3 - t * 0.3 + fi * 1.7));
    p = rot(0.3) * p;
  }
  float f = sin(p.x * 2.6) + sin(p.y * 2.6) + sin((p.x + p.y) * 1.8) + sin(length(p) * 3.0 - t * 0.8);
  float v = 0.5 + 0.2 * f;
  vec3 col = pal(f * 0.2 + t * 0.04 + uMid * 0.5 + uSpin * 0.04 + (uPitch - 0.5) * 0.7);
  col *= (0.08 + 0.8 * smoothstep(0.1, 0.9, v)) * (0.65 + 0.4 * uArc) + uBass * 0.2 + 0.04 * uBeat + 0.3 * uVol;
  col += pal(f * 0.3 + 0.5) * pow(uHigh, 1.5) * (0.2 + 0.4 * uBright);
  gl_FragColor = vec4(soft(col), 1.0);
}`,

  // three more, after posters: neon blue bubbles over orange manga halftone, lines of green light folding over blue, and
  // blue topographic contours on white paper. Same rules as the rest: smooth, never a flash, and the whole sound moves them.

  // a lattice of glowing blue outlines that swell, drift apart and join, over a halftone of dots. Like the others it never
  // stops falling inward: two layers of the lattice zoom in at different phases and fade into one another
  hatch: `
// one set of ruled lines at an angle, thick and thin along its length, wobbling a little
float rule(vec2 uv, float ang, float freq, float seed, float t, float d, float vl, float ba) {
  vec2 q = rot(ang) * uv;
  float along = noise(vec2(q.y * 3.0 + seed * 5.0, t * 0.15 + seed));
  float thick = clamp(0.04 + 0.9 * along * along * (0.6 + 0.5 * hash(vec2(seed, 2.0))) + 0.15 * vl + 0.2 * ba, 0.04, 0.8);
  float wob = 0.05 * sin(q.y * 6.0 + t * 0.4 + seed);
  float dist = abs(fract((q.x + wob) * freq) - 0.5) * 2.0;
  return step(dist, thick + (d - 0.5) * 0.45);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  float vo = clamp(uSVocal, 0.0, 1.0), ba = clamp(uSBass, 0.0, 1.0), fl = clamp(uSFlux, 0.0, 1.0), vl = clamp(uVol, 0.0, 1.0);
  uv *= 1.0 - 0.05 * clamp(uBeat, 0.0, 1.0) - 0.04 * vl - 0.06 * clamp(uBuild, 0.0, 1.0);
  uv = rot(t * 0.03 + uSpin * 0.5) * uv;
  // a kaleidoscope, of a different kind each visit: every join is a reflection
  uv = kal(uv, @H@, t);
  float d = dith();
  vec2 p = uv * 1.3 + vec2(t * 0.04, -t * 0.03);
  p += (0.3 + 0.5 * vo) * vec2(noise(p * 1.2 + t * 0.07) - 0.5, noise(p * 1.2 - t * 0.06 + 5.0) - 0.5) * 2.0;
  // three line sets at different angles; smooth fields say how much of each is here, and the dither
  // decides pixel by pixel which one shows, so one hatch melts into the next as stipple with no edge
  float w1 = noise(p * 0.9 + 1.3), w2 = noise(p * 0.9 + 7.1), w3 = noise(p * 0.9 + 13.7);
  float ws = w1 + w2 + w3 + 0.001;
  float c1 = w1 / ws, c2 = (w1 + w2) / ws;
  float spin = uSpin * 0.5 + 0.4 * vo * sin(t * 0.5);
  float fa = 4.0 + 2.0 * ba, fb = 6.5 + 2.0 * ba, fc = 9.0 + 2.0 * ba;
  float m1 = rule(uv, 0.3 + spin, fa, 1.0, t, d, vl, ba);
  float m2 = rule(uv, 1.45 + spin * 0.6, fb, 2.0, t, d, vl, ba);
  float m3 = rule(uv, 2.5 - spin * 0.8, fc, 3.0, t, d, vl, ba);
  float s1 = step(d, c1), s2 = step(c1, d) * step(d, c2), s3 = step(c2, d);
  float m = s1 * m1 + s2 * m2 + s3 * m3;
  // the ground colour also changes by dither, never by a hard edge
  float shift = length(uv) * 2.5 - t * 0.2 - uArc * 2.0;
  float g = (w1 * 1.7 + w2 * 0.9) * 3.0 + shift;
  float gi = floor(g);
  vec3 ground = mix(sw(mod(gi, 3.0)), sw(mod(gi + 1.0, 3.0)), step(d, fract(g)));
  vec3 inkA = vec3(0.08, 0.02, 0.32), inkB = vec3(0.0, 0.9, 1.0), inkC = vec3(1.0, 0.97, 0.6);
  vec3 ink = inkA * s1 + inkB * s2 + inkC * s3;
  vec3 col = mix(ground, ink, m);
  gl_FragColor = vec4(retro(col, d), 1.0);
}`,

  // lines of light stacked and folded over each other like a sheet of paper in the wind, on blue, falling inward for ever
  ridges: `
float sheet(vec2 uv, float t, out float halo) {
  vec2 p = uv * vec2(0.8, 0.7) + vec2(t * 0.03, 0.0);
  // the space itself is stirred round, slowly, so the folds roll and curl rather than slide
  p += 0.28 * vec2(sin(p.y * 1.7 + t * 0.21), cos(p.x * 1.3 - t * 0.17));
  float h = noise(p * 1.1 + vec2(0.0, t * 0.04)) * 0.7 + noise(p * 2.3 + 4.1 - vec2(t * 0.03, 0.0)) * 0.3;
  float ridge = noise(p * 0.8 + 3.7 + vec2(t * 0.025, 0.0));
  float D = (h - 0.5) * (2.4 + 1.0 * uSBass) + (ridge - 0.5) * (1.0 + 0.6 * uSVocal) - 0.5 * smoothstep(0.55, 0.9, ridge) * (0.4 + uArc);
  float lines = 22.0 + 12.0 * uArc + 8.0 * uBuild;
  float s = (uv.y + D) * lines;
  float f = fract(s);
  float dd = min(f, 1.0 - f);
#ifdef GL_OES_standard_derivatives
  float aa = max(fwidth(s), 0.0001);
#else
  float aa = 0.06;
#endif
  // an even, clean line a pixel or so wide however crowded the folds get
  float w = max(0.05 + 0.03 * uVol, 0.5 * aa);
  halo = smoothstep(0.5, 0.0, dd) * smoothstep(0.0, 0.6, 1.0 / (1.0 + aa * 6.0));
  return 1.0 - smoothstep(w, w + 1.2 * aa, dd);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  uv *= 1.0 - 0.04 * uBeat - 0.04 * uVol - 0.08 * uBuild;
  uv += (0.1 + 0.1 * uChaos) * vec2(sin(t * 0.13), cos(t * 0.11));
  uv = rot(0.2 + t * 0.03 + uSpin) * uv;
  uv = kal(uv, @R@, t);
  // it breathes in and out slowly, so there is always more of the sheet to move into
  vec2 q = uv * (1.0 + 0.25 * sin(t * 0.07));
  float d = dith();
  float off = 0.008 + 0.012 * uSFlux + 0.018 * uBeat + 0.008 * uVol;
  float hA, hB, hC;
  float lA = sheet(q + vec2(-off, 0.0), t, hA);
  float lB = sheet(q, t, hB);
  float lC = sheet(q + vec2(off, off * 0.6), t, hC);
  float haze = smoothstep(0.1, 0.9, fbm(uv * 1.2 + vec2(0.0, t * 0.03) + 9.0)) * (0.35 + 0.4 * uArc);
  float ramp = clamp(haze + 0.4 * (uv.y + 0.5) + 0.3 * hB * (0.4 + uVol), 0.0, 1.0) * 2.0;
  // no clock here: the colour only moves when the music does (pitch, brightness and the song's build)
  float shift = uPitch * 3.0 + uBuild * 2.0 + uBright * 2.0;
  // night ground: uv violet, deep blue, a sunset glow low on the page, stepped by the dither
  vec3 g0 = vec3(0.01, 0.02, 0.14);
  vec3 g1 = vec3(0.02, 0.1, 0.55);
  vec3 g2 = mix(cg(shift + 1.0), vec3(0.0, 0.3, 0.8), 0.55);
  // smooth: a soft gradient ground, clean antialiased neon lines and a glow, no dither at all
  vec3 col = mix(mix(g0, g1, smoothstep(0.0, 1.0, ramp)), g2, smoothstep(1.0, 2.0, ramp));
  float pw = 0.8 + 0.3 * uArc;
  // two misprinted fringes, one icy and one a single hot magenta, and the main line walks the cyan-mint-ice family
  col = mix(col, cg(shift + 3.0), lA * pw);
  col = mix(col, vec3(1.0, 0.1, 0.6), lC * pw);
  col = mix(col, cg(shift + 1.0 + floor((uv.y + 1.0) * 1.5)), lB * pw);
  col += cg(shift + 1.0) * hB * 0.22 * (0.5 + uVol + 0.5 * uArc) * (1.0 - lB);
  col = 1.0 - exp(-col * 1.35);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`,

  // the contour lines of a landscape that is never still, in blue ink on white paper, falling into it for ever
  contours: `
float landscape(vec2 uv, float t, out float heavy, out float fw, out float lev) {
  vec2 p = uv * 1.5 + vec2(t * 0.03, -t * 0.02);
  p += 0.3 * vec2(sin(p.y * 1.4 + t * 0.19), cos(p.x * 1.2 - t * 0.16)); // the ground is stirred round, slowly
  vec2 w = vec2(noise(p * 0.7 + vec2(t * 0.05, 1.3)), noise(p * 0.7 + vec2(7.1, t * 0.04)));
  float amp = 1.2 + 0.9 * uSVocal + 0.4 * uSFlux;
  vec2 pw = p + amp * (w - 0.5);
  float H = (noise(pw * 0.9) * 0.62 + noise(pw * 1.9 + 5.3) * 0.28 + noise(pw * 3.7 + 1.9) * 0.1) * (1.0 + 0.4 * uSBass);
  float levels = 14.0 + 16.0 * uArc;
  float s = H * levels;
  lev = H;
#ifdef GL_OES_standard_derivatives
  fw = max(fwidth(s), 0.0001);
#else
  fw = 0.08;
#endif
  float f = fract(s);
  float dd = min(f, 1.0 - f);
  float idx = mod(floor(s + 0.5), 5.0);
  heavy = 1.0 - step(0.5, idx);
  float k = fw * (0.7 + 0.5 * uVol + 0.9 * heavy);
  return 1.0 - smoothstep(k, k + fw, dd);
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  uv *= 1.0 - 0.04 * uBeat - 0.04 * uVol - 0.08 * uBuild;
  uv += (0.12 + 0.1 * uChaos) * vec2(sin(t * 0.13), cos(t * 0.11));
  uv = rot(t * 0.03 + uSpin) * uv;
  uv = kal(uv, @C@, t);
  float hv, fw, lev, hv2, fw2, lev2;
  vec2 q = uv * (1.0 + 0.25 * sin(t * 0.07));
  float off = 0.012 + 0.012 * uSFlux + 0.016 * uBeat;
  float line = landscape(q, t, hv, fw, lev);
  float ghost = landscape(q + vec2(off, -off), t, hv2, fw2, lev2);
  float ghost2 = landscape(q - vec2(off * 0.8, off * 0.4), t, hv2, fw2, lev2);
  float d = dith();
  float shift = t * 0.04 + uPitch * 2.5;
  // the ground is a stack of flat altitude bands in solid inks with crisp edges, like a screen print: no dither here
  float x = lev * (5.0 + 3.0 * uArc);
  float bi = floor(x);
  float fx = max(fwidth(x), 0.001);
  vec3 col = mix(sp(shift + bi - 1.0), sp(shift + bi), smoothstep(0.0, fx * 1.5, fract(x)));
  col = mix(col, sp(shift + bi + 2.0), ghost2 * 0.9 * (1.0 - line));
  col = mix(col, sp(shift + bi + 3.0), ghost * 0.9 * (1.0 - line));
  vec3 ink = vec3(0.07, 0.04, 0.16);
  col = mix(col, ink, line * (0.85 + 0.15 * hv));
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`,
};

export interface GLViz {
  /** Draw one frame of a shader picture. Returns false if the graphics card couldn't build it. */
  draw(name: ShaderViz, frame: Frame): boolean;
}

interface Built {
  prog: WebGLProgram;
  uRes: WebGLUniformLocation | null;
  uTime: WebGLUniformLocation | null;
  uBass: WebGLUniformLocation | null;
  uMid: WebGLUniformLocation | null;
  uHigh: WebGLUniformLocation | null;
  uSBass: WebGLUniformLocation | null;
  uSVocal: WebGLUniformLocation | null;
  uSFlux: WebGLUniformLocation | null;
  uArc: WebGLUniformLocation | null;
  uBuild: WebGLUniformLocation | null;
  uVol: WebGLUniformLocation | null;
  uVocal: WebGLUniformLocation | null;
  uPitch: WebGLUniformLocation | null;
  uBright: WebGLUniformLocation | null;
  uFlux: WebGLUniformLocation | null;
  uBeat: WebGLUniformLocation | null;
  uChaos: WebGLUniformLocation | null;
  uSpin: WebGLUniformLocation | null;
  uBands: WebGLUniformLocation | null;
  aPos: number;
}

/** Sets up a graphics-card canvas, or returns null if the browser can't (the player then falls back to a flat drawing). */
// which kind of kaleidoscope each of the new pictures gets: a fresh, distinct draw every visit
let KAL: Record<string, number> | null = null;
function kalFor(name: string): string {
  if (!KAL) {
    const pool = [0, 1, 2, 3];
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    KAL = { hatch: pool[0], ridges: pool[1], contours: pool[2] };
  }
  return String(KAL[name] ?? 0) + '.0';
}
export function makeGL(canvas: HTMLCanvasElement): GLViz | null {
  const gl = canvas.getContext('webgl', { antialias: false, alpha: false });
  if (!gl) return null;
  gl.getExtension('OES_standard_derivatives'); // lets the contour lines keep an even width

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const shader = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) return null;
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.warn('visualiser shader did not compile:', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  };
  const vert = shader(gl.VERTEX_SHADER, 'attribute vec2 p; void main() { gl_Position = vec4(p, 0.0, 1.0); }');
  const built = new Map<ShaderViz, Built | null>();

  const build = (name: ShaderViz): Built | null => {
    const frag = shader(gl.FRAGMENT_SHADER, HEAD + BODY[name].replace('@H@', kalFor('hatch')).replace('@R@', kalFor('ridges')).replace('@C@', kalFor('contours')));
    const prog = gl.createProgram();
    if (!vert || !frag || !prog) return null;
    gl.attachShader(prog, vert);
    gl.attachShader(prog, frag);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null;
    const u = (n: string) => gl.getUniformLocation(prog, n);
    return {
      prog,
      uRes: u('uRes'),
      uTime: u('uTime'),
      uBass: u('uBass'),
      uMid: u('uMid'),
      uHigh: u('uHigh'),
      uSBass: u('uSBass'),
      uSVocal: u('uSVocal'),
      uSFlux: u('uSFlux'),
      uArc: u('uArc'),
      uBuild: u('uBuild'),
      uVol: u('uVol'),
      uVocal: u('uVocal'),
      uPitch: u('uPitch'),
      uBright: u('uBright'),
      uFlux: u('uFlux'),
      uBeat: u('uBeat'),
      uChaos: u('uChaos'),
      uSpin: u('uSpin'),
      uBands: u('uBands[0]'),
      aPos: gl.getAttribLocation(prog, 'p'),
    };
  };

  return {
    draw(name, fr) {
      if (!built.has(name)) built.set(name, build(name));
      const b = built.get(name);
      if (!b) return false;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(b.prog);
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.enableVertexAttribArray(b.aPos);
      gl.vertexAttribPointer(b.aPos, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(b.uRes, canvas.width, canvas.height);
      gl.uniform1f(b.uTime, fr.t);
      gl.uniform1f(b.uBass, fr.bass);
      gl.uniform1f(b.uMid, fr.mid);
      gl.uniform1f(b.uHigh, fr.high);
      gl.uniform1f(b.uSBass, fr.sBass);
      gl.uniform1f(b.uSVocal, fr.sVocal);
      gl.uniform1f(b.uSFlux, fr.sFlux);
      gl.uniform1f(b.uArc, fr.arc);
      gl.uniform1f(b.uBuild, fr.build);
      gl.uniform1f(b.uVol, fr.vol);
      gl.uniform1f(b.uVocal, fr.vocal);
      gl.uniform1f(b.uPitch, fr.pitch);
      gl.uniform1f(b.uBright, fr.bright);
      gl.uniform1f(b.uFlux, fr.flux);
      gl.uniform1f(b.uBeat, fr.beat);
      gl.uniform1f(b.uChaos, fr.chaos);
      gl.uniform1f(b.uSpin, fr.spin);
      gl.uniform1fv(b.uBands, fr.bands);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      return true;
    },
  };
}
