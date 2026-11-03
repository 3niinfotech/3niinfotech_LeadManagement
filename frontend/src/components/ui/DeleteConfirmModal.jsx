import { FiAlertTriangle, FiTrash2 } from 'react-icons/fi';
import Modal from './Modal';
import Button from './Button';

/**
 * Clean, modern SaaS Delete Confirmation Modal.
 * Replaces native window.confirm() with a polished, accessible dialog.
 */
export default function DeleteConfirmModal({
  open,
  onClose,
  onConfirm,
  title = 'Delete Item?',
  subtitle = 'This action is permanent and cannot be undone.',
  itemName,
  itemType = 'Item',
  itemDetails,
  loading = false,
  confirmText = 'Delete',
  cancelText = 'Cancel',
}) {
  return (
    <Modal
      open={open}
      onClose={loading ? undefined : onClose}
      size="sm"
      compact
      title={title}
      subtitle={subtitle}
      footer={
        <>
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </Button>
          <Button
            type="button"
            size="sm"
            variant="danger"
            icon={FiTrash2}
            onClick={onConfirm}
            loading={loading}
          >
            {confirmText}
          </Button>
        </>
      }
    >
      <div className="flex flex-col gap-3 py-1">
        {/* Item preview card */}
        <div className="rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-700/80 p-3.5 flex items-start gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-100/80 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 border border-red-200/60 dark:border-red-900/60 shadow-2xs">
            <FiTrash2 className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold tracking-wider uppercase text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/60 px-1.5 py-0.5 rounded border border-red-200/60 dark:border-red-900/40">
                {itemType}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-900 dark:text-slate-100 mt-1 break-words leading-snug">
              {itemName || 'Selected item'}
            </p>
            {itemDetails && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">
                {itemDetails}
              </p>
            )}
          </div>
        </div>

        {/* Warning banner */}
        <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50/80 dark:bg-amber-950/30 p-2.5 rounded-lg border border-amber-200/60 dark:border-amber-900/40">
          <FiAlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <span className="leading-relaxed">
            Deleting this record will permanently remove all associated test submissions, results, and records from the database.
          </span>
        </div>
      </div>
    </Modal>
  );
}

