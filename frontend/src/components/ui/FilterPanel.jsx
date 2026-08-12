import { FiX, FiRotateCcw } from 'react-icons/fi';
import Button from './Button';
import IconButton from './IconButton';
import ScrollArea from './ScrollArea';

/**
 * Collapsible advanced filter panel — use on any module page.
 */
export default function FilterPanel({
  open,
  title = 'Advanced Filters',
  activeCount = 0,
  onClose,
  onReset,
  onApply,
  applyLabel = 'Apply Filters',
  applyVariant = 'outline-primary',
  children,
  columns = 'grid-cols-2 sm:grid-cols-3 lg:grid-cols-5',
}) {
  return (
    <div
      className={`grid transition-[grid-template-rows] duration-300 ease-out border-b border-slate-200
        ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
    >
      <div className="overflow-hidden">
        <div className="bg-slate-50/80">
          <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-200/80 bg-white">
            <div className="flex items-center gap-2.5">
              <h3 className="text-[12px] font-semibold text-slate-700 uppercase tracking-wide">
                {title}
              </h3>
              {activeCount > 0 && (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-primary-100 text-primary-700">
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

          <ScrollArea axis="y" hideBar className="px-4 py-4 max-h-[220px]">
            <div className={`grid ${columns} gap-x-4 gap-y-3`}>
              {children}
            </div>
          </ScrollArea>

          <div className="flex items-center justify-end gap-2 px-4 py-2.5 border-t border-slate-200/80 bg-white">
            <Button
              variant="ghost"
              size="sm"
              icon={FiRotateCcw}
              onClick={onReset}
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
