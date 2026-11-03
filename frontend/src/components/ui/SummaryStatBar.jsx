import { SkeletonStatBar } from './Skeleton';
import ScrollArea from './ScrollArea';

/** Icon tone — shared across all module pages */
export const SUMMARY_STAT_TONES = {
  neutral: {
    bg: 'bg-slate-100',
    text: 'text-slate-500',
    activeBg: 'bg-slate-200/80',
    activeText: 'text-slate-700',
  },
  primary: {
    bg: 'bg-primary-50',
    text: 'text-primary-600',
    activeBg: 'bg-primary-100/80',
    activeText: 'text-primary-700',
  },
  secondary: {
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    activeBg: 'bg-slate-200/80',
    activeText: 'text-slate-700',
  },
  info: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-600',
    activeBg: 'bg-cyan-100/80',
    activeText: 'text-cyan-700',
  },
  warning: {
    bg: 'bg-amber-50',
    text: 'text-amber-600',
    activeBg: 'bg-amber-100/80',
    activeText: 'text-amber-700',
  },
  success: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-600',
    activeBg: 'bg-emerald-100/80',
    activeText: 'text-emerald-700',
  },
  danger: {
    bg: 'bg-red-50',
    text: 'text-red-600',
    activeBg: 'bg-red-100/80',
    activeText: 'text-red-700',
  },
};

function StatShare({ pct, hint, tone, active }) {
  const width = Math.max(0, Math.min(100, pct ?? 0));
  const label = hint === 'all' ? 'All' : `${width}%`;
  return (
    <span className="ml-auto shrink-0 w-[56px] text-right" aria-hidden>
      <span
        className={`block text-[10px] font-semibold tabular-nums leading-none
          ${active ? tone.activeText : 'text-text-muted'}
        `}
      >
        {label}
      </span>
      {hint === 'conv' && (
        <span className="block text-[9px] font-medium text-text-muted mt-0.5 leading-none">conv</span>
      )}
      <span className={`mt-1.5 block h-1 w-full rounded-full bg-slate-100 overflow-hidden ${active ? tone.activeText : tone.text}`}>
        <span
          className="block h-full rounded-full bg-current opacity-50"
          style={{ width: `${hint === 'all' ? 100 : width}%` }}
        />
      </span>
    </span>
  );
}

function resolveShare(item, total, items) {
  if (item.share === false || item.subtext != null || item.badge != null) return null;
  // If item value is non-numeric (e.g. time string '08:30 – 10:00 AM' or percentage string '96.4%'), don't show a misleading 0% share bar!
  if (typeof item.value === 'string' && (item.value.includes(':') || item.value.includes('-') || item.value.includes('–') || item.value.includes('%'))) {
    return null;
  }
  const value = Number(item.value);
  if (Number.isNaN(value)) return null;

  if (item.filterValue == null || item.key === 'total') {
    const converted = items.find((i) => i.key === 'converted');
    if (converted && total > 0) {
      return { pct: Math.round((Number(converted.value || 0) / total) * 100), hint: 'conv' };
    }
    return total > 0 ? { pct: 100, hint: 'all' } : null;
  }
  if (total <= 0) return null;
  return { pct: Math.round((value / total) * 100), hint: 'share' };
}

function StatItem({ item, active, onSelect, compact = false, total = 0, items = [] }) {
  const tone = SUMMARY_STAT_TONES[item.tone] || SUMMARY_STAT_TONES.neutral;
  const Icon = item.icon;
  const share = resolveShare(item, total, items);

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.filterValue)}
      aria-pressed={active}
      title={`${item.label}: ${item.value ?? 0}${share?.hint === 'conv' ? ` · ${share.pct}% converted` : share ? ` · ${share.pct}% of total` : ''}`}
      className={`
        group relative flex items-center gap-2.5 px-3 py-2 text-left transition-colors duration-150 focus-ring bg-card-bg w-full
        ${compact ? 'min-w-0' : 'min-w-[140px] flex-1'}
        ${active ? 'bg-card-bg' : 'hover:bg-row-hover/70'}
      `}
    >
      {Icon && (
        <span
          className={`
            flex items-center justify-center w-7 h-7 rounded-md shrink-0 transition-colors
            ${active ? `${tone.activeBg} ${tone.activeText}` : `${tone.bg} ${tone.text}`}
          `}
        >
          <Icon className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span
          className={`block text-[11px] font-semibold leading-snug truncate
            ${active ? 'text-text' : 'text-text-muted group-hover:text-text-secondary'}
          `}
        >
          {item.label}
        </span>
        <span className="block text-lg font-bold leading-tight tabular-nums tracking-tight mt-0.5 text-text whitespace-nowrap">
          {item.value ?? 0}
        </span>
      </span>

      {item.badge ? (
        <span className="ml-auto shrink-0 text-right" aria-hidden>
          <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold ${item.badgeTone || 'bg-slate-100 text-slate-700'}`}>
            {item.badge}
          </span>
        </span>
      ) : item.subtext ? (
        <span className="ml-auto shrink-0 text-right" aria-hidden>
          <span className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${item.subtextTone || 'bg-slate-100 text-slate-600'}`}>
            {item.subtext}
          </span>
        </span>
      ) : share ? (
        <StatShare pct={share.pct} hint={share.hint} tone={tone} active={active} />
      ) : null}

      {active && (
        <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-primary-600" aria-hidden />
      )}
    </button>
  );
}

/**
 * Global summary stat strip — use on every ModulePageCard via ModulePageCard.Stats.
 *
 * @param {Array} items — from buildSummaryStatItems()
 * @param {*} activeFilter — current filterValue (null = total / all)
 * @param {Function} onSelect — (filterValue) => void
 */
export default function SummaryStatBar({
  items = [],
  activeFilter = null,
  onSelect,
  loading = false,
  ariaLabel = 'Summary filters',
  className = '',
  layout = 'scroll',
}) {
  if (loading) {
    return <SkeletonStatBar count={items.length || 7} variant="strip" />;
  }

  if (!items.length) return null;

  const total = Number(items.find((i) => i.filterValue == null || i.key === 'total')?.value) || 0;

  const colCount = Math.max(1, items.length);

  return (
    <div className={`shrink-0 border-b border-border bg-card-bg w-full ${className}`.trim()}>
      <ScrollArea axis="x" role="tablist" aria-label={ariaLabel}>
        <div
          className="w-full min-w-full divide-x divide-border/60"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${colCount}, minmax(0, 1fr))`,
            minWidth: colCount > 6 ? `${colCount * 140}px` : '100%',
          }}
        >
          {items.map((item) => {
            const active = activeFilter === item.filterValue
              || (activeFilter == null && item.filterValue == null);

            return (
              <StatItem
                key={item.key}
                item={item}
                active={active}
                onSelect={onSelect}
                compact
                total={total}
                items={items}
              />
            );
          })}
        </div>
      </ScrollArea>
    </div>
  );
}
