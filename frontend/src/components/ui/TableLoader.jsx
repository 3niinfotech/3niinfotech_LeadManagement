import { useSelector } from 'react-redux';
import { selectTableDensity } from '../../redux/slices/uiSlice';
import { TABLE_DENSITY } from '../../config/constants';
import Skeleton, { SkeletonRow } from './Skeleton';

const COL_WIDTHS = ['w-16', 'w-28', 'w-36', 'w-20', 'w-24', 'w-20', 'w-28', 'w-16', 'w-14'];

/**
 * Compact table skeleton — theme shimmer rows + thin brand progress.
 * Use for all grid first-loads (no big spinner).
 */
export default function TableLoader({
  rows = 9,
  columns = 7,
  height = '100%',
  showHeader = true,
  showPagination = false,
  stagger = true,
  showProgress = true,
  showCheckbox = true,
}) {
  const density = useSelector(selectTableDensity);
  const rowHeight = density === TABLE_DENSITY.COMPACT ? 34 : 40;
  const headerHeight = density === TABLE_DENSITY.COMPACT ? 34 : 38;

  return (
    <div
      className="crm-table-loader relative flex flex-col w-full h-full min-h-[220px] overflow-hidden bg-card-bg"
      style={{ height }}
      role="status"
      aria-label="Loading table data"
    >
      {showProgress && (
        <div className="crm-table-loader__progress absolute top-0 inset-x-0 z-10 h-[2px] overflow-hidden">
          <span className="crm-table-loader__progress-bar" />
        </div>
      )}

      {showHeader && (
        <div
          className="flex items-center gap-2.5 px-3 border-b border-border bg-[color-mix(in_srgb,var(--surface-muted)_70%,var(--card-bg))] shrink-0"
          style={{ height: headerHeight }}
        >
          {showCheckbox && <Skeleton className="w-3.5 h-3.5 shrink-0" rounded="sm" />}
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton
              key={i}
              className={`h-2 shrink-0 ${COL_WIDTHS[i % COL_WIDTHS.length]}`}
            />
          ))}
        </div>
      )}

      <div className="flex-1 min-h-0 overflow-hidden">
        {Array.from({ length: rows }).map((_, i) => (
          <div
            key={i}
            className={stagger ? 'crm-skeleton-row' : undefined}
            style={{
              height: rowHeight,
              background:
                i % 2 === 1
                  ? 'color-mix(in srgb, var(--surface-muted) 35%, transparent)'
                  : undefined,
              ...(stagger ? { animationDelay: `${i * 0.03}s` } : {}),
            }}
          >
            <SkeletonRow columns={columns} showCheckbox={showCheckbox} />
          </div>
        ))}
      </div>

      {showPagination && (
        <div className="flex items-center justify-between gap-3 px-3 h-10 border-t border-border bg-[color-mix(in_srgb,var(--surface-muted)_40%,var(--card-bg))] shrink-0">
          <Skeleton className="h-2.5 w-28" />
          <div className="flex items-center gap-1.5">
            <Skeleton className="h-6 w-6" rounded="md" />
            <Skeleton className="h-2.5 w-16" />
            <Skeleton className="h-6 w-6" rounded="md" />
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Soft overlay while refetching an already-populated grid.
 */
export function TableFetchOverlay({ className = '' }) {
  return (
    <div
      className={`crm-table-fetch-overlay absolute inset-0 z-20 flex items-start justify-center pt-8 pointer-events-none ${className}`.trim()}
      role="status"
      aria-label="Refreshing"
    >
      <div className="pointer-events-none absolute inset-0 bg-card-bg/40" />
      <div className="relative z-10 h-[2px] w-28 overflow-hidden rounded-full bg-[color-mix(in_srgb,var(--brand)_12%,var(--border))]">
        <span className="crm-table-loader__progress-bar block h-full" />
      </div>
    </div>
  );
}
