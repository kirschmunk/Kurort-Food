const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const text = html.replace(/<script[\s\S]*?<\/script>/gi, '');

assert.match(html, /<title>Питание в санатории «Катунь»<\/title>/);
assert.match(html, /class="katun-food-page"/);
assert.doesNotMatch(html, /Сибирь|sibir-san|Сибири/);
assert.match(text, /Премиум-меню/);
assert.match(text, /Шведский стол «Люкс»/);
assert.match(text, /Шведский стол/);
assert.match(text, /Лечебные диеты/);
assert.match(text, /врач-диетолог составит для вас персональное меню/);
assert.match(text, /Дети до 2 лет питаются бесплатно/);
assert.match(html, /https:\/\/www\.katun-san\.ru\/price\//);
assert.match(html, /tel:88007075186/);

for (const panelId of ['panel-premium', 'panel-lux', 'panel-buffet', 'panel-diet']) {
  assert.match(html, new RegExp(`id="${panelId}"`), `panel ${panelId} exists`);
}

const iconCount = (html.match(/<svg\b/g) || []).length;
assert.ok(iconCount >= 10, 'food formats, production and services include inline SVG icons');
assert.match(html, /\.production-icon svg\{width:/);
assert.match(html, /\.tab-icon svg\{width:/);

for (const match of html.matchAll(/(?:src|url)\(['"]?(assets\/[^)'"\s]+)['"]?\)?/g)) {
  assert.ok(fs.existsSync(path.join(root, match[1])), `local asset ${match[1]} exists`);
}

assert.match(html, /aria-controls="panel-premium"/);
assert.match(html, /addEventListener\('click'/);
assert.match(html, /galleryNext/);

const inlineScript = html.match(/<script>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(inlineScript, 'interactive script exists');
assert.doesNotThrow(() => new vm.Script(inlineScript), 'interactive script parses');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]);
assert.equal(new Set(ids).size, ids.length, 'HTML IDs are unique');

console.log(`PASS: Katun food page content, navigation, ${iconCount} SVG icons and local assets are present`);
