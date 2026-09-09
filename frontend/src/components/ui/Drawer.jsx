import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiX } from 'react-icons/fi';
import IconButton from './IconButton';
import ScrollArea from './ScrollArea';
import { navbar as navbarTheme } from '../../theme';
import './drawer.theme.css';

const NAVBAR_HEIGHT = navbarTheme.height || '64px';

const SIZE_WIDTH = {
  sm: '420px',
  md: '480px',
  lg: '560px',
  xl: '640px',
};

const DRAWER_EASE = [0.32, 0.72, 0, 1];
const DRAWER_MS = 0.22;

/**
 * Theme drawer — dense master forms use `dense` + `footer` (no nested scroll padding clash).
 */
export default function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer = null,
  size,
  width = '480px',
  anchor = 'full',
  zIndex = 1200,
  dense = false,
  bodyClassName = '',
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

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!mounted) return null;

  const isHeaderAnchor = anchor === 'header';
  const panelWidth = (size && SIZE_WIDTH[size]) || width;
  const pad = dense ? 'crm-drawer-body--dense' : '';

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
            transition={{ duration: DRAWER_MS, ease: DRAWER_EASE }}
            className="absolute inset-0 bg-black/30"
            onClick={onClose}
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: DRAWER_MS, ease: DRAWER_EASE }}
            className={`
              crm-drawer-panel absolute right-0 bg-card-bg border-l border-border shadow-xl flex flex-col
              ${isHeaderAnchor ? 'rounded-tl-lg overflow-hidden' : ''}
              ${dense ? 'crm-drawer-panel--dense' : ''}
            `}
            style={{
              width: panelWidth,
              maxWidth: '100vw',
              ...(isHeaderAnchor
                ? { top: NAVBAR_HEIGHT, height: `calc(100dvh - ${NAVBAR_HEIGHT})` }
                : { top: 0, height: '100dvh' }),
            }}
          >
            <div className={`crm-drawer-header shrink-0 ${dense ? 'crm-drawer-header--dense' : ''}`}>
              <div className="min-w-0">
                <h2 className="crm-drawer-title">{title}</h2>
                {subtitle ? <p className="crm-drawer-subtitle">{subtitle}</p> : null}
              </div>
              <IconButton icon={FiX} onClick={onClose} label="Close drawer" />
            </div>

            <ScrollArea
              axis="y"
              className={`crm-drawer-body flex-1 min-h-0 text-text ${pad} ${bodyClassName}`.trim()}
            >
              {children}
            </ScrollArea>

            {footer ? (
              <div className={`crm-drawer-footer shrink-0 ${dense ? 'crm-drawer-footer--dense' : ''}`}>
                {footer}
              </div>
            ) : null}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );

  return createPortal(panel, document.body);
}
