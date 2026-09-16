const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const exactCopy = [
  'Период проведения: 01.01. - 10.01.2027г.',
  'Файер-шоу – для всех гостей санатория в 00:30ч.',
  'Инструктаж по покорению 2027 (юмористические испытания)',
  'Крио-шоу: ледяной бар с подачей экстремальных коктейлей',
  'Безудержные танцы с шоу-группой «Текила-денс»',
  'Скрипка: драйв, кайф',
  'Новогодняя программа — <span>«Кино-МульТеатр»</span>',
  '8-800-707-51-83',
];

for (const text of exactCopy) {
  assert.ok(html.includes(text), `copy from Figma is present: ${text}`);
}

const staleCopy = [
  'Крио-шоу: ледяной бар с экстремальными коктейлями',
  'Танцы с шоу-группой «Текила-денс» и скрипка',
  'Заранее пройдут мастер-классы по изготовлению масок и карнавальной атрибутики.',
  'Песенный батл «Новогодняя угадай мелодия»',
  'Программа с Дедом Морозом и Снегурочкой',
  'санатории «Сибирь»',
  'санатории «Катунь»',
  'Три новогодних истории',
  'data-dinner-carousel',
  '8-800-707-51-28',
];

for (const text of staleCopy) {
  assert.equal(html.includes(text), false, `outdated copy is gone: ${text}`);
}

console.log('PASS: the page keeps the Belokurikha copy and contains no Sibir or Katun sections');
