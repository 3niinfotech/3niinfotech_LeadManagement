import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import IconButton from './IconButton';
import ScrollArea from './ScrollArea';
import { navbar as navbarTheme } from '../../theme';

const NAVBAR_HEIGHT = navbarTheme.height || '64px';

/**
 * Drawer overlay — portaled to document.body so header backdrop-blur
 * does not trap fixed positioning inside the navbar.
 */
export default function Drawer({
  open,
  onClose,
  title,
  children,
  width = '480px',
  anchor = 'full',
  zIndex = 1200,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  if (!mounted) return null;

  const isHeaderAnchor = anchor === 'header';

  const panel = (
    <AnimatePresence>
      {open && (
        <div
          className="fixed inset-0"
          style={{ zIndex }}
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/45 backdrop-blur-[2px]"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%', opacity: 0.6 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0.4 }}
            transition={{ type: 'spring', damping: 32, stiffness: 340 }}
            className={`
              absolute right-0 bg-card-bg border-l border-border shadow-2xl flex flex-col
              ${isHeaderAnchor ? 'rounded-tl-2xl overflow-hidden' : ''}
            `}
            style={{
              width,
              ...(isHeaderAnchor
                ? { top: NAVBAR_HEIGHT, height: `calc(100% - ${NAVBAR_HEIGHT})` }
                : { top: 0, height: '100%' }),
            }}
          >
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-border shrink-0 bg-card-bg/95 backdrop-blur-sm">
              <h2 className="text-base font-semibold text-text">{title}</h2>
              <IconButton icon={FiX} onClick={onClose} label="Close drawer" />
            </div>
            <ScrollArea axis="y" className="crm-drawer-body flex-1 min-h-0 p-5 text-text">
              {children}
            </ScrollArea>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(panel, document.body);
}
