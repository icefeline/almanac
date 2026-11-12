'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

/**
 * Sets text as large as will fit.
 *
 * Finds the biggest size at which everything still sits inside its box — by height
 * for a block, or by width when the text is flowing into columns that spill sideways
 * — and keeps it fitted as the screen changes. A short passage is set huge and a long
 * one smaller, and either way it fills the page, the way a magazine fills a page.
 */
export function FitText({
  children,
  className,
  mode = 'height',
  min = 14,
  max = 260,
}: {
  children: ReactNode;
  className?: string;
  mode?: 'height' | 'columns';
  min?: number;
  max?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fits = () =>
      mode === 'height'
        ? el.scrollHeight <= el.clientHeight + 1 && el.scrollWidth <= el.clientWidth + 1
        : el.scrollWidth <= el.clientWidth + 1;
    const fit = () => {
      let lo = min;
      let hi = max;
      while (hi - lo > 1) {
        const mid = (lo + hi) >> 1;
        el.style.fontSize = `${mid}px`;
        if (fits()) lo = mid;
        else hi = mid;
      }
      el.style.fontSize = `${lo}px`;
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(el);
    return () => observer.disconnect();
  }, [mode, min, max, children]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

export default FitText;
