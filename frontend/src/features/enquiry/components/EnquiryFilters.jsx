import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import DatePicker from '../../../components/ui/DatePicker';
import FilterPanel from '../../../components/ui/FilterPanel';
import { ENQUIRY_PRIORITIES } from '../../../config/constants';
import { useEnquiryTagOptions } from '../hooks/useEnquiryTagOptions';
import { useEnquiryStatusOptions } from '../hooks/useEnquiryStatusOptions';
import { useBranchOptions } from '../hooks/useBranchOptions';
import { useCounsellorOptions } from '../hooks/useCounsellorOptions';

const FIELDS = [
  { key: 'keyword', label: 'Keyword', placeholder: 'Name, email, mobile...' },
  { key: 'enquiryId', label: 'Enquiry ID', placeholder: 'ENQ000001' },
  { key: 'country', label: 'Country', placeholder: 'Canada' },
  { key: 'course', label: 'Course', placeholder: 'MBA' },
  { key: 'source', label: 'Source', placeholder: 'Website' },
  { key: 'status', label: 'Status', type: 'select', options: 'status' },
  { key: 'updatedFrom', label: 'Updated From', type: 'date' },
  { key: 'updatedTo', label: 'Updated To', type: 'date' },
  { key: 'branchId', label: 'Branch', type: 'select', options: 'branch' },
  { key: 'staffId', label: 'Staff', type: 'select', options: 'staff' },
  { key: 'priority', label: 'Priority', type: 'select', options: 'priority' },
  { key: 'tag', label: 'Tag', type: 'select', options: 'tag' },
  { key: 'otherReference', label: 'Other / Reference', placeholder: 'Reference / remark...' },
  { key: 'intake', label: 'Intake', placeholder: 'Sep-2026' },
  { key: 'applyLevel', label: 'Apply Level', placeholder: 'Masters' },
  { key: 'createdFrom', label: 'Created From', type: 'date' },
  { key: 'createdTo', label: 'Created To', type: 'date' },
];

export default function EnquiryFilters({ open, values, onChange, onSearch, onReset, onClose }) {
  const { options: tagOptions } = useEnquiryTagOptions();
  const { statusOptions } = useEnquiryStatusOptions();
  const { options: branchOptions } = useBranchOptions();
  const { options: staffOptions } = useCounsellorOptions({ branchId: values?.branchId, enabled: Boolean(open) });
  const activeCount = Object.values(values || {}).filter(Boolean).length;

  const renderField = (field) => {
    const val = values[field.key] || '';

    if (field.type === 'select') {
      const optionList = field.options === 'priority'
        ? ENQUIRY_PRIORITIES
        : field.options === 'tag'
          ? tagOptions
          : field.options === 'branch'
            ? branchOptions
            : field.options === 'staff'
              ? staffOptions
              : statusOptions;

      const placeholder = field.options === 'priority'
        ? 'All priorities'
        : field.options === 'tag'
          ? 'All tags'
          : field.options === 'branch'
            ? 'All branches'
            : field.options === 'staff'
              ? 'All staff'
              : 'All statuses';

      return (
        <Select
          key={field.key}
          label={field.label}
          value={val}
          onChange={(e) => {
            // Prevent stale staff selection when branch changes.
            if (field.key === 'branchId') {
              onChange({ ...values, branchId: e.target.value, staffId: undefined });
              return;
            }
            onChange({ ...values, [field.key]: e.target.value });
          }}
          placeholder={placeholder}
          size="sm"
        >
          {optionList.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </Select>
      );
    }

    if (field.type === 'date') {
      const computedMaxDate = field.key === 'createdFrom' && values.createdTo
        ? new Date(values.createdTo)
        : field.key === 'updatedFrom' && values.updatedTo
          ? new Date(values.updatedTo)
          : undefined;

      const computedMinDate = field.key === 'createdTo' && values.createdFrom
        ? new Date(values.createdFrom)
        : field.key === 'updatedTo' && values.updatedFrom
          ? new Date(values.updatedFrom)
          : undefined;

      return (
        <DatePicker
          key={field.key}
          label={field.label}
          value={val}
          onChange={(v) => onChange({ ...values, [field.key]: v })}
          placeholder="Pick date"
          size="sm"
          maxDate={computedMaxDate}
          minDate={computedMinDate}
        />
      );
    }

    return (
      <Input
        key={field.key}
        label={field.label}
        size="sm"
        value={val}
        placeholder={field.placeholder}
        onChange={(e) => onChange({ ...values, [field.key]: e.target.value })}
      />
    );
  };

  return (
    <FilterPanel
      open={open}
      activeCount={activeCount}
      columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
      onClose={onClose}
      onReset={onReset}
      onApply={onSearch}
    >
      {FIELDS.map(renderField)}
    </FilterPanel>
  );
}
