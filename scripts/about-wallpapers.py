#!/usr/bin/env python3
"""
Draws the wallpapers for the about desktop's display properties: small tiles that repeat across the screen, and one
tall strip that is stretched to fit. They are in the same pixel manner as the icons and are all original, drawn from
the garden: stars over a night garden, daisies, moons, leaves, an evening sky.

    python3 scripts/about-wallpapers.py     # writes public/about/wallpapers/<id>.png

Every wallpaper is a see-through overlay, not a flat picture, so the colour the reader picks in display properties
always shows through it: a tint where the wallpaper wants the colour darker, and clear where it wants it left alone.
Tiles wrap at their edges, so nothing is cut when they repeat. Needs Pillow.
"""
import random
from pathlib import Path

from PIL import Image

OUT = Path(__file__).resolve().parent.parent / 'public' / 'about' / 'wallpapers'
OUT.mkdir(parents=True, exist_ok=True)


def rgb(h):
    h = h.lstrip('#')
    return (int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16))


def tile(n, tint=None):
    """A square, clear unless given a tint as (hex, alpha 0-255)."""
    im = Image.new('RGBA', (n, n), (0, 0, 0, 0))
    if tint:
        col, a = tint
        im.paste(rgb(col) + (a,), (0, 0, n, n))
    return im


def put(im, x, y, col, a=255):
    im.putpixel((x % im.width, y % im.height), rgb(col) + (a,))


def stamp(im, rows, x0, y0, key):
    """Lay a little pattern down on the tile, wrapping round the edges so it tiles."""
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch in key:
                put(im, x0 + i, y0 + j, key[ch])


def night():
    im = tile(64, ('06101a', 120))  # darkens whatever colour is chosen
    r = random.Random(11)
    for _ in range(46):
        put(im, r.randrange(64), r.randrange(64), r.choice(['b8d8f0', '9fc4e8', 'ffffff']), 70)
    for _ in range(16):
        put(im, r.randrange(64), r.randrange(64), r.choice(['cfe8ff', 'fff2b0', '9fc4e8']))
    spark = ['..X..', '..X..', 'XXWXX', '..X..', '..X..']
    for x, y in ((8, 10), (40, 30), (22, 50)):
        stamp(im, spark, x, y, {'X': '9fc8e8', 'W': 'ffffff'})
    return im


def daisies():
    im = tile(40)
    r = random.Random(5)
    for _ in range(60):  # grass
        x, y = r.randrange(40), r.randrange(40)
        put(im, x, y, r.choice(['0f3a20', '143f26']), 110)
        if r.random() < 0.4:
            put(im, x, y - 1, '0f3a20', 90)
    daisy = ['..W..', '.WWW.', 'WWYWW', '.WWW.', '..W..']
    for x, y in ((6, 6), (26, 22)):
        stamp(im, daisy, x, y, {'W': 'f4f4ea', 'Y': 'f2c93a'})
    return im


def moons():
    im = tile(48, ('0a1648', 105))
    r = random.Random(3)
    for _ in range(34):
        put(im, r.randrange(48), r.randrange(48), r.choice(['c9d6ff', 'ffffff']), 110)
    moon = ['..XXX.', '.XXX..', 'XXX...', 'XXX...', '.XXX..', '..XXX.']
    for x, y in ((6, 8), (30, 28)):
        stamp(im, moon, x, y, {'X': 'ffe98a'})
        stamp(im, ['..X'], x + 4, y + 2, {'X': 'fff6c8'})
    return im


def leaves():
    im = tile(32)
    r = random.Random(9)
    for _ in range(40):
        put(im, r.randrange(32), r.randrange(32), r.choice(['0f3a20', 'b8f0c8']), 60)
    leaf = ['...XX', '..XXX', '.XXXD', 'XXXD.', 'XDD..']
    for x, y in ((3, 4), (19, 18)):
        stamp(im, leaf, x, y, {'X': '7fd89a', 'D': '2f8a52'})
    leaf2 = ['XX...', 'XXX..', 'DXXX.', '.DXXX', '..DDX']
    for x, y in ((19, 3), (3, 19)):
        stamp(im, leaf2, x, y, {'X': '66c885', 'D': '256f42'})
    return im


def checker():
    im = Image.new('RGBA', (2, 2), (0, 0, 0, 0))
    put(im, 0, 0, 'ffffff', 34)
    put(im, 1, 1, 'ffffff', 34)
    return im


def weave():
    im = Image.new('RGBA', (8, 8), (0, 0, 0, 0))
    rows = ['XXXX.XXX', 'XXXX.XXX', 'XXXX.XXX', '....X...', 'XXX.XXXX', 'XXX.XXXX', 'XXX.XXXX', '..X.....']
    for j, row in enumerate(rows):
        for i, ch in enumerate(row):
            if ch == 'X':
                put(im, i, j, 'ffffff', 30)
    return im


def evening():
    """A tall strip, one pixel wide: night falling over the colour from the top, clear at the bottom. Stretched to the screen it bands."""
    alphas = [215, 190, 165, 140, 115, 92, 70, 50, 32, 18, 8, 0]
    im = Image.new('RGBA', (1, len(alphas) * 4))
    for i, a in enumerate(alphas):
        for k in range(4):
            im.putpixel((0, i * 4 + k), (8, 14, 40, a))
    return im


if __name__ == '__main__':
    for name, fn in (('night', night), ('daisies', daisies), ('moons', moons), ('leaves', leaves), ('checker', checker), ('weave', weave), ('dusk', evening)):
        fn().save(OUT / f'{name}.png')
    print('wrote', len(list(OUT.glob('*.png'))), 'wallpapers to', OUT)
