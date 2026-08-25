import FormSection from '../../../../../components/ui/FormSection';
import Badge from '../../../../../components/ui/Badge';

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
  if (s.includes('GRANTED') || s.includes('ACCEPTED') || s.includes('APPROVED') || s.includes('COMPLETE') || s.includes('ENROLLED')) {
    return 'success';
  }
  if (s.includes('PENDING') || s.includes('SUBMITTED') || s.includes('PROGRESS') || s.includes('APPLIED')) {
    return 'primary';
  }
  if (s.includes('REJECT') || s.includes('CANCEL') || s.includes('WITHDRAW') || s.includes('REFUSE')) {
    return 'danger';
  }
  if (s.includes('OFFER') || s.includes('REVIEW')) {
    return 'warning';
  }
  return 'secondary';
}

export default function StudentRecordListTab({
  title,
  description,
  emptyMessage,
  columns,
  rows = [],
  actionButton,
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-text">{title}</h3>
          {description && <p className="text-xs text-text-muted mt-0.5">{description}</p>}
        </div>
        {actionButton}
      </div>

      {rows.length === 0 ? (
        <div className="p-12 text-center border border-dashed border-border rounded-xl bg-surface/50">
          <p className="text-sm text-text-muted">{emptyMessage}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-surface shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="border-b border-border bg-surface-hover/60">
                  {columns.map((col) => (
                    <th
                      key={col.key}
                      className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-text-muted"
                    >
                      {col.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {rows.map((row, index) => (
                  <tr
                    key={row.id || index}
                    className="hover:bg-surface-hover/40 transition-colors"
                  >
                    {columns.map((col) => {
                      const val = row[col.key];
                      const isStatus = col.key.toLowerCase().includes('status');

                      return (
                        <td key={col.key} className="px-4 py-3.5 text-text">
                          {col.format ? (
                            col.format(val, row)
                          ) : isStatus && val ? (
                            <Badge color={getStatusBadgeColor(val)} size="sm">
                              {String(val).replace(/_/g, ' ')}
                            </Badge>
                          ) : (
                            <span className="font-medium text-text-secondary">{val || '—'}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

export { formatDate };
