const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
const html = fs.readFileSync(path.join(root, 'embed.html'), 'utf8');
const cms = fs.readFileSync(path.join(root, 'cms/katun-procedures.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'cms/katun-procedures.css'), 'utf8');
assert.equal(data.categories.length, 12);
assert.equal((html.match(/<details class="ktp-category"/g) || []).length, 12);
assert.equal((html.match(/<details class="ktp-procedure"/g) || []).length, 74);
assert.equal((html.match(/<summary /g) || []).length, 86);
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
assert.equal(data.categories.flatMap(c => c.items || c.groups.flatMap(g => g.items)).length, used.size, 'Procedure listed in multiple categories');
assert(!/ktp-demo-header|ktp-hero-caption|ktp-contact|ktp-footer|ktp-intro|ktp-section-description|Выбрать направление|БЕЛОКУРИХА|↗/.test(html));
assert(html.includes('С заботой о вашем здоровье'));
assert(html.includes('Выбрать процедуру'));
assert.deepEqual([...html.matchAll(/class="ktp-stat-number">(\d+)/g)].map(m => +m[1]), [5, 4, 12]);
assert.equal((html.match(/name="ktp-categories"/g)||[]).length, 12);
assert(!/<details[^>]*\sopen(?:\s|>)/.test(html), 'Catalog must start compact');
assert(!fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('<header'));
assert.equal(cms, html.replaceAll('src="assets/', 'src="/upload/katun-procedures/assets/'));
console.log(`PASS: ${used.size} procedures, each listed once; 12 category + 74 procedure disclosures; requested removals, statistics, IDs, anchors, assets, fonts, CMS paths and no client JavaScript verified.`);
