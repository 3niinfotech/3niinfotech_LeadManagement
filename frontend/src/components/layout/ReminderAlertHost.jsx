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
 * Full-attention reminder popup — appears when a REMINDER notification arrives in realtime.
 */
export default function ReminderAlertHost() {
  const dispatch = useDispatch();
  const alert = useSelector(selectLiveReminderAlert);

  useEffect(() => {
    if (!alert) return undefined;
    const t = setTimeout(() => dispatch(clearLiveReminderAlert()), 14000);
    return () => clearTimeout(t);
  }, [alert, dispatch]);

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence>
      {alert ? (
        <motion.div
          key={alert.id || alert.title}
          initial={{ opacity: 0, y: -16, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.98 }}
          transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-[1600] top-4 right-4 left-4 sm:left-auto sm:w-[min(400px,calc(100vw-2rem))]"
          role="alertdialog"
          aria-live="assertive"
        >
          <div className="crm-reminder-alert overflow-hidden rounded-2xl border border-warning/30 bg-card-bg shadow-[0_18px_50px_rgba(15,23,42,0.18)]">
            <div className="h-1 w-full bg-gradient-to-r from-warning via-orange-400 to-brand" />
            <div className="flex items-start gap-3 p-4">
              <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning-soft text-warning">
                <FiClock className="h-5 w-5" strokeWidth={2.2} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1 rounded-md bg-warning-soft px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-warning">
                    <FiBell className="h-3 w-3" />
                    Reminder
                  </span>
                </div>
                <p className="mt-1.5 text-[14px] font-semibold text-text leading-snug">
                  {alert.title}
                </p>
                {alert.message ? (
                  <p className="mt-1 text-[12px] text-text-secondary leading-snug line-clamp-3">
                    {alert.message}
                  </p>
                ) : null}
                <div className="mt-3 flex items-center gap-2">
                  {alert.link ? (
                    <Link
                      to={alert.link}
                      onClick={() => dispatch(clearLiveReminderAlert())}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-[12px] font-semibold text-white hover:opacity-95"
                    >
                      Open now
                      <FiArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => dispatch(clearLiveReminderAlert())}
                    className="rounded-lg px-2.5 py-1.5 text-[12px] font-medium text-text-muted hover:bg-row-hover hover:text-text"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
              <button
                type="button"
                aria-label="Close reminder"
                onClick={() => dispatch(clearLiveReminderAlert())}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-text-muted hover:bg-row-hover hover:text-text"
              >
                <FiX className="h-4 w-4" />
              </button>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>,
    document.body,
  );
}
