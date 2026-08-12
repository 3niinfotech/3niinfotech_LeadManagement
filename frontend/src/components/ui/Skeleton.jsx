/** Shimmer block — base building block for all skeleton UIs */
export default function Skeleton({ className = '', rounded = 'md', style = {} }) {
  const radius = { sm: 'rounded', md: 'rounded-md', lg: 'rounded-lg', full: 'rounded-full' };
  return (
    <div
      className={`crm-shimmer ${radius[rounded] || radius.md} ${className}`}
      style={style}
      aria-hidden
    />
  );
}

/** Single table row skeleton */
export function SkeletonRow({ columns = 6, showCheckbox = true }) {
  return (
    <div className="flex items-center gap-2.5 px-3 h-full border-b border-border/70">
      {showCheckbox && <Skeleton className="w-3.5 h-3.5 shrink-0" rounded="sm" />}
      {Array.from({ length: columns }).map((_, i) => (
        <Skeleton
          key={i}
          className="h-2.5 flex-1"
          style={{ maxWidth: i === 0 ? 64 : i === columns - 1 ? 48 : undefined }}
        />
      ))}
    </div>
  );
}

/** Stats bar skeleton (enquiry summary style) */
export function SkeletonStatBar({ count = 7, variant = 'default' }) {
  if (variant === 'strip' || variant === 'cards') {
    return (
      <div className="border-b border-slate-200 bg-white">
        <div className="flex overflow-hidden">
          {Array.from({ length: count }).map((_, i) => (
            <div
              key={i}
              className="flex-1 flex items-center gap-3 px-4 py-3 min-w-[148px] border-r border-slate-200/90 last:border-r-0"
            >
              <Skeleton className="w-8 h-8 shrink-0" rounded="md" />
              <div className="flex-1 space-y-1.5 min-w-0">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-5 w-8" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex border-b border-border">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 flex items-center gap-2.5 px-4 py-3 border-r border-border last:border-r-0 min-w-[108px]">
          <Skeleton className="w-3.5 h-3.5 shrink-0" rounded="sm" />
          <div className="flex-1 space-y-1.5">
            <Skeleton className="h-4 w-8" />
            <Skeleton className="h-2 w-14" />
          </div>
        </div>
      ))}
    </div>
  );
}

/** Module page header skeleton */
export function SkeletonPageHeader() {
  return (
    <div className="px-5 pt-3 pb-3.5 border-b border-border space-y-3">
      <div className="flex items-center gap-1.5">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-2 w-2" rounded="full" />
        <Skeleton className="h-2.5 w-24" />
      </div>
      <div className="flex items-center gap-3.5">
        <Skeleton className="w-10 h-10 shrink-0" rounded="lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-3 w-56" />
        </div>
      </div>
    </div>
  );
}

/** Toolbar row skeleton */
export function SkeletonToolbar() {
  return (
    <div className="flex items-center gap-2 px-4 py-2 border-b border-border">
      <Skeleton className="h-8 flex-1 max-w-xs" rounded="lg" />
      <Skeleton className="h-8 w-48" rounded="lg" />
      <div className="flex gap-1.5 ml-auto">
        <Skeleton className="h-8 w-20" rounded="lg" />
        <Skeleton className="h-8 w-16" rounded="lg" />
        <Skeleton className="h-8 w-16" rounded="lg" />
      </div>
    </div>
  );
}

/** Card grid skeleton (dashboard stat cards) */
export function SkeletonCardGrid({ count = 6, cols = 'grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6' }) {
  return (
    <div className={`grid ${cols} gap-4`}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-border bg-card-bg space-y-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="w-8 h-8" rounded="lg" />
          </div>
          <Skeleton className="h-7 w-16" />
          <Skeleton className="h-2.5 w-24" />
        </div>
      ))}
    </div>
  );
}
