/**
 * Google AdSense configuration.
 *
 * Ads are completely disabled (no script is loaded and no ad space is
 * reserved) unless a valid publisher ID is provided at build time:
 *
 *   VITE_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
 *   VITE_ADSENSE_SLOT_HOME=XXXXXXXXXX       (optional, per placement)
 *   VITE_ADSENSE_SLOT_ARTICLE=XXXXXXXXXX
 *
 * An individual placement renders only when its slot ID is also set.
 */
const env = import.meta.env ?? {};

const CLIENT_RE = /^ca-pub-\d{16}$/;
const SLOT_RE = /^\d{8,12}$/;

const client = (env.VITE_ADSENSE_CLIENT || '').trim();
const clientValid = CLIENT_RE.test(client);

const slot = (value) => {
  const v = (value || '').trim();
  return clientValid && SLOT_RE.test(v) ? v : '';
};

export const ADS = Object.freeze({
  enabled: clientValid,
  client: clientValid ? client : '',
  // "pub-XXXXXXXXXXXXXXXX", used for ads.txt.
  publisherId: clientValid ? client.replace(/^ca-/, '') : '',
  slots: Object.freeze({
    home: slot(env.VITE_ADSENSE_SLOT_HOME),
    article: slot(env.VITE_ADSENSE_SLOT_ARTICLE),
  }),
});

export const isValidAdClient = (v) => CLIENT_RE.test(v || '');
export const isValidAdSlot = (v) => SLOT_RE.test(v || '');
