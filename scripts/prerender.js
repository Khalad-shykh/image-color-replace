/**
 * Post-build step: renders every public route to static HTML so search
 * engines and social previews get real content and per-page <head> tags,
 * then writes 404.html, sitemap.xml, robots.txt, ads.txt and _headers.
 *
 * Output layout (works with Cloudflare Pages, Netlify and `vite preview`):
 *   /                      -> dist/index.html
 *   /faq                   -> dist/faq.html   (served at the extensionless URL)
 *   unknown URLs           -> dist/404.html   (served with HTTP status 404)
 */
import { readFile, writeFile, rm } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';
import path from 'node:path';
import { loadEnv } from 'vite';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const ssrDir = path.join(root, 'dist-ssr');

// Make .env values available here too (Vite only loads them for the bundles).
Object.assign(process.env, { ...loadEnv('production', root, 'VITE_'), ...process.env });

const server = await import(pathToFileURL(path.join(ssrDir, 'entry-server.js')).href);
const { render, ROUTES, NOT_FOUND_ROUTE, buildHeadTags, SITE, ADS } = server;

const template = await readFile(path.join(dist, 'index.html'), 'utf8');
const escapeHtml = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Optional Google Search Console "HTML tag" verification token.
const gscToken = (process.env.VITE_GOOGLE_SITE_VERIFICATION || '').trim();
const verifyHead = /^[\w-]{10,100}$/.test(gscToken) ? `<meta name="google-site-verification" content="${gscToken}">` : '';

const adsHead = ADS.enabled
  ? [
      `<meta name="google-adsense-account" content="${ADS.client}">`,
      `<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${ADS.client}" crossorigin="anonymous"></script>`,
    ].join('\n    ')
  : '';

function page(route, url) {
  const appHtml = render(url);
  return template
    .replace('<!--app-title-->', escapeHtml(route.title))
    .replace('<!--app-head-->', buildHeadTags(route))
    .replace('<!--app-ads-->', [verifyHead, adsHead].filter(Boolean).join('\n    '))
    .replace('<!--app-html-->', appHtml);
}

const written = [];
for (const route of ROUTES) {
  const file = route.path === '/' ? 'index.html' : `${route.path.slice(1)}.html`;
  await writeFile(path.join(dist, file), page(route, route.path));
  written.push(file);
}
await writeFile(path.join(dist, '404.html'), page(NOT_FOUND_ROUTE, '/404'));
written.push('404.html');

// robots.txt and sitemap.xml
const robots = ['User-agent: *', 'Allow: /', ''];
if (SITE.url) {
  const urls = ROUTES.map(
    (r) => `  <url>\n    <loc>${SITE.url}${r.path}</loc>\n    <lastmod>${SITE.lastUpdated}</lastmod>\n  </url>`,
  ).join('\n');
  await writeFile(
    path.join(dist, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`,
  );
  robots.push(`Sitemap: ${SITE.url}/sitemap.xml`, '');
  written.push('sitemap.xml');
}
await writeFile(path.join(dist, 'robots.txt'), robots.join('\n'));
written.push('robots.txt');

// ads.txt (only with a real publisher ID). f08c47fec0942fa0 is Google's
// published certification authority ID for ads.txt.
if (ADS.enabled) {
  await writeFile(path.join(dist, 'ads.txt'), `google.com, ${ADS.publisherId}, DIRECT, f08c47fec0942fa0\n`);
  written.push('ads.txt');
}

// _headers: security and caching headers for Cloudflare Pages / Netlify.
const csp = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "worker-src 'self' blob:",
  "connect-src 'self'",
  "font-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
  'upgrade-insecure-requests',
].join('; ');
const headers = [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  '  X-Frame-Options: DENY',
  // AdSense loads scripts and frames from many Google domains, so the strict
  // policy is only applied while ads are disabled.
  ADS.enabled ? null : `  Content-Security-Policy: ${csp}`,
  '',
  '/assets/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
].filter((line) => line !== null);
await writeFile(path.join(dist, '_headers'), headers.join('\n'));
written.push('_headers');

await rm(ssrDir, { recursive: true, force: true });

console.log(`\nPrerendered ${written.length} files: ${written.join(', ')}`);
const warn = (msg) => console.warn(`\x1b[33mWARNING:\x1b[0m ${msg}`);
if (!SITE.url) warn('VITE_SITE_URL is not set: canonical URLs, og:url and sitemap.xml were omitted. Set it before launch.');
if (!SITE.contactEmail) warn('VITE_CONTACT_EMAIL is not set: the Contact page has no email address. Set it before launch.');
console.log(ADS.enabled ? `AdSense enabled for ${ADS.client}.` : 'AdSense disabled (no valid VITE_ADSENSE_CLIENT).');
