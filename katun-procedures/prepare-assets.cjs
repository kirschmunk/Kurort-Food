/* Optional asset preparation. Usage: NODE_PATH=... node prepare-assets.cjs /path/to/raw */
const fs = require('node:fs');
const path = require('node:path');
const sharp = require('sharp');
const source = process.argv[2];
if (!source) throw new Error('Pass a folder with source photographs.');
const assets = path.join(__dirname, 'assets');
fs.mkdirSync(path.join(assets, 'photos'), { recursive: true });
fs.mkdirSync(path.join(assets, 'icons'), { recursive: true });
const paths = {
  heart: '<path d="M48 78 17 47C0 27 25 8 42 25l6 6 6-6c17-17 42 2 25 22L48 78Z"/><path d="M18 48h17l7-13 9 27 8-14h20"/>',
  cross: '<rect x="14" y="14" width="68" height="68" rx="17"/><path d="M48 30v36M30 48h36"/><path d="M28 7v10M68 7v10M28 79v10M68 79v10"/>',
  lungs: '<path d="M48 13v32m0-12-9 9m9-9 9 9M36 28c-9-5-22 25-22 43 0 14 22 9 25 0V36c0-5-1-7-3-8Zm24 0c9-5 22 25 22 43 0 14-22 9-25 0V36c0-5 1-7 3-8Z"/>'
};
(async () => {
  for (const name of ['massage', 'doctor', 'physio', 'psychotherapy', 'spa', 'cosmetology', 'uvt', 'phyto', 'pool', 'baths']) {
    await sharp(path.join(source, name + '.jpg')).rotate().resize({ width: 1440, withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(assets, 'photos', name + '.jpg'));
  }
  fs.copyFileSync(path.join(source, 'logo.png'), path.join(assets, 'logo.png'));
  for (const [name, drawing] of Object.entries(paths)) {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="192" height="192" viewBox="0 0 96 96"><g fill="none" stroke="#3d785e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${drawing}</g></svg>`;
    await sharp(Buffer.from(svg)).png().toFile(path.join(assets, 'icons', name + '.png'));
  }
  console.log('Prepared 10 JPEG photographs and 3 PNG icons. No inline SVG in the page.');
})();
