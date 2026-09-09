export function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function statusColor(status) {
  const map = {
    PUBLISHED: 'success',
    DRAFT: 'default',
    CLOSED: 'warning',
    COMPLETED: 'success',
    CANCELLED: 'danger',
    ARCHIVED: 'default',
    REVIEWED: 'success',
    SUBMITTED: 'info',
    LATE: 'warning',
  };
  return map[status] || 'default';
}

export function Metric({ label, value, hint, tone = 'primary' }) {
  const tones = {
    primary: 'border-brand/20 bg-brand-soft/40 text-brand',
    success: 'border-success/20 bg-success-soft/50 text-success',
    warning: 'border-warning/20 bg-warning-soft text-warning',
    info: 'border-info/20 bg-info-soft/50 text-info',
  };
  return (
    <div className={`min-w-0 rounded-xl border px-3.5 py-3 ${tones[tone] || tones.primary}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</p>
      <p className="mt-1 text-2xl font-bold tabular-nums leading-none text-text">{value ?? 0}</p>
      {hint && <p className="mt-1.5 truncate text-[11px] text-text-muted">{hint}</p>}
    </div>
  );
}

export function Panel({ title, action, children }) {
  return (
    <section className="min-w-0 overflow-hidden rounded-xl border border-border bg-card-bg shadow-sm">
      <header className="flex items-center justify-between gap-3 border-b border-border bg-page/40 px-3.5 py-2.5">
        <h2 className="text-[13px] font-semibold text-text">{title}</h2>
        {action}
      </header>
      {children}
    </section>
  );
}
