/**
 * Export helpers: encode the edited pixels to PNG / JPEG / WebP and download.
 * The exported image always keeps the editor's pixel dimensions.
 */
import { sanitizeFileStem } from './imageFile.js';

export const EXPORT_FORMATS = Object.freeze({
  png: { id: 'png', label: 'PNG', mime: 'image/png', ext: 'png', alpha: true, lossy: false },
  jpeg: { id: 'jpeg', label: 'JPEG', mime: 'image/jpeg', ext: 'jpg', alpha: false, lossy: true },
  webp: { id: 'webp', label: 'WebP', mime: 'image/webp', ext: 'webp', alpha: true, lossy: true },
});

const supportCache = new Map();

/**
 * Whether this browser's canvas can encode `mime`. Browsers that cannot
 * encode a type silently return PNG data instead, which is what we detect.
 */
export function canEncode(mime) {
  if (mime === 'image/png') return true;
  if (supportCache.has(mime)) return supportCache.get(mime);
  let ok = false;
  try {
    const c = document.createElement('canvas');
    c.width = 1;
    c.height = 1;
    ok = c.toDataURL(mime).startsWith(`data:${mime}`);
  } catch {
    ok = false;
  }
  supportCache.set(mime, ok);
  return ok;
}

/** True if any pixel is not fully opaque. */
export function hasTransparency(data) {
  for (let i = 3; i < data.length; i += 4) if (data[i] !== 255) return true;
  return false;
}

/** Builds a safe download filename from user input and the chosen format. */
export function buildFileName(input, formatId, fallback = 'recolored-image') {
  const format = EXPORT_FORMATS[formatId] ?? EXPORT_FORMATS.png;
  // Drop an image extension the user may have typed ("photo.png").
  const stem = String(input ?? '').trim().replace(/\.(png|jpe?g|webp)$/i, '');
  return `${sanitizeFileStem(stem, fallback)}.${format.ext}`;
}

/**
 * Returns a canvas ready for encoding. For formats without alpha (JPEG) the
 * image is composited over `background`, because JPEG cannot store
 * transparency and browsers would otherwise turn transparent areas black.
 */
export function createExportCanvas(imageData, formatId, background = '#ffffff') {
  const format = EXPORT_FORMATS[formatId] ?? EXPORT_FORMATS.png;
  const canvas = document.createElement('canvas');
  canvas.width = imageData.width;
  canvas.height = imageData.height;
  const ctx = canvas.getContext('2d');
  if (format.alpha) {
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  const layer = document.createElement('canvas');
  layer.width = imageData.width;
  layer.height = imageData.height;
  layer.getContext('2d').putImageData(imageData, 0, 0);
  ctx.fillStyle = background;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(layer, 0, 0);
  layer.width = 0; // release memory early
  return canvas;
}

export function canvasToBlob(canvas, mime, quality) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) reject(new Error('The browser could not encode the image.'));
        else if (blob.type && blob.type !== mime) {
          reject(new Error(`This browser cannot save ${mime.replace('image/', '').toUpperCase()} files. Please choose PNG.`));
        } else resolve(blob);
      },
      mime,
      quality,
    );
  });
}

/** Triggers a download for `blob` and revokes the temporary object URL. */
export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.rel = 'noopener';
  a.style.display = 'none';
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a moment to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

/** Full export: encode `imageData` and download it. Resolves to the Blob. */
export async function exportImage(imageData, { formatId, quality = 0.92, filename, background }) {
  const format = EXPORT_FORMATS[formatId] ?? EXPORT_FORMATS.png;
  const canvas = createExportCanvas(imageData, format.id, background);
  try {
    const blob = await canvasToBlob(canvas, format.mime, format.lossy ? quality : undefined);
    downloadBlob(blob, buildFileName(filename, format.id));
    return blob;
  } finally {
    canvas.width = 0;
    canvas.height = 0;
  }
}
