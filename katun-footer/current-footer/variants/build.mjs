import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
const root = dirname(fileURLToPath(import.meta.url));
const read = path => readFileSync(join(root, path), 'utf8');
const template = read('../demo-template.html');
const base = template.replace('%%RATINGS%%', '');
const badges = read('../ratings.html').replace(/^<!--[^]*?-->\s*/, '').trim();
const baseCss = read('../ratings.css');
const placements = read('placements.css');
const socialAnchor = '        </div>\n      </div>\n      <div class="page-footer__right">';
const subscribeAnchor = '      </div>\n      <div class="container">\n        <div id="footercontainer">';
assert.equal(base.split(socialAnchor).length, 2);
assert.equal(base.split(subscribeAnchor).length, 2);
const definitions = [
  { key: 'social', title: 'Под соцсетями', placement: 'Внутри `.page-footer__left`, сразу после закрывающего `div.page-footer__social-links`.', insert: (s, b) => s.replace(socialAnchor, '        </div>\n' + b + '\n      </div>\n      <div class="page-footer__right">') },
  { key: 'subscribe', title: 'Под подпиской', placement: 'Внутри `.page-footer__right`, сразу после закрывающего `div.subscribe`. Не внутрь формы или блока согласия.', insert: (s, b) => s.replace(subscribeAnchor, b + '\n' + subscribeAnchor) },
  { key: 'logo', title: 'Внизу слева, под логотипом', placement: 'После `.container`, содержащего `#footercontainer`, перед следующей `.container` с `p.policycontainer`. Это отдельная строка, выровненная по левому краю логотипа; не вкладывать её в `.logo` или `.footer-info-col`.', insert: (s, b) => template.replace('%%RATINGS%%', b) }
];
const normalize = s => s.replace(/\s+/g, ' ').trim();
const body = s => s.match(/<body>([^]*)<\/body>/)[1];
for (const option of definitions) {
  const dir = join(root, option.key);
  mkdirSync(dir, { recursive: true });
  const snippet = badges.replace('class="ktfr-ratings"', `class="ktfr-ratings ktfr-ratings--${option.key}"`);
  let html = option.insert(base, snippet);
  assert.equal(normalize(body(html.replace(snippet, ''))), normalize(body(base)), 'Existing footer markup must be unchanged');
  html = html
    .replace('<title>Катунь — действующий футер с рейтингами</title>', `<title>Катунь — рейтинги: ${option.title.toLowerCase()}</title>`)
    .replace('href="site-reference.css"', 'href="../../site-reference.css"')
    .replace('src="demo.js"', 'src="../../demo.js"')
    .replaceAll('../assets/', '../../../assets/');
  const match = placements.match(new RegExp(`#footer \\.ktfr-ratings--${option.key} \\{[^}]+\\}`));
  assert(match, 'Missing placement style');
  const extraCss = match[0] + (option.key === 'logo' ? '\n@media (max-width: 685px) {\n  #footer .ktfr-ratings--logo { justify-content: center; }\n}' : '');
  const css = baseCss + '\n/* Расположение для этого варианта. */\n' + extraCss + '\n';
  const checkCss = css.replace(/\/\*[^]*?\*\//g, '').replace(/@media[^{}]+\{/g, '');
  for (const rule of checkCss.matchAll(/([^{}]+)\{/g)) {
    for (const selector of rule[1].split(',')) assert(selector.trim().startsWith('#footer .ktfr-'));
  }
  assert.equal((html.match(/class="ktfr-ratings__slot"/g) || []).length, 2);
  assert(html.includes('1102639152') && html.includes('2815278048144278'));
  assert(!/<header|<main|<aside|<form|fetch\(|XMLHttpRequest/.test(html));
  writeFileSync(join(dir, 'ratings.html'), '<!-- Оценки 5,0 условные: заменить макеты официальными виджетами Катуни. -->\n' + snippet + '\n');
  writeFileSync(join(dir, 'ratings.css'), css);
  writeFileSync(join(dir, 'index.html'), html);
  for (const match of html.matchAll(/(?:src|href)="([^"#]+)"|url\(([^)]+)\)/g)) {
    const path = match[1] || match[2];
    if (!/^(https?:|tel:|tg:)/.test(path)) assert(existsSync(join(dir, path)), 'Missing asset: ' + path);
  }
  writeFileSync(join(dir, 'README.md'), `# ${option.title}\n\n[Демка](https://kirschmunk.github.io/Kurort-Food/katun-footer/current-footer/variants/${option.key}/)\n\n![Макет](preview.png)\n\n## Точечная вставка\n\n1. Подключить [ratings.css](ratings.css) после стилей сайта. В файл уже включены общие стили плашек и их расположение; другие CSS этой демонстрации на сайт не переносить.\n2. Вставить [ratings.html](ratings.html) один раз. Место: ${option.placement}\n3. Оставить существующий футер, подписку, контакты, юридический текст, рекламную полосу и чаты без изменений. Не объединять несколько вариантов: выбрать один.\n4. В двух слотах заменить демонстрационные плашки официальными виджетами Катуни, рассчитанными на 150 × 50 px. Если размеры виджетов отличаются, согласованно изменить размеры слотов.\n\nОценки 5,0 условные, не подтверждены как текущие. Макеты нельзя переносить на основной сайт вместо настоящих рейтингов. Демо не отправляет данные формы подписки.\n\nСамостоятельная демка использует общие ресурсы из родительских папок. Для локального открытия скачать каталог katun-footer целиком. Основной сайт не изменён.\n`);
  console.log('PASS: ' + option.key + ' — identical original markup, isolated new CSS, two badges, local assets.');
}
