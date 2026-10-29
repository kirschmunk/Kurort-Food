const fs = require('node:fs');
const path = require('node:path');
const {execFileSync} = require('node:child_process');
const root = path.resolve(__dirname, '..');
const out = path.join(root, 'belokurikha-rooms');
const version = '20261029-compact-details';
const source = JSON.parse(fs.readFileSync(path.join(out,'catalog-snapshot.json'),'utf8'));
const rooms = source.rooms.map(r=>({...r,originalName:r.title,photos:r.photos.slice(0,5),images:r.photos.slice(0,5).map((_,i)=>`assets/images/${r.id}-${i+1}.jpg`)}));
fs.mkdirSync(path.join(out,'assets/images'), {recursive:true});
fs.mkdirSync(path.join(out,'assets/fonts'), {recursive:true});
for (const weight of ['Regular','Bold']) fs.copyFileSync(path.join(root,`assets/fonts/Acrom-${weight}.woff`),path.join(out,`assets/fonts/Acrom-${weight}.woff`));
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const titleHTML = title => esc(title).replace(/(\d класса \d|\S+ \d)\*$/, '<span class="br-rooms__rating">$1<sup>*</sup></span>');
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const icons = {
  area:'<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5M9 15l6-6M10 9h5v5"/>',
  people:'<circle cx="9" cy="7" r="3"/><path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6M18 14a5 5 0 0 1 3 4v3"/>',
  bed:'<path d="M3 20V8M21 20v-8H3M3 17h18M6 12V6h6v6M12 12V6h6v6"/>'
};
const metric=(icon,label,value)=>`<div class="br-rooms__fact"><svg viewBox="0 0 24 24" fill="none" aria-hidden="true">${icons[icon]}</svg><dt>${label}</dt><dd>${value}</dd></div>`;
const facts=r=>`<dl class="br-rooms__facts">${metric('area','Площадь',r.area+' м²')}${metric('people','Основных мест',r.main)}${r.extra == null ? '' : metric('bed','Доп. мест',r.extra)}</dl>`;
const section=`<section class="br-rooms" data-br-rooms aria-labelledby="br-rooms-heading">
  <div class="br-rooms__heading">
    <div><h2 id="br-rooms-heading">Номера для вашего отдыха</h2><p>Вдвоём, с семьёй или только для себя — найдите свой вариант.</p></div>
    <div class="br-rooms__heading-actions"><a class="br-rooms__all" href="https://www.belokurikha-san.ru/room/" target="_blank" rel="noopener">Все номера ${arrow}</a><div class="br-rooms__controls" data-br-controls hidden><button class="br-rooms__prev" type="button" aria-label="Предыдущие номера" aria-controls="br-rooms-track" disabled>${arrow}</button><button class="br-rooms__next" type="button" aria-label="Следующие номера" aria-controls="br-rooms-track">${arrow}</button></div></div>
  </div>
  <div class="br-rooms__track" id="br-rooms-track" tabindex="0" aria-label="Номера санатория. Используйте стрелки влево и вправо." aria-roledescription="карусель">
${rooms.map((r,i)=>`    <article class="br-rooms__card" data-room="${r.id}" aria-label="${i+1} из ${rooms.length}: ${esc(r.originalName)}">
      <button class="br-rooms__photo" type="button" data-open-room="${r.id}" aria-label="Фотографии: ${esc(r.originalName)}"><img src="${r.images[0]}" alt="${esc(r.originalName)} — санаторий «Белокуриха»" width="1024" height="683" loading="${i<4?'eager':'lazy'}" decoding="async"><span class="br-rooms__view">Смотреть номер ${arrow}</span></button>
      <div class="br-rooms__body"><h3>${titleHTML(r.title)}</h3><p class="br-rooms__subtitle">${esc(r.subtitle)}</p>${facts(r)}<button class="br-rooms__details" type="button" data-open-room="${r.id}">Подробнее о номере ${arrow}</button></div>
    </article>`).join('\n')}
  </div>
  <div class="br-rooms__navigation" hidden><div class="br-rooms__progress" aria-hidden="true"><span></span></div><span class="br-rooms__counter" aria-live="polite" aria-atomic="true">1–4 из ${rooms.length}</span></div>
  <dialog class="br-rooms__dialog" aria-labelledby="br-rooms-modal-title">
    <div class="br-rooms__modal-bar"><span>Санаторий «Белокуриха»</span><button class="br-rooms__close" type="button" aria-label="Закрыть описание номера">×</button></div>
    <div class="br-rooms__modal">
      <div class="br-rooms__gallery" tabindex="0" aria-label="Фотографии номера. Используйте стрелки влево и вправо.">
        <div class="br-rooms__stage"><img class="br-rooms__large" src="${rooms[0].images[0]}" alt="" width="1024" height="683"><button class="br-rooms__photo-prev" type="button" aria-label="Предыдущая фотография">${arrow}</button><button class="br-rooms__photo-next" type="button" aria-label="Следующая фотография">${arrow}</button><span class="br-rooms__photo-count" aria-live="polite" aria-atomic="true"></span></div>
        <div class="br-rooms__thumbs"></div>
      </div>
      <div class="br-rooms__info"><h3 id="br-rooms-modal-title"></h3><p class="br-rooms__modal-subtitle"></p>
        <div class="br-rooms__description"></div><h4>Характеристики</h4><dl class="br-rooms__parameters"></dl>
        <h4>Оснащение номера</h4><ul class="br-rooms__amenities"></ul><div class="br-rooms__notes"></div>
        <a class="br-rooms__all" href="https://www.belokurikha-san.ru/room/" target="_blank" rel="noopener">Перейти к каталогу ${arrow}</a>
      </div>
    </div>
  </dialog>
</section>`;
const data = rooms.map(({photos,source,originalName,...r})=>r);
fs.writeFileSync(path.join(out,'rooms-data.json'),JSON.stringify(rooms,null,2)+'\n');
fs.writeFileSync(path.join(out,'rooms-data.js'),'window.BelokurikhaRoomsData = '+JSON.stringify(data,null,2)+';\n');
fs.writeFileSync(path.join(out,'block.html'),`<link rel="stylesheet" href="/upload/belokurikha-rooms/rooms.css?v=${version}">\n${section.replaceAll('src="assets/','src="/upload/belokurikha-rooms/assets/')}\n<script src="/upload/belokurikha-rooms/rooms-data.js?v=${version}" defer></script>\n<script src="/upload/belokurikha-rooms/rooms.js?v=${version}" defer data-rooms-base="/upload/belokurikha-rooms/"></script>\n`);
fs.writeFileSync(path.join(out,'index.html'),`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Белокуриха — номера для вашего отдыха</title><link rel="stylesheet" href="rooms.css?v=${version}"><style>body{margin:0;background:#fff;padding:64px 0 40px} @media(max-width:680px){body{padding:28px 0}}</style><script src="rooms-data.js?v=${version}" defer></script><script src="rooms.js?v=${version}" defer></script></head><body>${section}</body></html>\n`);
if(process.argv.includes('--download')) {
  for(const r of rooms) for(const [i,url] of r.photos.entries()) {
    const dest=path.join(out,r.images[i]);
    if(!fs.existsSync(dest)) execFileSync('curl',['-4','-fsSL','--retry','1','--connect-timeout','12','--max-time','30',url.replace('https://belokurikha.ru/','https://www.belokurikha.ru/'),'-o',dest]);
  }
}
console.log(`Built ${rooms.length} room cards in ${out}`);
