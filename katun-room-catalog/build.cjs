/* Run `node build.cjs` after editing rooms-data.json. No dependencies. */
const fs = require('node:fs');
const path = require('node:path');
const rooms = JSON.parse(fs.readFileSync(path.join(__dirname, 'rooms-data.json')));
const version = '20261104-katun4';
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;').replaceAll('>','&gt;');
const title = text => escape(text).replace(/4\*$/, '4<sup>*</sup>');
const arrow = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const fact = (label,value) => `<div><dt>${escape(label)}</dt><dd>${escape(value)}</dd></div>`;
const section = prefix => `<section class="kt-rooms" data-kt-catalog aria-labelledby="kt-catalog-heading">
  <div class="kt-catalog__intro"><h1 id="kt-catalog-heading">Номера</h1><p>Вдвоём, с семьёй или только для себя — найдите свой вариант отдыха в «Катуни».</p></div>
  <div class="kt-catalog__grid">
${rooms.map((room,i)=>{
  const facts=[];
  if(room.area!=null)facts.push(fact('Площадь',`${room.area} м²`));
  if(room.main!=null)facts.push(fact('Основных мест',room.main));
  if(room.extra!=null)facts.push(fact('Доп. мест',room.extra));
  return `    <article class="kt-rooms__card" data-room="${room.id}">
      <div class="kt-rooms__visual">
        <button class="kt-rooms__photo" type="button" data-open-room="${room.id}" aria-haspopup="dialog" aria-label="Посмотреть номер: ${escape(room.title)}"><img src="${prefix}${room.previewImage}" alt="${escape(room.title)} — санаторий «Катунь»" width="640" height="540" loading="${i<4?'eager':'lazy'}" decoding="async"></button>
        <div class="kt-rooms__caption"><p>${escape(room.subtitle)}</p><h3><button class="kt-catalog__name" type="button" data-open-room="${room.id}" aria-haspopup="dialog">${title(room.title)}</button></h3></div>
      </div>
      <div class="kt-rooms__body">${facts.length?`<dl class="kt-rooms__facts">${facts.join('')}</dl>`:''}
        <a class="kt-catalog__book" href="https://www.katun-san.ru/reservation/" data-book-room="${room.id}" aria-label="Забронировать: ${escape(room.title)}">Забронировать</a>
      </div>
    </article>`;
}).join('\n')}
  </div>
  <dialog class="kt-rooms__dialog" aria-labelledby="kt-rooms-modal-title">
    <div class="kt-rooms__modal-bar"><span>Санаторий «Катунь»</span><button class="kt-rooms__close" type="button" aria-label="Закрыть описание номера">×</button></div>
    <div class="kt-rooms__modal">
      <div class="kt-rooms__gallery" tabindex="0" aria-label="Фотографии номера. Используйте стрелки влево и вправо.">
        <div class="kt-rooms__stage"><img class="kt-rooms__large" alt="" width="1200" height="800"><button class="kt-rooms__photo-prev" type="button" aria-label="Предыдущая фотография">${arrow}</button><button class="kt-rooms__photo-next" type="button" aria-label="Следующая фотография">${arrow}</button><span class="kt-rooms__photo-count" aria-live="polite" aria-atomic="true"></span></div>
        <div class="kt-rooms__thumbs"></div>
      </div>
      <div class="kt-rooms__info"><h3 id="kt-rooms-modal-title"></h3><p class="kt-rooms__modal-subtitle"></p><div class="kt-rooms__description"></div><div class="kt-rooms__specs"><h4>Характеристики</h4><dl class="kt-rooms__parameters"></dl></div></div>
    </div>
  </dialog>
</section>`;
const styles = prefix => `<link rel="stylesheet" href="${prefix}catalog.css?v=${version}">`;
const scripts = prefix => `<script src="${prefix}rooms-data.js?v=${version}" defer></script>\n<script src="${prefix}catalog.js?v=${version}" data-rooms-base="${prefix||'./'}" defer></script>`;
const publicRooms=rooms.map(({sourceFolderNumber,sourceFolder,sourcePages,sourceWorkbook,pending,editorialDraft,provisionalFields,provisionalSource,...r})=>r);
fs.writeFileSync(path.join(__dirname,'rooms-data.js'),`window.KatunRoomsData = ${JSON.stringify(publicRooms).replaceAll('<','\\u003c')};\n`);
fs.writeFileSync(path.join(__dirname,'index.html'),`<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>Номера — санаторий «Катунь»</title>
${styles('')}
<style>body{margin:0;background:#fff;padding:52px 0 64px}@media(max-width:580px){body{padding:28px 0 36px}}</style>
${scripts('')}
</head><body><main>${section('')}</main></body></html>\n`);
const upload='/upload/katun-room-catalog/';
fs.writeFileSync(path.join(__dirname,'block.html'),`${styles(upload)}\n${section(upload)}\n${scripts(upload)}\n`);
console.log(`Built Katun catalog: ${rooms.length} categories, no booking popup.`);
