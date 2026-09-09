import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import DatePicker from '../../../components/ui/DatePicker';
import FilterPanel from '../../../components/ui/FilterPanel';
import {
  DEMO_ATTENDANCE_OPTIONS,
  DEMO_SESSION_STATUS_OPTIONS,
  DEMO_RESULT_OPTIONS,
  DEMO_CLASSES,
} from '../config/demoConstants';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import { useBranchOptions } from '../../enquiry/hooks/useBranchOptions';

export default function DemoFilters({
  open,
  values,
  onChange,
  onSearch,
  onReset,
  onClose,
  branchLocked = false,
  canViewAllBranches = true,
}) {
  const { options: facultyOptions } = useRelationalMasterOptions('faculty', {}, { enabled: Boolean(open) });
  const { options: branchOptions } = useBranchOptions();

  const activeCount = Object.values(values || {}).filter(Boolean).length;

  const handleChange = (key, val) => {
    onChange({ ...values, [key]: val });
  };

  return (
    <FilterPanel
      open={open}
      activeCount={activeCount}
      columns="grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7"
      onClose={onClose}
      onReset={onReset}
      onApply={onSearch}
    >
      <DatePicker
        label="From Date"
        value={values.from || ''}
        onChange={(v) => handleChange('from', v)}
        placeholder="Start date"
        size="sm"
      />

      <DatePicker
        label="To Date"
        value={values.to || ''}
        onChange={(v) => handleChange('to', v)}
        placeholder="End date"
        size="sm"
      />

      <Select
        label="Attendance"
        value={values.attendance || ''}
        onChange={(e) => handleChange('attendance', e.target.value)}
        placeholder="All Attendance"
        size="sm"
      >
        <option value="">All Attendance</option>
        {DEMO_ATTENDANCE_OPTIONS.map((a) => (
          <option key={a.value} value={a.value}>
            {a.label}
          </option>
        ))}
      </Select>

      <Select
        label="Session Status"
        value={values.sessionStatus || ''}
        onChange={(e) => handleChange('sessionStatus', e.target.value)}
        placeholder="All Statuses"
        size="sm"
      >
        <option value="">All Statuses</option>
        {DEMO_SESSION_STATUS_OPTIONS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </Select>

      <Select
        label="Outcome"
        value={values.result || ''}
        onChange={(e) => handleChange('result', e.target.value)}
        placeholder="All Outcomes"
        size="sm"
      >
        <option value="">All Outcomes</option>
        {DEMO_RESULT_OPTIONS.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </Select>

      <Select
        label="Course / Class"
        value={values.course || ''}
        onChange={(e) => handleChange('course', e.target.value)}
        placeholder="All Courses"
        size="sm"
      >
        <option value="">All Courses</option>
        {DEMO_CLASSES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </Select>

      <Select
        label="Faculty / Trainer"
        value={values.facultyId || ''}
        onChange={(e) => handleChange('facultyId', e.target.value)}
        placeholder="All Faculty"
        size="sm"
      >
        <option value="">All Faculty</option>
        {(facultyOptions || []).map((f) => (
          <option key={f.value || f.id} value={f.value || f.id}>
            {f.label || f.name}
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
            handleChange('branchId', e.target.value);
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
