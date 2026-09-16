# Ссылки кнопок новогодней страницы

Фикс уже включён в исходники. Менять HTML и CSS не требуется.

Все адреса находятся в `script.js` в объекте `newYearLinks`:

```js
const newYearLinks={
  menu:'https://belokurikha.ru/vechernie-restorany-i-banketnoe-menyu-v-sanatoriyah-seti-kurort-belokuriha-otkryli-zakazy-na-izyskannye-blyuda/',
  poster:'https://belokurikha.ru/category/afisha/',
  booking:'https://sales.belokurikha.ru/online/online-rules/index.php',
};
```

После загрузки PDF на хостинг заменить только значения `menu` и `poster` на полные адреса, начинающиеся с `https://`.
