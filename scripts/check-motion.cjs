// Exercise real border code with deterministic frames, without a browser dependency.
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8').replace(/\r\n/g, '\n');
const start = source.indexOf('const initFluidCards =');
const end = source.indexOf('/* --------------------------------------------------------------------------\n     5.', start);
assert(end > start);
const code = source.slice(start, end) + '; initFluidCards();';

function check(reduced) {
  const callbacks = new Map(), events = new Map(), observers = [];
  let nextId = 0;
  const on = (name, callback) => events.set(name, callback);
  const document = {
    hidden: false, addEventListener: on,
    documentElement: { addEventListener: on },
    createElementNS: (_, tag) => ({ tag, data: {}, classList: { add() {} },
      setAttribute(name, value) { this.data[name] = value; },
      appendChild(child) { this.child = child; },
      getTotalLength() { throw Error('Native SVG geometry measurement returned'); },
    }),
  };
  const cards = [[538, 466], [160, 44], [44, 44]].map(([width, height]) => ({
    clientWidth: width, clientHeight: height, classList: { add() {} },
    matches: () => height === 44,
    getBoundingClientRect: () => ({ left: 0, top: 0, width, height }),
    prepend(svg) { this.svg = svg; },
  }));
  document.querySelectorAll = () => cards;
  const makeObserver = function(callback) {
    this.targets = []; this.observe = (target) => this.targets.push(target);
    this.flush = (visible) => callback(this.targets.map((target) => ({ target, isIntersecting: visible })));
    observers.push(this);
  };
  new Function('document', 'window', 'ResizeObserver', 'IntersectionObserver',
    'requestAnimationFrame', 'cancelAnimationFrame', 'prefersReducedMotion', 'MOTION_SPEED', code)(
    document, { matchMedia: () => ({ matches: true }), addEventListener: on },
    makeObserver, makeObserver,
    (callback) => { callbacks.set(++nextId, callback); return nextId; },
    (id) => callbacks.delete(id), reduced, 1.5);
  observers[0].flush(true);
  observers[1].flush(true);
  const tick = (now) => {
    const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach((callback) => callback(now));
  };
  assert(cards.every((card) => card.svg.child.data.d.endsWith('Z')));
  if (reduced) { assert.equal(callbacks.size, 0); return; }
  const initial = cards[0].svg.child.data.d;
  events.get('pointermove')({ pointerType: 'mouse', clientX: 260, clientY: 3 });
  for (let i = 1; i <= 90; i++) tick(i * 17);
  const active = cards[0].svg.child.data.d;
  assert(active.length > initial.length);
  assert(!/NaN|Infinity/.test(active));
  assert.equal(active.split(' C ')[0], initial.split(' C ')[0], 'Hover must not pull the corner');
  assert((active.match(/ C /g) || []).length <= 52, 'Keep the active contour compact');
  events.get('pointermove')({ pointerType: 'mouse', clientX: 533, clientY: 462 });
  for (let i = 91; i <= 120; i++) tick(i * 17);
  assert.equal(cards[0].svg.child.data.d.split(' C ')[0], initial.split(' C ')[0]);
  events.get('pointerleave')();
  for (let i = 121; i <= 330; i++) tick(i * 17);
  assert(cards[0].svg.child.data.d.length < active.length);
  observers[1].flush(false);
  tick(5200);
  assert.equal(callbacks.size, 0, 'Off-screen animation must stop');
  observers[1].flush(true);
  assert.equal(callbacks.size, 1, 'Visible animation must resume once');
  document.hidden = true; events.get('visibilitychange')();
  assert.equal(callbacks.size, 0, 'Hidden tabs must stop');
}
check(false);
check(true);
console.log('Border rendering, pointer response, settling, visibility and reduced-motion checks passed.');
