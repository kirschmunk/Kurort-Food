import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = dirname(fileURLToPath(import.meta.url));
const read = file => readFileSync(join(root, file), 'utf8');
const ratings = read('ratings.html');
const html = read('demo-template.html').replace('%%RATINGS%%', ratings);
const css = read('ratings.css').replace(/\/\*[\s\S]*?\*\//g, '');
for (const match of css.matchAll(/([^{}]+)\{/g)) {
  for (const selector of match[1].split(',')) assert(selector.trim().startsWith('#footer .ktfr-'), 'CSS may only affect new ratings');
}
assert.equal((ratings.match(/class="ktfr-ratings__slot"/g) || []).length, 2);
assert(ratings.includes('1102639152') && ratings.includes('2815278048144278'));
assert(!ratings.includes('92012401542') && !ratings.includes('2815278048143818'), 'No competitor IDs');
assert(!/<form|<iframe|action=|fetch\(|XMLHttpRequest/.test(html + read('demo.js')), 'Demo must not send data');
assert(!/<header|<main|<aside|demo-intro|demo-note/.test(html), 'Only the footer');
assert(html.indexOf('id="footercontainer"') < html.indexOf('class="ktfr-ratings"'));
assert(html.indexOf('class="ktfr-ratings"') < html.indexOf('class="policycontainer"'));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
assert.equal(ids.length, new Set(ids).size);
for (const match of (html + read('site-reference.css')).matchAll(/(?:src|href)="([^"#]+)"|url\(['"]?([^)'"\s]+)/g)) {
  const path = match[1] || match[2];
  if (!/^(https?:|tel:|tg:)/.test(path)) assert(existsSync(join(root, path)), 'Missing file: ' + path);
}
assert(read('README.md').includes('Оценки 5,0 условные'));
writeFileSync(join(root, 'index.html'), html);
console.log('PASS: isolated additive CSS, two Katun badges, correct insertion order, local assets, no external submission.');
