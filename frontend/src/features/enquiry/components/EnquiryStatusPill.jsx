import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown } from 'react-icons/fi';
import { getEnquiryStatusMeta, ENQUIRY_STATUSES } from '../../../config/constants';
import { handleGridCellMenuScroll, gridCellMenuWheelProps } from '../../../components/table/gridCellMenu.utils';

const colorMap = {
  primary: 'bg-brand-soft text-brand border-brand/20',
  secondary: 'bg-row-hover text-text-secondary border-border',
  success: 'bg-success-soft text-success border-success/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  info: 'bg-info-soft text-info border-info/20',
};

export default function EnquiryStatusPill({ status, onChange }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const meta = getEnquiryStatusMeta(status);
  const pillClass = colorMap[meta?.color || 'secondary'];
  const displayLabel = meta?.label || status;
  const tooltipText = meta?.description ? `${displayLabel} — ${meta.description}` : displayLabel;

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 260;
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
      className="fixed z-[1200] py-1 bg-card-bg border border-border rounded-lg shadow-dropdown max-h-80 overflow-y-auto no-scrollbar overscroll-contain"
      style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
      onClick={(e) => e.stopPropagation()}
      {...gridCellMenuWheelProps}
    >
      {ENQUIRY_STATUSES.map((s) => (
        <button
          key={s.value}
          type="button"
          onClick={() => pick(s.value)}
          className={`w-full text-left px-3 py-2 hover:bg-row-hover transition-colors ${
            s.value === status ? 'bg-brand-soft/60' : ''
          }`}
        >
          <span className={`block text-xs leading-tight ${
            s.value === status ? 'font-semibold text-brand' : 'font-medium text-text'
          }`}
          >
            {s.label}
          </span>
          {s.description && (
            <span className="block text-[10px] leading-snug text-text-muted mt-0.5">
              {s.description}
            </span>
          )}
        </button>
      ))}
    </div>,
    document.body,
  ) : null;

  return (
    <>
      <button
        ref={btnRef}
        type="button"
        onClick={toggle}
        className={`inline-flex items-center justify-center gap-1 min-w-[6.5rem] max-w-full h-7 px-2.5 rounded-full border text-[10px] font-semibold leading-none ${pillClass}`}
        title={tooltipText}
      >
        <span className="w-1.5 h-1.5 rounded-full bg-current opacity-80 shrink-0" />
        <span className="truncate">{displayLabel}</span>
        <FiChevronDown className={`w-3 h-3 shrink-0 opacity-60 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </>
  );
}
