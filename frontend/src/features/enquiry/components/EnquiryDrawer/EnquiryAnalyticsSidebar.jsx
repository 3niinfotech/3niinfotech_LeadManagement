import { useMemo } from 'react';
import {
  FiTrendingUp, FiTarget, FiCalendar, FiClock, FiPercent, FiZap,
} from 'react-icons/fi';
import { buildEnquiryAnalytics } from '../../utils/enquiryAnalytics.utils';

function MetricBar({ value, tone }) {
  return (
    <div className="crm-analytics-metric__bar" aria-hidden>
      <span
        className="crm-analytics-metric__bar-fill"
        data-tone={tone}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function AnalyticsMetric({
  icon: Icon,
  label,
  value,
  subValue,
  tone = 'brand',
  showBar = false,
  barValue,
}) {
  return (
    <div className="crm-analytics-metric">
      <div className="crm-analytics-metric__head">
        <span className="crm-analytics-metric__icon" data-tone={tone}>
          <Icon className="w-3.5 h-3.5" />
        </span>
        <span className="crm-analytics-metric__label">{label}</span>
      </div>
      <p className="crm-analytics-metric__value" data-tone={tone}>{value}</p>
      {subValue && <p className="crm-analytics-metric__sub">{subValue}</p>}
      {showBar && <MetricBar value={barValue ?? 0} tone={tone} />}
    </div>
  );
}

export default function EnquiryAnalyticsSidebar({ enquiry, highlighted = false }) {
  const analytics = useMemo(() => buildEnquiryAnalytics(enquiry), [enquiry]);
  const asideClass = `crm-enquiry-analytics${highlighted ? ' crm-enquiry-analytics--highlight' : ''}`;

  if (!analytics) {
    return (
      <aside className={asideClass}>
        <div className="crm-enquiry-analytics__head">
          <FiTrendingUp className="w-4 h-4" />
          <h3>Analytics</h3>
        </div>
        <p className="crm-enquiry-analytics__placeholder">
          Save the enquiry to view lead analytics.
        </p>
      </aside>
    );
  }

  const followUpHint = analytics.daysWithoutFollowUp === 0
    ? 'Contacted today'
    : analytics.daysWithoutFollowUp > 7
      ? 'Needs attention'
      : 'On track';

  return (
    <aside className={asideClass} aria-label="Enquiry analytics">
      <div className="crm-enquiry-analytics__head">
        <FiTrendingUp className="w-4 h-4" />
        <h3>Analytics</h3>
      </div>

      <div className="crm-enquiry-analytics__hero" data-tone={analytics.leadScoreTone}>
        <p className="crm-enquiry-analytics__hero-label">Lead Score</p>
        <p className="crm-enquiry-analytics__hero-value">{analytics.leadScore}</p>
        <MetricBar value={analytics.leadScore} tone={analytics.leadScoreTone} />
      </div>

      <div className="crm-enquiry-analytics__grid">
        <AnalyticsMetric
          icon={FiTarget}
          label="Probability"
          value={`${analytics.probability}%`}
          tone={analytics.probabilityTone}
          showBar
          barValue={analytics.probability}
        />
        <AnalyticsMetric
          icon={FiCalendar}
          label="Days Since Created"
          value={analytics.daysSinceCreated}
          subValue={analytics.daysSinceCreated === 1 ? 'day' : 'days'}
          tone="info"
        />
        <AnalyticsMetric
          icon={FiClock}
          label="Days Without Follow-up"
          value={analytics.daysWithoutFollowUp}
          subValue={followUpHint}
          tone={analytics.daysWithoutFollowUp > 7 ? 'danger' : analytics.daysWithoutFollowUp > 3 ? 'warning' : 'success'}
        />
        <AnalyticsMetric
          icon={FiPercent}
          label="Conversion %"
          value={`${analytics.conversionPercent}%`}
          tone={analytics.conversionTone}
          showBar
          barValue={analytics.conversionPercent}
        />
        <AnalyticsMetric
          icon={FiZap}
          label="Response Time"
          value={analytics.responseTime}
          subValue="First outreach"
          tone="primary"
        />
      </div>
    </aside>
  );
}
