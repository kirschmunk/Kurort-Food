const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

assert.match(script, /const newYearLinks=\{[\s\S]*menu:'https:\/\//, 'menu has an absolute fallback URL');
assert.match(script, /poster:'https:\/\//, 'poster has an absolute fallback URL');
assert.match(script, /booking:'https:\/\/sales\.belokurikha\.ru\//, 'booking uses the official online booking URL');
assert.match(script, /document\.querySelectorAll\('\.card-actions'\)/, 'menu and poster labels are upgraded to links');
assert.match(script, /label\.replaceWith\(link\)/, 'plain labels are replaced with real anchors');
assert.match(script, /document\.querySelectorAll\('\[data-booking\]'\)/, 'every booking CTA is upgraded');
assert.match(script, /button\.replaceWith\(link\)/, 'booking buttons are replaced with real anchors');
assert.doesNotMatch(script, /Форма заявки будет подключена/, 'the obsolete non-working placeholder is gone');
assert.match(css, /\.new-year-page \.card-actions a\{[^}]*pointer-events:auto/, 'document links accept pointer input');
assert.match(css, /\.new-year-page a\.button-primary\{[^}]*display:inline-flex[^}]*pointer-events:auto/, 'booking anchors keep button layout and accept clicks');

console.log('PASS: menu, poster and booking controls are real clickable links');
