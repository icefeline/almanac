import type { Metadata } from 'next';
import AboutDesktop from '../components/about/AboutDesktop';

export const metadata: Metadata = {
  title: 'about · slow garden',
  description: 'Why slow garden was made, the questions people ask about it, the policies, and the other small apps that live beside it.',
};

export default function AboutPage() {
  return <AboutDesktop />;
}
