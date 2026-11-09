const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');

// Regression: copying just the stylesheet must not lose the MAX image.
// An external asset path or a truncated embedded image must fail this check.
for (const [folder, prefix] of [['belokurikha-hotline', 'bk'], ['katun-hotline', 'kt']]) {
  test(`${folder}: MAX survives stylesheet relocation without an assets directory`, async () => {
    const css = fs.readFileSync(path.join(root, folder, 'hotline.css'), 'utf8');
    const rule = css.match(new RegExp(`\\.${prefix}-hotline__max-icon\\s*\\{([^}]+)\\}`))[1];
    const source = rule.match(/url\("([^"]+)"\)/)[1];
    const resolved = new URL(source, 'https://deployment.invalid/moved/styles.css');
    assert.equal(resolved.protocol, 'data:', 'MAX still needs an external file after moving CSS');
    const response = await fetch(resolved);
    assert.match(response.headers.get('content-type'), /^image\/svg\+xml/);
    const svg = await response.text();
    const original = fs.readFileSync(path.join(root, folder, 'assets/max-logo.svg'), 'utf8');
    assert.equal(svg.match(/\bd="([^"]+)"/)[1], original.match(/\bd="([^"]+)"/)[1], 'Preserve the approved MAX outline');
    assert.match(svg, /viewBox="0 0 100 100"/);
    assert.match(svg, /<\/svg>\s*$/);
    assert.ok(!/\b(?:href|src)\s*=/.test(svg), 'The image itself must not depend on other files');
    for (const [, id] of svg.matchAll(/url\(#([^)]+)\)/g)) {
      assert.ok(svg.includes(`id="${id}"`), 'Gradient references must remain intact');
    }
  });
}

test('The standalone patch supplies the same icon to both deployed banners', async () => {
  const css = fs.readFileSync(path.join(__dirname, 'max-icon-fix.css'), 'utf8');
  const [, selectors, declarations] = css.match(/([^{}]+)\{([^}]+)\}/);
  for (const prefix of ['bk', 'kt']) {
    assert.ok(selectors.split(',').some(s => s.trim().endsWith(`.${prefix}-hotline__max-icon`)));
  }
  const source = declarations.match(/url\("([^"]+)"\)/)[1];
  assert.equal(new URL(source).protocol, 'data:');
  const svg = await (await fetch(source)).text();
  const original = fs.readFileSync(path.join(root, 'belokurikha-hotline/assets/max-logo.svg'), 'utf8');
  assert.equal(svg.replace(/>\s+</g, '><').trim(), original.replace(/>\s+</g, '><').trim());
});
