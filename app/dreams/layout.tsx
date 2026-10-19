import type { Metadata, Viewport } from 'next';
import { Geist, Doto, Schoolbell } from 'next/font/google';
import './dreams.css';

/*
 * This route runs its own three faces (Geist, Doto, Schoolbell) rather than
 * the ones the rest of slow-garden loads at the root — the dream interpreter
 * was built to its own spec, same as the card reading page has its own
 * READING token set. The variables are scoped to .dreams-page below, not to
 * <body>, so they never leak into the rest of the site and the rest of the
 * site's faces never leak in here.
 */
const geist = Geist({ subsets: ['latin'], weight: ['300', '400', '600', '700'], variable: '--font-geist' });
const doto = Doto({ subsets: ['latin'], weight: ['700', '900'], variable: '--font-doto' });
const schoolbell = Schoolbell({ subsets: ['latin'], weight: '400', variable: '--font-schoolbell' });

export const metadata: Metadata = {
  title: 'dream interpreter — slow garden',
  description: 'a plain-spoken reading for last night, and what to do about it this week.',
  // the interpreter has its own icon, so installing it or pinning a tab doesn't
  // show the garden's. nested metadata replaces the root's `icons` and `manifest`.
  manifest: '/dreams/manifest.webmanifest',
  icons: {
    icon: [
      { url: '/dreams/icons/favicon-32.png', sizes: '32x32', type: 'image/png' },
      { url: '/dreams/icons/favicon-16.png', sizes: '16x16', type: 'image/png' },
    ],
    apple: [{ url: '/dreams/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'dreams',
  },
};

export const viewport: Viewport = {
  themeColor: '#1438C4',
};

export default function DreamsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`dreams-page ${geist.variable} ${doto.variable} ${schoolbell.variable}`}>
      {children}
    </div>
  );
}
