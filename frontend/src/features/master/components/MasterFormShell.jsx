import { useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import '../styles/master-form.theme.css';

/**
 * Shared modal shell for master Add/Edit/View forms.
 * Simple masters: compact modal. Complex: structured scrollable form modal.
 */
export default function MasterFormShell({
  open,
  onClose,
  title,
  subtitle,
  footer,
  children,
  size = 'md',
  variant = 'default',
  compact = false,
  error = null,
}) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const body = (
    <>
      {error ? <div className="crm-master-form-error" role="alert">{error}</div> : null}
      <div className="crm-master-form-scroll">
        {children}
      </div>
    </>
  );

  if (variant === 'form') {
    return (
      <Modal
        open={open}
        onClose={onClose}
        title={title}
        subtitle={subtitle}
        size={size}
        variant="form"
        className="crm-master-form-modal"
        footer={footer}
      >
        <div className="crm-form-modal-layout">
          <div className="crm-form-panel">
            {body}
          </div>
        </div>
      </Modal>
    );
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      size={size}
      variant="default"
      compact={compact}
      className="crm-master-form-modal"
      footer={footer}
    >
      {body}
    </Modal>
  );
}
