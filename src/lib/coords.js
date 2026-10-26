/**
 * Converts a pointer position to image pixel coordinates.
 *
 * The canvas is usually displayed scaled (fit-to-screen or zoomed), so the
 * on-screen position is divided by the displayed size and multiplied by the
 * image's real size. Returns null when the point is outside the image.
 */
export function clientToImage(clientX, clientY, rect, width, height) {
  if (!rect || rect.width <= 0 || rect.height <= 0) return null;
  const fx = (clientX - rect.left) / rect.width;
  const fy = (clientY - rect.top) / rect.height;
  if (fx < 0 || fy < 0 || fx >= 1 || fy >= 1) return null;
  return {
    x: Math.min(width - 1, Math.floor(fx * width)),
    y: Math.min(height - 1, Math.floor(fy * height)),
  };
}

/** Reads the RGBA value at (x, y) from an ImageData-like object. */
export function pixelAt(imageData, x, y) {
  const i = (y * imageData.width + x) * 4;
  const d = imageData.data;
  return { r: d[i], g: d[i + 1], b: d[i + 2], a: d[i + 3] };
}

/** Scale that fits width×height inside maxWidth×maxHeight (may upscale up to maxUpscale). */
export function fitScale(width, height, maxWidth, maxHeight, maxUpscale = 4) {
  if (!width || !height || maxWidth <= 0 || maxHeight <= 0) return 1;
  return Math.min(maxWidth / width, maxHeight / height, maxUpscale);
}

export const ZOOM_STEPS = [0.1, 0.25, 0.5, 0.75, 1, 1.5, 2, 3, 4, 6, 8];

export function nextZoom(current, direction) {
  if (direction > 0) return ZOOM_STEPS.find((z) => z > current + 1e-6) ?? ZOOM_STEPS.at(-1);
  return [...ZOOM_STEPS].reverse().find((z) => z < current - 1e-6) ?? ZOOM_STEPS[0];
}
