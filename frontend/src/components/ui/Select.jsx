import { forwardRef, useMemo, Children, isValidElement } from 'react';
import { Select as AntSelect } from 'antd';
import { FiChevronDown } from 'react-icons/fi';
import {
  FORM_CONTROL_DEFAULT_SIZE,
  formControlClass,
  getFormControlSize,
} from '../../theme/formControls';
import FormField from './FormField';
import CountryFlagLabel from './CountryFlagLabel';
import { normalizeCountryIso } from '../../utils/countryFlag.util';

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

function toAntValue(value, mode, antOptions = []) {
  if (mode === 'multiple' || mode === 'tags') {
    if (Array.isArray(value)) return value;
    return value ? [value] : [];
  }
  if (value == null) return undefined;
  if (value === '') {
    const hasEmptyOption = antOptions.some((o) => o?.value === '');
    if (hasEmptyOption) return '';
    return undefined;
  }
  return value;
}

function optionLooksLikeCountry(opt) {
  if (!opt) return false;
  if (opt.isoCode) return true;
  // Country master options often use name as value/label
  return Boolean(normalizeCountryIso(opt.label) || normalizeCountryIso(opt.value));
}

function CountryOptionLabel({ option, size = 'xs' }) {
  const country = {
    name: option?.label,
    isoCode: option?.isoCode,
    code: option?.code,
  };
  return <CountryFlagLabel country={country} size={size} />;
}

/** Portal to body — avoids clip/wrong position inside overflow-hidden parents */
function defaultPopupContainer() {
  return document.body;
}

/**
 * Global searchable dropdown — Ant Design Select with CRM theme.
 * Backward compatible: onChange receives `{ target: { value, name } }` like native select.
 * When options carry isoCode (or resolvable country names), flags render automatically.
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
  labelRender,
  showCountryFlags,
  ...props
}, ref) {
  const antOptions = useMemo(() => parseOptions(options, children), [options, children]);
  const searchEnabled = showSearch ?? searchable;
  const sizeConfig = getFormControlSize(size);

  const countryFlagsEnabled = useMemo(() => {
    if (showCountryFlags === false) return false;
    if (showCountryFlags === true) return true;
    if (antOptions.some((o) => o?.isoCode)) return true;
    // Country-labeled fields: resolve flags from option names (India → IN)
    if (/country/i.test(String(label || ''))) {
      return antOptions.some((o) => optionLooksLikeCountry(o));
    }
    return false;
  }, [antOptions, showCountryFlags, label]);

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

  const defaultOptionRender = (oriOption) => {
    const data = oriOption?.data || oriOption;
    if (countryFlagsEnabled && optionLooksLikeCountry(data)) {
      return <CountryOptionLabel option={data} />;
    }
    return oriOption?.label ?? data?.label;
  };

  const defaultLabelRender = (propsLabel) => {
    if (!countryFlagsEnabled) return propsLabel.label;
    const match = antOptions.find((o) => String(o.value) === String(propsLabel.value));
    if (match && optionLooksLikeCountry(match)) {
      return <CountryOptionLabel option={match} />;
    }
    // Free-text / name value without matching option id
    if (propsLabel.label && normalizeCountryIso(propsLabel.label)) {
      return <CountryFlagLabel country={propsLabel.label} size="xs" />;
    }
    return propsLabel.label;
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
      value={toAntValue(value, mode, antOptions)}
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
      optionRender={optionRender ?? (countryFlagsEnabled ? defaultOptionRender : undefined)}
      labelRender={labelRender ?? (countryFlagsEnabled ? defaultLabelRender : undefined)}
      suffixIcon={<FiChevronDown className="w-4 h-4 text-slate-400 pointer-events-none" />}
      notFoundContent={notFoundContent}
      listHeight={320}
      placement="bottomLeft"
      popupMatchSelectWidth
      getPopupContainer={getPopupContainer ?? defaultPopupContainer}
      dropdownStyle={{ zIndex: 99999999 }}
      styles={{ popup: { root: { zIndex: 99999999 } } }}
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
