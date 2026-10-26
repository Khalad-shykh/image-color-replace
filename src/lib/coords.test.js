import { describe, it, expect } from 'vitest';
import { clientToImage, pixelAt, fitScale, nextZoom } from './coords.js';

describe('pointer to image coordinates', () => {
  const rect = { left: 100, top: 50, width: 400, height: 200 }; // 2000x1000 image shown at 20%
  it('maps scaled display coordinates to image pixels', () => {
    expect(clientToImage(100, 50, rect, 2000, 1000)).toEqual({ x: 0, y: 0 });
    expect(clientToImage(300, 150, rect, 2000, 1000)).toEqual({ x: 1000, y: 500 });
    expect(clientToImage(499.99, 249.99, rect, 2000, 1000)).toEqual({ x: 1999, y: 999 });
  });
  it('works when the image is enlarged (zoomed in)', () => {
    const big = { left: 0, top: 0, width: 800, height: 800 }; // 4x4 image at 200x
    expect(clientToImage(250, 799, big, 4, 4)).toEqual({ x: 1, y: 3 });
  });
  it('returns null outside the image or for empty rects', () => {
    expect(clientToImage(99, 60, rect, 2000, 1000)).toBeNull();
    expect(clientToImage(500, 60, rect, 2000, 1000)).toBeNull();
    expect(clientToImage(1, 1, { left: 0, top: 0, width: 0, height: 0 }, 10, 10)).toBeNull();
  });
  it('reads pixels', () => {
    const img = { width: 2, height: 1, data: new Uint8ClampedArray([1, 2, 3, 4, 5, 6, 7, 8]) };
    expect(pixelAt(img, 1, 0)).toEqual({ r: 5, g: 6, b: 7, a: 8 });
  });
  it('computes fit scale and zoom steps', () => {
    expect(fitScale(2000, 1000, 500, 500)).toBe(0.25);
    expect(fitScale(10, 10, 500, 500, 4)).toBe(4);
    expect(nextZoom(1, 1)).toBe(1.5);
    expect(nextZoom(0.3, -1)).toBe(0.25);
    expect(nextZoom(8, 1)).toBe(8);
  });
});
