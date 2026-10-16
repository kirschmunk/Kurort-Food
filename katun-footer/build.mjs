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
// Вторая палитра использует ту же разметку и базовые стили: различаются только цвета.
const themedFooter = footer.replace('class="kf2"', 'class="kf2 kf2--site-colors"').replaceAll('src="assets/', 'src="../assets/');
const themedHtml = read('demo-template.html')
  .replace('%%FOOTER%%', themedFooter.trim())
  .replace('href="footer.css"', 'href="../footer.css"')
  .replace('href="demo.css"', 'href="../demo.css"')
  .replace('src="demo.js"', 'src="../demo.js"')
  .replace('</head>', '  <link rel="stylesheet" href="colors.css">\n</head>')
  .replace('<title>Катунь — новый футер с рейтингами</title>', '<title>Катунь — футер в цветах сайта</title>');
const theme = read('site-colors/colors.css').replace(/\/\*[\s\S]*?\*\//g, '');
const allowed = new Set(['color', 'background-color', 'border-top-color', 'border-left-color', 'text-decoration-color']);
for (const block of theme.matchAll(/\{([^}]+)\}/g)) {
  for (const declaration of block[1].split(';').filter(x => x.trim())) {
    const property = declaration.split(':')[0].trim();
    assert(property.startsWith('--kf2-') || allowed.has(property), 'Only palette changes allowed: ' + property);
  }
}
for (const match of themedHtml.matchAll(/(?:src|href)="([^"#]+)"/g)) {
  if (!/^(https?:|tel:)/.test(match[1])) assert(existsSync(join(root, 'site-colors', match[1])), 'Missing themed asset: ' + match[1]);
}
assert.equal(themedFooter.replace('class="kf2 kf2--site-colors"','class="kf2"').replaceAll('src="../assets/','src="assets/'), footer);
assert(!/demo-header|demo-intro|demo-note|<header|<main|<aside/.test(themedHtml));
writeFileSync(join(root, 'site-colors/footer.html'), themedFooter);
writeFileSync(join(root, 'site-colors/index.html'), themedHtml);
console.log('PASS: both demos, identical footer markup, color-only theme, local assets, Katun rating links and non-sending form.');
