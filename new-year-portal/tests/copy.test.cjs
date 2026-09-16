const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');

const exactCopy = [
  'Период проведения: 01.01. - 10.01.2027г.',
  'Файер-шоу – для всех гостей санатория в 00:30ч.',
  'Файер-шоу – для всех гостей санатория в 23:30ч.',
  'Инструктаж по покорению 2027 (юмористические испытания)',
  'Крио-шоу: ледяной бар с подачей экстремальных коктейлей',
  'Безудержные танцы с шоу-группой «Текила-денс»',
  'Скрипка: драйв, кайф',
  'Заранее будут организованы мастер-классы по изготовлению масок и атрибутики для карнавала.',
  'Гадания, танцы под виртуозную скрипку от ансамбля «Гранат»',
  '«Новогодняя угадай мелодия» - песенный батл',
  'Фееричная программа с Дедом Морозом и Снегурочкой',
];

for (const text of exactCopy) {
  assert.ok(html.includes(text), `copy from Figma is present: ${text}`);
}

assert.equal(
  html.match(/Гадания, танцы под виртуозную скрипку от ансамбля «Гранат»/g)?.length,
  2,
  'the shared Figma wording is present in both relevant banquet cards',
);

const staleCopy = [
  'Крио-шоу: ледяной бар с экстремальными коктейлями',
  'Танцы с шоу-группой «Текила-денс» и скрипка',
  'Заранее пройдут мастер-классы по изготовлению масок и карнавальной атрибутики.',
  'Песенный батл «Новогодняя угадай мелодия»',
  'Программа с Дедом Морозом и Снегурочкой',
];

for (const text of staleCopy) {
  assert.equal(html.includes(text), false, `outdated copy is gone: ${text}`);
}

console.log('PASS: dates, dinner copy and banquet programs match the Figma text');
