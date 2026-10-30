const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const dir=path.resolve(__dirname,'../belokurikha-rooms');
const source=JSON.parse(fs.readFileSync(path.join(dir,'catalog-snapshot.json'),'utf8'));
const data=JSON.parse(fs.readFileSync(path.join(dir,'rooms-data.json'),'utf8'));
const runtime={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(dir,'rooms-data.js'),'utf8'),runtime);
const ui=JSON.parse(JSON.stringify(runtime.window.BelokurikhaRoomsData));
assert.equal(data.length,15);
assert.equal(new Set(data.map(r=>r.id)).size,15);
const exactFields=['title','subtitle','area','main','extra','description','specs','amenities','notes'];
for(const r of data){
  const s=source.rooms.find(s=>s.id===r.id);
  const u=ui.find(u=>u.id===r.id);
  for(const field of exactFields){assert.deepEqual(r[field],s[field],`${r.id}: ${field}`);assert.deepEqual(u[field],s[field],`${r.id}: runtime ${field}`);}
  assert.deepEqual(r.photos,s.photos.slice(0,5),`${r.id}: photo sources`);
  assert.equal(r.images.length,r.photos.length);
  for(const file of r.images){const bytes=fs.readFileSync(path.join(dir,file));assert.equal(bytes[0],255);assert.equal(bytes[1],216);}
}
for(const file of ['index.html','block.html','variant-2/index.html','variant-2/block.html']){
  const html=fs.readFileSync(path.join(dir,file),'utf8');
  const displayOnly=file.startsWith('variant-2/');
  assert.equal((html.match(/class="br-rooms__card"/g)||[]).length,15);
  const cards=[...html.matchAll(/<article\b[^>]*>([\s\S]*?)<\/article>/g)].map(m=>m[1]);
  if(displayOnly){
    assert(cards.every(card=>!/<(?:button|a)\b|data-open-room|role=["'](?:button|link)["']|tabindex=["']?[0-9]/i.test(card)),`${file}: cards are display-only, with no interactive controls`);
    assert(!/<dialog\b|rooms-data\.js/.test(html),`${file}: no room dialog or detail data loaded`);
    assert.equal(cards.reduce((n,c)=>n+(c.match(/<img\b/g)||[]).length,0),15,`${file}: one cover per card`);
  }
  assert.equal((html.match(/class="br-rooms__prev"/g)||[]).length,1,`${file}: carousel back control retained`);
  assert.equal((html.match(/class="br-rooms__next"/g)||[]).length,1,`${file}: carousel next control retained`);
  assert.equal((html.match(/class="br-rooms__photo-prev"/g)||[]).length,displayOnly?0:1);
  assert.equal((html.match(/class="br-rooms__photo-next"/g)||[]).length,displayOnly?0:1);
  assert.equal((html.match(/class="br-rooms__parameters"/g)||[]).length,displayOnly?0:1,`${file}: modal characteristics only in classic design`);
  assert(!html.includes('br-rooms__modal-facts'),`${file}: no separate stretched metrics`);
  assert(!/br-rooms__amenities|Оснащение номера/.test(html),`${file}: no room amenities section`);
  assert(!/br-rooms__(navigation|progress|counter)/.test(html),`${file}: no bottom carousel indicators`);
  if(file.startsWith('variant-2/'))assert(html.includes('br-rooms--photo')&&html.includes('variant.css'),`${file}: photo design is enabled`);
  if(!displayOnly)assert(html.indexOf('class="br-rooms__description"')<html.indexOf('class="br-rooms__parameters"'),`${file}: description comes first`);
  const titles=[...html.matchAll(/<h3>([\s\S]*?)<\/h3>/g)].map(m=>m[1].replace(/<[^>]*>/g,'').replaceAll('&amp;','&').replaceAll('&quot;','"'));
  assert.deepEqual(titles,data.map(r=>r.title),`${file}: exact full titles`);
  assert(!/₽|руб\.|Цена \(/i.test(html),`${file}: no price block`);
}
assert(!fs.readFileSync(path.join(dir,'rooms.js'),'utf8').includes('br-rooms__amenities'),'no amenities rendering');
assert(!fs.readFileSync(path.join(dir,'rooms.css'),'utf8').includes('br-rooms__amenities'),'no unused amenities styles');
for(const file of ['rooms.css','rooms.js'])assert(!/br-rooms__(navigation|progress|counter)/.test(fs.readFileSync(path.join(dir,file),'utf8')),`${file}: no obsolete indicators`);
const css=fs.readFileSync(path.join(dir,'rooms.css'),'utf8');
assert(css.includes('max-width:1200px'),'matches the official 1200px column');
assert(css.includes('.wrapper .br-rooms{max-width:100%;padding-left:0;padding-right:0}'),'no double gutters inside the site wrapper');
assert(/\.br-rooms \.br-rooms__dialog\{[^}]*margin:auto;/.test(css),'dialog survives the host margin reset');
assert(/\.br-rooms \.br-rooms__info h3\{[^}]*BelokRooms/.test(css),'modal heading keeps the component font');
console.log(`PASS: ${data.length} full room descriptions, ${data.reduce((n,r)=>n+r.images.length,0)} original photos, literal titles, no prices or amenities section`);
