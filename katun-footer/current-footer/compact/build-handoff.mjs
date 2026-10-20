import { readFileSync, writeFileSync, mkdirSync, copyFileSync, mkdtempSync, rmSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';

// Build handoff files from a public HTML snapshot. Never upload the full page.
const root = dirname(fileURLToPath(import.meta.url));
const source = process.argv[2];
assert(source, 'Usage: node build-handoff.mjs /path/to/katun-homepage-windows1251.html [qa-output-directory]');
const page = new TextDecoder('windows-1251').decode(readFileSync(source));
assert(page.includes('Мы в социальных сетях'), 'Unexpected source encoding or heading');
const start = page.indexOf('<div class="page-footer__left">');
const end = page.indexOf('<div class="page-footer__right">', start);
assert(start >= 0 && end > start, 'Footer boundary missing');
const before = page.slice(start, end).trim();
const heading = before.match(/<h2\b[^]*?<\/h2>/)?.[0];
const social = before.match(/<div class="page-footer__social-links">[^]*?<\/div>/)?.[0];
assert(heading && social);
const anchors = html => [...html.matchAll(/<a\b[^]*?<\/a>/g)].map(m => m[0]);
assert.equal(anchors(social).length, 7, 'Review changed social markup before packaging');
assert.equal((social.match(/style="display:none;"/g) || []).length, 2);
const ascii = s => [...s].map(c => c.codePointAt(0) > 127 ? `&#${c.codePointAt(0)};` : c).join('');
const clean = s => s.replace(/[\t ]+$/gm, '').trim() + '\n';
const badges = `<div class="ktfr-ratings" role="group" aria-label="Отзывы о санатории «Катунь»">
  <div class="ktfr-ratings__slot" data-provider="yandex">
    <!-- YANDEX: replace the link BELOW with the official Katun widget. Keep this outer div. -->
    <a class="ktfr-install-link" href="https://yandex.ru/maps/org/katun/1102639152/reviews/" target="_blank" rel="noopener noreferrer">Отзывы в Яндекс Картах</a>
    <!-- END YANDEX -->
  </div>
  <div class="ktfr-ratings__slot" data-provider="2gis">
    <!-- 2GIS: replace the link BELOW with the official Katun widget. Keep this outer div. -->
    <a class="ktfr-install-link" href="https://2gis.ru/belokuriha/firm/2815278048144278/tab/reviews/" target="_blank" rel="noopener noreferrer">Отзывы в 2ГИС</a>
    <!-- END 2GIS -->
  </div>
</div>`;
const slotCss = `/* Install ONE variant only. Widget layout; no hardcoded ratings. */
#footer .ktfc .ktfr-ratings {
  box-sizing: border-box;
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: 12px;
}
#footer .ktfc .ktfr-ratings__slot {
  box-sizing: border-box;
  flex: 0 0 150px;
  width: 150px;
  min-height: 50px;
}
#footer .ktfc .ktfr-ratings__slot > iframe {
  display: block;
  width: 150px;
  height: 50px;
  border: 0;
}
/* Working review links until the real widgets are supplied. */
#footer .ktfc .ktfr-install-link {
  box-sizing: border-box;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 150px;
  min-height: 50px;
  padding: 7px 9px;
  border: 1px solid #e1e1e1;
  border-radius: 5px;
  background: #fff;
  color: #242424;
  font: 12px/1.35 Arial, sans-serif;
  text-align: center;
  text-decoration: none;
}
#footer .ktfc .ktfr-install-link:focus-visible {
  outline: 2px solid #007296;
  outline-offset: 3px;
}
`;
const options = [
  { key: 'inline', number: 1, title: 'Соцсети и рейтинги в одну линию',
    contents: `${heading}\n<div class="ktfc__row">\n${social}\n${badges}\n</div>` },
  { key: 'columns', number: 2, title: 'Две группы — соцсети и отзывы',
    contents: `<div class="ktfc__columns">\n<div class="ktfc__group">\n${heading}\n${social}\n</div>\n<div class="ktfc__group">\n<h3 class="ktfc__reviews-heading">Отзывы гостей</h3>\n${badges}\n</div>\n</div>` }
];
const output = join(root, 'handoff');
mkdirSync(output, { recursive: true });
for (const option of options) {
  const dir = join(output, option.key);
  mkdirSync(dir, { recursive: true });
  const after = clean(`<div class="page-footer__left ktfc ktfc--${option.key}">\n${option.contents}\n</div>`);
  assert.deepEqual(anchors(after).slice(0, 7), anchors(social), 'Existing links must remain byte-for-byte unchanged');
  assert.equal((after.match(/data-provider=/g) || []).length, 2);
  assert(!/<form|<script|5,0|★★★★★/.test(after));
  const patchedPage = page.slice(0, start) + after.trimEnd() + page.slice(start + before.length);
  assert.equal(patchedPage.replace(after.trimEnd(), before), page, 'Changes must stay inside the left block');
  const css = slotCss + '\n' + readFileSync(join(root, 'common.css'), 'utf8').replace(/\/\*[^]*?\*\//g, '') +
    '\n' + readFileSync(join(root, option.key, 'layout.css'), 'utf8');
  const flat = css.replace(/\/\*[^]*?\*\//g, '').replace(/@media[^{}]+\{/g, '');
  for (const rule of flat.matchAll(/([^{}]+)\{/g)) {
    for (const selector of rule[1].split(',')) assert(selector.trim().startsWith('#footer .ktfc'), selector);
  }
  const beforeFile = clean(ascii(before));
  const afterFile = clean(ascii(after));
  assert(!/[^\x00-\x7f]/.test(afterFile + css));
  writeFileSync(join(dir, '01-replace-block.html'), afterFile);
  writeFileSync(join(dir, '02-footer-ratings.css'), clean(css));
  writeFileSync(join(dir, 'before-reference.html'), beforeFile);
  copyFileSync(join(root, option.key, 'preview.png'), join(dir, 'desktop-preview.png'));
  const diff = spawnSync('diff', ['-u', '--label', 'before/page-footer-left.html', '--label',
    'after/page-footer-left.html', join(dir, 'before-reference.html'), join(dir, '01-replace-block.html')], { encoding: 'utf8' });
  assert.equal(diff.status, 1);
  writeFileSync(join(dir, '03-changes.diff'), diff.stdout);
  const manual = `# Вариант ${option.number}. ${option.title}

Точечная правка существующего футера. Переписывать футер целиком не нужно.
Проверено по публичной разметке katun-san.ru от 20.10.2026. Путь к файлу серверного шаблона неизвестен: найдите его по классу page-footer__left.

## Быстрое внедрение: один HTML-блок и один CSS-файл

### 1. Найти и заменить только левую колонку

В исходнике шаблона найдите:

\`\`\`html
<div class="page-footer__left">
\`\`\`

Это блок с заголовком «Мы в социальных сетях» и списком иконок. Замените его целиком, включая его открывающий и закрывающий div, содержимым файла **01-replace-block.html**.

Граница замены — конец этой левой колонки, ПЕРЕД соседним блоком:

\`\`\`html
<div class="page-footer__right">
\`\`\`

Не заканчивайте замену на первом закрывающем div: он закрывает вложенный список соцсетей, а не всю левую колонку. Не заменяйте сам page-footer__right и ничего после него.

В готовом блоке сохранены все семь исходных социальных ссылок, пути к иконкам, атрибуты и две скрытые соцсети. Если в рабочем шаблоне ссылки генерируются PHP/CMS или уже изменились, сохраните этот исходный список/код и перенесите вокруг него только новые обёртки из 01-replace-block.html. Файл **03-changes.diff** показывает эти изменения; это справочное сравнение блока, а не команда git apply для неизвестного серверного файла.

### 2. Добавить стили

Создайте на сайте файл **/css/katun-footer-ratings.css** из **02-footer-ratings.css**. После существующего подключения /css/main.css добавьте:

\`\`\`html
<link rel="stylesheet" href="/css/katun-footer-ratings.css?v=20261020-${option.key}">
\`\`\`

Альтернатива: добавьте содержимое CSS в конец существующего файла стилей. Используйте только один способ и только один вариант. Если вчерашние демонстрационные compact.css/ratings.css уже подключены для этой правки, удалите их подключения: новый CSS самодостаточен.

Все новые правила ограничены #footer .ktfc. Они не меняют фон, логотип, телефоны, правую колонку подписки, юридический текст, рекламную полосу и чат.

### 3. Вставить настоящие виджеты

В новом HTML есть два места, отмеченные комментариями **YANDEX** и **2GIS**:

\`\`\`html
<div class="ktfr-ratings__slot" data-provider="yandex">
  <!-- Код виджета Яндекс Карт для Катуни -->
</div>
<div class="ktfr-ratings__slot" data-provider="2gis">
  <!-- Код виджета 2ГИС для Катуни -->
</div>
\`\`\`

В каждом из этих div замените временную ссылку целиком кодом соответствующего официального виджета. Сами div с классом ktfr-ratings__slot оставьте.

Для согласованных макетов предусмотрены горизонтальные виджеты **150 × 50 px**. Если официальный код имеет другой размер, подстройте ширину .ktfr-ratings__slot, flex-basis и размеры iframe; не сжимайте виджет через transform: scale(). Если поставщик требует отдельный script, подключите его по его инструкции один раз и убедитесь, что оба виджета отрисовались.

Коды виджетов заказчик пока не передал. Поэтому в установочном файле стоят рабочие ссылки «Отзывы в Яндекс Картах» и «Отзывы в 2ГИС», без выдуманных оценок и звёзд. Это временный вид до вставки настоящих виджетов. На desktop-preview.png показан согласованный макет с условными рейтингами, а не подтверждённые текущие оценки.

## Кодировка — важно

Публичная страница сейчас объявляет Windows-1251. Вставляемый HTML и CSS состоят только из ASCII; русские надписи в HTML записаны числовыми сущностями &#...;. В браузере они отображаются обычным русским текстом и безопасны для Windows-1251 и UTF-8.

Сохраняйте исходную кодировку рабочего шаблона. Не меняйте meta charset всего сайта ради этой правки. README и инструкция — UTF-8, их содержимое в шаблон не копируется. Код виджетов с русским текстом вставляйте с сохранением кодировки шаблона.

## Проверить перед выкладкой

- Выбран только один вариант. Пять видимых иконок остались на месте, две скрытые соцсети не появились.
- Обе плашки относятся к «Катуни», а не к другому санаторию; клики ведут на нужные карточки.
- Проверьте экран 1224/1440 px и мобильные ширины 320/390 px: без наложений и горизонтальной прокрутки.
- Форма Unisender, её action, поля, согласие и обработчики не изменены. При проверке не отправляйте тестовую подписку реального посетителя без согласования.
- Нет ошибок загрузки CSS, иконок, iframe/script; учтены ограничения CSP и внешних ресурсов сайта.

Компоновка с временными ссылками проверяется отдельно от официальных виджетов. Окончательная проверка виджетов возможна после получения их кодов и установки в рабочий шаблон.

## Откат

До правки сохраните копию исходного шаблона и стилей. Для отката верните свою сохранённую левую колонку и уберите подключение нового CSS (или добавленный CSS-блок). before-reference.html — справочный снимок публичной разметки, не замена резервной копии PHP/CMS-шаблона.

## Файлы

- 01-replace-block.html — новый блок для замены.
- 02-footer-ratings.css — отдельные стили выбранного варианта.
- 03-changes.diff — наглядно «было / стало».
- before-reference.html — исходная левая колонка для сверки.
- desktop-preview.png — согласованный десктопный макет.
- README.md / START-HERE.html — эта инструкция.

[Согласованное демо](https://kirschmunk.github.io/Kurort-Food/katun-footer/current-footer/compact/${option.key}/)
`;
  writeFileSync(join(dir, 'README.md'), manual);
  const escaped = manual.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;');
  writeFileSync(join(dir, 'START-HERE.html'), `<!doctype html><html lang="ru"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Вариант ${option.number} — инструкция</title><style>body{max-width:900px;margin:32px auto;padding:0 20px;color:#263e35;font:16px/1.6 system-ui,sans-serif}img{max-width:100%;height:auto;border:1px solid #ddd}pre{white-space:pre-wrap;font:inherit;overflow-wrap:anywhere}a{color:#007355}</style><h1>Вариант ${option.number}</h1><img src="desktop-preview.png" alt="Десктопный макет"><p><a href="01-replace-block.html" download>Скачать HTML-блок</a> · <a href="02-footer-ratings.css" download>Скачать CSS</a> · <a href="03-changes.diff" download>Скачать сравнение</a></p><pre>${escaped}</pre></html>\n`);
  // Verify that the reference diff applies and reconstructs the expected block.
  const temp = mkdtempSync(join(tmpdir(), 'katun-footer-patch-'));
  try {
    const testFile = join(temp, 'page-footer-left.html');
    copyFileSync(join(dir, 'before-reference.html'), testFile);
    const applied = spawnSync('patch', [testFile, join(dir, '03-changes.diff')], { encoding: 'utf8' });
    assert.equal(applied.status, 0, applied.stdout + applied.stderr);
    assert.equal(readFileSync(testFile, 'utf8'), afterFile);
  } finally { rmSync(temp, { recursive: true, force: true }); }
  // Optional local QA page; do not publish it as the agreed design.
  if (process.argv[3]) {
    const qa = resolve(process.argv[3]);
    mkdirSync(join(qa, option.key), { recursive: true });
    const template = readFileSync(join(root, '../demo-template.html'), 'utf8').replace('%%RATINGS%%', '');
    const leftStart = template.indexOf('<div class="page-footer__left">');
    const leftEnd = template.indexOf('<div class="page-footer__right">');
    let html = template.slice(0, leftStart) + afterFile + '\n' + template.slice(leftEnd);
    html = html.replace('href="site-reference.css"', 'href="/katun-footer/current-footer/site-reference.css"')
      .replace('href="ratings.css"', 'href="install.css"')
      .replace('src="demo.js"', 'src="/katun-footer/current-footer/demo.js"')
      .replaceAll('../assets/', '/katun-footer/assets/')
      .replaceAll('/img/icons/', '/katun-footer/assets/')
      .replace('https://www.belokurikha.ru/katun-footer/assets/i-tg.png', '/katun-footer/assets/i-tg.png');
    writeFileSync(join(qa, option.key, 'index.html'), html);
    writeFileSync(join(qa, option.key, 'install.css'), clean(css));
  }
  console.log(`PASS ${option.key}: 7 links preserved, 2 hidden, no fabricated rating, ASCII markup/CSS, scoped styles, diff round-trip.`);
}
