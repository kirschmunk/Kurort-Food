# Ссылки кнопок новогодней страницы

Фикс уже включён в полные исходники. Менять HTML и CSS не требуется.

Все адреса находятся в `new-year-portal/script.js` в одном блоке:

```js
const newYearLinks={
  menu:'https://belokurikha.ru/vechernie-restorany-i-banketnoe-menyu-v-sanatoriyah-seti-kurort-belokuriha-otkryli-zakazy-na-izyskannye-blyuda/',
  poster:'https://belokurikha.ru/category/afisha/',
  booking:'https://sales.belokurikha.ru/online/online-rules/index.php',
};
```

После загрузки PDF на хостинг заменить только значения:

```js
menu:'ПОЛНАЯ_ССЫЛКА_НА_PDF_МЕНЮ',
poster:'ПОЛНАЯ_ССЫЛКА_НА_PDF_АФИШИ',
```

Адрес должен начинаться с `https://`. Остальной код страницы менять не нужно.
