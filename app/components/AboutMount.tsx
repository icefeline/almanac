'use client';

import { usePathname } from 'next/navigation';
import AboutMenu from './AboutMenu';

/*
 * The about link on every page of the almanac. The pages don't share a ground: the tarot page is dark green with
 * paper type, the dream page is blue, and the privacy and terms pages are white documents with ink type. So the
 * colour follows the route.
 */
export default function AboutMount() {
  const pathname = usePathname() || '/';
  const onLegal = pathname.startsWith('/privacy') || pathname.startsWith('/terms');
  const onDreams = pathname.startsWith('/dreams');
  return (
    <AboutMenu
      current={onDreams ? 'milky' : 'almanac'}
      termsHref="/terms"
      privacyHref="/privacy"
      left={16}
      bottom={14}
      color={onLegal ? '#171717' : onDreams ? '#FFFFFF' : '#F7F4E6'}
      textShadow={onLegal ? 'none' : '0 1px 6px rgba(0,0,0,.55)'}
      // a solid ground while open, in the page's own colour, so the text reads over the lime card, the calendar
      // and the dream page's photo
      panelBackground={onLegal ? 'rgba(255,255,255,.96)' : onDreams ? 'rgba(20,56,196,.94)' : 'rgba(23,34,17,.94)'}
    />
  );
}
