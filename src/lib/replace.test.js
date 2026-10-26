import { describe, it, expect } from 'vitest';
import { replaceColor, weightForDistance, createColorMapper, mapColorThroughOps, applyMaskRange } from './replace.js';
import { createRenderer } from './pipeline.js';

const RED = { r: 220, g: 30, b: 30 };
const BLUE = { r: 30, g: 60, b: 220 };
const px = (...colors) => new Uint8ClampedArray(colors.flat());
const at = (data, i) => Array.from(data.slice(i * 4, i * 4 + 4));
const op = (extra = {}) => ({ source: RED, target: BLUE, tolerance: 10, feather: 0, distance: 'lab', preserveShading: false, ...extra });

describe('weightForDistance (tolerance + feather)', () => {
  it('is 1 inside tolerance, 0 beyond tolerance+feather, smooth in between', () => {
    expect(weightForDistance(0, 10, 0)).toBe(1);
    expect(weightForDistance(10, 10, 0)).toBe(1);
    expect(weightForDistance(10.01, 10, 0)).toBe(0);
    expect(weightForDistance(15, 10, 10)).toBeCloseTo(0.5, 5);
    expect(weightForDistance(20, 10, 10)).toBe(0);
    const a = weightForDistance(12, 10, 10);
    const b = weightForDistance(18, 10, 10);
    expect(a).toBeGreaterThan(b);
    expect(a).toBeLessThan(1);
    expect(b).toBeGreaterThan(0);
  });
  it('tolerance 0 matches only the exact color', () => {
    const m = createColorMapper(op({ tolerance: 0 }));
    expect(m.weight(220, 30, 30)).toBe(1);
    expect(m.weight(221, 30, 30)).toBe(0);
  });
  it('higher tolerance includes more distant shades (lab and rgb)', () => {
    for (const distance of ['lab', 'rgb']) {
      const near = { r: 200, g: 40, b: 40 };
      expect(createColorMapper(op({ distance, tolerance: 2 })).weight(near.r, near.g, near.b)).toBe(0);
      expect(createColorMapper(op({ distance, tolerance: 30 })).weight(near.r, near.g, near.b)).toBe(1);
    }
  });
});

describe('replaceColor', () => {
  it('replaces matching pixels with the exact target in flat mode', () => {
    const src = px([220, 30, 30, 255], [0, 200, 0, 255]);
    const out = replaceColor(src, op());
    expect(at(out, 0)).toEqual([30, 60, 220, 255]);
  });

  it('leaves unrelated pixels untouched', () => {
    const src = px([220, 30, 30, 255], [0, 200, 0, 255], [250, 250, 250, 255], [230, 120, 20, 255]);
    const out = replaceColor(src, op({ tolerance: 15, feather: 5 }));
    expect(at(out, 1)).toEqual([0, 200, 0, 255]);
    expect(at(out, 2)).toEqual([250, 250, 250, 255]);
    expect(at(out, 3)).toEqual([230, 120, 20, 255]); // orange is far from red in Lab
  });

  it('preserves the alpha channel and skips fully transparent pixels', () => {
    const src = px([220, 30, 30, 128], [220, 30, 30, 0], [220, 30, 30, 1]);
    const out = replaceColor(src, op());
    expect(at(out, 0)).toEqual([30, 60, 220, 128]);
    expect(at(out, 1)).toEqual([220, 30, 30, 0]);
    expect(at(out, 2)).toEqual([30, 60, 220, 1]);
    for (let i = 3; i < out.length; i += 4) expect(out[i]).toBe(src[i]);
  });

  it('does not modify the input buffer', () => {
    const src = px([220, 30, 30, 255]);
    const copy = new Uint8ClampedArray(src);
    replaceColor(src, op());
    expect(src).toEqual(copy);
  });

  it('preserves shading: darker source shades stay darker after replacement', () => {
    const light = [235, 60, 60, 255];
    const dark = [140, 15, 15, 255];
    const out = replaceColor(px(light, dark), op({ tolerance: 40, preserveShading: true }));
    const [lr, lg, lb] = at(out, 0);
    const [dr, dg, db] = at(out, 1);
    expect(lb).toBeGreaterThan(lr); // now bluish
    expect(db).toBeGreaterThan(dr);
    expect(lr + lg + lb).toBeGreaterThan(dr + dg + db); // relative lightness kept
  });

  it('feathering blends pixels in the falloff band partially', () => {
    const edge = { r: 200, g: 45, b: 45 };
    const m = createColorMapper(op({ tolerance: 3 }));
    expect(m.weight(edge.r, edge.g, edge.b)).toBe(0);
    const w = createColorMapper(op({ tolerance: 3, feather: 30 })).weight(edge.r, edge.g, edge.b);
    expect(w).toBeGreaterThan(0);
    expect(w).toBeLessThan(1);
    const out = replaceColor(px([edge.r, edge.g, edge.b, 255]), op({ tolerance: 3, feather: 30 }));
    const [r, , b] = at(out, 0);
    expect(r).toBeLessThan(200);
    expect(r).toBeGreaterThan(30);
    expect(b).toBeGreaterThan(45);
    expect(b).toBeLessThan(220);
  });

  it('mask mode tints affected pixels and keeps alpha', () => {
    const data = px([220, 30, 30, 200], [0, 200, 0, 255]);
    applyMaskRange(data, createColorMapper(op()), 0, 2);
    expect(at(data, 0)).toEqual([255, 0, 220, 200]);
    expect(data[4]).toBe(data[6]); // unaffected pixel becomes neutral gray
    expect(data[7]).toBe(255);
  });
});

describe('sequential operations and rendering from the original', () => {
  const GREEN = { r: 20, g: 180, b: 40 };
  it('maps a sampled color through committed operations', () => {
    expect(mapColorThroughOps(RED, [op()])).toEqual(BLUE);
    expect(mapColorThroughOps(RED, [op(), op({ source: BLUE, target: GREEN })])).toEqual(GREEN);
    expect(mapColorThroughOps({ r: 0, g: 0, b: 0 }, [op()])).toEqual({ r: 0, g: 0, b: 0 });
  });

  it('renderer applies ops in order, keeps original intact, and supports re-rendering', async () => {
    const original = px([220, 30, 30, 255], [0, 0, 0, 255]);
    const snapshot = new Uint8ClampedArray(original);
    const r = createRenderer(original, { yieldFn: async () => {} });

    const one = await r.render({ ops: [op()] });
    expect(at(one, 0)).toEqual([30, 60, 220, 255]);
    const two = await r.render({ ops: [op(), op({ source: BLUE, target: GREEN })] });
    expect(at(two, 0)).toEqual([20, 180, 40, 255]);
    // "Undo": fewer ops gives the earlier result again.
    const back = await r.render({ ops: [op()] });
    expect(at(back, 0)).toEqual([30, 60, 220, 255]);
    const none = await r.render({ ops: [] });
    expect(none).toEqual(snapshot);
    expect(original).toEqual(snapshot);
  });

  it('renderer can be cancelled and reports progress', async () => {
    const original = new Uint8ClampedArray(4 * 300000).fill(255);
    const r = createRenderer(original, { yieldFn: async () => {} });
    const progress = [];
    await r.render({ ops: [op()] }, { onProgress: (v) => progress.push(v) });
    expect(progress.at(-1)).toBeCloseTo(1, 5);
    let calls = 0;
    await expect(r.render({ ops: [op()] }, { isCancelled: () => ++calls > 0 })).rejects.toThrow('cancelled');
  });
});
