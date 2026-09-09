import { useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/authSlice';
import { useGetMyAvailabilityQuery } from '../../features/assignment/redux/assignmentApiSlice';
import HeaderActionPopover from './HeaderActionPopover';
import AvailabilityPanel from './header-panels/AvailabilityPanel';
import './styles/availability-panel.theme.css';

const PRESENCE_ROLES = new Set(['counsellor', 'team_leader']);

const PILL_TONE = {
  success: 'text-emerald-700 bg-emerald-50 border-emerald-200/80',
  warning: 'text-amber-800 bg-amber-50 border-amber-200/80',
  caution: 'text-orange-800 bg-orange-50 border-orange-200/80',
  danger: 'text-rose-700 bg-rose-50 border-rose-200/80',
  neutral: 'text-text-secondary bg-page border-border/80',
};

const DOT_TONE = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  caution: 'bg-orange-500',
  danger: 'bg-rose-500',
  neutral: 'bg-text-muted',
};

/**
 * Read-only system-derived counsellor availability indicator.
 */
export default function NavbarPresenceStatus() {
  const user = useSelector(selectUser);
  const btnRef = useRef(null);
  const [open, setOpen] = useState(false);
  const visible = PRESENCE_ROLES.has(user?.role?.slug) && Boolean(user?.branchId);

  const { data, isFetching, isLoading } = useGetMyAvailabilityQuery(undefined, {
    skip: !visible,
    pollingInterval: 60000,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });

  if (!visible) return null;

  const tone = data?.tone || 'neutral';
  const label = data?.label || (isLoading ? '…' : 'Available');
  const pillClass = PILL_TONE[tone] || PILL_TONE.neutral;
  const dotClass = DOT_TONE[tone] || DOT_TONE.neutral;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        className={`
          inline-flex items-center gap-1.5 h-9 max-w-[148px] sm:max-w-[168px]
          rounded-lg border px-2.5 text-[11px] font-semibold
          transition-colors duration-200 focus-ring shrink-0
          ${pillClass} ${isFetching ? 'opacity-90' : ''}
        `}
        onClick={() => setOpen((v) => !v)}
        title="Your availability (system calculated)"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        <span className={`h-1.5 w-1.5 rounded-full shrink-0 ${dotClass}`} aria-hidden />
        <span className="truncate">{label}</span>
      </button>

      <HeaderActionPopover
        open={open}
        onClose={() => setOpen(false)}
        anchorEl={btnRef.current}
        title="Availability"
        width={320}
        maxHeight={420}
      >
        <AvailabilityPanel data={data} loading={isLoading && !data} />
      </HeaderActionPopover>
    </>
  );
}
