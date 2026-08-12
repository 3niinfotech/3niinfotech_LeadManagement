import { forwardRef } from 'react';
import { iconSize } from '../../theme/icons';
import { FORM_CONTROL_DEFAULT_SIZE, formControlClass } from '../../theme/formControls';
import FormField from './FormField';

const Input = forwardRef(function Input({
  label,
  error,
  hint,
  icon: Icon,
  size = FORM_CONTROL_DEFAULT_SIZE,
  containerClassName = '',
  className = '',
  id,
  required = false,
  ...props
}, ref) {
  const pad = Icon ? 'crm-field--leading-icon pr-3' : '';

  const control = (
    <div className="relative">
      {Icon && (
        <span className="crm-field-leading-icon" aria-hidden>
          <Icon className={iconSize.sm} />
        </span>
      )}
      <input
        ref={ref}
        id={id}
        className={`
          crm-input w-full rounded-lg
          placeholder:text-text-muted caret-primary-600
          disabled:opacity-50 disabled:cursor-not-allowed
          ${formControlClass(size, { error })}
          ${pad}
          ${className}
        `}
        {...props}
      />
    </div>
  );

  if (!label) return control;

  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} required={required} className={containerClassName}>
      {control}
    </FormField>
  );
});

export default Input;
