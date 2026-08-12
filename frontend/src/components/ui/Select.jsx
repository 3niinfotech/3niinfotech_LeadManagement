import { forwardRef, useMemo, Children, isValidElement } from 'react';
import { Select as AntSelect } from 'antd';
import { FiChevronDown } from 'react-icons/fi';
import {
  FORM_CONTROL_DEFAULT_SIZE,
  formControlClass,
  getFormControlSize,
} from '../../theme/formControls';
import FormField from './FormField';

function parseOptions(options, children) {
  if (options?.length) {
    return options.map(({ value, label, disabled, ...rest }) => ({
      value,
      label,
      disabled,
      ...rest,
    }));
  }

  return Children.toArray(children)
    .filter((child) => isValidElement(child) && child.type === 'option')
    .map((child) => ({
      value: child.props.value,
      label: child.props.children,
      disabled: child.props.disabled,
    }));
}

function toAntValue(value, mode) {
  if (mode === 'multiple' || mode === 'tags') {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }
  if (value === '' || value == null) return undefined;
  return value;
}

/** Portal to body — avoids clip/wrong position inside overflow-hidden parents */
function defaultPopupContainer() {
  return document.body;
}

/**
 * Global searchable dropdown — Ant Design Select with CRM theme.
 * Backward compatible: onChange receives `{ target: { value, name } }` like native select.
 */
const Select = forwardRef(function Select({
  label,
  error,
  hint,
  options = [],
  placeholder = 'Select...',
  size = FORM_CONTROL_DEFAULT_SIZE,
  containerClassName = '',
  className = '',
  children,
  searchable = true,
  allowClear = true,
  showSearch,
  disabled = false,
  loading = false,
  mode,
  onChange,
  onClear,
  value,
  name,
  id,
  notFoundContent = 'No results found',
  getPopupContainer,
  classNames: classNamesProp,
  popupClassName,
  filterOption: filterOptionProp,
  optionRender,
  ...props
}, ref) {
  const antOptions = useMemo(() => parseOptions(options, children), [options, children]);
  const searchEnabled = showSearch ?? searchable;
  const sizeConfig = getFormControlSize(size);

  const popupRootClassName = useMemo(
    () => ['crm-ant-select-dropdown', classNamesProp?.popup?.root, popupClassName]
      .filter(Boolean)
      .join(' '),
    [classNamesProp?.popup?.root, popupClassName],
  );

  const mergedClassNames = useMemo(
    () => ({
      ...classNamesProp,
      popup: { ...classNamesProp?.popup, root: popupRootClassName },
    }),
    [classNamesProp, popupRootClassName],
  );

  const handleChange = (nextValue) => {
    const normalized = mode === 'multiple' || mode === 'tags'
      ? (nextValue ?? [])
      : (nextValue ?? '');
    onChange?.({ target: { value: normalized, name } });
  };

  const field = (
    <AntSelect
      ref={ref}
      id={id}
      {...props}
      className={`crm-ant-select w-full ${formControlClass(size, { error, className })}`.trim()}
      classNames={mergedClassNames}
      size={sizeConfig.antSize}
      placeholder={placeholder}
      options={antOptions}
      value={toAntValue(value, mode)}
      onChange={handleChange}
      onClear={onClear}
      disabled={disabled}
      loading={loading}
      mode={mode}
      showSearch={searchEnabled}
      allowClear={allowClear}
      optionFilterProp="label"
      filterOption={filterOptionProp ?? ((input, option) =>
        String(option?.label ?? '').toLowerCase().includes(input.trim().toLowerCase())
      )}
      optionRender={optionRender}
      suffixIcon={<FiChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />}
      notFoundContent={notFoundContent}
      listHeight={320}
      placement="bottomLeft"
      popupMatchSelectWidth
      getPopupContainer={getPopupContainer ?? defaultPopupContainer}
      styles={{ popup: { zIndex: 1400 } }}
    />
  );

  if (!label) return field;

  return (
    <FormField label={label} htmlFor={id} error={error} hint={hint} className={containerClassName}>
      {field}
    </FormField>
  );
});

export default Select;
