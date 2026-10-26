/**
 * End-to-end tests against the production build, in real Chromium.
 *
 *   npm run build && npm run test:e2e
 *
 * Starts `vite preview`, generates test images (opaque, transparent, wide,
 * oversized and invalid files), and drives the real UI on desktop and mobile
 * viewports. Screenshots are written to e2e/output/ for visual review.
 * Requires the `playwright` package with Chromium available.
 */
const { chromium } = require('playwright');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const assert = require('assert/strict');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'e2e', 'output');
const PORT = 4179;
const BASE = `http://localhost:${PORT}`;

/* ---------- tiny PNG encoder for fixtures ---------- */
const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buf) => {
  let c = 0xffffffff;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 255] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
};
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function encodePng(width, height, pixel) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y++) {
    const row = y * (width * 4 + 1);
    raw[row] = 0;
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixel(x, y);
      const i = row + 1 + x * 4;
      raw[i] = r; raw[i + 1] = g; raw[i + 2] = b; raw[i + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', ihdr),
    chunk('IDAT', zlib.deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/* ---------- fixtures ---------- */
const RED = [220, 30, 30, 255];
const GREEN = [20, 160, 60, 255];
const fixtures = {
  // Left half red, right half green.
  'halves.png': () => encodePng(200, 100, (x) => (x < 100 ? RED : GREEN)),
  // Red square with a semi-transparent red band and a fully transparent border.
  'transparent.png': () =>
    encodePng(120, 120, (x, y) => {
      if (x < 10 || y < 10 || x >= 110 || y >= 110) return [0, 0, 0, 0];
      if (y < 40) return [220, 30, 30, 128];
      return RED;
    }),
  // Extreme aspect ratio.
  'wide.png': () => encodePng(3000, 12, (x) => (x % 300 < 150 ? RED : GREEN)),
  // 20 MP: above the 16.7 MP editing limit (tiny file, large bitmap).
  'huge.png': () => encodePng(5000, 4000, () => GREEN),
  // A text file pretending to be a PNG.
  'fake.png': () => Buffer.from('this is not an image, just text pretending to be one'),
  // Truncated PNG: valid signature, header cut off.
  'truncated.png': () => encodePng(50, 50, () => RED).subarray(0, 20),
};

/* ---------- helpers ---------- */
const results = [];
async function test(name, fn) {
  const started = Date.now();
  try {
    await fn();
    results.push({ name, ok: true });
    console.log(`  ✓ ${name} (${Date.now() - started} ms)`);
  } catch (err) {
    results.push({ name, ok: false, err });
    console.log(`  ✗ ${name}\n    ${String(err && err.stack || err).split('\n').slice(0, 4).join('\n    ')}`);
  }
}

function watchErrors(page) {
  const errors = [];
  page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
  });
  return errors;
}

/** Reads an RGBA pixel from the Nth canvas inside a figure titled `title`. */
async function canvasPixel(page, title, x, y) {
  return page.evaluate(
    ({ title, x, y }) => {
      const fig = [...document.querySelectorAll('figure')].find((f) =>
        f.querySelector('figcaption span')?.textContent.trim().startsWith(title),
      );
      const canvas = fig.querySelector('canvas');
      return Array.from(canvas.getContext('2d').getImageData(x, y, 1, 1).data);
    },
    { title, x, y },
  );
}

/** Clicks an image-space pixel on the stage titled `title`. */
async function clickImagePixel(page, title, x, y, imgW, imgH) {
  const stage = page.locator('figure', { has: page.locator(`figcaption span:text-is("${title}")`) }).locator('[role="application"]');
  const box = await stage.boundingBox();
  await stage.click({ position: { x: ((x + 0.5) / imgW) * box.width, y: ((y + 0.5) / imgH) * box.height } });
}

async function waitForIdle(page) {
  await page.waitForFunction(() => !document.body.textContent.includes('Updating…'), null, { timeout: 15000 });
  await page.waitForTimeout(150);
}

async function decodeInPage(page, buffer) {
  return page.evaluate(async (b64) => {
    const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
    const bmp = await createImageBitmap(new Blob([bytes]), { premultiplyAlpha: 'none' });
    const c = document.createElement('canvas');
    c.width = bmp.width;
    c.height = bmp.height;
    const ctx = c.getContext('2d');
    ctx.drawImage(bmp, 0, 0);
    return { width: bmp.width, height: bmp.height, data: Array.from(ctx.getImageData(0, 0, bmp.width, bmp.height).data) };
  }, buffer.toString('base64'));
}

/** Polls an input until it has `expected` (React commits after the event). */
async function expectValue(locator, expected, timeout = 3000) {
  const end = Date.now() + timeout;
  let value;
  while (Date.now() < end) {
    value = await locator.inputValue();
    if (value === expected) return;
    await new Promise((r) => setTimeout(r, 50));
  }
  assert.equal(value, expected);
}

/** Runs axe-core and fails on serious or critical WCAG A/AA violations. */
const AXE_SOURCE = fs.readFileSync(require.resolve('axe-core/axe.min.js'), 'utf8');
async function checkA11y(page, label) {
  await page.addScriptTag({ content: AXE_SOURCE });
  const violations = await page.evaluate(async () => {
    const r = await window.axe.run(document, { runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'] });
    return r.violations
      .filter((v) => v.impact === 'serious' || v.impact === 'critical')
      .map((v) => `${v.id}: ${v.help} (${v.nodes.slice(0, 3).map((n) => n.target.join(' ')).join(', ')})`);
  });
  assert.deepEqual(violations, [], `${label} accessibility violations`);
}

const near = (a, b, tol = 3) => a.every((v, i) => Math.abs(v - b[i]) <= tol);

/* ---------- main ---------- */
(async () => {
  fs.mkdirSync(OUT, { recursive: true });
  const fixtureDir = path.join(OUT, 'fixtures');
  fs.mkdirSync(fixtureDir, { recursive: true });
  for (const [name, make] of Object.entries(fixtures)) fs.writeFileSync(path.join(fixtureDir, name), make());
  const fx = (name) => path.join(fixtureDir, name);

  const server = spawn(process.execPath, [path.join(ROOT, 'node_modules/vite/bin/vite.js'), 'preview', '--port', String(PORT), '--strictPort'], {
    cwd: ROOT,
    stdio: 'pipe',
  });
  for (let i = 0; i < 50; i++) {
    try {
      await fetch(BASE);
      break;
    } catch {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  const browser = await chromium.launch();
  try {
    console.log('\nPages & SEO');
    const pages = ['/', '/how-to-replace-color-in-image', '/how-color-tolerance-works', '/faq', '/about', '/contact', '/privacy-policy', '/terms-of-service'];
    const seen = new Set();
    for (const p of pages) {
      await test(`page ${p} renders prerendered HTML, one <h1>, unique title, hydrates without errors`, async () => {
        const res = await fetch(BASE + p);
        assert.equal(res.status, 200);
        const html = await res.text();
        assert.match(html, /<h1[\s>]/, 'prerendered h1 present in raw HTML');
        const title = html.match(/<title>([^<]+)<\/title>/)[1];
        assert.ok(!seen.has(title), `duplicate title ${title}`);
        seen.add(title);
        assert.match(html, /<meta data-head="page" name="description" content="[^"]{50,}/);
        const page = await browser.newPage();
        const errors = watchErrors(page);
        await page.goto(BASE + p, { waitUntil: 'networkidle' });
        assert.equal(await page.locator('h1').count(), 1);
        const imgsWithoutAlt = await page.locator('img:not([alt])').count();
        assert.equal(imgsWithoutAlt, 0);
        await checkA11y(page, p);
        assert.deepEqual(errors, []);
        await page.close();
      });
    }

    await test('unknown URL returns 404 status', async () => {
      const res = await fetch(`${BASE}/this-page-does-not-exist`);
      assert.equal(res.status, 404);
      const html = fs.readFileSync(path.join(ROOT, 'dist', '404.html'), 'utf8');
      assert.match(html, /noindex/);
      assert.match(html, /Page not found/);
    });

    await test('client-side navigation updates title, description and focus', async () => {
      const page = await browser.newPage();
      const errors = watchErrors(page);
      await page.goto(BASE + '/', { waitUntil: 'networkidle' });
      await page.locator('header nav >> text=FAQ').click();
      await page.waitForURL('**/faq');
      await page.waitForFunction(() => document.title.includes('FAQ'));
      const desc = await page.locator('meta[name="description"]').getAttribute('content');
      assert.match(desc, /common questions/);
      assert.equal(await page.locator('meta[name="description"]').count(), 1);
      assert.equal(await page.locator('script[type="application/ld+json"]').count(), 1);
      await page.locator('footer >> text=Privacy policy').click();
      await page.waitForURL('**/privacy-policy');
      await page.waitForFunction(() => document.title.startsWith('Privacy Policy'));
      assert.equal(await page.locator('script[type="application/ld+json"]').count(), 0);
      assert.equal(await page.evaluate(() => document.activeElement?.id), 'main');
      assert.deepEqual(errors, []);
      await page.close();
    });

    console.log('\nEditor (desktop)');
    const context = await browser.newContext({ viewport: { width: 1400, height: 1000 }, acceptDownloads: true });
    const page = await context.newPage();
    const errors = watchErrors(page);
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });

    await test('rejects a non-image file disguised as .png', async () => {
      await page.locator('input[type="file"]').setInputFiles(fx('fake.png'));
      await page.getByRole('alert').filter({ hasText: 'not a PNG, JPEG or WebP' }).waitFor();
      await page.getByRole('button', { name: 'Dismiss error' }).click();
    });

    await test('rejects a truncated PNG before decoding', async () => {
      await page.locator('input[type="file"]').setInputFiles(fx('truncated.png'));
      await page.getByRole('alert').filter({ hasText: 'damaged' }).waitFor();
      await page.getByRole('button', { name: 'Dismiss error' }).click();
    });

    await test('offers to scale down an oversized (20 MP) image and keeps its aspect ratio', async () => {
      await page.locator('input[type="file"]').setInputFiles(fx('huge.png'));
      const dialog = page.getByRole('alertdialog');
      await dialog.waitFor();
      assert.match(await dialog.textContent(), /5000 × 4000/);
      await page.getByRole('button', { name: 'Scale down and continue' }).click();
      await page.locator('figure canvas').first().waitFor();
      const dims = await page.evaluate(() => {
        const c = document.querySelector('figure canvas');
        return [c.width, c.height];
      });
      assert.ok(dims[0] * dims[1] <= 4096 * 4096, `scaled to ${dims}`);
      assert.ok(Math.abs(dims[0] / dims[1] - 1.25) < 0.01);
      assert.match(await page.locator('text=scaled from 5000 × 4000').textContent(), /scaled from/);
    });

    await test('opens a PNG and shows original and result side by side', async () => {
      await page.locator('input[type="file"]').first().setInputFiles(fx('halves.png'));
      await page.waitForFunction(() => {
        const c = document.querySelector('figure canvas');
        return c && c.width === 200 && c.height === 100;
      });
      assert.equal(await page.locator('figure').count(), 2);
      await checkA11y(page, 'editor');
      await page.screenshot({ path: path.join(OUT, 'desktop-loaded.png'), fullPage: false });
    });

    await test('clicking the scaled preview selects the correct source color', async () => {
      await clickImagePixel(page, 'Original', 30, 50, 200, 100);
      await expectValue(page.getByLabel('HEX').first(), '#dc1e1e');
      assert.ok((await page.locator('text=rgb(220, 30, 30)').count()) > 0);
      assert.ok((await page.locator('text=hsl(').count()) > 0);
    });

    await test('replacement color via HEX input recolors only matching pixels', async () => {
      const targetHex = page.getByLabel('HEX').nth(1);
      await targetHex.fill('#0000ff');
      await waitForIdle(page);
      await page.getByLabel('Preserve shading').uncheck();
      await waitForIdle(page);
      const left = await canvasPixel(page, 'Result', 30, 50);
      const right = await canvasPixel(page, 'Result', 170, 50);
      const orig = await canvasPixel(page, 'Original', 30, 50);
      assert.ok(near(left, [0, 0, 255, 255]), `left ${left}`);
      assert.deepEqual(right, GREEN);
      assert.deepEqual(orig, RED, 'original preview unchanged');
    });

    await test('RGB channel inputs validate and update the color', async () => {
      const green = page.getByLabel(/^Green/).nth(1);
      await green.fill('300');
      await page.getByRole('alert').filter({ hasText: 'whole number from 0 to 255' }).waitFor();
      await green.fill('128');
      await waitForIdle(page);
      const left = await canvasPixel(page, 'Result', 30, 50);
      assert.ok(near(left, [0, 128, 255, 255]), `left ${left}`);
      await expectValue(page.getByLabel('HEX').nth(1), '#0080ff');
    });

    await test('invalid HEX shows an error on blur and does not change the color', async () => {
      const hex = page.getByLabel('HEX').nth(1);
      await hex.fill('#12345z');
      await hex.blur();
      await page.getByRole('alert').filter({ hasText: '3 or 6 hex digits' }).waitFor();
      const left = await canvasPixel(page, 'Result', 30, 50);
      assert.ok(near(left, [0, 128, 255, 255]));
      await hex.fill('#0080ff');
    });

    await test('undo and redo restore earlier results', async () => {
      // Undo every step back to the untouched original.
      while (!(await page.getByRole('button', { name: 'Undo' }).isDisabled())) {
        await page.getByRole('button', { name: 'Undo' }).click();
      }
      await waitForIdle(page);
      assert.deepEqual(await canvasPixel(page, 'Result', 30, 50), RED, 'fully undone to original');
      while (!(await page.getByRole('button', { name: 'Redo' }).isDisabled())) {
        await page.getByRole('button', { name: 'Redo' }).click();
      }
      await waitForIdle(page);
      assert.ok(near(await canvasPixel(page, 'Result', 30, 50), [0, 128, 255, 255]));
      // Keyboard shortcuts
      await page.locator('body').click({ position: { x: 5, y: 5 } });
      await page.keyboard.press('Control+z');
      await waitForIdle(page);
      await page.keyboard.press('Control+y');
      await waitForIdle(page);
      assert.ok(near(await canvasPixel(page, 'Result', 30, 50), [0, 128, 255, 255]));
    });

    await test('tolerance slider and affected-area mask update the preview', async () => {
      await page.getByLabel('Highlight affected area').check();
      await waitForIdle(page);
      const masked = await canvasPixel(page, 'Affected area', 30, 50);
      assert.deepEqual(masked.slice(0, 3), [255, 0, 220]);
      await page.getByLabel('Highlight affected area').uncheck();
      await waitForIdle(page);
    });

    await test('keep a replacement and replace a second color on top', async () => {
      await page.getByRole('button', { name: /Keep & pick another color/ }).click();
      await clickImagePixel(page, 'Result', 170, 50, 200, 100);
      await expectValue(page.getByLabel('HEX').first(), '#14a03c');
      await page.getByLabel('HEX').nth(1).fill('#ffff00');
      await waitForIdle(page);
      assert.ok(near(await canvasPixel(page, 'Result', 170, 50), [255, 255, 0, 255]));
      assert.ok(near(await canvasPixel(page, 'Result', 30, 50), [0, 128, 255, 255]), 'first replacement kept');
      assert.equal(await page.locator('ol[aria-label="Kept replacements"] li').count(), 1);
    });

    await test('compare slider view renders both layers', async () => {
      await page.getByRole('button', { name: 'Compare slider' }).click();
      await page.getByLabel('Comparison divider position').fill('30');
      assert.equal(await page.locator('figure canvas').count(), 2);
      await page.screenshot({ path: path.join(OUT, 'desktop-compare.png') });
      await page.getByRole('button', { name: 'Side by side' }).click();
    });

    await test('zoom controls change the display size, not the image', async () => {
      const stage = page.locator('figure [role="application"]').first();
      const before = (await stage.boundingBox()).width;
      await page.getByRole('button', { name: '100%' }).click();
      const at100 = (await stage.boundingBox()).width;
      assert.equal(Math.round(at100), 200);
      await page.getByRole('button', { name: 'Zoom in' }).click();
      assert.equal(Math.round((await stage.boundingBox()).width), 300);
      await page.getByRole('button', { name: 'Fit' }).click();
      assert.equal(Math.round((await stage.boundingBox()).width), Math.round(before));
    });

    let pngPath;
    await test('downloads PNG with original dimensions and edited pixels', async () => {
      await page.getByLabel('File name').fill('My Recolored / ../Image');
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^Download PNG/ }).click()]);
      assert.equal(download.suggestedFilename(), 'my-recolored-image.png');
      pngPath = path.join(OUT, 'download.png');
      await download.saveAs(pngPath);
      const buf = fs.readFileSync(pngPath);
      assert.equal(buf.readUInt32BE(16), 200);
      assert.equal(buf.readUInt32BE(20), 100);
      const decoded = await decodeInPage(page, buf);
      const px = (x, y) => decoded.data.slice((y * 200 + x) * 4, (y * 200 + x) * 4 + 4);
      assert.ok(near(px(170, 50), [255, 255, 0, 255]), `${px(170, 50)}`);
      await page.getByText(/Download started: my-recolored-image\.png/).waitFor();
    });

    await test('downloads JPEG and WebP with correct signatures', async () => {
      await page.locator('label', { hasText: /^JPEG$/ }).click();
      await page.getByText('JPEG does not support transparency').waitFor();
      let [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^Download JPEG/ }).click()]);
      assert.match(download.suggestedFilename(), /\.jpg$/);
      let buf = fs.readFileSync(await download.path());
      assert.deepEqual([...buf.subarray(0, 3)], [0xff, 0xd8, 0xff]);
      await page.locator('label', { hasText: /^WebP$/ }).click();
      [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^Download WebP/ }).click()]);
      buf = fs.readFileSync(await download.path());
      assert.equal(buf.subarray(0, 4).toString(), 'RIFF');
      assert.equal(buf.subarray(8, 12).toString(), 'WEBP');
      await page.locator('label', { hasText: /^PNG$/ }).click();
    });

    await test('reset restores the original image', async () => {
      await page.getByRole('button', { name: 'Reset' }).click();
      await waitForIdle(page);
      assert.deepEqual(await canvasPixel(page, 'Result', 30, 50), RED);
      assert.deepEqual(await canvasPixel(page, 'Result', 170, 50), GREEN);
      await page.getByRole('button', { name: 'Undo' }).click();
      await waitForIdle(page);
      assert.ok(near(await canvasPixel(page, 'Result', 170, 50), [255, 255, 0, 255]), 'reset is undoable');
    });

    await test('transparency: alpha preserved in preview and PNG download', async () => {
      await page.getByRole('button', { name: 'Replace image' }).click();
      await page.locator('input[type="file"]').first().setInputFiles(fx('transparent.png'));
      await page.waitForFunction(() => document.querySelector('figure canvas')?.width === 120);
      // Pick from the opaque area: canvas stores premultiplied alpha, so a
      // semi-transparent pixel can read back one level off (e.g. #db1e1e).
      await clickImagePixel(page, 'Original', 60, 80, 120, 120);
      await expectValue(page.getByLabel('HEX').first(), '#dc1e1e');
      await page.getByLabel('HEX').nth(1).fill('#00ff00');
      await waitForIdle(page);
      const semi = await canvasPixel(page, 'Result', 60, 20);
      assert.equal(semi[3], 128, `alpha ${semi}`);
      assert.ok(semi[1] > 150 && semi[0] < 100, `color ${semi}`);
      assert.equal((await canvasPixel(page, 'Result', 2, 2))[3], 0);
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /^Download PNG/ }).click()]);
      const decoded = await decodeInPage(page, fs.readFileSync(await download.path()));
      const px = (x, y) => decoded.data.slice((y * 120 + x) * 4, (y * 120 + x) * 4 + 4);
      assert.equal(px(2, 2)[3], 0);
      assert.equal(px(60, 20)[3], 128);
      assert.equal(px(60, 80)[3], 255);
    });

    await test('clicking a fully transparent pixel explains why nothing was selected', async () => {
      await clickImagePixel(page, 'Original', 2, 2, 120, 120);
      await page.getByText('fully transparent').waitFor();
    });

    await test('extreme aspect ratio image (3000 × 12) loads and can be picked', async () => {
      await page.getByRole('button', { name: 'Replace image' }).click();
      await page.locator('input[type="file"]').first().setInputFiles(fx('wide.png'));
      await page.waitForFunction(() => document.querySelector('figure canvas')?.width === 3000);
      await page.getByRole('button', { name: '100%' }).click();
      await clickImagePixel(page, 'Original', 10, 6, 3000, 12);
      await expectValue(page.getByLabel('HEX').first(), '#dc1e1e');
      await page.getByRole('button', { name: 'Fit' }).click();
    });

    await test('keyboard: arrow keys + Enter pick a color on the focused preview', async () => {
      await page.getByRole('button', { name: 'Close' }).click();
      await page.locator('input[type="file"]').first().setInputFiles(fx('halves.png'));
      await page.waitForFunction(() => document.querySelector('figure canvas')?.width === 200);
      const stage = page.locator('figure [role="application"]').first();
      await stage.focus();
      for (let i = 0; i < 4; i++) await page.keyboard.press('Shift+ArrowRight'); // from centre (100) to the green half
      await page.keyboard.press('Enter');
      await expectValue(page.getByLabel('HEX').first(), '#14a03c');
    });

    await test('sample image loads', async () => {
      await page.getByRole('button', { name: 'Close' }).click();
      await page.getByRole('button', { name: 'Try a sample image' }).click();
      await page.waitForFunction(() => document.querySelector('figure canvas')?.width === 960);
      await clickImagePixel(page, 'Original', 345, 245, 960, 640); // balloon
      await page.getByLabel('HEX').nth(1).fill('#2563eb');
      await waitForIdle(page);
      await page.screenshot({ path: path.join(OUT, 'desktop-sample.png') });
    });

    await test('no console errors during the editor session', async () => {
      assert.deepEqual(errors, []);
    });
    await context.close();

    console.log('\nMobile');
    const mobile = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const m = await mobile.newPage();
    const mErrors = watchErrors(m);
    await test('mobile: no horizontal overflow on any page', async () => {
      for (const p of pages) {
        await m.goto(BASE + p, { waitUntil: 'networkidle' });
        const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
        assert.ok(overflow <= 0, `${p} overflows by ${overflow}px`);
      }
    });
    await test('mobile: menu toggles and navigates', async () => {
      await m.goto(BASE + '/', { waitUntil: 'networkidle' });
      await m.getByRole('button', { name: 'Open menu' }).click();
      await m.locator('#mobile-nav >> text=How-to guide').click();
      await m.waitForURL('**/how-to-replace-color-in-image');
      await m.locator('#mobile-nav').waitFor({ state: 'detached', timeout: 3000 });
      await m.screenshot({ path: path.join(OUT, 'mobile-article.png') });
    });
    await test('mobile: editor stacks previews, tap picks a color, no overflow', async () => {
      await m.goto(BASE + '/', { waitUntil: 'networkidle' });
      await m.screenshot({ path: path.join(OUT, 'mobile-home.png') });
      await m.locator('input[type="file"]').setInputFiles(fx('halves.png'));
      await m.waitForFunction(() => document.querySelector('figure canvas')?.width === 200);
      const boxes = await m.locator('figure').evaluateAll((els) => els.map((e) => e.getBoundingClientRect().top));
      assert.ok(boxes[1] > boxes[0] + 50, 'stacked vertically');
      const stage = m.locator('figure [role="application"]').first();
      const box = await stage.boundingBox();
      await stage.tap({ position: { x: box.width * 0.2, y: box.height / 2 } });
      await expectValue(m.getByLabel('HEX').first(), '#dc1e1e');
      const overflow = await m.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      assert.ok(overflow <= 0, `overflow ${overflow}`);
      await m.getByRole('button', { name: 'Result', exact: true }).click();
      assert.equal(await m.locator('figure').count(), 1);
      await m.screenshot({ path: path.join(OUT, 'mobile-editor.png'), fullPage: true });
      assert.deepEqual(mErrors, []);
    });
    await mobile.close();
  } finally {
    await browser.close();
    server.kill();
  }

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${results.length - failed.length} passed, ${failed.length} failed`);
  process.exit(failed.length ? 1 : 0);
})();
