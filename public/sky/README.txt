Star positions, magnitudes and colour (B-V) for the dream map's sky.
Trimmed from the d3-celestial project data (github.com/ofrohn/d3-celestial, BSD-3-Clause),
which is derived from the Hipparcos catalogue. Stars brighter than magnitude 6 only.
stars.json: { stars: [lon_deg(-180..180 = RA), dec_deg, magnitude, b-v], named: [name, lon, lat, mag] }

lines.json: { lines: [ [ [lon_deg, dec_deg], ... ], ... ] } the stick figures of the 88 constellations, from d3-celestial's constellations.lines.json (BSD-3-Clause), rounded to two decimals. Drawn only when the reader turns constellations on.
names (in lines.json): [name, lon_deg, dec_deg] for the 88 constellations, from d3-celestial's constellations.json (BSD-3-Clause). Shown when the map is zoomed in with constellations on. Planet positions are computed in the browser with astronomy-engine.
