/**
 * Color parsing, validation and conversion helpers.
 *
 * All RGB values are integers in 0–255. Functions never throw on bad input;
 * parsers return `null` when the input is invalid so the UI can show a message.
 */

const HEX_RE = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i;

/** True when `value` is a 3- or 6-digit hex color, with or without a leading "#". */
export function isValidHex(value) {
  return typeof value === 'string' && HEX_RE.test(value.trim());
}

/** Parses "#abc", "abc", "#aabbcc" or "aabbcc" into {r,g,b}, or null if invalid. */
export function hexToRgb(value) {
  if (!isValidHex(value)) return null;
  let hex = value.trim().replace(/^#/, '');
  if (hex.length === 3) hex = hex.split('').map((c) => c + c).join('');
  const n = parseInt(hex, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

/** True for an integer 0–255 (numbers or numeric strings such as "128"). */
export function isValidChannel(value) {
  if (typeof value === 'number') return Number.isInteger(value) && value >= 0 && value <= 255;
  if (typeof value !== 'string' || !/^\s*\d{1,3}\s*$/.test(value)) return false;
  const n = Number(value);
  return n >= 0 && n <= 255;
}

/** True when `rgb` is an object with three valid channels. */
export function isValidRgb(rgb) {
  return !!rgb && isValidChannel(rgb.r) && isValidChannel(rgb.g) && isValidChannel(rgb.b);
}

/**
 * Parses an "rgb(r, g, b)" or "r, g, b" / "r g b" string into {r,g,b}, or null.
 */
export function parseRgbString(value) {
  if (typeof value !== 'string') return null;
  const m = value
    .trim()
    .match(/^(?:rgb\(\s*)?(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*[,\s]\s*(\d{1,3})\s*\)?$/i);
  if (!m) return null;
  const rgb = { r: Number(m[1]), g: Number(m[2]), b: Number(m[3]) };
  return isValidRgb(rgb) ? rgb : null;
}

const toHexPair = (n) => n.toString(16).padStart(2, '0');

/** Converts {r,g,b} to a lowercase "#rrggbb" string. Channels are clamped and rounded. */
export function rgbToHex({ r, g, b }) {
  const c = (v) => Math.max(0, Math.min(255, Math.round(v)));
  return `#${toHexPair(c(r))}${toHexPair(c(g))}${toHexPair(c(b))}`;
}

/** Converts {r,g,b} to {h (0–360), s (0–100), l (0–100)}, rounded to integers. */
export function rgbToHsl({ r, g, b }) {
  const rn = r / 255;
  const gn = g / 255;
  const bn = b / 255;
  const max = Math.max(rn, gn, bn);
  const min = Math.min(rn, gn, bn);
  const l = (max + min) / 2;
  let h = 0;
  let s = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === rn) h = (gn - bn) / d + (gn < bn ? 6 : 0);
    else if (max === gn) h = (bn - rn) / d + 2;
    else h = (rn - gn) / d + 4;
    h *= 60;
  }
  return { h: Math.round(h) % 360, s: Math.round(s * 100), l: Math.round(l * 100) };
}

export const formatRgb = ({ r, g, b }) => `rgb(${r}, ${g}, ${b})`;
export const formatHsl = ({ h, s, l }) => `hsl(${h}, ${s}%, ${l}%)`;

export function rgbEquals(a, b) {
  return !!a && !!b && a.r === b.r && a.g === b.g && a.b === b.b;
}

/**
 * WCAG relative luminance, used to choose readable text on top of a swatch.
 */
export function relativeLuminance({ r, g, b }) {
  const lin = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
}

export function readableTextColor(rgb) {
  return relativeLuminance(rgb) > 0.4 ? '#111827' : '#ffffff';
}

/* ------------------------------------------------------------------------- */
/* CIELAB conversion                                                          */
/* ------------------------------------------------------------------------- */

// sRGB channel (0–255) -> linear light (0–1). Precomputed because the
// replacement loop calls this millions of times on large images.
const SRGB_TO_LINEAR = new Float64Array(256);
for (let i = 0; i < 256; i++) {
  const c = i / 255;
  SRGB_TO_LINEAR[i] = c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

// D65 reference white.
const XN = 0.95047;
const YN = 1.0;
const ZN = 1.08883;
const EPS = 216 / 24389; // (6/29)^3
const KAPPA = 24389 / 27; // (29/3)^3

const labF = (t) => (t > EPS ? Math.cbrt(t) : (KAPPA * t + 16) / 116);
const labFInv = (t) => {
  const t3 = t * t * t;
  return t3 > EPS ? t3 : (116 * t - 16) / KAPPA;
};

/**
 * Converts 8-bit sRGB to CIELAB (D65). Writes into `out` (length ≥ 3) to
 * avoid allocations in hot loops, and also returns it.
 * L is 0–100; a and b are roughly −128…127.
 */
export function rgbToLab(r, g, b, out = new Float64Array(3)) {
  const rl = SRGB_TO_LINEAR[r];
  const gl = SRGB_TO_LINEAR[g];
  const bl = SRGB_TO_LINEAR[b];
  const x = (0.4124564 * rl + 0.3575761 * gl + 0.1804375 * bl) / XN;
  const y = (0.2126729 * rl + 0.7151522 * gl + 0.072175 * bl) / YN;
  const z = (0.0193339 * rl + 0.119192 * gl + 0.9503041 * bl) / ZN;
  const fx = labF(x);
  const fy = labF(y);
  const fz = labF(z);
  out[0] = 116 * fy - 16;
  out[1] = 500 * (fx - fy);
  out[2] = 200 * (fy - fz);
  return out;
}

const linearToSrgb8 = (c) => {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055;
  return Math.max(0, Math.min(255, Math.round(v * 255)));
};

/** Converts CIELAB (D65) back to 8-bit sRGB, clamping out-of-gamut colors. */
export function labToRgb(L, a, b, out = new Uint8ClampedArray(3)) {
  const fy = (L + 16) / 116;
  const fx = fy + a / 500;
  const fz = fy - b / 200;
  const x = labFInv(fx) * XN;
  const y = (L > KAPPA * EPS ? fy * fy * fy : L / KAPPA) * YN;
  const z = labFInv(fz) * ZN;
  out[0] = linearToSrgb8(3.2404542 * x - 1.5371385 * y - 0.4985314 * z);
  out[1] = linearToSrgb8(-0.969266 * x + 1.8760108 * y + 0.041556 * z);
  out[2] = linearToSrgb8(0.0556434 * x - 0.2040259 * y + 1.0572252 * z);
  return out;
}

/**
 * Perceptual color difference ΔE*ab (CIE76): Euclidean distance in CIELAB.
 * A ΔE around 2.3 is a "just noticeable difference"; black vs. white is 100.
 */
export function deltaE76(lab1, lab2) {
  const dL = lab1[0] - lab2[0];
  const da = lab1[1] - lab2[1];
  const db = lab1[2] - lab2[2];
  return Math.sqrt(dL * dL + da * da + db * db);
}

/**
 * Plain Euclidean distance in RGB space, normalised to 0–100 so it can share
 * the same tolerance scale as ΔE (max RGB distance is 255·√3 ≈ 441.67).
 */
export const RGB_MAX_DISTANCE = Math.sqrt(3 * 255 * 255);
export function rgbDistance(r1, g1, b1, r2, g2, b2) {
  const dr = r1 - r2;
  const dg = g1 - g2;
  const db = b1 - b2;
  return (Math.sqrt(dr * dr + dg * dg + db * db) / RGB_MAX_DISTANCE) * 100;
}
