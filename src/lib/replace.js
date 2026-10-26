/**
 * Pixel-level color replacement on RGBA buffers (Canvas ImageData layout).
 *
 * HOW A PIXEL IS MATCHED
 * ----------------------
 * Every pixel's color is compared with the chosen source color using one of
 * two distance metrics, both expressed on a 0–100 scale:
 *
 *   - "lab" (default): ΔE*ab (CIE76), the Euclidean distance between the two
 *     colors in CIELAB space. CIELAB is designed so that equal distances look
 *     roughly equally different to the human eye, so a tolerance of 15 catches
 *     the light and dark shades of a red shirt without leaking into a nearby
 *     orange wall as easily as RGB distance does.
 *   - "rgb": Euclidean distance between the raw sRGB channel values, divided by
 *     the maximum possible distance (255·√3) and multiplied by 100. Simple and
 *     predictable, useful for flat graphics and logos.
 *
 * The pixel's weight (how strongly it is recolored) is then:
 *
 *   distance ≤ tolerance                   → weight 1 (fully replaced)
 *   tolerance < distance < tolerance+feather → smooth falloff from 1 to 0
 *   otherwise                              → weight 0 (pixel untouched)
 *
 * The falloff uses a smoothstep curve so anti-aliased edges blend instead of
 * showing a hard outline.
 *
 * HOW THE NEW COLOR IS COMPUTED
 * -----------------------------
 *   - preserveShading = true (default): the pixel is moved in CIELAB space by
 *     the offset between the source and target colors
 *     (Lab_new = Lab_pixel + (Lab_target − Lab_source)). Highlights, shadows
 *     and texture inside the selected area are kept.
 *   - preserveShading = false: matched pixels become exactly the target color,
 *     which suits flat-colored graphics.
 *
 * The result is blended with the original pixel by the weight. The alpha
 * channel is never modified, and fully transparent pixels are skipped because
 * their RGB values are not visible.
 *
 * Because each output color depends only on the input RGB value, a small
 * direct-mapped cache avoids recomputing CIELAB conversions for repeated
 * colors (very effective on graphics, harmless on photos).
 */
import { rgbToLab, labToRgb, rgbDistance } from './color.js';

export const DEFAULT_OPTIONS = Object.freeze({
  tolerance: 20,
  feather: 10,
  distance: 'lab',
  preserveShading: true,
});

const CACHE_BITS = 18;
const CACHE_SIZE = 1 << CACHE_BITS;
const CACHE_MASK = CACHE_SIZE - 1;
const UNCHANGED = -1;

const smoothstep = (t) => t * t * (3 - 2 * t);

/**
 * Returns the replacement weight (0–1) for a given distance.
 * Exported for testing and for the UI explanation.
 */
export function weightForDistance(distance, tolerance, feather) {
  if (distance <= tolerance) return 1;
  if (feather <= 0 || distance >= tolerance + feather) return 0;
  return 1 - smoothstep((distance - tolerance) / feather);
}

/**
 * Prepares a reusable color mapper for one replacement operation.
 * `map(r, g, b)` returns a packed 0xRRGGBB value, or -1 when the color is not
 * affected. `weight(r, g, b)` returns the 0–1 match weight.
 */
export function createColorMapper(op) {
  const tolerance = clampNumber(op.tolerance, 0, 100, DEFAULT_OPTIONS.tolerance);
  const feather = clampNumber(op.feather, 0, 100, DEFAULT_OPTIONS.feather);
  const useLab = (op.distance ?? DEFAULT_OPTIONS.distance) !== 'rgb';
  const preserveShading = op.preserveShading ?? DEFAULT_OPTIONS.preserveShading;
  const { source, target } = op;

  const srcLab = rgbToLab(source.r, source.g, source.b);
  const tgtLab = rgbToLab(target.r, target.g, target.b);
  const dL = tgtLab[0] - srcLab[0];
  const dA = tgtLab[1] - srcLab[1];
  const dB = tgtLab[2] - srcLab[2];

  const lab = new Float64Array(3);
  const rgbOut = new Uint8ClampedArray(3);

  const keys = new Int32Array(CACHE_SIZE).fill(-1);
  const values = new Int32Array(CACHE_SIZE);
  const weights = new Float32Array(CACHE_SIZE);

  function compute(r, g, b, slot, key) {
    let d;
    if (useLab) {
      rgbToLab(r, g, b, lab);
      const x = lab[0] - srcLab[0];
      const y = lab[1] - srcLab[1];
      const z = lab[2] - srcLab[2];
      d = Math.sqrt(x * x + y * y + z * z);
    } else {
      d = rgbDistance(r, g, b, source.r, source.g, source.b);
    }
    const w = weightForDistance(d, tolerance, feather);
    let packed = UNCHANGED;
    if (w > 0) {
      let nr;
      let ng;
      let nb;
      if (preserveShading) {
        if (!useLab) rgbToLab(r, g, b, lab);
        const L = Math.max(0, Math.min(100, lab[0] + dL));
        labToRgb(L, lab[1] + dA, lab[2] + dB, rgbOut);
        nr = rgbOut[0];
        ng = rgbOut[1];
        nb = rgbOut[2];
      } else {
        nr = target.r;
        ng = target.g;
        nb = target.b;
      }
      const or = Math.round(r + (nr - r) * w);
      const og = Math.round(g + (ng - g) * w);
      const ob = Math.round(b + (nb - b) * w);
      packed = (or << 16) | (og << 8) | ob;
    }
    keys[slot] = key;
    values[slot] = packed;
    weights[slot] = w;
  }

  function lookup(r, g, b) {
    const key = (r << 16) | (g << 8) | b;
    // Mix the bits so similar colors land in different cache slots.
    const slot = (Math.imul(key, 0x9e3779b1) >>> (32 - CACHE_BITS)) & CACHE_MASK;
    if (keys[slot] !== key) compute(r, g, b, slot, key);
    return slot;
  }

  return {
    map: (r, g, b) => values[lookup(r, g, b)],
    weight: (r, g, b) => weights[lookup(r, g, b)],
  };
}

/**
 * Applies one replacement to pixels [startPixel, endPixel) of `data` in place.
 * `mapper` comes from createColorMapper(). Returns the number of changed pixels.
 */
export function applyMapperRange(data, mapper, startPixel, endPixel) {
  let changed = 0;
  for (let p = startPixel; p < endPixel; p++) {
    const i = p * 4;
    if (data[i + 3] === 0) continue; // fully transparent: leave as-is
    const out = mapper.map(data[i], data[i + 1], data[i + 2]);
    if (out === UNCHANGED) continue;
    const nr = (out >> 16) & 255;
    const ng = (out >> 8) & 255;
    const nb = out & 255;
    if (nr !== data[i] || ng !== data[i + 1] || nb !== data[i + 2]) {
      data[i] = nr;
      data[i + 1] = ng;
      data[i + 2] = nb;
      changed++;
    }
  }
  return changed;
}

/**
 * Synchronous convenience wrapper: returns a NEW Uint8ClampedArray with the
 * replacement applied. The input buffer is never modified.
 */
export function replaceColor(data, op) {
  const out = new Uint8ClampedArray(data);
  applyMapperRange(out, createColorMapper(op), 0, out.length / 4);
  return out;
}

/**
 * Writes an "affected area" visualisation for [start, end) pixels:
 * matched pixels are tinted magenta proportionally to their weight and the
 * rest of the image is shown in dimmed grayscale. Alpha is preserved.
 */
export function applyMaskRange(data, mapper, startPixel, endPixel) {
  for (let p = startPixel; p < endPixel; p++) {
    const i = p * 4;
    if (data[i + 3] === 0) continue;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const w = mapper.weight(r, g, b);
    const gray = Math.round((0.299 * r + 0.587 * g + 0.114 * b) * 0.55 + 40);
    data[i] = Math.round(gray + (255 - gray) * w);
    data[i + 1] = Math.round(gray * (1 - w));
    data[i + 2] = Math.round(gray + (220 - gray) * w);
  }
}

/** Maps a single color through a sequence of operations (used for sampling). */
export function mapColorThroughOps(rgb, ops) {
  let { r, g, b } = rgb;
  for (const op of ops) {
    const out = createColorMapper(op).map(r, g, b);
    if (out !== UNCHANGED) {
      r = (out >> 16) & 255;
      g = (out >> 8) & 255;
      b = out & 255;
    }
  }
  return { r, g, b };
}

function clampNumber(value, min, max, fallback) {
  const n = Number(value);
  if (!Number.isFinite(n)) return fallback;
  return Math.max(min, Math.min(max, n));
}
