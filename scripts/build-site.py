"""Validate the portfolio and package only public site files for GitHub Pages."""
from html.parser import HTMLParser
from pathlib import Path
import shutil
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / '.build' / 'public'

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.references = []
    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        for attr in ('src', 'href'):
            if attrs.get(attr):
                self.references.append(attrs[attr])
        for candidate in attrs.get('srcset', '').split(','):
            if candidate.strip():
                self.references.append(candidate.strip().split()[0])

def build():
    page = Page()
    text = (ROOT / 'index.html').read_text(encoding='utf-8')
    page.feed(text)
    for ref in page.references:
        url = urlsplit(ref)
        if url.scheme or url.netloc or not url.path:
            continue
        target = (ROOT / unquote(url.path)).resolve()
        if not target.is_relative_to(ROOT) or not target.exists():
            raise ValueError(f'Missing or non-public reference: {ref}')
        if url.path.startswith('demo/'):
            raise ValueError(f'Use the complete project, not a portfolio export: {ref}')
    OUTPUT.mkdir(parents=True, exist_ok=True)
    # Clean only the known generated public directory, never a source folder.
    for child in OUTPUT.iterdir():
        if child.is_dir(): shutil.rmtree(child)
        else: child.unlink()
    for name in ['index.html', 'script.js', 'style', 'assets']:
        source = ROOT / name
        if source.is_dir():
            shutil.copytree(source, OUTPUT / name, ignore=shutil.ignore_patterns('relay-source.zip'))
        else:
            shutil.copy2(source, OUTPUT / name)
    for name in ['CNAME', '.nojekyll', 'robots.txt', 'sitemap.xml']:
        if (ROOT / name).exists(): shutil.copy2(ROOT / name, OUTPUT / name)
    print(f'Checked {len(page.references)} references. Published files: {sum(p.is_file() for p in OUTPUT.rglob("*"))}')

if __name__ == '__main__': build()
