'use client';

/**
 * Translucent vellum, laid over the sky.
 *
 * A fixed full-screen sheet between the sky (and its garden) and the reading, so
 * the words are ink on paper while the dithered garden stays faintly there
 * underneath — frosted by the blur, tinted by the hour (SkyBackground publishes
 * --sky-tint). Fades in as the card opens: slowly, like everything else here.
 *
 * Inert. The reading page's own text is positioned above it.
 */

// paper fibre: a low-frequency noise tile, so the sheet has some tooth to it
const FIBRE =
  "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='240' height='240'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='.9 .35' numOctaves='3' seed='4'/><feColorMatrix values='0 0 0 0 .1  0 0 0 0 .14  0 0 0 0 .08  0 0 0 .55 0'/></filter><rect width='100%' height='100%' filter='url(%23n)' opacity='.5'/></svg>\")";

export default function Vellum({ on }: { on: boolean }) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        opacity: on ? 1 : 0,
        transition: 'opacity 1200ms ease',
        WebkitBackdropFilter: 'blur(2px) saturate(1.1)',
        backdropFilter: 'blur(2px) saturate(1.1)',
        backgroundColor:
          'color-mix(in srgb, color-mix(in srgb, var(--sky-tint, #dfe3ea) 16%, var(--vellum-base, #F4F0E4)) 54%, transparent)',
        backgroundImage: [
          // light pooling from the top, and the sheet thinning toward its edges
          'radial-gradient(ellipse 90% 60% at 50% 0%, rgba(255,255,255,.35) 0%, transparent 70%)',
          'radial-gradient(ellipse 120% 100% at 50% 50%, transparent 55%, rgba(60,70,50,.10) 100%)',
          FIBRE,
          'radial-gradient(circle at 50% 50%, rgba(27,38,22,.06) 0 .6px, transparent .7px)',
        ].join(','),
        backgroundSize: '100% 100%, 100% 100%, 240px 240px, 3px 3px',
      }}
    />
  );
}
