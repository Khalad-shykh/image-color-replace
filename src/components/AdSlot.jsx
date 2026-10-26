import { useEffect, useRef } from 'react';
import { ADS } from '../config/ads.js';

/**
 * A Google AdSense display unit.
 *
 * Renders nothing at all unless a valid publisher ID and a slot ID for this
 * placement are configured (see src/config/ads.js). When enabled it reserves
 * vertical space to limit layout shift, is clearly labelled as an
 * advertisement, and is only placed in content areas away from the editor's
 * controls.
 */
export default function AdSlot({ placement, className = '' }) {
  const slot = ADS.slots[placement];
  const pushed = useRef(false);

  useEffect(() => {
    if (!slot || pushed.current) return;
    pushed.current = true;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch {
      // Blocked by an ad blocker or not yet allowed by consent: leave the space empty.
    }
  }, [slot]);

  if (!ADS.enabled || !slot) return null;

  return (
    <aside aria-label="Advertisement" className={`mx-auto my-10 w-full max-w-3xl ${className}`}>
      <p className="mb-1 text-center text-[11px] tracking-wide text-slate-500 uppercase">Advertisement</p>
      <div className="min-h-[280px] w-full">
        <ins
          className="adsbygoogle"
          style={{ display: 'block' }}
          data-ad-client={ADS.client}
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </aside>
  );
}
