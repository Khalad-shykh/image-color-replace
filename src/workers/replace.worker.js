/**
 * Web Worker that keeps the original pixels and renders replacement
 * operations off the main thread, so the page stays responsive on large images.
 *
 * Messages in:
 *   { type: 'load', id, width, height, buffer }   (buffer is transferred)
 *   { type: 'render', id, ops, mask }
 * Messages out:
 *   { type: 'loaded', id }
 *   { type: 'progress', id, value }               (0–1)
 *   { type: 'result', id, buffer }                (buffer is transferred)
 *   { type: 'error', id, message }
 */
import { createRenderer, CancelledError } from '../lib/pipeline.js';

let renderer = null;
let latestId = 0;

self.onmessage = async (event) => {
  const msg = event.data;
  if (msg.type === 'load') {
    latestId = msg.id;
    renderer = createRenderer(new Uint8ClampedArray(msg.buffer));
    self.postMessage({ type: 'loaded', id: msg.id });
    return;
  }
  if (msg.type !== 'render') return;
  latestId = msg.id;
  if (!renderer) {
    self.postMessage({ type: 'error', id: msg.id, message: 'No image loaded' });
    return;
  }
  let lastReport = 0;
  try {
    const data = await renderer.render(
      { ops: msg.ops, mask: msg.mask },
      {
        isCancelled: () => latestId !== msg.id,
        onProgress: (value) => {
          const now = Date.now();
          if (now - lastReport > 80) {
            lastReport = now;
            self.postMessage({ type: 'progress', id: msg.id, value });
          }
        },
      },
    );
    self.postMessage({ type: 'result', id: msg.id, buffer: data.buffer }, [data.buffer]);
  } catch (err) {
    if (err instanceof CancelledError) return;
    self.postMessage({ type: 'error', id: msg.id, message: err?.message || 'Processing failed' });
  }
};
