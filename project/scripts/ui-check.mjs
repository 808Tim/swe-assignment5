// Task #07: manual UI checks, recorded with a real browser (Microsoft Edge via playwright-core).
// Builds are served with `vite preview`; screenshots + observations go to ./reports/ui/ (inside the repo).
// Usage: npm run build && node scripts/ui-check.mjs
import { chromium } from 'playwright-core';
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const ROOT = resolve(import.meta.dirname, '..');
const OUT = resolve(ROOT, 'reports', 'ui'); // inside the repo (git-ignored); never write outside ROOT
mkdirSync(OUT, { recursive: true });
const PORT = 4179 + Math.floor(Math.random() * 500);
const URL = `http://localhost:${PORT}/`;

const server = spawn('npx', ['vite', 'preview', '--port', String(PORT), '--strictPort'], { cwd: ROOT, shell: true });
await new Promise((ok, fail) => {
  const t = setTimeout(() => fail(new Error('preview did not start')), 30000);
  server.stdout.on('data', (d) => { if (String(d).includes(String(PORT))) { clearTimeout(t); ok(); } });
});

const browser = await chromium.launch({ channel: 'msedge', headless: true });
const rows = [];
const record = (id, action, expected, observed, pass, shot) => {
  rows.push({ id, action, expected, observed, pass, shot });
  console.log(`${pass ? 'PASS' : 'FAIL'} ${id} ${action} -> ${observed}`);
};

async function fill(page, now, start, end) {
  await page.fill('#current-time', now);
  await page.fill('#start-time', start);
  await page.fill('#end-time', end);
  await page.click('text=Check availability');
}
const resultText = (page) => page.locator('section.mt-5').innerText().catch(() => '(no result)');
const bookingsText = (page) => page.locator('text=Existing bookings for').locator('..').innerText().catch(() => '(none shown)');

for (const vp of [{ name: 'desktop', width: 1280, height: 900 }, { name: 'mobile', width: 375, height: 812 }]) {
  const page = await browser.newPage({ viewport: { width: vp.width, height: vp.height } });
  await page.goto(URL);
  const p = (n) => `${vp.name}_${n}.png`;

  // U1: 11:00–12:00, unblocked room A101 (fixed booking 10:00–11:00, now 09:00)
  const bookingsBefore = await bookingsText(page);
  await fill(page, '540', '660', '720');
  let r = await resultText(page);
  await page.screenshot({ path: resolve(OUT, p('U1_available')), fullPage: true });
  record(`U1-${vp.name}`, 'Room A101, now 540, check 660–720 (11:00–12:00)', 'Available, sample booking 10:00–11:00 still shown',
    r.replace(/\n/g, ' '), r.startsWith('Available') && bookingsBefore.includes('10:00 – 11:00'), p('U1_available'));

  // U2: blocked room, check again — Unavailable replaces Available
  await page.click('button:has-text("Room C303")');
  await fill(page, '540', '660', '720');
  r = await resultText(page);
  await page.screenshot({ path: resolve(OUT, p('U2_blocked')), fullPage: true });
  record(`U2-${vp.name}`, 'Select blocked Room C303, check 660–720 again', 'Unavailable replaces earlier result',
    r.replace(/\n/g, ' '), r.startsWith('Unavailable') && /blocked/i.test(r) && !(await page.isVisible('text="Available"')), p('U2_blocked'));

  // U3: clear a required input and submit
  await page.click('button:has-text("Room A101")');
  await fill(page, '540', '660', '');
  r = await resultText(page);
  await page.screenshot({ path: resolve(OUT, p('U3_validation')), fullPage: true });
  record(`U3-${vp.name}`, 'Clear End time, submit', 'Understandable validation feedback',
    r.replace(/\n/g, ' '), /fill in all three/i.test(r), p('U3_validation'));

  // U4: layout usable at this width (no horizontal scroll, button and result visible)
  await fill(page, '540', '630', '690');
  const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
  const btn = await page.locator('text=Check availability').boundingBox();
  r = await resultText(page);
  await page.screenshot({ path: resolve(OUT, p('U4_layout_overlap')), fullPage: true });
  record(`U4-${vp.name}`, `Width ${vp.width}px: overlap check 630–690`, 'Controls and result usable, no horizontal scroll',
    `scrollWidth=${scrollW}, button ${Math.round(btn.width)}px wide; result: ${r.replace(/\n/g, ' ')}`,
    scrollW <= vp.width && btn.width > 0 && r.startsWith('Unavailable'), p('U4_layout_overlap'));

  // U5: repeat checks on the same data — bookings unchanged
  for (const [s, e] of [['660', '720'], ['630', '690'], ['720', '840'], ['570', '600']]) await fill(page, '540', s, e);
  const bookingsAfter = await bookingsText(page);
  await page.screenshot({ path: resolve(OUT, p('U5_repeat')), fullPage: true });
  record(`U5-${vp.name}`, 'Repeat 4 more checks on Room A101', 'Existing bookings remain unchanged',
    `before: "${bookingsBefore.replace(/\n/g, ' ')}" / after: "${bookingsAfter.replace(/\n/g, ' ')}"`,
    bookingsBefore === bookingsAfter, p('U5_repeat'));
  await page.close();
}

await browser.close();
// server.kill() leaves the vite child running on Windows; kill the whole tree.
if (process.platform === 'win32') (await import('node:child_process')).spawnSync('taskkill', ['/PID', String(server.pid), '/T', '/F']); else server.kill();

const md = ['| ID | Action | Expected | Observed | Result | Screenshot |', '|---|---|---|---|---|---|',
  ...rows.map((x) => `| ${x.id} | ${x.action} | ${x.expected} | ${x.observed.replace(/\|/g, '/')} | ${x.pass ? 'PASS' : 'FAIL'} | ui/${x.shot} |`)];
writeFileSync(resolve(OUT, '..', '07_ui_checks.md'), `# UI check log (${new Date().toISOString()}, Edge headless)\n\n${md.join('\n')}\n`);
process.exit(0);
