/* Build-time only. The published page contains no JavaScript. */
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
const descriptions = JSON.parse(fs.readFileSync(path.join(root, 'procedure-details.json'), 'utf8'));
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const image = (name, alt, cls = '', eager = false) => `<img class="${cls}" src="assets/photos/${name}.jpg" width="1200" height="800" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
const categoryIds = c => c.items || c.groups.flatMap(g => g.items);
const plus = '<span class="ktp-plus" aria-hidden="true"></span>';
const related = links => links?.length ? `<div class="ktp-related">${links.map(l => `<p><a href="#ktp-${esc(l.category)}">${esc(l.text)}</a></p>`).join('')}</div>` : '';
function items(ids, category) {
  if (!ids.length) return '';
  return `<div class="ktp-procedures">${ids.map(id => {
    const [title] = data.procedures[id];
    const d = descriptions[id];
    const media = d.photo && !d.photoPlaceholder ? image(d.photo, d.photoAlt || title, 'ktp-detail-photo') : `<div class="ktp-photo-placeholder" role="img" aria-label="Место для фотографии: ${esc(title)}"><span class="ktp-photo-symbol" aria-hidden="true"></span><span>Фото процедуры</span><small>Добавим снимок</small></div>`;
    const copy = d.paragraphs.map(p => `<p class="ktp-procedure-text">${esc(p)}</p>`).join('') + (d.points ? `<h4 class="ktp-detail-heading">${esc(d.listTitle)}</h4><ul class="ktp-detail-list">${d.points.map(p => `<li>${esc(p)}</li>`).join('')}</ul>` : '') + (d.note ? `<p class="ktp-procedure-text">${esc(d.note)}</p>` : '');
    return `<details class="ktp-procedure" id="ktp-${category}-${id}" data-procedure="${id}" name="ktp-procedures-${category}"><summary class="ktp-procedure-toggle"><span class="ktp-procedure-title">${esc(title)}</span>${plus}</summary><div class="ktp-procedure-detail"><div class="ktp-detail-copy">${copy}</div><div class="ktp-detail-media">${media}</div></div></details>`;
  }).join('\n')}</div>`;
}
function category(c) {
  const ids = categoryIds(c);
  const visual = c.image ? image(c.image, c.alt, 'ktp-cover-photo') : `<span class="ktp-illustration"><img src="assets/icons/${c.icon}.png" width="96" height="96" alt="" loading="lazy"></span>`;
  return `<details class="ktp-category" id="ktp-${c.id}" name="ktp-categories">
    <summary class="ktp-category-toggle"><span class="ktp-cover">${visual}</span><span class="ktp-category-info"><span class="ktp-category-title">${esc(c.title)}</span><span class="ktp-category-subtitle">${esc(c.subtitle)}</span></span>${plus}</summary>
    <div class="ktp-category-body">${c.groups ? c.groups.map(g => `<section class="ktp-profile-group"><h3 class="ktp-group-title">${esc(g.title)}</h3>${items(g.items, c.id)}${related(g.related)}</section>`).join('\n') : items(ids, c.id)}${related(c.related)}</div>
  </details>`;
}
const sections = [
  {id:'treatment',anchor:'catalog',eyebrow:'ЛЕЧЕБНАЯ ПРОГРАММА',title:'Процедуры по направлениям лечения',intro:'Одни и те же процедуры могут применяться при разных заболеваниях. Что подойдёт именно вам, определит лечащий врач.'},
  {id:'methods',anchor:'methods',eyebrow:'ДОПОЛНЕНИЕ К ПРОГРАММЕ',title:'Диагностика и общие методики',intro:'Исследования, физиотерапия и оздоровительные процедуры, которые могут дополнять лечение по разным направлениям.'},
  {id:'care',anchor:'care',eyebrow:'УХОД ЗА ЛИЦОМ И ТЕЛОМ',title:'Косметология и СПА',intro:''}
];
const catalogs = sections.map(s => `<section class="ktp-catalog${s.id === 'care' ? ' ktp-care' : ''}" id="ktp-${s.anchor}" aria-labelledby="ktp-${s.anchor}-title"><div class="ktp-section-head"><p class="ktp-eyebrow">${s.eyebrow}</p><h2 class="ktp-section-title" id="ktp-${s.anchor}-title">${s.title}</h2>${s.intro ? `<p class="ktp-catalog-intro">${s.intro}</p>` : ''}</div><div class="ktp-catalog-list">${data.categories.filter(c => c.section === s.id).map(category).join('\n')}</div></section>`).join('\n');
const medicalCount = new Set(data.categories.filter(c=>c.section!=='care').flatMap(categoryIds)).size;
const cosmeticCount = categoryIds(data.categories.find(c => c.id === 'cosmetology')).length;
const spaCount = categoryIds(data.categories.find(c => c.id === 'spa')).length;
const html = `<main class="ktp-page" id="ktp-top">
  <nav class="ktp-breadcrumbs" aria-label="Хлебные крошки"><a href="https://www.katun-san.ru/">Главная</a><span aria-hidden="true">/</span><a href="https://www.katun-san.ru/treatment/preimushchestva.html">Лечение</a><span aria-hidden="true">/</span><span aria-current="page">Процедуры</span></nav>
  <section class="ktp-hero" aria-labelledby="ktp-title">
    <div class="ktp-hero-copy"><p class="ktp-eyebrow">САНАТОРИЙ «КАТУНЬ»</p><h1 class="ktp-title" id="ktp-title">Процедуры</h1><p class="ktp-hero-heading">С заботой о вашем здоровье</p><p class="ktp-hero-text">Какие процедуры есть в «Катуни» и как они проходят? Здесь можно познакомиться с ними, а на приёме обсудить с врачом, что подойдёт вам.</p><a class="ktp-button" href="#ktp-catalog">Выбрать процедуру <span aria-hidden="true">↓</span></a></div>
    <div class="ktp-hero-visual">${image('massage', 'Ручной массаж в санатории «Катунь»', 'ktp-hero-photo', true)}</div>
  </section>
  <section class="ktp-stats" aria-label="В этом каталоге"><div class="ktp-stat"><span class="ktp-stat-number">${medicalCount}</span><span class="ktp-stat-label">процедуры<br>и исследования</span></div><div class="ktp-stat"><span class="ktp-stat-number">${cosmeticCount}</span><span class="ktp-stat-label">косметологических<br>процедур</span></div><div class="ktp-stat"><span class="ktp-stat-number">${spaCount}</span><span class="ktp-stat-label">СПА-программ<br>и уходов</span></div></section>
  <nav class="ktp-catalog-nav" aria-label="Разделы каталога"><a href="#ktp-catalog">Направления лечения</a><a href="#ktp-methods">Диагностика и методики</a><a href="#ktp-care">Косметология и СПА</a></nav>
  ${catalogs}
  <section class="ktp-consult" aria-labelledby="ktp-consult-title"><div class="ktp-consult-visual">${image('doctor', 'Консультация врача в санатории «Катунь»', 'ktp-consult-photo')}</div><div class="ktp-consult-copy"><p class="ktp-eyebrow">ВАША ИНДИВИДУАЛЬНАЯ ПРОГРАММА</p><h2 class="ktp-section-title" id="ktp-consult-title">Начните с разговора<br>со специалистом</h2><p class="ktp-consult-text">Не обязательно разбираться во всех методиках самостоятельно. Врач оценит состояние здоровья, учтёт противопоказания и поможет составить план процедур.</p><div class="ktp-actions"><a class="ktp-button" href="https://www.katun-san.ru/treatment/doctors.html">Познакомиться с врачами</a><a class="ktp-text-link" href="https://www.katun-san.ru/treatment/price-list.html">Стоимость процедур</a></div></div></section>
</main>`;
fs.writeFileSync(path.join(root, 'embed.html'), html + '\n');
const head = `<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#3d785e"><meta name="description" content="Процедуры санатория Катунь: диагностика, физиотерапия, лечебные ванны, массаж, косметология и СПА. Индивидуальная программа по назначению врача."><title>Процедуры — санаторий «Катунь»</title><link rel="stylesheet" href="styles.css?v=${data.version}"></head><body>\n`;
fs.writeFileSync(path.join(root, 'index.html'), head + html + '\n</body></html>\n');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
fs.mkdirSync(path.join(root, 'cms'), { recursive: true });
fs.writeFileSync(path.join(root, 'cms/katun-procedures.html'), html.replaceAll('src="assets/', 'src="/upload/katun-procedures/assets/') + '\n');
fs.writeFileSync(path.join(root, 'cms/katun-procedures.css'), css.split('/* DEMO ONLY */')[0].replaceAll('url("assets/', 'url("/upload/katun-procedures/assets/'));
console.log(`Built demo + full CMS page. ${Object.keys(data.procedures).length} unique procedures / ${data.categories.length} categories.`);
