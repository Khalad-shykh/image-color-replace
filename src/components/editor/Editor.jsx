import { Component, Suspense, lazy, useCallback, useEffect, useRef, useState } from 'react';
import Icon from '../Icon.jsx';
import { useImageUpload } from '../../hooks/useImageUpload.js';
import { ACCEPT_ATTR, LIMITS, formatBytes } from '../../lib/imageFile.js';

const Workspace = lazy(() => import('./Workspace.jsx'));

/**
 * The image color replacement tool: upload area plus the (lazy-loaded)
 * editing workspace.
 */
export default function Editor() {
  const upload = useImageUpload();
  const { image, status, error, pending, openFile, confirmDownscale, cancelPending, loadSample, clear, dismissError } = upload;
  const [dragging, setDragging] = useState(false);
  const [message, setMessage] = useState('');
  const dragDepth = useRef(0);
  const sectionRef = useRef(null);

  const announce = useCallback((text) => {
    // Clearing first makes screen readers repeat identical messages.
    setMessage('');
    requestAnimationFrame(() => setMessage(text));
  }, []);

  const handleFile = useCallback(
    async (file) => {
      const loaded = await openFile(file);
      if (loaded) {
        const { width, height } = loaded.imageData;
        announce(`Image loaded, ${width} by ${height} pixels. Click the image to choose a color to replace.`);
      }
    },
    [openFile, announce],
  );

  // Paste an image from the clipboard (Ctrl/Cmd+V).
  useEffect(() => {
    const onPaste = (e) => {
      const t = e.target;
      if (t instanceof HTMLElement && /^(INPUT|TEXTAREA)$/.test(t.tagName)) return;
      const file = Array.from(e.clipboardData?.files ?? []).find((f) => f.type.startsWith('image/'));
      if (file) {
        e.preventDefault();
        handleFile(file);
      }
    };
    window.addEventListener('paste', onPaste);
    return () => window.removeEventListener('paste', onPaste);
  }, [handleFile]);

  const dragProps = {
    onDragEnter: (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current++;
      setDragging(true);
    },
    onDragOver: (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
    },
    onDragLeave: () => {
      dragDepth.current = Math.max(0, dragDepth.current - 1);
      if (dragDepth.current === 0) setDragging(false);
    },
    onDrop: (e) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      dragDepth.current = 0;
      setDragging(false);
      const file = e.dataTransfer.files?.[0];
      if (file) handleFile(file);
    },
  };

  const startOver = () => {
    clear();
    announce('Image closed.');
    requestAnimationFrame(() => sectionRef.current?.querySelector('button')?.focus());
  };

  return (
    <section ref={sectionRef} id="editor" aria-label="Image color replacement editor" className="relative scroll-mt-20" {...dragProps}>
      <p className="sr-only" role="status" aria-live="polite">
        {message}
      </p>

      {error ? (
        <div role="alert" className="mb-4 flex items-start gap-3 rounded-lg border border-red-300 bg-red-50 p-3 text-sm text-red-900">
          <Icon name="alert" className="mt-0.5 h-5 w-5 shrink-0" />
          <p className="flex-1">{error}</p>
          <button type="button" onClick={dismissError} className="rounded p-0.5 hover:bg-red-100" aria-label="Dismiss error">
            <Icon name="close" className="h-4 w-4" />
          </button>
        </div>
      ) : null}

      {pending ? (
        <DownscaleDialog pending={pending} onConfirm={confirmDownscale} onCancel={cancelPending} />
      ) : null}

      {image ? (
        <EditorErrorBoundary onReset={startOver}>
          <Suspense fallback={<LoadingPanel text="Loading editor…" />}>
            <Workspace key={image.id} image={image} onReplaceFile={handleFile} onStartOver={startOver} announce={announce} />
          </Suspense>
        </EditorErrorBoundary>
      ) : !pending ? (
        <Dropzone busy={status === 'checking' || status === 'decoding'} onFile={handleFile} onSample={() => {
          loadSample();
          announce('Sample image loaded. Click the image to choose a color to replace.');
        }} />
      ) : null}

      {image && status === 'decoding' ? <LoadingPanel text="Opening image…" overlay /> : null}

      {dragging ? (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-2xl border-4 border-dashed border-brand-600 bg-brand-50/90 text-lg font-semibold text-brand-800">
          Drop your image to open it
        </div>
      ) : null}
    </section>
  );
}

function hasFiles(e) {
  return Array.from(e.dataTransfer?.types ?? []).includes('Files');
}

function Dropzone({ busy, onFile, onSample }) {
  const input = useRef(null);
  return (
    <div className="rounded-2xl border-2 border-dashed border-slate-300 bg-white px-4 py-10 text-center shadow-sm sm:py-14">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-brand-700">
        <Icon name="upload" className="h-7 w-7" />
      </div>
      <h2 className="mt-4 text-lg font-semibold text-slate-900">Upload an image to get started</h2>
      <p className="mx-auto mt-1 max-w-md text-sm text-slate-600">
        Drag and drop a file here, paste it with Ctrl+V, or choose one from your device. PNG, JPEG or WebP, up to{' '}
        {formatBytes(LIMITS.maxBytes)}.
      </p>
      <div className="mt-5 flex flex-wrap items-center justify-center gap-3">
        <button type="button" className="btn-primary px-5 py-2.5 text-base" onClick={() => input.current?.click()} disabled={busy}>
          <Icon name="image" />
          {busy ? 'Opening…' : 'Choose image'}
        </button>
        <button type="button" className="btn-secondary px-4 py-2.5" onClick={onSample} disabled={busy}>
          Try a sample image
        </button>
      </div>
      <input
        ref={input}
        type="file"
        accept={ACCEPT_ATTR}
        className="sr-only"
        tabIndex={-1}
        aria-label="Choose an image file"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) onFile(file);
        }}
      />
      <p className="mt-5 inline-flex items-center gap-1.5 text-xs text-slate-600">
        <Icon name="lock" className="h-4 w-4" />
        Your image is processed on your device and never uploaded.
      </p>
    </div>
  );
}

function DownscaleDialog({ pending, onConfirm, onCancel }) {
  const { info, target } = pending;
  const ref = useRef(null);
  useEffect(() => ref.current?.focus(), []);
  const mp = (w, h) => ((w * h) / 1e6).toFixed(1);
  return (
    <div
      ref={ref}
      tabIndex={-1}
      role="alertdialog"
      aria-labelledby="downscale-title"
      aria-describedby="downscale-desc"
      className="mb-4 rounded-2xl border border-amber-300 bg-amber-50 p-5 text-amber-950 outline-none"
    >
      <h2 id="downscale-title" className="font-semibold">
        This image is very large
      </h2>
      <p id="downscale-desc" className="mt-1 text-sm">
        It is {info.width} × {info.height} pixels ({mp(info.width, info.height)} megapixels). To keep the editor fast and within
        browser memory limits, images over {mp(LIMITS.maxPixels, 1)} megapixels are edited at a smaller size. Scaling it to{' '}
        {target.width} × {target.height} pixels keeps the same proportions; your downloaded file will have that size.
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <button type="button" className="btn-primary" onClick={onConfirm}>
          Scale down and continue
        </button>
        <button type="button" className="btn-secondary" onClick={onCancel}>
          Choose a different image
        </button>
      </div>
    </div>
  );
}

function LoadingPanel({ text, overlay = false }) {
  return (
    <div
      role="status"
      className={
        overlay
          ? 'absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/70'
          : 'flex min-h-64 items-center justify-center rounded-2xl border border-slate-200 bg-white'
      }
    >
      <span className="inline-flex items-center gap-3 text-sm font-medium text-slate-700">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-slate-300 border-t-brand-600" aria-hidden="true" />
        {text}
      </span>
    </div>
  );
}

class EditorErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { failed: false };
  }

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    if (!this.state.failed) return this.props.children;
    return (
      <div role="alert" className="rounded-2xl border border-red-300 bg-red-50 p-6 text-red-900">
        <h2 className="font-semibold">Something went wrong in the editor</h2>
        <p className="mt-1 text-sm">
          Your browser may have run out of memory for this image, or the editor failed to load. Try a smaller image or reload the
          page.
        </p>
        <button
          type="button"
          className="btn-secondary mt-4"
          onClick={() => {
            this.setState({ failed: false });
            this.props.onReset();
          }}
        >
          Start over
        </button>
      </div>
    );
  }
}
