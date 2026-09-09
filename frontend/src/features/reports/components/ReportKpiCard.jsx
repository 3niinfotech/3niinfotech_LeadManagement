import { Link } from 'react-router-dom';
import { ReportSparkline } from './MuiReportCharts';

const TONE_CLASS = {
  brand: 'crm-report-kpi--brand',
  success: 'crm-report-kpi--success',
  info: 'crm-report-kpi--info',
  warning: 'crm-report-kpi--warning',
  danger: 'crm-report-kpi--danger',
  neutral: '',
};

/**
 * Advanced theme KPI for reports — icon, tone, optional sparkline / delta / link.
 */
export default function ReportKpiCard({
  label,
  value,
  hint,
  icon: Icon,
  tone = 'brand',
  to,
  sparkline,
  delta,
  deltaLabel = 'vs prior',
  onClick,
}) {
  const className = [
    'crm-report-kpi',
    'crm-report-kpi--pro',
    TONE_CLASS[tone] || '',
    to || onClick ? 'crm-report-kpi--link' : '',
  ]
    .filter(Boolean)
    .join(' ');

  const body = (
    <>
      <div className="crm-report-kpi__top">
        <span className={`crm-report-kpi__icon crm-report-kpi__icon--${tone}`}>
          {Icon ? <Icon strokeWidth={1.75} /> : null}
        </span>
        {Array.isArray(sparkline) && sparkline.length > 1 ? (
          <div className="crm-report-kpi__spark">
            <ReportSparkline values={sparkline} height={32} width={72} />
          </div>
        ) : null}
      </div>
      <p className="crm-report-kpi__label">{label}</p>
      <p className="crm-report-kpi__value">{value}</p>
      {(hint != null || delta != null) && (
        <div className="crm-report-kpi__foot">
          {hint != null && <span className="crm-report-kpi__hint">{hint}</span>}
          {delta != null && (
            <span
              className={`crm-report-kpi__delta ${
                Number(delta) > 0
                  ? 'crm-report-kpi__delta--up'
                  : Number(delta) < 0
                    ? 'crm-report-kpi__delta--down'
                    : ''
              }`}
            >
              {Number(delta) > 0 ? '+' : ''}
              {delta}% {deltaLabel}
            </span>
          )}
        </div>
      )}
    </>
  );

  if (to) {
    return (
      <Link to={to} className={className}>
        {body}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {body}
      </button>
    );
  }

  return <div className={className}>{body}</div>;
}

export function ReportPanel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`crm-report-panel ${className}`.trim()}>
      {(title || action) && (
        <div className="crm-report-panel__head">
          <div>
            {title ? <h3>{title}</h3> : null}
            {subtitle ? <p>{subtitle}</p> : null}
          </div>
          {action}
        </div>
      )}
      <div className="crm-report-panel__body">{children}</div>
    </section>
  );
}
