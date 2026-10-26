import { memo, useEffect, useId, useState } from 'react';
import Icon from '../Icon.jsx';
import { EXPORT_FORMATS, buildFileName, canEncode, exportImage } from '../../lib/exportImage.js';

/** Format, quality, filename and download controls. */
function ExportPanel({ getFinalImage, baseName, width, height, scaledFrom, hasAlpha, hasEdits }) {
  const id = useId();
  const [formatId, setFormatId] = useState('png');
  const [quality, setQuality] = useState(92);
  const [background, setBackground] = useState('#ffffff');
  const [fileName, setFileName] = useState(`${baseName}-recolored`);
  const [status, setStatus] = useState({ kind: 'idle', message: '' });
  const [webpSupported, setWebpSupported] = useState(true);

  useEffect(() => setWebpSupported(canEncode('image/webp')), []);
  useEffect(() => setFileName(`${baseName}-recolored`), [baseName]);

  const format = EXPORT_FORMATS[formatId];
  const finalName = buildFileName(fileName, formatId);

  const onDownload = async () => {
    setStatus({ kind: 'working', message: 'Preparing your image…' });
    try {
      const imageData = await getFinalImage();
      const blob = await exportImage(imageData, { formatId, quality: quality / 100, filename: fileName, background });
      const kb = Math.max(1, Math.round(blob.size / 1024));
      setStatus({ kind: 'success', message: `Download started: ${finalName} (${kb.toLocaleString()} KB).` });
    } catch (err) {
      setStatus({ kind: 'error', message: err?.message || 'The image could not be saved.' });
    }
  };

  return (
    <section aria-labelledby={`${id}-heading`}>
      <h3 id={`${id}-heading`} className="text-sm font-semibold text-slate-900">
        Download
      </h3>

      <fieldset className="mt-2">
        <legend className="text-xs font-medium text-slate-600">Format</legend>
        <div className="mt-1 grid grid-cols-3 gap-1 rounded-lg bg-slate-100 p-1">
          {Object.values(EXPORT_FORMATS).map((f) => {
            const disabled = f.id === 'webp' && !webpSupported;
            return (
              <label
                key={f.id}
                className={`flex cursor-pointer items-center justify-center rounded-md px-2 py-1.5 text-sm font-medium has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-600 ${
                  formatId === f.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                } ${disabled ? 'cursor-not-allowed opacity-50' : ''}`}
              >
                <input
                  type="radio"
                  name={`${id}-format`}
                  value={f.id}
                  checked={formatId === f.id}
                  disabled={disabled}
                  onChange={() => setFormatId(f.id)}
                  className="sr-only"
                />
                {f.label}
              </label>
            );
          })}
        </div>
        {!webpSupported ? (
          <p className="mt-1 text-xs text-slate-600">This browser cannot save WebP files. PNG keeps transparency too.</p>
        ) : null}
      </fieldset>

      {format.lossy ? (
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <label htmlFor={`${id}-quality`} className="text-xs font-medium text-slate-600">
              Quality
            </label>
            <output htmlFor={`${id}-quality`} className="font-mono text-xs text-slate-800">
              {quality}%
            </output>
          </div>
          <input
            id={`${id}-quality`}
            type="range"
            min={50}
            max={100}
            value={quality}
            onChange={(e) => setQuality(Number(e.target.value))}
            className="w-full accent-brand-600"
          />
        </div>
      ) : null}

      {!format.alpha ? (
        <div className="mt-3 rounded-lg border border-amber-300 bg-amber-50 p-2.5 text-xs text-amber-900">
          <p>
            <strong>JPEG does not support transparency.</strong>{' '}
            {hasAlpha
              ? 'Transparent areas in this image will be filled with the background color below.'
              : 'If you need transparent areas later, choose PNG or WebP.'}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <label htmlFor={`${id}-bg`} className="font-medium">
              Background color
            </label>
            <input
              id={`${id}-bg`}
              type="color"
              value={background}
              onChange={(e) => setBackground(e.target.value)}
              className="h-7 w-10 cursor-pointer rounded border border-amber-300 bg-white p-0.5"
            />
          </div>
        </div>
      ) : null}

      <div className="mt-3">
        <label htmlFor={`${id}-name`} className="text-xs font-medium text-slate-600">
          File name
        </label>
        <input
          id={`${id}-name`}
          type="text"
          className="field-input mt-1"
          value={fileName}
          maxLength={80}
          autoComplete="off"
          spellCheck="false"
          onChange={(e) => setFileName(e.target.value)}
          aria-describedby={`${id}-name-hint`}
        />
        <p id={`${id}-name-hint`} className="mt-1 truncate text-xs text-slate-600">
          Saves as <span className="font-mono text-slate-800">{finalName}</span> · {width} × {height}px
          {scaledFrom ? ` (scaled from ${scaledFrom.width} × ${scaledFrom.height})` : ' (original size)'}
        </p>
      </div>

      <button
        type="button"
        className="btn-primary mt-3 w-full py-2.5 text-base"
        onClick={onDownload}
        disabled={status.kind === 'working'}
      >
        <Icon name="download" />
        {status.kind === 'working' ? 'Preparing…' : `Download ${format.label}`}
      </button>
      {!hasEdits ? <p className="mt-1.5 text-xs text-slate-600">No colors replaced yet – the download will match the original.</p> : null}
      <p
        role={status.kind === 'error' ? 'alert' : 'status'}
        className={`mt-1.5 text-xs ${status.kind === 'error' ? 'font-medium text-red-700' : 'text-emerald-800'}`}
      >
        {status.kind === 'success' || status.kind === 'error' ? status.message : ''}
      </p>
    </section>
  );
}

export default memo(ExportPanel);
