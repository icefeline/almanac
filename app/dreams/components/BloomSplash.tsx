'use client';

import { useEffect, useState, type ReactNode } from 'react';
import AsciiFlower from '../../components/AsciiFlower';

/**
 * The loading screen every slow garden page shares: the ascii flower blooming on the page's own ground colour.
 * It covers the page while it starts up and fades once the page is ready and the flower has had one full breath.
 */
export default function BloomSplash({ bg, ink, label, children }: { bg: string; ink: string; label: string; children: ReactNode }) {
  const [gone, setGone] = useState(false);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    const MIN = 1800; // one full breath of the flower, so it never flashes
    const t0 = performance.now();
    let t1: ReturnType<typeof setTimeout>;
    let t2: ReturnType<typeof setTimeout>;
    const done = () => {
      t1 = setTimeout(() => {
        setFading(true);
        t2 = setTimeout(() => setGone(true), 600);
      }, Math.max(0, MIN - (performance.now() - t0)));
    };
    if (document.readyState === 'complete') done();
    else window.addEventListener('load', done, { once: true });
    return () => {
      window.removeEventListener('load', done);
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  return (
    <>
      {children}
      {!gone && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 2147483000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: bg,
            color: ink,
            opacity: fading ? 0 : 1,
            transition: 'opacity .6s ease',
            pointerEvents: fading ? 'none' : 'auto',
          }}
        >
          <AsciiFlower label={label} weight={500} />
        </div>
      )}
    </>
  );
}
