/** Unified form control sizes — Input, Select, DatePicker, SearchInput */
export const FORM_CONTROL_DEFAULT_SIZE = 'sm';

export const FORM_CONTROL_SIZES = {
  sm: {
    key: 'sm',
    antSize: 'small',
    height: 36,
    triggerBtnClass: 'w-9',
  },
  md: {
    key: 'md',
    antSize: 'middle',
    height: 40,
    triggerBtnClass: 'w-10',
  },
};

export function getFormControlSize(size = FORM_CONTROL_DEFAULT_SIZE) {
  return FORM_CONTROL_SIZES[size] || FORM_CONTROL_SIZES[FORM_CONTROL_DEFAULT_SIZE];
}

/** Size class for CSS variables: crm-field--sm | crm-field--md */
export function formControlSizeClass(size) {
  return `crm-field--${getFormControlSize(size).key}`;
}

/** Shared field shell classes */
export function formControlClass(size, { error = false, className = '' } = {}) {
  return [
    'crm-field',
    formControlSizeClass(size),
    error ? 'crm-field--error' : '',
    className,
  ].filter(Boolean).join(' ');
}
