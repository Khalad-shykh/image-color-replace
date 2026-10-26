import { useCallback, useRef, useState } from 'react';
import { LIMITS, validateImageFile, decodeImageFile, safeBaseName, fitWithinPixels } from '../lib/imageFile.js';
import { createSampleImage } from '../lib/sampleImage.js';

let nextImageId = 1;

/**
 * Upload state machine: validate → (optionally confirm downscaling) → decode.
 *
 * status: 'idle' | 'checking' | 'confirm' | 'decoding'
 * The current image is only replaced once a new file has been decoded
 * successfully, so a bad file never discards the user's work.
 */
export function useImageUpload() {
  const [image, setImage] = useState(null);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(null);
  const token = useRef(0);

  const decode = useCallback(async (file, info, myToken) => {
    setStatus('decoding');
    try {
      const { imageData, naturalWidth, naturalHeight } = await decodeImageFile(file, LIMITS.maxPixels);
      if (myToken !== token.current) return null;
      const scaled = imageData.width !== naturalWidth || imageData.height !== naturalHeight;
      const next = {
        id: nextImageId++,
        imageData,
        baseName: safeBaseName(file.name),
        typeLabel: info.type.replace('image/', '').toUpperCase(),
        size: file.size,
        scaledFrom: scaled ? { width: naturalWidth, height: naturalHeight } : null,
      };
      setImage(next);
      setStatus('idle');
      return next;
    } catch {
      if (myToken !== token.current) return null;
      setError('This image could not be opened. The file may be damaged, or your browser may not support it.');
      setStatus('idle');
      return null;
    }
  }, []);

  const openFile = useCallback(
    async (file) => {
      const myToken = ++token.current;
      setError('');
      setPending(null);
      setStatus('checking');
      const result = await validateImageFile(file);
      if (myToken !== token.current) return null;
      if (!result.ok) {
        setError(result.error);
        setStatus('idle');
        return null;
      }
      if (result.needsDownscale) {
        setPending({ file, info: result, target: fitWithinPixels(result.width, result.height, LIMITS.maxPixels) });
        setStatus('confirm');
        return null;
      }
      return decode(file, result, myToken);
    },
    [decode],
  );

  const confirmDownscale = useCallback(() => {
    if (!pending) return null;
    const myToken = ++token.current;
    const { file, info } = pending;
    setPending(null);
    return decode(file, info, myToken);
  }, [pending, decode]);

  const cancelPending = useCallback(() => {
    token.current++;
    setPending(null);
    setStatus('idle');
  }, []);

  const loadSample = useCallback(() => {
    token.current++;
    setError('');
    setPending(null);
    const next = {
      id: nextImageId++,
      imageData: createSampleImage(),
      baseName: 'sample-image',
      typeLabel: 'PNG',
      size: 0,
      scaledFrom: null,
    };
    setImage(next);
    setStatus('idle');
    return next;
  }, []);

  const clear = useCallback(() => {
    token.current++;
    setImage(null);
    setPending(null);
    setError('');
    setStatus('idle');
  }, []);

  return { image, status, error, pending, openFile, confirmDownscale, cancelPending, loadSample, clear, dismissError: () => setError('') };
}
