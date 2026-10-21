'use client';

import { useEffect } from 'react';

/*
 * One-time carry-over of what a reader already saved, from slowww.garden to this address.
 *
 * Browsers keep local storage per address, and the tarot app used to live at slowww.garden. Everything a
 * reader saved there (readings, reflections, birth details, settings) would be invisible here, so on first
 * visit this loads a hidden page from slowww.garden, asks it for what it has, and copies it in. The reader
 * sees nothing but, at most, one reload. Nothing goes to a server; it moves between two addresses of ours,
 * inside the browser.
 *
 * Safety rules: only that one origin is trusted, and only for messages that come from our own iframe; values
 * are checked for shape and size; keys the reader already had here before this page loaded are never
 * overwritten; the old copy is left where it is. `?restore=1` runs it again, for the reader who needs to.
 */

const TRANSFER_URL = process.env.NEXT_PUBLIC_TRANSFER_URL || 'https://slowww.garden/transfer';
const DONE_KEY = 'slow-garden-transfer-done-v1';
const EMPTY_KEY = 'slow-garden-transfer-empty-v1';
const MAX_EMPTY_REPLIES = 3;
const REQUEST = 'slow-garden/transfer-request';
const READY = 'slow-garden/transfer-ready';
const DATA = 'slow-garden/transfer-data';
const VERSION = 1;
const MAX_KEY = 256;
const MAX_VALUE = 1_000_000;
const MAX_TOTAL = 4_000_000;
const TIMEOUT_MS = 8000;

/*
 * Taken when this module loads, which is before the app has hydrated and written anything of its own. A key in
 * here is something the reader really saved at this address; a key that appears later was a default the app
 * created on this very load, which the carried-over value should replace.
 */
const KEYS_AT_LOAD: Set<string> = (() => {
  const s = new Set<string>();
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k !== null) s.add(k);
    }
  } catch {
    /* storage blocked */
  }
  return s;
})();

let started = false;

function apply(data: unknown): number {
  if (!data || typeof data !== 'object') return 0;
  let wrote = 0;
  let total = 0;
  for (const [k, v] of Object.entries(data as Record<string, unknown>)) {
    if (typeof v !== 'string' || k.length === 0 || k.length > MAX_KEY || v.length > MAX_VALUE) continue;
    if (k === '__proto__' || k === DONE_KEY || k === EMPTY_KEY || KEYS_AT_LOAD.has(k)) continue;
    total += k.length + v.length;
    if (total > MAX_TOTAL) break;
    try {
      localStorage.setItem(k, v);
      wrote++;
    } catch {
      break; // storage full or blocked
    }
  }
  return wrote;
}

export default function DataMigration() {
  useEffect(() => {
    if (started) return;
    let origin: string;
    try {
      origin = new URL(TRANSFER_URL).origin;
    } catch {
      return;
    }
    // On the old address itself the data is already here.
    if (window.location.origin === origin) return;
    const forced = new URLSearchParams(window.location.search).has('restore');
    try {
      if (!forced && localStorage.getItem(DONE_KEY)) return;
    } catch {
      return;
    }
    started = true;

    const frame = document.createElement('iframe');
    frame.src = TRANSFER_URL;
    frame.title = 'bringing your saved readings across';
    frame.setAttribute('aria-hidden', 'true');
    frame.tabIndex = -1;
    frame.style.cssText = 'position:fixed;width:0;height:0;border:0;opacity:0;pointer-events:none';

    let finished = false;
    let timer: ReturnType<typeof setInterval>;
    const ask = () => frame.contentWindow?.postMessage({ type: REQUEST, v: VERSION }, origin);
    const finish = () => {
      finished = true;
      clearInterval(timer);
      clearTimeout(giveUp);
      window.removeEventListener('message', onMessage);
      frame.remove();
    };
    const onMessage = (e: MessageEvent) => {
      if (finished || e.origin !== origin || e.source !== frame.contentWindow) return;
      if (!e.data || e.data.v !== VERSION) return;
      if (e.data.type === READY) {
        ask();
      } else if (e.data.type === DATA) {
        const incoming = e.data.data && typeof e.data.data === 'object' ? Object.keys(e.data.data).length : 0;
        const wrote = apply(e.data.data);
        try {
          // An empty reply is normal for someone new, but it can also mean the browser kept the old
          // address's storage out of reach. Ask again on the next few visits before settling.
          const empties = incoming === 0 ? (Number(localStorage.getItem(EMPTY_KEY)) || 0) + 1 : 0;
          if (incoming === 0) localStorage.setItem(EMPTY_KEY, String(empties));
          if (incoming > 0 || empties >= MAX_EMPTY_REPLIES) localStorage.setItem(DONE_KEY, String(Date.now()));
        } catch {
          /* ignore */
        }
        finish();
        if (wrote > 0) window.location.reload(); // so the app reads what just arrived
      }
    };
    window.addEventListener('message', onMessage);
    // The hidden page announces itself, but retry in case that message was missed.
    timer = setInterval(ask, 500);
    const giveUp = setTimeout(finish, TIMEOUT_MS); // no flag set: the next visit tries again
    document.body.appendChild(frame);
    frame.addEventListener('load', ask);
  }, []);

  return null;
}
