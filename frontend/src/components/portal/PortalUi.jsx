import { Link } from 'react-router-dom';
import Button from '../ui/Button';

export function PortalPage({ children, className = '' }) {
  return <div className={`crm-portal-page ${className}`.trim()}>{children}</div>;
}

export function PortalPageHeader({ title, subtitle, greeting, description, actions }) {
  const heading = title || greeting;
  const sub = subtitle || description;
  return (
    <header className="crm-portal-page-header">
      <div>
        {heading && <h1 className="crm-portal-page-header__title">{heading}</h1>}
        {sub && <p className="crm-portal-page-header__desc">{sub}</p>}
      </div>
      {actions && <div className="crm-portal-page-header__actions">{actions}</div>}
    </header>
  );
}

export function PortalStatStrip({ children, className = '' }) {
  return <div className={`crm-portal-stat-strip ${className}`.trim()}>{children}</div>;
}

export function PortalStat({ label, value, hint, to, onClick }) {
  const inner = (
    <>
      <span className="crm-portal-stat__label">{label}</span>
      <span className="crm-portal-stat__value">{value ?? '—'}</span>
      {hint && <span className="crm-portal-stat__hint">{hint}</span>}
    </>
  );
  if (to) return <Link to={to} className="crm-portal-stat">{inner}</Link>;
  if (onClick) return <button type="button" className="crm-portal-stat" onClick={onClick}>{inner}</button>;
  return <div className="crm-portal-stat">{inner}</div>;
}

export function PortalMetrics({ children, columns = 4, className = '' }) {
  const colClass = columns === 6 ? ' crm-portal-metrics--6' : '';
  return (
    <div className={`crm-portal-metrics${colClass} ${className}`.trim()}>
      {children}
    </div>
  );
}

export function PortalMetric({
  label,
  value,
  hint,
  tone = 'neutral',
  icon: Icon,
  to,
  onClick,
}) {
  const toneMap = {
    blue: 'info',
    green: 'success',
    purple: 'brand',
    orange: 'warning',
    red: 'danger',
    brand: 'brand',
    success: 'success',
    warning: 'warning',
    danger: 'danger',
    info: 'info',
    neutral: 'neutral',
  };
  const resolvedTone = toneMap[tone] || 'neutral';
  const className = `crm-portal-metric crm-portal-metric--${resolvedTone}`;
  const inner = (
    <>
      {Icon && (
        <span className="crm-portal-metric__icon">
          <Icon aria-hidden />
        </span>
      )}
      <div className="crm-portal-metric__copy">
        <span className="crm-portal-metric__label">{label}</span>
        <span className="crm-portal-metric__value">{value ?? '—'}</span>
        {hint && <span className="crm-portal-metric__hint">{hint}</span>}
      </div>
    </>
  );

  if (to) {
    return <Link to={to} className={className}>{inner}</Link>;
  }
  if (onClick) {
    return (
      <button type="button" className={className} onClick={onClick}>
        {inner}
      </button>
    );
  }
  return <div className={className}>{inner}</div>;
}

export function PortalTable({ children, minWidth = 520 }) {
  return (
    <div className="crm-portal-table-scroll">
      <table className="crm-portal-table" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function PortalPanel({ title, description, action, children, padded = false, className = '' }) {
  return (
    <section className={`crm-portal-panel ${className}`.trim()}>
      {(title || action) && (
        <header className="crm-portal-panel__head">
          <div>
            {title && <h2 className="crm-portal-panel__title">{title}</h2>}
            {description && <p className="crm-portal-panel__desc">{description}</p>}
          </div>
          {action}
        </header>
      )}
      <div className={`crm-portal-panel__body${padded ? ' crm-portal-panel__body--padded' : ''}`}>
        {children}
      </div>
    </section>
  );
}

export function PortalBadge({ children, tone = 'neutral' }) {
  return (
    <span className={`crm-portal-badge crm-portal-badge--${tone}`}>
      {children}
    </span>
  );
}

export function PortalAlert({ children, tone = 'warning' }) {
  return (
    <div className={`crm-portal-alert${tone === 'danger' ? ' crm-portal-alert--danger' : ''}`} role="status">
      {children}
    </div>
  );
}

export function PortalEmpty({ title, description, icon: Icon, className = '' }) {
  return (
    <div className={`crm-portal-empty ${className}`.trim()}>
      {Icon && (
        <span className="crm-portal-empty__icon" aria-hidden>
          <Icon />
        </span>
      )}
      <p className="crm-portal-empty__title">{title}</p>
      {description && <p className="crm-portal-empty__desc">{description}</p>}
    </div>
  );
}

export function PortalError({ title = 'Something went wrong', description, onRetry }) {
  return (
    <div className="crm-portal-error">
      <p className="crm-portal-error__title">{title}</p>
      {description && <p className="crm-portal-error__desc">{description}</p>}
      {onRetry && (
        <Button size="sm" className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function PortalSkeletonPage() {
  return (
    <div className="crm-portal-skeleton-page" aria-hidden>
      <div className="crm-portal-skeleton crm-portal-skeleton-page__header" />
      <div className="crm-portal-skeleton-page__metrics">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="crm-portal-skeleton crm-portal-skeleton-page__metric" />
        ))}
      </div>
      <div className="crm-portal-skeleton crm-portal-skeleton-page__panel" />
      <div className="crm-portal-skeleton crm-portal-skeleton-page__panel" />
    </div>
  );
}

export function PortalTabs({ tabs, active, onChange }) {
  return (
    <div className="crm-portal-tabs" role="tablist">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          role="tab"
          aria-selected={active === tab.id}
          className={`crm-portal-tab${active === tab.id ? ' crm-portal-tab--active' : ''}`}
          onClick={() => onChange(tab.id)}
        >
          {tab.label}
          {tab.count != null && ` (${tab.count})`}
        </button>
      ))}
    </div>
  );
}

export function PortalClassCard({ time, name, sub, badge, action }) {
  return (
    <div className="crm-portal-class-card">
      {time && <span className="crm-portal-class-card__time">{time}</span>}
      <div className="crm-portal-class-card__body">
        <div className="crm-portal-class-card__name">{name}</div>
        {sub && <div className="crm-portal-class-card__sub">{sub}</div>}
      </div>
      {badge}
      {action}
    </div>
  );
}

export function PortalQuickActions({ items = [] }) {
  if (!items.length) return null;
  return (
    <div className="crm-portal-quick-actions">
      {items.map(({ id, label, icon: Icon, to, onClick }) => {
        const className = 'crm-portal-quick-action';
        const content = (
          <>
            {Icon && <Icon aria-hidden />}
            {label}
          </>
        );
        if (to) {
          return (
            <Link key={id || label} to={to} className={className}>
              {content}
            </Link>
          );
        }
        return (
          <button key={id || label} type="button" className={className} onClick={onClick}>
            {content}
          </button>
        );
      })}
    </div>
  );
}

export function greetingForUser(user, role = 'student') {
  const hour = new Date().getHours();
  const part = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const fallback = role === 'teacher'
    ? 'Teacher'
    : role === 'counsellor'
      ? 'Counsellor'
      : 'Student';
  const name = user?.firstName || fallback;
  return `${part}, ${name}`;
}
