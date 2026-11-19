import { useRef, useEffect, useState, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { FiChevronDown, FiCheck } from 'react-icons/fi';
import { useEnquiryStatusOptions } from '../hooks/useEnquiryStatusOptions';
import { handleGridCellMenuScroll, gridCellMenuWheelProps } from '../../../components/table/gridCellMenu.utils';

const colorMap = {
  primary: 'bg-brand-soft text-brand border-brand/20',
  secondary: 'bg-row-hover text-text-secondary border-border',
  success: 'bg-success-soft text-success border-success/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  info: 'bg-info-soft text-info border-info/20',
};

const STATUS_DOT_COLORS = {
  success: '#10b981',
  danger: '#ef4444',
  warning: '#f59e0b',
  primary: '#3b82f6',
  info: '#06b6d4',
  secondary: '#94a3b8',
};

function resolveDotColor(color) {
  if (!color) return '#94a3b8';
  if (color.startsWith?.('#')) return color;
  return STATUS_DOT_COLORS[color] || '#94a3b8';
}

function resolvePillClass(meta) {
  const color = meta?.color;
  if (color?.startsWith?.('#')) {
    return 'border';
  }
  return colorMap[color || 'secondary'];
}

function resolvePillStyle(meta) {
  const color = meta?.color;
  if (color?.startsWith?.('#')) {
    return {
      backgroundColor: `${color}18`,
      color,
      borderColor: `${color}33`,
    };
  }
  return undefined;
}

export default function EnquiryStatusPill({ status, onChange }) {
  const { statusOptions, getStatusMeta } = useEnquiryStatusOptions();
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const meta = getStatusMeta(status);
  const pillClass = resolvePillClass(meta);
  const pillStyle = resolvePillStyle(meta);
  const displayLabel = meta?.label || status;
  const tooltipText = meta?.description ? `${displayLabel} — ${meta.description}` : displayLabel;

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 230;
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
      className="fixed z-[1200] p-1.5 bg-card-bg border border-border rounded-xl shadow-xl max-h-80 overflow-y-auto no-scrollbar overscroll-contain backdrop-blur-md bg-white/98 dark:bg-slate-900/98 animate-in fade-in zoom-in-95 duration-100"
      style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
      onClick={(e) => e.stopPropagation()}
      {...gridCellMenuWheelProps}
    >
      <div className="px-2.5 py-1 mb-1 border-b border-border/60">
        <span className="text-[10px] font-bold uppercase tracking-wider text-text-muted">Change Status</span>
      </div>
      <div className="space-y-0.5">
        {statusOptions.map((s) => {
          const isSelected = s.value === status;
          const dotColor = resolveDotColor(s.color);
          return (
            <button
              key={s.value}
              type="button"
              onClick={() => pick(s.value)}
              className={`w-full flex items-center justify-between gap-2.5 px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                isSelected
                  ? 'bg-brand-soft text-brand font-semibold'
                  : 'hover:bg-row-hover text-text font-medium'
              }`}
            >
              <span className="flex items-center gap-2 truncate">
                <span
                  className="w-2 h-2 rounded-full shrink-0 ring-2 ring-black/5 dark:ring-white/10"
                  style={{ backgroundColor: dotColor }}
                />
                <span className="truncate">{s.label}</span>
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
        className={`inline-flex items-center justify-center gap-1 min-w-[6.5rem] max-w-full h-7 px-2.5 rounded-full border text-[10px] font-semibold leading-none ${pillClass}`}
        style={pillStyle}
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
