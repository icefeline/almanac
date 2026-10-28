'use client';

import { usePathname } from 'next/navigation';
import AboutMenu from './AboutMenu';

/*
 * The about link on every page of the almanac. The pages don't share a ground: the tarot page is dark green with
 * paper type and the dream page is blue, so the colour follows the route. The privacy and terms pages are plain white
 * documents and show nothing.
 */
export default function AboutMount() {
  const pathname = usePathname() || '/';
  const onLegal = pathname.startsWith('/privacy') || pathname.startsWith('/terms');
  const onDreams = pathname.startsWith('/dreams');
  // the legal pages are plain documents: no menu, no charms
  if (onLegal) return null;
  return (
    <AboutMenu
      current={onDreams ? 'milky' : 'almanac'}
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
