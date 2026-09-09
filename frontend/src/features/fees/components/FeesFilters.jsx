import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import FilterPanel from '../../../components/ui/FilterPanel';
import { INVOICE_STATUS_OPTIONS } from '../config/feesConstants';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';

export default function FeesFilters({
  open,
  values,
  onChange,
  onSearch,
  onReset,
  onClose,
}) {
  const { options: currencyOptions } = useRelationalMasterOptions('currency', {}, { enabled: Boolean(open) });
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
        {INVOICE_STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </Select>

      <Select
        label="Currency"
        value={values.currency || ''}
        onChange={(e) => handleChange('currency', e.target.value)}
        placeholder="All currencies"
        size="sm"
      >
        <option value="">All currencies</option>
        {(currencyOptions || []).map((c) => (
          <option key={c.value} value={c.code || c.label}>
            {(c.code ? `${c.code} — ` : '') + c.label}
          </option>
        ))}
      </Select>

      <Input
        label="Due from"
        type="date"
        size="sm"
        value={values.dueFrom || ''}
        onChange={(e) => handleChange('dueFrom', e.target.value)}
      />

      <Input
        label="Due to"
        type="date"
        size="sm"
        value={values.dueTo || ''}
        onChange={(e) => handleChange('dueTo', e.target.value)}
      />

      <Select
        label="Sort by"
        value={values.sortBy || 'createdAt'}
        onChange={(e) => handleChange('sortBy', e.target.value)}
        size="sm"
      >
        <option value="createdAt">Created date</option>
        <option value="dueDate">Due date</option>
        <option value="total">Total</option>
        <option value="status">Status</option>
        <option value="invoiceNo">Invoice no</option>
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
