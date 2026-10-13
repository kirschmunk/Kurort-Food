const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'embed.html'), 'utf8');
const cms = fs.readFileSync(path.join(root, 'cms/katun-procedures.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'cms/katun-procedures.css'), 'utf8');
assert.equal(data.categories.length, 12);
assert.equal((html.match(/<details /g) || []).length, 12);
assert.equal((html.match(/<summary /g) || []).length, 12);
assert.equal((html.match(/<h1 /g) || []).length, 1);
assert(!/<script|<svg|<path|on(?:click|load|error)=|javascript:|<iframe/i.test(html));
assert(!/class="(?:wrap|container|button|card|title)"/.test(html));
const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(ids.length, new Set(ids).size, 'Duplicate HTML ID');
for (const m of html.matchAll(/href="#([^"]+)"/g)) assert(ids.includes(m[1]), 'Broken anchor ' + m[1]);
for (const m of html.matchAll(/src="([^"]+)"/g)) assert(fs.existsSync(path.join(root, m[1])), 'Missing asset ' + m[1]);
for (const m of css.matchAll(/url\("([^\"]+)"\)/g)) {
  assert(m[1].startsWith('/upload/katun-procedures/assets/'));
  assert(fs.existsSync(path.join(root, m[1].replace('/upload/katun-procedures/', ''))));
}
assert(!/src="assets\//.test(cms));
assert(!/DEMO ONLY|(?:^|[{}])\s*(?:body|html)\s*\{|:root/.test(css));
// Every authored rule starts within the component; at-rules are handled separately.
for (const m of css.matchAll(/([^{}]+)\{/g)) {
  const selector=m[1].trim();
  if (!selector.startsWith('@')) assert(selector.startsWith('.ktp-page'), 'Unscoped CSS rule: '+selector);
}
for (const c of data.categories) {
  const list = c.items || c.groups.flatMap(g => g.items);
  for (const id of list) assert(data.procedures[id], 'Unknown procedure: ' + id);
}
const used = new Set(data.categories.flatMap(c => c.items || c.groups.flatMap(g => g.items)));
assert.equal(used.size, Object.keys(data.procedures).length, 'Unlisted procedure');
assert.equal(cms, html.replaceAll('src="assets/', 'src="/upload/katun-procedures/assets/'));
console.log(`PASS: ${used.size} procedures, 12 native accordions; IDs, anchors, assets, fonts, CMS paths and no client JavaScript verified.`);
