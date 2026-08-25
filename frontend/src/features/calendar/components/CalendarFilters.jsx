import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import {
  CALENDAR_CATEGORIES,
  CALENDAR_EVENT_TYPES,
} from '../constants/calendar.constants';

function CheckRow({ checked, label, onChange }) {
  return (
    <label className="flex items-center gap-2 py-1 text-sm text-text-primary cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        className="h-4 w-4 rounded border border-field-border bg-bg-input text-brand focus:ring-brand/30 focus:ring-2"
      />
      <span>{label}</span>
    </label>
  );
}

export default function CalendarFilters({
  filters,
  toggleCategory,
  toggleEventType,
  setField,
  onReset,
  branchOptions = [],
  counsellorOptions = [],
}) {
  return (
    <aside className="no-scrollbar w-full lg:w-[260px] shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card-bg overflow-y-auto max-h-[46vh] lg:max-h-none">
      <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-5">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">Category</p>
          {CALENDAR_CATEGORIES.map((c) => (
            <CheckRow
              key={c.id}
              label={c.label}
              checked={filters.categories.includes(c.id)}
              onChange={() => toggleCategory(c.id)}
            />
          ))}
        </div>

        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted mb-2">Event type</p>
          {CALENDAR_EVENT_TYPES.map((t) => (
            <CheckRow
              key={t.id}
              label={t.label}
              checked={filters.eventTypes.includes(t.id)}
              onChange={() => toggleEventType(t.id)}
            />
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Assigned to</p>
          <Select
            value={filters.assignedTo}
            onChange={(e) => setField('assignedTo', e.target.value)}
            options={[{ value: '', label: 'Anyone' }, ...counsellorOptions]}
          />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Branch</p>
          <Select
            value={filters.branchId}
            onChange={(e) => setField('branchId', e.target.value)}
            options={[{ value: '', label: 'All branches' }, ...branchOptions]}
          />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Status</p>
          <Select
            value={filters.status}
            onChange={(e) => setField('status', e.target.value)}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'OVERDUE', label: 'Overdue' },
              { value: 'PENDING', label: 'Pending' },
              { value: 'SCHEDULED', label: 'Scheduled' },
              { value: 'COMPLETED', label: 'Completed' },
            ]}
          />
        </div>

        <div className="space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Priority</p>
          <Select
            value={filters.priority}
            onChange={(e) => setField('priority', e.target.value)}
            options={[
              { value: '', label: 'All priorities' },
              { value: 'HIGH', label: 'High' },
              { value: 'VIP', label: 'VIP' },
              { value: 'MEDIUM', label: 'Medium' },
              { value: 'NORMAL', label: 'Normal' },
              { value: 'LOW', label: 'Low' },
            ]}
          />
        </div>

        <Button variant="outline" size="sm" className="w-full sm:self-end" onClick={onReset}>
          Reset filters
        </Button>
      </div>
    </aside>
  );
}
