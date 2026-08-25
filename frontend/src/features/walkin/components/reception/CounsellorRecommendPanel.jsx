import { FiCheck, FiRefreshCw, FiUser } from 'react-icons/fi';

const TONE_STYLES = {
  success: {
    dot: 'bg-emerald-500',
    chip: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  },
  warning: {
    dot: 'bg-amber-500',
    chip: 'bg-amber-50 text-amber-800 border-amber-200',
  },
  caution: {
    dot: 'bg-orange-400',
    chip: 'bg-orange-50 text-orange-800 border-orange-200',
  },
  danger: {
    dot: 'bg-rose-500',
    chip: 'bg-rose-50 text-rose-700 border-rose-200',
  },
  neutral: {
    dot: 'bg-slate-400',
    chip: 'bg-slate-100 text-slate-600 border-slate-200',
  },
};

export default function CounsellorRecommendPanel({
  recommendations = [],
  loading,
  selectedId,
  onSelect,
  error,
  onRefresh,
}) {
  if (loading && !recommendations.length) {
    return (
      <div className="crm-reception-counsellor-empty">
        <div className="crm-reception-skeleton-line" />
        <div className="crm-reception-skeleton-line w-4/5" />
        <div className="crm-reception-skeleton-line w-3/5" />
      </div>
    );
  }

  if (!recommendations.length) {
    return (
      <div className="crm-reception-counsellor-empty">
        {error && <p className="text-xs text-danger mb-2">{error}</p>}
        <p className="text-sm text-text-secondary py-1">No counsellors in this branch.</p>
        {onRefresh && (
          <button type="button" className="crm-reception-counsellor__refresh mt-2" onClick={onRefresh}>
            <FiRefreshCw size={14} /> Retry
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="crm-reception-counsellor">
      {error && <p className="text-xs text-danger mb-2">{error}</p>}
      <ul className="crm-reception-counsellor__list">
        {recommendations.map((row) => {
          const selected = selectedId === row.id;
          const name = `${row.firstName || ''} ${row.lastName || ''}`.trim() || 'Counsellor';
          const toneKey = row.availability?.tone || 'neutral';
          const tone = TONE_STYLES[toneKey] || TONE_STYLES.neutral;
          const statusLabel = row.availability?.label || 'Offline';
          const free = row.availability?.key === 'AVAILABLE';

          return (
            <li key={row.id}>
              <button
                type="button"
                onClick={() => onSelect(row.id)}
                className={`crm-reception-counsellor__card ${selected ? 'is-selected' : ''} ${free ? 'is-free' : ''}`}
              >
                <span className="crm-reception-counsellor__avatar">
                  <FiUser size={16} />
                  <span className={`crm-reception-counsellor__status-dot ${tone.dot}`} />
                </span>
                <span className="min-w-0 flex-1 flex items-center gap-2 text-left">
                  <span className="font-semibold text-xs text-text truncate">{name}</span>
                  <span className={`crm-reception-counsellor__chip border shrink-0 ${tone.chip}`}>
                    {statusLabel}
                  </span>
                </span>
                {selected && (
                  <span className="crm-reception-counsellor__check">
                    <FiCheck size={14} />
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
