import { useMemo, useState } from 'react';
import { FiShield, FiArrowDown, FiUser, FiClock, FiGlobe } from 'react-icons/fi';
import Badge from '../../../../components/ui/Badge';
import {
  AUDIT_LOG_FILTERS,
  AUDIT_ACTION_TONES,
} from '../../config/enquiryAudit.config';
import {
  buildEnquiryAuditLogs,
  filterAuditLogs,
  countAuditByFilter,
} from '../../utils/enquiryAudit.utils';

function AuditRow({ entry }) {
  const tone = AUDIT_ACTION_TONES[entry.action] || AUDIT_ACTION_TONES[entry.bucket] || 'secondary';

  return (
    <article className="crm-audit-log">
      <div className="crm-audit-log__head">
        <Badge color={tone}>{entry.actionLabel}</Badge>
        {entry.fieldLabel && (
          <span className="crm-audit-log__field">{entry.fieldLabel}</span>
        )}
        <span className="crm-audit-log__when">{entry.whenLabel}</span>
      </div>

      <div className="crm-audit-log__flow">
        <div className="crm-audit-log__cell">
          <span className="crm-audit-log__label">Old Value</span>
          <p>{entry.oldValue}</p>
        </div>
        <div className="crm-audit-log__arrow" aria-hidden><FiArrowDown className="w-3.5 h-3.5" /></div>
        <div className="crm-audit-log__cell">
          <span className="crm-audit-log__label">New Value</span>
          <p>{entry.newValue}</p>
        </div>
        <div className="crm-audit-log__arrow" aria-hidden><FiArrowDown className="w-3.5 h-3.5" /></div>
        <div className="crm-audit-log__meta">
          <span><FiUser className="w-3 h-3" />{entry.who}</span>
          <span><FiClock className="w-3 h-3" />{entry.whenLabel}</span>
          <span className="font-mono text-[11px]"><FiGlobe className="w-3 h-3" />{entry.ip}</span>
        </div>
      </div>

      {entry.description && entry.description !== entry.newValue && (
        <p className="crm-audit-log__note">{entry.description}</p>
      )}
    </article>
  );
}

export default function AuditLogsTab({ enquiry }) {
  const [filter, setFilter] = useState('all');

  const allEntries = useMemo(() => buildEnquiryAuditLogs(enquiry), [enquiry]);
  const counts = useMemo(() => countAuditByFilter(allEntries), [allEntries]);
  const entries = useMemo(
    () => filterAuditLogs(allEntries, filter),
    [allEntries, filter],
  );

  if (!enquiry) {
    return <p className="text-sm text-text-muted text-center py-8">No audit logs available.</p>;
  }

  return (
    <div className="crm-audit-page">
      <div className="crm-audit-page__head">
        <span className="crm-audit-page__icon" aria-hidden>
          <FiShield className="w-4 h-4" />
        </span>
        <div className="min-w-0">
          <p className="crm-audit-page__title">Audit Logs</p>
          <p className="crm-audit-page__desc">
            Created, updated, deleted, assigned, imported, merged, and exported events.
          </p>
        </div>
        <Badge color="brand" className="shrink-0">{allEntries.length}</Badge>
      </div>

      <div className="crm-audit-filters" role="tablist" aria-label="Audit log filters">
        {AUDIT_LOG_FILTERS.map((item) => {
          const count = item.id === 'all' ? counts.all : (counts[item.id] || 0);
          const active = filter === item.id;
          return (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={active}
              className="crm-audit-filters__chip"
              data-active={active ? 'true' : 'false'}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
              {count > 0 && <span className="crm-audit-filters__count">{count}</span>}
            </button>
          );
        })}
      </div>

      {entries.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8 border border-dashed border-border rounded-lg">
          No audit logs for this filter yet.
        </p>
      ) : (
        <div className="crm-audit-log-list">
          {entries.map((entry) => (
            <AuditRow key={entry.id} entry={entry} />
          ))}
        </div>
      )}
    </div>
  );
}
