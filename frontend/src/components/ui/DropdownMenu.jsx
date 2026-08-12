import { useEffect, useRef } from 'react';

const ITEM_STYLES = {
  default: 'text-slate-700 hover:bg-slate-50',
  primary: 'text-primary-700 hover:bg-primary-50',
  success: 'text-emerald-700 hover:bg-emerald-50',
  danger: 'text-red-600 hover:bg-red-50',
  warning: 'text-amber-700 hover:bg-amber-50',
  info: 'text-cyan-700 hover:bg-cyan-50',
};

/**
 * Dropdown menu for toolbar bulk actions etc.
 * items: [{ id, label, onClick, tone, disabled, icon }]
 */
export default function DropdownMenu({ open, onClose, items = [], align = 'right', className = '' }) {
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const handler = (e) => {
      if (!ref.current?.contains(e.target)) onClose?.();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      ref={ref}
      className={`
        absolute top-full mt-1.5 min-w-[168px] py-1 z-40
        bg-white border border-slate-200 rounded-xl shadow-dropdown
        ${align === 'right' ? 'right-0' : 'left-0'}
        ${className}
      `}
      role="menu"
    >
      {items.map((item) => {
        const Icon = item.icon;
        const tone = ITEM_STYLES[item.tone] || ITEM_STYLES.default;
        return (
          <button
            key={item.id}
            type="button"
            role="menuitem"
            disabled={item.disabled}
            onClick={() => { item.onClick?.(); onClose?.(); }}
            className={`
              w-full flex items-center gap-2.5 px-3 py-2 text-[13px] font-medium text-left
              transition-colors duration-150 disabled:opacity-40 disabled:cursor-not-allowed
              ${tone}
            `}
          >
            {Icon && <Icon className="w-4 h-4 shrink-0" />}
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
