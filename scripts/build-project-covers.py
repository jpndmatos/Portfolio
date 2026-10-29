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

# Covers contain product imagery only; names and descriptions live in HTML.
Cover('split', '#0f1b16', {'ui': ('split.jpg', 1280, 800)}) \
    .panel('ui', (232, 95, 1024, 300), (24, 42, 912, 267)) \
    .save('Split: original expense summary and ledger controls')

Cover('image-desk', '#22211e', {'ui': ('sources/image-desk.jpg', 1280, 720)}) \
    .panel('ui', (40, 230, 263, 274), (112, 32, 310, 296)) \
    .panel('ui', (892, 262, 340, 227), (466, 32, 408, 296)) \
    .save('Image Desk: processed image card and export settings')

Cover('overlap', '#151e2d', {'ui': ('overlap.jpg', 1280, 800)}) \
    .panel('ui', (40, 310, 910, 227), (24, 66, 912, 228)) \
    .save('Overlap: city timeline and selected meeting time')

Cover('simsync', '#17171f', {}).graphic('''<g font-family="Poppins,sans-serif">
  <rect x="32" y="40" width="896" height="280" rx="12" fill="#19191f"/>
  <text x="58" y="91" font-size="27" fill="#f0f0f5">Participants</text>
  <rect x="58" y="122" width="623" height="59" rx="6" fill="#101016" stroke="#44404b" stroke-width="2"/>
  <text x="78" y="160" font-size="25" fill="#c8c3cf">participants.csv</text>
  <rect x="705" y="122" width="196" height="59" rx="6" fill="#2a2a33"/>
  <text x="803" y="160" text-anchor="middle" font-size="25" fill="#f0f0f5">Browse</text>
  <rect x="663" y="231" width="238" height="59" rx="6" fill="#e6007e"/>
  <text x="782" y="270" text-anchor="middle" font-size="27" fill="#ffffff">Preview</text>
</g>''').save('SIMsync: illustration of the desktop app’s CSV picker and Preview control; no event data or credentials')

Cover('company', '#eeece7', {'art': ('sources/company-reconstruction.png', 858, 796)}) \
    .panel('art', (312, 140, 530, 199), (0, 0, 960, 360), radius=0) \
    .save('Company Website: original courtyard reconstruction from its project gallery')

Cover('hdf5', '#162734', {'ui': ('hdf5-dashboard.jpg', 1265, 957)}) \
    .panel('ui', (32, 183, 1200, 340), (24, 51, 912, 258)) \
    .save('HDF5 Dashboard: original temperature and humidity chart panel')

Cover('riftbound', '#15151c', {str(i): (f'sources/riftbound-card-{i}.jpg', 320, 447) for i in range(1,4)}) \
    .panel('1', (0, 0, 320, 447), (120, 28, 216, 304)) \
    .panel('2', (0, 0, 320, 447), (372, 28, 216, 304)) \
    .panel('3', (0, 0, 320, 447), (624, 28, 216, 304)) \
    .save('Riftbound: original Riot Games card artwork used in the project’s card gallery')

Cover('madcoai', '#080f1b', {'ui': ('sources/madcoai.jpg', 1280, 720)}) \
    .panel('ui', (330, 355, 620, 119), (24, 68, 912, 175)) \
    .panel('ui', (425, 537, 180, 61), (74, 263, 300, 61)) \
    .panel('ui', (913, 537, 180, 61), (587, 263, 300, 61)) \
    .save('MadCoAI: original ticker search and research tool controls')

Cover('crimes', '#fffaf3', {'scene': ('sources/crimes-scene.jpg', 1280, 720)}) \
    .panel('scene', (20, 160, 1240, 349), (24, 51, 912, 258)) \
    .save('Crimes Exemplares: original interactive room artwork')

Cover('eateasy', '#202b25', {'ui': ('eateasy.jpg', 840, 868), 'photo': ('sources/eateasy-restaurant.jpg', 1000, 667)}) \
    .panel('photo', (60, 90, 900, 493), (24, 32, 548, 296)) \
    .panel('ui', (267, 487, 230, 195), (615, 42, 288, 264)) \
    .save('EatEasy: original restaurant photography and its booking card details')

print('Built ten image-only project covers.')
