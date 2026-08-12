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

function StatItem({ item, active, onSelect, compact = false }) {
  const tone = SUMMARY_STAT_TONES[item.tone] || SUMMARY_STAT_TONES.neutral;
  const Icon = item.icon;

  return (
    <button
      type="button"
      onClick={() => onSelect?.(item.filterValue)}
      aria-pressed={active}
      title={item.label}
      className={`
        group relative flex items-center gap-3 px-3 py-2.5 text-left transition-colors duration-150 focus-ring bg-white
        ${compact ? 'min-w-0' : 'min-w-[140px] flex-1'}
        ${active ? 'bg-slate-50' : 'bg-transparent hover:bg-slate-50/60'}
      `}
    >
      {Icon && (
        <span
          className={`
            flex items-center justify-center w-8 h-8 rounded-md shrink-0 transition-colors
            ${active ? `${tone.activeBg} ${tone.activeText}` : `${tone.bg} ${tone.text}`}
          `}
        >
          <Icon className="w-4 h-4" strokeWidth={2} aria-hidden />
        </span>
      )}

      <span className="min-w-0 flex-1">
        <span
          className={`block text-[11px] font-medium leading-snug truncate
            ${active ? 'text-slate-700' : 'text-slate-500 group-hover:text-slate-600'}
          `}
        >
          {item.label}
        </span>
        <span
          className={`block text-xl font-semibold leading-tight tabular-nums tracking-tight mt-0.5
            ${active ? 'text-slate-900' : 'text-slate-800'}
          `}
        >
          {item.value ?? 0}
        </span>
      </span>

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

  return (
    <div className={`shrink-0 border-b border-slate-200 bg-white ${className}`.trim()}>
      {layout === 'grid' ? (
        <div
          className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-px bg-slate-200/90"
          role="tablist"
          aria-label={ariaLabel}
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
              />
            );
          })}
        </div>
      ) : (
      <ScrollArea axis="x" role="tablist" aria-label={ariaLabel}>
        <div className="flex items-stretch min-w-min">
        {items.map((item) => {
          const active = activeFilter === item.filterValue
            || (activeFilter == null && item.filterValue == null);

          return (
            <StatItem
              key={item.key}
              item={item}
              active={active}
              onSelect={onSelect}
            />
          );
        })}
        </div>
      </ScrollArea>
      )}
    </div>
  );
}
