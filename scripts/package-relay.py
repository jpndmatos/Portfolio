"""Package standalone source files; gitignore excludes dependencies, secrets and databases."""
from pathlib import Path
import subprocess
import sys
import zipfile

source = Path(sys.argv[1]).resolve()
output = Path(__file__).resolve().parents[1] / 'assets/downloads/relay-source.zip'
files = subprocess.check_output(['git', '-C', str(source), 'ls-files', '--cached', '--others', '--exclude-standard', '-z']).decode('utf-8').split('\0')
if not (source / 'Relay.sln').is_file() or not files:
    raise SystemExit('Expected standalone Relay repository.')
output.parent.mkdir(parents=True, exist_ok=True)
with zipfile.ZipFile(output, 'w', zipfile.ZIP_DEFLATED) as archive:
    for name in sorted(set(filter(None, files))):
        path = (source / name).resolve()
        if not path.is_relative_to(source) or not path.is_file():
            continue
        if any(part in {'data', 'node_modules', 'bin', 'obj', '.git', '.hallmark'} for part in path.relative_to(source).parts) or path.name.startswith('.env'):
            continue
        archive.write(path, 'relay/' + name)
print(f'Packaged {output.name}: {output.stat().st_size:,} bytes')
