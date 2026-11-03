const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'belokurikha-room-catalog');
const sourceDir = path.join(root, 'belokurikha-rooms');
const rooms = JSON.parse(fs.readFileSync(path.join(sourceDir, 'rooms-data.json'), 'utf8'));
const text = file => fs.readFileSync(path.join(dir, file), 'utf8');
assert(fs.existsSync(path.join(dir, 'index.html')), 'the separate room catalog page has been built');
const strip = s => s.replace(/<[^>]*>/g, '').replaceAll('&amp;', '&').replaceAll('&quot;', '"');
for (const file of ['index.html', 'block.html', 'variant-2/index.html', 'variant-2/block.html']) {
  assert(fs.existsSync(path.join(dir, file)), `the standalone design is built: ${file}`);
  const html = text(file);
  assert(!/<header\b|aria-roledescription="карусель"|br-rooms__track|br-rooms__controls|Все номера|Перейти к каталогу/.test(html), 'no site header, carousel or catalog link');
  assert(!/₽|руб\.|Цена \(|Оснащение номера/.test(html), 'no prices or amenities section');
  const cards = [...html.matchAll(/<article\b[^>]*data-room="([^"]+)"[^>]*>([\s\S]*?)<\/article>/g)];
  assert.deepEqual(cards.map(c => c[1]), rooms.map(r => r.id), 'all original records, in approved order');
  cards.forEach(([, id, card], i) => {
    const room = rooms[i];
    assert.equal(strip(card.match(/<h3>([\s\S]*?)<\/h3>/)[1]), room.title, 'exact room title');
    assert(card.includes(room.previewImage), 'exact matching thumbnail');
    assert.equal((card.match(new RegExp('data-open-room="' + id + '"', 'g')) || []).length, 2, 'photo and name open details separately');
    assert.equal((card.match(/data-book-room=/g) || []).length, 1, 'one independent booking CTA per card');
    assert(card.includes('data-book-room="' + id + '"'), 'booking carries correct room ID');
    assert(card.includes(room.area + ' м²'), 'area is retained');
    assert.equal((card.match(/<dt>Доп. мест<\/dt>/g) || []).length, room.extra === null ? 0 : 1, 'unknown extra capacity is not invented');
  });
  assert.equal((html.match(/<dialog\b/g) || []).length, 1, 'one static details dialog; booking dialog is created independently at runtime');
  assert(!/<form\b/.test(html), 'booking module owns its form, no duplicate inline form');
  assert(html.indexOf('class="br-rooms__description"') < html.indexOf('class="br-rooms__parameters"'), 'description above compact specs');
  for (const [, attribute, url] of html.matchAll(/\b(src|href)="([^"]+)"/g)) {
    if (/^https?:|^#/.test(url)) continue;
    const local = url.startsWith('/upload/belokurikha-room-catalog/')
      ? path.join(dir, url.split('?')[0].replace('/upload/belokurikha-room-catalog/', ''))
      : path.resolve(dir, path.dirname(file), url.split('?')[0]);
    assert(fs.existsSync(local), `${file}: local ${attribute} dependency ${url} exists`);
  }
}
const sameFile = file => {
  const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
  assert.equal(hash(path.join(dir, file)), hash(path.join(sourceDir, file)), file + ' is unchanged');
};
sameFile('rooms-data.js');
for (const room of rooms) for (const image of [room.previewImage, ...room.images]) sameFile(image);
console.log(`PASS: independent ${rooms.length}-room catalog; exact images/data; photo/title triggers; booking buttons; no header, prices or carousel`);
