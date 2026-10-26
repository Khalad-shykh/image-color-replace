/**
 * Undo/redo history for the editor's settings.
 *
 * The history stores small state objects (colors, tolerance, the list of
 * applied replacements) rather than pixel snapshots. Pixels are always
 * re-rendered from the untouched original, so undo never loses image data
 * and memory use stays constant regardless of how many steps are recorded.
 */
import { DEFAULT_OPTIONS } from './replace.js';

export const HISTORY_LIMIT = 100;
export const COALESCE_MS = 1000;

export const INITIAL_EDITOR_STATE = Object.freeze({
  ops: [],
  source: null,
  pickPoint: null,
  target: { r: 37, g: 99, b: 235 },
  ...DEFAULT_OPTIONS,
});

export function createHistory(present = INITIAL_EDITOR_STATE) {
  return { past: [], present, future: [], lastKey: null, lastTime: 0 };
}

/** The replacement currently being edited, or null when no source is picked. */
export function activeOp(state) {
  if (!state.source) return null;
  const { source, target, tolerance, feather, distance, preserveShading } = state;
  return { source, target, tolerance, feather, distance, preserveShading };
}

/** All operations that make up the visible result. */
export function visibleOps(state) {
  const op = activeOp(state);
  return op ? [...state.ops, op] : state.ops;
}

function push(history, present, key, now) {
  // Rapid changes of the same control (e.g. dragging a slider) are merged
  // into a single undo step.
  const coalesce =
    key && history.lastKey === key && now - history.lastTime < COALESCE_MS && history.past.length > 0;
  const past = coalesce ? history.past : [...history.past, history.present].slice(-HISTORY_LIMIT);
  return { past, present, future: [], lastKey: key ?? null, lastTime: now };
}

export function historyReducer(history, action) {
  const now = action.now ?? Date.now();
  switch (action.type) {
    case 'update': {
      const present = { ...history.present, ...action.patch };
      return push(history, present, action.key, now);
    }
    case 'commit': {
      const op = activeOp(history.present);
      if (!op) return history;
      const present = { ...history.present, ops: [...history.present.ops, op], source: null, pickPoint: null };
      return push(history, present, null, now);
    }
    case 'removeOp': {
      const ops = history.present.ops.filter((_, i) => i !== action.index);
      return push(history, { ...history.present, ops }, null, now);
    }
    case 'reset': {
      // Keep the chosen replacement color and options; clear all edits.
      const { target, tolerance, feather, distance, preserveShading } = history.present;
      const present = { ...INITIAL_EDITOR_STATE, target, tolerance, feather, distance, preserveShading };
      return push(history, present, null, now);
    }
    case 'undo': {
      if (history.past.length === 0) return history;
      const previous = history.past[history.past.length - 1];
      return {
        past: history.past.slice(0, -1),
        present: previous,
        future: [history.present, ...history.future],
        lastKey: null,
        lastTime: 0,
      };
    }
    case 'redo': {
      if (history.future.length === 0) return history;
      const [next, ...rest] = history.future;
      return {
        past: [...history.past, history.present],
        present: next,
        future: rest,
        lastKey: null,
        lastTime: 0,
      };
    }
    case 'clear':
      return createHistory(action.present ?? INITIAL_EDITOR_STATE);
    default:
      return history;
  }
}
