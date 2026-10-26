/**
 * Builds the per-page <head> tags. The same function is used when
 * prerendering HTML at build time and when navigating on the client.
 */
import { SITE, absoluteUrl } from '../config/site.js';
import { FAQ_ITEMS } from '../content/faq.js';

const escapeHtml = (s) =>
  String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);

// JSON inside <script> must not contain "</script" or HTML comment openers.
const safeJson = (obj) => JSON.stringify(obj).replace(/</g, '\\u003c');

/** Structured data, only for pages whose content genuinely matches the type. */
export function structuredData(route) {
  const url = absoluteUrl(route.path) || undefined;
  if (route.path === '/') {
    return {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: SITE.name,
      ...(url ? { url } : {}),
      description: route.description,
      applicationCategory: 'MultimediaApplication',
      operatingSystem: 'Any (runs in a modern web browser)',
      browserRequirements: 'Requires JavaScript and HTML5 Canvas',
      isAccessibleForFree: true,
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: [
        'Pick the color to replace by clicking the image',
        'Adjustable color tolerance and edge feathering',
        'Preserves transparency and shading',
        'Undo, redo and before/after comparison',
        'Download as PNG, JPEG or WebP',
        'Images are processed locally in the browser',
      ],
    };
  }
  if (route.path === '/faq') {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQ_ITEMS.map((item) => ({
        '@type': 'Question',
        name: item.question,
        acceptedAnswer: { '@type': 'Answer', text: item.answer },
      })),
    };
  }
  return null;
}

/** Returns an HTML string of head tags marked with data-head="page". */
export function buildHeadTags(route) {
  const canonical = route.noindex ? '' : absoluteUrl(route.path);
  const image = absoluteUrl(SITE.ogImage);
  const tags = [
    `<meta name="description" content="${escapeHtml(route.description)}">`,
    route.noindex ? '<meta name="robots" content="noindex, follow">' : '',
    canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : '',
    `<meta property="og:type" content="website">`,
    `<meta property="og:site_name" content="${escapeHtml(SITE.name)}">`,
    `<meta property="og:title" content="${escapeHtml(route.title)}">`,
    `<meta property="og:description" content="${escapeHtml(route.description)}">`,
    `<meta property="og:locale" content="${SITE.locale}">`,
    canonical ? `<meta property="og:url" content="${escapeHtml(canonical)}">` : '',
    image ? `<meta property="og:image" content="${escapeHtml(image)}">` : '',
    image ? '<meta property="og:image:width" content="1200">' : '',
    image ? '<meta property="og:image:height" content="630">' : '',
    image ? `<meta property="og:image:alt" content="${escapeHtml(`${SITE.name} – ${SITE.tagline}`)}">` : '',
    `<meta name="twitter:card" content="${image ? 'summary_large_image' : 'summary'}">`,
    `<meta name="twitter:title" content="${escapeHtml(route.title)}">`,
    `<meta name="twitter:description" content="${escapeHtml(route.description)}">`,
    image ? `<meta name="twitter:image" content="${escapeHtml(image)}">` : '',
  ];
  const data = structuredData(route);
  if (data) tags.push(`<script type="application/ld+json">${safeJson(data)}</script>`);
  return tags
    .filter(Boolean)
    .map((t) => t.replace(/^<(\w+)/, '<$1 data-head="page"'))
    .join('\n    ');
}

/** Client-side: replace the page-specific head tags after navigation. */
export function applyHead(route) {
  if (typeof document === 'undefined') return;
  document.title = route.title;
  document.head.querySelectorAll('[data-head="page"]').forEach((el) => el.remove());
  document.head.insertAdjacentHTML('beforeend', buildHeadTags(route));
}
