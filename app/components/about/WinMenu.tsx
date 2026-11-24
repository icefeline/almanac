'use client';

import { useEffect, useRef, useState } from 'react';

/* The menu bar of a window: file, view, help. Shared by every window that has one. */

/** Underlines the first letter, as a menu does for its keyboard shortcut. */
export const Mn = ({ text }: { text: string }) => (
  <>
    <u>{text[0]}</u>
    {text.slice(1)}
  </>
);

export interface MenuItem {
  label: string;
  onSelect?: () => void;
  disabled?: boolean;
  checked?: boolean;
  sep?: boolean;
}

export function MenuBar({ menus }: { menus: { label: string; items: MenuItem[] }[] }) {
  const [open, setOpen] = useState<number | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (open === null) return;
    const away = (e: PointerEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(null);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [open]);
  return (
    <div ref={ref} className="ad-menubar" role="menubar">
      {menus.map((m, i) => (
        <div key={m.label} className="ad-mwrap">
          <button
            type="button"
            role="menuitem"
            aria-haspopup="true"
            aria-expanded={open === i}
            className="ad-mi"
            data-pressed={open === i ? '' : undefined}
            onClick={() => setOpen(open === i ? null : i)}
            onPointerEnter={() => open !== null && setOpen(i)}
          >
            <Mn text={m.label} />
          </button>
          {open === i && (
            <div className="ad-pop" role="menu">
              {m.items.map((it, j) =>
                it.sep ? (
                  <div key={j} className="ad-psep" role="separator" />
                ) : (
                  <button
                    key={it.label}
                    type="button"
                    role="menuitem"
                    className="ad-pi"
                    disabled={it.disabled}
                    onClick={() => {
                      setOpen(null);
                      it.onSelect?.();
                    }}
                  >
                    {it.checked && <span className="ad-chk" aria-hidden="true" />}
                    {it.label}
                  </button>
                ),
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
