'use client';

import { useState, type CSSProperties } from 'react';

/*
 * The "about" link that sits at the bottom left of every page in the slow garden: tap it and a short list opens
 * (why i made this, faqs, terms); tap an entry and its text opens above the list, one at a time.
 *
 * The same component, with the same words, is in each app's repo (slow-garden, almanac, sticker-tracker). The words
 * live in ABOUT below; change them in all three together.
 */

type Tab = 'why' | 'faq' | 'terms';

export const ABOUT = {
  why: {
    label: 'why i made this',
    paragraphs: [
      'i wanted a few small places to slow down in. somewhere to notice a card in the morning, somewhere to put a dream down before it slips away, somewhere to keep track of the little things, like sleep and food, without it turning into a score.',
      'each one is its own little world, and they live together here, like charms on a bracelet.',
      "i made them slowly, over a lot of evenings, for myself first. you're welcome to keep yours here too.",
    ],
  },
  faq: {
    label: 'faqs',
    items: [
      { q: 'is it free?', a: 'yes, all three apps.' },
      { q: 'who sees what i write?', a: "only you. i don't sell or share anything." },
      { q: 'is the tarot real?', a: "it's real cards. what they mean is up to you." },
    ],
  },
  terms: {
    label: 'terms',
    paragraphs: [
      "slowww.garden is for reflection, not advice. almanac, milky and root aren't a substitute for a doctor, therapist or anyone who knows you.",
      'what you write stays yours. you can delete it whenever you like.',
      "be kind here. that's most of it.",
    ],
    links: [
      { key: 'terms', label: 'terms of service →' },
      { key: 'privacy', label: 'privacy policy →' },
    ],
  },
} as const;

/** The four apps, for the little switcher above the about link. Icons are copies kept in each app's public/about-apps. */
export const APPS = [
  { key: 'enter', label: 'back to the bracelet', href: 'https://enter.slowww.garden', icon: '/about-apps/enter.png', pose: { r: -12, x: 2, y: 0 } },
  { key: 'almanac', label: 'almanac', href: 'https://slowww.garden', icon: '/about-apps/almanac.png', pose: { r: 11, x: 18, y: -6 } },
  { key: 'milky', label: 'milky', href: 'https://milky.slowww.garden', icon: '/about-apps/milky.png', pose: { r: -7, x: 6, y: -2 } },
  { key: 'root', label: 'root', href: 'https://root.slowww.garden', icon: '/about-apps/root.png', pose: { r: 17, x: 20, y: -4 } },
] as const;
export type AppKey = (typeof APPS)[number]['key'];

export interface AboutMenuProps {
  /** Which app this is; it's left out of the switcher. The front door passes showApps={false} instead. */
  current?: AppKey;
  /** The switcher is for the app pages; the front door turns it off. */
  showApps?: boolean;
  /** Where the app switcher sits: top left, by default in line with the about link. */
  appsTop?: number | string;
  appsLeft?: number | string;
  /** Text colour. */
  color?: string;
  /** Distance from the left / bottom edge of the screen. */
  left?: number | string;
  bottom?: number | string;
  /** Font size; the default scales with the screen. */
  fontSize?: number | string;
  fontFamily?: string;
  textShadow?: string;
  zIndex?: number;
  className?: string;
  /** Where the full Terms of Service and Privacy Policy pages live. */
  termsHref?: string;
  privacyHref?: string;
  /** Extra links listed under the three tabs, opened in a new tab (a coffee link, a sibling site). */
  links?: { label: string; href: string }[];
  /** A solid ground behind the menu while it is open, on phones only: the type needs it over a busy page, and on wide screens it sits clear. */
  panelBackground?: string;
}

export default function AboutMenu({
  color = '#fff',
  left = 28,
  bottom = 22,
  fontSize = 'clamp(10px, 2.7vw, 13px)',
  fontFamily = "var(--font-dm-mono, 'DM Mono'), 'DM Mono', ui-monospace, monospace",
  textShadow = '0 1px 6px rgba(0,20,28,.55)',
  zIndex = 40,
  className,
  termsHref = 'https://slowww.garden/terms',
  privacyHref = 'https://slowww.garden/privacy',
  links,
  current,
  showApps = true,
  appsTop = 16,
  appsLeft,
  panelBackground,
}: AboutMenuProps) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<Tab | null>(null);

  const root: CSSProperties = {
    position: 'fixed',
    left,
    bottom: typeof bottom === 'number' ? `calc(env(safe-area-inset-bottom, 0px) + ${bottom}px)` : bottom,
    zIndex,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 10,
    fontFamily,
    fontSize,
    lineHeight: 1.55,
    letterSpacing: '.04em',
    textTransform: 'uppercase',
    color,
    textShadow,
    maxWidth: 'calc(100vw - 32px)',
    ...(open && panelBackground ? ({ '--sg-about-bg': panelBackground } as CSSProperties) : null),
  };
  const panel: CSSProperties = { width: '27.5em', maxWidth: '100%', display: 'flex', flexDirection: 'column', gap: 6, textWrap: 'pretty' };
  const heading: CSSProperties = { letterSpacing: '.12em' };

  const pick = (t: Tab) => setTab((cur) => (cur === t ? null : t));
  const dim = (t: Tab) => (!tab || tab === t ? 1 : 0.55);

  return (
    <>
    <div className={[className, open && panelBackground ? 'sg-about-open' : ''].filter(Boolean).join(' ') || undefined} style={root}>
      <style>{`@media (max-width:767px){.sg-about-open{background:var(--sg-about-bg);padding:12px 14px;border:1px solid rgba(128,128,128,.35);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px);text-shadow:none!important}}.sg-about-link{background:none;border:0;padding:0;margin:0;font:inherit;letter-spacing:inherit;text-transform:inherit;color:inherit;text-shadow:inherit;text-align:left;cursor:pointer}.sg-about-app{display:block;height:26px;width:auto;margin-bottom:-5px;transform:translate(var(--x),var(--y)) rotate(var(--r));transition:filter .3s;animation:sg-drift 3.4s ease-in-out infinite;animation-play-state:paused;animation-delay:var(--d)}.sg-about-app:hover,.sg-about-app:focus-visible{animation-play-state:running;filter:brightness(1.15)}@keyframes sg-drift{0%,100%{transform:translate(var(--x),var(--y)) rotate(var(--r))}22%{transform:translate(calc(var(--x) + 4px),calc(var(--y) - 5px)) rotate(calc(var(--r) + 9deg))}50%{transform:translate(calc(var(--x) - 3px),calc(var(--y) + 2px)) rotate(calc(var(--r) - 8deg))}78%{transform:translate(calc(var(--x) + 2px),calc(var(--y) - 3px)) rotate(calc(var(--r) + 5deg))}}@media (prefers-reduced-motion:reduce){.sg-about-app{animation:none}}.sg-about-app img{height:100%;width:auto;display:block;filter:drop-shadow(0 1px 3px rgba(0,0,0,.45))}.sg-about-link:hover,.sg-about-link:focus-visible{text-decoration:underline;text-underline-offset:3px}`}</style>

      {open && tab === 'why' && (
        <div style={panel}>
          <div style={heading}>{ABOUT.why.label}</div>
          {ABOUT.why.paragraphs.map((p) => (
            <div key={p}>{p}</div>
          ))}
        </div>
      )}

      {open && tab === 'faq' && (
        <div style={{ ...panel, gap: 8 }}>
          <div style={heading}>{ABOUT.faq.label}</div>
          {ABOUT.faq.items.map((it) => (
            <div key={it.q} style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              <div style={heading}>{it.q}</div>
              <div>{it.a}</div>
            </div>
          ))}
        </div>
      )}

      {open && tab === 'terms' && (
        <div style={panel}>
          <div style={heading}>{ABOUT.terms.label}</div>
          {ABOUT.terms.paragraphs.map((p) => (
            <div key={p}>{p}</div>
          ))}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {ABOUT.terms.links.map((l) => (
              <a
                key={l.key}
                href={l.key === 'terms' ? termsHref : privacyHref}
                className="sg-about-link"
                style={{ ...heading, textDecoration: 'underline', textUnderlineOffset: 3 }}
              >
                {l.label}
              </a>
            ))}
          </div>
        </div>
      )}

      {open && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, letterSpacing: '.12em' }}>
          {(['why', 'faq', 'terms'] as const).map((t) => (
            <button key={t} type="button" className="sg-about-link" onClick={() => pick(t)} aria-expanded={tab === t} style={{ opacity: dim(t) }}>
              {ABOUT[t].label}
            </button>
          ))}
          {[{ label: 'buy me a coffee', href: 'https://buymeacoffee.com/shxntxnx' }, ...(links ?? [])].map((l) => (
            <a key={l.href} href={l.href} target="_blank" rel="noopener noreferrer" className="sg-about-link" style={{ textDecoration: 'none' }}>
              {l.label} ↗
            </a>
          ))}
        </div>
      )}


      <button
        type="button"
        className="sg-about-link"
        onClick={() => {
          setOpen((o) => !o);
          setTab(null);
        }}
        aria-expanded={open}
        style={{ display: 'flex', gap: 6, letterSpacing: '.12em' }}
      >
        <span>about</span>
        <span aria-hidden="true">{open ? '−' : '+'}</span>
      </button>
    </div>
      {showApps && (
        <nav aria-label="the other slow garden apps" style={{ position: 'fixed', left: appsLeft ?? left, top: typeof appsTop === 'number' ? `calc(env(safe-area-inset-top, 0px) + ${appsTop}px)` : appsTop, zIndex, display: 'flex', flexDirection: 'column', gap: 0 }}>
        {APPS.filter((a) => a.key !== current).map((a) => (
          <a key={a.key} href={a.href} title={a.label} aria-label={a.label} className="sg-about-app" style={{ '--r': `${a.pose.r}deg`, '--x': `${a.pose.x}px`, '--y': `${a.pose.y}px`, '--d': `${(a.pose.x % 5) * -0.7}s` } as CSSProperties}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={a.icon} alt="" height={26} />
          </a>
        ))}
      </nav>
      )}
    </>
  );
}
