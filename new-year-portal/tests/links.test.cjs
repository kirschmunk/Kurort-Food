const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..');
const script = fs.readFileSync(path.join(root, 'script.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');

const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const cards=[...html.matchAll(/<article class="banquet-card">([\s\S]*?)<\/article>/g)];
assert.equal(cards.length,7);
const files=[['Дереза Пати',3,'belng'],['Козырный Новый год',2,'belng'],['Высота 2027',0,'belng'],['Тысяча масок и одна ночь',1,'sibng'],['Золотое руно',6,'sibng'],['Новогодняя ночь - время быть вместе',4,'katng'],['Музыкальный взрыв',5,'katng']];
for(const [name,id,menu] of files){const card=cards.find(m=>m[1].includes('Банкет «'+name+'»'))?.[1]||'';assert(card.includes('/ny2027_'+id+'-fit.jpg" target="_blank" rel="noopener noreferrer">Смотреть афишу</a>'));assert(card.includes('/'+menu+'.pdf" target="_blank" rel="noopener noreferrer">Смотреть меню</a>'));}
assert.match(script, /document\.querySelectorAll\('\[data-booking\]'\)/, 'every booking CTA is upgraded');
assert.match(script, /button\.replaceWith\(link\)/, 'booking buttons are replaced with real anchors');
assert.doesNotMatch(script, /Форма заявки будет подключена/, 'the obsolete non-working placeholder is gone');
assert.match(css, /\.new-year-page \.card-actions a\{[^}]*pointer-events:auto/, 'document links accept pointer input');
assert.match(css, /\.new-year-page a\.button-primary\{[^}]*display:inline-flex[^}]*pointer-events:auto/, 'booking anchors keep button layout and accept clicks');

console.log('PASS: menu, poster and booking controls are real clickable links');
