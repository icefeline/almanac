'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import AboutMenu from './AboutMenu';

/*
 * The about link for the almanac. The pages don't share a ground: the tarot page is dark green with paper type and
 * the dream page is blue, so the colour follows the route. The privacy and terms pages are plain white documents and
 * show nothing.
 *
 * The home page mounts this itself, once it is past the loading screen and onboarding, so neither of those shows the
 * link or the other apps. `flow` is for the opened reading on a phone: the link then sits at the very foot of the
 * page and scrolls away, instead of floating over the text while you read.
 */
export default function AboutMount({ home = false, flow = false }: { home?: boolean; flow?: boolean }) {
  const pathname = usePathname() || '/';
  const [narrow, setNarrow] = useState(false);
  // milky.slowww.garden serves the dream page at '/', so the path alone can't say which app this is
  const [milkyHost, setMilkyHost] = useState(false);
  useEffect(() => setMilkyHost(window.location.hostname.startsWith('milky.')), []);
  useEffect(() => {
    const mq = window.matchMedia('(max-width:767px)');
    const on = () => setNarrow(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);

  const onLegal = pathname.startsWith('/privacy') || pathname.startsWith('/terms');
  const onDreams = pathname.startsWith('/dreams') || milkyHost;
  // the legal pages are plain documents: no menu, no charms. the home page mounts its own copy.
  if (onLegal || (pathname === '/' && !home && !milkyHost)) return null;
  return (
    <AboutMenu
      current={onDreams ? 'milky' : 'almanac'}
      position={flow && narrow ? 'absolute' : 'fixed'}
      termsHref="/terms"
      privacyHref="/privacy"
      left={16}
      bottom={14}
      color={onDreams ? '#FFFFFF' : '#F7F4E6'}
      textShadow="0 1px 6px rgba(0,0,0,.55)"
      // a solid ground while open, in the page's own colour, so the text reads over the lime card, the calendar
      // and the dream page's photo
      panelBackground={onDreams ? 'rgba(20,56,196,.94)' : 'rgba(23,34,17,.94)'}
    />
  );
}
