/* Package the approved seasonal demos without changing their public layout. */
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const { execFileSync } = require('node:child_process');
const root = path.resolve(__dirname, '..');
const sites = [
  { id: 'portal', dir: 'seasonal-banners', label: 'Портал Белокуриха.ру', prefix: 'portal-season', width: 1226, gutter: 15 },
  { id: 'katun', dir: 'seasonal-banners-katun', label: 'Катунь', prefix: 'katun-season', width: 1448, gutter: 24 },
  { id: 'sibir', dir: 'seasonal-banners-sibir', label: 'Сибирь', prefix: 'sibir-season', width: 1508, gutter: 24 },
  { id: 'belokurikha', dir: 'seasonal-banners-belokurikha', label: 'Белокуриха', prefix: 'belokurikha-season', width: 1248, gutter: 24 },
];
const assets = {
  '../mental-health-season-sibir/assets/mental-health-hero.jpg': 'assets/images/mental-health.jpg',
  '../new-year-portal/assets/brief/booking-photo.png': 'assets/images/new-year.png',
  '../assets/fonts/Acrom-Regular.woff': 'assets/fonts/Acrom-Regular.woff',
  '../assets/fonts/Acrom-Bold.woff': 'assets/fonts/Acrom-Bold.woff',
};
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const write = (file, content) => { fs.mkdirSync(path.dirname(file), {recursive: true}); fs.writeFileSync(file, content); };
const findRefs = text => [...text.matchAll(/(?:src|href)="([^"]+)"|url\("([^"]+)"\)/g)].map(m => m[1] || m[2]);
const pages = 'https://kirschmunk.github.io/Kurort-Food';
const github = 'https://github.com/kirschmunk/Kurort-Food/tree/main';

for (const site of sites) {
  const original = path.join(root, site.dir);
  const sourceHtml = fs.readFileSync(path.join(original, 'index.html'), 'utf8');
  const sourceCss = fs.readFileSync(path.join(original, 'banners.css'), 'utf8');
  const section = sourceHtml.match(new RegExp(`<section class="${site.prefix}"[\\s\\S]*?<\\/section>`))?.[0];
  assert(section, 'Missing banner section: ' + site.id);
  const uploadFolder = `seasonal-banners-${site.id}`;
  const mount = `/upload/${uploadFolder}/`;
  const kit = path.join(original, 'developer');
  const deploy = path.join(kit, 'upload', uploadFolder);
  const usedAssets = Object.entries(assets).filter(([ref]) => sourceHtml.includes(ref) || sourceCss.includes(ref));
  for (const [oldRef, target] of usedAssets) {
    const source = path.resolve(original, oldRef);
    const destination = path.join(deploy, target);
    fs.mkdirSync(path.dirname(destination), {recursive: true});
    fs.copyFileSync(source, destination);
    assert.equal(sha(source), sha(destination), 'Changed asset: ' + target);
  }
  let banner = section;
  let css = sourceCss;
  for (const [oldRef, target] of usedAssets) {
    banner = banner.replaceAll(oldRef, mount + target);
    css = css.replaceAll(oldRef, target);
  }
  // Give bundled fonts a private family name so the host site's Acrom is untouched.
  css = css.replaceAll('font-family:Acrom', `font-family:SeasonalAcrom${site.id}`);
  if (site.id === 'sibir') css = css.replace('font-family:inherit;color:#fff', 'font-family:Arial,Helvetica,sans-serif;color:#fff');
  css += `\n/* Integration wrapper; no html, body or generic site selectors. */\n.${site.prefix}-shell{box-sizing:border-box;width:100%;max-width:${site.width}px;margin:0 auto;padding:0 ${site.gutter}px}\n.${site.prefix} img{display:block;max-width:none;border:0;margin:0;padding:0}\n.${site.prefix} .${site.prefix}__button,.${site.prefix} .${site.prefix}__button:visited,.${site.prefix} .${site.prefix}__button:hover,.${site.prefix} .${site.prefix}__button:active{color:#fff;text-decoration:none;border:0;box-shadow:none;font-family:inherit}\n@media(max-width:680px){.${site.prefix}-shell{padding:0 16px}}\n`;
  write(path.join(deploy, 'banners.css'), css);
  const block = `<link rel="stylesheet" href="${mount}banners.css?v=20261027">\n<div class="${site.prefix}-shell">\n${banner}\n</div>\n`;
  write(path.join(kit, 'block.html'), block);
  const preview = `<!doctype html>\n<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${site.label} — проверка комплекта баннеров</title><style>body{margin:0;padding:48px 0;background:#fff;font-family:Arial,Helvetica,sans-serif}@media(max-width:680px){body{padding:20px 0}}</style></head><body>\n${block.replaceAll(mount, `upload/${uploadFolder}/`)}</body></html>\n`;
  write(path.join(kit, 'preview.html'), preview);
  const links = [...banner.matchAll(/<a[^>]+href="([^"]+)"/g)].map(m => m[1]);
  const dates = [...banner.matchAll(/<span>(\d[^<]+)<\/span>/g)].map(m => m[1]);
  assert.equal(links.length, 2);
  assert.equal(dates.length, 2);
  const readme = `# ${site.label}: готовый блок сезонных баннеров

## Установка

1. Загрузите папку \`upload/${uploadFolder}/\` из этого архива в \`/upload/\` в корне нужного сайта. Итоговый адрес CSS: \`${mount}banners.css\`.
2. Вставьте **всё содержимое \`block.html\`** вместо прежнего баннера ментального здоровья в шаблоне главной страницы. В PHP-шаблоне это обычный HTML: вставьте его вне блока \`<?php ... ?>\`. Шапку, меню, подвал и подключённые скрипты сайта не заменяйте.
3. Очистите кэш страницы/CMS, если он включён. Проверьте обе кнопки, фотографии, мобильный вид и наведение мыши.

Если CMS удаляет \`<link>\` из контента, перенесите первую строку \`block.html\` в \`<head>\` шаблона после основных стилей сайта; оставшийся HTML вставьте на месте баннера. Для стандартной установки пути уже настроены. При другом каталоге измените префикс \`${mount}\` в \`block.html\`; относительные пути внутри CSS менять не нужно.

Блок вставляется в полноширинную область страницы: собственная обёртка задаёт ширину как в согласованной демке. Не помещайте её в узкую колонку. Если используете существующий контейнер с такими же отступами, можно убрать только внешнюю обёртку \`${site.prefix}-shell\`, оставив \`<section>…</section>\`.

## Что в комплекте

- \`block.html\` — готовый HTML-фрагмент с подключением CSS, без заголовка демки, \`html\`, \`head\` и \`body\`.
- \`upload/${uploadFolder}/banners.css\` — стили, адаптация для телефона, анимация и затемнение фотографий.
- \`upload/${uploadFolder}/assets/images/\` — обе фотографии в исходном качестве.
${site.id === 'sibir' ? '- Шрифт: системный Arial/Helvetica; скачивание шрифтов не требуется.' : `- \`upload/${uploadFolder}/assets/fonts/\` — оба шрифта Acrom; семейство изолировано от шрифтов основного сайта.`}
- \`preview.html\` — самостоятельная проверка комплекта. Распакуйте весь архив и откройте файл; для проверки через HTTP разместите папку комплекта на тестовом сервере.
- \`manifest.json\` — список файлов и контрольные суммы.

Никакие файлы из соседних папок GitHub не нужны. JavaScript, Node.js, npm и сторонние библиотеки для работы блока не требуются. Внешние адреса используются только в двух кнопках.

## Ссылки и даты

- Ментальное здоровье: ${links[0]}
- Новый год: ${links[1]}
- Ментальное здоровье: ${dates[0]}.
- Новый год: ${dates[1]}.

Тексты, даты и ссылки сохранены из согласованной демки. Дата окончания сезона у «Сибири» — 25 декабря, у остальных — 24 декабря. Если условия акции изменятся, меняются два соответствующих текста/адреса в \`block.html\`.

## Проверка после установки

- Обе фотографии и CSS возвращают HTTP 200, нет потерянных файлов.
- На широком экране две карточки в строку; при ширине экрана до 680 px — друг под другом.
- При наведении и отведении мыши заголовки, даты и кнопки остаются видимыми.
- Обе кнопки ведут на страницы именно этого сайта.
- Шапка, подвал и соседние блоки не изменились.

Комплект проверяется отдельно от рабочего сайта. Финальная проверка совместимости с его PHP/CMS-шаблоном выполняется после вставки: без доступа к шаблону гарантировать отсутствие всех конфликтов его глобальных стилей нельзя.

Демка: ${pages}/${site.dir}/
Исходники: ${github}/${site.dir}/developer
`;
  write(path.join(kit, 'README.md'), readme);
  const files = [];
  function walk(folder) { for (const name of fs.readdirSync(folder).sort()) { const full = path.join(folder, name); if (fs.statSync(full).isDirectory()) walk(full); else if (name !== 'manifest.json') files.push({path: path.relative(kit, full), bytes: fs.statSync(full).size, sha256: sha(full)}); } }
  walk(kit);
  write(path.join(kit, 'manifest.json'), JSON.stringify({site: site.label, demo: `${pages}/${site.dir}/`, installPrefix: mount, files}, null, 2) + '\n');
  // Verify every HTML/CSS file reference against the extracted, standalone package.
  const zip = path.join(original, 'developer.zip');
  if (fs.existsSync(zip)) fs.unlinkSync(zip);
  execFileSync('/usr/bin/zip', ['-q', '-X', '-r', zip, 'README.md', 'block.html', 'preview.html', 'manifest.json', 'upload'], {cwd: kit});
  const extracted = fs.mkdtempSync(path.join(os.tmpdir(), `seasonal-${site.id}-`));
  execFileSync('/usr/bin/unzip', ['-q', zip, '-d', extracted]);
  const manifest = JSON.parse(fs.readFileSync(path.join(extracted, 'manifest.json'), 'utf8'));
  for (const entry of manifest.files) assert.equal(sha(path.join(extracted, entry.path)), entry.sha256, 'ZIP checksum mismatch');
  for (const file of ['block.html', 'preview.html', `upload/${uploadFolder}/banners.css`]) {
    const text = fs.readFileSync(path.join(extracted, file), 'utf8');
    for (const ref of findRefs(text)) {
      if (/^https:\/\//.test(ref)) { assert(links.includes(ref), 'Unexpected remote dependency: ' + ref); continue; }
      const clean = ref.split(/[?#]/)[0];
      const target = clean.startsWith('/') ? path.join(extracted, clean.slice(1)) : path.resolve(path.dirname(path.join(extracted, file)), clean);
      assert(target.startsWith(extracted + path.sep), 'Reference escapes ZIP: ' + ref);
      assert(fs.existsSync(target), 'Missing package file: ' + ref);
    }
  }
  assert(!/demo-label|<body|<head|<script|<iframe/.test(block));
  assert(!block.includes('../'));
  assert.deepEqual([...block.matchAll(/<a[^>]+href="([^"]+)"/g)].map(m => m[1]), links);
  assert.equal((block.match(/<article /g) || []).length, 2);
  assert(!/(?:^|[{}])\s*(?:html|body|:root)\s*\{/.test(css));
  assert(css.includes('z-index:2'));
  assert(css.includes('prefers-reduced-motion'));
  write(path.join(original, 'README.md'), `# ${site.label}: сезонные баннеры\n\n- [Демка](${pages}/${site.dir}/)\n- [Скачать полный комплект ZIP](${pages}/${site.dir}/developer.zip)\n- [Готовый HTML-блок](developer/block.html)\n- [Инструкция по установке](developer/README.md)\n- [Проверка самостоятельного комплекта](${pages}/${site.dir}/developer/preview.html)\n\nДля установки используйте \`developer.zip\`: внутри HTML, CSS, обе фотографии, необходимые шрифты и инструкция. Он не зависит от соседних каталогов репозитория. \`index.html\` и \`banners.css\` в этой папке — исходная согласованная демка; заголовок над карточками нужен только для её просмотра.\n`);
  console.log(`PASS ${site.id}: ZIP extracted; ${manifest.files.length} files checksum-verified; all local HTML/CSS dependencies resolved; two original target links preserved. ${fs.statSync(zip).size} bytes.`);
}
