import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { clientToImage, pixelAt } from '../../lib/coords.js';
import { rgbToHex } from '../../lib/color.js';

/** Draws an ImageData into a canvas whenever it changes. */
function useCanvasImage(imageData) {
  const ref = useRef(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas || !imageData) return;
    if (canvas.width !== imageData.width) canvas.width = imageData.width;
    if (canvas.height !== imageData.height) canvas.height = imageData.height;
    canvas.getContext('2d')?.putImageData(imageData, 0, 0);
  }, [imageData]);
  // Release canvas memory when unmounted (large images use a lot of RAM).
  useEffect(
    () => () => {
      if (ref.current) {
        ref.current.width = 0;
        ref.current.height = 0;
      }
    },
    [],
  );
  return ref;
}

/**
 * An image preview that can be clicked (or driven with the keyboard) to pick
 * a pixel. Optionally overlays a second image clipped at `split` (0–100) for
 * before/after comparison.
 *
 * `scale` is the display scale (1 = 100%). `maxHeight` limits the viewport;
 * when the scaled image is larger the viewport scrolls.
 */
function ImageStage({
  image,
  overlay = null,
  split = 50,
  scale,
  maxHeight,
  label,
  title,
  pickPoint,
  onPick,
  busy = false,
}) {
  const baseRef = useCanvasImage(image);
  const overlayRef = useCanvasImage(overlay);
  const [hover, setHover] = useState(null);
  const [cursor, setCursor] = useState(null);
  const frame = useRef(0);

  const { width, height } = image;
  const displayW = Math.max(1, Math.round(width * scale));
  const displayH = Math.max(1, Math.round(height * scale));

  const sampleAt = useCallback(
    (x, y) => {
      const src = overlay && (x / width) * 100 >= split ? overlay : image;
      return pixelAt(src, x, y);
    },
    [image, overlay, split, width],
  );

  const toImage = (e) => clientToImage(e.clientX, e.clientY, e.currentTarget.getBoundingClientRect(), width, height);

  const onPointerMove = (e) => {
    const point = toImage(e);
    cancelAnimationFrame(frame.current);
    frame.current = requestAnimationFrame(() => setHover(point ? { ...point, color: sampleAt(point.x, point.y) } : null));
  };
  useEffect(() => () => cancelAnimationFrame(frame.current), []);

  const onClick = (e) => {
    const point = toImage(e);
    if (point) onPick?.(point);
  };

  const onKeyDown = (e) => {
    const step = e.shiftKey ? Math.max(10, Math.round(Math.min(width, height) / 20)) : 1;
    const moves = { ArrowLeft: [-step, 0], ArrowRight: [step, 0], ArrowUp: [0, -step], ArrowDown: [0, step] };
    if (moves[e.key]) {
      e.preventDefault();
      const start = cursor ?? pickPoint ?? { x: Math.floor(width / 2), y: Math.floor(height / 2) };
      const [dx, dy] = moves[e.key];
      const next = {
        x: Math.max(0, Math.min(width - 1, start.x + dx)),
        y: Math.max(0, Math.min(height - 1, start.y + dy)),
      };
      setCursor(next);
      setHover({ ...next, color: sampleAt(next.x, next.y) });
    } else if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const point = cursor ?? { x: Math.floor(width / 2), y: Math.floor(height / 2) };
      onPick?.(point);
    } else if (e.key === 'Escape') {
      setCursor(null);
    }
  };

  const marker = (point, kind) => (
    <span
      aria-hidden="true"
      className={`pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full border-2 ${
        kind === 'cursor'
          ? 'h-5 w-5 border-dashed border-white shadow-[0_0_0_1px_rgba(0,0,0,0.8)]'
          : 'h-4 w-4 border-white shadow-[0_0_0_1.5px_rgba(0,0,0,0.85),0_1px_4px_rgba(0,0,0,0.4)]'
      }`}
      style={{ left: `${((point.x + 0.5) / width) * 100}%`, top: `${((point.y + 0.5) / height) * 100}%` }}
    />
  );

  const pixelated = scale >= 2 ? { imageRendering: 'pixelated' } : undefined;

  return (
    <figure className="min-w-0">
      <figcaption className="mb-1.5 flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold tracking-wide text-slate-700 uppercase">{title}</span>
        <span className="truncate font-mono text-slate-500" aria-hidden="true">
          {hover ? `${hover.x}, ${hover.y} · ${rgbToHex(hover.color).toUpperCase()}${hover.color.a < 255 ? ` · α ${hover.color.a}` : ''}` : `${width} × ${height}px`}
        </span>
      </figcaption>
      <div className="relative">
      <div
        className="checkerboard overflow-auto rounded-lg border border-slate-300"
        style={{ maxHeight }}
      >
        <div
          role="application"
          tabIndex={0}
          aria-label={label}
          aria-roledescription="image color picker"
          className="relative mx-auto cursor-crosshair touch-manipulation outline-none focus-visible:ring-4 focus-visible:ring-brand-600/60"
          style={{ width: displayW, height: displayH }}
          onClick={onClick}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(cursor ? hover : null)}
          onKeyDown={onKeyDown}
          onBlur={() => setCursor(null)}
        >
          <canvas ref={baseRef} className="block h-full w-full" style={pixelated} />
          {overlay ? (
            <canvas
              ref={overlayRef}
              className="pointer-events-none absolute inset-0 block h-full w-full"
              style={{ ...pixelated, clipPath: `inset(0 0 0 ${split}%)` }}
            />
          ) : null}
          {overlay ? (
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_0_1px_rgba(0,0,0,0.5)]"
              style={{ left: `${split}%` }}
            />
          ) : null}
          {pickPoint ? marker(pickPoint, 'pick') : null}
          {cursor ? marker(cursor, 'cursor') : null}
        </div>
      </div>
        {busy ? (
          <div className="pointer-events-none absolute top-2 right-2 rounded-full bg-slate-900/80 px-2.5 py-1 text-xs font-medium text-white">
            Updating…
          </div>
        ) : null}
      </div>
    </figure>
  );
}

export default memo(ImageStage);
