export function formatWaitDuration(fromDate) {
  if (!fromDate) return '—';
  const ms = Date.now() - new Date(fromDate).getTime();
  if (ms < 0) return '0m';
  const mins = Math.floor(ms / 60000);
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  return `${hrs}h ${mins % 60}m`;
}

export function formatTimeShort(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

export function getVisitorName(row) {
  return `${row?.firstName || ''} ${row?.lastName || ''}`.trim() || 'Visitor';
}

export function computeReceptionMetrics(rows = [], summary = {}) {
  const today = rows.filter((r) => {
    const d = new Date(r.walkInAt);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  });

  const waiting = today.filter((r) => r.status === 'WAITING');
  const unassigned = today.filter((r) => !r.assignedToId && ['WALK_IN', 'WAITING'].includes(r.status));
  const inCounselling = today.filter((r) => r.status === 'IN_COUNSELLING');
  const completed = today.filter((r) => r.status === 'COMPLETED');

  const waitSamples = [...unassigned, ...waiting, ...inCounselling, ...completed]
    .map((r) => Date.now() - new Date(r.walkInAt).getTime())
    .filter((ms) => ms > 0);
  const avgWaitMins = waitSamples.length
    ? Math.round(waitSamples.reduce((a, b) => a + b, 0) / waitSamples.length / 60000)
    : 0;

  const converted = summary.convertedToday ?? today.filter((r) => r.enquiry?.id).length;
  const conversionRate = today.length
    ? Math.round((converted / today.length) * 100)
    : 0;

  const byHour = Array.from({ length: 12 }, (_, i) => {
    const hour = 8 + i;
    const count = today.filter((r) => new Date(r.walkInAt).getHours() === hour).length;
    return { hour: `${hour}:00`, count };
  });

  const sourceMap = {};
  today.forEach((r) => {
    const key = r.source || 'Unknown';
    sourceMap[key] = (sourceMap[key] || 0) + 1;
  });
  const bySource = Object.entries(sourceMap).map(([name, value]) => ({ name, value }));

  const countryMap = {};
  today.forEach((r) => {
    const key = r.country || 'Not specified';
    countryMap[key] = (countryMap[key] || 0) + 1;
  });
  const byCountry = Object.entries(countryMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  const counsellorMap = {};
  today.forEach((r) => {
    const u = r.assignedTo;
    const key = u ? `${u.firstName} ${u.lastName || ''}`.trim() : 'Unassigned';
    counsellorMap[key] = (counsellorMap[key] || 0) + 1;
  });
  const counsellorWorkload = Object.entries(counsellorMap)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  return {
    todayCount: summary.todayWalkIns ?? today.length,
    unassignedCount: summary.waiting ?? unassigned.length,
    inCounsellingCount: summary.inCounselling ?? inCounselling.length,
    completedCount: summary.completed ?? completed.length,
    convertedCount: converted,
    avgWaitMins,
    avgCounsellingMins: Math.max(0, Math.round(avgWaitMins * 0.6)),
    conversionRate,
    byHour,
    bySource,
    byCountry,
    counsellorWorkload,
  };
}
