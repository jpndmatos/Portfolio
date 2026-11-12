"""Use repository README screenshots as the single source for portfolio imagery.

Run with Python 3 and Pillow after refreshing the sibling repositories' captures.
Original files are preserved byte-for-byte for the enlarged preview. The grid
uses responsive WebP derivatives without cropping or upscaling.
"""
from pathlib import Path
from shutil import copyfile
import hashlib
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
DESTINATION = ROOT / 'assets/projects/screenshots'
PROJECTS = [
    ('extra-time', 'touchline/docs/goal-room-live.png'),
    ('split', 'split/docs/workspace.png'),
    ('overlap', 'overlap/docs/workspace.png'),
    ('image-desk', 'image-desk/docs/workspace.png'),
    ('eateasy', 'EatEasy/Projeto/docs/workspace.png'),
    ('relay', 'relay/docs/workspace.png'),
    ('simsync', 'SIMsync/docs/workspace.png'),
    ('hdf5-dashboard', 'HDF5-Dashboard/docs/desktop.jpg'),
    ('riftbound', 'riftbound-deck-builder/docs/builder-dark.jpg'),
    ('company-website', 'company-website-showcase/docs/workspace.png'),
    ('crimes-exemplares', 'P3/docs/scene.jpg'),
]


def sync():
    DESTINATION.mkdir(parents=True, exist_ok=True)
    manifest = {}
    for name, file in PROJECTS:
        source = ROOT.parent / file
        original = DESTINATION / (name + source.suffix)
        copyfile(source, original)
        with Image.open(source) as image:
            size = image.size
            variants = []
            for width in [640, 1100]:
                actual_width = min(width, image.width)
                thumbnail = image.convert('RGB').resize(
                    (actual_width, round(image.height * actual_width / image.width)),
                    Image.Resampling.LANCZOS,
                )
                target = DESTINATION / f'{name}-{width}.webp'
                thumbnail.save(target, 'WEBP', quality=88, method=6)
                variants.append({'file': target.name, 'width': actual_width, 'bytes': target.stat().st_size})
        manifest[name] = {
            'original': original.name, 'width': size[0], 'height': size[1],
            'sha256': hashlib.sha256(source.read_bytes()).hexdigest(), 'variants': variants,
        }
        print(f'{name}: {source.stat().st_size:,} B original; ' + ', '.join(f'{v["bytes"]:,} B at {v["width"]}px' for v in variants))
    (DESTINATION / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')


if __name__ == '__main__':
    sync()
