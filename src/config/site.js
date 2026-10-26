/**
 * Site-wide settings. Values come from build-time environment variables
 * (see .env.example and README). Nothing here is secret: every value ends up
 * in public HTML/JS.
 */
const env = import.meta.env ?? {};

const trimSlash = (url) => (url || '').trim().replace(/\/+$/, '');
const validEmail = (v) => (/^[^\s@<>"]+@[^\s@<>"]+\.[^\s@<>"]+$/.test(v || '') ? v.trim() : '');

export const SITE = Object.freeze({
  name: 'Image Color Replace',
  shortName: 'Color Replace',
  tagline: 'Replace any color in an image, right in your browser',
  // Public origin, e.g. https://imagecolorreplace.com. When empty, canonical
  // and Open Graph URLs are omitted rather than pointing at a wrong domain.
  url: trimSlash(env.VITE_SITE_URL),
  contactEmail: validEmail(env.VITE_CONTACT_EMAIL),
  themeColor: '#4f46e5',
  ogImage: '/og-image.png',
  locale: 'en_US',
  lastUpdated: '2026-10-26',
});

/** Absolute URL for a path, or '' when no site URL is configured. */
export function absoluteUrl(path = '/') {
  if (!SITE.url) return '';
  return `${SITE.url}${path === '/' ? '/' : path}`;
}
