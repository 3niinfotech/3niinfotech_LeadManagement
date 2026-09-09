import { FiInbox } from 'react-icons/fi';
import Badge from '../../../../../components/ui/Badge';
import FormSection from '../../../../../components/ui/FormSection';
import CountryFlagLabel from '../../../../../components/ui/CountryFlagLabel';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getStatusBadgeColor(status) {
  if (!status) return 'secondary';
  const s = String(status).toUpperCase();
  if (s.includes('GRANTED') || s.includes('ACCEPTED') || s.includes('APPROVED') || s.includes('COMPLETE') || s.includes('ENROLLED') || s.includes('PRESENT')) {
    return 'success';
  }
  if (s.includes('PENDING') || s.includes('SUBMITTED') || s.includes('PROGRESS') || s.includes('APPLIED') || s.includes('SCHEDULED')) {
    return 'primary';
  }
  if (s.includes('REJECT') || s.includes('CANCEL') || s.includes('WITHDRAW') || s.includes('REFUSE') || s.includes('ABSENT')) {
    return 'danger';
  }
  if (s.includes('OFFER') || s.includes('REVIEW') || s.includes('LATE')) {
    return 'warning';
  }
  return 'secondary';
}

function cellValue(col, row) {
  const val = row[col.key];
  if (col.format) return col.format(val, row);
  const isCountry = col.key === 'country' || col.key === 'interestedCountry';
  if (isCountry && val) {
    return <CountryFlagLabel country={val} size="sm" />;
  }
  const isStatus = col.key.toLowerCase().includes('status');
  if (isStatus && val) {
    return (
      <Badge color={getStatusBadgeColor(val)} size="sm">
        {String(val).replace(/_/g, ' ')}
      </Badge>
    );
  }
  return val || '—';
}

export default function StudentRecordListTab({
  title,
  description,
  emptyMessage,
  columns = [],
  rows = [],
  actionButton,
}) {
  const [primary, ...rest] = columns;
  const countLabel = `${rows.length} record${rows.length === 1 ? '' : 's'}`;

  return (
    <div className="space-y-4">
      <FormSection
        title={title}
        description={description ? `${description} · ${countLabel}` : countLabel}
        className="crm-student-section"
      >
        {actionButton ? (
          <div className="flex justify-end mb-3">{actionButton}</div>
        ) : null}

        {rows.length === 0 ? (
          <div className="crm-timeline__empty py-6">
            <span className="crm-timeline__empty-icon" aria-hidden>
              <FiInbox className="w-5 h-5" />
            </span>
            <h3 className="crm-timeline__empty-title">{title}</h3>
            <p className="crm-timeline__empty-desc">{emptyMessage}</p>
          </div>
        ) : (
          <ul className="crm-student-record-list">
            {rows.map((row, index) => (
              <li key={row.id || index} className="crm-student-record">
                {primary && (
                  <div className="crm-student-record__primary truncate" title={String(row[primary.key] || '')}>
                    {cellValue(primary, row)}
                  </div>
                )}
                {rest.map((col) => (
                  <div
                    key={col.key}
                    className={col.key.toLowerCase().includes('at') || col.key === 'createdAt'
                      ? 'crm-student-record__muted'
                      : 'crm-student-record__meta'}
                  >
                    <span className="block text-[10px] font-semibold uppercase tracking-wide text-text-muted mb-0.5">
                      {col.label}
                    </span>
                    {cellValue(col, row)}
                  </div>
                ))}
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}

export { formatDate };
