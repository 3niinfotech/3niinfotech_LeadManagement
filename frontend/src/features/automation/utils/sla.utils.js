export const SLA_STATUS = {
  ON_TRACK: 'ON_TRACK',
  DUE_SOON: 'DUE_SOON',
  OVERDUE: 'OVERDUE',
  BREACHED: 'BREACHED',
  COMPLETED: 'COMPLETED',
};

export const SLA_STATUS_META = {
  ON_TRACK: { label: 'On track', tone: 'success', dot: 'success' },
  DUE_SOON: { label: 'Due soon', tone: 'warning', dot: 'warning' },
  OVERDUE: { label: 'Overdue', tone: 'danger', dot: 'danger' },
  BREACHED: { label: 'Breached', tone: 'danger', dot: 'danger' },
  COMPLETED: { label: 'Completed', tone: 'neutral', dot: 'neutral' },
};

/** Human-readable duration from minutes */
export function formatWaitMinutes(mins = 0) {
  const m = Math.max(0, Math.round(Number(mins) || 0));
  if (m < 60) return `${m}m`;
  if (m < 1440) {
    const h = Math.floor(m / 60);
    const r = m % 60;
    return r ? `${h}h ${r}m` : `${h}h`;
  }
  const d = Math.floor(m / 1440);
  const h = Math.floor((m % 1440) / 60);
  return h ? `${d}d ${h}h` : `${d}d`;
}

export function slaProgressPercent(waitMinutes, mandatoryMinutes = 30) {
  if (!mandatoryMinutes) return 0;
  return Math.min(100, Math.round((waitMinutes / mandatoryMinutes) * 100));
}

export function slaHealthFromSummary(summary = {}) {
  const risk = (summary.dueSoon ?? 0) + (summary.overdue ?? 0) + (summary.breached ?? 0);
  if (risk === 0) return { tone: 'success', label: 'All enquiries on track', detail: 'No SLA warnings or breaches right now.' };
  if ((summary.breached ?? 0) > 0 || (summary.overdue ?? 0) > 0) {
    return {
      tone: 'danger',
      label: `${risk} enquiry${risk === 1 ? '' : 'ies'} need attention`,
      detail: 'Overdue or breached SLAs require immediate action.',
    };
  }
  return {
    tone: 'warning',
    label: `${risk} enquiry${risk === 1 ? '' : 'ies'} due soon`,
    detail: 'Respond before SLA breach escalations trigger.',
  };
}
