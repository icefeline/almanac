import type { Metadata } from 'next';
import DreamMap from '../components/DreamMap';

export const metadata: Metadata = {
  title: 'milky map ~ where your dreams meet',
  description: 'your dreams as a night sky, and the patterns that run through them.',
};

export default function DreamMapPage() {
  return <DreamMap />;
}
