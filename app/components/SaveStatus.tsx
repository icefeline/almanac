'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { LABEL_TYPE, BODY_TYPE } from './type';
import {
  agoLabel,
  readState,
  requestPersistence,
  restoreBackup,
  parseBackup,
  saveBackup,
  type BackupFile,
  type SaveState,
} from '@/lib/utils/backup';

/*
 * A small corner note that says where the garden is saved, and the way to keep a copy of it.
 *
 * Everything already saves itself, on every change, into this browser. What it cannot do on its own is survive
 * the browser: clearing site data or a privacy tool's shred button erases it, with no copy anywhere else. So
 * this says so plainly, flashes "saved" when something is written, offers a copy at natural checkpoints (the
 * first week, then every thirty draws), and opens a sheet to save or restore one. Nothing here sends anything
 * anywhere; a copy is a file the reader keeps.
 */

type View = 'menu' | 'confirm' | 'done';

const LIME = '#C9F24E';
const INK = '#172211';

export default function SaveStatus() {
  const [state, setState] = useState<SaveState>({ draws: 0, lastBackup: null, due: false });
  const [flash, setFlash] = useState(false);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('menu');
  const [pending, setPending] = useState<{ backup: BackupFile; draws: number } | null>(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setState(readState());
    requestPersistence(); // best effort; the browser may say no
    try {
      setCanShare(typeof navigator.canShare === 'function' && navigator.canShare({ files: [new File(['x'], 'x.json', { type: 'application/json' })] }));
    } catch {
      setCanShare(false);
    }
    const refresh = () => setState(readState());
    window.addEventListener('slow-garden:backup', refresh);

    // Notice writes so "saved" can flash. The app writes to localStorage from many places; this watches the one
    // method rather than touching each of them, and puts it back on unmount.
    const proto = Storage.prototype;
    const original = proto.setItem;
    let debounce: ReturnType<typeof setTimeout> | undefined;
    let off: ReturnType<typeof setTimeout> | undefined;
    proto.setItem = function (this: Storage, key: string, value: string) {
      original.call(this, key, value);
      if (this !== window.localStorage || key.startsWith('slow-garden-backup-')) return;
      clearTimeout(debounce);
      debounce = setTimeout(() => {
        setState(readState());
        setFlash(true);
        clearTimeout(off);
        off = setTimeout(() => setFlash(false), 1800);
      }, 350);
    };
    return () => {
      proto.setItem = original;
      window.removeEventListener('slow-garden:backup', refresh);
      clearTimeout(debounce);
      clearTimeout(off);
    };
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  function openSheet() {
    setView('menu');
    setMessage('');
    setPending(null);
    setState(readState());
    setOpen(true);
  }
  function close() {
    setOpen(false);
  }

  async function onSave() {
    setBusy(true);
    setMessage('');
    try {
      const how = await saveBackup();
      if (how === 'shared') setMessage('copy saved. keep it somewhere safe.');
      else if (how === 'downloaded') setMessage('copy downloaded. keep it somewhere safe.');
      setState(readState());
    } catch {
      setMessage("couldn't make a copy in this browser.");
    } finally {
      setBusy(false);
    }
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setMessage('');
    if (file.size > 12_000_000) {
      setMessage('that file is bigger than a backup should be.');
      return;
    }
    const parsed = parseBackup(await file.text());
    if (!parsed.ok) {
      setMessage(parsed.reason);
      return;
    }
    setPending({ backup: parsed.backup, draws: parsed.draws });
    setView('confirm');
  }

  function onRestore(mode: 'fill' | 'replace') {
    if (!pending) return;
    const { written } = restoreBackup(pending.backup, mode);
    setView('done');
    if (written === 0) {
      setMessage('nothing to add — this browser already has all of it.');
      return;
    }
    setMessage(`brought back ${written} saved items. reloading…`);
    setTimeout(() => window.location.reload(), 1200);
  }

  const label = state.due
    ? 'checkpoint · save a copy?'
    : flash
      ? 'saved'
      : state.lastBackup
        ? `backed up · ${agoLabel(state.lastBackup)}`
        : 'saved on this device';

  const panel = { background: INK, border: '1px solid rgba(206,241,123,0.3)', color: '#F7F4E6' } as const;
  const primary = { ...LABEL_TYPE, background: LIME, color: INK, padding: '12px 16px', textTransform: 'uppercase', fontWeight: 600, cursor: 'pointer' } as const;
  const secondary = { ...LABEL_TYPE, background: 'transparent', color: LIME, padding: '11px 16px', textTransform: 'uppercase', border: '1px solid rgba(206,241,123,0.5)', cursor: 'pointer' } as const;

  return (
    <>
      {/*
        Just an icon, sitting with the view buttons. It says nothing until it has something to say: a small dot
        pulses at a checkpoint, and a tick shows for a moment whenever something is saved. The full status is
        in its label and title, and one tap opens the sheet.
      */}
      <button
        type="button"
        onClick={openSheet}
        aria-label={label}
        title={label}
        className="sg-osbtn sg-savebtn relative flex items-center justify-center px-3 md:px-5 py-1.5 md:py-2 w-[4.6rem] md:w-[5.4rem]"
        style={{ ...LABEL_TYPE, fontSize: 'clamp(9px, 2.2vw, 11px)', letterSpacing: '0.16em' }}
      >
        <span>{flash ? 'saved' : 'save'}</span>
        {(state.due || flash) && (
          <span
            aria-hidden="true"
            className={state.due && !flash ? 'animate-pulse' : ''}
            style={{ position: 'absolute', top: -4, right: -4, width: 8, height: 8, borderRadius: '50%', background: LIME, boxShadow: `0 0 0 2px ${INK}` }}
          />
        )}
      </button>

      {open && typeof document !== 'undefined' && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label="your garden"
          onClick={(e) => e.target === e.currentTarget && close()}
          style={{ position: 'fixed', inset: 0, zIndex: 60, background: 'rgba(8,14,6,0.6)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 12 }}
        >
          <div style={{ ...panel, width: '100%', maxWidth: 440, padding: '22px 20px', display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 'env(safe-area-inset-bottom, 0px)' }}>
            {view === 'menu' && (
              <>
                <div style={{ ...LABEL_TYPE, color: LIME, textTransform: 'uppercase' }}>your garden</div>
                <p style={{ ...BODY_TYPE, fontSize: 16, margin: 0 }}>
                  everything you&apos;ve drawn and written is saved in this browser, and nowhere else. nobody has another copy, including us.
                </p>
                <div style={{ ...LABEL_TYPE, color: 'rgba(247,244,230,0.7)', textTransform: 'lowercase' }}>
                  {state.lastBackup ? `last copy ${agoLabel(state.lastBackup)}` : 'no copy yet'} · {state.draws} {state.draws === 1 ? 'draw' : 'draws'}
                </div>
                <button type="button" onClick={onSave} disabled={busy} style={{ ...primary, opacity: busy ? 0.6 : 1 }}>
                  {canShare ? 'save a copy' : 'download a copy'}
                </button>
                {canShare && (
                  <p style={{ ...BODY_TYPE, fontSize: 14, margin: 0, color: 'rgba(247,244,230,0.7)' }}>
                    this opens your phone&apos;s share sheet. choose &ldquo;save to files&rdquo;, then icloud drive or google drive.
                  </p>
                )}
                <button type="button" onClick={() => fileRef.current?.click()} style={secondary}>
                  restore from a copy
                </button>
                <input ref={fileRef} type="file" accept=".json,application/json" hidden onChange={(e) => { onFile(e.target.files?.[0]); e.target.value = ''; }} />
                {!!message && <p role="status" style={{ ...BODY_TYPE, fontSize: 14, margin: 0, color: LIME }}>{message}</p>}
                <button type="button" onClick={close} style={{ ...LABEL_TYPE, background: 'none', border: 0, color: 'rgba(247,244,230,0.6)', textTransform: 'lowercase', cursor: 'pointer', alignSelf: 'center' }}>
                  close
                </button>
              </>
            )}

            {view === 'confirm' && pending && (
              <>
                <div style={{ ...LABEL_TYPE, color: LIME, textTransform: 'uppercase' }}>found a copy</div>
                <p style={{ ...BODY_TYPE, fontSize: 16, margin: 0 }}>
                  {pending.draws} {pending.draws === 1 ? 'draw' : 'draws'}
                  {pending.backup.createdAt && !Number.isNaN(Date.parse(pending.backup.createdAt))
                    ? `, saved ${new Date(pending.backup.createdAt).toLocaleDateString(undefined, { day: 'numeric', month: 'long', year: 'numeric' }).toLowerCase()}`
                    : ''}
                  .
                </p>
                <button type="button" onClick={() => onRestore('fill')} style={primary}>
                  add what&apos;s missing
                </button>
                <p style={{ ...BODY_TYPE, fontSize: 14, margin: 0, color: 'rgba(247,244,230,0.7)' }}>keeps everything already on this device, and only adds what it doesn&apos;t have.</p>
                <button type="button" onClick={() => onRestore('replace')} style={secondary}>
                  replace with this copy
                </button>
                <p style={{ ...BODY_TYPE, fontSize: 14, margin: 0, color: 'rgba(247,244,230,0.7)' }}>writes everything in the copy over what&apos;s here. anything newer on this device that is also in the copy is overwritten.</p>
                <button type="button" onClick={() => { setPending(null); setView('menu'); }} style={{ ...LABEL_TYPE, background: 'none', border: 0, color: 'rgba(247,244,230,0.6)', textTransform: 'lowercase', cursor: 'pointer', alignSelf: 'center' }}>
                  cancel
                </button>
              </>
            )}

            {view === 'done' && (
              <>
                <p role="status" style={{ ...BODY_TYPE, fontSize: 16, margin: 0, color: LIME }}>{message}</p>
                <button type="button" onClick={close} style={secondary}>
                  close
                </button>
              </>
            )}
          </div>
        </div>,
        document.body,
      )}
    </>
  );
}
