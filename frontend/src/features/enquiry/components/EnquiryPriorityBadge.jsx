import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown } from 'react-icons/fi';
import { getEnquiryPriorityMeta, ENQUIRY_PRIORITIES } from '../../../config/constants';
import { handleGridCellMenuScroll, gridCellMenuWheelProps } from '../../../components/table/gridCellMenu.utils';

const colorMap = {
  danger: 'bg-danger-soft text-danger border-danger/25',
  warning: 'bg-warning-soft text-warning border-warning/25',
  info: 'bg-info-soft text-info border-info/25',
  secondary: 'bg-row-hover text-text-secondary border-border',
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
    const menuWidth = 132;
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
      className="fixed z-[1200] py-1 bg-card-bg border border-border rounded-lg shadow-dropdown overflow-hidden"
      style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
      onClick={(e) => e.stopPropagation()}
      {...gridCellMenuWheelProps}
    >
      {ENQUIRY_PRIORITIES.map((item) => {
        const itemClass = colorMap[item.color];
        return (
          <button
            key={item.value}
            type="button"
            onClick={() => pick(item.value)}
            className={`w-full flex items-center gap-2 px-3 py-2 hover:bg-row-hover transition-colors ${
              item.value === priority ? 'bg-brand-soft/50' : ''
            }`}
          >
            <span className={`inline-flex items-center h-5 px-2 rounded-full border text-[10px] font-bold leading-none ${itemClass}`}>
              {item.label}
            </span>
          </button>
        );
      })}
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
