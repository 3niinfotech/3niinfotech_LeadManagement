import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import Drawer from '../../../components/ui/Drawer';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import FormField from '../../../components/ui/FormField';
import { useRelationalMasterOptions, useBranchOptions } from '../hooks/useRelationalMasterOptions';
import { useAsyncMasterOptions } from '../hooks/useAsyncMasterOptions';

function emptyDefaults(fields = [], fieldDefaults = {}) {
  const out = {};
  fields.forEach((f) => {
    if (fieldDefaults[f.name] !== undefined) {
      out[f.name] = fieldDefaults[f.name];
      return;
    }
    if (f.type === 'switch') {
      out[f.name] = f.defaultValue !== undefined ? f.defaultValue : (f.name === 'isActive' ? true : false);
    } else if (f.type === 'number') {
      out[f.name] = f.name === 'sortOrder' || f.name === 'position' ? 0 : '';
    } else {
      out[f.name] = '';
    }
  });
  return out;
}

function normalizeIncoming(record, fields, fieldDefaults = {}) {
  const base = emptyDefaults(fields, fieldDefaults);
  if (!record) return base;
  fields.forEach((f) => {
    let value = record[f.name];
    if (f.name === 'variables' && Array.isArray(value)) {
      value = value.join(', ');
    }
    if (value === null || value === undefined) value = base[f.name];
    if (f.type === 'switch') {
      const switchDefault = f.defaultValue !== undefined ? f.defaultValue : (f.name === 'isActive' ? true : false);
      value = Boolean(record[f.name] ?? switchDefault);
    }
    base[f.name] = value;
  });
  return base;
}

function DependentOptionsSelect({
  field,
  value,
  onChange,
  error,
  disabled,
  watch,
  setValue,
}) {
  const parentValue = field.dependsOn ? watch(field.dependsOn) : null;
  const params = useMemo(() => {
    if (!field.dependsOn || !parentValue) return {};
    return { [field.dependsParam || field.dependsOn]: parentValue };
  }, [field.dependsOn, field.dependsParam, parentValue]);

  const enabled = !field.dependsOn || Boolean(parentValue);
  const isLarge = field.optionsEntity === 'course' || field.optionsEntity === 'university';
  const asyncOpts = useAsyncMasterOptions(field.optionsEntity, params, {
    enabled: enabled && !disabled && isLarge,
  });
  const relOpts = useRelationalMasterOptions(field.optionsEntity, params, {
    enabled: enabled && !disabled && !isLarge,
  });
  const options = (isLarge ? asyncOpts.options : relOpts.options).map((o) => ({
    value: field.optionValueField === 'label' ? (o.label || o.name || o.value) : o.value,
    label: o.label || o.name || o.value,
  }));
  const loading = isLarge ? asyncOpts.loading : relOpts.loading;

  useEffect(() => {
    if (field.dependsOn && !parentValue && value) {
      setValue(field.name, '');
    }
  }, [field.dependsOn, field.name, parentValue, setValue, value]);

  return (
    <FormField label={field.label} required={field.required} error={error}>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        options={options}
        placeholder={loading ? 'Loading...' : (isLarge ? `Search ${field.label}` : `Select ${field.label}`)}
        disabled={disabled || !enabled || (loading && !isLarge)}
        allowClear={!field.required}
        showSearch
        filterOption={isLarge ? false : undefined}
        onSearch={isLarge ? (term) => asyncOpts.setSearch(term) : undefined}
        notFoundContent={isLarge ? (loading ? 'Searching…' : 'Type to search') : undefined}
      />
    </FormField>
  );
}

function FieldControl({
  field,
  control,
  errors,
  disabled,
  watch,
  setValue,
}) {
  const error = errors?.[field.name]?.message;

  if (field.type === 'options') {
    return (
      <Controller
        name={field.name}
        control={control}
        render={({ field: rhf }) => (
          <DependentOptionsSelect
            field={field}
            value={rhf.value}
            onChange={(v) => {
              rhf.onChange(v);
              (field.clears || []).forEach((c) => setValue(c, ''));
            }}
            error={error}
            disabled={disabled}
            watch={watch}
            setValue={setValue}
          />
        )}
      />
    );
  }

  if (field.type === 'branch') {
    return (
      <Controller
        name={field.name}
        control={control}
        render={({ field: rhf }) => (
          <BranchSelect
            label={field.label}
            value={rhf.value}
            onChange={rhf.onChange}
            error={error}
            disabled={disabled}
            required={field.required}
          />
        )}
      />
    );
  }

  if (field.type === 'select') {
    return (
      <Controller
        name={field.name}
        control={control}
        render={({ field: rhf }) => (
          <FormField label={field.label} required={field.required} error={error}>
            <Select
              value={rhf.value || ''}
              onChange={(e) => rhf.onChange(e.target.value)}
              options={field.options || []}
              disabled={disabled}
              allowClear={!field.required}
            />
          </FormField>
        )}
      />
    );
  }

  if (field.type === 'textarea') {
    return (
      <Controller
        name={field.name}
        control={control}
        render={({ field: rhf }) => (
          <FormField label={field.label} required={field.required} error={error}>
            <Textarea
              {...rhf}
              rows={5}
              disabled={disabled}
              placeholder={field.label}
            />
          </FormField>
        )}
      />
    );
  }

  if (field.type === 'switch') {
    return (
      <Controller
        name={field.name}
        control={control}
        render={({ field: rhf }) => (
          <FormField label={field.label} error={error}>
            <label className="inline-flex items-center gap-2 text-sm text-text">
              <input
                type="checkbox"
                checked={Boolean(rhf.value)}
                onChange={(e) => rhf.onChange(e.target.checked)}
                disabled={disabled}
                className="rounded border-border"
              />
              {field.label || 'On'}
            </label>
          </FormField>
        )}
      />
    );
  }

  if (field.type === 'number') {
    return (
      <Controller
        name={field.name}
        control={control}
        render={({ field: rhf }) => (
          <FormField label={field.label} required={field.required} error={error}>
            <Input
              type="number"
              value={rhf.value ?? ''}
              onChange={(e) => rhf.onChange(e.target.value === '' ? '' : Number(e.target.value))}
              disabled={disabled}
            />
          </FormField>
        )}
      />
    );
  }

  return (
    <Controller
      name={field.name}
      control={control}
      render={({ field: rhf }) => (
        <FormField label={field.label} required={field.required} error={error}>
          <Input
            {...rhf}
            disabled={disabled}
            maxLength={field.maxLength}
            placeholder={field.label}
          />
        </FormField>
      )}
    />
  );
}

function BranchSelect({ label, value, onChange, error, disabled, required }) {
  const { options, loading } = useBranchOptions({ enabled: !disabled });
  return (
    <FormField label={label} required={required} error={error}>
      <Select
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        options={options}
        placeholder={loading ? 'Loading...' : 'Select branch'}
        disabled={disabled || loading}
        allowClear={!required}
      />
    </FormField>
  );
}

export default function MasterFormDrawer({
  open,
  mode = 'add',
  entityConfig,
  record,
  submitting = false,
  fieldDefaults = {},
  onClose,
  onSubmit,
}) {
  const fields = entityConfig?.fields || [];
  const schema = entityConfig?.schema;
  const readOnly = mode === 'view';

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: schema ? zodResolver(schema) : undefined,
    defaultValues: emptyDefaults(fields, fieldDefaults),
  });

  useEffect(() => {
    if (!open) return;
    reset(normalizeIncoming(mode === 'add' ? null : record, fields, fieldDefaults));
  }, [open, mode, record, fields, reset, fieldDefaults]);

  const title = mode === 'add'
    ? `Add ${entityConfig?.singular || 'Record'}`
    : mode === 'edit'
      ? `Edit ${entityConfig?.singular || 'Record'}`
      : `View ${entityConfig?.singular || 'Record'}`;

  const submit = handleSubmit(async (values) => {
    if (readOnly) return;
    const payload = { ...values };
    // normalize empties
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') payload[k] = null;
    });
    if (typeof payload.variables === 'string') {
      payload.variables = payload.variables
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    await onSubmit?.(payload);
  });

  return (
    <Drawer open={open} onClose={onClose} title={title} width="520px" anchor="header">
      <form className="flex flex-col h-full" onSubmit={submit}>
        <div className="flex-1 overflow-auto p-5 space-y-4">
          {fields.map((field) => (
            <FieldControl
              key={field.name}
              field={field}
              control={control}
              errors={errors}
              disabled={readOnly || submitting || isSubmitting}
              watch={watch}
              setValue={setValue}
            />
          ))}
        </div>
        <div className="shrink-0 border-t border-border px-5 py-3 flex justify-end gap-2 bg-card-bg">
          <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button type="submit" loading={submitting || isSubmitting}>
              {mode === 'add' ? 'Create' : 'Save changes'}
            </Button>
          )}
        </div>
      </form>
    </Drawer>
  );
}
