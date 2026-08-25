import { useEffect, useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { FiChevronDown, FiRadio } from 'react-icons/fi';
import { selectUser } from '../../redux/slices/authSlice';
import {
  useHeartbeatMutation,
  useUpdatePresenceMutation,
} from '../../features/assignment/redux/assignmentApiSlice';
import toastService from '../../services/toast/toast.service';

const PRESENCE_ROLES = new Set(['counsellor', 'team_leader']);

/** Manual overrides only — Free / With student are automatic via heartbeat + session. */
const STATUS_OPTIONS = [
  { value: 'AVAILABLE', label: 'Free (auto)', hint: 'Resume automatic Free', tone: 'success' },
  { value: 'LUNCH', label: 'Lunch', hint: 'Hold ~1 hour, then Free', tone: 'caution' },
  { value: 'BREAK', label: 'Break', hint: 'Hold ~20 min, then Free', tone: 'caution' },
  { value: 'MEETING', label: 'Meeting', hint: 'Hold ~2 hours, then Free', tone: 'danger' },
  { value: 'BUSY', label: 'Busy', hint: 'Not taking walk-ins (~2h)', tone: 'danger' },
  { value: 'LEAVE', label: 'Leave', hint: 'Until you set Free again', tone: 'danger' },
  { value: 'OFFLINE', label: 'Offline', hint: 'Appear offline now', tone: 'neutral' },
];

const DISPLAY = {
  AVAILABLE: { label: 'Free', tone: 'success' },
  IN_COUNSELLING: { label: 'With student', tone: 'warning' },
  BUSY: { label: 'Busy', tone: 'danger' },
  LUNCH: { label: 'Lunch', tone: 'caution' },
  BREAK: { label: 'Break', tone: 'caution' },
  MEETING: { label: 'Meeting', tone: 'danger' },
  LEAVE: { label: 'Leave', tone: 'danger' },
  OFFLINE: { label: 'Offline', tone: 'neutral' },
  TRAINING: { label: 'Training', tone: 'danger' },
  DND: { label: 'Busy', tone: 'danger' },
  WFH: { label: 'Free', tone: 'success' },
};

const TONE_CLASS = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  warning: 'bg-amber-50 text-amber-800 border-amber-200',
  caution: 'bg-orange-50 text-orange-800 border-orange-200',
  danger: 'bg-rose-50 text-rose-700 border-rose-200',
  neutral: 'bg-slate-100 text-slate-600 border-slate-200',
};

/**
 * Auto Free online · Busy in counselling · Offline when away.
 * Optional Lunch / Leave override only.
 */
export default function NavbarPresenceStatus() {
  const user = useSelector(selectUser);
  const [heartbeat] = useHeartbeatMutation();
  const [updatePresence, { isLoading }] = useUpdatePresenceMutation();
  const [status, setStatus] = useState('AVAILABLE');
  const [open, setOpen] = useState(false);

  const visible = PRESENCE_ROLES.has(user?.role?.slug) && Boolean(user?.branchId);

  useEffect(() => {
    if (!visible) return undefined;
    let cancelled = false;
    const sync = () => {
      heartbeat()
        .unwrap()
        .then((res) => {
          if (!cancelled && res?.status) setStatus(res.status);
        })
        .catch(() => {});
    };
    sync();
    const id = setInterval(sync, 60000);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [visible, heartbeat]);

  const current = useMemo(() => {
    const d = DISPLAY[status] || DISPLAY.AVAILABLE;
    return d;
  }, [status]);

  if (!visible) return null;

  const selectStatus = async (next) => {
    setOpen(false);
    if (next === status) return;
    try {
      const res = await updatePresence({ status: next }).unwrap();
      setStatus(res?.status || next);
      toastService.success(`Status: ${STATUS_OPTIONS.find((o) => o.value === next)?.label || next}`);
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not update status');
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-semibold ${TONE_CLASS[current.tone] || TONE_CLASS.neutral}`}
        onClick={() => setOpen((v) => !v)}
        title="Auto Free when online. Optional Lunch / Leave override."
        disabled={isLoading}
      >
        <FiRadio size={12} />
        {current.label}
        <FiChevronDown size={12} />
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-[1190]" aria-label="Close" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1.5 z-[1200] w-60 rounded-xl border border-border bg-card-bg shadow-lg p-1.5">
            <p className="px-2 py-1 text-[10px] uppercase tracking-wide text-text-muted font-semibold">Auto status</p>
            <p className="px-2 pb-2 text-[11px] text-text-muted leading-snug">
              Free while logged in · With student in counselling · Offline when you leave. Optional override:
            </p>
            {STATUS_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                className={`w-full text-left rounded-lg px-2.5 py-2 hover:bg-surface-hover ${status === opt.value ? 'bg-surface-hover' : ''}`}
                onClick={() => selectStatus(opt.value)}
              >
                <span className="block text-sm font-medium text-text">{opt.label}</span>
                <span className="block text-[11px] text-text-muted">{opt.hint}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
