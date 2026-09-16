const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');

assert.match(
  css,
  /\.new-year-page \.wrap\{width:100%;max-width:1196px;margin-inline:auto\}/,
  'content uses the current 74.75rem portal column without a second inner gutter',
);

assert.match(
  css,
  /\.new-year-page \.highlights\{grid-template-columns:repeat\(4,minmax\(0,1fr\)\);padding:18px;[^}]*overflow:visible/,
  'highlight grid reserves internal room for shadows and cannot overflow its columns',
);
assert.match(css, /\.new-year-page \.highlight:hover\{[^}]*translateY\(-5px\)[^}]*box-shadow:/, 'highlight cards lift with a soft shadow');
assert.match(css, /\.new-year-page \.highlight:hover \.highlight-media\{[^}]*scale\(1\.035\)/, 'highlight images have a restrained hover zoom');
assert.match(css, /@media\(prefers-reduced-motion:reduce\)/, 'motion respects the visitor accessibility preference');
assert.match(script, /IntersectionObserver/, 'highlight entrance motion is triggered only when the block enters the viewport');
assert.match(
  css,
  /\.new-year-page>\.booking-strip,\.new-year-page>\.stories,\.new-year-page>\.final-cta\{width:100%;max-width:1196px;[^}]*border-radius:24px;overflow:hidden\}/,
  'formerly full-width sections are rounded cards inside the portal column',
);
assert.match(css, /\.new-year-page>\.stories>\.wrap\{[^}]*padding-inline:48px\}/, 'stories keep readable inner spacing');
assert.match(css, /\.new-year-page \.review-grid\{padding:0 18px 26px\}/, 'reviews reserve room for their shadows');
assert.match(css, /\.new-year-page \.carousel-controls\{justify-content:center\}/, 'slider navigation is centered below the slide');
assert.match(
  css,
  /body>\.new-year-page \.wrap\{width:min\(1196px,calc\(100% - 30px\)\)\}/,
  'the standalone demo keeps the same 15px side gutters as the portal',
);
assert.match(
  css,
  /\.new-year-page,\.new-year-page \*\{box-sizing:border-box\}/,
  'box sizing is isolated to the New Year page',
);

assert.doesNotMatch(
  css,
  /(?:^|[{}])\s*(?::root|body|button|h2|h3|h4|p|\*)\s*\{/m,
  'the stylesheet has no unscoped element or universal selectors',
);

let depth = 0;
for (const character of css.replace(/\/\*[\s\S]*?\*\//g, '')) {
  if (character === '{') depth += 1;
  if (character === '}') depth -= 1;
  assert.ok(depth >= 0, 'CSS never closes a block that was not opened');
}
assert.equal(depth, 0, 'all CSS blocks are balanced');

console.log('PASS: page width matches the 1196px portal column and all styles are isolated');
