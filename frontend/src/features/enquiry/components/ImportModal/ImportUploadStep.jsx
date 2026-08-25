import { useRef, useState } from 'react';
import { FiDownload, FiFile, FiUpload } from 'react-icons/fi';
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
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
          ${dragOver ? 'border-brand bg-brand-soft/40' : 'border-border hover:border-brand/50 hover:bg-page/40'}`}
        onClick={() => ref.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          pick(e.dataTransfer.files?.[0]);
        }}
      >
        <FiUpload className="w-8 h-8 mx-auto text-brand mb-2" />
        <p className="text-sm font-semibold text-text">Drag & drop Excel / CSV or click to choose</p>
        <p className="text-[12px] text-text-muted mt-1">Supports .xlsx and .csv · sample includes Autofilter + field guide</p>
        <input
          ref={ref}
          type="file"
          accept={ACCEPT}
          className="hidden"
          onChange={(e) => pick(e.target.files?.[0])}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <Button variant="outline-primary" icon={FiDownload} onClick={() => downloadSample('xlsx')}>
          Download Excel sample
        </Button>
        <Button variant="outline" icon={FiFile} onClick={() => downloadSample('csv')}>
          Download CSV sample
        </Button>
      </div>

      <ul className="text-xs text-text-muted list-disc pl-5 space-y-1">
        <li>Required columns: <strong className="text-text">First Name, Email, Mobile</strong></li>
        <li>Optional: Code, Country, Course, Intake, Source, Priority, Status, Remark, and more</li>
        <li>Empty Source → IMPORT · empty Priority → MEDIUM · empty Mobile Country → company default</li>
        <li>Duplicate email/mobile and invalid rows are flagged in preview before import</li>
      </ul>

      {loading && (
        <div className="flex items-center gap-3 py-2">
          <Loader size="sm" variant="dots" />
          <p className="text-sm text-text-muted">Parsing spreadsheet…</p>
        </div>
      )}
    </div>
  );
}
