/**
 * Main-thread client for the replacement worker. Falls back to chunked
 * processing on the main thread when Web Workers are unavailable.
 *
 * Only the newest render request ever resolves; older ones are superseded
 * and resolve to `null` so callers can ignore them.
 */
import { createRenderer, CancelledError } from './pipeline.js';

export function createProcessor() {
  let worker = null;
  try {
    if (typeof Worker !== 'undefined') {
      worker = new Worker(new URL('../workers/replace.worker.js', import.meta.url), {
        type: 'module',
      });
    }
  } catch {
    worker = null;
  }
  return worker ? workerProcessor(worker) : fallbackProcessor();
}

function workerProcessor(worker) {
  let nextId = 1;
  const pending = new Map();

  worker.onmessage = (event) => {
    const msg = event.data;
    const entry = pending.get(msg.id);
    if (!entry) return;
    if (msg.type === 'progress') {
      entry.onProgress?.(msg.value);
      return;
    }
    pending.delete(msg.id);
    if (msg.type === 'loaded') entry.resolve(true);
    else if (msg.type === 'result') entry.resolve(new Uint8ClampedArray(msg.buffer));
    else entry.reject(new Error(msg.message));
  };
  worker.onerror = (event) => {
    const error = new Error(event.message || 'Image worker failed');
    for (const entry of pending.values()) entry.reject(error);
    pending.clear();
  };

  // Resolve superseded requests with null so callers never wait forever.
  const supersede = () => {
    for (const entry of pending.values()) entry.resolve(null);
    pending.clear();
  };

  return {
    usesWorker: true,
    load(pixels, width, height) {
      supersede();
      const id = nextId++;
      const copy = new Uint8ClampedArray(pixels);
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject });
        worker.postMessage({ type: 'load', id, width, height, buffer: copy.buffer }, [copy.buffer]);
      });
    },
    render(ops, { mask = false, onProgress } = {}) {
      supersede();
      const id = nextId++;
      return new Promise((resolve, reject) => {
        pending.set(id, { resolve, reject, onProgress });
        worker.postMessage({ type: 'render', id, ops, mask });
      });
    },
    dispose() {
      supersede();
      worker.terminate();
    },
  };
}

function fallbackProcessor() {
  let renderer = null;
  let latest = 0;
  return {
    usesWorker: false,
    async load(pixels) {
      latest++;
      renderer = createRenderer(new Uint8ClampedArray(pixels));
      return true;
    },
    async render(ops, { mask = false, onProgress } = {}) {
      const id = ++latest;
      if (!renderer) throw new Error('No image loaded');
      try {
        return await renderer.render({ ops, mask }, { isCancelled: () => latest !== id, onProgress });
      } catch (err) {
        if (err instanceof CancelledError) return null;
        throw err;
      }
    },
    dispose() {
      latest++;
      renderer = null;
    },
  };
}
