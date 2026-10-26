/**
 * Regenerates the PNG icons and the Open Graph image in /public from
 * public/favicon.svg using the locally installed Playwright Chromium.
 * Run with: npm run generate:icons
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const pub = path.join(__dirname, '..', 'public');
const svg = fs.readFileSync(path.join(pub, 'favicon.svg'), 'utf8');

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  const shot = async (html, width, height, file) => {
    await page.setViewportSize({ width, height });
    await page.setContent(`<!doctype html><html><body style="margin:0">${html}</body></html>`);
    await page.screenshot({ path: path.join(pub, file), omitBackground: true, clip: { x: 0, y: 0, width, height } });
    console.log('wrote', file);
  };
  const icon = (size) => `<div style="width:${size}px;height:${size}px">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</div>`;

  await shot(icon(32), 32, 32, 'favicon-32.png');
  await shot(icon(180), 180, 180, 'apple-touch-icon.png');
  await shot(icon(192), 192, 192, 'icon-192.png');
  await shot(icon(512), 512, 512, 'icon-512.png');
  // Maskable icon: full-bleed background with the mark inside the safe zone.
  await shot(
    `<div style="width:512px;height:512px;background:#4f46e5;display:flex;align-items:center;justify-content:center">${svg
      .replace('<rect width="32" height="32" rx="8" fill="#4f46e5"/>', '')
      .replace('<svg ', '<svg width="340" height="340" ')}</div>`,
    512, 512, 'icon-maskable-512.png',
  );

  const og = `
  <div style="width:1200px;height:630px;box-sizing:border-box;padding:72px 80px;font-family:system-ui,-apple-system,'Segoe UI',Roboto,sans-serif;
    background:linear-gradient(135deg,#eef2ff 0%,#ffffff 55%,#ecfeff 100%);display:flex;flex-direction:column;justify-content:space-between">
    <div style="display:flex;align-items:center;gap:20px">
      ${svg.replace('<svg ', '<svg width="72" height="72" ')}
      <span style="font-size:40px;font-weight:800;color:#0f172a;letter-spacing:-0.5px">Image Color Replace</span>
    </div>
    <div>
      <div style="font-size:72px;font-weight:800;line-height:1.05;color:#0f172a;letter-spacing:-1.5px;max-width:900px">Replace any color in an image</div>
      <div style="margin-top:24px;font-size:32px;color:#475569">Pick a color, choose a new one, download. Free and private — runs in your browser.</div>
    </div>
    <div style="display:flex;gap:16px;align-items:center">
      <span style="width:96px;height:56px;border-radius:12px;background:#dc2626"></span>
      <span style="font-size:44px;color:#64748b">→</span>
      <span style="width:96px;height:56px;border-radius:12px;background:#2563eb"></span>
    </div>
  </div>`;
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<!doctype html><html><body style="margin:0">${og}</body></html>`);
  await page.screenshot({ path: path.join(pub, 'og-image.png'), clip: { x: 0, y: 0, width: 1200, height: 630 } });
  console.log('wrote og-image.png');
  await browser.close();
})();
