import { useMemo } from 'react';
import ScrollArea from '../../../../components/ui/ScrollArea';
import {
  IMPORT_PREVIEW_COLUMNS,
  calcImportSummary,
  calcColumnWidths,
} from '../../config/enquiryImport.config';

export default function ImportPreviewStep({ rows = [] }) {
  const summary = useMemo(() => calcImportSummary(rows), [rows]);
  const columns = useMemo(
    () => calcColumnWidths(IMPORT_PREVIEW_COLUMNS, rows),
    [rows],
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2 px-3 py-2.5 rounded-xl border border-border bg-page/50">
        <SummaryPill label="Total" value={summary.total} tone="neutral" />
        <SummaryPill label="Valid" value={summary.valid} tone="success" />
        <SummaryPill label="Errors" value={summary.invalid} tone="danger" />
        <SummaryPill label="Ready to import" value={summary.ready} tone="brand" />
        <p className="text-[11px] text-text-muted ml-auto">
          Review highlighted rows before confirming. Empty optional fields autofill on import.
        </p>
      </div>

      <ScrollArea axis="both" className="max-h-[420px] rounded-xl border border-border bg-card-bg">
        <table className="text-[12px] border-collapse" style={{ minWidth: '100%' }}>
          <thead className="sticky top-0 z-10">
            <tr>
              <th
                className="p-2.5 text-center font-semibold whitespace-nowrap border border-brand/15"
                style={{
                  width: 56,
                  minWidth: 56,
                  background: 'var(--brand-soft)',
                  color: 'var(--brand)',
                }}
              >
                Row
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="p-2.5 text-center font-semibold whitespace-nowrap border border-brand/15"
                  style={{
                    width: col.width,
                    minWidth: col.width,
                    maxWidth: col.width,
                    background: 'var(--brand-soft)',
                    color: 'var(--brand)',
                  }}
                  title={col.required ? `${col.header} (required)` : col.header}
                >
                  {col.header}
                  {col.required ? <span className="text-danger ml-0.5">*</span> : null}
                </th>
              ))}
              <th
                className="p-2.5 text-center font-semibold whitespace-nowrap border border-brand/15"
                style={{
                  width: 160,
                  minWidth: 140,
                  background: 'var(--brand-soft)',
                  color: 'var(--brand)',
                }}
              >
                Errors
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const hasError = Boolean(row.errors?.length);
              return (
                <tr
                  key={row._row}
                  className={`border-t border-border ${
                    hasError ? 'bg-danger-soft/35' : 'hover:bg-row-hover/60'
                  }`}
                >
                  <td className="p-2 text-center text-text-muted tabular-nums border border-border/60">{row._row}</td>
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="p-2 text-center text-text truncate border border-border/60"
                      style={{ maxWidth: col.width }}
                      title={String(row[col.key] || '')}
                    >
                      {row[col.key] || <span className="text-text-muted">—</span>}
                    </td>
                  ))}
                  <td className="p-2 text-center text-danger text-[11px] leading-snug border border-border/60">
                    {hasError ? row.errors.join(', ') : (
                      <span className="text-success font-medium">OK</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot className="sticky bottom-0">
            <tr
              className="border-t-2 border-brand/25 font-semibold"
              style={{ background: 'var(--brand-soft)' }}
            >
              <td className="p-2.5 text-center text-brand" colSpan={2}>
                TOTAL
              </td>
              <td className="p-2.5 text-center text-text-secondary" colSpan={columns.length}>
                {summary.total} rows · {summary.valid} valid · {summary.invalid} with errors
              </td>
              <td className="p-2.5 text-center text-text-muted text-[11px]">
                {summary.ready} will import
              </td>
            </tr>
          </tfoot>
        </table>
      </ScrollArea>
    </div>
  );
}

function SummaryPill({ label, value, tone }) {
  const tones = {
    neutral: 'bg-row-hover text-text border-border',
    success: 'bg-success-soft text-success border-success/20',
    danger: 'bg-danger-soft text-danger border-danger/20',
    brand: 'bg-brand-soft text-brand border-brand/20',
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg border text-[12px] ${
        tones[tone] || tones.neutral
      }`}
    >
      <span className="text-text-muted font-medium">{label}</span>
      <span className="font-bold tabular-nums">{value}</span>
    </span>
  );
}
