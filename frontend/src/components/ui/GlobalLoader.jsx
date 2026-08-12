import { motion } from 'framer-motion';
import { useSelector } from 'react-redux';
import { selectTheme } from '../../redux/slices/uiSlice';
import { getLoaderTheme } from '../../theme/feedback';
import Loader from './Loader';

/**
 * Fullscreen boot/auth loader only (login + AuthInitGate).
 * For in-app page loads use PageLoader; for grids use TableLoader.
 */
export default function GlobalLoader({ fullscreen = true }) {
  const theme = useSelector(selectTheme);
  const loaderTheme = getLoaderTheme(theme);
  const overlayBg = loaderTheme.overlay.bg;

  const backdrop = (
    <motion.div
      className="absolute inset-0 overflow-hidden"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      style={{
        backgroundColor: overlayBg,
        backdropFilter: `blur(${loaderTheme.overlay.blur})`,
        WebkitBackdropFilter: `blur(${loaderTheme.overlay.blur})`,
      }}
    >
      <span className="crm-global-loader__ripple" aria-hidden />
      <span className="crm-global-loader__ripple crm-global-loader__ripple--delayed" aria-hidden />
    </motion.div>
  );

  const spinner = (
    <motion.div
      className="relative flex flex-col items-center"
      initial={{ opacity: 0, scale: 0.82, y: 8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', damping: 24, stiffness: 320, mass: 0.8 }}
    >
      <Loader size="lg" variant="flow" />
    </motion.div>
  );

  if (fullscreen) {
    return (
      <div className="fixed inset-0 z-[1080] flex items-center justify-center">
        {backdrop}
        <div className="relative z-10">{spinner}</div>
      </div>
    );
  }

  return (
    <div className="relative flex items-center justify-center h-full min-h-0 w-full flex-1">
      {backdrop}
      <div className="relative z-10">{spinner}</div>
    </div>
  );
}

/** Inline overlay — tables, panels, modals */
export function LoaderOverlay({ className = '' }) {
  const theme = useSelector(selectTheme);
  const loaderTheme = getLoaderTheme(theme);
  const overlayBg = loaderTheme.overlay.bg;

  return (
    <div className={`absolute inset-0 z-20 flex items-center justify-center ${className}`.trim()}>
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: overlayBg,
          backdropFilter: `blur(${loaderTheme.overlay.blur})`,
          WebkitBackdropFilter: `blur(${loaderTheme.overlay.blur})`,
        }}
      />
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.2 }}
      >
        <Loader size="md" variant="flow" />
      </motion.div>
    </div>
  );
}
