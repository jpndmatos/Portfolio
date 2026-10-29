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
  <rect x="32" y="28" width="657" height="58" rx="6" fill="#101016" stroke="#44404b" stroke-width="2"/>
  <text x="54" y="65" font-size="25" fill="#ddd7e4">participants.csv</text>
  <rect x="715" y="28" width="213" height="58" rx="6" fill="#e6007e"/>
  <text x="821" y="66" text-anchor="middle" font-size="26" fill="#ffffff">Preview</text>
  <text x="34" y="121" font-size="21" fill="#8e8e9a">Sample preview</text>
  <path d="M32 144h430" stroke="#2dd4a8" stroke-width="3"/><path d="M498 144h430" stroke="#e6007e" stroke-width="3"/>
  <g font-size="30"><text x="45" y="195" fill="#2dd4a8">1</text><text x="511" y="195" fill="#ff3da5">1</text></g>
  <g font-size="24" fill="#b8b4c1"><text x="84" y="193">To add</text><text x="550" y="193">Updated</text></g>
  <path d="M32 217h430M498 217h430" stroke="#2a2a33" stroke-width="2"/>
  <g font-size="26" fill="#e0dbe5"><text x="45" y="274">alex@example.com</text><text x="511" y="274">sam@example.com</text></g>
</g>''').save('SIMsync: illustrative CSV preview results with clearly labelled sample data, using the app’s actual result categories and colours')

# Exact crops of the screenshots supplied by the user. No recreated UI.
# The company name is outside these crops; the portfolio title stays generic.
Cover('company', '#f7f5fc', {
    'hero': ('sources/company-actual-hero.png', 1918, 930),
}) \
    .panel('hero', (610, 302, 1253, 470), (0, 0, 960, 360), radius=0) \
    .panel('hero', (850, 21, 312, 54), (510, 145, 400, 70), radius=30) \
    .save('Company Website: a clean composition of the real 3D scan and original navigation from the supplied screenshot')

Cover('hdf5', '#162734', {'ui': ('hdf5-dashboard.jpg', 1265, 957)}) \
    .panel('ui', (32, 183, 1200, 340), (24, 51, 912, 258)) \
    .save('HDF5 Dashboard: original temperature and humidity chart panel')

Cover('riftbound', '#15151c', {str(i): (f'sources/riftbound-card-{i}.jpg', 320, 447) for i in range(1,4)}) \
    .panel('1', (0, 0, 320, 447), (120, 28, 216, 304)) \
    .panel('2', (0, 0, 320, 447), (372, 28, 216, 304)) \
    .panel('3', (0, 0, 320, 447), (624, 28, 216, 304)) \
    .save('Riftbound: original Riot Games card artwork used in the project’s card gallery')

madco = Cover('madcoai', '#04060d', {})
madco.graphic('''<g font-family="Poppins,sans-serif">
  <text x="32" y="56" font-size="30" fill="#e8eef4">Portfolio</text>
  <text x="783" y="54" font-size="21" fill="#7a92ad">Sample data</text>
  <rect x="32" y="82" width="587" height="242" rx="12" fill="#111827"/>
  <rect x="642" y="82" width="286" height="242" rx="12" fill="#111827"/>
  <g stroke="#263248" stroke-width="1.5"><path d="M84 126h510M84 206h510M84 286h510"/></g>
  <g fill="#7a92ad" font-size="18"><text x="43" y="132">108</text><text x="43" y="212">104</text><text x="43" y="292">100</text></g>
  <path d="M84 286h510" stroke="#818cf8" stroke-width="3"/>
  <text x="667" y="124" font-size="25" fill="#e8eef4">Holdings</text>
  <g fill="#b4c5d8" font-size="25"><text x="668" y="181">AAPL</text><text x="668" y="239">MSFT</text><text x="668" y="296">NVDA</text></g>
  <g fill="#e8eef4" font-size="24" text-anchor="end"><text x="901" y="181">40%</text><text x="901" y="239">35%</text><text x="901" y="296">25%</text></g>
  <g stroke="#263248" stroke-width="1.5"><path d="M665 200h240M665 258h240"/></g>
</g>''')
# Illustrative indexed history, never a claimed real account or market return.
series = [100,100.8,100.2,101.5,103.3,102.1,104,103,105.5,105,104.7,107.3,106.8,108]
points = ' '.join(f'{84+i*510/(len(series)-1):.1f},{286-(v-100)*20:.1f}' for i,v in enumerate(series))
madco.graphic(f'<polyline points="{points}" fill="none" stroke="#38bdf8" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>')
madco.graphic('''<g font-family="Poppins,sans-serif" font-size="20" fill="#7a92ad"><path d="M50 345h23" stroke="#38bdf8" stroke-width="3"/><text x="84" y="351">Total equity</text><path d="M270 345h23" stroke="#818cf8" stroke-width="3"/><text x="304" y="351">Invested</text></g>''').save('MadCoAI: portfolio chart and holdings illustration using sample data; indexed history and example allocations are not real performance')

Cover('crimes', '#9e151a', {'loading': ('sources/crimes-loading.png', 8000, 4500)}) \
    .panel('loading', (2000, 200, 4000, 3200), (255, 0, 450, 360), radius=0) \
    .save('Crimes Exemplares: original red loading screen with its title and cutlery artwork')

Cover('eateasy', '#202b25', {'ui': ('eateasy.jpg', 840, 868), 'photo': ('sources/eateasy-restaurant.jpg', 1000, 667)}) \
    .panel('photo', (60, 90, 900, 493), (24, 32, 548, 296)) \
    .panel('ui', (267, 487, 230, 195), (615, 42, 288, 264)) \
    .save('EatEasy: original restaurant photography and its booking card details')

print('Built ten image-only project covers.')
