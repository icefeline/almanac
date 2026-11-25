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

export type ShaderViz = 'kaleidoscope' | 'fractal' | 'tunnel' | 'flow' | 'bubbles' | 'ridges' | 'contours';
export const SHADER_VIZ: ShaderViz[] = ['kaleidoscope', 'fractal', 'tunnel', 'flow', 'bubbles', 'ridges', 'contours'];
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
float dith() { return bayer8(floor(gl_FragCoord.xy / max(1.0, floor(uRes.y / 170.0)))); }
vec3 quant(vec3 c, float n, float d) { return floor(c * n + d) / n; }
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
  bubbles: `
float cells(vec2 q, float t, float px, out float ring) {
  vec3 B[6];
  B[0] = vec3(0.0, 0.0, 0.2);
  B[1] = vec3(0.0, 0.5, 0.19);
  B[2] = vec3(0.5, 0.0, 0.18);
  B[3] = vec3(0.34, 0.34, 0.15);
  B[4] = vec3(0.72, 0.3, 0.12);
  B[5] = vec3(0.3, 0.72, 0.12);
  float F = 0.0;
  ring = 0.0;
  for (int i = 0; i < 6; i++) {
    float fi = float(i);
    // each centre wanders on slow, smooth noise rather than going round in a circle
    vec2 c = B[i].xy + 0.16 * (vec2(noise(vec2(fi * 3.1, t * 0.16)), noise(vec2(fi * 5.3 + 9.0, t * 0.14))) - 0.5);
    c += 0.12 * uSVocal * vec2(noise(c * 3.0 + t * 0.3) - 0.5, noise(c * 3.0 - t * 0.25) - 0.5);
    float r = B[i].z * (1.0 + 0.25 * uSBass + 0.1 * uVol + 0.1 * uArc + 0.06 * sin(t * 0.4 + fi));
    vec2 d = q - c;
    F += r * r / (dot(d, d) + 0.0006);
    ring = max(ring, smoothstep(px * 3.2, px * 0.7, abs(length(d) - r * 1.12)));
  }
  return F;
}
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  uv *= 1.0 - 0.05 * uBeat - 0.05 * uVol - 0.1 * uBuild;
  uv += (0.12 + 0.1 * uChaos) * vec2(sin(t * 0.13), cos(t * 0.11));
  uv = rot(t * 0.04 + uSpin) * uv;
  float e = 1.0;
  float line = 0.0;
  float glow = 0.0;
  for (int k = 0; k < 2; k++) {
    float fk = float(k);
    float ph = fract(t * 0.035 + fk * 0.5);
    float zoom = exp2(ph) * 1.7;
    float fade = sin(ph * 3.14159);
    vec2 q = abs(uv * zoom);
    float ring;
    float F = cells(q, t + fk * 7.0, zoom * 1.7 / uRes.y, ring);
    float ee = abs(F - 1.0);
    line = max(line, max(smoothstep(0.1, 0.03, ee), ring * 0.7) * fade);
    glow = max(glow, exp(-ee * 4.0) * fade);
  }
  // the halftone: dots that grow where the drawing is dense, with rays from the middle
  float d = dith();
  float off = 0.006 + 0.012 * uSFlux + 0.01 * uBeat;
  float freq = 40.0 + 12.0 * uBright;
  float tone = clamp(fbm(uv * 2.0 + vec2(t * 0.05, t * 0.03)) * 1.5 - 0.1 + 0.2 * uSFlux, 0.0, 1.0);
  // two screens of dots printed slightly out of register, one red, one hot pink, drifting in and out of each other
  vec2 gA = fract(rot(0.6) * (uv + vec2(off, 0.0)) * freq) - 0.5;
  vec2 gB = fract(rot(0.95) * (uv - vec2(0.0, off)) * freq * 0.8) - 0.5;
  float dotsA = smoothstep(0.5 * tone + 0.06, 0.5 * tone - 0.04, length(gA));
  float dotsB = smoothstep(0.42 * tone + 0.05, 0.42 * tone - 0.04, length(gB));
  float ang = atan(uv.y, uv.x);
  float rays = 0.5 + 0.5 * sin(ang * 14.0 + t * 0.15 + 6.0 * length(uv));
  vec3 orange = vec3(1.0, 0.62, 0.3);
  vec3 red = vec3(0.95, 0.2, 0.1);
  vec3 pink = vec3(1.0, 0.25, 0.6);
  // the ground between the dots is a dithered ramp from orange toward gold, so it stipples instead of banding
  float ramp = clamp(0.5 + 0.8 * (fbm(uv * 1.4 - t * 0.02) - 0.5) + 0.25 * rays, 0.0, 1.0);
  vec3 col = mix(orange, vec3(1.0, 0.85, 0.35), step(d, ramp * 0.7));
  col = mix(col, red, dotsA * (0.55 + 0.45 * rays));
  col = mix(col, pink, dotsB * 0.7 * (1.0 - dotsA));
  vec3 ink = mix(vec3(0.1, 0.18, 1.0), vec3(0.45, 0.14, 1.0), uPitch);
  vec3 ink2 = mix(vec3(0.0, 0.85, 1.0), vec3(1.0, 0.2, 0.85), uPitch);
  float power = 0.65 + 0.5 * uArc + 0.2 * uVol;
  col = mix(col, ink, clamp(line * power, 0.0, 1.0));
  // the glow around every outline is stippled, in a second colour, rather than smooth
  float halo = step(d, glow * 0.8 * power) * (1.0 - clamp(line, 0.0, 1.0));
  col = mix(col, ink2, halo * 0.85);
  col = quant(clamp(col, 0.0, 1.0), 5.0, d * 0.7 + 0.15);
  gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
}`,

  // lines of light stacked and folded over each other like a sheet of paper in the wind, on blue, falling inward for ever
  ridges: `
float sheet(vec2 uv, float t, out float halo) {
  vec2 p = uv * vec2(0.8, 0.7) + vec2(t * 0.03, 0.0);
  // the space itself is stirred round, slowly, so the folds roll and curl rather than slide
  p += 0.28 * vec2(sin(p.y * 1.7 + t * 0.21), cos(p.x * 1.3 - t * 0.17));
  float h = noise(p * 1.1 + vec2(0.0, t * 0.04)) * 0.7 + noise(p * 2.3 + 4.1 - vec2(t * 0.03, 0.0)) * 0.3;
  float ridge = abs(noise(p * 0.8 + 3.7 + vec2(t * 0.025, 0.0)) - 0.5) * 2.0;
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
  // it breathes in and out slowly, so there is always more of the sheet to move into
  vec2 q = uv * (1.0 + 0.25 * sin(t * 0.07));
  float d = dith();
  // three passes, nudged apart, so the lines split into cyan, lime and pink fringes like a misaligned print
  float off = 0.004 + 0.008 * uSFlux + 0.012 * uBeat + 0.006 * uVol;
  float hA, hB, hC;
  float lA = sheet(q + vec2(-off, 0.0), t, hA);
  float lB = sheet(q, t, hB);
  float lC = sheet(q + vec2(off, off * 0.5), t, hC);
  // a haze of light low on the page, stippled into three steps of blue by the dither
  float haze = smoothstep(0.1, 0.9, fbm(uv * 1.2 + vec2(0.0, t * 0.03) + 9.0)) * (0.35 + 0.4 * uArc);
  float ramp = clamp(haze + 0.35 * (uv.y + 0.5) + 0.25 * hB * (0.4 + uVol), 0.0, 1.0) * 2.0;
  vec3 deep = vec3(0.08, 0.14, 0.62);
  vec3 blue = vec3(0.16, 0.27, 0.84);
  vec3 sky = vec3(0.3, 0.62, 0.78);
  vec3 col = ramp < 1.0 ? mix(deep, blue, step(d, ramp)) : mix(blue, sky, step(d, ramp - 1.0));
  vec3 cyan = vec3(0.3, 1.0, 0.85);
  vec3 green = vec3(0.74, 1.0, 0.1);
  vec3 gold = vec3(1.0, 0.95, 0.2);
  vec3 pink = vec3(1.0, 0.35, 0.8);
  vec3 ink = mix(mix(cyan, green, smoothstep(0.0, 0.5, uPitch)), gold, smoothstep(0.5, 1.0, uPitch));
  float pw = 0.7 + 0.3 * uArc;
  col = mix(col, cyan, lA * 0.8 * pw);
  col = mix(col, pink, lC * 0.8 * pw);
  col = mix(col, ink, lB * pw);
  // stippled halo round the lines, so every fold glows in chunky dithered pixels
  col = mix(col, ink, step(d, hB * 0.55 * (0.5 + uVol + 0.5 * uArc)) * (1.0 - lB) * 0.6);
  col = quant(clamp(col, 0.0, 1.0), 6.0, d * 0.6 + 0.2);
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
  float hv, fw, lev, hv2, fw2, lev2;
  vec2 q = uv * (1.0 + 0.25 * sin(t * 0.07));
  float off = 0.014 + 0.01 * uSFlux + 0.014 * uBeat;
  float line = landscape(q, t, hv, fw, lev);
  float ghost = landscape(q + vec2(off, -off), t, hv2, fw2, lev2);
  float d = dith();
  vec3 paper = vec3(0.985, 0.985, 0.99);
  vec3 ink = mix(vec3(0.1, 0.1, 1.0), vec3(0.4, 0.12, 0.95), uPitch);
  vec3 navy = vec3(0.07, 0.07, 0.4);
  vec3 hot = mix(vec3(1.0, 0.25, 0.7), vec3(1.0, 0.6, 0.15), uPitch);
  // the ground is shaded by altitude in stippled dither, so the hills read as ink wash in chunky pixels
  float wash = smoothstep(0.22, 0.7, lev) * (1.0 + 0.4 * uArc) + 0.15 * sin(lev * 40.0 + t * 0.3) * uVol;
  vec3 col = paper;
  col = mix(col, vec3(0.62, 0.7, 1.0), step(d, clamp(wash * 0.9, 0.0, 1.0)));
  col = mix(col, vec3(0.45, 0.5, 1.0), step(d, clamp(wash * 0.8 - 0.55, 0.0, 1.0)));
  // a second printing, off to one side in hot pink, so the lines double
  col = mix(col, hot, ghost * 0.9 * (1.0 - line));
  col = mix(col, mix(ink, navy, hv * 0.8), line);
  col = quant(clamp(col, 0.0, 1.0), 6.0, d * 0.5 + 0.25);
  gl_FragColor = vec4(col, 1.0);
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
    const frag = shader(gl.FRAGMENT_SHADER, HEAD + BODY[name]);
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
