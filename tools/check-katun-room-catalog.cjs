// Catches missing categories, fabricated unknown facts, wrong gallery paths,
// responsive overflow and regressions in the room-details interactions.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const http = require('node:http');
const {chromium, webkit} = require('playwright');
const root = path.resolve(__dirname, '..');
const dir = path.join(root, 'katun-room-catalog');
assert(fs.existsSync(path.join(dir, 'index.html')), 'Katun standalone catalog must exist');
const rooms = JSON.parse(fs.readFileSync(path.join(dir, 'rooms-data.json')));
const css = fs.readFileSync(path.join(dir, 'catalog.css'), 'utf8');
function contrast(a, b) {
  const luminance = hex => {
    const rgb = hex.replace('#', '').match(/../g).map(v => parseInt(v, 16) / 255)
      .map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4);
    return rgb[0] * .2126 + rgb[1] * .7152 + rgb[2] * .0722;
  };
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + .05) / (dark + .05);
}
for (const variable of ['green', 'muted']) {
  const color = css.match(new RegExp(`--kt-${variable}:(#[0-9a-f]{6})`))[1];
  assert(contrast(color, '#ffffff') >= 4.5, `${variable}: normal text must have at least 4.5:1 contrast`);
}
const barColor = css.match(/\.kt-rooms__modal-bar\{[^}]*color:(#[0-9a-f]{6})/)[1];
assert(contrast(barColor, '#ffffff') >= 4.5, 'modal bar: normal-text contrast');
assert.equal(rooms.length, 11, 'all eleven source folders must have a card');
assert.equal(new Set(rooms.map(r=>r.id)).size, 11);
assert.deepEqual(rooms.map(r=>r.sourceFolderNumber).sort((a,b)=>a-b), [1,2,3,4,5,6,7,8,9,10,11]);
for (const r of rooms) {
  assert(r.images.length >= 3 && r.images.length <= 5, r.id + ': selected source gallery');
  for (const src of [r.previewImage, ...r.images]) {
    assert(src.startsWith(`assets/images/${r.id}/`), r.id + ': gallery must stay in its own folder');
    assert(fs.statSync(path.join(dir, src)).size > 1000);
  }
}
for (const n of [6,8,9,10,11]) {
  const r = rooms.find(r=>r.sourceFolderNumber===n);
  assert.equal(r.area, null, 'unconfirmed area must not be fabricated');
  assert.equal(r.main, null, 'unconfirmed capacity must not be fabricated');
  assert.equal(r.extra, null);
}
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.webp':'image/webp','.woff':'font/woff'};
const server=http.createServer((req,res)=>{
  let p=decodeURIComponent(new URL(req.url,'http://localhost').pathname);
  if(p.startsWith('/upload/katun-room-catalog/'))p=p.replace('/upload/katun-room-catalog/','/katun-room-catalog/');
  const file=path.join(root,p.endsWith('/')?p+'index.html':p);
  if(!file.startsWith(root+path.sep)||!fs.existsSync(file)){res.writeHead(404);res.end();return;}
  res.setHeader('Content-Type',types[path.extname(file)]||'application/octet-stream');fs.createReadStream(file).pipe(res);
});
(async()=>{
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 const url=`http://127.0.0.1:${server.address().port}/katun-room-catalog/`;
 const engines=[['chromium',chromium]];
 if(process.env.TEST_WEBKIT==='1')engines.push(['webkit',webkit]);
 for(const [engine,type] of engines){
  const browser=await type.launch({headless:true,...(engine==='chromium'&&process.env.CHROMIUM_BINARY?{executablePath:process.env.CHROMIUM_BINARY}:{})});
  try{
   const page=await browser.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
   for(const width of [320,390,580,768,1100,1280,1440]){
    await page.setViewportSize({width,height:900});await page.goto(url);await page.evaluate(()=>document.fonts.ready);
    const cards=page.locator('[data-room]');assert.equal(await cards.count(),11);
    const geometry=await cards.evaluateAll(els=>els.map(e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width};}));
    assert.equal(geometry.filter(r=>Math.abs(r.y-geometry[0].y)<1).length,width<=580?1:width<=1100?2:4);
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),`${engine} ${width}: no horizontal overflow`);
    for(let i=0;i<rooms.length;i++){
     const card=cards.nth(i);await card.scrollIntoViewIfNeeded();const img=card.locator('img');await img.evaluate(i=>i.decode());
     assert.equal(await card.locator('h3').innerText(),rooms[i].title);
     assert(!/null|undefined|NaN|Цена|руб\.|₽/.test(await card.innerText()));
    }
    await cards.first().locator('[data-open-room]').first().click();
    const dialog=page.locator('dialog');assert(await dialog.isVisible());
    assert(await dialog.evaluate(d=>d.scrollWidth<=d.clientWidth+1),`${engine} ${width}: details fit`);
    await page.keyboard.press('Escape');assert.equal(await dialog.isVisible(),false);
    await page.waitForFunction(()=>document.body.style.overflow==='');
   }
   for(const room of rooms){
    const opener=page.locator(`[data-room="${room.id}"] [data-open-room]`).first();await opener.click();
    const dialog=page.locator('dialog');assert.equal(await dialog.locator('h3').innerText(),room.title);
    assert.equal(await dialog.locator('.kt-rooms__thumbs button').count(),room.images.length);
    assert(!/null|undefined|NaN|Оснащение номера/.test(await dialog.innerText()));
    for(let i=0;i<room.images.length;i++){
     const img=dialog.locator('.kt-rooms__large');await img.evaluate(i=>i.decode());
     assert((await img.getAttribute('src')).endsWith(room.images[i]));
     await dialog.locator('.kt-rooms__photo-next').click();
    }
    await dialog.locator('.kt-rooms__close').click();
    // dialog.close() hides synchronously, but its close event is queued.
    await page.waitForFunction(()=>document.body.style.overflow==='');
    assert(await opener.evaluate(e=>document.activeElement===e));
    assert.equal(await page.evaluate(()=>document.body.style.overflow),'');
   }
   assert.equal(await page.locator('form').count(),0,'no booking form');
   assert.equal(await page.locator('[data-book-room]').count(),11,'one usable booking link per card');
   assert.equal(await page.locator('[data-book-room]').first().getAttribute('href'),'https://www.katun-san.ru/reservation/');
   await page.evaluate(()=>document.addEventListener('katun:book-room',event=>{event.preventDefault();window.selectedKatunRoom=event.detail;}));
   await page.locator('[data-book-room]').first().click();
   assert.deepEqual(await page.evaluate(()=>window.selectedKatunRoom),{id:'01-standard-twin',title:'Стандарт двухместный (Твин/Дабл) 4*'});
   assert.equal(await page.locator('dialog:visible').count(),0,'booking action does not open a room or booking popup');
   await page.setViewportSize({width:1440,height:1000});await page.goto(url);await page.evaluate(()=>document.fonts.ready);
   // A full-page capture must wait for off-screen lazy images too.
   await page.locator('.kt-rooms__photo img').evaluateAll(imgs=>Promise.all(imgs.map(i=>{i.loading='eager';return i.decode();})));
   await page.screenshot({path:'/tmp/katun-catalog-desktop.png',fullPage:true});
   await page.locator('[data-open-room]').first().click();await page.locator('.kt-rooms__large').evaluate(i=>i.decode());
   await page.locator('.kt-rooms__thumbs img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
   await page.screenshot({path:'/tmp/katun-catalog-dialog.png'});
   await page.keyboard.press('Escape');await page.setViewportSize({width:390,height:844});await page.reload();
   await page.evaluate(()=>document.fonts.ready);await page.locator('.kt-rooms__photo img').first().evaluate(i=>i.decode());
   await page.screenshot({path:'/tmp/katun-catalog-mobile.png'});
   await page.locator('[data-open-room]').first().click();
   await page.locator('.kt-rooms__large').evaluate(i=>i.decode());
   await page.locator('.kt-rooms__thumbs img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
   await page.screenshot({path:'/tmp/katun-catalog-mobile-dialog.png'});
   await page.keyboard.press('Escape');await page.waitForFunction(()=>document.body.style.overflow==='');
   await page.locator('[data-open-room="11-apartment"]').first().click();
   assert.equal(await page.locator('.kt-rooms__specs').isVisible(),false);
   assert.equal(await page.locator('.kt-rooms__description').isVisible(),false);
   await page.locator('.kt-rooms__large').evaluate(i=>i.decode());
   await page.locator('.kt-rooms__thumbs img').evaluateAll(imgs=>Promise.all(imgs.map(i=>i.decode())));
   await page.screenshot({path:'/tmp/katun-catalog-mobile-gallery.png'});
   await page.keyboard.press('Escape');await page.waitForFunction(()=>document.body.style.overflow==='');
   // The supplied CMS fragment must work at its documented asset path too.
   await page.goto(url+'block.html');
   await page.locator('[data-open-room]').first().click();
   await page.locator('.kt-rooms__large').evaluate(i=>i.decode());
   assert((await page.locator('.kt-rooms__large').getAttribute('src')).includes('/upload/katun-room-catalog/assets/'));
   assert.deepEqual(errors,[]);
   console.log(`PASS ${engine}: 11 galleries, 7 viewport sizes, focus, Escape, local images, no booking form`);
  }finally{await browser.close();}
 }
})().catch(e=>{console.error(e);process.exitCode=1;}).finally(()=>server.close());
