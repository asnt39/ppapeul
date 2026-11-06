/* Run with Playwright installed and a Chromium executable available.
 * CHROMIUM_PATH=/usr/bin/chromium node --test tests/responsive.test.cjs
 * Uses local static files and synthetic UI data, not production APIs or records.
 */
const { test } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');
const { chromium } = require('playwright');

const widths = [320, 360, 390, 430, 640, 641, 680, 681, 768, 820, 900, 960, 961, 1024, 1280, 1440];
const screens = ['setup', 'plan', 'focus', 'records', 'friends', 'independent', 'settings'];

test('responsive forms and content stay inside their layout', async () => {
  const root = path.resolve(__dirname, '../public');
  const server = http.createServer(async (req, res) => {
    try {
      const pathname = new URL(req.url, 'http://localhost').pathname;
      const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root + path.sep)) throw Error('Invalid path');
      const content = await fs.readFile(file);
      res.setHeader('Content-Type', { '.js': 'text/javascript', '.css': 'text/css', '.html': 'text/html', '.svg': 'image/svg+xml' }[path.extname(file)] || 'application/octet-stream');
      res.end(content);
    } catch { res.writeHead(404).end(); }
  });
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
  let browser;
  try {
    browser = await chromium.launch({
      ...(process.env.CHROMIUM_PATH ? { executablePath: process.env.CHROMIUM_PATH } : {}),
      args: ['--no-sandbox'],
    });
    const page = await browser.newPage({ reducedMotion: 'reduce' });
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    page.on('dialog', dialog => dialog.accept());
    await page.route('https://**', route => route.abort());
    await page.goto(`http://127.0.0.1:${server.address().port}/`);
    await page.evaluate(() => {
      document.getElementById('demo').click();
      state.subjects.forEach(s => s.name = 'LongSubjectWithoutSpaces'.repeat(3));
      state.hours.fill(24);
      state.closeEnabled = true;
      state.closeHours = 24;
      plan = P.build(state);
      renderForm(); renderPlan();
      records = [{ id: 'fixture', subject: state.subjects[0].name, seconds: 86400, created: Date.now(), source: 'manual' }];
      freeStudies = [{ id: 'fixture', title: '긴제목'.repeat(26), note: '메모'.repeat(200), minutes: 1440, date: today() }];
      guest = { id: 'preview-only', name: '닉네임길게'.repeat(4) };
      community = { me: guest, friends: [{ id: 'friend', name: '친구이름'.repeat(5), state: 'accepted', total: 86400, status: '집중 중', dailyActual: 86400, dailyGoal: 1440 }], messages: [] };
      api = async () => community;
    });

    for (const width of widths) {
      await page.setViewportSize({ width, height: width < 480 ? 600 : 900 });
      for (const screen of screens) {
        await page.evaluate(screen => {
          if (screen === 'setup') view(false);
          else if (screen === 'plan') { renderPlan(); view(true); }
          else openHub(screen);
          window.scrollTo(0, 0);
        }, screen);
        const issues = await page.evaluate(() => {
          const visible = e => e.checkVisibility({ checkVisibilityCSS: true }) && e.getClientRects().length;
          const identify = e => e.id || e.className || e.tagName;
          const issues = [];
          for (const e of document.querySelectorAll('body *')) {
            if (visible(e) && e.clientWidth && e.scrollWidth > e.clientWidth + 2 && !['INPUT', 'SELECT', 'TEXTAREA'].includes(e.tagName)) issues.push('content overflow: ' + identify(e));
          }
          if (document.documentElement.scrollWidth > innerWidth + 1) issues.push('page overflow');
          const controls = [...document.querySelectorAll('input,select,textarea,button')].filter(e => visible(e) && e.getBoundingClientRect().width > 2 && !e.closest('.tabs') && !['petButton', 'liveTimer'].includes(e.id));
          for (let i = 0; i < controls.length; i++) {
            const a = controls[i].getBoundingClientRect();
            if (a.right > innerWidth + 1 || a.left < -1) issues.push('control outside viewport: ' + identify(controls[i]));
            for (let j = i + 1; j < controls.length; j++) {
              if (controls[i].contains(controls[j]) || controls[j].contains(controls[i])) continue;
              const b = controls[j].getBoundingClientRect();
              if (Math.min(a.right, b.right) - Math.max(a.left, b.left) > 2 && Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top) > 2) issues.push('controls overlap: ' + identify(controls[i]) + '/' + identify(controls[j]));
            }
          }
          return [...new Set(issues)];
        });
        assert.deepEqual(issues, [], `${width}px ${screen}: ${issues.join(', ')}`);
        if (screen === 'setup' && width <= 480) {
          assert.ok(await page.locator('[data-field="date"]').first().evaluate(e => e.getBoundingClientRect().width >= 200), 'date input needs space for native date controls');
          assert.equal(await page.locator('#hours').evaluate(e => getComputedStyle(e).gridTemplateColumns.split(' ').length), 4);
        }
      }
    }

    // The timer stays in the viewport; the mascot belongs to the navigation, not a floating overlay.
    await page.setViewportSize({ width: 320, height: 480 });
    await page.evaluate(() => {
      timer.subject = state.subjects[0].name;
      timer.elapsed = 123;
      timer.running = false;
      openHub('focus');
      updateTimerNotification();
    });
    const timerRect = await page.locator('#liveTimer').boundingBox();
    const mascotRect = await page.locator('#petButton').boundingBox();
    assert.ok(timerRect.x >= 0 && timerRect.x + timerRect.width <= 320, 'timer stays inside the viewport');
    assert.equal(await page.locator('#petButton').evaluate(e => e.closest('.tabs') !== null && getComputedStyle(e).position === 'static'), true, 'mascot does not float over inputs');
    await page.locator('#petButton').click();
    const panelRect = await page.locator('#petPanel').boundingBox();
    assert.ok(panelRect.y >= 0 && panelRect.y + panelRect.height <= 480, 'cheer panel fits short landscape screens');
    assert.deepEqual(errors, [], 'no client JavaScript errors');
    console.log(`${widths.length * screens.length} screen/width combinations passed, plus timer and short-screen panel checks`);
  } finally {
    if (browser) await browser.close();
    await new Promise(resolve => server.close(resolve));
  }
});
