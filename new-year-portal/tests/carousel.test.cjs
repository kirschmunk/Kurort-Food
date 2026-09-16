const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
assert.match(css, /\.carousel\[data-carousel\] \.banquet-card\{[^}]*position:absolute[^}]*display:none/, 'inactive banquet cards are removed from view');
assert.match(css, /\.carousel\[data-carousel\] \.banquet-card\.is-active\{display:block\}/, 'only the active banquet card is visible');
assert.match(css, /\.carousel\{overflow:visible\}/, 'carousel shadows are not clipped by the outer wrapper');
assert.match(css, /\.carousel\[data-carousel\] \.carousel-track\{padding:8px 0 26px\}/, 'track reserves room for card shadows');
assert.match(css, /\.carousel\[data-carousel\] \.banquet-media\{[^}]*height:430px[^}]*object-fit:cover/, 'banquet images share one cropped size');
assert.match(css, /\.carousel-track\{[^}]*user-select:none[^}]*touch-action:pan-y[^}]*cursor:grab/, 'dragging a slide cannot select its text');
assert.match(css, /\.new-year-page \.carousel-track a,\.new-year-page \.carousel-track button\{cursor:pointer\}/, 'interactive elements keep their clickable cursor');

const handlers = new WeakMap();
function on(element, type, callback) {
  let events = handlers.get(element);
  if (!events) handlers.set(element, events = {});
  (events[type] ||= []).push(callback);
}
function emit(element, type, detail = {}) {
  for (const callback of handlers.get(element)?.[type] || []) callback({
    target: element, pointerId: 1, button: 0, clientX: 0,
    preventDefault() {}, stopPropagation() {}, ...detail,
  });
}
class Element {
  constructor() {
    this.attributes = new Map(); this.style = {}; this.classNames = new Set();
    this.classList = {
      add: name => this.classNames.add(name),
      remove: name => this.classNames.delete(name),
      toggle: (name, enabled) => enabled ? this.classNames.add(name) : this.classNames.delete(name),
    };
    this.offsetHeight = 640;
  }
  addEventListener(type, callback) { on(this, type, callback); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); }
  getAttribute(name) { return this.attributes.get(name); }
  getBoundingClientRect() { return { width: 1000 }; }
  closest() { return null; }
}
function makeCarousel(count) {
  const cards = Array.from({ length: count }, () => new Element());
  const track = new Element(); track.children = cards; track.setPointerCapture = () => {}; track.contains = () => false;
  const next = new Element(); const prev = new Element(); const carousel = new Element();
  carousel.querySelector = selector => ({ '.carousel-track': track, '[data-prev]': prev, '[data-next]': next })[selector];
  carousel.matches = () => false;
  return { carousel, track, cards, next, prev };
}

const cases = [3, 2, 2].map(makeCarousel);
const timers = []; const intervals = []; let now = 1000;
const FakeDate = class extends Date { static now() { return now; } };
const document = {
  querySelectorAll: selector => selector === '[data-dinner-carousel],[data-carousel]' ? cases.map(item => item.carousel) : [],
  createElement: () => new Element(), body: { append() {} }, activeElement: null, hidden: false,
};
vm.runInNewContext(fs.readFileSync(path.join(root, 'script.js'), 'utf8'), {
  document,
  window: { matchMedia: () => ({ matches: false }), addEventListener() {} },
  Date: FakeDate,
  requestAnimationFrame: callback => callback(),
  setTimeout: callback => timers.push(callback),
  setInterval: callback => intervals.push(callback),
  CustomEvent: class {},
});
const active = item => item.cards.filter(card => card.classNames.has('is-active'));
const finish = () => { const callback = timers.shift(); assert.equal(typeof callback, 'function'); callback(); };

for (const item of cases) {
  assert.equal(item.carousel.classNames.has('is-ready'), true);
  assert.deepEqual(active(item), [item.cards[0]], 'first load has exactly one card');
  assert.equal(item.cards.every(card => card.style.height === '640px'), true, 'all cards receive one equal height');
  assert.equal(item.track.style.height, '674px', 'track keeps a fixed height with room for the shadow');
  assert.equal(item.cards.slice(1).every(card => card.getAttribute('aria-hidden') === 'true'), true);
  for (let index = 1; index < item.cards.length; index++) {
    emit(item.next, 'click');
    assert.equal(item.cards[index - 1].style.transform, 'translateX(-1000px)', 'outgoing card moves beyond the full viewport, not only its own width');
    assert.equal(item.cards[index].style.transform, 'translateX(0px)');
    finish();
    assert.deepEqual(active(item), [item.cards[index]]);
    assert.equal(item.track.style.height, '674px', 'navigation stays at one vertical position');
  }
  emit(item.next, 'click'); finish();
  assert.deepEqual(active(item), [item.cards[0]], 'forward loop returns to first card');
  emit(item.prev, 'click'); finish();
  assert.deepEqual(active(item), [item.cards.at(-1)], 'reverse loop returns to last card');
  emit(item.next, 'click'); finish();

  emit(item.track, 'pointerdown', { pointerId: 1, clientX: 500, target: { closest: () => null } });
  emit(item.track, 'pointermove', { pointerId: 1, clientX: 330 });
  emit(item.track, 'pointerup', { pointerId: 1, clientX: 330 });
  finish();
  assert.deepEqual(active(item), [item.cards[1]], 'mouse drag changes card without leaving a clone');
}

assert.equal(intervals.length, 3, 'autoplay is installed for all banquet carousels');
now += 6000; intervals[0](); finish();
assert.deepEqual(active(cases[0]), [cases[0].cards[2]], 'autoplay advances a banquet');
console.log('PASS: all banquet carousels show one real card and loop, drag and autoplay without clones');
