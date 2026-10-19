import type { Metadata, Viewport } from "next";
import { Reenie_Beanie, VT323, Instrument_Serif, DM_Mono, DM_Sans } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  // the design system's background, matching the manifest's theme_color; /dreams overrides it
  themeColor: '#172211',
};

const reenieBeanie = Reenie_Beanie({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-reenie-beanie',
});

const vt323 = VT323({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-vt323',
});

const dmMono = DM_Mono({
  weight: ['300', '400', '500'],
  subsets: ['latin'],
  variable: '--font-dm-mono',
});

// The app's reading face: body copy everywhere, the reading page's meaning
// copy, the reflection textarea, and the privacy page. 700 carries the privacy
// page's headings and links, which would otherwise be synthesised into a smear.
const dmSans = DM_Sans({
  weight: ['400', '500', '700'],
  subsets: ['latin'],
  variable: '--font-dm-sans',
});

const instrumentSerif = Instrument_Serif({
  weight: '400',
  style: ['normal', 'italic'],
  subsets: ['latin'],
  variable: '--font-instrument-serif',
});


export const metadata: Metadata = {
  // Required for Open Graph: without it Next emits relative image paths, which
  // most link scrapers refuse to resolve, so the preview silently shows nothing.
  metadataBase: new URL("https://slowww.garden"),
  title: "slow garden",
  /**
   * Two descriptions, because they are answering different questions.
   *
   * This one is the search result. "one card. one moment. one day." was here,
   * and it is the better line — but it tells someone scanning a results page
   * nothing about what they would be clicking, and the site is losing its own
   * name to a Japanese points app and a plant nursery. This sentence was
   * already written as the OG image's alt text; it was simply in the field
   * nobody reads.
   *
   * The poetic line keeps the Open Graph and Twitter slots below, where it sits
   * beside an image that has already shown what the thing is.
   */
  description:
    "A slower way to read the day. One tarot card, once a day, drawn from 78 collaged cards and kept as a year you can look back on. No accounts — everything you write stays on your device.",
  // One page, one URL. Without this a crawler arriving on a link with a query
  // string can treat it as a separate page and split what little standing the
  // site has between them.
  alternates: { canonical: "/" },
  manifest: "/manifest.webmanifest",
  // Declared here rather than as <link>s in <head> so Next owns the tags and
  // they can't drift from the manifest. The spec sheet's 01 · original is the
  // single installed icon on every platform; maskable-512 carries the 80% safe
  // zone for Android's mask.
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-180.png", sizes: "180x180", type: "image/png" }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "slow garden",
  },
  openGraph: {
    type: "website",
    siteName: "slow garden",
    title: "slow garden",
    description: "one card. one moment. one day.",
    url: "/",
    // the image itself comes from app/opengraph-image.tsx
  },
  twitter: {
    card: "summary_large_image",
    title: "slow garden",
    description: "one card. one moment. one day.",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        {/*
          The only facts about slow garden that reach a crawler without running
          JavaScript. The app renders entirely on the client, so the served
          <body> is empty — a search engine or an answer engine has the title,
          the description, and this. It is stated once, here, rather than being
          inferred from a page that has no text in it.

          Kept to things that are true and checkable: no ratings, no invented
          counts. `isAccessibleForFree` is the honest shape of it — the app is
          free to use, with nothing paywalled and no limit behind it.
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              name: "slow garden",
              url: "https://slowww.garden",
              description:
                "A slower way to read the day. One tarot card, once a day, drawn from 78 collaged cards and kept as a year you can look back on.",
              applicationCategory: "LifestyleApplication",
              operatingSystem: "Any",
              browserRequirements: "Requires JavaScript.",
              inLanguage: "en",
              isAccessibleForFree: true,
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "USD",
              },
              privacyPolicy: "https://slowww.garden/privacy",
              featureList: [
                "One tarot card a day, seeded to your birthdate",
                "A private written reflection for each day",
                "A year view of every card drawn",
                "A perfumer's scent accord for every card",
                "Shareable story cards for a reading",
              ],
            }),
          }}
        />
      </head>
      <body className={`${reenieBeanie.variable} ${vt323.variable} ${instrumentSerif.variable} ${dmMono.variable} ${dmSans.variable} antialiased`}>
        {children}
        <Analytics />
      </body>
    </html>
  );
}
