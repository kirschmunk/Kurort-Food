const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = __dirname;
const html = fs.readFileSync(path.join(root, 'banner.html'), 'utf8');
const demo = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'banner.css'), 'utf8');

assert.match(html, /санатория «Катунь»/, 'banner copy names Katun');
assert.match(html, /https:\/\/shop\.hotbot\.ai\/katunsan/, 'banner uses the working Katun storefront URL');
assert.match(demo, /https:\/\/shop\.hotbot\.ai\/katunsan/, 'demo uses the working Katun storefront URL');
assert.match(css, /--hotbot-green: #4f806d/, 'banner uses the calm sage accent');
assert.match(css, /max-width: 1196px/, 'banner fits the site content column');
assert.match(css, /@media \(max-width: 700px\)/, 'banner has a mobile layout');
assert.ok(fs.existsSync(path.join(root, 'assets', 'hotbot-spa.jpg')), 'banner image exists');

console.log('PASS: Katun HotBot banner copy, storefront, palette, width and assets are valid');
