const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

assert.match(
  css,
  /\.new-year-page \.wrap\{width:100%;max-width:1196px;margin-inline:auto\}/,
  'content uses the current 74.75rem portal column without a second inner gutter',
);
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
