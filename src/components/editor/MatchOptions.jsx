import { memo, useId } from 'react';
import { Link } from 'react-router';

function Slider({ label, value, min, max, onChange, hint, unit = '' }) {
  const id = useId();
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <label htmlFor={id} className="text-sm font-medium text-slate-800">
          {label}
        </label>
        <output htmlFor={id} className="min-w-10 rounded bg-slate-100 px-1.5 py-0.5 text-right font-mono text-xs text-slate-800">
          {value}
          {unit}
        </output>
      </div>
      <input
        id={id}
        type="range"
        min={min}
        max={max}
        step={1}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        aria-describedby={`${id}-hint`}
        className="mt-1.5 w-full accent-brand-600"
      />
      <p id={`${id}-hint`} className="text-xs text-slate-600">
        {hint}
      </p>
    </div>
  );
}

/** Tolerance, feathering and matching-mode controls. */
function MatchOptions({ tolerance, feather, distance, preserveShading, showMask, canMask, onUpdate, onToggleMask }) {
  const id = useId();
  return (
    <fieldset className="space-y-4">
      <legend className="text-sm font-semibold text-slate-900">Matching</legend>
      <Slider
        label="Tolerance"
        value={tolerance}
        min={0}
        max={100}
        onChange={(v) => onUpdate({ tolerance: v }, 'tolerance')}
        hint="How different a shade can be and still be replaced. 0 = exact color only."
      />
      <Slider
        label="Edge feathering"
        value={feather}
        min={0}
        max={50}
        onChange={(v) => onUpdate({ feather: v }, 'feather')}
        hint="Softly blends shades just outside the tolerance to avoid hard edges."
      />

      <div>
        <label htmlFor={`${id}-distance`} className="text-sm font-medium text-slate-800">
          Color matching
        </label>
        <select
          id={`${id}-distance`}
          className="field-input mt-1"
          value={distance}
          onChange={(e) => onUpdate({ distance: e.target.value }, null)}
        >
          <option value="lab">Perceptual (CIELAB ΔE) – best for photos</option>
          <option value="rgb">RGB distance – simple, for flat graphics</option>
        </select>
      </div>

      <div className="space-y-2">
        <label className="flex items-start gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand-600"
            checked={preserveShading}
            onChange={(e) => onUpdate({ preserveShading: e.target.checked }, null)}
          />
          <span>
            <span className="font-medium">Preserve shading</span>
            <span className="block text-xs text-slate-600">Keeps highlights and shadows. Turn off for a flat, exact color.</span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm text-slate-800">
          <input
            type="checkbox"
            className="mt-0.5 h-4 w-4 accent-brand-600"
            checked={showMask}
            disabled={!canMask}
            onChange={(e) => onToggleMask(e.target.checked)}
          />
          <span>
            <span className="font-medium">Highlight affected area</span>
            <span className="block text-xs text-slate-600">
              Shows selected pixels in magenta in the result preview{canMask ? '' : ' (pick a color first)'}.
            </span>
          </span>
        </label>
      </div>
      <p className="text-xs text-slate-600">
        <Link to="/how-color-tolerance-works" className="font-medium text-brand-700 underline underline-offset-2">
          How tolerance and feathering work
        </Link>
      </p>
    </fieldset>
  );
}

export default memo(MatchOptions);
