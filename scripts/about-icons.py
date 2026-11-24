#!/usr/bin/env python3
"""
Draws the icons for the about desktop (/about) in the manner of a late-90s desktop: 32x32 and 16x16, no anti-aliasing,
a black outline, flat colours with a lit top-left edge and a shaded bottom-right edge, and dithered bands where a
surface turns. The 16px set is drawn natively, not shrunk from the 32px one, so its edges stay one clean pixel.

    python3 scripts/about-icons.py          # writes public/about/icons/<name>-32.png and -16.png
    python3 scripts/about-icons.py --check  # also audits every file (see audit())

The drawings are original. The four app icons are redrawn from the apps' own artwork: the snail's spiral, the swirl
card, the lotus and the smiley. Needs Pillow and numpy.
"""
import math
import re
import random
import sys
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'public' / 'about' / 'icons'
OUT.mkdir(parents=True, exist_ok=True)


def c(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16), 255)


K = c('000000')
WHITE = c('ffffff')
# paper and steel
P1, P2, P3 = c('ffffff'), c('ececec'), c('c6c6c6')
S1, S2, S3, S4, S5 = c('f3f6fa'), c('c9d3de'), c('9aaabb'), c('677a8e'), c('3c4a5c')
# folder yellow
Y1, Y2, Y3, Y4, Y5 = c('fffcd6'), c('f8eb98'), c('ead466'), c('bf9f30'), c('8c7420')
# brass
B1, B2, B3, B4 = c('fff6a8'), c('f2d24c'), c('c9a124'), c('8d6c12')
# blue
BL1, BL2, BL3 = c('5a78ff'), c('2a3fd0'), c('14208c')
# garden greens
G1, G2, G3, G4 = c('c4ec7a'), c('7ec04a'), c('4a8f2c'), c('27601a')
# terracotta
T1, T2, T3, T4 = c('f6b48a'), c('dc8450'), c('b45e30'), c('84401c')
GREY = c('808080')


class Cv:
    """A square canvas of pixels, and the small set of operations the drawings are made from."""

    def __init__(self, n=32):
        self.n = n
        self.p = np.zeros((n, n, 4), np.uint8)

    # shapes, as boolean masks (PIL's drawing is aliased, which is what we want)
    def _m(self, fn):
        im = Image.new('L', (self.n, self.n), 0)
        fn(ImageDraw.Draw(im))
        return np.array(im) > 0

    def poly(self, pts):
        return self._m(lambda d: d.polygon(pts, fill=255))

    def ell(self, x0, y0, x1, y1):
        return self._m(lambda d: d.ellipse([x0, y0, x1, y1], fill=255))

    def rect(self, x0, y0, x1, y1):
        return self._m(lambda d: d.rectangle([x0, y0, x1, y1], fill=255))

    def rrect(self, x0, y0, x1, y1, r):
        return self._m(lambda d: d.rounded_rectangle([x0, y0, x1, y1], radius=r, fill=255))

    def line(self, pts, w=1):
        return self._m(lambda d: d.line(pts, fill=255, width=w))

    def dots(self, pts):
        m = np.zeros((self.n, self.n), bool)
        for x, y in pts:
            if 0 <= x < self.n and 0 <= y < self.n:
                m[y, x] = True
        return m

    def pattern(self, rows, x0, y0):
        return self.dots([(x0 + i, y0 + j) for j, r in enumerate(rows) for i, ch in enumerate(r) if ch == 'X'])

    # painting
    def paint(self, m, col):
        self.p[m] = col

    def shift(self, m, dx, dy):
        o = np.zeros_like(m)
        n = self.n
        ys, xs = slice(max(0, dy), n + min(0, dy)), slice(max(0, dx), n + min(0, dx))
        yd, xd = slice(max(0, -dy), n + min(0, -dy)), slice(max(0, -dx), n + min(0, -dx))
        o[ys, xs] = m[yd, xd]
        return o

    def bevel(self, m, hi, lo):
        """Light the edges that face the top left, shade the ones that face the bottom right."""
        lit = m & (~self.shift(m, 1, 0) | ~self.shift(m, 0, 1))
        dim = m & (~self.shift(m, -1, 0) | ~self.shift(m, 0, -1))
        if hi is not None:
            self.p[lit & ~dim] = hi
        if lo is not None:
            self.p[dim] = lo

    def grad(self, m, cols, axis='y', dither=True):
        """Fill a mask in bands of colour, with a checkerboard where one band gives way to the next."""
        ys, xs = np.where(m)
        if not len(ys):
            return
        vals = ys if axis == 'y' else xs if axis == 'x' else ys + xs
        lo, hi = vals.min(), vals.max()
        span = max(1, hi - lo + 1)
        n = len(cols)
        for y, x, val in zip(ys, xs, vals):
            pos = (val - lo) / span * n
            band = min(n - 1, int(pos))
            frac = pos - band
            if dither:
                if frac > 0.72 and band < n - 1 and (x + y) % 2 == 0:
                    band += 1
                elif frac < 0.28 and band > 0 and (x + y) % 2 == 1:
                    band -= 1
            self.p[y, x] = cols[band]

    def erode(self, m):
        return m & self.shift(m, 1, 0) & self.shift(m, -1, 0) & self.shift(m, 0, 1) & self.shift(m, 0, -1)

    def rim(self, m, dark, light=None):
        """Draw a shape's own edge in a dark colour, and a lit line just inside it on the top left."""
        inner = self.erode(m)
        self.p[m & ~inner] = dark
        if light is not None:
            self.p[inner & (~self.shift(inner, 1, 0) | ~self.shift(inner, 0, 1))] = light

    def sil(self):
        return self.p[..., 3] > 0

    def outline(self, col=K, shadow=True):
        s = self.sil()
        edge = ~s & (self.shift(s, 1, 0) | self.shift(s, -1, 0) | self.shift(s, 0, 1) | self.shift(s, 0, -1))
        self.p[edge] = col
        if shadow:
            full = self.sil()
            ring = self.shift(full, 1, 1) & ~full
            yy, xx = np.indices(full.shape)
            self.p[ring & ((xx + yy) % 2 == 0)] = GREY

    def image(self):
        return Image.fromarray(self.p)


def ellipse_poly(cx, cy, rx, ry, angle, steps=32):
    """A rotated ellipse as a polygon, so a petal or a leaf can lean."""
    a = math.radians(angle)
    pts = []
    for i in range(steps):
        t = 2 * math.pi * i / steps
        x, y = rx * math.cos(t), ry * math.sin(t)
        pts.append((cx + x * math.cos(a) - y * math.sin(a), cy + x * math.sin(a) + y * math.cos(a)))
    return pts


# ── 32px ───────────────────────────────────────────────────────────────────

def folder32(badge=False):
    v = Cv()
    back = v.poly([(3, 8), (12, 8), (14, 10), (28, 10), (28, 26), (3, 26)])
    v.grad(back, [Y3, Y4], 'y', False)
    v.paint(v.rect(6, 11, 25, 14), P1)
    v.paint(v.rect(8, 12, 22, 12), P3)
    front = v.poly([(3, 14), (28, 14), (28, 27), (3, 27)])
    v.grad(front, [Y2, Y3, Y3, Y4], 'y')
    v.bevel(front, Y1, Y5)
    v.paint(v.rect(5, 16, 26, 16), Y1)
    if badge:  # the legal folder: a small gold seal on the front
        seal = v.ell(18, 16, 28, 26)
        v.grad(seal, [B1, B2, B3], 'd')
        v.rim(seal, B4)
        inner = v.ell(21, 19, 25, 23)
        v.paint(inner, B3)
        v.bevel(inner, B4, B1)
    v.outline()
    return v


def doc_page(v):
    page = v.poly([(7, 3), (20, 3), (25, 8), (25, 28), (7, 28)])
    v.grad(page, [P1, P1, P2, P3], 'y')
    v.bevel(page, P1, P3)
    fold = v.poly([(20, 3), (25, 8), (20, 8)])
    v.paint(fold, P3)
    v.bevel(fold, P1, GREY)
    return page


def doc32():
    v = Cv()
    doc_page(v)
    for y, w in ((11, 13), (14, 9), (17, 13), (20, 11), (23, 13)):
        v.paint(v.rect(10, y, 10 + w - 1, y), BL2)
    v.outline()
    return v


def terms32():
    v = Cv()
    doc_page(v)
    for y, w in ((11, 13), (14, 9), (17, 6)):
        v.paint(v.rect(10, y, 10 + w - 1, y), c('222222'))
    # ribbon tails, then a scalloped gold seal
    v.paint(v.poly([(15, 24), (13, 29), (16, 27), (18, 29), (19, 24)]), c('d02020'))
    v.paint(v.poly([(20, 24), (19, 29), (22, 27), (25, 29), (24, 24)]), c('a01818'))
    seal = v.ell(14, 16, 25, 27)
    for a in range(0, 360, 45):
        cx, cy = 19.5 + 5.6 * math.cos(math.radians(a)), 21.5 + 5.6 * math.sin(math.radians(a))
        seal |= v.ell(round(cx) - 1, round(cy) - 1, round(cx), round(cy))
    v.grad(seal, [B1, B2, B3], 'd')
    v.bevel(seal, B1, B4)
    inner = v.ell(17, 19, 22, 24)
    v.paint(inner, B3)
    v.bevel(inner, B4, B1)
    v.outline()
    return v

def lock32():
    v = Cv()
    ring = v.rrect(9, 3, 22, 18, 5) & ~v.rrect(12, 6, 19, 18, 3)
    v.grad(ring, [S1, S2, S3, S4], 'x')
    v.bevel(ring, WHITE, S5)
    body = v.rrect(5, 14, 26, 28, 2)
    v.grad(body, [B1, B2, B2, B3, B3, B4], 'y')
    v.bevel(body, B1, B4)
    v.paint(v.rect(7, 16, 24, 16), B1)
    v.paint(v.dots([(8, 18), (23, 18), (8, 25), (23, 25)]), B4)  # rivets
    key = v.ell(13, 18, 18, 23) | v.poly([(14, 22), (17, 22), (18, 26), (13, 26)])
    v.paint(key, c('1c1408'))
    v.outline()
    return v


def bubble32(glyph):
    v = Cv()
    body = v.ell(2, 2, 28, 24) | v.poly([(8, 20), (5, 30), (16, 23)])
    v.grad(body, [P1, P1, P2, P3], 'd')
    v.bevel(body, P1, S3)
    if glyph == 'q':
        g = v.pattern(['..XXXXX..', '.XXXXXXX.', 'XXX...XXX', 'XX.....XX', '.......XX', '......XXX', '.....XXX.', '....XXX..', '....XX...', '....XX...', '.........', '....XX...', '....XX...'], 10, 5)
    else:
        g = v.pattern(['...XXX...', '...XXX...', '...XXX...', '.........', '.XXXXX...', '...XXX...', '...XXX...', '...XXX...', '...XXX...', '...XXX...', '..XXXXX..', '.XXXXXXX.'], 10, 5)
    v.grad(g, [BL1, BL2, BL3], 'y', False)
    v.outline()
    return v


def coffee32():
    v = Cv()
    saucer = v.ell(2, 23, 27, 29)
    v.grad(saucer, [P1, P2, P3], 'y', False)
    v.bevel(saucer, P1, S3)
    handle = v.rrect(19, 12, 28, 23, 4) & ~v.rrect(21, 14, 26, 21, 2)
    v.grad(handle, [P1, P2, P3], 'x')
    v.bevel(handle, P1, S3)
    cup = v.poly([(5, 11), (22, 11), (21, 25), (7, 25)])
    v.grad(cup, [P1, P1, P2, P3, S2], 'x')
    v.bevel(cup, None, S3)
    rim = v.ell(5, 9, 22, 14)
    v.paint(rim, P1)
    v.bevel(rim, P1, S3)
    v.grad(v.ell(7, 10, 20, 13), [c('7a4a26'), c('4e2c14')], 'y', False)
    v.paint(v.dots([(9, 11), (10, 11)]), c('b07a4a'))
    leaf = v.poly([(10, 17), (14, 15), (13, 19)])  # a leaf on the cup, for the garden
    v.grad(leaf, [G2, G3], 'd', False)
    v.paint(v.line([(10, 19), (12, 17)]), G4)
    v.outline()
    # steam, after the outline so it stays a fine grey line rather than a black one
    for x0 in (11, 17):
        for j, dx in enumerate((0, 1, 1, 0, -1, -1, 0, 1)):
            v.paint(v.dots([(x0 + dx, 1 + j)]), GREY)
    return v

def sprout32():
    v = Cv()
    pot = v.poly([(8, 21), (24, 21), (22, 29), (10, 29)])
    v.grad(pot, [T1, T2, T2, T3, T4], 'x')
    rim = v.rect(7, 19, 25, 22)
    v.grad(rim, [T1, T2, T3, T4], 'x')
    v.bevel(rim, T1, T4)
    v.paint(v.rect(9, 19, 23, 19), c('3a2412'))  # soil
    stem = v.poly([(15, 11), (17, 11), (17, 19), (15, 19)])
    v.grad(stem, [G2, G3, G4], 'x', False)
    left = v.poly([(15, 15), (9, 15), (4, 11), (3, 6), (8, 7), (13, 10)])
    right = v.poly([(17, 12), (22, 12), (27, 8), (28, 2), (22, 3), (18, 7)])
    for leaf in (left, right):
        v.grad(leaf, [G1, G2, G3], 'd')
        v.bevel(leaf, G1, G4)
    v.paint(v.line([(14, 14), (6, 8)]), G4)
    v.paint(v.line([(18, 11), (26, 4)]), G4)
    v.outline()
    return v


def monitor32():
    v = Cv()
    base = v.poly([(8, 25), (23, 25), (26, 29), (5, 29)])
    v.grad(base, [P2, P3, S3], 'y', False)
    v.bevel(base, P1, S4)
    neck = v.rect(13, 22, 18, 25)
    v.grad(neck, [P2, S3], 'x', False)
    case = v.rect(3, 3, 28, 22)
    v.grad(case, [P1, P2, P3], 'd')
    v.bevel(case, WHITE, S4)
    screen = v.rect(6, 6, 25, 18)
    v.grad(screen, [c('2b8a70'), c('1f6f5b'), c('155647')], 'y')
    v.paint(v.rect(9, 8, 17, 13), P2)  # a tiny window and taskbar on the screen
    v.paint(v.rect(9, 8, 17, 9), BL2)
    v.paint(v.rect(6, 17, 25, 18), P3)
    v.paint(v.rect(7, 17, 9, 18), P2)
    v.paint(v.dots([(24, 20), (25, 20)]), c('4cd060'))  # the power light
    v.paint(v.line([(6, 6), (25, 6)]), c('0b2e26'))  # the glass, sunk into the frame
    v.paint(v.line([(6, 6), (6, 18)]), c('0b2e26'))
    v.outline()
    return v


def gift32():
    """A wrapped present, for "is it free?"."""
    v = Cv()
    R1, R2, R3 = c('ff7a7a'), c('d82a2a'), c('8c1818')
    box = v.rect(5, 14, 26, 28)
    v.grad(box, [R1, R2, R2, R3], 'x')
    v.bevel(box, c('ffb0b0'), R3)
    lid = v.rect(4, 10, 27, 15)
    v.grad(lid, [R1, R2, R3], 'x')
    v.bevel(lid, c('ffc0c0'), R3)
    ribbon = v.rect(14, 10, 17, 28)
    v.grad(ribbon, [B1, B2, B3], 'x', False)
    v.bevel(ribbon, B1, B4)
    for box_ in (v.ell(8, 3, 15, 10), v.ell(16, 3, 23, 10)):
        v.grad(box_, [B1, B2, B3], 'd', False)
        v.rim(box_, B4)
    knot = v.rect(13, 7, 18, 11)
    v.grad(knot, [B1, B2, B3], 'x', False)
    v.rim(knot, B4)
    v.outline()
    return v


def diary32():
    """A locked diary, for "who sees what i write?"."""
    v = Cv()
    cover = v.rrect(5, 3, 26, 29, 2)
    v.grad(cover, [c('3f9a72'), c('2f7a5a'), c('25644a'), c('1b4d3a')], 'x')
    v.bevel(cover, c('7fd0a8'), c('0f3024'))
    spine = v.rect(6, 4, 10, 28)
    v.paint(spine, c('1b4d3a'))
    for y in (7, 12, 17, 22):  # the stitching down the spine
        v.paint(v.dots([(8, y), (8, y + 1)]), c('a8e0c0'))
    label = v.rect(13, 7, 23, 14)
    v.paint(label, c('fff6d8'))
    v.rim(label, c('b89c50'))
    v.paint(v.rect(15, 9, 21, 9), c('6a5a30'))
    v.paint(v.rect(15, 11, 19, 11), c('6a5a30'))
    clasp = v.rect(21, 19, 26, 25)  # a small brass clasp, closed
    v.grad(clasp, [B1, B2, B3], 'y', False)
    v.rim(clasp, B4)
    v.paint(v.dots([(23, 21), (23, 22)]), c('1c1408'))
    v.outline()
    return v


def tarot32():
    """A tarot card with a moon and a star, for "is the tarot real?"."""
    v = Cv()
    navy, gold = c('1a2a5c'), c('e8c24a')
    card = v.rrect(7, 2, 24, 29, 2)
    v.grad(card, [c('22367a'), navy, c('121e48')], 'y', False)
    frame = v.rrect(9, 4, 22, 27, 1)
    v.paint(frame, gold)
    v.paint(v.rrect(10, 5, 21, 26, 1), navy)
    v.paint(v.rrect(10, 5, 21, 26, 1) & v.rect(10, 5, 21, 6), c('2a3f8c'))
    moon = v.ell(11, 8, 20, 17) & ~v.ell(14, 7, 23, 16)
    v.grad(moon, [c('fff2a8'), gold, c('c8a030')], 'd', False)
    v.paint(v.pattern(['..X..', '.XXX.', 'XXXXX', '.XXX.', '.X.X.'], 14, 19), gold)
    v.paint(v.dots([(12, 21), (19, 12), (18, 24), (12, 14)]), c('fff2a8'))
    v.bevel(card, c('5a72c0'), c('0a1230'))
    v.outline()
    return v


# ── the four app icons, built from the apps' own artwork ──────────────────────
# These are not drawn: each is cut out of what the app really uses and shrunk to pixels, so it looks as it does on
# enter.slowww.garden. Sources: the silver spiral's SVG (enter), the swirl card's texture (almanac), milky's and root's
# own app icons. The two that live in other repos are kept in scripts/about-sources.

SRC = ROOT / 'scripts' / 'about-sources'


def _svg_mask(path, size=768):
    """Fill the paths of a simple SVG (M, L, C, Z only) as a boolean mask. A path wound the other way is a hole."""
    text = Path(path).read_text()
    box = [float(n) for n in re.search(r'viewBox="([^"]+)"', text).group(1).split()]
    polys = []
    for d in re.findall(r' d="([^"]+)"', text):
        toks = re.findall(r'[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?', d)
        i, cmd, cur, pts = 0, None, None, []
        while i < len(toks):
            if toks[i].isalpha():
                cmd = toks[i]
                i += 1
                continue
            if cmd in ('M', 'L'):
                cur = (float(toks[i]), float(toks[i + 1]))
                i += 2
                pts.append(cur)
            elif cmd == 'C':
                p1, p2, p3 = [(float(toks[i + k]), float(toks[i + k + 1])) for k in (0, 2, 4)]
                i += 6
                for k in range(1, 17):
                    t = k / 16
                    u = 1 - t
                    pts.append(tuple(u ** 3 * cur[j] + 3 * u * u * t * p1[j] + 3 * u * t * t * p2[j] + t ** 3 * p3[j] for j in (0, 1)))
                cur = p3
            else:
                i += 1
        polys.append(pts)
    k = size / box[2]

    def area(q):
        return sum(q[a][0] * q[(a + 1) % len(q)][1] - q[(a + 1) % len(q)][0] * q[a][1] for a in range(len(q))) / 2

    mask = Image.new('L', (size, size), 0)
    for q in polys:
        layer = Image.new('L', (size, size), 0)
        ImageDraw.Draw(layer).polygon([(x * k, y * k) for x, y in q], fill=255)
        hole = area(q) * area(polys[0]) < 0
        mask = Image.composite(Image.new('L', (size, size), 0 if hole else 255), mask, layer)
    return np.array(mask) > 127


def _cutout(rgb, bg, tol):
    """What is not the flat background colour, with any holes inside it filled in."""
    from scipy import ndimage

    m = np.abs(rgb.astype(int) - np.array(bg)).sum(2) > tol
    lab, n = ndimage.label(m)
    if n > 1:
        m = lab == (np.argmax(ndimage.sum(m, lab, range(1, n + 1))) + 1)
    return ndimage.binary_fill_holes(m)


def _fit(rgb, mask, box):
    """Crop to the shape and shrink it so its longer side is `box` pixels, averaging as it goes."""
    ys, xs = np.where(mask)
    x0, x1, y0, y1 = xs.min(), xs.max() + 1, ys.min(), ys.max() + 1
    mean = rgb[mask].mean(0)
    flat = np.where(mask[..., None], rgb, mean)[y0:y1, x0:x1].astype('uint8')  # no background bleeding into the edges
    m = (mask[y0:y1, x0:x1] * 255).astype('uint8')
    h, w = m.shape
    sc = box / max(w, h)
    nw, nh = max(1, round(w * sc)), max(1, round(h * sc))
    return Image.fromarray(flat).resize((nw, nh), Image.BOX), Image.fromarray(m).resize((nw, nh), Image.BOX), (x0, y0, x1, y1)


def _quantise(img, colors):
    return np.array(img.quantize(colors=colors, method=Image.MEDIANCUT, dither=Image.NONE).convert('RGB'))


def _put(v, rgb, alpha):
    h, w = alpha.shape
    x0, y0 = (v.n - w) // 2, (v.n - h) // 2
    for j in range(h):
        for i in range(w):
            if alpha[j, i]:
                v.p[y0 + j, x0 + i] = (*[int(q) for q in rgb[j, i]], 255)


def enter32():
    """slow garden: the silver spiral, its outer end climbing into a head with two feelers, from the very SVG the enter page loads."""
    v = Cv()
    mask = _svg_mask(SRC / 'enter-spiral.svg')
    ys, xs = np.where(mask)
    crop = mask[ys.min():ys.max() + 1, xs.min():xs.max() + 1]
    h, w = crop.shape
    sc = 28 / max(w, h)
    nw, nh = round(w * sc), round(h * sc)
    cov = np.array(Image.fromarray((crop * 255).astype('uint8')).resize((nw, nh), Image.BOX)) / 255.0
    shape = np.zeros((v.n, v.n), bool)
    x0, y0 = (v.n - nw) // 2, (v.n - nh) // 2
    shape[y0:y0 + nh, x0:x0 + nw] = cov > 0.38  # a little under half, so the thin feelers survive
    v.grad(shape, [S2, S1, S2, S3, S4], 'y', False)  # silver, with a bright band across the middle
    v.bevel(shape, WHITE, S5)
    v.outline()
    return v


def almanac32():
    """almanac: the swirl card, its face the very texture the card on the bracelet wears, in a navy edge."""
    v = Cv()
    v.paint(v.rrect(5, 1, 26, 30, 3), c('1c2a6b'))
    tex = Image.open(ROOT / 'public' / 'card-back-swirl.png').convert('RGB')
    w, h = tex.size
    cw = round(h * 20 / 28)
    tex = tex.crop(((w - cw) // 2, 0, (w + cw) // 2, h)).resize((20, 28), Image.BOX)
    lum = np.array(tex.convert('L'))
    ramp = [c('15244e'), c('5f8a58'), c('b8e063')]
    face = np.digitize(lum, [95, 150])
    for j in range(28):
        for i in range(20):
            v.p[2 + j, 6 + i] = ramp[face[j, i]]
    v.outline(c('0a1230'))
    return v


def milky32():
    """milky: the blue lotus with its gold bead, cut out of milky's own app icon."""
    v = Cv()
    src = np.array(Image.open(ROOT / 'public' / 'dreams' / 'icons' / 'icon-512.png').convert('RGB'))
    mask = _cutout(src, (243, 243, 92), 90)
    rgb, a, _ = _fit(src, mask, 29)
    alpha = np.array(a) > 120
    shades = _quantise(rgb, 9)
    # the gold bead is only a few pixels, so colour reduction would fold it into the blues: find it in the source and keep it
    r, g_, b_ = (src[..., k].astype(int) for k in range(3))
    gold = (r > 70) & (r > g_ * 0.7) & (r > b_ * 1.5) & mask
    ys, xs = np.where(gold)
    x0, x1, y0, y1 = np.where(mask)[1].min(), np.where(mask)[1].max() + 1, np.where(mask)[0].min(), np.where(mask)[0].max() + 1
    gimg = Image.fromarray((gold[y0:y1, x0:x1] * 255).astype('uint8')).resize(rgb.size, Image.BOX)
    gm = (np.array(gimg) > 255 * 0.3) & alpha
    gys, gxs = np.where(gm)
    for j, i in zip(gys, gxs):
        shades[j, i] = c('f0cc48')[:3] if j <= gys.min() + (gys.max() - gys.min()) // 2 else c('b48a22')[:3]
    _put(v, shades, alpha)
    v.outline()
    return v


def root32():
    """root: the glitter smiley, cut out of root's own app icon, with its eyes, smile and little ticks exactly as they are there."""
    from scipy import ndimage

    v = Cv()
    src = np.array(Image.open(SRC / 'root-icon-512.png').convert('RGB'))
    mask = _cutout(src, (163, 21, 110), 90)
    lum = src.astype(int).mean(2)
    inner = ndimage.binary_erosion(mask, iterations=14)  # the face's ink, not the sticker's own rim
    ink = (lum < 80) & inner
    flat = src.copy()
    flat[ink] = src[mask & ~ink].mean(0)
    rgb, a, (x0, y0, x1, y1) = _fit(flat, mask, 28)
    alpha = np.array(a) > 120
    shades = _quantise(rgb, 5)
    ink_img = Image.fromarray((ink[y0:y1, x0:x1] * 255).astype('uint8')).resize(rgb.size, Image.BOX)
    cov = np.array(ink_img) / 255.0
    rows = np.arange(cov.shape[0])[:, None]
    thr = np.where(rows < cov.shape[0] * 0.55, 0.27, 0.2)  # the eyes need a firm bar to stay soft ovals; the hair-thin smile a low one
    shades[(cov > thr) & alpha] = c('13220a')[:3]
    _put(v, shades, alpha)
    v.outline(shadow=False)
    return v


# ── 16px, drawn on their own grid ───────────────────────────────────────────

def folder16(badge=False):
    v = Cv(16)
    v.paint(v.poly([(1, 3), (6, 3), (7, 4), (14, 4), (14, 13), (1, 13)]), Y3)
    v.paint(v.rect(3, 5, 12, 6), P1)
    front = v.rect(1, 6, 14, 13)
    v.grad(front, [Y2, Y3], 'y', False)
    v.bevel(front, Y1, Y4)
    if badge:
        seal = v.ell(8, 7, 13, 12)
        v.grad(seal, [B1, B2, B3], 'd', False)
        v.rim(seal, B4)
    v.outline(shadow=False)
    return v


def doc_page16(v):
    page = v.poly([(3, 1), (9, 1), (12, 4), (12, 14), (3, 14)])
    v.grad(page, [P1, P2], 'y', False)
    v.bevel(page, P1, P3)
    v.paint(v.poly([(9, 1), (12, 4), (9, 4)]), P3)


def doc16():
    v = Cv(16)
    doc_page16(v)
    for y in (6, 8, 10, 12):
        v.paint(v.rect(5, y, 9, y), BL2)
    v.outline(shadow=False)
    return v


def terms16():
    v = Cv(16)
    doc_page16(v)
    v.paint(v.rect(5, 6, 9, 6), c('222222'))
    v.paint(v.rect(5, 8, 7, 8), c('222222'))
    v.paint(v.dots([(8, 13), (9, 13), (11, 13)]), c('d02020'))
    seal = v.ell(7, 8, 12, 13)
    v.grad(seal, [B1, B2, B3], 'd', False)
    v.outline(shadow=False)
    return v


def lock16():
    v = Cv(16)
    ring = v.rrect(4, 1, 11, 9, 3) & ~v.rrect(6, 3, 9, 9, 1)
    v.paint(ring, S3)
    v.bevel(ring, S1, S4)
    body = v.rect(2, 7, 13, 14)
    v.grad(body, [B1, B2, B3], 'y', False)
    v.bevel(body, B1, B4)
    v.paint(v.dots([(7, 10), (8, 10), (7, 11), (8, 11), (7, 12)]), c('1c1408'))
    v.outline(shadow=False)
    return v


def bubble16(glyph):
    v = Cv(16)
    body = v.ell(1, 1, 14, 10) | v.poly([(4, 9), (3, 14), (8, 10)])
    v.grad(body, [P1, P2], 'd', False)
    v.bevel(body, P1, S3)
    if glyph == 'q':
        g = v.pattern(['.XXXX.', 'XX..XX', '....XX', '...XX.', '..XX..', '......', '..XX..'], 5, 2)
    else:
        g = v.pattern(['.XX.', '....', 'XXX.', '.XX.', '.XX.', '.XX.', 'XXXX'], 6, 2)
    v.paint(g, BL2)
    v.outline(shadow=False)
    return v

def coffee16():
    v = Cv(16)
    saucer = v.ell(1, 12, 12, 14)
    v.grad(saucer, [P1, S3], 'y', False)
    v.paint(v.rrect(10, 5, 13, 10, 2) & ~v.rrect(11, 6, 12, 9, 0), P2)
    cup = v.poly([(2, 4), (11, 4), (10, 12), (3, 12)])
    v.grad(cup, [P1, P2, S2], 'x', False)
    v.paint(v.rect(3, 4, 10, 5), c('5a3418'))
    v.outline(shadow=False)
    v.paint(v.dots([(5, 1), (5, 2), (8, 0), (8, 1)]), GREY)
    return v

def sprout16():
    v = Cv(16)
    pot = v.poly([(4, 9), (11, 9), (10, 14), (5, 14)])
    v.grad(pot, [T2, T3], 'x', False)
    lip = v.rect(3, 8, 12, 9)
    v.paint(lip, T2)
    v.bevel(lip, T1, T4)
    v.paint(v.rect(7, 4, 8, 7), G3)
    v.paint(v.poly([(7, 6), (3, 5), (2, 2), (5, 2)]), G2)
    v.paint(v.poly([(8, 5), (12, 4), (13, 1), (10, 1)]), G1)
    v.outline(shadow=False)
    return v

def monitor16():
    v = Cv(16)
    case = v.rect(1, 1, 14, 10)
    v.grad(case, [P1, P3], 'd', False)
    v.bevel(case, WHITE, S4)
    v.paint(v.rect(3, 3, 12, 8), c('1f6f5b'))
    v.paint(v.rect(5, 4, 8, 5), P2)
    v.paint(v.rect(5, 11, 10, 12), P3)
    v.paint(v.rect(3, 13, 12, 13), S3)
    v.outline(shadow=False)
    return v


def moon16():
    v = Cv(16)
    m = v.ell(1, 1, 13, 13) & ~v.ell(5, -1, 17, 11)
    v.grad(m, [c('fff08a'), c('f2c93a')], 'd', False)
    v.bevel(m, c('fffbd0'), c('c49a1a'))
    v.outline(shadow=False)
    return v


def gift16():
    v = Cv(16)
    R1, R2, R3 = c('ff7a7a'), c('d82a2a'), c('8c1818')
    v.paint(v.rect(3, 8, 12, 14), R2)
    lid = v.rect(2, 5, 13, 8)
    v.paint(lid, R1)
    v.bevel(lid, c('ffc0c0'), R3)
    v.paint(v.rect(7, 5, 8, 14), B2)
    v.paint(v.ell(4, 1, 7, 5), B2)
    v.paint(v.ell(8, 1, 11, 5), B2)
    v.paint(v.rect(3, 14, 12, 14), R3)
    v.outline(shadow=False)
    return v


def diary16():
    v = Cv(16)
    cover = v.rrect(3, 1, 12, 14, 1)
    v.grad(cover, [c('3f9a72'), c('25644a')], 'x', False)
    v.paint(v.rect(4, 2, 5, 13), c('1b4d3a'))
    v.paint(v.rect(7, 3, 10, 6), c('fff6d8'))
    v.paint(v.rect(8, 4, 9, 4), c('6a5a30'))
    v.paint(v.rect(10, 9, 12, 11), B2)
    v.paint(v.dots([(11, 10)]), c('1c1408'))
    v.outline(shadow=False)
    return v


def tarot16():
    v = Cv(16)
    navy, gold = c('1a2a5c'), c('e8c24a')
    card = v.rrect(3, 1, 12, 14, 1)
    v.paint(card, gold)
    v.paint(v.rrect(4, 2, 11, 13, 0), navy)
    moon = v.ell(5, 4, 10, 9) & ~v.ell(7, 3, 12, 8)
    v.paint(moon, gold)
    v.paint(v.dots([(7, 11), (8, 11), (7, 12), (8, 12)]), gold)
    v.outline(shadow=False)
    return v


def shortcut(n):
    """The little arrow a shortcut wears in its corner, on its own sheet so CSS can lay it over any icon."""
    v = Cv(n)
    if n == 32:
        box, inner = v.rect(1, 21, 10, 30), v.rect(2, 22, 9, 29)
        v.paint(box, K)
        v.paint(inner, WHITE)
        v.paint(v.poly([(4, 23), (8, 23), (8, 27)]), K)
        v.paint(v.line([(3, 28), (7, 24)]), K)
    else:
        box, inner = v.rect(0, 9, 6, 15), v.rect(1, 10, 5, 14)
        v.paint(box, K)
        v.paint(inner, WHITE)
        v.paint(v.poly([(2, 11), (4, 11), (4, 13)]), K)
        v.paint(v.line([(1, 14), (3, 12)]), K)
    return v


DRAW = {
    32: {
        'folder': folder32, 'doc': doc32, 'terms': terms32, 'lock': lock32,
        'question': lambda: bubble32('q'), 'info': lambda: bubble32('i'),
        'coffee': coffee32, 'sprout': sprout32, 'monitor': monitor32,
        'gift': gift32, 'diary': diary32, 'tarot': tarot32,
        'enter': enter32, 'almanac': almanac32, 'milky': milky32, 'root': root32,
        'shortcut': lambda: shortcut(32),
    },
    16: {
        'folder': folder16, 'doc': doc16, 'terms': terms16, 'lock': lock16,
        'question': lambda: bubble16('q'), 'info': lambda: bubble16('i'),
        'coffee': coffee16, 'sprout': sprout16, 'monitor': monitor16, 'moon': moon16,
        'gift': gift16, 'diary': diary16, 'tarot': tarot16,
        'shortcut': lambda: shortcut(16),
    },
}


def audit():
    """What an icon must be to count as properly built. Prints a line per file and returns the names that fail."""
    bad = []
    for f in sorted(OUT.glob('*.png')):
        a = np.array(Image.open(f).convert('RGBA'))
        alpha = a[..., 3]
        n = alpha.shape[0]
        s = alpha > 0
        problems = []
        if ((alpha > 0) & (alpha < 255)).any():
            problems.append('semi-transparent pixels')
        cols = len({tuple(p[:3]) for p in a[s]})
        if cols > (40 if n == 32 else 24):
            problems.append(f'{cols} colours')
        if not s.any():
            problems.append('empty')
        elif 'shortcut' not in f.name:
            gaps = 0
            for y in range(n):
                for x in range(n):
                    if not s[y, x]:
                        continue
                    for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1)):
                        nx, ny = x + dx, y + dy
                        if nx < 0 or ny < 0 or nx >= n or ny >= n or not s[ny, nx]:
                            if int(a[y, x, :3].sum()) > 190 and tuple(int(q) for q in a[y, x, :3]) != (128, 128, 128):
                                gaps += 1
                            break
            if gaps:
                problems.append(f'{gaps} edge pixels without an outline')
            for y in range(n):
                for x in range(n):
                    if s[y, x] and tuple(int(q) for q in a[y, x, :3]) != (128, 128, 128) and not any(0 <= x + dx < n and 0 <= y + dy < n and s[y + dy, x + dx] for dx, dy in ((1, 0), (-1, 0), (0, 1), (0, -1))):
                        problems.append(f'stray pixel at {x},{y}')
        print(f'{f.name:<18} {cols:>3} colours  {"OK" if not problems else "; ".join(problems)}')
        if problems:
            bad.append(f.name)
    return bad


if __name__ == '__main__':
    for old in OUT.glob('*.png'):
        old.unlink()
    for size, group in DRAW.items():
        for name, fn in group.items():
            fn().image().save(OUT / f'{name}-{size}.png')
    print('wrote', len(list(OUT.glob('*.png'))), 'icons to', OUT)
    if '--check' in sys.argv:
        sys.exit(1 if audit() else 0)
