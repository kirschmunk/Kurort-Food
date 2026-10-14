const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const root = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
const descriptions = JSON.parse(fs.readFileSync(path.join(root, 'procedure-details.json'), 'utf8'));
const all = data.categories.flatMap(c => c.items || c.groups.flatMap(g => g.items));
const html = fs.readFileSync(path.join(root, 'embed.html'), 'utf8');
const cms = fs.readFileSync(path.join(root, 'cms/katun-procedures.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'cms/katun-procedures.css'), 'utf8');
assert.equal(data.categories.length, 11);
assert.equal((html.match(/<details class="ktp-category"/g) || []).length, 11);
assert.equal((html.match(/<details class="ktp-procedure"/g) || []).length, all.length);
assert.equal((html.match(/<summary /g) || []).length, 11 + all.length);
assert.equal((html.match(/class="ktp-detail-media"/g) || []).length, all.length, 'Each procedure needs media');
assert.equal(Object.keys(descriptions).length, 74);
for (const [id,d] of Object.entries(descriptions)) {
  assert(data.procedures[id]);
  assert(d.paragraphs.length >= 2 || d.points?.length >= 3, 'Missing detailed text: '+id);
  assert(d.paragraphs.join('').length > 130, 'Description too short: '+id);
}
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
  assert.equal(list.length, new Set(list).size, 'Duplicate within category: '+c.id);
  for (const id of list) assert(data.procedures[id], 'Unknown procedure: ' + id);
}
const used = new Set(data.categories.flatMap(c => c.items || c.groups.flatMap(g => g.items)));
assert.equal(used.size, Object.keys(data.procedures).length, 'Unlisted procedure');
assert.equal(used.size, 74);
assert.equal(new Set(data.categories.filter(c=>c.section !== 'care').flatMap(c=>c.items || c.groups.flatMap(g=>g.items))).size, 53);
for (const id of data.categories.filter(c=>c.section==='care').flatMap(c=>c.items || c.groups.flatMap(g=>g.items))) assert.equal(all.filter(x=>x===id).length,1,'Care must stay separate');
assert(!/ktp-demo-header|ktp-hero-caption|ktp-contact|ktp-footer|ktp-intro|ktp-section-description|Выбрать направление|БЕЛОКУРИХА|↗/.test(html));
assert(html.includes('С заботой о вашем здоровье'));
assert(html.includes('Выбрать процедуру'));
assert.deepEqual([...html.matchAll(/class="ktp-stat-number">(\d+)/g)].map(m => +m[1]), [53, 12, 9]);
assert.equal((html.match(/name="ktp-categories"/g)||[]).length, 11);
assert(!/<details[^>]*\sopen(?:\s|>)/.test(html), 'Catalog must start compact');
assert(!fs.readFileSync(path.join(root, 'index.html'), 'utf8').includes('<header'));
assert.equal(cms, html.replaceAll('src="assets/', 'src="/upload/katun-procedures/assets/'));
console.log(`PASS: ${used.size} unique records, ${all.length} profile placements, 11 categories in 3 sections. Detailed copy and media for every procedure; counts, IDs, anchors, assets, fonts, CMS paths and no client JavaScript verified.`);
