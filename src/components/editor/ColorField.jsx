import { memo, useEffect, useId, useState } from 'react';
import {
  rgbToHex, hexToRgb, isValidHex, rgbEquals, isValidChannel, rgbToHsl, formatRgb, formatHsl, readableTextColor,
} from '../../lib/color.js';

const CHANNELS = [
  ['r', 'Red'],
  ['g', 'Green'],
  ['b', 'Blue'],
];

/**
 * Color editor with a swatch, native color picker, HEX input and individual
 * R/G/B inputs. Text inputs keep a local draft so users can type freely; the
 * color only changes once the draft is valid.
 *
 * `value` may be null (nothing selected yet), in which case `emptyHint` is shown.
 */
function ColorField({ label, value, onChange, emptyHint, description }) {
  const id = useId();
  const hex = value ? rgbToHex(value) : '';
  const [hexDraft, setHexDraft] = useState(hex);
  const [hexError, setHexError] = useState('');
  const [drafts, setDrafts] = useState(() => toDrafts(value));
  const [channelErrors, setChannelErrors] = useState({});

  // Sync drafts when the value changes from outside (picking, undo, etc.).
  // Drafts that already describe the new value are kept, so typing "#abc"
  // on the way to "#abcdef" is not rewritten mid-typing.
  useEffect(() => {
    setHexDraft((draft) => (value && rgbEquals(hexToRgb(draft), value) ? draft : value ? rgbToHex(value) : ''));
    setHexError('');
    setDrafts((d) => {
      const same = value && CHANNELS.every(([c]) => isValidChannel(d[c]) && Number(d[c]) === value[c]);
      return same ? d : toDrafts(value);
    });
    setChannelErrors({});
  }, [value]);

  const onHexChange = (e) => {
    const next = e.target.value;
    setHexDraft(next);
    if (isValidHex(next)) {
      setHexError('');
      onChange(hexToRgb(next), `${id}-hex`);
    }
  };

  const onHexBlur = () => {
    if (!isValidHex(hexDraft) && !(hexDraft.trim() === '' && !value)) {
      setHexError(hexDraft.trim() === '' ? 'Enter a HEX color.' : 'Use 3 or 6 hex digits, e.g. #1e90ff.');
    }
  };

  const onChannelChange = (channel) => (e) => {
    const next = e.target.value;
    setDrafts((d) => ({ ...d, [channel]: next }));
    if (isValidChannel(next)) {
      setChannelErrors((errs) => ({ ...errs, [channel]: '' }));
      const base = value ?? { r: 0, g: 0, b: 0 };
      // Use the other channels' current drafts when they are valid.
      const merged = { ...base };
      for (const [c] of CHANNELS) if (c !== channel && isValidChannel(drafts[c])) merged[c] = Number(drafts[c]);
      merged[channel] = Number(next);
      onChange(merged, `${id}-${channel}`);
    } else {
      setChannelErrors((errs) => ({ ...errs, [channel]: 'Enter a whole number from 0 to 255.' }));
    }
  };

  const hsl = value ? rgbToHsl(value) : null;
  const errorList = [hexError, ...CHANNELS.map(([c]) => channelErrors[c])].filter(Boolean);

  return (
    <fieldset className="min-w-0">
      <legend className="text-sm font-semibold text-slate-900">{label}</legend>
      {description ? <p className="mt-0.5 text-xs text-slate-600">{description}</p> : null}

      <div className="mt-2 flex items-stretch gap-3">
        <div
          className="checkerboard relative flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-slate-300"
          aria-hidden="true"
        >
          {value ? (
            <span className="absolute inset-0" style={{ backgroundColor: hex }} />
          ) : (
            <span className="relative px-1 text-center text-[10px] leading-tight text-slate-500">None</span>
          )}
          {value ? (
            <span className="relative font-mono text-[10px] font-semibold" style={{ color: readableTextColor(value) }}>
              {hex.slice(1).toUpperCase()}
            </span>
          ) : null}
        </div>

        <div className="min-w-0 flex-1 text-xs text-slate-700" aria-live="polite">
          {value ? (
            <dl className="grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
              <dt className="font-medium text-slate-500">HEX</dt>
              <dd className="font-mono">{hex.toUpperCase()}</dd>
              <dt className="font-medium text-slate-500">RGB</dt>
              <dd className="font-mono">{formatRgb(value)}</dd>
              <dt className="font-medium text-slate-500">HSL</dt>
              <dd className="font-mono">{formatHsl(hsl)}</dd>
            </dl>
          ) : (
            <p className="leading-snug text-slate-600">{emptyHint}</p>
          )}
        </div>
      </div>

      <div className="mt-3 grid grid-cols-[auto_1fr] items-end gap-2">
        <div>
          <label htmlFor={`${id}-picker`} className="block text-xs font-medium text-slate-600">
            Picker
          </label>
          <input
            id={`${id}-picker`}
            type="color"
            className="mt-1 h-[34px] w-12 cursor-pointer rounded-md border border-slate-300 bg-white p-0.5"
            value={hex || '#000000'}
            onChange={(e) => onChange(hexToRgb(e.target.value), `${id}-picker`)}
          />
        </div>
        <div>
          <label htmlFor={`${id}-hex`} className="block text-xs font-medium text-slate-600">
            HEX
          </label>
          <input
            id={`${id}-hex`}
            type="text"
            inputMode="text"
            autoComplete="off"
            spellCheck="false"
            maxLength={7}
            placeholder="#1e90ff"
            className="field-input mt-1 font-mono"
            value={hexDraft}
            onChange={onHexChange}
            onBlur={onHexBlur}
            aria-invalid={hexError ? 'true' : undefined}
            aria-describedby={hexError ? `${id}-err-hex` : undefined}
          />
        </div>
      </div>

      <div className="mt-2 grid grid-cols-3 gap-2">
        {CHANNELS.map(([c, name]) => (
          <div key={c}>
            <label htmlFor={`${id}-${c}`} className="block text-xs font-medium text-slate-600">
              {name} <span className="sr-only">(0 to 255)</span>
            </label>
            <input
              id={`${id}-${c}`}
              type="number"
              inputMode="numeric"
              min={0}
              max={255}
              step={1}
              className="field-input mt-1 font-mono"
              value={drafts[c]}
              placeholder="0–255"
              onChange={onChannelChange(c)}
              aria-invalid={channelErrors[c] ? 'true' : undefined}
              aria-describedby={channelErrors[c] ? `${id}-err-${c}` : undefined}
            />
          </div>
        ))}
      </div>

      {errorList.length > 0 ? (
        <div className="mt-2 space-y-0.5 text-xs font-medium text-red-700" role="alert">
          {hexError ? <p id={`${id}-err-hex`}>HEX: {hexError}</p> : null}
          {CHANNELS.map(([c, name]) =>
            channelErrors[c] ? (
              <p key={c} id={`${id}-err-${c}`}>
                {name}: {channelErrors[c]}
              </p>
            ) : null,
          )}
        </div>
      ) : null}
    </fieldset>
  );
}

function toDrafts(value) {
  return value ? { r: String(value.r), g: String(value.g), b: String(value.b) } : { r: '', g: '', b: '' };
}

export default memo(ColorField);
