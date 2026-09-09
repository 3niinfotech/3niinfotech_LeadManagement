import { useEffect, useMemo } from 'react';
import Select from '../../../components/ui/Select';
import { pairMasterOption } from '../utils/masterFieldDisplay.utils';

function AsyncMasterSelectField({
  field,
  label,
  entity,
  errors,
  name,
  placeholder,
  required,
  disabled,
  loading,
  mapped,
  setSearch,
  hint,
  valueMode,
}) {
  useEffect(() => {
    if (!field.value) return;
    const raw = String(field.value).trim();
    const inList = mapped.some((o) => o.value === raw || o.label === raw || o.code === raw);
    if (!inList) setSearch(raw);
  }, [field.value, mapped, setSearch]);

  useEffect(() => {
    if (!field.value || valueMode !== 'label') return;
    const raw = String(field.value).trim();
    const match = mapped.find((o) => o.code === raw || o.id === raw);
    if (match?.value && match.value !== raw) {
      field.onChange(match.value);
    }
  }, [field.value, mapped, valueMode, field]);

  return (
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
  );
}

export default AsyncMasterSelectField;
