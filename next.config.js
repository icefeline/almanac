const { withSentryConfig } = require('@sentry/nextjs');

/*
 * Content Security Policy.
 *
 * Everything the app loads it serves itself: next/font downloads the five
 * faces at build time, the card art and the two videos are in public/, and
 * Sentry is tunnelled through /monitoring on this origin rather than calling
 * ingest.de.sentry.io from the browser. So 'self' covers the lot, and any
 * script pulled from somewhere else is something nobody asked for.
 *
 * Two deliberate weaknesses:
 *
 * 'unsafe-inline' in style-src is not optional here. The card page and the
 * onboarding are built almost entirely from React style props, and every one
 * of those becomes an inline style attribute. Removing it would mean moving
 * hundreds of computed styles into stylesheets.
 *
 * 'unsafe-inline' in script-src is the weaker compromise. Next inlines its
 * hydration bootstrap, and doing without means minting a nonce per request in
 * middleware and threading it through — worth doing, but it is a change to how
 * every page is served and does not belong in the same commit as a header. The
 * policy still blocks the thing that matters most, which is loading script
 * from an origin we do not control. Browsers ignore 'unsafe-inline' when a
 * nonce is present, so that upgrade is additive when it happens.
 *
 * 'unsafe-eval' is dev-only: Turbopack's HMR needs it, production does not.
 */
const isDev = process.env.NODE_ENV === 'development';

/*
 * Sentry's ingest host, read off the DSN so the two cannot drift apart.
 *
 * The plan was for `tunnelRoute` to make this unnecessary by routing reports
 * through /monitoring on our own origin. It does not take effect under
 * Turbopack — /monitoring 404s on the deployed site and never appeared in the
 * build's route list — so the browser talks to Sentry directly, and a
 * 'self'-only connect-src silently swallowed every client-side error report.
 * The SDK loaded, the events were captured, and the network call was refused:
 * error tracking that looks installed and reports nothing.
 *
 * Naming the host fixes that. The cost is the one tunnelling was for: an ad
 * blocker that recognises the ingest domain can still drop reports, so
 * client-side error volume reads as a floor rather than a true count.
 */
const sentryOrigin = (() => {
  const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
  if (!dsn) return '';
  try {
    return new URL(dsn).origin;
  } catch {
    return '';
  }
})();

/*
 * Where readers' saved data is carried over from. The tarot app used to live at slowww.garden, so what people
 * saved is stored under that address; app/components/DataMigration.tsx loads one hidden page from it. This is
 * the only other origin the app may frame.
 */
const transferOrigin = (() => {
  try {
    return new URL(process.env.NEXT_PUBLIC_TRANSFER_URL || 'https://slowww.garden/transfer').origin;
  } catch {
    return 'https://slowww.garden';
  }
})();

const csp = [
  "default-src 'self'",
  // Vercel Analytics is only same-origin (/_vercel/insights/script.js) once
  // deployed on Vercel; everywhere else the package loads its script from
  // va.vercel-scripts.com, which a 'self'-only policy blocked outright. Listed
  // explicitly so the header behaves the same in dev, on preview and in prod.
  `script-src 'self' 'unsafe-inline' https://va.vercel-scripts.com${isDev ? " 'unsafe-eval'" : ''}`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "media-src 'self'",
  // Sentry tunnels through /monitoring and Vercel's analytics beacon posts to
  // /_vercel/insights — both same-origin, so nothing external is needed.
  `connect-src 'self' https://va.vercel-scripts.com${sentryOrigin ? ' ' + sentryOrigin : ''}${isDev ? ' ws: http://localhost:*' : ''}`,
  `frame-src ${transferOrigin}`,
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  // Belt to X-Frame-Options' braces, and the one browsers actually still honour.
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');

/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          /*
           * geolocation is (self), not (). The app asks for it — "use my
           * location" resolves sunrise, sunset and moon phase, see
           * lib/utils/here.ts — and an empty allowlist denied our own origin,
           * so the browser blocked the request before the reader ever saw the
           * permission prompt. The feature could not work. (self) still denies
           * it to any embedded third party, which is what this was for.
           */
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
        ],
      },
    ];
  },
};

module.exports = withSentryConfig(nextConfig, {
  org: 'slow-garden',
  project: 'slow-garden',

  // Source maps are uploaded at build time so stack traces name real lines
  // instead of minified soup, then deleted from the bundle so they are not
  // served to the public.
  silent: !process.env.CI,
  widenClientFileUpload: true,
  sourcemaps: { deleteSourcemapsAfterUpload: true },

  // Routes Sentry's own browser requests through the app's origin, so ad
  // blockers do not silently drop error reports.
  tunnelRoute: '/monitoring',
});
