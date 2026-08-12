import { useRef } from 'react';
import { FiDownload, FiUpload } from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import Loader from '../../../../components/ui/Loader';
import { enquiryService } from '../../services/enquiryService';

export default function ImportUploadStep({ onFile, loading }) {
  const ref = useRef(null);

  const downloadSample = async () => {
    const blob = await enquiryService.getSampleFormat();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'enquiry-import-sample.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <div
        className="border-2 border-dashed border-border rounded-xl p-10 text-center cursor-pointer hover:border-primary-400"
        onClick={() => ref.current?.click()}
      >
        <FiUpload className="w-8 h-8 mx-auto text-text-muted mb-2" />
        <p className="text-sm font-medium">Drag & drop CSV file or click to choose</p>
        <input ref={ref} type="file" accept=".csv" className="hidden" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
      </div>
      <Button variant="outline" icon={FiDownload} onClick={downloadSample}>Download Sample Format</Button>
      <ul className="text-xs text-text-muted list-disc pl-5 space-y-1">
        <li>Use the sample CSV format with required columns: First Name, Email, Mobile</li>
        <li>Duplicate email/mobile rows will be flagged during preview</li>
        <li>Invalid rows are highlighted before import</li>
      </ul>
      {loading && (
        <div className="flex items-center gap-3 py-2">
          <Loader size="sm" variant="dots" />
          <p className="text-sm text-text-muted">Parsing file...</p>
        </div>
      )}
    </div>
  );
}
