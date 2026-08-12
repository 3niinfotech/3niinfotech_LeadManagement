import { useEffect, useRef } from 'react';
import alertService from '../../services/alert/alert.service';

/**
 * @deprecated Prefer alertService.confirm() / alertService.deleteConfirm() directly.
 * Thin compatibility wrapper — fires SweetAlert2 when `open` becomes true.
 */
export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Confirm Action',
  message = 'Are you sure you want to proceed?',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  variant = 'danger',
  loading = false,
  children,
}) {
  const firedRef = useRef(false);

  useEffect(() => {
    if (!open) {
      firedRef.current = false;
      return;
    }
    if (firedRef.current || loading) return;
    firedRef.current = true;

    const run = async () => {
      const isDelete = variant === 'danger';
      const confirmed = children
        ? await alertService.confirm({
            title,
            html: `<p class="text-sm" style="margin-bottom:0.75rem">${message}</p>`,
            confirmText,
            cancelText,
            variant,
            icon: isDelete ? 'warning' : 'question',
          })
        : isDelete
          ? await alertService.softDeleteConfirm({ title, text: message, confirmText, cancelText })
          : await alertService.confirm({ title, text: message, confirmText, cancelText, variant });

      if (confirmed) await onConfirm?.();
      onClose?.();
      firedRef.current = false;
    };

    run();
  }, [open, loading, title, message, confirmText, cancelText, variant, onConfirm, onClose, children]);

  return null;
}
