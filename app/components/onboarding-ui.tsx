'use client';

import React from 'react';

/**
 * Shared chrome for the onboarding screens.
 *
 * The design is drawn on a 356 × 748 canvas. Neither surface is that size —
 * mobile is the viewport, desktop is a 647 × 909 panel — so every dimension is
 * expressed as design-pixels multiplied by a scale factor. Write the design
 * once, render it at whatever size the surface actually is.
 *
 * `light` is the desktop panel (cobalt on the pale ground); `dark` is mobile,
 * full bleed over the leaf video (lime on foliage, hence the text shadows).
 */
export type Tone = 'dark' | 'light';

export const LIME = '#C9F24E';
export const COBALT = '#2B35D6';
export const INK = '#172211';
export const BONE = '#EEF4E0';

const MONO = 'var(--font-dm-mono), ui-monospace, monospace';
const PIXEL = 'var(--font-vt323), monospace';

/** Titles and accents: cobalt on the pale panel, lime over video. */
export const accentOf = (tone: Tone) => (tone === 'light' ? COBALT : LIME);
/** Body copy. */
export const bodyOf = (tone: Tone) => (tone === 'light' ? INK : BONE);
/** Only type over moving foliage needs the shadow. */
const shadow = (tone: Tone) => (tone === 'dark' ? '0 2px 18px rgba(0,0,0,.5)' : undefined);

/** design px → rendered px */
const px = (n: number, s: number) => `${n * s}px`;

/** A chunky pixel arrow pointing left, drawn square by square so it stays sharp at any size. */
const ARROW = ['...#....', '..##....', '.#######', '########', '.#######', '..##....', '...#....'];

export function ObBack({ tone, scale, onClick }: { tone: Tone; scale: number; onClick: () => void }) {
  return (
    <button
      className="sg-retro sg-ob-back"
      onClick={onClick}
      aria-label="back"
      style={{
        position: 'absolute', left: px(24, scale), top: px(22, scale), zIndex: 10,
        display: 'inline-flex', alignItems: 'center', gap: px(8, scale),
        fontFamily: PIXEL, fontSize: px(19, scale), letterSpacing: '0.02em', lineHeight: 1,
        // classic grey button: grey face, black type, white lit edge, dark grey shaded edge
        '--face': '#C0C0C0',
        '--ink': '#000',
        '--hi': '#FFFFFF',
        '--lo': '#808080',
        '--b': px(2, scale), '--h': px(2, scale),
        padding: `${px(7, scale)} ${px(14, scale)} ${px(8, scale)}`,
        cursor: 'pointer',
      } as unknown as React.CSSProperties}
    >
      <svg
        width={px(11, scale)}
        height={px(9.6, scale)}
        viewBox="0 0 8 7"
        shapeRendering="crispEdges"
        aria-hidden="true"
        style={{ display: 'block' }}
      >
        {ARROW.flatMap((row, y) =>
          row.split('').map((c, x) => (c === '#' ? <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill="currentColor" /> : null)),
        )}
      </svg>
      <span>back</span>
    </button>
  );
}

export function ObHead({
  tone, scale, title, sub, eyebrow = '▸ ASKING', tight = false,
}: {
  tone: Tone; scale: number; title: React.ReactNode; sub?: React.ReactNode;
  eyebrow?: string; tight?: boolean;
}) {
  return (
    <div
      style={{
        position: 'absolute', left: px(24, scale), right: px(24, scale), top: px(106, scale),
        display: 'flex', flexDirection: 'column', gap: px(12, scale),
      }}
    >
      <div style={{ fontFamily: PIXEL, fontSize: px(22, scale), color: bodyOf(tone), opacity: tone === 'dark' ? 0.95 : 1 }}>
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: PIXEL,
          fontSize: px(tight ? 52 : 60, scale),
          lineHeight: tight ? 1.05 : 0.94,
          letterSpacing: tight ? '-0.01em' : undefined,
          color: accentOf(tone),
          textShadow: shadow(tone),
        }}
      >
        {title}
      </div>
      {sub && (
        <div
          style={{
            fontFamily: MONO, fontSize: px(12, scale), letterSpacing: '0.03em', fontWeight: 500,
            lineHeight: 1.8, color: bodyOf(tone), opacity: 1,
          }}
        >
          {sub}
        </div>
      )}
    </div>
  );
}

/** The block the fields sit in — same top edge on every screen. */
export function ObFields({
  scale, stack = false, top = 406, children,
}: {
  scale: number; stack?: boolean;
  /**
   * Where the field block starts, in design px. The default suits a step of
   * single-line fields; a step with taller ones starts higher so it doesn't
   * grow down into the CTA.
   */
  top?: number;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: 'absolute', left: px(24, scale), right: px(24, scale), top: px(top, scale),
        display: 'flex', flexDirection: 'column', gap: stack ? px(16, scale) : 0,
      }}
    >
      {children}
    </div>
  );
}

export function fieldStyle(tone: Tone, scale: number, on: boolean, tall = false): React.CSSProperties {
  return {
    height: px(tall ? 70 : 62, scale),
    display: 'flex', alignItems: 'center',
    justifyContent: tall ? 'flex-start' : 'space-between',
    gap: tall ? px(10, scale) : undefined,
    padding: `0 ${px(18, scale)}`,
    border: on
      ? `1px solid ${tone === 'light' ? COBALT : 'rgba(201,242,78,.6)'}`
      : `1px solid ${tone === 'light' ? 'rgba(18,50,31,.28)' : 'rgba(238,244,224,.28)'}`,
    background: on
      ? (tone === 'light' ? 'rgba(255,255,255,.45)' : 'rgba(12,24,14,.3)')
      : 'transparent',
    // squared corners are the whole look here — no radius
    borderRadius: 0,
  };
}

export function ObTag({ tone, scale, required }: { tone: Tone; scale: number; required: boolean }) {
  return (
    <span
      style={{
        fontFamily: MONO, fontSize: px(10, scale), letterSpacing: '0.08em', fontWeight: 500,
        padding: `${px(3, scale)} ${px(7, scale)}`,
        ...(required
          ? { background: accentOf(tone), color: tone === 'light' ? '#F7F4E6' : INK }
          : { opacity: 0.9, color: bodyOf(tone), boxShadow: `inset 0 0 0 1px ${bodyOf(tone)}` }),
      }}
    >
      {required ? 'REQ' : 'OPT'}
    </span>
  );
}

export function ObHint({
  tone, scale, onClick, children,
}: {
  tone: Tone; scale: number;
  /** Makes the hint actionable — used where the note is also the way out. */
  onClick?: () => void;
  children: React.ReactNode;
}) {
  const style: React.CSSProperties = {
    marginTop: px(10, scale), fontFamily: MONO, fontSize: px(10.5, scale), fontWeight: 500,
    letterSpacing: '0.03em', color: bodyOf(tone), opacity: 0.95,
    lineHeight: 1.7, textAlign: 'left',
  };

  if (!onClick) return <div style={style}>{children}</div>;

  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        ...style,
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        textDecoration: 'underline', textDecorationStyle: 'dotted', textUnderlineOffset: px(4, scale),
      }}
    >
      {children}
    </button>
  );
}

/**
 * A permission: what it is, what it buys you, and the switch.
 *
 * Its own component rather than a `fieldStyle` row because it has two lines and
 * fieldStyle is a fixed-height flex row — and because the permissions step has
 * two of these that must be identical to each other on both surfaces. The
 * description sits inside the box, so the reason is attached to the thing it
 * explains instead of drifting to a note underneath.
 */
export function ObPermission({
  tone, scale, on, onChange, label, children,
}: {
  tone: Tone; scale: number; on: boolean; onChange: (v: boolean) => void;
  label: string; children: React.ReactNode;
}) {
  return (
    <div
      style={{
        padding: `${px(16, scale)} ${px(18, scale)}`,
        border: on
          ? `1px solid ${tone === 'light' ? COBALT : 'rgba(201,242,78,.6)'}`
          : `1px solid ${tone === 'light' ? 'rgba(18,50,31,.28)' : 'rgba(238,244,224,.28)'}`,
        background: on
          ? (tone === 'light' ? 'rgba(255,255,255,.45)' : 'rgba(12,24,14,.3)')
          : 'transparent',
        borderRadius: 0,
      }}
    >
      {/* Two columns, not two rows: the copy is measured against its own
          column, so a long line wraps inside it instead of running on under the
          switch. minWidth:0 is what lets a flex child actually wrap. */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: px(14, scale) }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{
            display: 'block', fontFamily: PIXEL, fontSize: px(30, scale),
            color: bodyOf(tone), lineHeight: 1,
          }}>
            {label}
          </span>
          <div
            style={{
              // Tighter tracking than the other mono notes on purpose: this is
              // the only place onboarding sets a full sentence in caps, and at
              // .14em it wrapped to six lines on a phone and pushed the box into
              // the CTA below it.
              marginTop: px(9, scale), fontFamily: MONO, fontSize: px(10, scale), fontWeight: 500,
              letterSpacing: '0.02em', lineHeight: 1.6,
              color: bodyOf(tone), opacity: 0.92,
            }}
          >
            {children}
          </div>
        </div>
        <ObToggle tone={tone} scale={scale} on={on} onChange={onChange} label={label.toLowerCase()} />
      </div>
    </div>
  );
}

/** Chunky square toggle — deliberately not a pill, to match the field corners. */
export function ObToggle({
  tone, scale, on, onChange, label,
}: { tone: Tone; scale: number; on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => onChange(!on)}
      style={{
        width: px(76, scale), height: px(34, scale),
        background: on ? LIME : 'transparent',
        border: on
          ? (tone === 'light' ? `1px solid ${INK}` : 'none')
          : `1px solid ${tone === 'light' ? 'rgba(18,50,31,.4)' : 'rgba(238,244,224,.4)'}`,
        display: 'flex', alignItems: 'center',
        justifyContent: on ? 'flex-end' : 'flex-start',
        padding: px(3, scale), cursor: 'pointer', borderRadius: 0,
      }}
    >
      <span
        style={{
          width: px(28, scale), height: px(26, scale),
          background: on ? INK : (tone === 'light' ? INK : BONE),
          display: 'block',
        }}
      />
    </button>
  );
}

export function ObCta({
  scale, onClick, disabled = false, label = 'CONTINUE', tone = 'dark', inline = false, raise = 0,
}: {
  scale: number; onClick: () => void; disabled?: boolean; label?: string; tone?: Tone;
  /** Design px to lift the pinned button off the foot of the screen (the splash sits it higher). */
  raise?: number;
  /** Sits in the flow, a fixed gap under the fields, instead of being pinned to the foot of the screen. */
  inline?: boolean;
}) {
  /*
   * The CTA stays at the bottom of the step and does not chase the keyboard.
   *
   * It used to go `position: fixed` with `bottom: keyboardHeight + 12` so it
   * would sit just above the keyboard. That works where the keyboard shrinks
   * the layout viewport, and iOS Safari does not shrink it — so "336px up from
   * the bottom" was measured against a viewport that still believed it was
   * full height, and the button landed in the middle of the screen, across the
   * field the reader was typing into. Chrome on iOS is the same engine and did
   * the same thing; Brave's toolbar behaviour hid it, which is why it looked
   * right in one browser and broken in two.
   *
   * Sitting still is the fix. The fields now start under the heading, so the
   * one being typed into is visible with the keyboard up, and the button is
   * where it has always been when the keyboard closes.
   */
  return (
    <button
      className="sg-retro"
      onClick={onClick}
      disabled={disabled}
      // pointer-down beats the blur that would otherwise close the keyboard and
      // move the button out from under the finger mid-tap
      onPointerDown={(e) => { e.preventDefault(); }}
      style={{
        ...(inline
          ? { position: 'relative', marginTop: px(30, scale), width: '100%' }
          : { position: 'absolute', left: px(24, scale), right: px(24, scale), bottom: px(34 + raise, scale) }),
        height: px(62, scale),
        // lime with ink at night; cobalt with paper by day, so it holds against a bright sky.
        // The retro bevel works the light and shaded edges out from the face.
        '--face': tone === 'light' ? COBALT : LIME,
        '--ink': tone === 'light' ? '#F7F4E6' : INK,
        '--b': px(3, scale), '--h': px(3, scale),
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: `0 ${px(26, scale)}`,
        fontFamily: PIXEL, fontSize: px(28, scale),
        cursor: disabled ? 'default' : 'pointer',
        // kept in place rather than unmounted so the layout never jumps
        opacity: disabled ? 0.55 : 1,
        pointerEvents: disabled ? 'none' : 'auto',
        transition: 'opacity .2s ease',
      } as unknown as React.CSSProperties}
    >
      <span>{label}</span>
      <span>→</span>
    </button>
  );
}

/** Shared value/input typography inside a field. */
export const obValue = (scale: number, typed = false): React.CSSProperties => ({
  fontFamily: PIXEL,
  fontSize: px(typed ? 36 : 30, scale),
  background: 'transparent',
  border: 'none',
  outline: 'none',
  padding: 0,
  width: '100%',
});

export { MONO as OB_MONO, PIXEL as OB_PIXEL, px as obPx };
