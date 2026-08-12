import { Controller } from 'react-hook-form';
import Select from '../../../../components/ui/Select';

export default function FormSelectField({
  name,
  control,
  label,
  options = [],
  errors,
  required = false,
  placeholder = 'Select...',
  loading = false,
  allowClear,
  mode,
  ...props
}) {
  const isMultiple = mode === 'multiple' || mode === 'tags';

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          label={label}
          value={isMultiple ? (field.value ?? []) : (field.value ?? '')}
          onChange={(e) => field.onChange(e.target.value ?? '')}
          options={options}
          placeholder={placeholder}
          error={errors?.[name]?.message}
          loading={loading}
          allowClear={allowClear ?? !required}
          mode={mode}
          {...props}
        />
      )}
    />
  );
}
