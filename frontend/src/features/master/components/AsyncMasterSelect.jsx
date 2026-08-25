import { Controller } from 'react-hook-form';
import Select from '../../../components/ui/Select';
import { useAsyncMasterOptions } from '../hooks/useAsyncMasterOptions';

/**
 * Searchable master dropdown backed by server-side options (Course / University).
 * Stores the option label by default so existing string columns keep working.
 */
export default function AsyncMasterSelect({
  name,
  control,
  label,
  entity,
  extraParams,
  errors,
  placeholder = 'Type to search…',
  required = false,
  disabled = false,
  valueMode = 'label',
  limit = 40,
  hint,
}) {
  const { options, loading, setSearch } = useAsyncMasterOptions(entity, extraParams, { enabled: !disabled, limit });

  const mapped = options.map((opt) => ({
    value: valueMode === 'id' ? opt.value : (opt.label || opt.name || opt.value),
    label: opt.label || opt.name || opt.value,
  }));

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <Select
          label={label}
          value={field.value ?? ''}
          onChange={(e) => field.onChange(e.target.value ?? '')}
          options={mapped}
          placeholder={placeholder}
          error={errors?.[name]?.message}
          loading={loading}
          allowClear={!required}
          disabled={disabled}
          showSearch
          filterOption={false}
          onSearch={(term) => setSearch(term)}
          notFoundContent={loading ? 'Searching…' : 'Type to search'}
          hint={hint}
        />
      )}
    />
  );
}
