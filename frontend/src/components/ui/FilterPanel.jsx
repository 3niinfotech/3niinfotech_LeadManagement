import { FiX, FiRotateCcw, FiFilter } from 'react-icons/fi';
import Button from './Button';
import IconButton from './IconButton';
import ScrollArea from './ScrollArea';

/**
 * Collapsible advanced filter panel — use on any module page.
 * Soft brand-tinted surface so it reads as an active tool strip, not a blank card.
 */
export default function FilterPanel({
  open,
  title = 'Advanced Filters',
  activeCount = 0,
  onClose,
  onReset,
  onApply,
  applyLabel = 'Apply Filters',
  applyVariant = 'primary',
  children,
  columns = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out
        ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
    >
      <div className="overflow-hidden">
        <div className="border-y border-brand/15 bg-gradient-to-b from-brand-soft/70 via-brand-soft/35 to-page/80">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-brand/10">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand/10 text-brand shrink-0">
                <FiFilter className="w-3.5 h-3.5" />
              </span>
              <h3 className="text-[12px] font-semibold text-text uppercase tracking-wide">
                {title}
              </h3>
              {activeCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-brand text-white tabular-nums">
                  {activeCount} active
                </span>
              )}
            </div>
            <IconButton
              icon={FiX}
              label="Close filters"
              variant="toolbar"
              size="sm"
              onClick={onClose}
              className="!p-1.5"
            />
          </div>

          <ScrollArea axis="y" hideBar className="px-4 py-4 max-h-[240px]">
            <div className={`grid ${columns} gap-x-4 gap-y-3`}>
              {children}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-brand/10 bg-brand-soft/40">
            <Button
              variant="outline"
              size="sm"
              icon={FiRotateCcw}
              onClick={onReset}
              className="!bg-card-bg !border-border-strong hover:!bg-row-hover !text-text shadow-sm"
            >
              Reset
            </Button>
            <Button variant={applyVariant} size="sm" onClick={onApply}>
              {applyLabel}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
