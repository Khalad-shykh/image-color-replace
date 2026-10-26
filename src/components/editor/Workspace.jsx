import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import ColorField from './ColorField.jsx';
import ImageStage from './ImageStage.jsx';
import MatchOptions from './MatchOptions.jsx';
import ReplacementList from './ReplacementList.jsx';
import ExportPanel from './ExportPanel.jsx';
import { useEditorHistory } from '../../hooks/useEditorHistory.js';
import { useImageProcessor } from '../../hooks/useImageProcessor.js';
import { useElementWidth } from '../../hooks/useElementWidth.js';
import { useMediaQuery } from '../../hooks/useMediaQuery.js';
import { activeOp } from '../../lib/history.js';
import { mapColorThroughOps } from '../../lib/replace.js';
import { pixelAt, fitScale, nextZoom } from '../../lib/coords.js';
import { rgbToHex } from '../../lib/color.js';
import { hasTransparency } from '../../lib/exportImage.js';
import { ACCEPT_ATTR } from '../../lib/imageFile.js';

const VIEWS = [
  { id: 'side', label: 'Side by side', short: 'Both' },
  { id: 'compare', label: 'Compare slider', short: 'Compare' },
  { id: 'original', label: 'Original only', short: 'Original' },
  { id: 'edited', label: 'Result only', short: 'Result' },
];

/**
 * The editing workspace shown once an image is loaded. Loaded lazily so the
 * initial page only ships the upload area.
 */
export default function Workspace({ image, onReplaceFile, onStartOver, announce }) {
  const { imageData: original } = image;
  const { state, canUndo, canRedo, update, commit, removeOp, reset, undo, redo } = useEditorHistory();
  const [showMask, setShowMask] = useState(false);
  const [view, setView] = useState('side');
  const [zoom, setZoom] = useState('fit');
  const [split, setSplit] = useState(50);
  const [notice, setNotice] = useState('');
  const fileInput = useRef(null);
  const previewRef = useRef(null);
  const stateRef = useRef(state);
  stateRef.current = state;

  const current = activeOp(state);
  // Memoised so the processor only re-renders when an operation actually changes.
  const ops = useMemo(
    () => (current ? [...state.ops, current] : state.ops),
    [state.ops, state.source, state.target, state.tolerance, state.feather, state.distance, state.preserveShading],
  );
  const maskActive = showMask && !!current;
  const { result, busy, progress, error, getFinalImage } = useImageProcessor(original, ops, { mask: maskActive });

  const hasAlpha = useMemo(() => hasTransparency(original.data), [original]);

  // Layout: measure the preview column to compute the "fit" scale.
  const previewWidth = useElementWidth(previewRef);
  const wide = useMediaQuery('(min-width: 768px)');
  const viewportH = useViewportHeight();
  const maxHeight = Math.round(Math.max(260, Math.min(760, viewportH * (wide ? 0.68 : 0.55))));
  const columns = view === 'side' && wide ? 2 : 1;
  const paneWidth = Math.max(100, (previewWidth - (columns - 1) * 16) / columns - 2);
  const fit = fitScale(original.width, original.height, paneWidth, maxHeight - 2, 8);
  const scale = zoom === 'fit' ? fit : zoom;

  const onPick = useCallback(
    ({ x, y }) => {
      const px = pixelAt(original, x, y);
      if (px.a === 0) {
        setNotice('That pixel is fully transparent, so it has no visible color. Pick a visible part of the image.');
        return;
      }
      setNotice('');
      // Match against the image as it looks after kept replacements.
      const color = mapColorThroughOps(px, stateRef.current.ops);
      update({ source: color, pickPoint: { x, y } }, null);
      announce(`Selected ${rgbToHex(color).toUpperCase()} at ${x}, ${y} as the color to replace.`);
    },
    [original, update, announce],
  );

  const onSourceChange = useCallback((rgb, key) => update({ source: rgb, pickPoint: null }, key), [update]);
  const onTargetChange = useCallback((rgb, key) => update({ target: rgb }, key), [update]);
  const onUpdate = useCallback((patch, key) => update(patch, key), [update]);
  const onCommit = useCallback(() => {
    commit();
    setShowMask(false);
    announce('Replacement kept. Pick another color to replace.');
  }, [commit, announce]);
  const onCancelActive = useCallback(() => update({ source: null, pickPoint: null }, null), [update]);
  const onRemove = useCallback((i) => removeOp(i), [removeOp]);
  const onSwap = () => {
    if (state.source) update({ source: state.target, target: state.source, pickPoint: null }, null);
  };

  // Keyboard shortcuts: Ctrl/Cmd+Z undo, Ctrl/Cmd+Shift+Z or Ctrl+Y redo.
  useEffect(() => {
    const onKey = (e) => {
      if (!(e.ctrlKey || e.metaKey) || e.altKey) return;
      const t = e.target;
      const typing = t instanceof HTMLElement && (t.isContentEditable || (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) && !/^(range|checkbox|radio|color)$/.test(t.type)));
      if (typing) return;
      const key = e.key.toLowerCase();
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo]);

  const editedTitle = maskActive ? 'Affected area' : 'Result';
  const pickHelp = 'Click or tap to pick the color to replace. With the keyboard, use the arrow keys to move and Enter to pick.';
  const stageProps = { scale, maxHeight, pickPoint: state.pickPoint, onPick };

  const zoomLabel = `${Math.round(scale * 100)}%`;

  return (
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_22rem]">
      <div className="min-w-0">
        {/* Toolbar */}
        <div className="panel mb-3 flex flex-wrap items-center gap-2 p-2" role="toolbar" aria-label="Editor tools">
          <button type="button" className="btn-ghost" onClick={undo} disabled={!canUndo} aria-keyshortcuts="Control+Z">
            <Icon name="undo" className="h-4 w-4" /> Undo
          </button>
          <button type="button" className="btn-ghost" onClick={redo} disabled={!canRedo} aria-keyshortcuts="Control+Y">
            <Icon name="redo" className="h-4 w-4" /> Redo
          </button>
          <button
            type="button"
            className="btn-ghost"
            onClick={() => {
              reset();
              setShowMask(false);
              announce('All replacements cleared. The image is back to the original.');
            }}
            disabled={state.ops.length === 0 && !state.source}
          >
            <Icon name="reset" className="h-4 w-4" /> Reset
          </button>
          <span className="mx-1 hidden h-6 w-px bg-slate-200 sm:block" aria-hidden="true" />
          <button type="button" className="btn-ghost" onClick={() => fileInput.current?.click()}>
            <Icon name="image" className="h-4 w-4" /> Replace image
          </button>
          <input
            ref={fileInput}
            type="file"
            accept={ACCEPT_ATTR}
            className="sr-only"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              const file = e.target.files?.[0];
              e.target.value = '';
              if (file) onReplaceFile(file);
            }}
          />
          <button type="button" className="btn-ghost" onClick={onStartOver}>
            <Icon name="close" className="h-4 w-4" /> Close
          </button>
        </div>

        {/* View + zoom controls */}
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <div className="inline-flex rounded-lg bg-slate-200/70 p-1" role="group" aria-label="Preview layout">
            {VIEWS.map((v) => (
              <button
                key={v.id}
                type="button"
                aria-pressed={view === v.id}
                className={`rounded-md px-2.5 py-1 text-xs font-semibold sm:text-sm ${
                  view === v.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
                onClick={() => setView(v.id)}
              >
                <span className="sm:hidden">{v.short}</span>
                <span className="hidden sm:inline">{v.label}</span>
              </button>
            ))}
          </div>
          <div className="inline-flex items-center gap-1" role="group" aria-label="Zoom">
            <button type="button" className="btn-ghost px-2" onClick={() => setZoom(nextZoom(scale, -1))} aria-label="Zoom out">
              <Icon name="zoomOut" className="h-4 w-4" />
            </button>
            <span className="min-w-12 text-center font-mono text-xs text-slate-700" aria-live="polite">
              <span className="sr-only">Zoom </span>
              {zoomLabel}
            </span>
            <button type="button" className="btn-ghost px-2" onClick={() => setZoom(nextZoom(scale, 1))} aria-label="Zoom in">
              <Icon name="zoomIn" className="h-4 w-4" />
            </button>
            <button
              type="button"
              className="btn-ghost px-2 text-xs"
              onClick={() => setZoom('fit')}
              aria-pressed={zoom === 'fit'}
            >
              <Icon name="fit" className="h-4 w-4" /> Fit
            </button>
            <button type="button" className="btn-ghost px-2 text-xs" onClick={() => setZoom(1)} aria-pressed={zoom === 1}>
              100%
            </button>
          </div>
        </div>

        {/* Previews */}
        <div ref={previewRef} className={`grid gap-4 ${columns === 2 ? 'grid-cols-2' : 'grid-cols-1'}`}>
          {view === 'side' || view === 'original' ? (
            <ImageStage image={original} title="Original" label={`Original image. ${pickHelp}`} {...stageProps} />
          ) : null}
          {view === 'side' || view === 'edited' ? (
            <ImageStage image={result} title={editedTitle} label={`${editedTitle} preview. ${pickHelp}`} busy={busy} {...stageProps} />
          ) : null}
          {view === 'compare' ? (
            <div>
              <ImageStage
                image={original}
                overlay={result}
                split={split}
                title={`Original ◀ ▶ ${editedTitle}`}
                label={`Before and after comparison. ${pickHelp}`}
                busy={busy}
                {...stageProps}
              />
              <label className="mt-2 flex items-center gap-3 text-xs font-medium text-slate-700">
                <span>Before</span>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={split}
                  onChange={(e) => setSplit(Number(e.target.value))}
                  className="flex-1 accent-brand-600"
                  aria-label="Comparison divider position"
                  aria-valuetext={`${split}% original, ${100 - split}% result`}
                />
                <span>After</span>
              </label>
            </div>
          ) : null}
        </div>

        {/* Status */}
        <div className="mt-3 min-h-6 text-sm">
          {busy ? (
            <div className="flex items-center gap-3" role="status">
              <span className="text-slate-700">Processing {original.width} × {original.height}px…</span>
              <progress className="h-2 flex-1 accent-brand-600" max={100} value={Math.round(progress * 100)} aria-label="Processing progress" />
            </div>
          ) : error ? (
            <p role="alert" className="font-medium text-red-700">
              {error}
            </p>
          ) : notice ? (
            <p role="status" className="text-amber-800">
              {notice}
            </p>
          ) : (
            <p className="flex items-center gap-1.5 text-slate-600">
              <Icon name="eyedropper" className="h-4 w-4 shrink-0" />
              {state.source
                ? 'Adjust the tolerance until only the area you want is changed, then download.'
                : 'Click anywhere on the image to choose the color you want to replace.'}
            </p>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="space-y-4">
        <div className="panel space-y-5">
          <ColorField
            label="1. Color to replace"
            value={state.source}
            onChange={onSourceChange}
            emptyHint="Click the image to pick a color, or enter one below."
          />
          <div className="flex items-center gap-2">
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
            <button
              type="button"
              className="btn-ghost px-2 py-1 text-xs"
              onClick={onSwap}
              disabled={!state.source}
              aria-label="Swap the color to replace and the replacement color"
            >
              <Icon name="swap" className="h-4 w-4" /> Swap
            </button>
            <span className="h-px flex-1 bg-slate-200" aria-hidden="true" />
          </div>
          <ColorField label="2. Replacement color" value={state.target} onChange={onTargetChange} />
        </div>

        <div className="panel">
          <MatchOptions
            tolerance={state.tolerance}
            feather={state.feather}
            distance={state.distance}
            preserveShading={state.preserveShading}
            showMask={maskActive}
            canMask={!!current}
            onUpdate={onUpdate}
            onToggleMask={setShowMask}
          />
        </div>

        <div className="panel">
          <ReplacementList
            ops={state.ops}
            hasActive={!!current}
            onCommit={onCommit}
            onCancelActive={onCancelActive}
            onRemove={onRemove}
          />
        </div>

        <div className="panel">
          <ExportPanel
            getFinalImage={getFinalImage}
            baseName={image.baseName}
            width={original.width}
            height={original.height}
            scaledFrom={image.scaledFrom}
            hasAlpha={hasAlpha}
            hasEdits={ops.length > 0}
          />
        </div>
      </div>
    </div>
  );
}

function useViewportHeight() {
  const [h, setH] = useState(() => (typeof window === 'undefined' ? 800 : window.innerHeight));
  useEffect(() => {
    const onResize = () => setH(window.innerHeight);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return h;
}
