/**
 * Upload validation and decoding.
 *
 * Files are identified by their leading "magic" bytes, not by the filename or
 * the browser-reported MIME type, and their pixel dimensions are read from the
 * file header BEFORE the image is decoded. This rejects disguised files and
 * "decompression bombs" (tiny files that expand to enormous bitmaps) without
 * ever handing them to the image decoder.
 */

export const LIMITS = Object.freeze({
  maxBytes: 30 * 1024 * 1024, // 30 MB
  // Above this pixel count we offer to scale the image down (16.7 MP is the
  // canvas area limit on iOS Safari and keeps memory use reasonable).
  maxPixels: 4096 * 4096,
  // Above this the file is rejected outright.
  hardMaxPixels: 50_000_000,
  maxSide: 16384,
});

export const SUPPORTED_TYPES = Object.freeze({
  'image/png': 'PNG',
  'image/jpeg': 'JPEG',
  'image/webp': 'WebP',
});

export const ACCEPT_ATTR = 'image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp';

/** Detects PNG / JPEG / WebP from the first bytes. Returns a MIME type or null. */
export function detectImageType(bytes) {
  if (bytes.length >= 8 &&
      bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47 &&
      bytes[4] === 0x0d && bytes[5] === 0x0a && bytes[6] === 0x1a && bytes[7] === 0x0a) {
    return 'image/png';
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return 'image/jpeg';
  }
  if (bytes.length >= 12 && ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') {
    return 'image/webp';
  }
  return null;
}

/** Best-effort name for unsupported formats, used in error messages only. */
export function describeUnsupported(bytes) {
  if (bytes.length >= 6 && ascii(bytes, 0, 3) === 'GIF') return 'GIF';
  if (bytes.length >= 2 && bytes[0] === 0x42 && bytes[1] === 0x4d) return 'BMP';
  if (bytes.length >= 12 && ascii(bytes, 4, 4) === 'ftyp') return 'HEIC/AVIF';
  if (bytes.length >= 5 && /<svg|<\?xml/i.test(ascii(bytes, 0, Math.min(bytes.length, 100)))) return 'SVG';
  if (bytes.length >= 4 && ascii(bytes, 0, 4) === '%PDF') return 'PDF';
  return null;
}

/**
 * Reads width/height from a PNG, JPEG or WebP header.
 * Returns {width, height} or null if the header is malformed/truncated.
 */
export function readImageDimensions(bytes, type) {
  try {
    if (type === 'image/png') return readPng(bytes);
    if (type === 'image/jpeg') return readJpeg(bytes);
    if (type === 'image/webp') return readWebp(bytes);
  } catch {
    return null;
  }
  return null;
}

function readPng(b) {
  if (b.length < 24 || ascii(b, 12, 4) !== 'IHDR') return null;
  const width = u32be(b, 16);
  const height = u32be(b, 20);
  return width > 0 && height > 0 ? { width, height } : null;
}

function readJpeg(b) {
  let i = 2;
  while (i + 3 < b.length) {
    if (b[i] !== 0xff) return null;
    let marker = b[i + 1];
    // Skip fill bytes (0xFF padding).
    while (marker === 0xff && i + 2 < b.length) {
      i++;
      marker = b[i + 1];
    }
    i += 2;
    // Standalone markers without a length field.
    if (marker === 0xd8 || marker === 0x01 || (marker >= 0xd0 && marker <= 0xd7)) continue;
    if (marker === 0xd9 || marker === 0xda) return null; // EOI / start of scan before SOF
    if (i + 1 >= b.length) return null;
    const length = (b[i] << 8) | b[i + 1];
    if (length < 2) return null;
    const isSof =
      marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8 && marker !== 0xcc;
    if (isSof) {
      if (i + 7 > b.length) return null;
      const height = (b[i + 3] << 8) | b[i + 4];
      const width = (b[i + 5] << 8) | b[i + 6];
      return width > 0 && height > 0 ? { width, height } : null;
    }
    i += length;
  }
  return null;
}

function readWebp(b) {
  if (b.length < 30) return null;
  const chunk = ascii(b, 12, 4);
  if (chunk === 'VP8X') {
    const width = 1 + (b[24] | (b[25] << 8) | (b[26] << 16));
    const height = 1 + (b[27] | (b[28] << 8) | (b[29] << 16));
    return { width, height };
  }
  if (chunk === 'VP8 ') {
    if (b[23] !== 0x9d || b[24] !== 0x01 || b[25] !== 0x2a) return null;
    const width = (b[26] | (b[27] << 8)) & 0x3fff;
    const height = (b[28] | (b[29] << 8)) & 0x3fff;
    return width > 0 && height > 0 ? { width, height } : null;
  }
  if (chunk === 'VP8L') {
    if (b[20] !== 0x2f) return null;
    const bits = b[21] | (b[22] << 8) | (b[23] << 16) | (b[24] << 24);
    const width = 1 + (bits & 0x3fff);
    const height = 1 + ((bits >>> 14) & 0x3fff);
    return { width, height };
  }
  return null;
}

function ascii(b, start, len) {
  let s = '';
  for (let i = start; i < start + len && i < b.length; i++) s += String.fromCharCode(b[i]);
  return s;
}

function u32be(b, i) {
  return ((b[i] << 24) >>> 0) + (b[i + 1] << 16) + (b[i + 2] << 8) + b[i + 3];
}

async function readBytes(file, length) {
  const blob = file.slice(0, length);
  if (typeof blob.arrayBuffer === 'function') return new Uint8Array(await blob.arrayBuffer());
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(new Uint8Array(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(blob);
  });
}

export const formatBytes = (n) =>
  n >= 1024 * 1024 ? `${(n / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`;

/**
 * Validates an uploaded File without decoding it.
 *
 * Resolves to one of:
 *   { ok: true, type, width, height, needsDownscale }
 *   { ok: false, error }
 */
export async function validateImageFile(file, limits = LIMITS) {
  if (!file || typeof file.size !== 'number') {
    return { ok: false, error: 'No file was selected.' };
  }
  if (file.size === 0) {
    return { ok: false, error: 'This file is empty.' };
  }
  if (file.size > limits.maxBytes) {
    return {
      ok: false,
      error: `This file is ${formatBytes(file.size)}. The maximum size is ${formatBytes(limits.maxBytes)}.`,
    };
  }

  let head;
  try {
    head = await readBytes(file, 64 * 1024);
  } catch {
    return { ok: false, error: 'The file could not be read. Please try again.' };
  }
  const type = detectImageType(head);
  if (!type) {
    const other = describeUnsupported(head);
    return {
      ok: false,
      error: other
        ? `${other} files are not supported. Please use a PNG, JPEG or WebP image.`
        : 'This file is not a PNG, JPEG or WebP image.',
    };
  }

  let dims = readImageDimensions(head, type);
  if (!dims && type === 'image/jpeg' && file.size > head.length) {
    // Large EXIF/metadata blocks can push the size header further into the file.
    try {
      dims = readImageDimensions(await readBytes(file, file.size), type);
    } catch {
      dims = null;
    }
  }
  if (!dims) {
    return { ok: false, error: 'The image appears to be damaged: its size could not be read.' };
  }

  const pixels = dims.width * dims.height;
  if (dims.width > limits.maxSide || dims.height > limits.maxSide || pixels > limits.hardMaxPixels) {
    return {
      ok: false,
      error: `This image is ${dims.width} × ${dims.height} pixels, which is too large to edit in the browser. Please use an image under ${limits.maxSide} pixels per side.`,
    };
  }
  return { ok: true, type, ...dims, needsDownscale: pixels > limits.maxPixels };
}

/** Largest size with the same aspect ratio that fits within maxPixels. */
export function fitWithinPixels(width, height, maxPixels) {
  if (width * height <= maxPixels) return { width, height };
  const scale = Math.sqrt(maxPixels / (width * height));
  return {
    width: Math.max(1, Math.floor(width * scale)),
    height: Math.max(1, Math.floor(height * scale)),
  };
}

/**
 * Turns arbitrary text into a safe file-name stem: lowercase ASCII letters,
 * digits and dashes only, at most 60 characters. Slashes, dots and other
 * characters that could form a path are replaced, so the result can never
 * point outside the download folder.
 */
export function sanitizeFileStem(text, fallback = 'image') {
  const stem = String(text ?? '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
  return stem || fallback;
}

/**
 * Derives a safe base name from an untrusted uploaded file's name,
 * e.g. "C:\\photos\\My Photo (1).final.JPG" -> "my-photo-1-final".
 */
export function safeBaseName(name, fallback = 'image') {
  const last = String(name ?? '').split(/[\\/]/).pop();
  return sanitizeFileStem(last.replace(/\.[^.]*$/, ''), fallback);
}

/**
 * Decodes a validated file into { imageData, naturalWidth, naturalHeight }, scaling it down only when it has
 * more than `maxPixels` pixels (the caller asks the user before doing that).
 * The size is taken from the decoded image so EXIF rotation is respected.
 * Uses createImageBitmap where available (decodes off the main thread in most
 * browsers) and falls back to an <img> element.
 */
export async function decodeImageFile(file, maxPixels = Infinity) {
  let source = null;
  let cleanup = () => {};
  try {
    if (typeof createImageBitmap === 'function') {
      try {
        source = await createImageBitmap(file, { premultiplyAlpha: 'none' });
        cleanup = () => source.close?.();
      } catch {
        source = null;
      }
    }
    if (!source) {
      const url = URL.createObjectURL(file);
      try {
        source = await loadImageElement(url);
      } finally {
        URL.revokeObjectURL(url);
      }
    }
    const naturalWidth = source.naturalWidth || source.width;
    const naturalHeight = source.naturalHeight || source.height;
    if (!naturalWidth || !naturalHeight) throw new Error('decode failed');
    const { width, height } = fitWithinPixels(naturalWidth, naturalHeight, maxPixels);
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    if (!ctx) throw new Error('Canvas is not available in this browser.');
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(source, 0, 0, width, height);
    const imageData = ctx.getImageData(0, 0, width, height);
    canvas.width = 0;
    return { imageData, naturalWidth, naturalHeight };
  } finally {
    cleanup();
  }
}

function loadImageElement(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = 'async';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('decode failed'));
    img.src = url;
  });
}
