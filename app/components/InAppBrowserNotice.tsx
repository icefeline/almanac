'use client';

import React, { useEffect, useState } from 'react';
import { detectWebview, escapeHint, type WebviewHost } from '@/lib/utils/webview';

const DISMISSED_KEY = 'slow-garden-webview-noticed';

/**
 * Shown on the splash, before the reader has typed anything.
 *
 * The timing is the point. Warning after onboarding would mean asking someone
 * to enter their birth details a second time; warning before it costs them
 * nothing. It is phrased as something they may want rather than something they
 * must do — the app still works perfectly well in here, it just cannot carry
 * their garden back out.
 *
 * There is no button that escapes a webview. iOS gives a page no way to hand
 * itself to Safari, and the Android intent:// trick fails silently in several
 * of these apps, so offering a broken button would be worse than telling them
 * where their app keeps the menu. Copying the link is the one thing that
 * reliably works everywhere.
 */
export default function InAppBrowserNotice({ scale = 1 }: { scale?: number }) {
  const [host, setHost] = useState<WebviewHost | null>(null);
  const [copied, setCopied] = useState(false);

  // Detection reads navigator, so it cannot run until the client has mounted —
  // rendering it during SSR would mismatch.
  useEffect(() => {
    try {
      if (localStorage.getItem(DISMISSED_KEY) === 'true') return;
    } catch {
      // storage unavailable — show it; an unreadable store is itself a hint
      // that this browser is unusual.
    }
    setHost(detectWebview());
  }, []);

  if (!host) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISSED_KEY, 'true');
    } catch {
      // if we cannot remember the dismissal, still honour it for this visit
    }
    setHost(null);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText('https://slowww.garden');
      setCopied(true);
      setTimeout(() => setCopied(false), 2400);
    } catch {
      // clipboard blocked in this webview — the hint below still stands
    }
  };

  return (
    <div
      role="note"
      style={{
        margin: `0 auto ${16 * scale}px`,
        maxWidth: `${340 * scale}px`,
        padding: `${14 * scale}px ${16 * scale}px`,
        border: '1px solid rgba(206, 241, 123, 0.35)',
        borderRadius: `${2 * scale}px`,
        background: 'rgba(206, 241, 123, 0.06)',
        fontFamily: 'var(--font-dm-sans), system-ui, sans-serif',
        fontSize: `${13 * scale}px`,
        lineHeight: 1.5,
        color: 'rgba(225, 238, 252, 0.92)',
        textTransform: 'lowercase',
      }}
    >
      <p style={{ margin: 0 }}>
        your almanac is saved on this device, in this browser. open it somewhere
        else later and it won&rsquo;t follow you.
      </p>
      <p style={{ margin: `${8 * scale}px 0 0`, color: 'rgba(225, 238, 252, 0.62)' }}>
        {escapeHint(host)}, or keep going and stay in this one.
      </p>

      <div style={{ display: 'flex', gap: `${14 * scale}px`, marginTop: `${12 * scale}px` }}>
        <button
          type="button"
          onClick={copyLink}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
            color: '#CEF17B',
            textDecoration: 'underline',
            textUnderlineOffset: '3px',
            cursor: 'pointer',
          }}
        >
          {copied ? 'link copied' : 'copy the link'}
        </button>
        <button
          type="button"
          onClick={dismiss}
          style={{
            background: 'none',
            border: 'none',
            padding: 0,
            font: 'inherit',
            color: 'rgba(225, 238, 252, 0.55)',
            cursor: 'pointer',
          }}
        >
          got it
        </button>
      </div>
    </div>
  );
}
