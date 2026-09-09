import { useEffect, useMemo } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import MasterFormShell from './MasterFormShell';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import FormField from '../../../components/ui/FormField';
import MasterFormSection from './MasterFormSection';
import MasterSwitchField from './MasterSwitchField';
import { useRelationalMasterOptions, useBranchOptions } from '../hooks/useRelationalMasterOptions';
import { useAsyncMasterOptions } from '../hooks/useAsyncMasterOptions';
import {
  resolveMasterFormLayout,
  resolveModalProps,
  masterFormSubtitle,
  masterSubmitLabel,
} from '../utils/masterFormLayout.util';
import '../styles/master-form.theme.css';

const FULL_WIDTH_TYPES = new Set(['textarea', 'switch', 'options']);
const FULL_WIDTH_NAMES = new Set([
  'name', 'description', 'addressLine1', 'addressLine2', 'email', 'phone',
  'variables', 'label', 'value',
]);

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

function isFullWidth(field, columns) {
  if (columns === 1) return true;
  if (field.fullWidth) return true;
  if (FULL_WIDTH_TYPES.has(field.type) && field.type !== 'options') return true;
  if (field.type === 'textarea') return true;
  if (field.type === 'switch') return false;
  if (FULL_WIDTH_NAMES.has(field.name) && field.type !== 'number') {
    return field.name === 'name' || field.name === 'description' || field.name === 'variables'
      || field.name === 'addressLine1' || field.name === 'addressLine2';
  }
  return false;
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
        placeholder={loading ? 'Loading…' : (isLarge ? `Search ${field.label}` : `Select ${field.label}`)}
        disabled={disabled || !enabled || (loading && !isLarge)}
        allowClear={!field.required}
        showSearch
        filterOption={isLarge ? false : undefined}
        onSearch={isLarge ? (term) => asyncOpts.setSearch(term) : undefined}
        notFoundContent={isLarge ? (loading ? 'Searching…' : 'Type to search') : 'No results found'}
      />
    </FormField>
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
        placeholder={loading ? 'Loading…' : 'Select branch'}
        disabled={disabled || loading}
        allowClear={!required}
        showSearch
        notFoundContent={loading ? 'Loading…' : 'No results found'}
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
              rows={field.rows || 3}
              disabled={disabled}
              placeholder={field.placeholder || field.label}
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
          <MasterSwitchField
            label={field.label || 'Active'}
            checked={Boolean(rhf.value)}
            onChange={rhf.onChange}
            disabled={disabled}
            error={error}
          />
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
              placeholder={field.placeholder || field.label}
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
            placeholder={field.placeholder || field.label}
          />
        </FormField>
      )}
    />
  );
}

function SectionFields({
  fields,
  columns,
  control,
  errors,
  disabled,
  watch,
  setValue,
}) {
  const switches = fields.filter((f) => f.type === 'switch');
  const others = fields.filter((f) => f.type !== 'switch');
  const gridClass = columns === 2 ? 'crm-master-drawer-grid--2col' : '';

  return (
    <>
      {others.length > 0 && (
        <div className={`crm-master-drawer-grid ${gridClass}`}>
          {others.map((field) => (
            <div
              key={field.name}
              className={isFullWidth(field, columns) ? 'crm-master-drawer-grid__full' : undefined}
            >
              <FieldControl
                field={field}
                control={control}
                errors={errors}
                disabled={disabled}
                watch={watch}
                setValue={setValue}
              />
            </div>
          ))}
        </div>
      )}
      {switches.length > 0 && (
        <div className={`crm-master-drawer-grid--switches ${others.length ? 'mt-3' : ''}`}>
          {switches.map((field) => (
            <FieldControl
              key={field.name}
              field={field}
              control={control}
              errors={errors}
              disabled={disabled}
              watch={watch}
              setValue={setValue}
            />
          ))}
        </div>
      )}
    </>
  );
}

/**
 * Shared master Add/Edit/View form — adaptive modal (compact or structured).
 * @deprecated import name MasterFormDrawer kept for compatibility; uses modal not drawer.
 */
export default function MasterFormDrawer({
  open,
  mode = 'add',
  entityConfig,
  record,
  submitting = false,
  submitError = null,
  fieldDefaults = {},
  onClose,
  onSubmit,
}) {
  const fields = entityConfig?.fields || [];
  const schema = entityConfig?.schema;
  const readOnly = mode === 'view';
  const singular = entityConfig?.singular || 'Record';

  const layout = useMemo(() => resolveMasterFormLayout(entityConfig), [entityConfig]);
  const modalProps = useMemo(() => resolveModalProps(layout), [layout]);

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
    ? `Add ${singular}`
    : mode === 'edit'
      ? `Edit ${singular}`
      : `View ${singular}`;

  const subtitle = masterFormSubtitle(mode, singular);

  const submit = handleSubmit(async (values) => {
    if (readOnly) return;
    const payload = { ...values };
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

  const busy = submitting || isSubmitting;
  const primaryLabel = masterSubmitLabel(mode, singular, busy);

  return (
    <MasterFormShell
      open={open}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      error={submitError}
      {...modalProps}
      footer={(
        <>
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={busy}>
            {readOnly ? 'Close' : 'Cancel'}
          </Button>
          {!readOnly && (
            <Button type="submit" form="crm-master-entity-form" size="sm" loading={busy}>
              {primaryLabel}
            </Button>
          )}
        </>
      )}
    >
      <form id="crm-master-entity-form" className="crm-master-form" onSubmit={submit} noValidate>
        {layout.sections.map((section) => (
          <MasterFormSection key={section.id} title={section.title}>
            <SectionFields
              fields={section.fields}
              columns={layout.columns}
              control={control}
              errors={errors}
              disabled={readOnly || busy}
              watch={watch}
              setValue={setValue}
            />
          </MasterFormSection>
        ))}
      </form>
    </MasterFormShell>
  );
}
