import { describe, it, expect, vi, afterEach } from 'vitest';
import { buildFileName, hasTransparency, exportImage, canvasToBlob, downloadBlob, EXPORT_FORMATS } from './exportImage.js';

afterEach(() => vi.restoreAllMocks());

describe('export helpers', () => {
  it('builds safe file names with the right extension', () => {
    expect(buildFileName('My Photo', 'png')).toBe('my-photo.png');
    expect(buildFileName('photo.png', 'jpeg')).toBe('photo.jpg');
    expect(buildFileName('photo.JPEG', 'webp')).toBe('photo.webp');
    expect(buildFileName('../../x', 'png')).toBe('x.png');
    expect(buildFileName('', 'png')).toBe('recolored-image.png');
    expect(buildFileName('a', 'unknown')).toBe('a.png');
  });
  it('detects transparency', () => {
    expect(hasTransparency(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 255]))).toBe(false);
    expect(hasTransparency(new Uint8ClampedArray([1, 2, 3, 255, 4, 5, 6, 254]))).toBe(true);
  });
  it('only JPEG lacks alpha support', () => {
    expect(EXPORT_FORMATS.png.alpha && EXPORT_FORMATS.webp.alpha && !EXPORT_FORMATS.jpeg.alpha).toBe(true);
  });
  it('canvasToBlob rejects when the browser falls back to another format', async () => {
    const canvas = { toBlob: (cb) => cb(new Blob(['x'], { type: 'image/png' })) };
    await expect(canvasToBlob(canvas, 'image/webp')).rejects.toThrow(/cannot save WEBP/);
    const nullCanvas = { toBlob: (cb) => cb(null) };
    await expect(canvasToBlob(nullCanvas, 'image/png')).rejects.toThrow(/could not encode/);
  });
  it('downloadBlob clicks a temporary link and revokes the object URL', () => {
    vi.useFakeTimers();
    URL.createObjectURL = vi.fn(() => 'blob:test');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    downloadBlob(new Blob(['x']), 'out.png');
    expect(click).toHaveBeenCalledOnce();
    expect(document.querySelector('a[download]')).toBeNull();
    vi.runAllTimers();
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:test');
    vi.useRealTimers();
  });
  it('exportImage encodes with the chosen format and quality and flattens JPEG onto the background', async () => {
    const calls = [];
    const ctx = {
      putImageData: vi.fn(),
      fillRect: vi.fn(function () { calls.push(['fill', this.fillStyle]); }),
      drawImage: vi.fn(),
    };
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(ctx);
    const toBlob = vi.spyOn(HTMLCanvasElement.prototype, 'toBlob').mockImplementation(function (cb, type, quality) {
      calls.push(['toBlob', type, quality, this.width, this.height]);
      cb(new Blob(['x'], { type }));
    });
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => {});
    const imageData = { width: 30, height: 20, data: new Uint8ClampedArray(30 * 20 * 4) };

    await exportImage(imageData, { formatId: 'jpeg', quality: 0.8, filename: 'Out', background: '#123456' });
    expect(calls).toContainEqual(['fill', '#123456']);
    expect(calls).toContainEqual(['toBlob', 'image/jpeg', 0.8, 30, 20]);

    calls.length = 0;
    await exportImage(imageData, { formatId: 'png', filename: 'Out' });
    expect(calls).toEqual([['toBlob', 'image/png', undefined, 30, 20]]);
    expect(ctx.putImageData).toHaveBeenCalledWith(imageData, 0, 0);
    expect(toBlob).toHaveBeenCalledTimes(2);
  });
});
