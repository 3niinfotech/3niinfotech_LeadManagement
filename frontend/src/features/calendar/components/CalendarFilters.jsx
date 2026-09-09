import { FiCheck, FiRotateCcw, FiSliders } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import {
  CALENDAR_CATEGORIES,
  CALENDAR_EVENT_TYPES,
  CALENDAR_FILTER_PRESETS,
} from '../constants/calendar.constants';

function FilterCheck({ checked, label, icon: Icon, tone = 'brand', count, onChange }) {
  return (
    <button
      type="button"
      className={`crm-calendar-check ${checked ? 'crm-calendar-check--on' : ''}`}
      onClick={onChange}
      aria-pressed={checked}
    >
      <span className="crm-calendar-check__box" aria-hidden>
        <FiCheck className="w-2.5 h-2.5" strokeWidth={3} />
      </span>
      {Icon && (
        <span className={`crm-calendar-check__icon crm-calendar-check__icon--${tone}`} aria-hidden>
          <Icon className="w-3 h-3" />
        </span>
      )}
      <span className="crm-calendar-check__label truncate">{label}</span>
      {count != null && (
        <span className="crm-calendar-check__count">{count}</span>
      )}
    </button>
  );
}

function FilterSection({ title, onAll, onNone, children }) {
  return (
    <section className="crm-calendar-filter-section">
      <div className="crm-calendar-filter-section__head">
        <h4 className="crm-calendar-filter-section__title">{title}</h4>
        <div className="crm-calendar-filter-section__actions">
          {onAll && (
            <button type="button" className="crm-calendar-filter-section__link" onClick={onAll}>
              All
            </button>
          )}
          {onNone && (
            <button type="button" className="crm-calendar-filter-section__link" onClick={onNone}>
              None
            </button>
          )}
        </div>
      </div>
      <div className="crm-calendar-filter-section__body">{children}</div>
    </section>
  );
}

/**
 * Advanced calendar filter rail — smart presets + themed check rows with live counts.
 */
export default function CalendarFilters({
  filters,
  toggleCategory,
  toggleEventType,
  setCategories,
  setEventTypes,
  setField,
  onReset,
  applySmartPreset,
  activePreset,
  categoryCounts = {},
  eventTypeCounts = {},
  branchOptions = [],
  counsellorOptions = [],
  branchLocked = false,
  canViewAllBranches = true,
}) {
  return (
    <aside className="crm-calendar-filters no-scrollbar">
      <div className="crm-calendar-filters__inner">
        <div className="crm-calendar-filters__head">
          <div>
            <p className="crm-calendar-filters__title inline-flex items-center gap-1.5">
              <FiSliders className="w-3.5 h-3.5 text-brand" />
              Smart filters
            </p>
            <p className="crm-calendar-filters__sub">
              Presets auto-tune category &amp; type · counts from this view
            </p>
          </div>
          <Button variant="ghost" size="sm" icon={FiRotateCcw} onClick={onReset} title="Reset filters">
            Reset
          </Button>
        </div>

        <div className="crm-calendar-preset-grid" role="group" aria-label="Filter presets">
          {CALENDAR_FILTER_PRESETS.map((p) => (
            <button
              key={p.id}
              type="button"
              className={`crm-calendar-preset ${activePreset === p.id ? 'crm-calendar-preset--active' : ''}`}
              onClick={() => applySmartPreset?.(p.id)}
            >
              <span className="crm-calendar-preset__label">{p.label}</span>
              <span className="crm-calendar-preset__desc">{p.description}</span>
            </button>
          ))}
        </div>

        <FilterSection
          title="Category"
          onAll={() => setCategories(CALENDAR_CATEGORIES.map((c) => c.id))}
          onNone={() => setCategories([])}
        >
          {CALENDAR_CATEGORIES.map((c) => (
            <FilterCheck
              key={c.id}
              label={c.label}
              icon={c.icon}
              tone={c.tone}
              count={categoryCounts[c.id] ?? 0}
              checked={filters.categories.includes(c.id)}
              onChange={() => toggleCategory(c.id)}
            />
          ))}
        </FilterSection>

        <FilterSection
          title="Event type"
          onAll={() => setEventTypes(CALENDAR_EVENT_TYPES.map((t) => t.id))}
          onNone={() => setEventTypes([])}
        >
          {CALENDAR_EVENT_TYPES.map((t) => (
            <FilterCheck
              key={t.id}
              label={t.label}
              icon={t.icon}
              tone={t.tone}
              count={eventTypeCounts[t.id] ?? 0}
              checked={filters.eventTypes.includes(t.id)}
              onChange={() => toggleEventType(t.id)}
            />
          ))}
        </FilterSection>

        <section className="crm-calendar-filter-section">
          <div className="crm-calendar-filter-section__head">
            <h4 className="crm-calendar-filter-section__title">Scope</h4>
          </div>
          <div className="crm-calendar-filter-fields">
            <Select
              label="Assigned to"
              value={filters.assignedTo}
              onChange={(e) => setField('assignedTo', e.target.value)}
              options={[{ value: '', label: 'Anyone' }, ...counsellorOptions]}
            />
            <Select
              label={branchLocked ? 'Branch (Active)' : 'Branch'}
              value={filters.branchId}
              disabled={branchLocked}
              hint={branchLocked ? 'Locked to navbar Active Branch' : undefined}
              onChange={(e) => setField('branchId', e.target.value)}
              options={[
                ...(canViewAllBranches && !branchLocked
                  ? [{ value: '', label: 'All branches' }]
                  : []),
                ...branchOptions,
              ]}
            />
            <Select
              label="Status"
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
            <Select
              label="Priority"
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
        </section>
      </div>
    </aside>
  );
}
