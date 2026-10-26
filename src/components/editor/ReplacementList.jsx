import { memo } from 'react';
import Icon from '../Icon.jsx';
import { rgbToHex } from '../../lib/color.js';

const Swatch = ({ color }) => (
  <span className="inline-block h-5 w-5 shrink-0 rounded border border-slate-300" style={{ backgroundColor: rgbToHex(color) }} />
);

/** Lists kept replacements and offers to lock in the current one. */
function ReplacementList({ ops, hasActive, onCommit, onCancelActive, onRemove }) {
  return (
    <section aria-labelledby="replacements-heading">
      <h3 id="replacements-heading" className="text-sm font-semibold text-slate-900">
        Replacements
      </h3>
      <p className="mt-0.5 text-xs text-slate-600">
        The current replacement updates live. Keep it to replace another color on top of it.
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button type="button" className="btn-secondary" onClick={onCommit} disabled={!hasActive}>
          <Icon name="plus" className="h-4 w-4" />
          Keep &amp; pick another color
        </button>
        {hasActive ? (
          <button type="button" className="btn-ghost" onClick={onCancelActive}>
            Discard current
          </button>
        ) : null}
      </div>
      {ops.length > 0 ? (
        <ol className="mt-3 space-y-1.5" aria-label="Kept replacements">
          {ops.map((op, i) => {
            const from = rgbToHex(op.source).toUpperCase();
            const to = rgbToHex(op.target).toUpperCase();
            return (
              <li key={`${i}-${from}-${to}`} className="flex items-center gap-2 rounded-md bg-slate-50 px-2 py-1.5 text-xs">
                <span className="w-4 text-slate-500">{i + 1}.</span>
                <Swatch color={op.source} />
                <span className="font-mono">{from}</span>
                <span aria-hidden="true">→</span>
                <span className="sr-only">replaced with</span>
                <Swatch color={op.target} />
                <span className="font-mono">{to}</span>
                <span className="ml-auto text-slate-500">tol. {op.tolerance}</span>
                <button
                  type="button"
                  className="rounded p-1 text-slate-500 hover:bg-slate-200 hover:text-red-700"
                  onClick={() => onRemove(i)}
                  aria-label={`Remove replacement ${i + 1} (${from} to ${to})`}
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              </li>
            );
          })}
        </ol>
      ) : null}
    </section>
  );
}

export default memo(ReplacementList);
