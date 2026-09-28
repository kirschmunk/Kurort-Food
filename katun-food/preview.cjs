const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const types = { '.css': 'text/css', '.html': 'text/html; charset=utf-8', '.jpg': 'image/jpeg', '.woff': 'font/woff' };
http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/isolation') {
    const width = Math.max(280, Math.min(1400, Number(url.searchParams.get('width')) || 1200));
    const embed = fs.readFileSync(path.join(root, 'embed.html'), 'utf8');
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end('<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Katun CSS isolation verification</title><style>body{margin:0;font:16px Georgia;color:#222}h2{font:italic 23px Georgia;color:rgb(145,38,71);margin:13px 0;text-transform:none}p{font:17px Georgia;color:rgb(20,70,100);margin:7px 0}a{color:rgb(30,55,180);text-decoration:underline}.wrap{padding:9px;border:2px solid orange}.format-tab{padding:7px;background:rgb(240,210,215);color:#252525}fieldset{border:5px solid orange;padding:20px}header,footer{padding:20px}</style>' + (url.searchParams.get('styles') === 'off' ? '' : '<link rel="stylesheet" href="/styles.css">') + '</head><body><header id="host-before"><h2>Заголовок сайта вне блока</h2><p>Абзац сайта вне блока</p><a href="#host-after">Обычная ссылка сайта</a><div class="wrap">Общий контейнер сайта</div><button class="format-tab">Кнопка сайта</button></header><div id="host-column" style="width:' + width + 'px;max-width:100%;margin:auto;overflow:hidden">' + embed + '</div><footer id="host-after"><h2>Заголовок подвала сайта</h2><p>Текст подвала сайта</p></footer></body></html>');
    return;
  }
  const target = path.resolve(root, '.' + (url.pathname === '/' ? '/index.html' : url.pathname));
  if (!target.startsWith(root + path.sep) || !fs.existsSync(target) || !fs.statSync(target).isFile()) { res.writeHead(404); res.end('Not found'); return; }
  res.setHeader('Content-Type', types[path.extname(target)] || 'application/octet-stream');
  fs.createReadStream(target).pipe(res);
}).listen(8766, '127.0.0.1', () => console.log('Katun preview: http://127.0.0.1:8766/ — isolation: /isolation?width=720'));
