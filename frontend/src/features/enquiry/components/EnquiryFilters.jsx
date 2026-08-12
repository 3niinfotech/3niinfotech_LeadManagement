import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import DatePicker from '../../../components/ui/DatePicker';
import FilterPanel from '../../../components/ui/FilterPanel';
import { ENQUIRY_STATUSES, ENQUIRY_PRIORITIES } from '../../../config/constants';
import { useEnquiryTagOptions } from '../hooks/useEnquiryTagOptions';

const FIELDS = [
  { key: 'keyword', label: 'Keyword', placeholder: 'Name, email, mobile...' },
  { key: 'enquiryId', label: 'Enquiry ID', placeholder: 'ENQ000001' },
  { key: 'country', label: 'Country', placeholder: 'Canada' },
  { key: 'course', label: 'Course', placeholder: 'MBA' },
  { key: 'source', label: 'Source', placeholder: 'Website' },
  { key: 'status', label: 'Status', type: 'select', options: 'status' },
  { key: 'priority', label: 'Priority', type: 'select', options: 'priority' },
  { key: 'tag', label: 'Tag', type: 'select', options: 'tag' },
  { key: 'intake', label: 'Intake', placeholder: 'Sep-2026' },
  { key: 'applyLevel', label: 'Apply Level', placeholder: 'Masters' },
  { key: 'createdFrom', label: 'Created From', type: 'date' },
  { key: 'createdTo', label: 'Created To', type: 'date' },
];

export default function EnquiryFilters({ open, values, onChange, onSearch, onReset, onClose }) {
  const { options: tagOptions } = useEnquiryTagOptions();
  const activeCount = Object.values(values || {}).filter(Boolean).length;

  const renderField = (field) => {
    const val = values[field.key] || '';

    if (field.type === 'select') {
      const optionList = field.options === 'priority'
        ? ENQUIRY_PRIORITIES
        : field.options === 'tag'
          ? tagOptions
          : ENQUIRY_STATUSES;
      const placeholder = field.options === 'priority'
        ? 'All priorities'
        : field.options === 'tag'
          ? 'All tags'
          : 'All statuses';

      return (
        <Select
          key={field.key}
          label={field.label}
          value={val}
          onChange={(e) => onChange({ ...values, [field.key]: e.target.value })}
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
      return (
        <DatePicker
          key={field.key}
          label={field.label}
          value={val}
          onChange={(v) => onChange({ ...values, [field.key]: v })}
          placeholder="Pick date"
          size="sm"
          maxDate={field.key === 'createdFrom' && values.createdTo ? new Date(values.createdTo) : undefined}
          minDate={field.key === 'createdTo' && values.createdFrom ? new Date(values.createdFrom) : undefined}
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
      onClose={onClose}
      onReset={onReset}
      onApply={onSearch}
    >
      {FIELDS.map(renderField)}
    </FilterPanel>
  );
}
