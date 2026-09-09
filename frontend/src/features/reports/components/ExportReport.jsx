import { useState } from 'react';
import {
  FiDownload, FiUsers, FiFileText, FiGlobe, FiUserCheck, FiUserX, FiClock, FiShield,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import toastService from '../../../services/toast/toast.service';
import '../styles/reports.css';

const DATASETS = [
  {
    kind: 'enquiry',
    label: 'Enquiry Export',
    description: 'All enquiries in your company scope',
    icon: FiUsers,
    tone: 'primary',
  },
  {
    kind: 'student',
    label: 'Student Export',
    description: 'Student master records',
    icon: FiUserCheck,
    tone: 'success',
  },
  {
    kind: 'application',
    label: 'Application Export',
    description: 'University applications',
    icon: FiFileText,
    tone: 'info',
  },
  {
    kind: 'visa',
    label: 'Visa Export',
    description: 'Visa cases by country & status',
    icon: FiGlobe,
    tone: 'warning',
  },
  {
    kind: 'enrolled',
    label: 'Enrolled Export',
    description: 'Students with status Enrolled',
    icon: FiUserCheck,
    tone: 'success',
  },
  {
    kind: 'drop',
    label: 'Drop Export',
    description: 'Lost / dropped enquiries',
    icon: FiUserX,
    tone: 'danger',
  },
  {
    kind: 'defer',
    label: 'Defer Export',
    description: 'Students with status Deferred',
    icon: FiClock,
    tone: 'info',
  },
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
    <div className="crm-report-stack">
      <div className="crm-report-hero-banner">
        <div>
          <h3 className="crm-report-hero-banner__title">Tenant-safe CSV backup</h3>
          <p className="crm-report-hero-banner__sub">
            Exports respect your company wall. Each file is capped at 5,000 rows — no cross-tenant
            leakage, no fabricated backups.
          </p>
        </div>
        <span className="crm-report-hero-banner__badge">
          <FiShield className="h-3.5 w-3.5" />
          Isolated
        </span>
      </div>

      <div className="crm-report-export-grid">
        {DATASETS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.kind} className="crm-report-export-card">
              <span className={`crm-report-export-card__icon crm-report-export-card__icon--${item.tone}`}>
                <Icon strokeWidth={1.75} />
              </span>
              <div className="crm-report-export-card__copy">
                <p className="crm-report-export-card__title">{item.label}</p>
                <p className="crm-report-export-card__desc">{item.description}</p>
              </div>
              <Button
                size="sm"
                variant="primary"
                icon={FiDownload}
                loading={busy === item.kind}
                disabled={Boolean(busy)}
                onClick={() => runExport(item.kind)}
              >
                Export
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
