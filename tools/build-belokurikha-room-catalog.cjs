const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const source = path.join(root, 'belokurikha-rooms');
const target = path.join(root, 'belokurikha-room-catalog');
const version = '20261103-catalog';
const rooms = JSON.parse(fs.readFileSync(path.join(source, 'rooms-data.json'), 'utf8'));
fs.mkdirSync(target, {recursive:true});
const copy = (from, to = from) => {
  const dest = path.join(target, to);
  fs.mkdirSync(path.dirname(dest), {recursive:true});
  fs.copyFileSync(path.join(source, from), dest);
};
copy('rooms.css', 'base.css');
copy('variant-2/variant.css', 'photo.css');
copy('rooms-data.js');
copy('rooms-data.json');
for (const font of ['Regular', 'Bold']) copy(`assets/fonts/Acrom-${font}.woff`);
for (const room of rooms) for (const file of [room.previewImage, ...room.images]) copy(file);

const esc = value => String(value).replaceAll('&', '&amp;').replaceAll('"', '&quot;').replaceAll('<', '&lt;');
const title = value => esc(value).replace(/(\d класса \d|\S+ \d)\*$/, '<span class="br-rooms__rating">$1<sup>*</sup></span>');
const metric = (label, value) => `<div class="br-rooms__fact"><dt>${label}</dt><dd>${esc(value)}</dd></div>`;
const cards = rooms.map((room, i) => `    <article class="br-rooms__card" data-room="${room.id}">
      <div class="br-rooms__visual">
        <button class="br-rooms__photo" type="button" data-open-room="${room.id}" aria-haspopup="dialog" aria-label="Посмотреть номер: ${esc(room.title)}"><img src="${room.previewImage}" alt="${esc(room.title)} — санаторий «Белокуриха»" width="523" height="426" loading="${i < 4 ? 'eager' : 'lazy'}" decoding="async"></button>
        <div class="br-rooms__caption"><p class="br-rooms__subtitle">${esc(room.subtitle)}</p><h3><button class="br-catalog__name" type="button" data-open-room="${room.id}" aria-haspopup="dialog">${title(room.title)}</button></h3></div>
      </div>
      <div class="br-rooms__body"><dl class="br-rooms__facts">${metric('Площадь', room.area + ' м²')}${metric('Основных мест', room.main)}${room.extra == null ? '' : metric('Доп. мест', room.extra)}</dl><button class="br-catalog__book" type="button" data-book-room="${room.id}" data-room-title="${esc(room.title)}" aria-label="Забронировать: ${esc(room.title)}">Забронировать</button></div>
    </article>`).join('\n');
const original = fs.readFileSync(path.join(source, 'index.html'), 'utf8');
const dialog = original.match(/<dialog\b[\s\S]*?<\/dialog>/)[0]
  .replace(/\s*<a class="br-rooms__all"[\s\S]*?<\/a>/, '');
const section = `<section class="br-rooms br-rooms--photo br-catalog" data-br-catalog aria-labelledby="br-catalog-heading">
  <div class="br-catalog__intro"><h1 id="br-catalog-heading">Номера</h1><p>Вдвоём, с семьёй или только для себя — найдите свой вариант отдыха.</p></div>
  <div class="br-catalog__grid">
${cards}
  </div>
  ${dialog}
</section>`;
const styles = prefix => ['base.css', 'photo.css', 'catalog.css'].map(file => `<link rel="stylesheet" href="${prefix}${file}?v=${version}">`).join('\n');
const scripts = prefix => `<script src="${prefix}rooms-data.js?v=${version}" defer></script>\n<script src="${prefix}catalog.js?v=${version}" defer data-rooms-base="${prefix || './'}"></script>`;
const upload = '/upload/belokurikha-room-catalog/';
fs.writeFileSync(path.join(target, 'index.html'), `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Номера — санаторий «Белокуриха»</title>
${styles('')}
<style>body{margin:0;background:#fff;padding:52px 0 64px}@media(max-width:580px){body{padding:28px 0 36px}}</style>
${scripts('')}
</head><body><main>${section}</main></body></html>\n`);
fs.writeFileSync(path.join(target, 'block.html'), `${styles(upload)}\n${section.replaceAll('src="assets/', `src="${upload}assets/`)}\n${scripts(upload)}\n`);
const refinedDir = path.join(target, 'variant-2');
fs.mkdirSync(refinedDir, {recursive:true});
const refinedVersion = '20261103-refined';
const bookingIcon = '<span class="br-catalog__book-label">Забронировать</span><span class="br-catalog__book-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span>';
const refine = html => html
  .replace('br-rooms--photo br-catalog"', 'br-rooms--photo br-catalog br-catalog--refined"')
  .replaceAll('>Забронировать</button>', `>${bookingIcon}</button>`);
const refinedDemo = refine(fs.readFileSync(path.join(target, 'index.html'), 'utf8'))
  .replace('<title>Номера — санаторий «Белокуриха»</title>', '<title>Номера — Белокуриха · вариант 2</title>')
  .replaceAll('href="base.css', 'href="../base.css')
  .replaceAll('href="photo.css', 'href="../photo.css')
  .replaceAll('href="catalog.css', 'href="../catalog.css')
  .replaceAll('src="rooms-data.js', 'src="../rooms-data.js')
  .replaceAll('src="catalog.js', 'src="../catalog.js')
  .replaceAll('src="assets/', 'src="../assets/')
  .replace('<style>body', `<link rel="stylesheet" href="refined.css?v=${refinedVersion}">\n<style>body`);
fs.writeFileSync(path.join(refinedDir, 'index.html'), refinedDemo);
const refinedBlock = refine(fs.readFileSync(path.join(target, 'block.html'), 'utf8'))
  .replace('<section ', `<link rel="stylesheet" href="${upload}variant-2/refined.css?v=${refinedVersion}">\n<section `);
fs.writeFileSync(path.join(refinedDir, 'block.html'), refinedBlock);
// The approved first catalog gets the independent booking module.
// Keep the alternative design and homepage carousels unchanged.
const bookingVersion = '20261103-popup1';
const demoFile = path.join(target, 'index.html');
fs.writeFileSync(demoFile, fs.readFileSync(demoFile, 'utf8').replace('</body>', `<script src="booking-popup.js?v=${bookingVersion}" defer data-booking-mode="demo"></script></body>`));
fs.appendFileSync(path.join(target, 'block.html'), `<script src="${upload}booking-popup.js?v=${bookingVersion}" defer data-booking-mode="live"></script>\n`);
console.log(`Built standalone catalog: ${rooms.length} rooms, local photos, no changes to the existing carousels`);
