import { useEffect, useRef } from 'react';

const ITEM_STYLES = {
  default: {
    btn: 'text-text hover:bg-slate-100 dark:hover:bg-slate-800/80',
    icon: 'text-text-muted',
  },
  primary: {
    btn: 'text-text hover:bg-primary/10 hover:text-primary',
    icon: 'text-primary',
  },
  success: {
    btn: 'text-text hover:bg-emerald-500/10 hover:text-emerald-600 dark:hover:text-emerald-400',
    icon: 'text-emerald-600 dark:text-emerald-400',
  },
  danger: {
    btn: 'text-rose-600 hover:bg-rose-500/10 dark:text-rose-400',
    icon: 'text-rose-600 dark:text-rose-400',
  },
  warning: {
    btn: 'text-text hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400',
    icon: 'text-amber-600 dark:text-amber-400',
  },
  info: {
    btn: 'text-text hover:bg-sky-500/10 hover:text-sky-600 dark:hover:text-sky-400',
    icon: 'text-sky-600 dark:text-sky-400',
  },
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
        absolute top-full mt-2 min-w-[240px] w-max max-w-xs p-1.5 z-50
        bg-white dark:bg-slate-900 border border-border rounded-xl
        shadow-2xl ring-1 ring-black/5 dark:ring-white/10
        ${align === 'right' ? 'right-0' : 'left-0'}
        ${className}
      `}
      role="menu"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const style = ITEM_STYLES[item.tone] || ITEM_STYLES.default;

          return (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              disabled={item.disabled}
              onClick={() => {
                item.onClick?.();
                onClose?.();
              }}
              className={`
                w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold text-left
                transition-all duration-150 whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed
                ${style.btn}
              `}
            >
              {Icon && <Icon className={`w-4 h-4 shrink-0 ${style.icon}`} />}
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
