import { Link } from 'react-router-dom';
import {
  FiAlertTriangle,
  FiArrowUpRight,
  FiClock,
  FiRefreshCw,
  FiTrendingUp,
  FiUser,
  FiZap,
} from 'react-icons/fi';
import Badge from '../../../components/ui/Badge';
import { ROUTES } from '../../../config/routes';
import {
  SLA_STATUS_META,
  formatWaitMinutes,
  slaProgressPercent,
} from '../utils/sla.utils';

export function SlaMetric({ icon: Icon, label, value, tone = 'neutral', active, onClick }) {
  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      className={`crm-sla-metric crm-sla-metric--${tone} ${active ? 'crm-sla-metric--active' : ''}`}
      onClick={onClick}
    >
      <div className="crm-sla-metric__icon" aria-hidden>
        <Icon className="w-3.5 h-3.5" />
      </div>
      <div className="min-w-0 text-left">
        <p className="crm-sla-metric__label">{label}</p>
        <p className="crm-sla-metric__value">{value}</p>
      </div>
    </Tag>
  );
}

export function SlaHero({ summary, config, slaEnabled = true }) {
  const risk = (summary?.dueSoon ?? 0) + (summary?.overdue ?? 0) + (summary?.breached ?? 0);
  const total = (summary?.onTrack ?? 0) + risk + (summary?.completed ?? 0);
  const onTrackPct = total ? Math.round(((summary?.onTrack ?? 0) / total) * 100) : 100;

  let tone = 'success';
  let title = 'SLA performance healthy';
  let detail = 'Response times are within configured thresholds.';
  if (!slaEnabled) {
    tone = 'neutral';
    title = 'SLA engine disabled';
    detail = 'Enable SLA in assignment config to track response times.';
  } else if (risk > 0) {
    tone = (summary?.breached ?? 0) > 0 || (summary?.overdue ?? 0) > 0 ? 'danger' : 'warning';
    title = `${risk} active SLA alert${risk === 1 ? '' : 's'}`;
    detail = 'Warnings, breaches, and escalations follow your live assignment config.';
  }

  const mandatory = config?.mandatoryReassignMinutes ?? 30;

  return (
    <div className="crm-sla-hero-wrap">
      <div className={`crm-sla-hero crm-sla-hero--${tone}`}>
        <span className={`crm-sla-hero__dot crm-sla-hero__dot--${tone}`} aria-hidden />
        <div className="min-w-0 flex-1">
          <p className="crm-sla-hero__title">{title}</p>
          <p className="crm-sla-hero__detail">{detail}</p>
        </div>
        {config && slaEnabled && (
          <div className="crm-sla-hero__thresholds">
            <span title="Warning">⚠ {config.warningMinutes}m</span>
            <span title="Escalate">↑ {config.escalateMinutes}m</span>
            <span title="Mandatory">⏱ {mandatory}m</span>
          </div>
        )}
      </div>

      {slaEnabled && total > 0 && (
        <div className="crm-sla-hero-capacity">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="font-medium text-text-secondary">On-track rate</span>
            <span className="tabular-nums text-text-muted">{onTrackPct}%</span>
          </div>
          <div className="crm-sla-hero-capacity__track" aria-hidden>
            <div
              className={`crm-sla-hero-capacity__fill crm-sla-hero-capacity__fill--${tone}`}
              style={{ width: `${onTrackPct}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}

export function SlaEnquiryRow({ row, showCounsellor, mandatoryMinutes = 30 }) {
  const meta = SLA_STATUS_META[row.status] || SLA_STATUS_META.ON_TRACK;
  const name = [row.firstName, row.lastName].filter(Boolean).join(' ').trim() || '—';
  const isActive = row.status !== 'COMPLETED';
  const progress = isActive ? slaProgressPercent(row.waitMinutes, mandatoryMinutes) : 100;
  const remainingLabel = row.status === 'COMPLETED'
    ? 'Done'
    : row.remainingMinutes > 0
      ? `${formatWaitMinutes(row.remainingMinutes)} left`
      : row.overdueMinutes
        ? `+${formatWaitMinutes(row.overdueMinutes)} over`
        : '—';

  return (
    <li className={`crm-sla-row crm-sla-row--${meta.tone}`}>
      <div className="crm-sla-row__main">
        <div className="crm-sla-row__identity">
          <Link to={ROUTES.ENQUIRY_DETAIL(row.enquiryId)} className="crm-sla-row__code">
            {row.enquiryCode}
            <FiArrowUpRight className="w-3 h-3 opacity-60" />
          </Link>
          <p className="crm-sla-row__name">{name}</p>
          {showCounsellor && (
            <p className="crm-sla-row__counsellor">
              <FiUser className="w-3 h-3" />
              {row.assignedTo || 'Unassigned'}
            </p>
          )}
        </div>

        <div className="crm-sla-row__status">
          <Badge color={meta.tone === 'neutral' ? 'secondary' : meta.tone} className="text-[10px]">
            {meta.label}
          </Badge>
          {row.priority && (
            <span className={`crm-sla-priority crm-sla-priority--${String(row.priority).toLowerCase()}`}>
              {row.priority}
            </span>
          )}
        </div>

        <div className="crm-sla-row__timing">
          <div className="crm-sla-row__time-block">
            <span className="crm-sla-row__time-label">Wait</span>
            <span className="crm-sla-row__time-value">{formatWaitMinutes(row.waitMinutes)}</span>
          </div>
          <div className="crm-sla-row__time-block">
            <span className="crm-sla-row__time-label">Remaining</span>
            <span className={`crm-sla-row__time-value ${row.overdueMinutes ? 'crm-sla-row__time-value--danger' : ''}`}>
              {remainingLabel}
            </span>
          </div>
        </div>

        {isActive && (
          <div className="crm-sla-row__progress" title={`${progress}% of mandatory SLA`}>
            <div className="crm-sla-row__progress-track">
              <div
                className={`crm-sla-row__progress-fill crm-sla-row__progress-fill--${meta.tone}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        <div className="crm-sla-row__action">
          <span className="crm-sla-row__action-label">{row.requiredAction}</span>
          <Link to={ROUTES.ENQUIRY_TAB(row.enquiryId, 'communication')} className="crm-sla-row__action-link">
            Open
          </Link>
        </div>
      </div>
    </li>
  );
}

export function SlaCounsellorCard({ stat }) {
  const riskPct = stat.total ? Math.round(((stat.warning + stat.breach) / stat.total) * 100) : 0;
  return (
    <div className="crm-sla-counsellor">
      <div className="crm-sla-counsellor__head">
        <span className="crm-sla-counsellor__avatar" aria-hidden>
          <FiUser className="w-3.5 h-3.5" />
        </span>
        <div className="min-w-0">
          <p className="crm-sla-counsellor__name">{stat.name}</p>
          <p className="crm-sla-counsellor__sub">{stat.total} open enquiries</p>
        </div>
      </div>
      <div className="crm-sla-counsellor__stats">
        <span className="crm-sla-counsellor__pill crm-sla-counsellor__pill--warn">{stat.warning} warning</span>
        <span className="crm-sla-counsellor__pill crm-sla-counsellor__pill--danger">{stat.breach} breach</span>
      </div>
      <div className="crm-sla-counsellor__foot">
        <span>Avg wait {formatWaitMinutes(stat.avgWaitMinutes)}</span>
        <span>Reassign {stat.reassignCount}</span>
        <span className="crm-sla-counsellor__risk">{riskPct}% at risk</span>
      </div>
    </div>
  );
}

export function SlaLiveIndicator({ fetching, lastUpdated }) {
  return (
    <div className="crm-sla-live">
      <FiRefreshCw className={`w-3 h-3 ${fetching ? 'crm-sla-live__spin' : ''}`} />
      <span>
        {fetching ? 'Updating…' : 'Live'}
        {lastUpdated ? ` · ${lastUpdated.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}` : ''}
      </span>
    </div>
  );
}

export const SLA_ICONS = {
  onTrack: FiZap,
  dueSoon: FiClock,
  overdue: FiAlertTriangle,
  breached: FiAlertTriangle,
  completed: FiTrendingUp,
  avgWait: FiClock,
  reassign: FiRefreshCw,
};
