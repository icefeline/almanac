'use client';

import { useEffect, useRef, useState, type CSSProperties, type PointerEvent as ReactPointerEvent, type ReactNode } from 'react';
import { ABOUT, APPS } from '../AboutMenu';
import { glyph } from './pixels';
import MediaPlayer from './MediaPlayer';
import VizLayer from './VizLayer';
import { MenuBar } from './WinMenu';
import './about-desktop.css';

/*
 * The about page, laid out as an old desktop with working parts: folders and files open as windows you can drag,
 * minimise, maximise and close; the taskbar lists whatever is open; the Start menu reaches everything. The words all
 * come from ABOUT in AboutMenu.tsx, the same source the three apps share, so editing them there changes this page too.
 *
 * Everything that opens is a NODE below. To add a question to the faqs, add it to ABOUT.faq.items. To add a folder,
 * add a node with children and list it in DESK. The look lives in about-desktop.css; the icons are drawn by
 * scripts/about-icons.py.
 */

const icon = (name: string, size: 16 | 32 = 32) => `/about/icons/${name}-${size}.png`;

const GLYPHS: Record<string, string> = {
  close: glyph(['XX....XX', '.XX..XX.', '..XXXX..', '...XX...', '..XXXX..', '.XX..XX.', 'XX....XX']),
  min: glyph(['XXXXXX', 'XXXXXX']),
  max: glyph(['XXXXXXXXX', 'XXXXXXXXX', 'X.......X', 'X.......X', 'X.......X', 'X.......X', 'X.......X', 'X.......X', 'XXXXXXXXX']),
  restore: glyph(['..XXXXXX', '..XXXXXX', '..X....X', 'XXXXXX.X', 'XXXXXX.X', 'X....X.X', 'X....XXX', 'X....X..', 'XXXXXX..']),
  up: glyph(['...X...', '..XXX..', '.XXXXX.', 'XXXXXXX']),
  down: glyph(['XXXXXXX', '.XXXXX.', '..XXX..', '...X...']),
  left: glyph(['...X', '..XX', '.XXX', 'XXXX', '.XXX', '..XX', '...X']),
  right: glyph(['X...', 'XX..', 'XXX.', 'XXXX', 'XXX.', 'XX..', 'X...']),
  check: glyph(['......X', '.....XX', 'X...XX.', 'XX.XX..', '.XXX...', '..X....']),
};
const GLYPH_VARS = Object.fromEntries(Object.entries(GLYPHS).map(([k, v]) => [`--g-${k}`, v])) as CSSProperties;

interface Entry {
  title: string;
  /** Icon file name, without size or extension. */
  icon: string;
  kind: 'folder' | 'text' | 'answer' | 'link' | 'display' | 'player';
  /** Window width at the original size, before scaling. */
  w: number;
  children?: string[];
  /** A folder's icons are strewn about, not lined up: where each sits (left, then top in px), and how tall the room is. */
  scatter?: Record<string, [string, number]>;
  h?: number;
  /** Opens tucked into a corner of the desktop, out of the way of the icons, rather than cascading from the top left. */
  dock?: 'bottom-right';
  /** How tall the window is, before scaling, so it can be docked flush with the bottom. */
  estH?: number;
  body?: ReactNode;
  href?: string;
  /** Wears the little shortcut arrow: it leads somewhere else. */
  shortcut?: boolean;
}

const Paras = ({ list }: { list: readonly string[] }) => (
  <>
    {list.map((p) => (
      <p key={p}>{p}</p>
    ))}
  </>
);

/*
 * The desktop's look is the reader's to change (display properties): a colour, and a wallpaper over it. Each wallpaper
 * is a small tile that repeats, or for "evening" a strip stretched to the screen; scripts/about-wallpapers.py draws
 * them. The choice is kept in this browser only, under STORE.
 */
const STORE = 'slow-garden-desktop';
const WALLS = [
  { id: 'none', label: '(none)' },
  { id: 'night', label: 'night garden', tile: 64 },
  { id: 'daisies', label: 'daisies', tile: 40 },
  { id: 'moons', label: 'moons', tile: 48 },
  { id: 'leaves', label: 'leaves', tile: 32 },
  { id: 'dusk', label: 'evening', stretch: true },
  { id: 'checker', label: 'checker', tile: 2 },
  { id: 'weave', label: 'weave', tile: 8 },
] as const;
// the desktop colours are root's own (BGS in the sticker tracker's lib/logic/shell.ts), so the two desktops match
const COLORS = [
  { id: '#a3156e', label: 'y2k hot pink' },
  { id: '#0a6b6b', label: 'win95 teal' },
  { id: '#0b0f8a', label: 'vcr blue' },
  { id: '#0c2a14', label: 'phosphor green' },
  { id: '#2a1604', label: 'amber terminal' },
  { id: '#4a4a52', label: 'platinum grey' },
  { id: '#101014', label: 'dos black' },
] as const;
const DEFAULT_COLOR = '#0a6b6b';
const MILKY_COLOR = '#0b0f8a';
interface Scene {
  wall: string;
  color: string;
}
const sceneStyle = (s: Scene, scale: string): CSSProperties => {
  const w = WALLS.find((x) => x.id === s.wall);
  if (!w || w.id === 'none') return { backgroundColor: s.color };
  return {
    backgroundColor: s.color,
    backgroundImage: `url(/about/wallpapers/${w.id}.png)`,
    backgroundSize: 'stretch' in w ? '100% 100%' : `calc(${w.tile}px * ${scale})`,
    backgroundRepeat: 'stretch' in w ? 'no-repeat' : 'repeat',
    imageRendering: 'pixelated',
  };
};

const NODES: Record<string, Entry> = {
  info: {
    title: 'info',
    icon: 'folder',
    kind: 'folder',
    w: 400,
    // the story, a way to say thanks, and the two policies: the small print lives with the rest of the about
    children: ['why', 'coffee', 'privacy', 'terms'],
    h: 160,
    scatter: { why: ['5%', 8], coffee: ['58%', 14], privacy: ['20%', 82], terms: ['64%', 88] },
  },
  display: { title: 'display properties', icon: 'monitor', kind: 'display', w: 330 },
  music: { title: 'media player', icon: 'cd', kind: 'player', w: 350, dock: 'bottom-right', estH: 335 },
  // the questions, then the two policies: a policy is just one more thing people ask about
  faq: {
    title: ABOUT.faq.label,
    icon: 'folder',
    kind: 'folder',
    w: 360,
    children: ABOUT.faq.items.map((_, i) => `faq-${i}`),
    h: 150,
    scatter: { 'faq-0': ['6%', 8], 'faq-1': ['38%', 70], 'faq-2': ['68%', 6] },
  },
  why: { title: `${ABOUT.why.label}.txt`, icon: 'doc', kind: 'text', w: 360, body: <Paras list={ABOUT.why.paragraphs} /> },
  coffee: { title: 'buy me a coffee', icon: 'coffee', kind: 'link', w: 0, href: 'https://buymeacoffee.com/shxntxnx', shortcut: true },
  privacy: {
    title: 'privacy policy',
    icon: 'lock',
    kind: 'answer',
    w: 340,
    // the opening of app/privacy/page.tsx, which is the source of truth; if that page's short version changes, so does this
    body: (
      <>
        <p>
          everything you put into slow garden stays in your browser. we don&apos;t have a database with your name in it, because we
          don&apos;t have a database. we don&apos;t sell anything or advertise to you, and nobody here reads your reflections.
        </p>
        <p>
          a few small things do have to leave your device for the app to work at all. the <a href="/privacy">full privacy policy</a> is
          specific about which ones.
        </p>
      </>
    ),
  },
  terms: {
    title: 'terms of service',
    icon: 'terms',
    kind: 'answer',
    w: 340,
    body: (
      <>
        <Paras list={ABOUT.terms.paragraphs} />
        <p>
          the <a href="/terms">full terms of service</a> has the rest.
        </p>
      </>
    ),
  },
};
// each question has its own picture, in the order they are asked; a question added later falls back to the bubble
const FAQ_ICONS = ['gift', 'diary', 'tarot'];
ABOUT.faq.items.forEach((it, i) => {
  const pic = FAQ_ICONS[i] ?? 'question';
  // an answer is a plain window: the question in the title bar, the answer in a white box, nothing else
  NODES[`faq-${i}`] = { title: it.q, icon: pic, kind: 'answer', w: 320, body: <p>{it.a}</p> };
});
APPS.forEach((a) => {
  // the front door is slow garden itself; the shared list calls it "back to the bracelet", which reads as a button here
  const title = a.key === 'enter' ? 'slow garden' : a.label;
  NODES[`app-${a.key}`] = { title, icon: a.key, kind: 'link', w: 0, href: a.href, shortcut: true };
});

/** What sits loose on the desktop, and where (percent of the screen). On a phone these fall into a grid instead. */
const DESK: { id: string; x: number; y: number }[] = [
  { id: 'info', x: 11, y: 22 },
  { id: 'faq', x: 24, y: 64 },
  { id: 'app-enter', x: 47, y: 15 },
  { id: 'app-almanac', x: 51, y: 46 },
  { id: 'app-milky', x: 42, y: 80 },
  { id: 'app-root', x: 10, y: 84 },
  { id: 'music', x: 80, y: 30 },
];

/** The Start menu, top to bottom. null is a divider. */
const START: (string | null)[] = ['faq', 'info', 'music', null, 'app-almanac', 'app-milky', 'app-root', 'app-enter', null, 'display', null, 'home'];

interface Win {
  id: string;
  x: number;
  y: number;
  z: number;
  min: boolean;
  max: boolean;
}

function Pic({ name, size = 32, shortcut }: { name: string; size?: 16 | 32; shortcut?: boolean }) {
  return (
    <span className={shortcut ? 'ad-ico is-shortcut' : 'ad-ico'}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={icon(name, size)} alt="" width={32} height={32} />
    </span>
  );
}

/** The display properties dialog: a monitor showing what you have picked, a list of wallpapers, a row of colours. */
function DisplayProps({ committed, onApply, onClose }: { committed: Scene; onApply: (s: Scene) => void; onClose: () => void }) {
  const [draft, setDraft] = useState<Scene>(committed);
  return (
    <div className="ad-dlg ad-dp">
      <div className="ad-mon" aria-hidden="true">
        <div className="ad-mon-body">
          <div className="ad-mon-screen" style={sceneStyle(draft, '0.5')}>
            <span className="ad-mon-ico" style={{ left: 8, top: 8 }} />
            <span className="ad-mon-ico" style={{ left: 8, top: 30 }} />
            <span className="ad-mon-ico" style={{ right: 10, top: 14 }} />
            <span className="ad-mon-bar" />
          </div>
        </div>
        <div className="ad-mon-neck" />
        <div className="ad-mon-base" />
      </div>
      <fieldset className="ad-grp">
        <legend>wallpaper</legend>
        <div className="ad-lb" role="listbox" aria-label="wallpaper">
          {WALLS.map((w) => (
            <button key={w.id} type="button" role="option" aria-selected={draft.wall === w.id} className="ad-opt" onClick={() => setDraft((d) => ({ ...d, wall: w.id }))}>
              {w.label}
            </button>
          ))}
        </div>
      </fieldset>
      <fieldset className="ad-grp">
        <legend>colour</legend>
        <div className="ad-sw" role="radiogroup" aria-label="desktop colour">
          {COLORS.map((col) => (
            <button
              key={col.id}
              type="button"
              role="radio"
              aria-checked={draft.color === col.id}
              aria-label={col.label}
              title={col.label}
              className="ad-swatch"
              style={{ '--c': col.id } as CSSProperties}
              onClick={() => setDraft((d) => ({ ...d, color: col.id }))}
            />
          ))}
        </div>
      </fieldset>
      <div className="ad-dlg-btns">
        <button
          type="button"
          className="ad-btn is-default"
          onClick={() => {
            onApply(draft);
            onClose();
          }}
        >
          ok
        </button>
        <button type="button" className="ad-btn" onClick={onClose}>
          cancel
        </button>
        <button type="button" className="ad-btn" onClick={() => onApply(draft)}>
          apply
        </button>
      </div>
    </div>
  );
}

function useClock() {
  const [t, setT] = useState('');
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }).toUpperCase());
    tick();
    const id = setInterval(tick, 15000);
    return () => clearInterval(id);
  }, []);
  return t;
}

export default function AboutDesktop() {
  const [wins, setWins] = useState<Win[]>([]);
  const [startOpen, setStartOpen] = useState(false);
  // on a phone the media player lives as a small bar along the bottom (see MediaPlayer's `mini`)
  const [miniHost, setMiniHost] = useState<HTMLElement | null>(null);
  const [phone, setPhone] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia('(max-width:767px)');
    const on = () => setPhone(mq.matches);
    on();
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  const [milky, setMilky] = useState(false);
  const [lists, setLists] = useState<Record<string, boolean>>({}); // folders shown as a list rather than large icons
  const root = useRef<HTMLDivElement>(null);
  const z = useRef(10);
  const drag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number; w: number } | null>(null);
  const clock = useClock();
  const [scene, setScene] = useState<Scene>({ wall: 'none', color: DEFAULT_COLOR });
  const [ctx, setCtx] = useState<{ x: number; y: number } | null>(null);
  // where the reader has moved the desktop icons to (percent of the desktop), and which one is being dragged now
  const [icons, setIcons] = useState<Record<string, [number, number]>>({});
  const [dragId, setDragId] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const desk = useRef<HTMLDivElement>(null);
  const iconDrag = useRef<{ id: string; sx: number; sy: number; ox: number; oy: number; moved: boolean } | null>(null);
  const suppress = useRef(false);
  // milky.slowww.garden serves the same app, in its blue; and whatever look the reader chose last time comes back
  useEffect(() => {
    const onMilky = window.location.hostname.startsWith('milky.');
    setMilky(onMilky);
    let saved: (Partial<Scene> & { icons?: Record<string, unknown> }) | null = null;
    try {
      saved = JSON.parse(localStorage.getItem(STORE) || 'null');
    } catch {
      // storage can be blocked or empty: the default look is fine
    }
    setScene({
      wall: WALLS.some((w) => w.id === saved?.wall) ? saved!.wall! : 'none',
      color: COLORS.some((col) => col.id === saved?.color) ? saved!.color! : onMilky ? MILKY_COLOR : DEFAULT_COLOR,
    });
    const kept: Record<string, [number, number]> = {};
    for (const { id } of DESK) {
      const v = saved?.icons?.[id];
      if (Array.isArray(v) && v.length === 2 && v.every((n) => typeof n === 'number' && Number.isFinite(n))) kept[id] = [v[0], v[1]];
    }
    setIcons(kept);
    setReady(true);
  }, []);
  // the colour reaches behind the phone's status bar and the browser's bar too: the page background and the theme colour follow it
  useEffect(() => {
    if (!ready) return;
    const el = document.documentElement;
    el.style.setProperty('--ad-page', scene.color);
    let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement('meta');
      meta.name = 'theme-color';
      document.head.appendChild(meta);
    }
    const before = meta.content;
    meta.content = scene.color;
    return () => {
      el.style.removeProperty('--ad-page');
      if (meta) meta.content = before;
    };
  }, [ready, scene.color]);
  // remember the look and the icons' places, once the reader has let go of an icon rather than on every pixel of a drag
  useEffect(() => {
    if (!ready || dragId) return;
    try {
      localStorage.setItem(STORE, JSON.stringify({ ...scene, icons }));
    } catch {
      // not being able to remember it is not worth a message
    }
  }, [scene, icons, ready, dragId]);
  const applyScene = (s: Scene) => setScene(s);
  // "go back" returns to whichever app the reader came from (root, milky, the front door...), and to this one if it can't tell
  const [back, setBack] = useState('/');
  useEffect(() => {
    try {
      const r = document.referrer ? new URL(document.referrer) : null;
      if (r && r.hostname.endsWith('slowww.garden') && !r.pathname.startsWith('/about')) setBack(r.href);
    } catch {
      // no usable referrer: home it is
    }
  }, []);
  // fetch the Start menu's small icons up front, so the menu opens complete rather than filling in
  useEffect(() => {
    const names = new Set(START.filter((id): id is string => !!id).map((id) => (id === 'home' ? 'sprout' : NODES[id].icon)));
    names.forEach((n) => {
      const img = new Image();
      img.src = icon(n, 32);
    });
  }, []);

  const scale = () => parseFloat(getComputedStyle(root.current!).getPropertyValue('--z')) || 1;
  const wide = () => window.matchMedia('(min-width:768px)').matches;
  const clampPos = (x: number, y: number, wPx: number) => {
    const k = scale();
    return {
      x: Math.max(60 * k - wPx, Math.min(x, window.innerWidth - 40 * k)),
      y: Math.max(0, Math.min(y, window.innerHeight - 28 * k - 24 * k)),
    };
  };

  const live = wins.filter((w) => !w.min);
  const activeId = live.length ? live.reduce((a, b) => (b.z > a.z ? b : a)).id : null;
  // the small bar shows whenever the player isn't the window on show
  const musicWin = wins.find((w) => w.id === 'music');
  const showMini = phone && !!musicWin && musicWin.min;

  const raise = (id: string) => {
    const next = ++z.current;
    setWins((ws) => ws.map((w) => (w.id === id ? { ...w, z: next, min: false } : w)));
  };

  const open = (id: string, from?: string) => {
    if (NODES[id].kind === 'link') return;
    setStartOpen(false);
    const next = ++z.current;
    const k = scale();
    setWins((ws) => {
      if (ws.some((w) => w.id === id)) return ws.map((w) => (w.id === id ? { ...w, z: next, min: false } : w));
      const par = from ? ws.find((w) => w.id === from) : undefined;
      const n = ws.length;
      // a file opens just below its folder's row of icons, so the folder stays readable behind it
      // (a folder with strewn icons has more height to clear)
      const below = par && NODES[par.id].scatter ? (NODES[par.id].h ?? 150) + 52 : 112;
      const want = par ? { x: par.x + 50 * k, y: par.y + below * k } : { x: 70 * k + n * 22 * k, y: 28 * k + n * 22 * k };
      // a new window opens whole on the screen; only dragging may carry it partly off
      const wPx = wide() ? NODES[id].w * k : window.innerWidth - 30;
      const dock = NODES[id].dock === 'bottom-right';
      const x = dock ? (wide() ? Math.max(8, window.innerWidth - wPx - 16 * k) : Math.round((window.innerWidth - wPx) / 2)) : Math.max(8, Math.min(want.x, window.innerWidth - wPx - 8));
      const y = dock
        ? Math.max(8, window.innerHeight - 28 * k - (NODES[id].estH ?? 300) * k - 14 * k) // flush above the taskbar
        : Math.max(8, Math.min(want.y, window.innerHeight - 28 * k - 90 * k));
      return [...ws, { id, x, y, z: next, min: false, max: false }];
    });
  };

  // the media player is already there: tucked into the bottom right on a wide screen, as a small bar on a phone
  useEffect(() => {
    open('music');
    // on a phone it starts put away, as the small bar, so it doesn't cover the icons
    if (!window.matchMedia('(min-width:768px)').matches) setWins((ws) => ws.map((w) => (w.id === 'music' ? { ...w, min: true } : w)));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const close = (id: string) => {
    setWins((ws) => ws.filter((w) => w.id !== id));
    // hand focus back to the icon that opened it, so a keyboard reader isn't dropped at the top of the page
    requestAnimationFrame(() => document.querySelector<HTMLElement>(`[data-open="${id}"]`)?.focus());
  };
  const minimise = (id: string) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, min: true } : w)));
  const toggleMax = (id: string) => setWins((ws) => ws.map((w) => (w.id === id ? { ...w, max: !w.max } : w)));

  const task = (id: string) => (id === activeId ? minimise(id) : raise(id));

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape') return;
      if (ctx) return setCtx(null);
      if (startOpen) return setStartOpen(false);
      if (activeId) close(activeId);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startOpen, activeId, ctx]);

  useEffect(() => {
    if (!startOpen && !ctx) return;
    const away = (e: PointerEvent) => {
      if ((e.target as Element).closest('.ad-sm, .ad-start, .ad-ctx')) return;
      setStartOpen(false);
      setCtx(null);
    };
    document.addEventListener('pointerdown', away);
    return () => document.removeEventListener('pointerdown', away);
  }, [startOpen, ctx]);

  const startDrag = (e: ReactPointerEvent<HTMLDivElement>, w: Win) => {
    if (w.max || (e.target as Element).closest('.ad-tbtns')) return;
    const box = (e.currentTarget.closest('.ad-wrap') as HTMLElement).getBoundingClientRect();
    drag.current = { id: w.id, sx: e.clientX, sy: e.clientY, ox: w.x, oy: w.y, w: box.width };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const moveDrag = (e: ReactPointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d) return;
    const p = clampPos(d.ox + e.clientX - d.sx, d.oy + e.clientY - d.sy, d.w);
    setWins((ws) => ws.map((w) => (w.id === d.id ? { ...w, ...p } : w)));
  };
  const endDrag = () => {
    drag.current = null;
  };

  const hrefOf = (id: string) => {
    const n = NODES[id];
    if (id === 'app-almanac' && !milky) return '/'; // the almanac's own icon goes home, rather than reloading its absolute address
    return n.href!;
  };

  const clampPct = (x: number, y: number): [number, number] => [Math.max(4, Math.min(96, x)), Math.max(6, Math.min(94, y))];
  const iconDown = (e: ReactPointerEvent<HTMLElement>, id: string, x: number, y: number) => {
    if (!wide() || e.button !== 0) return;
    iconDrag.current = { id, sx: e.clientX, sy: e.clientY, ox: x, oy: y, moved: false };
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const iconMove = (e: ReactPointerEvent<HTMLElement>) => {
    const d = iconDrag.current;
    const box = desk.current?.getBoundingClientRect();
    if (!d || !box) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 5) return; // a press that barely moves is still a click
    d.moved = true;
    setDragId(d.id);
    const pos = clampPct(d.ox + (dx / box.width) * 100, d.oy + (dy / box.height) * 100);
    setIcons((prev) => ({ ...prev, [d.id]: pos }));
  };
  const iconUp = () => {
    const d = iconDrag.current;
    iconDrag.current = null;
    if (d?.moved) {
      suppress.current = true; // the click that follows the drop is not an open
      setTimeout(() => (suppress.current = false), 0);
      setDragId(null);
    }
  };

  const deskIcon = ({ id, x: dx, y: dy }: { id: string; x: number; y: number }) => {
    const n = NODES[id];
    const [x, y] = icons[id] ?? [dx, dy];
    const inner = (
      <span className="ad-icon-in">
        <Pic name={n.icon} shortcut={n.shortcut} />
        <span className="ad-lbl">{n.title}</span>
      </span>
    );
    const style = { '--x': `${x}%`, '--y': `${y}%` } as CSSProperties;
    const drag = {
      onPointerDown: (e: ReactPointerEvent<HTMLElement>) => iconDown(e, id, x, y),
      onPointerMove: iconMove,
      onPointerUp: iconUp,
      onPointerCancel: iconUp,
      onDragStart: (e: React.DragEvent) => e.preventDefault(),
      className: dragId === id ? 'ad-icon is-dragging' : 'ad-icon',
    };
    return n.kind === 'link' ? (
      <a
        key={id}
        href={hrefOf(id)}
        style={style}
        {...drag}
        onClick={(e) => {
          if (suppress.current) e.preventDefault();
        }}
      >
        {inner}
      </a>
    ) : (
      <button
        key={id}
        type="button"
        data-open={id}
        style={style}
        {...drag}
        onClick={() => {
          if (!suppress.current) open(id);
        }}
      >
        {inner}
      </button>
    );
  };

  const windowBody = (w: Win, n: Entry) => {
    if (n.kind === 'answer') {
      return (
        <div className="ad-client">
          <div className="ad-note is-answer">{n.body}</div>
        </div>
      );
    }
    if (n.kind === 'player') return <MediaPlayer onClose={() => close(w.id)} miniHost={phone ? miniHost : null} showMini={showMini} onExpand={() => raise('music')} />;
    if (n.kind === 'display') return <DisplayProps committed={scene} onApply={applyScene} onClose={() => close(w.id)} />;
    if (n.kind === 'folder') {
      const asList = !!lists[w.id];
      return (
        <>
          <MenuBar
            menus={[
              { label: 'file', items: [{ label: 'close', onSelect: () => close(w.id) }] },
              {
                label: 'view',
                items: [
                  { label: 'large icons', checked: !asList, onSelect: () => setLists((l) => ({ ...l, [w.id]: false })) },
                  { label: 'list', checked: asList, onSelect: () => setLists((l) => ({ ...l, [w.id]: true })) },
                ],
              },
              { label: 'help', items: [{ label: 'about slow garden', onSelect: () => open('why') }] },
            ]}
          />
          <div className="ad-client">
            <div
              className={asList ? 'ad-files is-list' : n.scatter ? 'ad-files is-scatter' : 'ad-files'}
              style={!asList && n.scatter ? ({ '--h': `${n.h ?? 150}px` } as CSSProperties) : undefined}
            >
              {n.children!.map((cid) => {
                const c = NODES[cid];
                const at = !asList ? n.scatter?.[cid] : undefined;
                const place = at ? ({ '--l': at[0], '--t': `${at[1]}px` } as CSSProperties) : undefined;
                const inner = (
                  <>
                    <Pic name={c.icon} size={asList ? 16 : 32} shortcut={c.shortcut} />
                    <span>{c.kind === 'link' ? c.title : c.title.replace(/\.txt$/, '')}</span>
                  </>
                );
                return c.kind === 'link' ? (
                  <a key={cid} className="ad-item" style={place} href={c.href} target="_blank" rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <button key={cid} type="button" className="ad-item" style={place} onClick={() => open(cid, w.id)}>
                    {inner}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="ad-status">
            <div className="ad-sf">{n.children!.length} object(s)</div>
            <div className="ad-sf">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={icon('sprout', 16)} alt="" width={16} height={16} />
              slow garden
            </div>
          </div>
        </>
      );
    }
    if (n.kind === 'text') {
      return (
        <>
          <MenuBar
            menus={[
              { label: 'file', items: [{ label: 'close', onSelect: () => close(w.id) }] },
              { label: 'help', items: [{ label: 'about slow garden', onSelect: () => raise('why') }] },
            ]}
          />
          <div className="ad-client">
            <div className="ad-note">{n.body}</div>
          </div>
        </>
      );
    }
    return null; // a link is never opened as a window
  };

  const resizable = (n: Entry) => n.kind === 'folder' || n.kind === 'text';

  return (
    <div ref={root} className={showMini ? 'ad-root has-mini' : 'ad-root'} data-wall={scene.wall} style={{ ...GLYPH_VARS, ...sceneStyle(scene, 'var(--z)') } as CSSProperties}>
      <VizLayer />
      <div
        ref={desk}
        className="ad-desk"
        onContextMenu={(e) => {
          // a right-click on bare desktop offers display properties; on an icon it is left alone
          if ((e.target as Element).closest('.ad-icon')) return;
          e.preventDefault();
          const k = scale();
          setStartOpen(false);
          setCtx({ x: Math.min(e.clientX, window.innerWidth - 170 * k), y: Math.min(e.clientY, window.innerHeight - 28 * k - 70 * k) });
        }}
      >
        {DESK.map(deskIcon)}
      </div>

      {ctx && (
        <div className="ad-ctx" role="menu" style={{ left: ctx.x, top: ctx.y }}>
          <div className="ad-ctx-in">
            <button
              type="button"
              role="menuitem"
              className="ad-pi"
              onClick={() => {
                setCtx(null);
                setIcons({});
              }}
            >
              arrange icons
            </button>
            <button
              type="button"
              role="menuitem"
              className="ad-pi"
              onClick={() => {
                setCtx(null);
                open('display');
              }}
            >
              display properties…
            </button>
            <div className="ad-psep" role="separator" />
            <a href={back} role="menuitem" className="ad-pi">
              go back
            </a>
          </div>
        </div>
      )}

      {wins.map((w) => {
        const n = NODES[w.id];
        const isActive = w.id === activeId;
        const canMax = resizable(n);
        const canMin = canMax || n.kind === 'player'; // a player can be put away while it plays
        return (
          <div
            key={w.id}
            className={w.max ? 'ad-wrap is-max' : 'ad-wrap'}
            data-active={isActive ? '' : undefined}
            data-min={w.min ? '' : undefined}
            data-player={n.kind === 'player' ? '' : undefined}
            style={{ '--x': `${w.x}px`, '--y': `${w.y}px`, zIndex: w.z } as CSSProperties}
            onPointerDown={() => !isActive && raise(w.id)}
          >
            <div role="dialog" aria-label={n.title} tabIndex={-1} className="ad-win" style={{ '--w': `${n.w}px` } as CSSProperties}>
              <div
                className="ad-titlebar"
                onPointerDown={(e) => startDrag(e, w)}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onDoubleClick={(e) => canMax && !(e.target as Element).closest('.ad-tbtns') && toggleMax(w.id)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={icon(n.icon, 16)} alt="" width={16} height={16} />
                <span className="ad-ttl">{n.title}</span>
                <span className="ad-tbtns">
                  {canMin && <button type="button" className="ad-tbtn" aria-label={`minimise ${n.title}`} style={{ '--g': GLYPHS.min } as CSSProperties} onClick={() => minimise(w.id)} />}
                  {canMax && (
                    <button
                      type="button"
                      className="ad-tbtn"
                      aria-label={`${w.max ? 'restore' : 'maximise'} ${n.title}`}
                      style={{ '--g': w.max ? GLYPHS.restore : GLYPHS.max } as CSSProperties}
                      onClick={() => toggleMax(w.id)}
                    />
                  )}
                  <button type="button" className="ad-tbtn is-close" aria-label={`close ${n.title}`} style={{ '--g': GLYPHS.close } as CSSProperties} onClick={() => (n.kind === 'player' && phone ? minimise(w.id) : close(w.id))} />
                </span>
              </div>
              {windowBody(w, n)}
            </div>
          </div>
        );
      })}

      {startOpen && (
        <div className="ad-sm" role="menu" aria-label="start menu">
          <div className="ad-sm-in">
            <div className="ad-sm-list">
              {START.map((id, i) => {
                if (id === null) return <div key={i} className="ad-smsep" role="separator" />;
                if (id === 'home')
                  return (
                    <a key={id} href={back} className="ad-smi" role="menuitem">
                      <Pic name="sprout" />
                      go back
                    </a>
                  );
                const n = NODES[id];
                return n.kind === 'link' ? (
                  <a key={id} href={hrefOf(id)} className="ad-smi" role="menuitem">
                    <Pic name={n.icon} shortcut={n.shortcut} />
                    {n.title}
                  </a>
                ) : (
                  <button key={id} type="button" className="ad-smi" role="menuitem" onClick={() => open(id)}>
                    <Pic name={n.icon} />
                    {n.title}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      <div ref={setMiniHost} className="ad-mini-host" />

      <div className="ad-taskbar" role="toolbar" aria-label="taskbar">
        <div className="ad-tb">
          <button type="button" className="ad-start" aria-expanded={startOpen} aria-haspopup="menu" onClick={() => setStartOpen((s) => !s)}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon('sprout', 16)} alt="" width={16} height={16} />
            start
          </button>
          <span className="ad-grip" aria-hidden="true" />
          <div className="ad-tasks">
            {wins.map((w) => {
              const n = NODES[w.id];
              return (
                <button key={w.id} type="button" className="ad-task" aria-pressed={w.id === activeId} title={n.title} onClick={() => task(w.id)}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={icon(n.icon, 16)} alt="" width={16} height={16} />
                  <span>{n.title}</span>
                </button>
              );
            })}
          </div>
          <div className="ad-tray" aria-hidden="true">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={icon('moon', 16)} alt="" width={16} height={16} />
            <span>{clock}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
