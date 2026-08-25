import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import IconButton from '../ui/IconButton';

/**
 * Navbar-anchored dropdown popover (notifications-style).
 * Portaled to body so header backdrop-blur does not clip it.
 */
export default function HeaderActionPopover({
  open,
  onClose,
  anchorEl,
  title,
  headerRight,
  children,
  width = 400,
  maxHeight = 520,
}) {
  const panelRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchorEl) return undefined;

    const place = () => {
      const rect = anchorEl.getBoundingClientRect();
      const gap = 10;
      const w = typeof width === 'number' ? width : parseInt(width, 10) || 400;
      let left = rect.right - w;
      left = Math.max(12, Math.min(left, window.innerWidth - w - 12));
      const top = Math.min(rect.bottom + gap, window.innerHeight - 24);
      setPos({ top, left });
    };

    place();
    window.addEventListener('resize', place);
    window.addEventListener('scroll', place, true);
    return () => {
      window.removeEventListener('resize', place);
      window.removeEventListener('scroll', place, true);
    };
  }, [open, anchorEl, width]);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    const onPointer = (e) => {
      const t = e.target;
      if (panelRef.current?.contains(t)) return;
      if (anchorEl?.contains?.(t)) return;
      onClose?.();
    };
    document.addEventListener('keydown', onKey);
    document.addEventListener('mousedown', onPointer);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.removeEventListener('mousedown', onPointer);
    };
  }, [open, onClose, anchorEl]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          ref={panelRef}
          role="dialog"
          aria-label={title}
          initial={{ opacity: 0, y: -8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -6, scale: 0.98 }}
          transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
          className="fixed z-[1450] flex flex-col rounded-2xl border border-border/80 bg-card-bg shadow-dropdown overflow-hidden ring-1 ring-black/[0.03]"
          style={{
            top: pos.top,
            left: pos.left,
            width,
            maxHeight: `min(${maxHeight}px, calc(100vh - ${pos.top + 16}px))`,
          }}
        >
          <div className="flex items-center justify-between gap-2 px-4 py-2.5 border-b border-border/70 shrink-0 bg-card-bg/95 backdrop-blur-sm">
            <h2 className="text-[13px] font-semibold tracking-tight text-text">{title}</h2>
            <div className="flex items-center gap-1">
              {headerRight}
              <IconButton icon={FiX} onClick={onClose} label="Close" size="sm" />
            </div>
          </div>
          <div className="flex-1 min-h-0 overflow-y-auto no-scrollbar overscroll-contain">
            {children}
          </div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
