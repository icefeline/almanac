'use client';

/*
 * A progressive blur along the whole top edge of the screen, for while the page has scrolled: frosted glass that
 * the content slides up under. Blur only: no tint, no colour, nothing to see until something passes beneath it.
 *
 * One blurred layer shows where it ends. So this is twelve, each a little blurrier and a little shorter than the
 * last, every one masked by its own soft fade and overlapping the next. The blur is strongest at the top edge and
 * thins out in small steps until there is no edge left to find.
 */
const STEPS = 12;
const LAYERS = Array.from({ length: STEPS }, (_, i) => {
  const end = 100 - i * (90 / STEPS); // where this layer has faded out completely
  const start = Math.max(0, end - (100 / STEPS) * 3); // where it begins to fade; wide, so neighbours overlap
  return { blur: +(0.25 * Math.pow(1.3, i)).toFixed(2), start, end };
});

// an eased ramp (smoothstep) rather than a straight line, so a layer's own edge is soft at both ends
const fade = (start: number, end: number) => {
  const stops = Array.from({ length: 9 }, (_, k) => {
    const t = k / 8;
    const a = 1 - t * t * (3 - 2 * t);
    return `rgba(0,0,0,${a.toFixed(3)}) ${(start + (end - start) * t).toFixed(1)}%`;
  });
  return `linear-gradient(to bottom, #000 0%, ${stops.join(', ')}, transparent 100%)`;
};

export default function ScrollVeil({ show }: { show: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="absolute top-0 left-0 right-0 pointer-events-none transition-opacity duration-700"
      style={{ opacity: show ? 1 : 0, height: 'calc(var(--nav-h, 3.5rem) + 5rem)' }}
    >
      {LAYERS.map((l) => (
        <div
          key={l.blur}
          className="absolute inset-0"
          style={{
            backdropFilter: `blur(${l.blur}px)`,
            WebkitBackdropFilter: `blur(${l.blur}px)`,
            maskImage: fade(l.start, l.end),
            WebkitMaskImage: fade(l.start, l.end),
          }}
        />
      ))}
    </div>
  );
}
