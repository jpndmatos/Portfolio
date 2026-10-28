"""Compose compact SVG covers from real project screenshots and artwork.

Source panels show original assets; vector details illustrate real controls
and workflows at a size that remains readable in a thumbnail.
Run from any directory with Python 3. Sources remain editable and replaceable.
Each cover has one job, the project's own palette and real sample content.
Keep explanatory labels at 23 px or larger on the 960 × 360 artboard.
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


Cover('split', '#0f1b16', {'ui': ('split.jpg', 1280, 800)}) \
    .graphic('''<g font-family="Poppins,sans-serif">
      <text x="38" y="61" font-size="29" font-weight="600" fill="#edf4ef">Birthday dinner</text>
      <text x="40" y="106" font-size="23" fill="#b5c9bc">Total expenses</text>
      <text x="36" y="179" font-size="68" font-weight="600" fill="#edf4ef">€421.80</text>
      <path d="M40 208h418" stroke="#35483c" stroke-width="2"/>
      <g font-size="24" fill="#c5d5ca"><text x="40" y="251">Dinner ingredients</text><text x="40" y="303">Venue booking</text></g>
      <g font-size="25" fill="#edf4ef" text-anchor="end"><text x="457" y="251">€86.40</text><text x="457" y="303">€240.00</text></g>
      <rect x="510" y="35" width="412" height="288" rx="12" fill="#192a20"/>
      <text x="539" y="78" font-size="26" fill="#93cdb0">Repayments</text>
    </g>''') \
    .panel('ui', (972, 307, 284, 104), (538, 97, 355, 130)) \
    .graphic('''<g font-family="Poppins,sans-serif"><rect x="539" y="253" width="354" height="47" rx="6" fill="#2d4d3a"/><text x="716" y="284" text-anchor="middle" fill="#d5efdf" font-size="22">Split between 4 people</text></g>''') \
    .save('Split: a birthday dinner total, shared purchases and a repayment from Inês to João; values from the app sample')

Cover('image-desk', '#22211e', {'art': ('sources/image-preview.jpg', 1280, 720)}) \
    .panel('art', (345, 206, 590, 394), (30, 23, 464, 310)) \
    .graphic('''<g font-family="Poppins,sans-serif">
      <rect x="52" y="267" width="165" height="44" rx="6" fill="#202821"/><text x="134" y="297" fill="#f1eee5" font-size="23" text-anchor="middle">PNG / 364 KB</text>
      <path d="M510 174h48m-12-12 12 12-12 12" fill="none" stroke="#e7b98f" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>
      <rect x="585" y="40" width="343" height="280" rx="12" fill="#302b25"/>
      <path d="M615 70h33l13 13v36h-46zM648 70v14h13" stroke="#dbae86" stroke-width="3" fill="none" stroke-linejoin="round"/>
      <text x="683" y="105" font-size="31" fill="#f3eee8" font-weight="600">WebP</text>
      <text x="613" y="186" font-size="64" fill="#f3eee8" font-weight="600">17 KB</text>
      <text x="615" y="225" font-size="23" fill="#cbbbaf">1600 × 1067 px</text>
      <rect x="612" y="251" width="288" height="47" rx="6" fill="#f0bf96"/>
      <text x="756" y="283" font-size="23" fill="#352319" text-anchor="middle">Download image</text>
    </g>''') \
    .save('Image Desk: the actual landscape sample converted from a 364 KB PNG to a 17 KB WebP')

overlap = Cover('overlap', '#151e2d', {})
overlap.graphic('''<g font-family="Poppins,sans-serif"><text x="34" y="58" fill="#e7edf8" font-size="28" font-weight="600">Working hours</text></g>''')
for row, (city, time, start, end) in enumerate([('Lisbon', '14:00', 2, 12), ('New York', '10:00', 6, 15), ('London', '14:00', 2, 12)]):
    y = 111 + row * 75
    overlap.graphic(f'<g font-family="Poppins,sans-serif"><text x="34" y="{y+31}" fill="#e7edf8" font-size="25">{city}</text><text x="620" y="{y+31}" fill="#cad9f7" font-size="25" text-anchor="end">{time}</text></g>')
    for column in range(16):
        fill = '#375c55' if start <= column < end else '#263347'
        overlap.graphic(f'<rect x="{226+column*21}" y="{y}" width="19" height="40" rx="2" fill="{fill}"/>')
overlap.graphic('''<rect x="430" y="106" width="24" height="200" rx="5" fill="#92b5f4" fill-opacity=".17" stroke="#a4c0fb" stroke-width="3"/>
  <g font-family="Poppins,sans-serif"><rect x="659" y="34" width="269" height="291" rx="12" fill="#202d42"/><text x="684" y="80" fill="#b5c9ec" font-size="22">Available for all</text><text x="680" y="159" fill="#eef3fc" font-size="62" font-weight="600">14:00</text><text x="684" y="202" fill="#b5c9ec" font-size="23">Lisbon time</text><rect x="684" y="247" width="219" height="53" rx="6" fill="#9ebeff"/><text x="793" y="282" fill="#142540" font-size="24" text-anchor="middle">Save time</text></g>''').save('Overlap: the same meeting at 14:00 in Lisbon and London and 10:00 in New York, with shared working hours highlighted')

Cover('simsync', '#17171f', {}).graphic('''<g font-family="Poppins,sans-serif">
  <rect x="32" y="35" width="450" height="290" rx="12" fill="#222229"/>
  <text x="58" y="83" fill="#f0f0f5" font-size="29" font-weight="600">participants.csv</text>
  <path d="M58 108h398M58 172h398M58 236h398M272 122v167" stroke="#44404b" stroke-width="2"/>
  <g font-size="24" fill="#b8b4c1"><text x="58" y="148">CSV field</text><text x="298" y="148">Brella field</text><text x="58" y="212">Email</text><text x="58" y="277">Group</text></g>
  <g font-size="24" fill="#ff58b2"><text x="298" y="212">Email</text><text x="298" y="277">Group</text></g>
  <path d="M510 177h66m-14-14 14 14-14 14" fill="none" stroke="#ed3d9e" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
  <text x="617" y="126" fill="#f0f0f5" font-size="50" font-weight="600">Brella</text>
  <text x="619" y="177" fill="#b8b4c1" font-size="24">Preview mappings</text>
  <rect x="617" y="226" width="308" height="61" rx="7" fill="#e6007e"/>
  <text x="771" y="266" fill="#ffffff" font-size="26" text-anchor="middle">Sync data</text>
</g>''').save('SIMsync: CSV email and group mapping preview before syncing participant data to Brella')

Cover('company', '#eeece7', {'art': ('company-heritage.png', 916, 426)}) \
    .panel('art', (281, 94, 355, 213), (24, 24, 614, 312)) \
    .panel('art', (672, 79, 224, 194), (662, 50, 274, 237)) \
    .graphic('''<text x="799" y="328" font-family="Poppins,sans-serif" font-size="23" text-anchor="middle" fill="#383a35">Explore in 3D</text>''') \
    .save('Virtual heritage: mosaic identity, reconstructed Roman villa and interactive floor plan')

Cover('hdf5', '#162734', {'ui': ('hdf5-dashboard.jpg', 1265, 957)}) \
    .panel('ui', (47, 267, 520, 247), (24, 95, 380, 181)) \
    .panel('ui', (86, 612, 1117, 281), (443, 110, 493, 124)) \
    .graphic('''<g font-family="Poppins,sans-serif" fill="#dce8ef" font-size="27"><text x="27" y="66">Temperature</text><text x="447" y="66">Sensor heatmap</text></g><text x="447" y="288" font-family="Poppins,sans-serif" fill="#a3bdcc" font-size="23">Position × elapsed time</text>''') \
    .save('HDF5: recorded temperature readings alongside the full sensor heatmap')

Cover('riftbound', '#15151c', {'ui': ('sources/riftbound.jpg', 1280, 720)}) \
    .graphic('''<g font-family="Poppins,sans-serif"><text x="33" y="73" font-size="31" font-weight="600" fill="#d6b66b">Deck builder</text><path d="M34 101h249" stroke="#484030" stroke-width="2"/><g fill="#d4d2cc" font-size="23"><text x="34" y="151">Blazing Scorcher</text><text x="34" y="209">Brazen Buccaneer</text><text x="34" y="267">Chemtech Enforcer</text></g></g>''') \
    .panel('ui', (383, 141, 121, 138), (320, 52, 180, 256), -5) \
    .panel('ui', (531, 141, 121, 138), (526, 34, 180, 256)) \
    .panel('ui', (679, 141, 121, 138), (732, 52, 180, 256), 5) \
    .save('Riftbound: three original card artworks with their names in a simplified deck-building illustration')

Cover('madcoai', '#0c1926', {'ui': ('sources/madcoai.jpg', 1280, 720)}) \
    .panel('ui', (360, 361, 560, 63), (32, 24, 894, 101)) \
    .graphic('''<g font-family="Poppins,sans-serif">
      <path d="M376 166h74v61h75M376 227h149M376 288h74v-61m63-10 12 10-12 10" fill="none" stroke="#54778d" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>
      <g fill="#122638" stroke="#2b4559" stroke-width="2">
        <rect x="32" y="140" width="344" height="52" rx="7"/>
        <rect x="32" y="201" width="344" height="52" rx="7"/>
        <rect x="32" y="262" width="344" height="52" rx="7"/>
        <rect x="526" y="135" width="400" height="187" rx="12"/>
      </g>
      <g fill="#e3edf4" font-size="25">
        <text x="54" y="175">Macro Analyst</text><text x="54" y="236">Fundamental Analyst</text><text x="54" y="297">Quant Analyst</text>
        <text x="555" y="182" font-size="30" font-weight="600">Research report</text>
      </g>
      <path d="M554 201h342" stroke="#2b4559" stroke-width="2"/>
      <g fill="#9cb6ce" font-size="24"><text x="555" y="242">Fundamentals</text><text x="555" y="285">Risk review</text></g>
    </g>''') \
    .save('MadCoAI: actual ticker search with an illustration of macro, fundamental and quant research contributing to a report')

Cover('crimes', '#e9ddca', {'clue': ('crimes-evidence.jpg', 1280, 720), 'scene': ('sources/crimes-scene.jpg', 1280, 720)}) \
    .panel('scene', (178, 126, 930, 520), (20, 22, 635, 316)) \
    .panel('clue', (277, 107, 355, 492), (684, 24, 225, 312), 4) \
    .save('Crimes Exemplares: illustrated room and the barber evidence card')

Cover('eateasy', '#182820', {'photo': ('sources/eateasy-restaurant.jpg', 1000, 667)}) \
    .panel('photo', (0, 0, 1000, 667), (0, 0, 540, 360), radius=0) \
    .graphic('''<g font-family="Poppins,sans-serif">
      <text x="574" y="65" fill="#edf5ef" font-size="32" font-weight="600">Mesa da Vila</text>
      <text x="574" y="99" fill="#a3c2af" font-size="21">Portuguesa / Lisboa</text>
      <g fill="#22392d" stroke="#3d5547" stroke-width="2">
        <rect x="574" y="140" width="206" height="64" rx="8"/>
        <rect x="796" y="140" width="132" height="64" rx="8"/>
      </g>
      <g fill="#d8e7dc" font-size="23">
        <text x="592" y="180">dd/mm/yyyy</text><text x="812" y="180" font-size="20">2 pessoas</text>
      </g>
      <rect x="574" y="231" width="354" height="65" rx="8" fill="#88ccb1"/>
      <text x="751" y="271" fill="#162c20" font-size="25" font-weight="500" text-anchor="middle">Confirmar reserva</text>
    </g>''') \
    .save('EatEasy: original restaurant photography with an enlarged illustration of the reservation controls')

print('Built ten curated covers from original project assets and task illustrations.')
