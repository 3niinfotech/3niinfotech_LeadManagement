import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import IconButton from './IconButton';
import ScrollArea from './ScrollArea';
import { modals } from '../../theme';
import './modal.theme.css';

const panelMotion = {
  initial: { opacity: 0, scale: 0.94, y: 16 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.97, y: 8 },
  transition: { type: 'spring', damping: 28, stiffness: 360 },
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

  if (!mounted) return null;

  const content = (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[999999] flex items-center justify-center p-4">
          <motion.button
            type="button"
            aria-label="Close dialog"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="crm-modal-backdrop fixed inset-0 border-0 cursor-default"
            onClick={onClose}
          />
          <motion.div
            {...panelMotion}
            className={`crm-modal-panel relative w-full flex flex-col overflow-hidden ${isForm ? 'crm-modal-panel--form' : compact ? 'crm-modal-panel--compact' : 'max-h-[min(90vh,880px)]'} ${className}`.trim()}
            style={{ maxWidth: sizes[size] }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="crm-modal-title"
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
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(content, document.body);
}
