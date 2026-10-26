import { useCallback, useEffect, useRef, useState } from 'react';
import { createProcessor } from '../lib/processor.js';

const BUSY_DELAY_MS = 120;

/**
 * Renders `ops` on top of `original` (an ImageData) in a Web Worker.
 *
 * Returns the latest edited ImageData plus busy/progress/error state.
 * Requests are superseded by newer ones, so dragging a slider never queues
 * up stale work. `getFinalImage()` resolves to the exact (non-mask) result
 * for export.
 */
export function useImageProcessor(original, ops, { mask = false } = {}) {
  const procRef = useRef(null);
  const requestRef = useRef(0);
  const [ready, setReady] = useState(false);
  const [refresh, setRefresh] = useState(0);
  const [state, setState] = useState({ result: original, resultOps: [], resultMask: false, busy: false, progress: 0, error: '' });

  useEffect(() => {
    if (!original) return undefined;
    const proc = createProcessor();
    procRef.current = proc;
    let alive = true;
    setReady(false);
    setState({ result: original, resultOps: [], resultMask: false, busy: false, progress: 0, error: '' });
    proc
      .load(original.data, original.width, original.height)
      .then((ok) => alive && ok && setReady(true))
      .catch(() => alive && setState((s) => ({ ...s, error: 'The image processor could not start in this browser.' })));
    return () => {
      alive = false;
      requestRef.current++;
      proc.dispose();
      if (procRef.current === proc) procRef.current = null;
    };
  }, [original]);

  useEffect(() => {
    const proc = procRef.current;
    if (!ready || !proc || !original) return undefined;
    const request = ++requestRef.current;
    if (ops.length === 0) {
      setState({ result: original, resultOps: ops, resultMask: false, busy: false, progress: 1, error: '' });
      return undefined;
    }
    const busyTimer = setTimeout(() => {
      if (request === requestRef.current) setState((s) => ({ ...s, busy: true, progress: 0 }));
    }, BUSY_DELAY_MS);
    proc
      .render(ops, {
        mask,
        onProgress: (progress) => {
          if (request === requestRef.current) setState((s) => (s.busy ? { ...s, progress } : s));
        },
      })
      .then((data) => {
        if (!data || request !== requestRef.current) return;
        const result = new ImageData(data, original.width, original.height);
        setState({ result, resultOps: ops, resultMask: mask, busy: false, progress: 1, error: '' });
      })
      .catch((err) => {
        if (request !== requestRef.current) return;
        setState((s) => ({ ...s, busy: false, error: err?.message || 'Processing failed.' }));
      })
      .finally(() => clearTimeout(busyTimer));
    return () => clearTimeout(busyTimer);
  }, [ready, original, ops, mask, refresh]);

  const getFinalImage = useCallback(async () => {
    if (state.resultOps === ops && !state.resultMask && !state.busy && state.result) return state.result;
    if (ops.length === 0) return original;
    const proc = procRef.current;
    if (!proc) throw new Error('The image processor is not ready.');
    const data = await proc.render(ops, { mask: false });
    // The export request superseded any preview render; schedule a new one.
    setRefresh((n) => n + 1);
    if (!data) throw new Error('The export was interrupted. Please try again.');
    return new ImageData(data, original.width, original.height);
  }, [state, ops, original]);

  const isCurrent = state.resultOps === ops && state.resultMask === mask;
  return { ...state, ready, isCurrent, getFinalImage };
}
