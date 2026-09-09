import { FiChevronRight } from 'react-icons/fi';

function resolveColor(colorCode) {
  if (!colorCode) return undefined;
  if (String(colorCode).startsWith('#')) return colorCode;
  return undefined;
}

/**
 * Compact horizontal pipeline preview for global status masters (lead / student).
 */
export default function MasterWorkflowStrip({ title, steps = [], loading = false }) {
  if (loading) {
    return (
      <div className="mb-3 rounded-md border border-border bg-surface px-3 py-2.5">
        <p className="text-xs text-text-muted">Loading workflow…</p>
      </div>
    );
  }

  if (!steps.length) return null;

  return (
    <div className="mb-3 rounded-md border border-border bg-surface px-3 py-2.5">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="text-xs font-semibold uppercase tracking-wide text-text-muted">{title}</p>
        <p className="text-[11px] text-text-muted">{steps.length} step{steps.length === 1 ? '' : 's'}</p>
      </div>
      <div className="flex flex-wrap items-center gap-1.5">
        {steps.map((step, index) => {
          const dotColor = resolveColor(step.colorCode);
          return (
            <div key={step.value || step.id || index} className="flex items-center gap-1.5">
              <span
                className="inline-flex items-center gap-1.5 rounded-md border border-border bg-row-hover/40 px-2 py-1 text-[11px] font-medium text-text"
                title={step.defaultStatus ? 'Default status' : undefined}
              >
                <span
                  className="h-2 w-2 shrink-0 rounded-full bg-primary/70"
                  style={dotColor ? { backgroundColor: dotColor } : undefined}
                />
                <span>{step.label || step.name}</span>
                {step.defaultStatus && (
                  <span className="rounded bg-primary/10 px-1 text-[10px] font-semibold text-primary">Default</span>
                )}
              </span>
              {index < steps.length - 1 && (
                <FiChevronRight className="h-3 w-3 shrink-0 text-text-muted" aria-hidden />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
