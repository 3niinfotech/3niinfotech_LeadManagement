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
    label: 'All Enquiries',
    description: 'Complete lead & enquiry records across all statuses',
    icon: FiUsers,
    tone: 'primary',
  },
  {
    kind: 'student',
    label: 'Student Directory',
    description: 'Enrolled & registered students master dataset',
    icon: FiUserCheck,
    tone: 'success',
  },
  {
    kind: 'application',
    label: 'University Applications',
    description: 'Submitted, in-review & accepted applications',
    icon: FiFileText,
    tone: 'info',
  },
  {
    kind: 'visa',
    label: 'Visa Cases',
    description: 'Embassy applications, approved & pending visas',
    icon: FiGlobe,
    tone: 'warning',
  },
  {
    kind: 'enrolled',
    label: 'Active Enrollments',
    description: 'Students currently active in batches & courses',
    icon: FiUserCheck,
    tone: 'success',
  },
  {
    kind: 'drop',
    label: 'Lost / Dropped Leads',
    description: 'Dropped enquiries with recorded exit reasons',
    icon: FiUserX,
    tone: 'danger',
  },
  {
    kind: 'defer',
    label: 'Deferred Cases',
    description: 'Students with deferred intakes and courses',
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
        toastService.info('No records available for export in this dataset');
        return;
      }
      downloadCsv(`crm-${kind}-${new Date().toISOString().slice(0, 10)}.csv`, toCsv(rows));
      toastService.success(`Exported ${rows.length} ${kind} record${rows.length === 1 ? '' : 's'}`);
    } catch (err) {
      toastService.error(err?.message || 'Export failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="crm-report-stack">
      {/* Hero Banner */}
      <div className="p-4 sm:p-5 rounded-xl border border-indigo-200 dark:border-indigo-900/60 bg-gradient-to-r from-indigo-50/80 via-white to-indigo-50/40 dark:from-indigo-950/40 dark:via-slate-900 dark:to-indigo-950/20 shadow-2xs flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <span>Tenant-Isolated CSV Export Center</span>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
              <FiShield className="w-3 h-3" /> Secure
            </span>
          </h3>
          <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Exports strictly adhere to your branch &amp; company permission walls. Each export produces standard CSV files compatible with Excel, Google Sheets, and Business Intelligence tools.
          </p>
        </div>
      </div>

      {/* Dataset Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {DATASETS.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.kind}
              className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-2xs hover:border-indigo-300 dark:hover:border-indigo-600 transition-all flex items-center justify-between gap-3 group"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span className="w-10 h-10 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:bg-indigo-50 group-hover:text-indigo-600 dark:group-hover:bg-indigo-950/60 dark:group-hover:text-indigo-400 transition-colors">
                  <Icon className="w-5 h-5" />
                </span>
                <div className="min-w-0">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 line-clamp-1 mt-0.5">
                    {item.description}
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                icon={FiDownload}
                loading={busy === item.kind}
                disabled={Boolean(busy)}
                onClick={() => runExport(item.kind)}
                className="shrink-0"
              >
                CSV
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
