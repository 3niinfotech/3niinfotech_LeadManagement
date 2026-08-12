import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectTheme } from '../../redux/slices/uiSlice';
import { getLoaderTheme } from '../../theme/feedback';
import Loader from './Loader';

/**
 * In-page loader — fills the content area only (sidebar + navbar stay visible).
 * Never uses position:fixed / full viewport.
 */
export default function PageLoader({
  label = 'Loading',
  className = '',
  compact = false,
}) {
  const theme = useSelector(selectTheme);
  const loaderTheme = getLoaderTheme(theme);

  return (
    <div
      className={`crm-page-loader relative flex flex-1 flex-col items-center justify-center w-full h-full min-h-[240px] overflow-hidden rounded-xl border border-card-border bg-card-bg ${className}`.trim()}
      role="status"
      aria-live="polite"
      aria-label={label}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 70% 55% at 50% 42%, color-mix(in srgb, var(--brand) 10%, transparent) 0%, transparent 68%),
            linear-gradient(180deg, color-mix(in srgb, var(--brand) 4%, var(--card-bg)) 0%, var(--card-bg) 100%)
          `,
        }}
      />

      <span className="crm-page-loader__ring" aria-hidden />
      <span className="crm-page-loader__ring crm-page-loader__ring--delayed" aria-hidden />

      <motion.div
        className="relative z-10 flex flex-col items-center gap-3"
        initial={{ opacity: 0, y: 6, scale: 0.94 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', damping: 22, stiffness: 280, mass: 0.7 }}
      >
        <div
          className="flex items-center justify-center rounded-2xl border border-border/80 bg-card-bg/90 p-3.5 shadow-sm"
          style={{ boxShadow: loaderTheme.card?.shadow || 'var(--shadow-loader-card)' }}
        >
          <Loader size={compact ? 'sm' : 'md'} variant="flow" />
        </div>
        {label && (
          <p className="text-[12px] font-medium tracking-wide text-text-muted">
            {label}
            <span className="crm-loading-ellipsis" aria-hidden>
              <span>.</span>
              <span>.</span>
              <span>.</span>
            </span>
          </p>
        )}
      </motion.div>
    </div>
  );
}
