import { motion } from 'framer-motion';
import { SUMMARY_STAT_TONES } from '../../../../components/ui/SummaryStatBar';

function MiniSparkline({ data = [], tone = 'primary' }) {
  const max = Math.max(...data, 1);
  const colors = {
    primary: 'bg-primary-500',
    warning: 'bg-amber-500',
    info: 'bg-cyan-500',
    success: 'bg-emerald-500',
    brand: 'bg-indigo-500',
  };
  return (
    <div className="crm-reception-sparkline" aria-hidden>
      {data.map((v, i) => (
        <span
          key={i}
          className={`crm-reception-sparkline__bar ${colors[tone] || colors.primary}`}
          style={{ height: `${Math.max(12, (v / max) * 100)}%` }}
        />
      ))}
    </div>
  );
}

export default function ReceptionKpiStrip({
  items = [],
  activeFilter,
  onSelect,
  loading = false,
}) {
  if (loading) {
    return (
      <div className="crm-reception-kpi-grid">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="crm-reception-kpi crm-reception-kpi--skeleton" />
        ))}
      </div>
    );
  }

  return (
    <div className="crm-reception-kpi-grid">
      {items.map((item, index) => {
        const tone = SUMMARY_STAT_TONES[item.tone] || SUMMARY_STAT_TONES.neutral;
        const Icon = item.icon;
        const active = item.filterValue && activeFilter === item.filterValue;

        return (
          <motion.button
            key={item.key}
            type="button"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.04, duration: 0.22 }}
            onClick={() => item.filterValue && onSelect?.(item.filterValue)}
            disabled={!item.filterValue}
            className={`crm-reception-kpi ${active ? 'crm-reception-kpi--active' : ''}`}
            aria-pressed={active}
          >
            <div className="crm-reception-kpi__top">
              <span className={`crm-reception-kpi__icon ${tone.bg} ${tone.text}`}>
                <Icon className="w-4 h-4" />
              </span>
              <span className={`crm-reception-kpi__trend ${item.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                {item.trend}
              </span>
            </div>
            <p className="crm-reception-kpi__value">
              {item.isText ? item.value : Number(item.value).toLocaleString()}
            </p>
            <p className="crm-reception-kpi__label">{item.label}</p>
            <MiniSparkline data={item.spark} tone={item.tone} />
          </motion.button>
        );
      })}
    </div>
  );
}
