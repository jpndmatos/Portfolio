"""Compose compact SVG covers from real project screenshots and artwork.

Source panels show original assets; vector details illustrate real controls
and workflows at a size that remains readable in a thumbnail.
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
            mime = {'.png': 'image/png', '.webp': 'image/webp'}.get(Path(file).suffix, 'image/jpeg')
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

    def graphic(self, markup):
        self.panels.append(markup)
        return self


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

Cover('madcoai', '#0c1926', {'ui': ('sources/madcoai.jpg', 1280, 720), 'mark': ('sources/madcoai-mark.webp', 3000, 3000)}) \
    .panel('mark', (490, 745, 2020, 1520), (30, 93, 230, 174)) \
    .panel('ui', (360, 361, 560, 63), (310, 40, 620, 70)) \
    .graphic('''<g font-family="Poppins,sans-serif">
      <text x="310" y="164" fill="#bfccd7" font-size="24">Research pipeline</text>
      <path d="M486 242h44m-10-8 10 8-10 8M706 242h44m-10-8 10 8-10 8" fill="none" stroke="#54778d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <g fill="#122638" stroke="#2b4559" stroke-width="2">
        <rect x="310" y="197" width="176" height="90" rx="12"/>
        <rect x="530" y="197" width="176" height="90" rx="12"/>
        <rect x="750" y="197" width="176" height="90" rx="12"/>
      </g>
      <g fill="#e3edf4" font-size="25" text-anchor="middle">
        <text x="398" y="252">Analysts</text><text x="618" y="252">Deep dive</text><text x="838" y="252">Council</text>
      </g>
    </g>''') \
    .save('MadCoAI: original project mark and ticker search with a simplified research pipeline diagram')

Cover('crimes', '#e9ddca', {'clue': ('crimes-evidence.jpg', 1280, 720), 'scene': ('sources/crimes-scene.jpg', 1280, 720)}) \
    .panel('scene', (0, 0, 1280, 720), (13, 33, 590, 300)) \
    .panel('clue', (277, 107, 355, 492), (624, 14, 238, 330), 5) \
    .save('Crimes Exemplares: illustrated room and the barber evidence card')

Cover('eateasy', '#f3f1e9', {'photo': ('sources/eateasy-restaurant.jpg', 1000, 667)}) \
    .panel('photo', (0, 0, 1000, 667), (0, 0, 540, 360), radius=0) \
    .graphic('''<g font-family="Poppins,sans-serif">
      <text x="574" y="65" fill="#18372c" font-size="32" font-weight="600">Mesa da Vila</text>
      <text x="574" y="99" fill="#51665c" font-size="21">Portuguesa / Lisboa</text>
      <g fill="#ffffff" stroke="#d5ddd5" stroke-width="2">
        <rect x="574" y="140" width="206" height="64" rx="8"/>
        <rect x="796" y="140" width="132" height="64" rx="8"/>
      </g>
      <g fill="#334d40" font-size="23">
        <text x="592" y="180">dd/mm/yyyy</text><text x="812" y="180" font-size="20">2 pessoas</text>
      </g>
      <rect x="574" y="231" width="354" height="65" rx="8" fill="#007a5e"/>
      <text x="751" y="271" fill="#ffffff" font-size="25" font-weight="500" text-anchor="middle">Confirmar reserva</text>
    </g>''') \
    .save('EatEasy: original restaurant photography with an enlarged illustration of the reservation controls')

print('Built nine composed covers from original project assets.')
