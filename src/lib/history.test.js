import { describe, it, expect } from 'vitest';
import { createHistory, historyReducer, visibleOps, activeOp, HISTORY_LIMIT } from './history.js';

const RED = { r: 255, g: 0, b: 0 };
const GREEN = { r: 0, g: 255, b: 0 };
let t = 0;
const run = (h, ...actions) => actions.reduce((acc, a) => historyReducer(acc, { now: (t += 5000), ...a }), h);

describe('editor history', () => {
  it('selecting a source color creates an active op; commit keeps it', () => {
    let h = run(createHistory(), { type: 'update', patch: { source: RED } });
    expect(activeOp(h.present).source).toEqual(RED);
    expect(visibleOps(h.present)).toHaveLength(1);
    h = run(h, { type: 'commit' });
    expect(h.present.source).toBeNull();
    expect(h.present.ops).toHaveLength(1);
    expect(visibleOps(h.present)).toHaveLength(1);
  });

  it('undo and redo walk through states; a new change clears redo', () => {
    let h = run(createHistory(), { type: 'update', patch: { source: RED } }, { type: 'update', patch: { tolerance: 40 } });
    h = run(h, { type: 'undo' });
    expect(h.present.tolerance).toBe(20);
    h = run(h, { type: 'undo' });
    expect(h.present.source).toBeNull();
    expect(run(h, { type: 'undo' })).toBe(h);
    h = run(h, { type: 'redo' }, { type: 'redo' });
    expect(h.present.tolerance).toBe(40);
    h = run(h, { type: 'undo' }, { type: 'update', patch: { target: GREEN } });
    expect(h.future).toHaveLength(0);
  });

  it('coalesces rapid slider changes into one undo step', () => {
    let h = createHistory();
    for (let i = 21; i <= 30; i++) h = historyReducer(h, { type: 'update', patch: { tolerance: i }, key: 'tolerance', now: 1000 + i });
    expect(h.past).toHaveLength(1);
    h = historyReducer(h, { type: 'undo' });
    expect(h.present.tolerance).toBe(20);
  });

  it('reset clears edits but keeps settings, and can be undone', () => {
    let h = run(createHistory(), { type: 'update', patch: { source: RED, target: GREEN, tolerance: 33 } }, { type: 'commit' });
    h = run(h, { type: 'reset' });
    expect(h.present.ops).toEqual([]);
    expect(h.present.source).toBeNull();
    expect(h.present.tolerance).toBe(33);
    expect(h.present.target).toEqual(GREEN);
    h = run(h, { type: 'undo' });
    expect(h.present.ops).toHaveLength(1);
  });

  it('removes a single kept replacement and caps history length', () => {
    let h = run(createHistory(), { type: 'update', patch: { source: RED } }, { type: 'commit' }, { type: 'update', patch: { source: GREEN } }, { type: 'commit' });
    h = run(h, { type: 'removeOp', index: 0 });
    expect(h.present.ops.map((o) => o.source)).toEqual([GREEN]);
    for (let i = 0; i < HISTORY_LIMIT + 20; i++) h = run(h, { type: 'update', patch: { feather: i % 50 } });
    expect(h.past.length).toBe(HISTORY_LIMIT);
  });
});
