import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import assert from 'node:assert/strict';
const root = dirname(fileURLToPath(import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const footer = read('footer.html');
const html = read('demo-template.html').replace('%%FOOTER%%', footer.trim());
const css = read('footer.css');
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate IDs');
assert.equal((footer.match(/class="kf2__widget-slot"/g) || []).length, 2);
assert(footer.includes('2815278048144278') && footer.includes('1102639152'));
assert(!footer.includes('92012401542'), 'No competitor IDs');
assert(!/<form|method="post"|<script|<iframe/i.test(footer), 'No data submission or embedded scripts in prototype');
assert(read('README.md').includes('Оценки 5,0 в прототипе условные'), 'Keep widget integration notes in developer documentation');
assert(!/demo-header|demo-intro|demo-note|<header|<main|<aside/.test(html), 'Demo should contain only the footer');
for (const match of html.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^(https?:|tel:)/.test(match[1])) assert(existsSync(join(root, match[1])), 'Missing asset: ' + match[1]);
}
for (const match of css.matchAll(/url\('([^']+)'\)/g)) assert(existsSync(join(root, match[1])));
writeFileSync(join(root, 'index.html'), html);
console.log('PASS: generated demo, assets, local fonts, two Katun rating links, unique IDs and non-sending form.');
