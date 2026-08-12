import { forwardRef, useMemo, useState, useCallback } from 'react';
import { FiPlus } from 'react-icons/fi';
import Select from './Select';

const CREATE_PREFIX = '__crm_create__:';

function matchesOption(options, text) {
  const q = text.trim().toLowerCase();
  if (!q) return true;
  return options.some(
    (o) => String(o.label ?? '').toLowerCase() === q || String(o.value ?? '').toLowerCase() === q,
  );
}

/**
 * Standard single-select with optional custom value — no tag/chip UI.
 * Type to filter; shows "Use …" row when the typed value is not in the list.
 */
const CreatableSelect = forwardRef(function CreatableSelect({
  options = [],
  value,
  onChange,
  name,
  createLabel,
  onSearch,
  ...props
}, ref) {
  const [search, setSearch] = useState('');

  const handleSearch = useCallback((next) => {
    setSearch(next);
    onSearch?.(next);
  }, [onSearch]);

  const mergedOptions = useMemo(() => {
    const base = [...options];
    const trimmed = search.trim();

    if (value && !base.some((o) => o.value === value)) {
      base.unshift({ value, label: value });
    }

    if (trimmed && !matchesOption(options, trimmed)) {
      base.push({
        value: `${CREATE_PREFIX}${trimmed}`,
        label: createLabel ? createLabel(trimmed) : `Use "${trimmed}"`,
        isCreate: true,
      });
    }

    return base;
  }, [options, search, value, createLabel]);

  const handleChange = (e) => {
    let next = e.target.value;
    if (String(next).startsWith(CREATE_PREFIX)) {
      next = next.slice(CREATE_PREFIX.length);
    }
    setSearch('');
    onChange?.({ target: { value: next, name } });
  };

  const handleDropdownVisibleChange = (open) => {
    if (!open) setSearch('');
    props.onDropdownVisibleChange?.(open);
  };

  const handleInputKeyDown = (e) => {
    if (e.key === 'Enter' && search.trim() && !matchesOption(options, search)) {
      e.preventDefault();
      e.stopPropagation();
      const trimmed = search.trim();
      setSearch('');
      onChange?.({ target: { value: trimmed, name } });
    }
    props.onInputKeyDown?.(e);
  };

  return (
    <Select
      ref={ref}
      {...props}
      name={name}
      options={mergedOptions}
      value={value}
      onChange={handleChange}
      searchValue={search}
      onSearch={handleSearch}
      onDropdownVisibleChange={handleDropdownVisibleChange}
      onInputKeyDown={handleInputKeyDown}
      filterOption={(input, option) => {
        const isCreate = option?.isCreate
          || option?.data?.isCreate
          || String(option?.value ?? '').startsWith(CREATE_PREFIX);
        if (isCreate) return true;
        const q = input.trim().toLowerCase();
        if (!q) return true;
        return String(option?.label ?? '').toLowerCase().includes(q);
      }}
      optionRender={(option) => {
        const isCreate = option.data?.isCreate
          || String(option.value ?? '').startsWith(CREATE_PREFIX);
        if (isCreate) {
          return (
            <span className="crm-select-create-option">
              <FiPlus className="crm-select-create-option__icon" aria-hidden />
              {option.label}
            </span>
          );
        }
        return option.label;
      }}
    />
  );
});

export default CreatableSelect;
