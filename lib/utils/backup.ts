/*
 * Backing up and restoring everything slow garden has saved in this browser.
 *
 * Readers' data lives in localStorage and nowhere else, which is the promise — and also the weakness: clearing
 * site data, a browser's shred button, or Safari's cleanup of unused sites erases it, and nothing on our side can
 * bring it back. A backup is a plain JSON file the reader keeps wherever they like. It never touches a server.
 *
 * The keys grew in two eras with no common prefix (see the table in CLAUDE.md), so a backup takes every key
 * rather than filtering on a prefix, minus the few that are only bookkeeping.
 */

const LAST_KEY = 'slow-garden-backup-last';
const DRAWS_KEY = 'slow-garden-backup-draws';

/** Keys that are bookkeeping, not the reader's garden. */
function isBookkeeping(key: string): boolean {
  return key.startsWith('slow-garden-backup-') || key === 'notificationTimeoutId' || key === 'testSeed';
}

export interface BackupFile {
  app: 'slow-garden';
  kind: 'backup';
  version: 1;
  createdAt: string;
  from: string;
  data: Record<string, string>;
}

export interface SaveState {
  draws: number;
  lastBackup: number | null;
  /** A checkpoint worth offering a copy at: the first week, then every 30 more draws, or 60 quiet days. */
  due: boolean;
}

const MAX_ENTRIES = 5000;
const MAX_KEY = 256;
const MAX_VALUE = 1_000_000;
const MAX_TOTAL = 8_000_000;

export function countDraws(): number {
  try {
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) {
      if ((localStorage.key(i) || '').startsWith('card-')) n++;
    }
    return n;
  } catch {
    return 0;
  }
}

export function readState(now: number = Date.now()): SaveState {
  const draws = countDraws();
  let last: number | null = null;
  let lastDraws = 0;
  try {
    const l = Number(localStorage.getItem(LAST_KEY));
    last = Number.isFinite(l) && l > 0 ? l : null;
    lastDraws = Number(localStorage.getItem(DRAWS_KEY)) || 0;
  } catch {
    /* storage blocked */
  }
  let due = false;
  if (draws >= 7) {
    if (last === null) due = true;
    else if (draws - lastDraws >= 30) due = true;
    else if (draws > lastDraws && now - last > 60 * 24 * 3600 * 1000) due = true;
  }
  return { draws, lastBackup: last, due };
}

export function buildBackup(): BackupFile {
  const data: Record<string, string> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k === null || isBookkeeping(k)) continue;
    const v = localStorage.getItem(k);
    if (v !== null) data[k] = v;
  }
  return { app: 'slow-garden', kind: 'backup', version: 1, createdAt: new Date().toISOString(), from: window.location.host, data };
}

function filename(d: Date = new Date()): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `slow-garden-${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}.json`;
}

function markBackedUp(draws: number) {
  try {
    localStorage.setItem(LAST_KEY, String(Date.now()));
    localStorage.setItem(DRAWS_KEY, String(draws));
  } catch {
    /* storage blocked */
  }
  window.dispatchEvent(new Event('slow-garden:backup'));
}

/**
 * Hands the reader a copy. On a phone this opens the share sheet (save to Files, iCloud Drive, Google Drive, send
 * to yourself...); elsewhere it downloads. Must be called from a tap, or the browser refuses to share.
 */
export async function saveBackup(): Promise<'shared' | 'downloaded' | 'cancelled'> {
  const backup = buildBackup();
  const file = new File([JSON.stringify(backup)], filename(), { type: 'application/json' });
  const draws = countDraws();
  if (typeof navigator.canShare === 'function' && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'slow garden backup' });
      markBackedUp(draws);
      return 'shared';
    } catch (e) {
      if ((e as Error)?.name === 'AbortError') return 'cancelled'; // they closed the sheet
      // anything else: fall through to a plain download
    }
  }
  const url = URL.createObjectURL(file);
  const a = document.createElement('a');
  a.href = url;
  a.download = file.name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
  markBackedUp(draws);
  return 'downloaded';
}

export type ParsedBackup = { ok: true; backup: BackupFile; draws: number } | { ok: false; reason: string };

/** Reads a backup file's text. Strict about shape and size, since this is untrusted input from a file. */
export function parseBackup(text: string): ParsedBackup {
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, reason: "that doesn't look like a slow garden backup." };
  }
  const b = raw as Partial<BackupFile> | null;
  if (!b || typeof b !== 'object' || b.app !== 'slow-garden' || b.kind !== 'backup' || b.version !== 1 || !b.data || typeof b.data !== 'object') {
    return { ok: false, reason: "that doesn't look like a slow garden backup." };
  }
  const entries = Object.entries(b.data as Record<string, unknown>);
  if (entries.length > MAX_ENTRIES) return { ok: false, reason: 'that file is bigger than a backup should be.' };
  const data: Record<string, string> = {};
  let total = 0;
  for (const [k, v] of entries) {
    if (typeof v !== 'string' || k.length === 0 || k.length > MAX_KEY || v.length > MAX_VALUE) continue;
    if (k === '__proto__' || isBookkeeping(k)) continue;
    total += k.length + v.length;
    if (total > MAX_TOTAL) return { ok: false, reason: 'that file is bigger than a backup should be.' };
    data[k] = v;
  }
  if (Object.keys(data).length === 0) return { ok: false, reason: 'that backup is empty.' };
  const draws = Object.keys(data).filter((k) => k.startsWith('card-')).length;
  return { ok: true, draws, backup: { app: 'slow-garden', kind: 'backup', version: 1, createdAt: String(b.createdAt || ''), from: String(b.from || ''), data } };
}

/**
 * Puts a backup back. "fill" only adds what this browser doesn't have, so a restore can never overwrite
 * something newer; "replace" writes everything in the file (and leaves anything else alone).
 */
export function restoreBackup(backup: BackupFile, mode: 'fill' | 'replace'): { written: number; skipped: number } {
  let written = 0;
  let skipped = 0;
  for (const [k, v] of Object.entries(backup.data)) {
    try {
      if (mode === 'fill' && localStorage.getItem(k) !== null) {
        skipped++;
        continue;
      }
      localStorage.setItem(k, v);
      written++;
    } catch {
      break; // storage full or blocked
    }
  }
  return { written, skipped };
}

/**
 * Asks the browser to treat this storage as persistent, so it isn't cleared automatically when space runs low.
 * It's a request the browser may refuse, and it does nothing about a reader clearing site data themselves.
 */
export async function requestPersistence(): Promise<boolean | null> {
  try {
    if (!navigator.storage?.persist) return null;
    if (await navigator.storage.persisted?.()) return true;
    return await navigator.storage.persist();
  } catch {
    return null;
  }
}

export function agoLabel(ts: number, now: number = Date.now()): string {
  const mins = Math.max(0, Math.round((now - ts) / 60000));
  if (mins < 2) return 'just now';
  if (mins < 60) return `${mins} minutes ago`;
  const hours = Math.round(mins / 60);
  if (hours < 24) return hours === 1 ? 'an hour ago' : `${hours} hours ago`;
  const days = Math.round(hours / 24);
  return days === 1 ? 'yesterday' : `${days} days ago`;
}
