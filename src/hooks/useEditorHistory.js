import { useMemo, useReducer } from 'react';
import { createHistory, historyReducer } from '../lib/history.js';

/** React binding for the editor history reducer with stable callbacks. */
export function useEditorHistory() {
  const [history, dispatch] = useReducer(historyReducer, undefined, () => createHistory());

  const actions = useMemo(
    () => ({
      update: (patch, key) => dispatch({ type: 'update', patch, key }),
      commit: () => dispatch({ type: 'commit' }),
      removeOp: (index) => dispatch({ type: 'removeOp', index }),
      reset: () => dispatch({ type: 'reset' }),
      undo: () => dispatch({ type: 'undo' }),
      redo: () => dispatch({ type: 'redo' }),
      clear: () => dispatch({ type: 'clear' }),
    }),
    [],
  );

  const canUndo = history.past.length > 0;
  const canRedo = history.future.length > 0;
  return { state: history.present, canUndo, canRedo, ...actions };
}
