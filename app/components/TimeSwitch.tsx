'use client';

import { useState } from 'react';

/**
 * TEMPORARY: pins the sky to an hour so the reading page can be seen against every
 * time of day. Dev only (hidden in production builds). Delete this file and its one
 * line in SkyBackground.tsx when the look is settled.
 */
const HOURS: { label: string; sun: { altitude: number; morning: boolean } | null }[] = [
  { label: 'live', sun: null },
  { label: 'pre-dawn', sun: { altitude: -12, morning: true } },
  { label: 'sunrise', sun: { altitude: 1, morning: true } },
  { label: 'morning', sun: { altitude: 14, morning: true } },
  { label: 'noon', sun: { altitude: 45, morning: true } },
  { label: 'golden hour', sun: { altitude: 8, morning: false } },
  { label: 'sunset', sun: { altitude: -1, morning: false } },
  { label: 'dusk', sun: { altitude: -8, morning: false } },
  { label: 'night', sun: { altitude: -20, morning: false } },
  { label: 'deep night', sun: { altitude: -45, morning: false } },
];

export default function TimeSwitch() {
  const [i, setI] = useState(0);
  if (process.env.NODE_ENV === 'production') return null;

  const go = (n: number) => {
    const k = (n + HOURS.length) % HOURS.length;
    setI(k);
    window.dispatchEvent(new CustomEvent('sg:sky', { detail: HOURS[k].sun }));
  };

  const btn: React.CSSProperties = {
    font: '16px/1 var(--font-vt323), monospace',
    textTransform: 'uppercase',
    background: '#010179',
    color: '#F7F4E6',
    border: 0,
    padding: '6px 9px',
    cursor: 'pointer',
  };

  return (
    <div
      style={{ position: 'fixed', left: '50%', transform: 'translateX(-50%)', bottom: 10, zIndex: 60, display: 'flex', gap: 2 }}
      aria-label="temporary time of day switch"
    >
      <button type="button" style={btn} onClick={() => go(i - 1)} aria-label="earlier">&lt;</button>
      <button type="button" style={{ ...btn, minWidth: 130 }} onClick={() => go(i + 1)}>
        {HOURS[i].label}
      </button>
      <button type="button" style={btn} onClick={() => go(i + 1)} aria-label="later">&gt;</button>
    </div>
  );
}
