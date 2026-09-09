import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import DatePicker from '../../../components/ui/DatePicker';
import FilterPanel from '../../../components/ui/FilterPanel';
import { useStudentStatusOptions } from '../hooks/useStudentStatusOptions';
import { useBranchOptions } from '../../enquiry/hooks/useBranchOptions';
import { useCounsellorOptions } from '../../enquiry/hooks/useCounsellorOptions';

export default function StudentFilters({
  open,
  values,
  onChange,
  onSearch,
  onReset,
  onClose,
  branchLocked = false,
  canViewAllBranches = true,
}) {
  const { statusOptions } = useStudentStatusOptions();
  const { options: branchOptions } = useBranchOptions();
  const { options: staffOptions } = useCounsellorOptions({ branchId: values?.branchId, enabled: Boolean(open) });

  const activeCount = Object.values(values || {}).filter(Boolean).length;

  const handleChange = (key, val) => {
    onChange({ ...values, [key]: val });
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
      <DatePicker
        label="Created From"
        value={values.createdFrom || ''}
        onChange={(v) => handleChange('createdFrom', v)}
        placeholder="Start date"
        size="sm"
      />

      <DatePicker
        label="Created To"
        value={values.createdTo || ''}
        onChange={(v) => handleChange('createdTo', v)}
        placeholder="End date"
        size="sm"
      />

      <Select
        label="Status"
        value={values.status || ''}
        onChange={(e) => handleChange('status', e.target.value)}
        placeholder="All Statuses"
        size="sm"
      >
        <option value="">All Statuses</option>
        {statusOptions.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>

      <Input
        label="Target Country"
        placeholder="e.g. Canada, UK, US"
        value={values.country || ''}
        onChange={(e) => handleChange('country', e.target.value)}
        size="sm"
      />

      <Input
        label="Course / Field"
        placeholder="e.g. Computer Science, MBA"
        value={values.course || ''}
        onChange={(e) => handleChange('course', e.target.value)}
        size="sm"
      />

      <Select
        label="Assigned Counsellor"
        value={values.assignedToId || ''}
        onChange={(e) => handleChange('assignedToId', e.target.value)}
        placeholder="All Counsellors"
        size="sm"
      >
        <option value="">All Counsellors</option>
        {(staffOptions || []).map((staff) => (
          <option key={staff.value} value={staff.value}>
            {staff.label}
          </option>
        ))}
      </Select>

      {branchOptions?.length > 1 && (
        <Select
          label={branchLocked ? 'Branch (Active)' : 'Branch'}
          value={values.branchId || ''}
          disabled={branchLocked}
          hint={branchLocked ? 'Locked to navbar Active Branch' : undefined}
          onChange={(e) => {
            if (branchLocked) return;
            onChange({ ...values, branchId: e.target.value, assignedToId: undefined });
          }}
          placeholder={branchLocked ? 'Active branch' : 'All Branches'}
          size="sm"
        >
          {canViewAllBranches && !branchLocked ? (
            <option value="">All Branches</option>
          ) : null}
          {branchOptions.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </Select>
      )}
    </FilterPanel>
  );
}
