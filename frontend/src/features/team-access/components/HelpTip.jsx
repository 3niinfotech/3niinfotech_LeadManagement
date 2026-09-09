import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { FiHelpCircle, FiX } from 'react-icons/fi';

/**
 * Click-to-open help popover — explains actions in plain language.
 */
export default function HelpTip({
  title,
  children,
  size = 15,
  className = '',
  align = 'right',
}) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0, width: 300 });

  useLayoutEffect(() => {
    if (!open) return undefined;
    const place = () => {
      const el = triggerRef.current;
      if (!el) return;
      const rect = el.getBoundingClientRect();
      const width = 300;
      let left = align === 'left' ? rect.left : rect.right - width;
      left = Math.max(12, Math.min(left, window.innerWidth - width - 12));
      const top = rect.bottom + 8;
      setPos({ top, left, width });
    };
    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, align]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    const onClick = (e) => {
      if (triggerRef.current?.contains(e.target)) return;
      setOpen(false);
    };
    window.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onClick);
    return () => {
      window.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onClick);
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className={`crm-help-tip__trigger ${className}`.trim()}
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        aria-label={title ? `Help: ${title}` : 'Help'}
        aria-expanded={open}
      >
        <FiHelpCircle size={size} strokeWidth={2} />
      </button>

      {open && createPortal(
        <>
          <div className="crm-help-tip__backdrop" aria-hidden />
          <div
            className="crm-help-tip__popover"
            style={{ top: pos.top, left: pos.left, width: pos.width }}
            role="dialog"
            aria-label={title || 'Help'}
          >
            <div className="crm-help-tip__popover-head">
              {title ? <p className="crm-help-tip__title">{title}</p> : null}
              <button type="button" className="crm-help-tip__close" onClick={() => setOpen(false)} aria-label="Close">
                <FiX size={14} />
              </button>
            </div>
            <div className="crm-help-tip__body">{children}</div>
          </div>
        </>,
        document.body,
      )}
    </>
  );
}
