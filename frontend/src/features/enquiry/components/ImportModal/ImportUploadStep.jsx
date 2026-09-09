import { useRef, useState } from 'react';
import { FiDownload, FiFile, FiUploadCloud } from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import Loader from '../../../../components/ui/Loader';
import { enquiryService } from '../../services/enquiryService';
import toastService from '../../../../services/toast/toast.service';

const ACCEPT = '.xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv';

export default function ImportUploadStep({ onFile, loading }) {
  const ref = useRef(null);
  const [dragOver, setDragOver] = useState(false);

  const downloadSample = async (format = 'xlsx') => {
    try {
      const blob = await enquiryService.getSampleFormat(format);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = format === 'csv' ? 'enquiry-import-sample.csv' : 'enquiry-import-sample.xlsx';
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toastService.error('Could not download sample file');
    }
  };

  const pick = (file) => {
    if (!file) return;
    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      toastService.error('Upload an Excel (.xlsx) or CSV file');
      return;
    }
    onFile(file);
  };

  return (
    <div className="crm-import">
      <div
        className={`crm-import__dropzone${dragOver ? ' crm-import__dropzone--active' : ''}`}
        onClick={() => !loading && ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          if (!loading) pick(e.dataTransfer.files?.[0]);
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            ref.current?.click();
          }
        }}
      >
        <span className="crm-import__dropzone-icon" aria-hidden>
          <FiUploadCloud size={22} />
        </span>
        <p className="crm-import__dropzone-title">
          Drag & drop Excel / CSV or click to choose
        </p>
        <p className="crm-import__dropzone-hint">
          Supports .xlsx and .csv · sample includes Autofilter + field guide
        </p>
        <input
          ref={ref}
          type="file"
          accept={ACCEPT}
          className="hidden"
          disabled={loading}
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      <div className="crm-import__samples">
        <Button variant="outline-primary" size="sm" icon={FiDownload} onClick={() => downloadSample('xlsx')}>
          Download Excel sample
        </Button>
        <Button variant="outline" size="sm" icon={FiFile} onClick={() => downloadSample('csv')}>
          Download CSV sample
        </Button>
      </div>

      <div className="crm-import__guide">
        <div className="crm-import__guide-card">
          <p className="crm-import__guide-label">Required</p>
          <p className="crm-import__guide-text">
            <strong>First Name</strong>, <strong>Email</strong>, <strong>Mobile</strong>
          </p>
        </div>
        <div className="crm-import__guide-card">
          <p className="crm-import__guide-label">Optional</p>
          <p className="crm-import__guide-text">
            Code, Country, Course, Intake, Source, Priority, Status, Remark, and more
          </p>
        </div>
        <div className="crm-import__guide-card">
          <p className="crm-import__guide-label">Defaults & checks</p>
          <p className="crm-import__guide-text">
            Empty Source → <strong>IMPORT</strong> · Priority → <strong>MEDIUM</strong>.
            Duplicates and invalid rows are flagged in preview before import.
          </p>
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 py-1">
          <Loader size="sm" variant="dots" />
          <p className="text-sm text-text-muted">Parsing spreadsheet…</p>
        </div>
      )}
    </div>
  );
}
