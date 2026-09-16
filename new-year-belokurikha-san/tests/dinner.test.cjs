const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

assert.match(html, /class="dinner-static"/, 'dinner is a static section');
assert.equal((html.match(/class="dinner-card"/g) || []).length, 1, 'only one dinner card remains');
assert.doesNotMatch(html, /data-dinner-carousel/, 'dinner slider behavior is removed');
assert.doesNotMatch(html, /aria-label="(?:Предыдущий|Следующий) ужин"/, 'dinner slider controls are removed');
assert.match(css, /\.dinner-static \.dinner-card\{[^}]*width:100%[^}]*max-width:none[^}]*min-height:0/, 'the single dinner card fills the content column');
assert.match(css, /\.stories\{background:url\('\.\/assets\/brief\/background-stories\.png'\) center\/100% 100% no-repeat\}/, 'stories have one patterned background');
assert.match(css, /\.story-panel\{background:transparent;border:0;box-shadow:none;border-radius:0\}/, 'stories have no nested background');
assert.match(css, /\.button-primary:hover\{[^}]*outline:none[^}]*box-shadow:/, 'primary button hover has no outline and uses a soft shadow');
assert.match(css, /\.book-urgent img\{display:none\}/, 'decorative booking arrows are hidden everywhere');

console.log('PASS: Belokurikha dinner is one static card and the shared visual fixes remain active');
