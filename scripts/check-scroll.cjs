const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const source = fs.readFileSync(path.join(__dirname, '../script.js'), 'utf8');
const start = source.indexOf('// Smooth snapping is limited');
const end = source.indexOf('if (!sections.length || !navLinks.length) return;', start);
assert(end > start);
function setup(reduced = false, width = 1280) {
  let clock = 0, nextId = 0;
  const callbacks = new Map(), events = new Map(), classes = new Set();
  const window = { innerWidth: width, innerHeight: 720, scrollY: 0,
    addEventListener: (name, callback) => events.set(name, callback),
    scrollTo: ({ top }) => { window.scrollY = top; },
  };
  const document = { hidden: false,
    documentElement: { classList: { add: (name) => classes.add(name), remove: (name) => classes.delete(name) } },
    addEventListener: (name, callback) => events.set(name, callback),
    querySelector: () => ({ getBoundingClientRect: () => ({ top: 1000-window.scrollY }) }),
  };
  new Function('window', 'document', 'hero', 'header', 'onScroll', 'performance',
    'requestAnimationFrame', 'cancelAnimationFrame', 'prefersReducedMotion',
    'let headerScrollOverride=null;' + source.slice(start, end))(
    window, document, { offsetTop: 0, offsetHeight: 900 },
    { getBoundingClientRect: () => ({ height: 64 }) }, () => {}, { now: () => clock },
    (callback) => { callbacks.set(++nextId, callback); return nextId; },
    (id) => callbacks.delete(id), reduced);
  return { window, document, classes, callbacks,
    input(name, data = {}) {
      const event = { deltaX: 0, deltaY: 100, ctrlKey: false, prevented: false,
        target: { closest: () => null }, preventDefault() { this.prevented = true; }, ...data };
      events.get(name)(event); return event;
    },
    tick(time) { clock = time; const pending = [...callbacks.values()]; callbacks.clear(); pending.forEach((f) => f(time)); },
  };
}
const page = setup();
assert(page.input('wheel').prevented);
assert(page.classes.has('is-jumping'));
page.tick(240);
assert(page.window.scrollY > 400 && page.window.scrollY < 500);
assert(page.input('wheel', { deltaY: -500 }).prevented);
assert(page.input('wheel', { deltaX: 300 }).prevented);
assert(page.input('keydown', { key: 'PageDown' }).prevented);
assert(page.input('touchmove', { touches: [{ clientY: 100 }] }).prevented);
assert(!page.input('wheel', { ctrlKey: true }).prevented, 'Keep zoom available');
page.tick(480);
assert.equal(page.window.scrollY, 908);
assert(!page.classes.has('is-jumping'));
assert.equal(page.callbacks.size, 0);
page.tick(520); assert(page.input('wheel').prevented);
page.tick(600); assert(!page.input('wheel').prevented, 'Do not extend momentum lock on every event');
page.input('wheel', { deltaY: -100 });
page.document.hidden = true; page.input('visibilitychange');
assert.equal(page.window.scrollY, 0);
assert(!page.classes.has('is-jumping'));
assert.equal(page.callbacks.size, 0);
const reduced = setup(true); reduced.input('wheel');
assert.equal(reduced.window.scrollY, 908);
assert.equal(reduced.callbacks.size, 0);
assert(!reduced.classes.has('is-jumping'));
const mobile = setup(false, 390);
assert(!mobile.input('wheel').prevented);
assert.equal(mobile.callbacks.size, 0);
console.log('480ms eased jump, input lock, exact landing, unlock, zoom, hidden-tab and reduced-motion checks passed.');
