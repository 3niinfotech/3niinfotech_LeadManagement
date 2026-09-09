import dayjs from 'dayjs';
import { FiClock, FiCalendar, FiUsers, FiActivity } from 'react-icons/fi';

const TONE = {
  success: { dot: 'bg-emerald-500', bg: 'bg-emerald-50', text: 'text-emerald-800', border: 'border-emerald-200' },
  warning: { dot: 'bg-amber-500', bg: 'bg-amber-50', text: 'text-amber-900', border: 'border-amber-200' },
  caution: { dot: 'bg-orange-500', bg: 'bg-orange-50', text: 'text-orange-900', border: 'border-orange-200' },
  danger: { dot: 'bg-rose-500', bg: 'bg-rose-50', text: 'text-rose-800', border: 'border-rose-200' },
  neutral: { dot: 'bg-slate-400', bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200' },
};

function Metric({ icon: Icon, label, value, sub }) {
  return (
    <div className="crm-avail-metric">
      <div className="crm-avail-metric__icon" aria-hidden>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0">
        <p className="crm-avail-metric__label">{label}</p>
        <p className="crm-avail-metric__value">{value}</p>
        {sub ? <p className="crm-avail-metric__sub">{sub}</p> : null}
      </div>
    </div>
  );
}

export default function AvailabilityPanel({ data, loading }) {
  if (loading && !data) {
    return (
      <div className="px-4 py-8 text-center text-[12px] text-text-muted">
        Loading availability…
      </div>
    );
  }

  const tone = TONE[data?.tone] || TONE.neutral;
  const workload = data?.workload;
  const pct = workload?.maxActiveLeads
    ? Math.min(100, Math.round((workload.activeLeads / workload.maxActiveLeads) * 100))
    : 0;

  const nextAppt = data?.schedule?.nextAppointment;
  const nextApptLabel = nextAppt?.time
    ? dayjs(nextAppt.time).format('h:mm A')
    : '—';
  const nextApptSub = nextAppt?.title || (nextAppt?.time ? 'Upcoming' : 'None scheduled');

  return (
    <div className="crm-avail-panel">
      <div className={`crm-avail-hero ${tone.bg} ${tone.border}`}>
        <span className={`crm-avail-hero__dot ${tone.dot}`} aria-hidden />
        <div className="min-w-0">
          <p className={`crm-avail-hero__title ${tone.text}`}>{data?.label || 'Unavailable'}</p>
          <p className="crm-avail-hero__detail">{data?.whyStatus || data?.currentActivity || data?.detail || '—'}</p>
        </div>
      </div>

      {data?.exclusions?.length > 0 && (
        <ul className="px-4 pt-2 text-[11px] text-text-secondary space-y-0.5">
          {data.exclusions.map((item) => (
            <li key={item}>• {item}</li>
          ))}
        </ul>
      )}

      {workload && (
        <div className="crm-avail-capacity px-4 pt-3 pb-1">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-medium text-text-secondary">Active workload</span>
            <span className="tabular-nums text-text-muted">
              {workload.activeLeads} / {workload.maxActiveLeads}
            </span>
          </div>
          <div className="crm-avail-capacity__track mt-1.5" aria-hidden>
            <div
              className="crm-avail-capacity__fill"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>
      )}

      <div className="crm-avail-grid px-4 py-3">
        <Metric
          icon={FiClock}
          label="Working hours"
          value={data?.workingHoursToday || '—'}
        />
        <Metric
          icon={FiCalendar}
          label="Today"
          value={`${data?.schedule?.todayAppointments ?? 0} appt${(data?.schedule?.todayAppointments ?? 0) === 1 ? '' : 's'}`}
          sub={nextAppt?.time ? `Next ${nextApptLabel}` : undefined}
        />
        <Metric
          icon={FiUsers}
          label="Daily assigned"
          value={workload ? `${workload.todayAssigned} / ${workload.maxDailyCapacity}` : '—'}
        />
        <Metric
          icon={FiActivity}
          label="Hot leads"
          value={workload ? `${workload.hotLeads} / ${workload.hotLeadCapacity}` : '—'}
        />
        <Metric
          icon={FiActivity}
          label="Next appointment"
          value={nextApptLabel}
          sub={nextApptSub}
        />
      </div>

      {(data?.currentSession || data?.currentAppointment || data?.leave) && (
        <div className="px-4 pb-2 space-y-1.5 text-[11px] text-text-secondary border-t border-border/60 pt-2">
          {data.currentSession && (
            <p>Session active since {dayjs(data.currentSession.startedAt).format('h:mm A')}</p>
          )}
          {data.currentAppointment && (
            <p>Appointment: {data.currentAppointment.title || 'In progress'}</p>
          )}
          {data.leave && (
            <p>
              Leave until {dayjs(data.leave.endDate).format('DD MMM YYYY')}
              {data.leave.reason ? ` — ${data.leave.reason}` : ''}
            </p>
          )}
        </div>
      )}

      <div className="px-4 py-2.5 border-t border-border/70 bg-page/30">
        <p className="text-[10px] text-text-muted leading-snug">
          Calculated from working hours, leave, calendar, sessions, and capacity.
          {data?.evaluatedAt ? ` Updated ${dayjs(data.evaluatedAt).format('h:mm:ss A')}.` : ''}
        </p>
      </div>
    </div>
  );
}
