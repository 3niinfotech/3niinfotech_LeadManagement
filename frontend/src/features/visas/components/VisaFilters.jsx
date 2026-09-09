import Select from '../../../components/ui/Select';
import FilterPanel from '../../../components/ui/FilterPanel';
import { VISA_STATUS_OPTIONS } from '../config/visaConstants';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';

export default function VisaFilters({
  open,
  values,
  onChange,
  onSearch,
  onReset,
  onClose,
}) {
  const { options: countryOptions } = useRelationalMasterOptions('country', {}, { enabled: Boolean(open) });

  const activeCount = Object.values(values || {}).filter(Boolean).length;

  const handleChange = (key, val) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <FilterPanel
      open={open}
      activeCount={activeCount}
      columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4"
      onClose={onClose}
      onReset={onReset}
      onApply={onSearch}
    >
      <Select
        label="Status"
        value={values.status || ''}
        onChange={(e) => handleChange('status', e.target.value)}
        placeholder="All statuses"
        size="sm"
      >
        <option value="">All statuses</option>
        {VISA_STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </Select>

      <Select
        label="Country"
        value={values.countryId || ''}
        onChange={(e) => handleChange('countryId', e.target.value)}
        placeholder="All countries"
        size="sm"
      >
        <option value="">All countries</option>
        {(countryOptions || []).map((c) => (
          <option key={c.value} value={c.value}>{c.label}</option>
        ))}
      </Select>

      <Select
        label="Sort by"
        value={values.sortBy || 'createdAt'}
        onChange={(e) => handleChange('sortBy', e.target.value)}
        size="sm"
      >
        <option value="createdAt">Created date</option>
        <option value="status">Status</option>
        <option value="country">Country</option>
        <option value="visaType">Visa type</option>
      </Select>

      <Select
        label="Order"
        value={values.sortOrder || 'desc'}
        onChange={(e) => handleChange('sortOrder', e.target.value)}
        size="sm"
      >
        <option value="desc">Newest first</option>
        <option value="asc">Oldest first</option>
      </Select>
    </FilterPanel>
  );
}
