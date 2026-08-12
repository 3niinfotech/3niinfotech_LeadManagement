import { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { FiPlus, FiChevronDown } from 'react-icons/fi';
import { ENQUIRY_TAGS, getEnquiryTagMeta } from '../../../config/constants';
import { handleGridCellMenuScroll, gridCellMenuWheelProps } from '../../../components/table/gridCellMenu.utils';

const colorMap = {
  primary: 'bg-brand-soft text-brand border-brand/20',
  secondary: 'bg-row-hover text-text-secondary border-border',
  success: 'bg-success-soft text-success border-success/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  info: 'bg-info-soft text-info border-info/20',
};

const MAX_VISIBLE = 2;

function TagChip({ tag, compact = false }) {
  const meta = getEnquiryTagMeta(tag);
  const chipClass = colorMap[meta?.color || 'secondary'];
  return (
    <span
      className={`inline-flex items-center rounded-full border font-semibold leading-none shrink-0 ${chipClass} ${
        compact ? 'h-5 px-1.5 text-[9px]' : 'h-5 px-2 text-[10px]'
      }`}
      title={meta?.label || tag}
    >
      {meta?.label || tag}
    </span>
  );
}

export default function EnquiryTagChips({ tags = [], onChange }) {
  const [open, setOpen] = useState(false);
  const [menuPos, setMenuPos] = useState({ top: 0, left: 0, width: 0 });
  const [draft, setDraft] = useState(tags);
  const btnRef = useRef(null);
  const menuRef = useRef(null);

  const selected = useMemo(() => (Array.isArray(tags) ? tags : []), [tags]);
  const visible = selected.slice(0, MAX_VISIBLE);
  const overflow = selected.length - MAX_VISIBLE;

  useEffect(() => {
    if (!open) setDraft(selected);
  }, [open, selected]);

  const updatePosition = useCallback(() => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const menuWidth = 220;
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

  const toggleTag = (value) => {
    setDraft((prev) => (
      prev.includes(value) ? prev.filter((t) => t !== value) : [...prev, value]
    ));
  };

  const apply = (e) => {
    e?.stopPropagation();
    onChange(draft);
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
      className="fixed z-[1200] bg-card-bg border border-border rounded-lg shadow-dropdown overflow-hidden"
      style={{ top: menuPos.top, left: menuPos.left, width: menuPos.width }}
      onClick={(e) => e.stopPropagation()}
      {...gridCellMenuWheelProps}
    >
      <div className="px-3 py-2 border-b border-border">
        <p className="text-[11px] font-semibold text-text">Tags</p>
        <p className="text-[10px] text-text-muted">Select multiple</p>
      </div>
      <div className="p-2 max-h-52 overflow-y-auto no-scrollbar flex flex-wrap gap-1.5">
        {ENQUIRY_TAGS.map((tag) => {
          const active = draft.includes(tag.value);
          const chipClass = colorMap[tag.color || 'secondary'];
          return (
            <button
              key={tag.value}
              type="button"
              onClick={() => toggleTag(tag.value)}
              className={`inline-flex items-center h-6 px-2 rounded-full border text-[10px] font-semibold transition-all ${
                active ? `${chipClass} ring-1 ring-brand/30` : 'bg-white text-text-secondary border-border hover:bg-row-hover'
              }`}
            >
              {tag.label}
            </button>
          );
        })}
      </div>
      <div className="flex items-center justify-end gap-2 px-3 py-2 border-t border-border bg-[color-mix(in_srgb,var(--bg-page)_50%,transparent)]">
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); setOpen(false); }}
          className="text-[11px] font-medium text-text-muted hover:text-text px-2 py-1"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={apply}
          className="text-[11px] font-semibold text-white bg-brand hover:bg-brand/90 px-3 py-1 rounded-md"
        >
          Apply
        </button>
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
        className="inline-flex items-center gap-1 min-h-7 max-w-full px-1 py-0.5 rounded-md hover:bg-row-hover transition-colors"
        title={selected.length ? selected.map(getEnquiryTagMeta).map((m) => m?.label).filter(Boolean).join(', ') : 'Add tags'}
      >
        {selected.length === 0 ? (
          <span className="inline-flex items-center gap-1 h-6 px-2 rounded-full border border-dashed border-border text-[10px] font-medium text-text-muted">
            <FiPlus className="w-3 h-3" />
            Tags
          </span>
        ) : (
          <>
            {visible.map((tag) => (
              <TagChip key={tag} tag={tag} compact />
            ))}
            {overflow > 0 && (
              <span className="inline-flex items-center h-5 px-1.5 rounded-full bg-row-hover text-[9px] font-bold text-text-secondary">
                +{overflow}
              </span>
            )}
          </>
        )}
        <FiChevronDown className={`w-3 h-3 shrink-0 text-text-muted transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {menu}
    </>
  );
}
