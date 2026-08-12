import { useEffect, useState } from 'react';

/**
 * Minimal route-chunk indicator — thin brand bar only.
 * Hidden if the chunk resolves quickly (no spinner / no fullscreen takeover).
 */
export default function RouteProgress({ delayMs = 180 }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delayMs);
    return () => clearTimeout(t);
  }, [delayMs]);

  if (!visible) {
    return <div className="w-full h-full min-h-0" aria-hidden />;
  }

  return (
    <div className="relative w-full h-full min-h-0" role="status" aria-label="Loading">
      <div className="absolute top-0 inset-x-0 z-10 h-[2px] overflow-hidden rounded-full">
        <span className="crm-table-loader__progress-bar block h-full" />
      </div>
    </div>
  );
}
