import { describe, it, expect } from 'vitest';
import zlib from 'node:zlib';
import {
  detectImageType, readImageDimensions, validateImageFile, fitWithinPixels, safeBaseName, sanitizeFileStem, LIMITS,
} from './imageFile.js';

function png(width, height) {
  const ihdr = Buffer.alloc(25);
  ihdr.writeUInt32BE(13, 0);
  ihdr.write('IHDR', 4);
  ihdr.writeUInt32BE(width, 8);
  ihdr.writeUInt32BE(height, 12);
  ihdr[16] = 8; ihdr[17] = 6;
  return new Uint8Array(Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), ihdr, Buffer.from(zlib.deflateSync(Buffer.alloc(4))),
  ]));
}
function jpeg(width, height, exifBytes = 0) {
  const parts = [0xff, 0xd8];
  if (exifBytes) {
    const len = exifBytes + 2;
    parts.push(0xff, 0xe1, len >> 8, len & 255, ...new Array(exifBytes).fill(0));
  }
  parts.push(0xff, 0xc0, 0x00, 0x11, 0x08, height >> 8, height & 255, width >> 8, width & 255, 3, 1, 0x22, 0, 2, 0x11, 1, 3, 0x11, 1);
  parts.push(0xff, 0xd9);
  return new Uint8Array(parts);
}
function webp(kind, width, height) {
  const b = new Uint8Array(40);
  b.set([...'RIFF'].map((c) => c.charCodeAt(0)), 0);
  b.set([...'WEBP'].map((c) => c.charCodeAt(0)), 8);
  b.set([...kind].map((c) => c.charCodeAt(0)), 12);
  if (kind === 'VP8X') {
    const w = width - 1, h = height - 1;
    b.set([w & 255, (w >> 8) & 255, (w >> 16) & 255, h & 255, (h >> 8) & 255, (h >> 16) & 255], 24);
  } else if (kind === 'VP8 ') {
    b.set([0x9d, 0x01, 0x2a, width & 255, width >> 8, height & 255, height >> 8], 23);
  } else {
    b[20] = 0x2f;
    const bits = (width - 1) | ((height - 1) << 14);
    b.set([bits & 255, (bits >> 8) & 255, (bits >> 16) & 255, (bits >>> 24) & 255], 21);
  }
  return b;
}
const file = (bytes, name = 'x.png', type = 'image/png') => new File([bytes], name, { type });

describe('format detection and header parsing', () => {
  it('detects formats by magic bytes, ignoring the name', () => {
    expect(detectImageType(png(1, 1))).toBe('image/png');
    expect(detectImageType(jpeg(1, 1))).toBe('image/jpeg');
    expect(detectImageType(webp('VP8X', 1, 1))).toBe('image/webp');
    expect(detectImageType(new TextEncoder().encode('GIF89a.....'))).toBeNull();
    expect(detectImageType(new Uint8Array([]))).toBeNull();
  });
  it('reads dimensions for PNG, JPEG (incl. large metadata) and all WebP variants', () => {
    expect(readImageDimensions(png(640, 480), 'image/png')).toEqual({ width: 640, height: 480 });
    expect(readImageDimensions(jpeg(1920, 1080), 'image/jpeg')).toEqual({ width: 1920, height: 1080 });
    expect(readImageDimensions(jpeg(300, 200, 5000), 'image/jpeg')).toEqual({ width: 300, height: 200 });
    expect(readImageDimensions(webp('VP8X', 4000, 3000), 'image/webp')).toEqual({ width: 4000, height: 3000 });
    expect(readImageDimensions(webp('VP8 ', 800, 600), 'image/webp')).toEqual({ width: 800, height: 600 });
    expect(readImageDimensions(webp('VP8L', 1000, 16000), 'image/webp')).toEqual({ width: 1000, height: 16000 });
  });
  it('returns null for truncated or malformed headers', () => {
    expect(readImageDimensions(png(10, 10).slice(0, 20), 'image/png')).toBeNull();
    expect(readImageDimensions(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]), 'image/jpeg')).toBeNull();
    expect(readImageDimensions(webp('VP8 ', 0, 0).fill(0, 23, 26), 'image/webp')).toBeNull();
  });
});

describe('validateImageFile', () => {
  it('accepts valid images', async () => {
    const r = await validateImageFile(file(png(100, 50)));
    expect(r).toMatchObject({ ok: true, type: 'image/png', width: 100, height: 50, needsDownscale: false });
  });
  it('trusts content over a misleading name or MIME type', async () => {
    const r = await validateImageFile(file(jpeg(10, 10), 'photo.png', 'image/png'));
    expect(r).toMatchObject({ ok: true, type: 'image/jpeg' });
  });
  it('rejects empty, oversized, unsupported and disguised files', async () => {
    expect((await validateImageFile(file(new Uint8Array(0)))).error).toMatch(/empty/);
    const big = await validateImageFile(file(png(1, 1)), { ...LIMITS, maxBytes: 10 });
    expect(big.ok).toBe(false);
    expect(big.error).toMatch(/maximum size/);
    expect((await validateImageFile(file(new TextEncoder().encode('GIF89a\0\0\0\0\0\0'), 'a.gif', 'image/gif'))).error).toMatch(/GIF files are not supported/);
    expect((await validateImageFile(file(new TextEncoder().encode('<svg xmlns="..."></svg>'), 'a.png'))).error).toMatch(/SVG/);
    expect((await validateImageFile(file(new TextEncoder().encode('hello world'), 'evil.png'))).error).toMatch(/not a PNG, JPEG or WebP/);
    expect((await validateImageFile(null)).ok).toBe(false);
  });
  it('rejects decompression bombs from the header alone and flags large images for downscaling', async () => {
    const bomb = await validateImageFile(file(png(16000, 16000)));
    expect(bomb.ok).toBe(false);
    expect(bomb.error).toMatch(/too large/);
    const wide = await validateImageFile(file(png(20000, 10)));
    expect(wide.ok).toBe(false);
    const large = await validateImageFile(file(png(6000, 4000)));
    expect(large).toMatchObject({ ok: true, needsDownscale: true });
  });
  it('reports damaged files', async () => {
    expect((await validateImageFile(file(png(10, 10).slice(0, 16)))).error).toMatch(/damaged/);
  });
});

describe('sizes and file names', () => {
  it('fits within a pixel budget keeping the aspect ratio', () => {
    expect(fitWithinPixels(100, 100, 1e6)).toEqual({ width: 100, height: 100 });
    const r = fitWithinPixels(8000, 4000, 4096 * 4096);
    expect(r.width * r.height).toBeLessThanOrEqual(4096 * 4096);
    expect(r.width / r.height).toBeCloseTo(2, 2);
  });
  it('sanitises untrusted upload names', () => {
    expect(safeBaseName('../../etc/passwd')).toBe('passwd');
    expect(safeBaseName('C:\\Users\\me\\My Photo (1).final.JPG')).toBe('my-photo-1-final');
    expect(safeBaseName('Café Ñandú.png')).toBe('cafe-nandu');
    expect(safeBaseName('<script>.png')).toBe('script');
    expect(safeBaseName('...')).toBe('image');
    expect(safeBaseName('a'.repeat(200) + '.png')).toHaveLength(60);
    expect(sanitizeFileStem('My / ../Image')).toBe('my-image');
  });
});
