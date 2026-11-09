const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

for (const [folder, phone] of [['belokurikha-hotline', '+78007075183'], ['katun-hotline', '+78007075186']]) {
  test(`${folder}: one-file replacement contains all assets and the original contacts`, async () => {
    const dir = path.resolve(__dirname, '..', folder);
    const file = path.join(dir, 'banner-complete.html');
    assert.ok(fs.existsSync(file), 'The complete single-file banner is missing');
    const html = fs.readFileSync(file, 'utf8');
    const style = html.match(/<style>([\s\S]*?)<\/style>/)?.[1];
    assert.ok(style, 'Styles must travel with the block');
    assert.ok(!/<(?:html|head|body|script|link)\b/i.test(html), 'Use an insertable fragment, not a document or external dependencies');
    assert.ok(!/[^\x00-\x7F]/.test(html), 'Text must survive both UTF-8 and Windows-1251 templates');
    const decoded = html.replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)));
    const block = fs.readFileSync(path.join(dir, 'block.html'), 'utf8').trim();
    assert.ok(decoded.trimEnd().endsWith(block), 'Keep the approved markup, text and links');
    assert.ok(decoded.includes(`href="tel:${phone}"`));
    const resources = [...style.matchAll(/url\("([^"]+)"\)/g)].map(m => m[1]);
    assert.equal(resources.length, 3, 'Include both font weights and the MAX icon');
    const fonts = [];
    for (const resource of resources) {
      assert.equal(new URL(resource, 'https://example.invalid/anywhere/').protocol, 'data:', 'No external file may be required');
      const response = await fetch(resource);
      const bytes = Buffer.from(await response.arrayBuffer());
      assert.ok(bytes.length > 100);
      if (response.headers.get('content-type').startsWith('font/woff')) {
        assert.equal(bytes.subarray(0, 4).toString(), 'wOFF');
        fonts.push(bytes);
      } else {
        assert.match(response.headers.get('content-type'), /^image\/svg\+xml/);
        assert.match(bytes.toString(), /<svg\b[\s\S]*<\/svg>$/);
      }
    }
    for (const name of ['Acrom-Regular.woff', 'Acrom-Bold.woff']) {
      assert.ok(fonts.some(f => f.equals(fs.readFileSync(path.join(dir, 'assets/fonts', name)))), `Preserve ${name}`);
    }
  });
}
