import FormSection from '../../../../../components/ui/FormSection';

function formatDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

export default function StudentRecordListTab({
  title,
  description,
  emptyMessage,
  columns,
  rows = [],
}) {
  return (
    <FormSection title={title} description={description}>
      {rows.length === 0 ? (
        <p className="text-sm text-text-muted text-center py-8 border border-dashed border-border rounded-lg">
          {emptyMessage}
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-[color-mix(in_srgb,var(--bg-page)_50%,transparent)]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-text-muted"
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, index) => (
                <tr key={row.id || index} className="border-b border-border last:border-0">
                  {columns.map((col) => (
                    <td key={col.key} className="px-3 py-2.5 text-text-secondary">
                      {col.format ? col.format(row[col.key], row) : (row[col.key] || '—')}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </FormSection>
  );
}

export { formatDate };
