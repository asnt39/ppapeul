const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const pub = path.join(__dirname, '..', 'public');
const manifest = JSON.parse(fs.readFileSync(path.join(pub, 'manifest.webmanifest'), 'utf8'));
const html = fs.readFileSync(path.join(pub, 'index.html'), 'utf8');
const script = fs.readFileSync(path.join(pub, 'pwa-install.js'), 'utf8');

test('PWA manifest and icons have valid sizes and are used by the entry point', () => {
  assert.equal(manifest.display, 'standalone');
  assert.equal(manifest.start_url, '/index.html');
  assert.ok(html.includes('rel="manifest"'));
  assert.ok(html.includes('src="/pwa-install.js"'));
  for (const size of [192, 512]) {
    const icon = manifest.icons.find(x => x.sizes === size + 'x' + size && x.type === 'image/png');
    assert.ok(icon, 'missing ' + size + 'px PNG icon');
    const data = fs.readFileSync(path.join(pub, icon.src));
    assert.equal(data.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
    assert.equal(data.readUInt32BE(16), size);
    assert.equal(data.readUInt32BE(20), size);
  }
});

function harness({ userAgent = 'Mozilla/5.0 (Android) SamsungBrowser', standalone = false } = {}) {
  const events = {};
  const elements = {};
  for (const id of ['installApp','installGuide','installInstructions','installClose']) {
    elements[id] = { hidden: false, textContent: '', listeners: {}, addEventListener(type, listener) { this.listeners[type] = listener; }, async click() { return this.listeners.click?.(); }, showModal() { this.open = true; }, close() { this.open = false; } };
  }
  const media = { matches: standalone, addEventListener(type, listener) { this.listener = listener; } };
  const context = { document: { getElementById: id => elements[id] }, navigator: { userAgent, standalone: false }, window: { matchMedia: () => media, addEventListener(type, listener) { events[type] = listener; }, alert() {} } };
  vm.runInNewContext(script, context);
  return { elements, events, context, media };
}

test('Samsung Internet without a native prompt provides menu instructions', async () => {
  const { elements } = harness();
  assert.equal(elements.installApp.textContent, '설치 방법');
  await elements.installApp.click();
  assert.equal(elements.installGuide.open, true);
  assert.match(elements.installInstructions.textContent, /삼성 인터넷/);
  await elements.installClose.click();
  assert.equal(elements.installGuide.open, false);
});

test('browser installation prompt is used once and standalone hides install UI', async () => {
  const { elements, events, media } = harness();
  let prompts = 0;
  events.beforeinstallprompt({ preventDefault() {}, async prompt() { prompts++; }, userChoice: Promise.resolve({ outcome: 'accepted' }) });
  assert.equal(elements.installApp.textContent, '앱 설치');
  await elements.installApp.click();
  assert.equal(prompts, 1);
  assert.equal(elements.installApp.textContent, '설치 방법');
  media.matches = true;
  media.listener();
  assert.equal(elements.installApp.hidden, true);
});
