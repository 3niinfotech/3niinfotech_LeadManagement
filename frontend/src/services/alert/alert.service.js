import Swal from 'sweetalert2';
import '../alert/sweetalert.theme.css';

const popupClass = 'crm-swal-popup';
const wideClass = 'crm-swal-popup--wide';

const base = {
  buttonsStyling: false,
  allowOutsideClick: true,
  allowEscapeKey: true,
  focusConfirm: false,
  reverseButtons: true,
  heightAuto: false,
  customClass: {
    container: 'crm-swal',
    popup: popupClass,
    title: 'crm-swal-title',
    htmlContainer: 'crm-swal-text',
    actions: 'crm-swal-actions',
    confirmButton: 'crm-swal-btn crm-swal-btn--confirm',
    cancelButton: 'crm-swal-btn crm-swal-btn--cancel',
    closeButton: 'crm-swal-close',
    input: 'crm-swal-input',
  },
  showClass: {
    popup: 'swal2-show-animate',
    backdrop: 'swal2-backdrop-show',
  },
  hideClass: {
    popup: 'swal2-hide-animate',
    backdrop: 'swal2-backdrop-hide',
  },
};

function mergeConfig(overrides = {}) {
  const { customClass: cc = {}, ...rest } = overrides;
  return {
    ...base,
    ...rest,
    customClass: { ...base.customClass, ...cc },
  };
}

function withPopupClass(extra = {}, wide = false) {
  return {
    ...extra,
    popup: wide ? `${popupClass} ${wideClass}` : popupClass,
  };
}

function dangerConfirmBtn() {
  return { customClass: { confirmButton: 'crm-swal-btn crm-swal-btn--danger' } };
}

function successConfirmBtn() {
  return { customClass: { confirmButton: 'crm-swal-btn crm-swal-btn--success' } };
}

export const alertService = {
  /** Generic confirm — returns true if confirmed */
  confirm: async ({
    title = 'Confirm Action',
    text = 'Are you sure you want to proceed?',
    html,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    icon = 'question',
    variant = 'primary',
    showCancel = true,
    width,
  } = {}) => {
    const variantClass = variant === 'danger'
      ? dangerConfirmBtn().customClass
      : variant === 'success'
        ? successConfirmBtn().customClass
        : {};

    const result = await Swal.fire(mergeConfig({
      title,
      text: html ? undefined : text,
      html,
      icon,
      showCancelButton: showCancel,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      customClass: withPopupClass(variantClass, Boolean(width)),
    }));

    return result.isConfirmed;
  },

  /** Delete confirmation preset */
  deleteConfirm: async ({
    title = 'Delete',
    text = 'This item will be permanently removed. This action cannot be undone.',
    confirmText = 'Yes, delete',
    cancelText = 'Cancel',
    itemName,
  } = {}) => {
    const message = itemName
      ? `${text}<br/><br/><strong>${itemName}</strong>`
      : text;

    const result = await Swal.fire(mergeConfig({
      title,
      html: message,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      customClass: withPopupClass(dangerConfirmBtn().customClass, true),
    }));

    return result.isConfirmed;
  },

  /** Soft-delete preset */
  softDeleteConfirm: async ({
    title = 'Delete',
    text = 'This record will be soft-deleted. You can restore it later if needed.',
    confirmText = 'Yes, delete',
    cancelText = 'Cancel',
    itemName,
  } = {}) => alertService.deleteConfirm({ title, text, confirmText, cancelText, itemName }),

  /** Text input prompt — returns { isConfirmed, value } */
  prompt: async ({
    title = 'Enter value',
    text,
    confirmText = 'Submit',
    cancelText = 'Cancel',
    inputLabel,
    inputPlaceholder = '',
    inputValue = '',
    input = 'text',
    icon = 'question',
    variant = 'danger',
    inputValidator,
  } = {}) => {
    const result = await Swal.fire(mergeConfig({
      title,
      text,
      input,
      inputLabel,
      inputPlaceholder,
      inputValue,
      icon,
      showCancelButton: true,
      confirmButtonText: confirmText,
      cancelButtonText: cancelText,
      inputValidator: inputValidator
        ? (value) => {
            const err = inputValidator(value);
            return err || undefined;
          }
        : undefined,
      customClass: withPopupClass(
        variant === 'danger' ? dangerConfirmBtn().customClass : {},
        true,
      ),
    }));

    return {
      isConfirmed: result.isConfirmed,
      value: result.value,
    };
  },

  /** Success alert (auto-close) */
  success: async (title, text, timer = 2200) => {
    await Swal.fire(mergeConfig({
      title,
      text,
      icon: 'success',
      showConfirmButton: false,
      timer,
      timerProgressBar: true,
      customClass: withPopupClass(successConfirmBtn().customClass),
    }));
  },

  /** Error alert */
  error: async (title = 'Error', text = 'Something went wrong') => {
    await Swal.fire(mergeConfig({
      title,
      text,
      icon: 'error',
      confirmButtonText: 'OK',
      customClass: withPopupClass(dangerConfirmBtn().customClass),
    }));
  },

  /** Info alert */
  info: async (title, text) => {
    await Swal.fire(mergeConfig({
      title,
      text,
      icon: 'info',
      confirmButtonText: 'Got it',
    }));
  },

  /** Warning alert */
  warning: async (title, text, confirmText = 'OK') => {
    const result = await Swal.fire(mergeConfig({
      title,
      text,
      icon: 'warning',
      showCancelButton: false,
      confirmButtonText: confirmText,
    }));
    return result.isConfirmed;
  },

  /** Bulk action confirm */
  bulkConfirm: async ({
    action = 'delete',
    count,
    entity = 'items',
  } = {}) => {
    const labels = {
      delete: { title: `Delete ${count} ${entity}?`, text: `You are about to delete ${count} selected ${entity}. This cannot be undone.`, btn: 'Delete all' },
      export: { title: `Export ${count} ${entity}?`, text: `Export ${count} selected ${entity} to file?`, btn: 'Export' },
      assign: { title: `Assign ${count} ${entity}?`, text: `Assign ${count} selected ${entity} to a team member?`, btn: 'Continue' },
    };
    const cfg = labels[action] || labels.delete;
    return alertService.confirm({
      title: cfg.title,
      text: cfg.text,
      confirmText: cfg.btn,
      icon: action === 'delete' ? 'warning' : 'question',
      variant: action === 'delete' ? 'danger' : 'primary',
    });
  },

  close: () => Swal.close(),
  isVisible: () => Swal.isVisible(),
};

export default alertService;
