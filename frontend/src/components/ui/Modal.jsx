import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import IconButton from './IconButton';
import ScrollArea from './ScrollArea';
import { modals } from '../../theme';
import './modal.theme.css';

const overlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1, transition: { duration: 0.18, ease: 'easeOut' } },
  exit: { opacity: 0, transition: { duration: 0.14, ease: 'easeIn' } },
};

const panelMotion = {
  initial: { opacity: 0, scale: 0.96, y: 12 },
  animate: {
    opacity: 1,
    scale: 1,
    y: 0,
    transition: { duration: 0.22, ease: [0.16, 1, 0.3, 1] },
  },
  exit: {
    opacity: 0,
    scale: 0.96,
    y: 8,
    transition: { duration: 0.14, ease: [0.4, 0, 1, 1] },
  },
};

export default function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  size = 'md',
  footer,
  panelOverlay,
  className = '',
  variant = 'default',
  compact = false,
}) {
  const sizes = { sm: modals.sm, md: modals.md, lg: modals.lg, xl: modals.xl };
  const isForm = variant === 'form' && !compact;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.body.classList.add('crm-modal-open');
    return () => {
      document.body.style.overflow = prev;
      document.body.classList.remove('crm-modal-open');
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="crm-modal-wrapper"
          {...overlayMotion}
          className="fixed inset-0 z-[999999] flex items-center justify-center p-4 overflow-y-auto"
        >
          <div
            className="crm-modal-backdrop fixed inset-0 border-0 cursor-default"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            key="crm-modal-panel"
            {...panelMotion}
            className={`crm-modal-panel relative w-full flex flex-col overflow-hidden ${isForm ? 'crm-modal-panel--form' : compact ? 'crm-modal-panel--compact' : 'max-h-[min(90vh,880px)]'} ${className}`.trim()}
            style={{ maxWidth: sizes[size] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-modal-title"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="crm-modal-header flex items-start justify-between gap-3 shrink-0">
              <div className="min-w-0">
                <h2 id="crm-modal-title" className="crm-modal-title">
                  {title}
                </h2>
                {subtitle && <p className="crm-modal-subtitle">{subtitle}</p>}
              </div>
              <IconButton icon={FiX} onClick={onClose} label="Close" className="shrink-0" />
            </div>
            {isForm ? (
              <div className="crm-modal-body crm-modal-body--form">
                {children}
              </div>
            ) : compact ? (
              <div className="crm-modal-body">{children}</div>
            ) : (
              <ScrollArea axis="y" className="crm-modal-body flex-1 min-h-0">
                {children}
              </ScrollArea>
            )}
            {panelOverlay}
            {footer && (
              <div className="crm-modal-footer flex justify-end gap-2.5 shrink-0">
                {footer}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
