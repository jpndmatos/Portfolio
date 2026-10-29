// Run after build-project-covers.py. Requires sharp (or pass its module path).
const sharp = require(process.argv[2] || 'sharp');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const asset = (file) => path.join(root, 'assets', file);

(async () => {
  await sharp(asset('images/icon.svg')).resize(64, 64).png()
    .toFile(asset('images/favicon.png'));
  for (const width of [480, 800]) {
    await sharp(asset('images/joao-matos-portrait.png')).resize({ width })
      .webp({ quality: 86, effort: 6 }).toFile(asset(`images/portrait-${width}.webp`));
  }
  for (const name of ['company', 'eateasy', 'crimes', 'hdf5', 'split', 'overlap', 'image-desk', 'riftbound-angular']) {
    await sharp(asset(`projects/${name}-cover.svg`)).webp({ quality: 90, effort: 6 })
      .toFile(asset(`projects/${name}-cover.webp`));
  }
  console.log('Built optimized favicon, responsive portraits and project covers.');
})().catch((error) => { console.error(error); process.exitCode = 1; });
