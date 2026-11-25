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

export type ShaderViz = 'kaleidoscope' | 'fractal' | 'tunnel' | 'flow';
export const SHADER_VIZ: ShaderViz[] = ['kaleidoscope', 'fractal', 'tunnel', 'flow'];
export const isShader = (v: string): v is ShaderViz => (SHADER_VIZ as string[]).includes(v);

/** What the music is doing, one frame at a time. */
export interface Frame {
  /** The picture's own clock: it runs faster when the music is fast and busy. */
  t: number;
  bass: number;
  mid: number;
  high: number;
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
// gentle tone mapping, so loud passages brighten without burning out to white
vec3 soft(vec3 c) { return 1.0 - exp(-c * 1.25); }
`;

const BODY: Record<ShaderViz, string> = {
  // three layers of warped, drifting colour, each folded into a different mirror, zooming forever
  kaleidoscope: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  uv *= 1.0 - 0.05 * uBeat - 0.05 * uVol;
  uv += (0.14 + 0.12 * uChaos) * vec2(sin(t * 0.13), cos(t * 0.11));
  uv = rot(t * 0.05 + uSpin) * uv;
  // the voice opens the folds out, a brighter sound draws finer detail, and the sound's pitch turns the colours
  float warp = 2.4 * (1.0 + 1.7 * uChaos + 0.9 * uVocal + 0.5 * uFlux);
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
  col *= 0.7 + 0.35 * uBass + 0.4 * uVol;
  gl_FragColor = vec4(soft(col), 1.0);
}`,

  // a fractal world of folded space (a Kali set), mirrored, with its orbit traps lit up as colour
  fractal: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  uv *= 1.0 - 0.04 * uBeat;
  uv += 0.1 * vec2(cos(t * 0.09), sin(t * 0.12));
  uv = rot(t * 0.04 + uSpin * 0.7) * uv * (1.3 + 0.45 * sin(t * 0.07) - 0.3 * uVol);
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
  col *= 0.65 + 0.4 * uBass + 0.4 * uVol;
  gl_FragColor = vec4(soft(col), 1.0);
}`,

  // falling down a mirrored tunnel of spokes and rings, towards a light that flares with the bass
  tunnel: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  uv *= 1.0 - 0.04 * uBeat - 0.03 * uVol;
  uv += 0.08 * vec2(sin(t * 0.17), cos(t * 0.13));
  uv = rot(sin(t * 0.2) * 0.5 + uSpin * 0.6) * uv;
  vec2 f = kfold(uv, 12.0);
  float r = length(f) + 0.0001;
  float a = atan(f.y, f.x);
  float z = 0.35 / r + t * 0.7 + uBass * 1.2 + uVol * 0.6;
  float spokes = 0.5 + 0.5 * sin(a * (24.0 + 18.0 * uChaos + 10.0 * uVocal) + z * 0.9 + t * 0.4 + uMid * 3.0);
  float rings = 0.5 + 0.5 * sin(z * (5.5 + 3.0 * uChaos + 2.0 * uBright));
  float v = smoothstep(0.3, 0.95, spokes * rings);
  vec3 col = pal(z * 0.1 + a * 1.2 + uHigh * 0.4 + uSpin * 0.05 + (uPitch - 0.5) * 0.7) * (0.15 + 1.4 * v);
  col += pal(z * 0.05 + 0.5) * 0.05 / (r + 0.05) * (0.3 + uBass * 1.0 + uBeat * 0.3 + uVol * 0.5 + uFlux * 0.4);
  col *= smoothstep(0.0, 0.14, r);
  gl_FragColor = vec4(soft(col), 1.0);
}`,

  // slow liquid colour, mirrored, folded over itself and pushed about by the bass
  flow: `
void main() {
  vec2 uv = (gl_FragCoord.xy - 0.5 * uRes) / uRes.y;
  float t = uTime;
  vec2 p = kfold(rot(t * 0.04 + uSpin * 0.6) * uv * (3.8 - 0.5 * uVol) * (1.0 - 0.04 * uBeat), 6.0);
  float amp = 0.7 * (1.0 + 1.6 * uChaos + 0.8 * uVocal + 0.4 * uFlux);
  for (int i = 0; i < 5; i++) {
    float fi = float(i);
    p += amp * vec2(sin(p.y * 1.7 + t * 0.4 + fi + uBass * 2.2), cos(p.x * 1.3 - t * 0.3 + fi * 1.7));
    p = rot(0.3) * p;
  }
  float f = sin(p.x * 2.6) + sin(p.y * 2.6) + sin((p.x + p.y) * 1.8) + sin(length(p) * 3.0 - t * 0.8);
  float v = 0.5 + 0.2 * f;
  vec3 col = pal(f * 0.2 + t * 0.04 + uMid * 0.5 + uSpin * 0.04 + (uPitch - 0.5) * 0.7);
  col *= 0.1 + 1.0 * smoothstep(0.1, 0.9, v) + uBass * 0.2 + 0.04 * uBeat + 0.35 * uVol;
  col += pal(f * 0.3 + 0.5) * pow(uHigh, 1.5) * (0.2 + 0.4 * uBright);
  gl_FragColor = vec4(soft(col), 1.0);
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
