import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import { getEnquiryPriorityMeta, ENQUIRY_PRIORITIES } from '../../../config/constants';
import { handleGridCellMenuScroll, gridCellMenuWheelProps } from '../../../components/table/gridCellMenu.utils';

const colorMap = {
  danger: 'bg-danger-soft text-danger border-danger/25',
  warning: 'bg-warning-soft text-warning border-warning/25',
  info: 'bg-info-soft text-info border-info/25',
  secondary: 'bg-row-hover text-text-secondary border-border',
};

const PRIORITY_DOT_COLORS = {
  danger: '#ef4444',
  warning: '#f59e0b',
  info: '#06b6d4',
  secondary: '#94a3b8',
};

export default function EnquiryPriorityBadge({ priority, onChange }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const meta = getEnquiryPriorityMeta(priority) || getEnquiryPriorityMeta('MEDIUM');
  const pillClass = colorMap[meta?.color || 'secondary'];
  const displayLabel = meta?.label || priority || 'Medium';

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 152;
    const left = Math.min(rect.left, window.innerWidth - menuWidth - 8);
    setMenuPos({
      top: rect.bottom + 4,
      left: Math.max(8, left),
      width: menuWidth,
    });
  }, []);

  const toggle = (e) => {
    e.stopPropagation();
    if (!open) updatePosition();
    setOpen((v) => !v);
  };

  const pick = (value) => {
    onChange(value);
    setOpen(false);
  };

  useEffect(() => {
    if (!open) return undefined;
    const onDoc = (e) => {
      if (btnRef.current?.contains(e.target) || menuRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    const onScroll = (e) => handleGridCellMenuScroll(e, menuRef, updatePosition);
    const onResize = () => updatePosition();
    document.addEventListener('mousedown', onDoc);
    window.addEventListener('scroll', onScroll, true);
    window.addEventListener('resize', onResize);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      window.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('resize', onResize);
    };
  }, [open, updatePosition]);

  const menu = open ? createPortal(
    <div
      ref={menuRef}
      className="fixed z-[1200] p-1.5 bg-card-bg border border-border rounded-xl shadow-xl overflow-hidden backdrop-blur-md bg-white/98 dark:bg-slate-900/98 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
      onClick={(e) => e.stopPropagation()}
      {...gridCellMenuWheelProps}
    >
      <div className="px-2.5 py-1 mb-1 border-b border-border/60">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Set Priority</span>
      </div>
      <div className="space-y-0.5">
        {ENQUIRY_PRIORITIES.map((item) => {
          const itemClass = colorMap[item.color];
          const isSelected = item.value === priority;
          const dotColor = PRIORITY_DOT_COLORS[item.color] || '#94a3b8';
          return (
            <button
              key={item.value}
              type="button"
              onClick={() => pick(item.value)}
              className={`w-full flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                isSelected ? 'bg-brand-soft text-brand font-semibold' : 'hover:bg-row-hover text-text'
              }`}
            >
              <span className="flex items-center gap-2">
                <span
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: dotColor }}
                />
                <span className={`inline-flex items-center h-5 px-2 rounded-full border text-[10px] font-bold leading-none ${itemClass}`}>
                  {item.label}
                </span>
              </span>
              {isSelected && <FiCheck className="w-3.5 h-3.5 text-brand shrink-0" />}
            </button>
          );
        })}
      </div>
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`inline-flex items-center justify-center gap-1 min-w-[5.75rem] max-w-full h-7 px-2.5 rounded-full border text-[11px] font-bold leading-none tracking-wide ${pillClass}`}
        title={`Priority: ${displayLabel}`}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
        <span className="truncate">{displayLabel}</span>
        <FiChevronDown className={`w-3 h-3 shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </>
  );
}
