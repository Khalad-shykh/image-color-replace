/**
 * Renders a list of replacement operations on top of the untouched original
 * pixels. Shared by the Web Worker and the main-thread fallback.
 *
 * Work is split into chunks so that a newer request can cancel an older one
 * and progress can be reported while large images are processed.
 */
import { createColorMapper, applyMapperRange, applyMaskRange } from './replace.js';

export const CHUNK_PIXELS = 262144; // ~0.25 MP per slice

export class CancelledError extends Error {
  constructor() {
    super('Render cancelled');
    this.name = 'CancelledError';
  }
}

/** Stable key for a list of operations (used to cache intermediate results). */
export function opsKey(ops) {
  return JSON.stringify(
    ops.map((o) => [
      o.source.r, o.source.g, o.source.b,
      o.target.r, o.target.g, o.target.b,
      o.tolerance, o.feather, o.distance, o.preserveShading,
    ]),
  );
}

/**
 * Creates a renderer bound to one original image.
 *
 * render({ ops, mask }) resolves to a new Uint8ClampedArray:
 *   - every op in `ops` is applied in order, each one matching against the
 *     output of the previous op;
 *   - when `mask` is true, the last op is visualised as an affected-area mask
 *     instead of being applied.
 * The result of all-but-the-last op is cached, so dragging the tolerance
 * slider for the current color does not recompute earlier replacements.
 */
export function createRenderer(original, { yieldFn = defaultYield } = {}) {
  const totalPixels = original.length / 4;
  let baseCache = { key: opsKey([]), data: original };

  async function applyOps(input, ops, { isCancelled, onProgress, progressOffset, progressScale }) {
    const data = new Uint8ClampedArray(input);
    for (let k = 0; k < ops.length; k++) {
      const mapper = createColorMapper(ops[k]);
      for (let start = 0; start < totalPixels; start += CHUNK_PIXELS) {
        const end = Math.min(totalPixels, start + CHUNK_PIXELS);
        applyMapperRange(data, mapper, start, end);
        onProgress?.(progressOffset + progressScale * ((k + end / totalPixels) / ops.length));
        await yieldFn();
        if (isCancelled()) throw new CancelledError();
      }
    }
    return data;
  }

  async function render({ ops, mask = false }, { isCancelled = () => false, onProgress } = {}) {
    if (ops.length === 0) return new Uint8ClampedArray(original);
    const prefix = ops.slice(0, -1);
    const last = ops[ops.length - 1];
    const prefixKey = opsKey(prefix);

    if (baseCache.key !== prefixKey) {
      const share = prefix.length / ops.length;
      const data = await applyOps(original, prefix, {
        isCancelled, onProgress, progressOffset: 0, progressScale: share,
      });
      baseCache = { key: prefixKey, data };
    }
    const base = baseCache.data;
    const offset = prefix.length / ops.length;

    if (!mask) {
      return applyOps(base, [last], {
        isCancelled, onProgress, progressOffset: offset, progressScale: 1 - offset,
      });
    }

    const data = new Uint8ClampedArray(base);
    const mapper = createColorMapper(last);
    for (let start = 0; start < totalPixels; start += CHUNK_PIXELS) {
      const end = Math.min(totalPixels, start + CHUNK_PIXELS);
      applyMaskRange(data, mapper, start, end);
      onProgress?.(offset + (1 - offset) * (end / totalPixels));
      await yieldFn();
      if (isCancelled()) throw new CancelledError();
    }
    return data;
  }

  return { render };
}

function defaultYield() {
  return new Promise((resolve) => setTimeout(resolve, 0));
}
