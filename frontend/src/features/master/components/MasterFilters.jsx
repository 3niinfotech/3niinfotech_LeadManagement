import { useEffect, useMemo, useState } from 'react';
import FilterPanel from '../../../components/ui/FilterPanel';
import FormField from '../../../components/ui/FormField';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { useRelationalMasterOptions, useBranchOptions } from '../hooks/useRelationalMasterOptions';

function OptionsFilter({ filter, value, onChange, parentValue }) {
  const params = useMemo(() => {
    if (!filter.dependsOn || !parentValue) return {};
    return { [filter.dependsParam || filter.dependsOn]: parentValue };
  }, [filter.dependsOn, filter.dependsParam, parentValue]);

  const enabled = !filter.dependsOn || Boolean(parentValue);
  const { options, loading } = useRelationalMasterOptions(filter.optionsEntity, params, { enabled });

  return (
    <FormField label={filter.label}>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        options={[{ value: '', label: 'All' }, ...options]}
        placeholder={loading ? 'Loading...' : `All ${filter.label}`}
        allowClear
        disabled={!enabled || loading}
      />
    </FormField>
  );
}

function BranchFilter({ value, onChange }) {
  const { options, loading } = useBranchOptions();
  return (
    <FormField label="Branch">
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        options={[{ value: '', label: 'All' }, ...options]}
        placeholder={loading ? 'Loading...' : 'All branches'}
        allowClear
      />
    </FormField>
  );
}

export default function MasterFilters({
  open,
  filterDefs = [],
  values,
  onClose,
  onApply,
  onReset,
}) {
  const [draft, setDraft] = useState(values || { status: 'all' });

  useEffect(() => {
    if (open) setDraft(values || { status: 'all' });
  }, [open, values]);

  const activeCount = useMemo(() => Object.entries(values || {}).filter(([k, v]) => {
    if (k === 'status') return v && v !== 'all';
    return v !== undefined && v !== null && v !== '';
  }).length, [values]);

  const setField = (name, value) => {
    setDraft((prev) => {
      const next = { ...prev, [name]: value };
      // clear dependents
      filterDefs.forEach((f) => {
        if (f.dependsOn === name) next[f.name] = '';
      });
      return next;
    });
  };

  return (
    <FilterPanel
      open={open}
      title="Master Filters"
      activeCount={activeCount}
      onClose={onClose}
      onReset={() => {
        const reset = { status: 'all' };
        setDraft(reset);
        onReset?.(reset);
      }}
      onApply={() => onApply?.(draft)}
    >
      {filterDefs.map((filter) => {
        if (filter.type === 'select') {
          return (
            <FormField key={filter.name} label={filter.label}>
              <Select
                value={draft[filter.name] ?? filter.defaultValue ?? ''}
                onChange={(e) => setField(filter.name, e.target.value)}
                options={filter.options || []}
                searchable={false}
                allowClear={false}
              />
            </FormField>
          );
        }
        if (filter.type === 'text') {
          return (
            <FormField key={filter.name} label={filter.label}>
              <Input
                value={draft[filter.name] || ''}
                onChange={(e) => setField(filter.name, e.target.value)}
                placeholder={filter.label}
              />
            </FormField>
          );
        }
        if (filter.type === 'branch') {
          return (
            <BranchFilter
              key={filter.name}
              value={draft[filter.name]}
              onChange={(v) => setField(filter.name, v)}
            />
          );
        }
        if (filter.type === 'options') {
          return (
            <OptionsFilter
              key={filter.name}
              filter={filter}
              value={draft[filter.name]}
              parentValue={filter.dependsOn ? draft[filter.dependsOn] : null}
              onChange={(v) => setField(filter.name, v)}
            />
          );
        }
        return null;
      })}
    </FilterPanel>
  );
}
