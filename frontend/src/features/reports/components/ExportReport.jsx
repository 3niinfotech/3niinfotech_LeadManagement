import { useState } from 'react';
import { FiDownload } from 'react-icons/fi';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import toastService from '../../../services/toast/toast.service';

const DATASETS = [
  { kind: 'enquiry', label: 'Enquiry Export', description: 'All enquiries in your company' },
  { kind: 'student', label: 'Student Export', description: 'Student master records' },
  { kind: 'application', label: 'Application Export', description: 'University applications' },
  { kind: 'visa', label: 'Visa Export', description: 'Visa cases' },
  { kind: 'enrolled', label: 'Enrolled Export', description: 'Students with status Enrolled' },
  { kind: 'drop', label: 'Drop Export', description: 'Lost / dropped enquiries' },
  { kind: 'defer', label: 'Defer Export', description: 'Students with status Deferred' },
];

function toCsv(rows) {
  if (!rows?.length) return '';
  const headers = Object.keys(rows[0]);
  const escape = (value) => {
    const text = value == null ? '' : String(value);
    if (/[",\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
    return text;
  };
  return [
    headers.join(','),
    ...rows.map((row) => headers.map((h) => escape(row[h])).join(',')),
  ].join('\n');
}

function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function ExportReport() {
  const [busy, setBusy] = useState(null);

  const runExport = async (kind) => {
    setBusy(kind);
    try {
      const res = await apiGet(API.REPORTS_EXPORT(kind));
      const payload = res?.data || res;
      const rows = payload?.rows || [];
      if (!rows.length) {
        toastService.info('No records to export');
        return;
      }
      downloadCsv(`visaerp-${kind}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
      toastService.success(`Exported ${rows.length} ${kind} record${rows.length === 1 ? '' : 's'}`);
    } catch (err) {
      toastService.error(err?.message || 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <Card className="!p-4">
        <h3 className="text-sm font-semibold text-text">Backup / Export</h3>
        <p className="text-xs text-text-muted mt-1">
          Tenant-safe CSV downloads. Capped at 5,000 rows per file. No backup table is created.
        </p>
      </Card>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {DATASETS.map((item) => (
          <Card key={item.kind} className="!p-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-medium text-text">{item.label}</p>
              <p className="text-xs text-text-muted mt-0.5">{item.description}</p>
            </div>
            <Button
              size="sm"
              variant="outline"
              icon={FiDownload}
              loading={busy === item.kind}
              disabled={Boolean(busy)}
              onClick={() => runExport(item.kind)}
            >
              Export
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
