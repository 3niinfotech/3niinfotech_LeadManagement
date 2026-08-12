import Select from '../../../components/ui/Select';
import { WALKIN_PRIORITIES, WALKIN_STATUSES } from '../config/walkin.constants';

export default function WalkInFilters({
  open, values, onChange, onSearch, onReset, onClose, branches = [], counsellors = [],
}) {
  if (!open) return null;

  return (
    <div className="px-4 py-3 border-b border-card-border bg-page/40">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <Select
          label="Branch"
          value={values.branchId || ''}
          onChange={(e) => onChange({ ...values, branchId: e.target.value })}
          options={[{ value: '', label: 'All branches' }, ...branches.map((b) => ({ value: b.id, label: b.name }))]}
        />
        <Select
          label="Counsellor"
          value={values.assignedToId || ''}
          onChange={(e) => onChange({ ...values, assignedToId: e.target.value })}
          options={[{ value: '', label: 'All counsellors' }, ...counsellors.map((u) => ({
            value: u.id,
            label: `${u.firstName} ${u.lastName || ''}`.trim(),
          }))]}
        />
        <Select
          label="Status"
          value={values.status || ''}
          onChange={(e) => onChange({ ...values, status: e.target.value })}
          options={[{ value: '', label: 'All statuses' }, ...WALKIN_STATUSES.map((s) => ({ value: s.value, label: s.label }))]}
        />
        <Select
          label="Priority"
          value={values.priority || ''}
          onChange={(e) => onChange({ ...values, priority: e.target.value })}
          options={[{ value: '', label: 'All priorities' }, ...WALKIN_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))]}
        />
      </div>
      <div className="flex justify-end gap-2 mt-3">
        <button type="button" className="text-sm text-text-secondary hover:text-text" onClick={onReset}>Reset</button>
        <button type="button" className="text-sm text-brand font-medium" onClick={onSearch}>Apply</button>
        <button type="button" className="text-sm text-text-secondary" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}
