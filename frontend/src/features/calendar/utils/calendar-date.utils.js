import dayjs from 'dayjs';

/** Company default timezone context — format in local browser; store ISO from API */
export function formatCalendarTitle(date, viewId) {
  const d = dayjs(date);
  if (viewId === 'day') return d.format('dddd, D MMMM YYYY');
  if (viewId === 'week') {
    const start = d.startOf('week');
    const end = d.endOf('week');
    return `${start.format('D MMM')} – ${end.format('D MMM YYYY')}`;
  }
  if (viewId === 'list') return d.format('MMMM YYYY');
  return d.format('MMMM YYYY');
}

export function formatEventWhen(event) {
  if (!event?.startAt) return '—';
  const start = dayjs(event.startAt);
  if (event.allDay) return start.format('DD MMM YYYY');
  const end = event.endAt ? dayjs(event.endAt) : null;
  if (end) return `${start.format('DD MMM YYYY, HH:mm')} – ${end.format('HH:mm')}`;
  return start.format('DD MMM YYYY, HH:mm');
}

export function rangeForView(date, viewId) {
  const d = dayjs(date);
  if (viewId === 'day') {
    return {
      from: d.startOf('day').toISOString(),
      to: d.endOf('day').toISOString(),
    };
  }
  if (viewId === 'week') {
    return {
      from: d.startOf('week').toISOString(),
      to: d.endOf('week').toISOString(),
    };
  }
  if (viewId === 'list') {
    return {
      from: d.startOf('month').toISOString(),
      to: d.endOf('month').toISOString(),
    };
  }
  // Month: include overflow days (prev/next month cells)
  const start = d.startOf('month').startOf('week');
  const end = d.endOf('month').endOf('week');
  return { from: start.toISOString(), to: end.toISOString() };
}

export function shiftDate(date, viewId, direction) {
  const d = dayjs(date);
  const dir = direction < 0 ? -1 : 1;
  if (viewId === 'day') return d.add(dir, 'day').toDate();
  if (viewId === 'week') return d.add(dir, 'week').toDate();
  return d.add(dir, 'month').toDate();
}
