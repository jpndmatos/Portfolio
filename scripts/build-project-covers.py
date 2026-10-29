"""Compose compact SVG covers from real project screenshots and artwork.

Source panels show original assets; vector details illustrate real controls
and workflows at a size that remains readable in a thumbnail.
Run from any directory with Python 3. Sources remain editable and replaceable.
Each cover has one job, the project's own palette and real sample content.
Keep explanatory labels at 23 px or larger on the 960 x 360 artboard.
"""
from pathlib import Path
from base64 import b64encode
from html import escape
import xml.etree.ElementTree as ET

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

    def brand(self, name, colour, icon=None):
        x = 32
        if icon:
            root = ET.parse(ASSETS / 'sources' / icon).getroot()
            root.set('x', '32')
            root.set('y', '20')
            root.set('width', '32')
            root.set('height', '32')
            self.graphic(ET.tostring(root, encoding='unicode'))
            x = 78
        self.graphic(f'<text x="{x}" y="47" font-family="Poppins,sans-serif" font-size="29" font-weight="600" fill="{colour}">{escape(name)}</text>')
        return self


# The identity header is deliberately secondary to the original product UI.
# Use real screenshots/artwork, one clear screen region and no invented data.
Cover('split', '#0f1b16', {'ui': ('split.jpg', 1280, 800)}) \
    .brand('Split', '#d6ecde', 'split-icon.svg') \
    .panel('ui', (232, 95, 1024, 300), (32, 76, 896, 260)) \
    .save('Split: original expense summary and ledger controls, with its existing green identity')

Cover('image-desk', '#22211e', {'ui': ('sources/image-desk.jpg', 1280, 720)}) \
    .brand('Image Desk', '#f1d6bc', 'image-desk-icon.svg') \
    .panel('ui', (40, 230, 263, 274), (122, 76, 300, 260)) \
    .panel('ui', (892, 262, 340, 227), (470, 76, 390, 260)) \
    .save('Image Desk: the original processed image card and export settings, with its orange identity')

Cover('overlap', '#151e2d', {'ui': ('overlap.jpg', 1280, 800)}) \
    .brand('Overlap', '#c1d3fa', 'overlap-icon.svg') \
    .panel('ui', (40, 310, 910, 227), (32, 89, 896, 224)) \
    .save('Overlap: original city timeline and selected meeting time, with its blue identity')

Cover('simsync', '#17171f', {}).brand('SIMsync', '#ff58b2').graphic('''<g font-family="Poppins,sans-serif">
  <path d="M184 99h104l34 34v172H184zM288 99v35h34" fill="#222229" stroke="#7e7688" stroke-width="3" stroke-linejoin="round"/>
  <text x="253" y="228" font-size="40" text-anchor="middle" fill="#f0f0f5">CSV</text>
  <path d="M397 204h103m-17-17 17 17-17 17" fill="none" stroke="#ed3d9e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="575" y="228" fill="#f03a9c" font-size="65" font-weight="600">Brella</text>
</g>''').save('SIMsync: CSV import into Brella, retaining the desktop tool’s pink and charcoal identity')

Cover('company', '#eeece7', {'art': ('company-heritage.png', 916, 426)}) \
    .brand('Company Website', '#353934') \
    .panel('art', (301, 141, 315, 93), (32, 76, 896, 265)) \
    .save('Company Website: the original Roman villa virtual visit from its project gallery')

Cover('hdf5', '#162734', {'ui': ('hdf5-dashboard.jpg', 1265, 957)}) \
    .brand('HDF5 Dashboard', '#c6def1', 'hdf5-icon.svg') \
    .panel('ui', (32, 183, 1200, 340), (32, 76, 896, 254)) \
    .save('HDF5 Dashboard: the original paired temperature and humidity chart panel')

Cover('riftbound', '#15151c', {'ui': ('sources/riftbound.jpg', 1280, 720)}) \
    .brand('Riftbound', '#d6b66b') \
    .panel('ui', (376, 80, 877, 244), (32, 76, 896, 250)) \
    .save('Riftbound: original card gallery and search interface, retaining its gold and charcoal identity')

Cover('madcoai', '#0c1926', {'ui': ('sources/madcoai.jpg', 1280, 720)}) \
    .brand('MadCoAI', '#52b5d3') \
    .panel('ui', (330, 355, 620, 119), (56, 113, 848, 163)) \
    .save('MadCoAI: original ticker search, Analyze button and popular tickers, with its cyan identity')

Cover('crimes', '#fffaf3', {'scene': ('sources/crimes-scene.jpg', 1280, 720)}) \
    .brand('Crimes Exemplares', '#423a32') \
    .panel('scene', (20, 160, 1240, 349), (32, 76, 896, 252)) \
    .save('Crimes Exemplares: original interactive room artwork, retaining its paper and ink identity')

Cover('eateasy', '#182820', {'ui': ('eateasy.jpg', 840, 868)}) \
    .brand('eatEasy', '#88ccb1', 'eateasy-icon.svg') \
    .panel('ui', (251, 294, 547, 250), (32, 76, 896, 252)) \
    .save('EatEasy: original restaurant cards, photography and cuisine labels, with its mint green identity')

print('Built ten product-led covers with the existing project identities.')
