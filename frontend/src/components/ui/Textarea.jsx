import { forwardRef } from 'react';
import { FORM_CONTROL_DEFAULT_SIZE, formControlClass } from '../../theme/formControls';
import FormField from './FormField';

const Textarea = forwardRef(function Textarea({
  label,
  error,
  hint,
  size = FORM_CONTROL_DEFAULT_SIZE,
  containerClassName = '',
  className = '',
  id,
  rows = 3,
  ...props
}, ref) {
  const control = (
    <textarea
      ref={ref}
      id={id}
      rows={rows}
      className={`
        crm-input w-full rounded-lg resize-y min-h-[4.5rem]
        placeholder:text-text-muted caret-primary-600
        disabled:opacity-50 disabled:cursor-not-allowed
        ${formControlClass(size, { error })}
        ${className}
      `}
      {...props}
    />
  );

  if (!label) return control;

  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} className={containerClassName}>
      {control}
    </FormField>
  );
});

export default Textarea;
