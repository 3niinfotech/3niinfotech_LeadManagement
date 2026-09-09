import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import { useAsyncMasterOptions } from '../hooks/useAsyncMasterOptions';
import { pairMasterOption } from '../utils/masterFieldDisplay.utils';
import AsyncMasterSelectField from './AsyncMasterSelectField';

/**
 * Searchable master dropdown backed by server-side options (Course / University).
 * Stores the human-readable label — never code or UUID.
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

  const mapped = useMemo(() => {
    const pairs = options.map((opt) => pairMasterOption(
      { ...opt, value: opt.value, label: opt.label, name: opt.name, code: opt.code, universityName: opt.universityName },
      { disambiguate: entity === 'course' },
    )).filter(Boolean);

    if (valueMode === 'id') {
      return pairs.map((p) => ({ value: p.id || p.value, label: p.label, code: p.code }));
    }
    return pairs.map((p) => ({ value: p.value, label: p.label, code: p.code, id: p.id }));
  }, [options, valueMode, entity]);

  return (
    <Controller
      name={name}
      control={control}
      render={({ field }) => (
        <AsyncMasterSelectField
          field={field}
          label={label}
          entity={entity}
          errors={errors}
          name={name}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          loading={loading}
          mapped={mapped}
          setSearch={setSearch}
          hint={hint}
          valueMode={valueMode}
        />
      )}
    />
  );
}
