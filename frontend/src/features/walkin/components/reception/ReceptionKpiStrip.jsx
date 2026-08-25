import { SUMMARY_STAT_TONES } from '../../../../components/ui/SummaryStatBar';

export default function ReceptionKpiStrip({
  items = [],
  activeFilter,
  onSelect,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="crm-reception-kpi-strip">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="crm-reception-kpi crm-reception-kpi--skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="crm-reception-kpi-strip" role="tablist" aria-label="Visitor filters">
      {items.map((item) => {
        const tone = SUMMARY_STAT_TONES[item.tone] || SUMMARY_STAT_TONES.neutral;
        const Icon = item.icon;
        const active = item.filterValue && activeFilter === item.filterValue;

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            aria-selected={active}
            title={item.hint ? `${item.label} · ${item.hint}` : item.label}
            onClick={() => item.filterValue && onSelect?.(item.filterValue)}
            disabled={!item.filterValue}
            className={`crm-reception-kpi ${active ? 'crm-reception-kpi--active' : ''}`}
          >
            {Icon && (
              <span className={`crm-reception-kpi__icon ${active ? `${tone.activeBg} ${tone.activeText}` : `${tone.bg} ${tone.text}`}`}>
                <Icon className="w-3.5 h-3.5" strokeWidth={2} />
              </span>
            )}
            <span className="crm-reception-kpi__meta">
              <span className="crm-reception-kpi__value">
                {item.isText ? item.value : Number(item.value).toLocaleString()}
              </span>
              <span className="crm-reception-kpi__label">{item.label}</span>
            </span>
            {item.hint && <span className="crm-reception-kpi__hint">{item.hint}</span>}
          </button>
        );
      })}
    </div>
  );
}
