import { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { motion, AnimatePresence } from 'framer-motion';
import { FiBell, FiClock, FiX, FiArrowRight } from 'react-icons/fi';
import {
  clearLiveReminderAlert,
  selectLiveReminderAlert,
} from '../../modules/reminder/redux/reminderSlice';

/**
 * Lean & Modern notification popup — appears when a REMINDER arrives in realtime.
 * Positioned cleanly below the topbar without blocking navigation controls.
 */
export default function ReminderAlertHost() {
  const dispatch = useDispatch();
  const alert = useSelector(selectLiveReminderAlert);

  useEffect(() => {
    if (!alert) return undefined;
    const t = setTimeout(() => dispatch(clearLiveReminderAlert()), 12000);
    return () => clearTimeout(t);
  }, [alert, dispatch]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {alert ? (
        <motion.div
          key={alert.id || alert.title}
          initial={{ opacity: 0, y: -12, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.97 }}
          transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-[1600] top-[74px] right-4 left-4 sm:left-auto sm:w-[340px] pointer-events-auto"
          role="alertdialog"
          aria-live="assertive"
        >
          <div className="overflow-hidden rounded-xl border border-amber-200/90 bg-white/95 dark:bg-slate-900/95 dark:border-amber-900/60 backdrop-blur-md shadow-[0_10px_30px_rgba(15,23,42,0.12)] transition-all">
            <div className="flex items-start gap-2.5 p-3">
              {/* Lean Compact Icon Badge */}
              <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-600 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/70">
                <FiClock className="h-3.5 w-3.5" strokeWidth={2.4} />
              </div>

              {/* Notification Content & Inline Actions */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="inline-flex items-center gap-1 text-[9.5px] font-extrabold uppercase tracking-wider text-amber-700 bg-amber-100/70 dark:bg-amber-950/80 dark:text-amber-300 px-1.5 py-0.5 rounded">
                    <FiBell className="h-2.5 w-2.5" />
                    Reminder
                  </span>
                  <button
                    type="button"
                    aria-label="Close"
                    onClick={() => dispatch(clearLiveReminderAlert())}
                    className="flex h-5 w-5 shrink-0 items-center justify-center rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <FiX className="h-3.5 w-3.5" />
                  </button>
                </div>

                <h4 className="mt-1 text-[13px] font-bold text-slate-900 dark:text-slate-100 leading-snug truncate" title={alert.title}>
                  {alert.title}
                </h4>

                {alert.message ? (
                  <p className="mt-0.5 text-[11.5px] text-slate-600 dark:text-slate-400 leading-snug line-clamp-2">
                    {alert.message}
                  </p>
                ) : null}

                <div className="mt-2.5 flex items-center gap-2">
                  {alert.link ? (
                    <Link
                      to={alert.link}
                      onClick={() => dispatch(clearLiveReminderAlert())}
                      className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1 text-[11px] font-bold text-white hover:bg-blue-700 shadow-2xs transition-colors"
                    >
                      Open now
                      <FiArrowRight className="h-3 w-3" />
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => dispatch(clearLiveReminderAlert())}
                    className="rounded-md px-2 py-1 text-[11px] font-medium text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>

            {/* Subtle animated auto-dismiss progress bar */}
            <div className="h-[2px] w-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <motion.div
                initial={{ width: '100%' }}
                animate={{ width: '0%' }}
                transition={{ duration: 12, ease: 'linear' }}
                className="h-full bg-amber-500"
              />
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
