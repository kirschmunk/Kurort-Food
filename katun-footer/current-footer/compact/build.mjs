import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = dirname(fileURLToPath(import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const base = read('../demo-template.html').replace('%%RATINGS%%', '');
const start = base.indexOf('<div class="page-footer__left">');
const end = base.indexOf('<div class="page-footer__right">');
assert(start >= 0 && end > start);
const originalLeft = base.slice(start, end).trim();
const heading = originalLeft.match(/<h2[^]*?<\/h2>/)[0];
const socials = originalLeft.match(/<div class="page-footer__social-links">[^]*?<\/div>/)[0];
const badges = read('official-ratings.html').trim();
const commonCss = read('../ratings.css') + '\n' + read('common.css');
const options = [
  { key: 'inline', title: 'В одну линию', description: 'Соцсети собраны компактно слева, два рейтинга расположены рядом справа на одной линии. Группы разделены тонкой вертикальной линией.', content: `${heading}\n<div class="ktfc__row">${socials}\n${badges}</div>` },
  { key: 'columns', title: 'Две соседние группы', description: 'Соцсети и отзывы оформлены как две компактные группы с отдельными заголовками. Справа остаётся существующая подписка.', content: `<div class="ktfc__columns"><div class="ktfc__group">${heading}\n${socials}</div><div class="ktfc__group"><h3 class="ktfc__reviews-heading">Отзывы гостей</h3>${badges}</div></div>` },
  { key: 'stacked', title: 'Рейтинги вертикально справа', description: 'Соцсети собраны в компактный ряд, справа от них — две плашки одна над другой. На телефоне плашки переходят под соцсети.', content: `<div class="ktfc__split"><div class="ktfc__group">${heading}\n${socials}</div>${badges}</div>` }
];
for (const option of options) {
  if (option.key === 'stacked') continue; // Variant 3 remains the previously approved mockup.
  const dir = join(root, option.key);
  const snippet = `<div class="page-footer__left ktfc ktfc--${option.key}">\n${option.content}\n</div>`;
  // Проверка: изменена только разрешённая пользователем левая колонка.
  let html = base.replace(originalLeft, snippet);
  assert.equal(html.replace(snippet, originalLeft), base);
  const links = s => [...s.matchAll(/class="social-link"[^]*?<\/a>/g)].map(x => x[0]);
  assert.deepEqual(links(snippet), links(originalLeft));
  html = html.replace('<title>Катунь — действующий футер с рейтингами</title>', `<title>Катунь — компактные соцсети: ${option.title.toLowerCase()}</title>`)
    .replace('href="site-reference.css"', 'href="../../site-reference.css"')
    .replace('href="ratings.css"', 'href="compact.css?v=20261019-1"')
    .replace('src="demo.js"', 'src="../../demo.js"')
    .replaceAll('../assets/', '../../../assets/')
    .replace(/[\t ]+$/gm, '');
  const css = commonCss + '\n' + read(option.key + '/layout.css');
  const checkCss = css.replace(/\/\*[^]*?\*\//g, '').replace(/@media[^{}]+\{/g, '');
  for (const rule of checkCss.matchAll(/([^{}]+)\{/g)) for (const selector of rule[1].split(',')) {
    assert(/^#footer \.ktf[rc]/.test(selector.trim()), 'Style escapes the rating/social area: ' + selector);
  }
  assert.equal((html.match(/class="ktfr-ratings__slot"/g) || []).length, 2);
  assert.equal((html.match(/class="social-link"/g) || []).length, 5);
  assert(html.includes('1102639152') && html.includes('2815278048144278'));
  assert(!/92012401542|2815278048143818|<form|<header|<main|<aside/.test(html));
  const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(x => x[1]);
  assert.equal(ids.length, new Set(ids).size);
  writeFileSync(join(dir, 'index.html'), html);
  writeFileSync(join(dir, 'compact.css'), css);
  // Исходник для разработчика использует пути действующего сайта.
  const handoff = snippet.replaceAll('../assets/', 'https://www.katun-san.ru/img/icons/')
    .replace('https://www.katun-san.ru/img/icons/i-tg.png', 'https://www.belokurikha.ru/img/icons/i-tg.png');
  writeFileSync(join(dir, 'social-block.html'), '<!-- Меняется только .page-footer__left. Сохранить актуальные ссылки и скрытые элементы соцсетей из шаблона сайта. Официальные виджеты, оценки загружаются сервисами. -->\n' + handoff + '\n');
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"|url\(([^)]+)\)/g)) {
    const path = match[1] || match[2];
    if (!/^(https?:|tel:|tg:)/.test(path)) assert(existsSync(join(dir, path.split('?')[0])), 'Missing file: ' + path);
  }
  writeFileSync(join(dir, 'README.md'), `# ${option.title}

${option.description}

[Открыть демо](https://kirschmunk.github.io/Kurort-Food/katun-footer/current-footer/compact/${option.key}/)

![Макет футера](preview.png)

На снимке проверки 2ГИС может отсутствовать: встроенный браузер блокирует его внешний адрес (ERR_BLOCKED_BY_CLIENT). В HTML подключён настоящий виджет, не заглушка. Проверьте его в обычном браузере без блокировщика.

## Разработчику
${option.key !== 'stacked' ? '\n**Для внедрения используйте [готовый точечный комплект](../handoff/' + option.key + '/): сверенная разметка, CSS, сравнение и инструкция. Настоящие виджеты уже подключены.**\n' : ''}
1. Подключить [compact.css](compact.css) после существующих стилей. Все изменения ограничены новой левой колонкой с классом ktfc и плашками ktfr.
2. [social-block.html](social-block.html) — образец разметки **только** блока .page-footer__left. Добавить соответствующие обёртки и классы вокруг существующих заголовка и .page-footer__social-links, сохранив актуальные ссылки, иконки, скрытые соцсети и служебные атрибуты из шаблона. Не заменять весь футер.
3. Не менять .page-footer__right, форму Unisender, #footercontainer, контакты, логотип, юридический текст, чаты и рекламную полосу. Не подключать стили нескольких вариантов одновременно.
4. Официальные виджеты Катуни 150 × 50 px уже подключены. Оценки не записаны в коде: их загружают Яндекс и 2ГИС. Для работы нужен доступ к внешним сервисам.

В демо ссылки и иконки взяты из проверенного макета существующего футера. Подписка не отправляет данные. site-reference.css и demo.js нужны только для демонстрации: не переносить их на основной сайт. Для просмотра локально скачать каталог katun-footer целиком.

Проверено 19.10.2026: автоматические проверки кода и просмотр в браузере. На ширинах 320, 390, 768, 1024 и 1224 px нет горизонтального переполнения или пересечений плашек с соцсетями, заголовком и подпиской; плашки остаются 150 × 50 px, изображения загружаются. Перед внедрением проверить выбранный вариант с настоящими виджетами в шаблоне сайта.
`);
  console.log('PASS ' + option.key + ': only left column changed; existing socials preserved; scoped CSS; two badges; local assets.');
}
