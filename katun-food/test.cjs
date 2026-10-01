const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const html = fs.readFileSync(path.join(root, 'embed.html'), 'utf8');
const demo = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

assert.match(demo, /<title>Питание в санатории «Катунь»<\/title>/);
assert.doesNotMatch(html, /<\/?(?:script|style|html|head|body|main)\b|\son[a-z]+\s*=|javascript:/i, 'CMS fragment needs no scripts or document-level tags');
assert.doesNotMatch(html, /\shidden(?:\s|>)/, 'CSS controls visibility; no permanently hidden content');
assert.doesNotMatch(html, /Сибирь|sibir-san|Сибири/);
assert.match(html, /https:\/\/www\.katun-san\.ru\/price\//);
assert.match(html, /tel:88007075186/);
assert.match(html, /врач-диетолог составит для вас персональное меню/);
assert.match(html, /Дети до 2 лет питаются бесплатно/);

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
assert.equal(new Set(ids).size, ids.length, 'IDs are unique');
assert.ok(ids.every(id => id.startsWith('kfn-')), 'IDs are namespaced');
for (const m of html.matchAll(/\bclass="([^"]+)"/g)) {
  assert.ok(m[1].split(/\s+/).every(c => c.startsWith('kfn-')), 'classes are namespaced');
}
const inputs = [...html.matchAll(/<input\b([^>]+)>/g)].map(m => ({
  id: m[1].match(/\bid="([^"]+)"/)[1],
  name: m[1].match(/\bname="([^"]+)"/)[1],
  checked: /\schecked(?:\s|$)/.test(m[1]),
  type: m[1].match(/\btype="([^"]+)"/)[1]
}));
const groups = Map.groupBy(inputs, input => input.name);
assert.equal(groups.size, 6, 'one format group and five independent photo groups');
for (const [name, items] of groups) {
  assert.ok(name.startsWith('kfn-'));
  assert.ok(items.every(i => i.type === 'radio'));
  assert.equal(items.filter(i => i.checked).length, 1, 'exactly one default per group: ' + name);
}
for (const m of html.matchAll(/<label\b[^>]*\bfor="([^"]+)"/g)) {
  assert.ok(inputs.some(i => i.id === m[1]), 'label targets a native input: ' + m[1]);
}
for (const key of ['premium', 'lux', 'buffet', 'diet']) {
  assert.ok(ids.includes('kfn-panel-' + key));
  assert.ok(ids.includes('kfn-label-' + key));
  assert.match(css, new RegExp('#kfn-format-' + key + ':checked ~ \\.kfn-format-panels #kfn-panel-' + key));
}
function selectors(prelude) {
  const result = []; let depth = 0, start = 0;
  for (let i = 0; i < prelude.length; i++) {
    if ('(['.includes(prelude[i])) depth++;
    if (')]'.includes(prelude[i])) depth--;
    if (prelude[i] === ',' && depth === 0) { result.push(prelude.slice(start, i).trim()); start = i + 1; }
  }
  result.push(prelude.slice(start).trim());
  return result;
}
let ruleCount = 0;
const stripped = css.replace(/\/\*[\s\S]*?\*\//g, '');
for (const match of stripped.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  const prelude = match[1].trim();
  if (prelude === '@font-face') {
    assert.match(match[2], /font-family:KatunFoodAcrom;/);
    continue;
  }
  for (const selector of selectors(prelude)) {
    assert.match(selector, /^\.kfn-page(?=[\s.:[#]|$)/, 'style cannot leak outside module: ' + selector);
    ruleCount++;
  }
}
assert.ok(ruleCount > 100);
assert.doesNotMatch(css, /--(?!kfn-)[a-z]+:/, 'custom properties are namespaced');
assert.doesNotMatch(html, /<\/?(?:svg|path)\b/i, 'CMS must not need inline SVG');
const iconCount = (html.match(/class="kfn-icon-image"/g) || []).length;
assert.equal(iconCount, 12, 'all food, production and service icons retained');
assert.match(css, /\.kfn-photo-state:checked \+ \.kfn-photo-slide/);
assert.doesNotMatch(css, /kfn-photo-state-\d/, 'no hardcoded photo count');
const {renderGallery} = require('./gallery.cjs');
const configuredGalleries = JSON.parse(fs.readFileSync(path.join(root, 'galleries.json'), 'utf8'));
const expectedCounts = {premium:9,lux:12,buffet:9,diet:5,gallery:7};
for (const [key, count] of Object.entries(expectedCounts)) {
  const config = configuredGalleries[key];
  assert.equal(config.photos.length, count, 'requested photo slots: ' + key);
  assert.equal(groups.get(`kfn-${key}-photo`).length, count, 'generated photo slots: ' + key);
  const markup = renderGallery(key, config);
  const slides = markup.split('<div class="kfn-photo-slide">').slice(1);
  slides.forEach((slide, i) => {
    assert.match(slide, new RegExp(`for="kfn-${key}-photo-${(i + count - 1) % count + 1}" title="Предыдущее фото"`));
    assert.match(slide, new RegExp(`for="kfn-${key}-photo-${(i + 1) % count + 1}" title="Следующее фото"`));
    assert.ok(slide.includes(`${i + 1} / ${count}`));
    assert.equal((slide.match(/class="kfn-photo-dot(?: kfn-dot-active)?"/g)||[]).length, count);
  });
  assert.equal(new Set(config.photos.map(photo => photo.src)).size, count, 'each slot has its own replaceable file');
}
for (const count of [1, 3, 4, 7, 15]) {
  const result = renderGallery('test', {label:'Test',photos:Array.from({length:count}, (_, i)=>({src:'assets/bakery.jpg',alt:'Фото '+i}))});
  assert.equal((result.match(/class="kfn-photo-slide"/g)||[]).length,count);
  assert.equal((result.match(/ checked>/g)||[]).length,1);
  assert.ok(result.includes(`id="kfn-test-photo-${count}"`));
  if (count > 1) assert.equal((result.match(/title="Следующее фото"/g)||[]).length,count);
}
for (const m of (html + css).matchAll(/(?:src=|url\()["']?(assets\/[^)"'\s]+)["']?/g)) {
  assert.ok(fs.existsSync(path.join(root, m[1])), 'asset exists: ' + m[1]);
}
assert.equal(fs.readFileSync(path.join(root, 'cms/katun-food.html'), 'utf8'), html.replaceAll('src="assets/', 'src="/upload/katun-food/assets/'));
assert.equal(fs.readFileSync(path.join(root, 'cms/katun-food.css'), 'utf8'), css.replaceAll('url("assets/', 'url("/upload/katun-food/assets/'));
assert.ok(demo.includes(html), 'demo uses the same markup as the CMS package');
console.log('PASS: ' + ruleCount + ' scoped selectors; six independent native control groups; 12 icons; assets and CMS build verified; no JavaScript');
