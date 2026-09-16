const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const root = path.resolve(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const css = fs.readFileSync(path.join(root, 'styles.css'), 'utf8');
assert.match(html, /class="carousel dinner-carousel" data-dinner-carousel/, 'dinner uses its own slider');
assert.match(html, /class="dinner-card is-active"/, 'first dinner is selected in HTML before JavaScript');
assert.match(css, /\.dinner-carousel \.dinner-card\{position:absolute;top:0;left:0;display:none/, 'other dinner cards are hidden at first paint');
assert.match(css, /\.dinner-carousel \.dinner-card\.is-active\{display:block\}/, 'only the first dinner card renders at first paint');
assert.match(css, /\.stories\{background:url\('\.\/assets\/brief\/background-stories\.png'\) center\/100% 100% no-repeat\}/, 'stories have one patterned background');
assert.match(css, /\.story-panel\{background:transparent;border:0;box-shadow:none;border-radius:0\}/, 'stories have no nested background');
assert.match(css, /\.button-primary:hover\{[^}]*outline:none[^}]*box-shadow:/, 'primary button hover has no outline and uses a soft shadow');
assert.match(css, /\.button-primary:focus-visible\{[^}]*outline:none[^}]*box-shadow:/, 'primary button keyboard focus has no outline');
assert.match(css, /\.carousel-button:hover\{[^}]*outline:none[^}]*box-shadow:/, 'carousel button hover has no outline');
assert.match(css, /\.book-urgent img\{display:none\}/, 'decorative booking arrows are hidden everywhere');
assert.match(css, /\.banquet-phone\{margin-bottom:8px\}/, 'booking phone and button form one compact group');
assert.match(css, /\.banquet-booking\{align-self:flex-start;margin-top:0\}/, 'banquet booking button is aligned directly below the phone');
assert.match(css, /\.story-intro\{max-width:none\}/, 'story introduction uses the full line so the final word does not wrap alone');
assert.match(css, /\.carousel-track\{[^}]*user-select:none[^}]*touch-action:pan-y[^}]*cursor:grab/, 'dragging dinner slides cannot select their text');

const handlers = new WeakMap();
function on(element, type, callback) {
  let events = handlers.get(element);
  if (!events) handlers.set(element, events = {});
  (events[type] ||= []).push(callback);
}
function emit(element, type, detail = {}) {
  for (const callback of handlers.get(element)?.[type] || []) callback({
    target: element,
    propertyName: 'transform',
    pointerId: 1,
    button: 0,
    clientX: 0,
    preventDefault() {},
    stopPropagation() {},
    ...detail,
  });
}
class Element {
  constructor() {
    this.attributes = new Map();
    this.style = {};
    this.classNames = new Set();
    this.classList = {
      add: name => this.classNames.add(name),
      remove: name => this.classNames.delete(name),
      toggle: (name, enabled) => enabled ? this.classNames.add(name) : this.classNames.delete(name),
    };
    this.offsetHeight = 390;
  }
  addEventListener(type, callback) { on(this, type, callback); }
  setAttribute(name, value) { this.attributes.set(name, value); }
  removeAttribute(name) { this.attributes.delete(name); }
  getAttribute(name) { return this.attributes.get(name); }
  getBoundingClientRect() { return { width: 800 }; }
  closest() { return null; }
}
const cards = [new Element(), new Element(), new Element()];
cards[0].classNames.add('is-active');
const track = new Element();
track.children = cards;
track.setPointerCapture = () => {};
track.contains = () => false;
const next = new Element();
const prev = new Element();
const carousel = new Element();
carousel.querySelector = selector => ({
  '.carousel-track': track,
  '[data-prev]': prev,
  '[data-next]': next,
})[selector];
carousel.matches = () => false;
carousel.getBoundingClientRect = () => ({ width: 800 });
const timers = [];
const intervals = [];
let now = 1000;
const FakeDate = class extends Date { static now() { return now; } };
const document = {
  querySelectorAll: selector => selector === '[data-dinner-carousel],[data-carousel]' ? [carousel] : [],
  createElement: () => new Element(),
  body: { append() {} },
  activeElement: null,
  hidden: false,
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
const active = () => cards.filter(card => card.classNames.has('is-active'));
assert.deepEqual(active(), [cards[0]], 'first load shows only Belokurikha');
assert.equal(cards[1].getAttribute('aria-hidden'), 'true');
assert.equal(cards[2].getAttribute('aria-hidden'), 'true');
assert.equal(cards.every(card => card.style.height === '390px'), true, 'dinner cards receive one equal height');
assert.equal(track.style.height, '424px', 'dinner track reserves room below the card');

function finish() {
  const callback = timers.shift();
  assert.equal(typeof callback, 'function', 'slide completion timer is scheduled');
  callback();
}
for (const target of [1, 2, 0]) {
  emit(next, 'click');
  assert.equal(cards[target].style.display, 'block', 'incoming dinner is temporarily shown during sliding');
  finish();
  assert.deepEqual(active(), [cards[target]], 'exactly one dinner remains after sliding');
}
emit(prev, 'click');
finish();
assert.deepEqual(active(), [cards[2]], 'reverse wrap returns to Katun');
emit(next, 'click');
finish();

emit(track, 'pointerdown', { pointerId: 1, clientX: 400, target: { closest: () => null } });
emit(track, 'pointermove', { pointerId: 1, clientX: 260 });
emit(track, 'pointerup', { pointerId: 1, clientX: 260 });
finish();
assert.deepEqual(active(), [cards[1]], 'mouse drag moves dinner to Sibir');

assert.equal(intervals.length, 1, 'dinner autoplay is installed');
now += 6000;
intervals[0]();
finish();
assert.deepEqual(active(), [cards[2]], 'dinner autoplay moves to Katun');
console.log('PASS: dinner starts with one card, loops both ways, drags by mouse and autoplays; stories use one background');
