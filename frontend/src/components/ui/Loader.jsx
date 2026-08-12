const SIZES = {
  xs: { box: 'w-7 h-7', core: 'w-1.5 h-1.5', satellite: 'w-1 h-1', reverseInset: 'inset-[14%]' },
  sm: { box: 'w-10 h-10', core: 'w-2 h-2', satellite: 'w-1.5 h-1.5', reverseInset: 'inset-[13%]' },
  md: { box: 'w-12 h-12', core: 'w-2.5 h-2.5', satellite: 'w-1.5 h-1.5', reverseInset: 'inset-[12%]' },
  lg: { box: 'w-16 h-16', core: 'w-3.5 h-3.5', satellite: 'w-2 h-2', reverseInset: 'inset-[11%]' },
};

const DOT_SIZES = { xs: 'w-1 h-1', sm: 'w-1.5 h-1.5', md: 'w-2 h-2', lg: 'w-2.5 h-2.5' };

/** Compact ring — buttons & inline actions */
function SpinnerRing({ size = 'md', className = '' }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <span
      className={`inline-block rounded-full crm-loader-spin border-2 border-slate-200 border-t-primary-600 ${s.box} ${className}`}
      aria-hidden
    />
  );
}

/** Dual-arc brand spinner with pulsing core */
function BrandSpinner({ size = 'md', className = '' }) {
  const s = SIZES[size] || SIZES.md;
  return (
    <span
      className={`crm-brand-spinner inline-flex items-center justify-center ${s.box} ${className}`}
      aria-hidden
    >
      <span className="crm-brand-spinner__glow" />
      <span className="crm-brand-spinner__track" />
      <span className="crm-brand-spinner__arc" />
      <span className={`crm-brand-spinner__arc crm-brand-spinner__arc--inner ${s.reverseInset}`} />
      <span className={`crm-brand-spinner__core ${s.core}`} />
    </span>
  );
}

function DotsLoader({ size = 'md' }) {
  const dot = DOT_SIZES[size] || DOT_SIZES.md;
  return (
    <span className="inline-flex items-center gap-1.5" aria-hidden>
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className={`rounded-full bg-primary-600 crm-dot-wave ${dot}`}
          style={{ animationDelay: `${i * 0.12}s` }}
        />
      ))}
    </span>
  );
}

/** Premium flow loader — gradient arcs + orbiting satellite (fullscreen / panels) */
function FlowLoader({ size = 'lg' }) {
  const s = SIZES[size] || SIZES.lg;
  return (
    <span className={`crm-flow-loader inline-flex items-center justify-center ${s.box}`} aria-hidden>
      <span className="crm-flow-loader__halo" />
      <span className="crm-flow-loader__track" />
      <span className="crm-flow-loader__spinner" />
      <span className={`crm-flow-loader__spinner crm-flow-loader__spinner--reverse ${s.reverseInset}`} />
      <span className="crm-flow-loader__orbit">
        <span className={`crm-flow-loader__satellite ${s.satellite}`} />
      </span>
      <span className={`crm-flow-loader__core ${s.core}`} />
    </span>
  );
}

/** @deprecated use FlowLoader — alias for backward compatibility */
const OrbitLoader = FlowLoader;

function LoadingLabel({ label }) {
  if (!label) return null;
  return (
    <p className="crm-loading-label text-sm font-medium text-text-secondary tracking-wide">
      <span>{label}</span>
      <span className="crm-loading-ellipsis" aria-hidden>
        <span>.</span>
        <span>.</span>
        <span>.</span>
      </span>
    </p>
  );
}

const VARIANTS = {
  spinner: BrandSpinner,
  ring: SpinnerRing,
  dots: DotsLoader,
  flow: FlowLoader,
  orbit: FlowLoader,
};

/**
 * Core loader — flow (default for pages), brand spinner, ring, or dots.
 */
export default function Loader({
  size = 'md',
  variant = 'spinner',
  label,
  className = '',
}) {
  const Visual = VARIANTS[variant] || BrandSpinner;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading"
      className={`crm-loader-root inline-flex flex-col items-center justify-center gap-3 ${className}`}
    >
      <Visual size={size} />
      <LoadingLabel label={label} />
      {label && <span className="sr-only">{label}</span>}
    </div>
  );
}

export { SpinnerRing, DotsLoader, BrandSpinner, FlowLoader, OrbitLoader, LoadingLabel };
