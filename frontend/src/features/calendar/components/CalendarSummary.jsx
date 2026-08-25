export default function CalendarSummary({ summary, loading, onSelect }) {
  if (loading && !summary) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 px-4 py-2 border-b border-border bg-card-bg">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-12 rounded-md bg-row-hover animate-pulse" />
        ))}
      </div>
    );
  }
  if (!summary) return null;

  const items = [
    { id: 'today', label: 'Today', value: summary.today, tone: 'text-brand' },
    { id: 'upcoming', label: 'Next 7 days', value: summary.upcoming, tone: 'text-info' },
    { id: 'overdue', label: 'Overdue', value: summary.overdue, tone: 'text-danger' },
    { id: 'followups', label: 'Follow-ups', value: summary.followups, tone: 'text-warning' },
    { id: 'appointments', label: 'Appointments', value: summary.appointments, tone: 'text-brand' },
    { id: 'due', label: 'Due dates', value: summary.invoiceDue, tone: 'text-warning' },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-px bg-border/70 border-b border-border">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          onClick={() => onSelect?.(item.id)}
          className="bg-card-bg px-3 py-2.5 text-left transition-colors hover:bg-row-hover focus-ring"
        >
          <p className="text-[11px] text-text-muted font-medium">{item.label}</p>
          <p className={`text-lg font-semibold tabular-nums ${item.tone}`}>{item.value ?? 0}</p>
        </button>
      ))}
    </div>
  );
}
