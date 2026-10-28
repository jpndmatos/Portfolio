"""Compose compact SVG covers from real project screenshots and artwork.

No product UI is generated: each panel is a view into an original asset.
Run from any directory with Python 3. Sources remain editable and replaceable.
"""
from pathlib import Path
from base64 import b64encode
from html import escape

ROOT = Path(__file__).resolve().parents[1]
ASSETS = ROOT / 'assets/projects'


class Cover:
    def __init__(self, name, background, sources):
        self.name = name
        self.defs = []
        self.panels = [f'<rect width="960" height="360" fill="{background}"/>']
        for key, (file, width, height) in sources.items():
            data = b64encode((ASSETS / file).read_bytes()).decode()
            mime = 'image/png' if file.endswith('.png') else 'image/jpeg'
            self.defs.append(f'<image id="{key}" width="{width}" height="{height}" href="data:{mime};base64,{data}"/>')

    def panel(self, source, crop, box, angle=0, radius=10):
        x, y, w, h = box
        # Match the clipping frame to the crop; otherwise SVG letterboxing can
        # expose adjacent controls from outside the selected source rectangle.
        scale = min(w / crop[2], h / crop[3])
        fitted_w, fitted_h = crop[2] * scale, crop[3] * scale
        x, y = x + (w-fitted_w)/2, y + (h-fitted_h)/2
        w, h = fitted_w, fitted_h
        clip = f'panel{len(self.panels)}'
        self.defs.append(f'<clipPath id="{clip}"><rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{radius}"/></clipPath>')
        rotate = f' transform="rotate({angle} {x+w/2} {y+h/2})"' if angle else ''
        self.panels.append(f'<g{rotate}><g clip-path="url(#{clip})"><svg x="{x}" y="{y}" width="{w}" height="{h}" viewBox="{" ".join(map(str,crop))}" preserveAspectRatio="xMidYMid meet"><use href="#{source}"/></svg></g></g>')
        return self

    def save(self, description):
        text = f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 960 360" width="960" height="360"><title>{escape(description)}</title><defs>{"".join(self.defs)}</defs>{"".join(self.panels)}</svg>\n'
        (ASSETS / f'{self.name}-cover.svg').write_text(text, encoding='utf-8')


Cover('split', '#10231c', {'ui': ('split.jpg', 1280, 800)}) \
    .panel('ui', (232, 95, 1024, 110), (24, 22, 912, 98)) \
    .panel('ui', (232, 400, 724, 199), (24, 140, 620, 170)) \
    .panel('ui', (972, 307, 284, 104), (674, 160, 262, 96), -3) \
    .panel('ui', (972, 411, 284, 104), (674, 266, 262, 96), -3) \
    .save('Split: expense totals, shared purchases and repayment controls')

Cover('image-desk', '#25231f', {'ui': ('sources/image-desk.jpg', 1280, 720), 'art': ('sources/image-preview.jpg', 1280, 720)}) \
    .panel('art', (345, 206, 590, 394), (28, 25, 470, 314), -3) \
    .panel('ui', (892, 262, 340, 227), (530, 30, 402, 268)) \
    .panel('ui', (37, 643, 267, 52), (552, 302, 300, 58)) \
    .save('Image Desk: landscape artwork, image formats, quality control and export result')

Cover('overlap', '#182335', {'ui': ('overlap.jpg', 1280, 800)}) \
    .panel('ui', (40, 310, 910, 227), (24, 40, 660, 165)) \
    .panel('ui', (40, 620, 910, 112), (24, 245, 660, 81)) \
    .panel('ui', (992, 131, 248, 210), (708, 58, 228, 193)) \
    .panel('ui', (992, 561, 248, 50), (708, 281, 228, 46)) \
    .save('Overlap: city timelines, meeting slider, shared availability and a saved meeting')

Cover('company', '#eeece7', {'art': ('company-heritage.png', 916, 426)}) \
    .panel('art', (30, 78, 230, 197), (22, 46, 225, 193), -4) \
    .panel('art', (672, 79, 224, 194), (719, 123, 218, 189), 4) \
    .panel('art', (281, 94, 355, 213), (256, 39, 448, 269)) \
    .save('Virtual heritage: mosaic identity, reconstructed Roman villa and interactive floor plan')

Cover('hdf5', '#162734', {'ui': ('hdf5-dashboard.jpg', 1265, 957)}) \
    .panel('ui', (46, 208, 523, 306), (22, 28, 496, 290)) \
    .panel('ui', (55, 575, 1157, 340), (542, 177, 396, 116)) \
    .panel('ui', (700, 270, 500, 240), (566, 10, 350, 168)) \
    .save('HDF5: temperature and humidity charts alongside the sensor heatmap')

Cover('riftbound', '#15151c', {'ui': ('sources/riftbound.jpg', 1280, 720)}) \
    .panel('ui', (376, 80, 702, 39), (280, 20, 656, 36)) \
    .panel('ui', (32, 139, 304, 207), (24, 97, 230, 157)) \
    .panel('ui', (383, 141, 121, 174), (288, 89, 177, 255), -5) \
    .panel('ui', (531, 141, 121, 174), (502, 73, 177, 255), 1) \
    .panel('ui', (679, 141, 121, 174), (718, 90, 177, 255), 6) \
    .save('Riftbound: domain and card-type filters, search and three collectible card artworks')

Cover('madcoai', '#080f1b', {'ui': ('sources/madcoai.jpg', 1280, 720)}) \
    .panel('ui', (589, 72, 106, 100), (30, 57, 140, 132)) \
    .panel('ui', (360, 361, 560, 63), (208, 35, 720, 81)) \
    .panel('ui', (405, 439, 538, 29), (222, 127, 692, 37)) \
    .panel('ui', (405, 514, 226, 172), (208, 183, 300, 164)) \
    .panel('ui', (893, 514, 226, 172), (550, 183, 300, 164)) \
    .save('MadCoAI: project mark, ticker search, popular assets and research tools')

Cover('crimes', '#e9ddca', {'clue': ('crimes-evidence.jpg', 1280, 720), 'scene': ('sources/crimes-scene.jpg', 1280, 720)}) \
    .panel('scene', (0, 0, 1280, 720), (13, 33, 590, 300)) \
    .panel('clue', (277, 107, 355, 492), (624, 14, 238, 330), 5) \
    .save('Crimes Exemplares: illustrated room and the barber evidence card')

Cover('eateasy', '#182820', {'ui': ('eateasy.jpg', 840, 868)}) \
    .panel('ui', (251, 75, 547, 49), (27, 17, 906, 58)) \
    .panel('ui', (252, 310, 260, 110), (27, 99, 423, 179)) \
    .panel('ui', (536, 310, 262, 110), (510, 99, 423, 179)) \
    .panel('ui', (267, 487, 230, 59), (43, 287, 390, 60)) \
    .panel('ui', (551, 487, 230, 59), (526, 287, 390, 60)) \
    .save('EatEasy: restaurant search, dining spaces, cuisines and booking details')

print('Built nine composed covers from original project assets.')
