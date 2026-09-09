import Select from '../../../components/ui/Select';
import { WALKIN_PRIORITIES, WALKIN_STATUSES } from '../config/walkin.constants';

export default function WalkInFilters({
  open,
  values,
  onChange,
  onSearch,
  onReset,
  onClose,
  branches = [],
  counsellors = [],
  branchLocked = false,
  canViewAllBranches = true,
}) {
  if (!open) return null;

  return (
    <div className="crm-reception-filters">
      <div className="crm-reception-filters__grid">
        <Select
          label={branchLocked ? 'Branch (Active)' : 'Branch'}
          value={values.branchId || ''}
          disabled={branchLocked}
          hint={branchLocked ? 'Locked to navbar Active Branch' : undefined}
          onChange={(e) => {
            if (branchLocked) return;
            onChange({ ...values, branchId: e.target.value });
          }}
          options={[
            ...(canViewAllBranches && !branchLocked
              ? [{ value: '', label: 'All branches' }]
              : []),
            ...branches.map((b) => ({ value: b.id, label: b.name })),
          ]}
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

        <div className="crm-reception-filters__actions">
          <button type="button" className="crm-reception-filters__btn" onClick={onReset}>Reset</button>
          <button type="button" className="crm-reception-filters__btn crm-reception-filters__btn--primary" onClick={onSearch}>
            Apply
          </button>
          <button type="button" className="crm-reception-filters__btn" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
}
