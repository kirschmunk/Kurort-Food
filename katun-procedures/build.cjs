/* Build-time only. The published page contains no JavaScript. */
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const data = JSON.parse(fs.readFileSync(path.join(root, 'content.json'), 'utf8'));
const esc = s => String(s).replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
const image = (name, alt, cls = '', eager = false) => `<img class="${cls}" src="assets/photos/${name}.jpg" width="1200" height="800" alt="${esc(alt)}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">`;
function items(ids, category) {
  return `<div class="ktp-procedures">${ids.map(id => {
    const [title, text] = data.procedures[id];
    return `<article class="ktp-procedure" id="ktp-${category}-${id}"><h4 class="ktp-procedure-title">${esc(title)}</h4><p class="ktp-procedure-text">${esc(text)}</p></article>`;
  }).join('\n')}</div>`;
}
const categories = data.categories.map((c, i) => {
  const ids = c.items || c.groups.flatMap(g => g.items);
  const visual = c.image ? image(c.image, c.alt, 'ktp-cover-photo') : `<span class="ktp-illustration"><img src="assets/icons/${c.icon}.png" width="96" height="96" alt="" loading="lazy"></span>`;
  return `<details class="ktp-category" id="ktp-${c.id}">
    <summary class="ktp-category-toggle">
      <span class="ktp-cover">${visual}</span>
      <span class="ktp-category-info"><span class="ktp-category-number">${String(i + 1).padStart(2, '0')} / НАПРАВЛЕНИЕ</span><span class="ktp-category-title">${esc(c.title)}</span><span class="ktp-category-subtitle">${esc(c.subtitle)}</span><span class="ktp-category-bottom"><span class="ktp-count">${ids.length} ${ids.length % 10 === 1 && ids.length !== 11 ? 'процедура' : ids.length % 10 >= 2 && ids.length % 10 <= 4 && (ids.length < 12 || ids.length > 14) ? 'процедуры' : 'процедур'}</span><span class="ktp-toggle-label"><span class="ktp-show">Смотреть</span><span class="ktp-hide">Свернуть</span><span class="ktp-plus" aria-hidden="true"></span></span></span></span>
    </summary>
    <div class="ktp-category-body">${c.groups ? c.groups.map(g => `<section class="ktp-profile-group"><h3 class="ktp-group-title">${esc(g.title)}</h3>${items(g.items, c.id)}</section>`).join('\n') : items(ids, c.id)}<p class="ktp-category-note">Состав программы, количество процедур и противопоказания определяет врач на консультации.</p></div>
  </details>`;
}).join('\n');
const html = `<main class="ktp-page" id="ktp-top">
  <nav class="ktp-breadcrumbs" aria-label="Хлебные крошки"><a href="https://www.katun-san.ru/">Главная</a><span aria-hidden="true">/</span><a href="https://www.katun-san.ru/treatment/preimushchestva.html">Лечение</a><span aria-hidden="true">/</span><span aria-current="page">Процедуры</span></nav>
  <section class="ktp-hero" aria-labelledby="ktp-title">
    <div class="ktp-hero-copy"><p class="ktp-eyebrow">САНАТОРИЙ «КАТУНЬ» · БЕЛОКУРИХА</p><h1 class="ktp-title" id="ktp-title">Процедуры</h1><p class="ktp-hero-heading">Забота о здоровье.<br>Внимание к вам.</p><p class="ktp-hero-text">Лечение, восстановление и уход —<br class="ktp-desktop-break"> в спокойном ритме курортной жизни.<br class="ktp-desktop-break"> Найдите своё направление, а программу<br class="ktp-desktop-break"> доверьте специалисту.</p><a class="ktp-button" href="#ktp-catalog">Выбрать направление <span aria-hidden="true">↓</span></a><span class="ktp-hero-footnote">Индивидуальный подход начинается с консультации</span></div>
    <div class="ktp-hero-visual">${image('massage', 'Ручной массаж в санатории «Катунь»', 'ktp-hero-photo', true)}<div class="ktp-hero-caption"><span>ВРЕМЯ ДЛЯ СЕБЯ</span><p>В окружении заботы</p></div></div>
  </section>
  <section class="ktp-intro" aria-label="Подход к лечению"><div class="ktp-intro-item"><span class="ktp-intro-number">01</span><div><h2 class="ktp-intro-title">Сначала — консультация</h2><p class="ktp-intro-text">Врач учитывает ваше состояние<br>и подбирает программу.</p></div></div><div class="ktp-intro-item"><span class="ktp-intro-number">02</span><div><h2 class="ktp-intro-title">Разные направления</h2><p class="ktp-intro-text">От диагностики и физиотерапии<br>до массажа и СПА-ухода.</p></div></div><div class="ktp-intro-item"><span class="ktp-intro-number">03</span><div><h2 class="ktp-intro-title">Курортный ритм</h2><p class="ktp-intro-text">Время для процедур, отдыха<br>и прогулок на свежем воздухе.</p></div></div></section>
  <section class="ktp-catalog" id="ktp-catalog" aria-labelledby="ktp-catalog-title"><div class="ktp-section-head"><div><p class="ktp-eyebrow">ЛЕЧЕНИЕ И ВОССТАНОВЛЕНИЕ</p><h2 class="ktp-section-title" id="ktp-catalog-title">Что подойдёт именно вам?</h2></div><p class="ktp-section-description">Откройте направление, чтобы узнать<br class="ktp-desktop-break"> больше о процедурах и вариантах ухода.</p></div><div class="ktp-catalog-grid">${categories}</div></section>
  <section class="ktp-consult" aria-labelledby="ktp-consult-title"><div class="ktp-consult-visual">${image('doctor', 'Консультация врача в санатории «Катунь»', 'ktp-consult-photo')}</div><div class="ktp-consult-copy"><p class="ktp-eyebrow">ВАША ИНДИВИДУАЛЬНАЯ ПРОГРАММА</p><h2 class="ktp-section-title" id="ktp-consult-title">Начните с разговора<br>со специалистом</h2><p class="ktp-consult-text">Не обязательно разбираться во всех методиках самостоятельно. Врач оценит состояние здоровья, учтёт противопоказания и поможет составить план процедур.</p><div class="ktp-actions"><a class="ktp-button" href="https://www.katun-san.ru/treatment/doctors.html">Познакомиться с врачами <span aria-hidden="true">↗</span></a><a class="ktp-text-link" href="https://www.katun-san.ru/treatment/price-list.html">Стоимость процедур <span aria-hidden="true">↗</span></a></div></div></section>
  <section class="ktp-contact" aria-labelledby="ktp-contact-title"><div><p class="ktp-eyebrow">ПОМОЖЕМ СПЛАНИРОВАТЬ ПОЕЗДКУ</p><h2 class="ktp-contact-title" id="ktp-contact-title">Есть вопросы об отдыхе в «Катуни»?</h2></div><div class="ktp-contact-phone"><a href="tel:88007075186">8 800 707 51 86</a><span>Звонок по России бесплатный</span></div></section>
  <footer class="ktp-footer"><p class="ktp-medical-note">Имеются противопоказания. Необходима консультация специалиста.</p><p class="ktp-footer-text">Информация о процедурах носит ознакомительный характер. Состав лечения и перечень услуг, входящих в путёвку, уточняйте при бронировании и на приёме у врача.</p><a class="ktp-back-top" href="#ktp-top">В начало страницы ↑</a></footer>
</main>`;
fs.writeFileSync(path.join(root, 'embed.html'), html + '\n');
const head = `<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><meta name="theme-color" content="#3d785e"><meta name="description" content="Процедуры санатория Катунь: диагностика, физиотерапия, лечебные ванны, массаж, косметология и СПА. Индивидуальная программа по назначению врача."><title>Процедуры — санаторий «Катунь»</title><link rel="stylesheet" href="styles.css?v=${data.version}"></head><body>\n`;
const demoHeader = `<header class="ktp-demo-header"><a href="https://www.katun-san.ru/"><img src="assets/logo.png" width="260" height="100" alt="Санаторий Катунь — Курорт Белокуриха"></a><div class="ktp-demo-links"><a href="https://www.katun-san.ru/treatment/preimushchestva.html">Лечение в санатории</a><a href="https://www.katun-san.ru/treatment/price-list.html">Прайс-лист</a></div><a class="ktp-demo-phone" href="tel:88007075186">8 800 707 51 86<span>Звонок по России бесплатный</span></a></header>\n`;
fs.writeFileSync(path.join(root, 'index.html'), head + demoHeader + html + '\n</body></html>\n');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
fs.mkdirSync(path.join(root, 'cms'), { recursive: true });
fs.writeFileSync(path.join(root, 'cms/katun-procedures.html'), html.replaceAll('src="assets/', 'src="/upload/katun-procedures/assets/') + '\n');
fs.writeFileSync(path.join(root, 'cms/katun-procedures.css'), css.split('/* DEMO ONLY */')[0].replaceAll('url("assets/', 'url("/upload/katun-procedures/assets/'));
console.log(`Built demo + full CMS page. ${Object.keys(data.procedures).length} unique procedures / ${data.categories.length} categories.`);
