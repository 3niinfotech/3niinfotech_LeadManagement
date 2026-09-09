import { useState } from 'react';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';
import FormStepTabs from '../../../../components/ui/FormStepTabs';
import FormTabPanel from '../../../../components/ui/FormTabPanel';
import ImportUploadStep from './ImportUploadStep';
import ImportPreviewStep from './ImportPreviewStep';
import ImportHistoryTab from './ImportHistoryTab';
import { useParseImportFileMutation, useConfirmImportMutation } from '../../redux/enquiryApiSlice';
import toastService from '../../../../services/toast/toast.service';

const IMPORT_TABS = [
  { id: 'import', label: 'Import', icon: 'upload' },
  { id: 'history', label: 'History', icon: 'clock' },
];

export default function ImportModal({ open, onClose }) {
  const [tab, setTab] = useState('import');
  const [step, setStep] = useState(1);
  const [rows, setRows] = useState([]);
  const [fileName, setFileName] = useState('');
  const [result, setResult] = useState(null);
  const [parseImport, { isLoading: parsing }] = useParseImportFileMutation();
  const [confirmImport, { isLoading: importing }] = useConfirmImportMutation();

  const reset = () => {
    setTab('import');
    setStep(1);
    setRows([]);
    setFileName('');
    setResult(null);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleFile = async (file) => {
    try {
      setFileName(file.name);
      const data = await parseImport(file).unwrap();
      const parsedRows = Array.isArray(data) ? data : (data?.rows || []);
      if (!parsedRows.length) {
        toastService.error('No data rows found in the file');
        return;
      }
      setRows(parsedRows);
      setStep(2);
    } catch (err) {
      toastService.error(err?.data?.message || 'Failed to parse import file');
    }
  };

  const handleConfirm = async () => {
    try {
      const res = await confirmImport({ rows, fileName }).unwrap();
      setResult(res);
      setStep(3);
      toastService.success('Import completed');
    } catch (err) {
      toastService.error(err?.data?.message || 'Import failed');
    }
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title="Import Enquiries"
      subtitle="Upload a spreadsheet or review past import batches."
      size="xl"
      variant="form"
      footer={tab === 'import' && step < 3 ? (
        <>
          <Button variant="outline" onClick={handleClose}>Cancel</Button>
          {step === 2 && (
            <Button onClick={handleConfirm} loading={importing}>Confirm Import</Button>
          )}
        </>
      ) : (
        <Button onClick={handleClose}>Close</Button>
      )}
    >
      <div className="crm-form-modal-layout">
        <FormStepTabs
          tabs={IMPORT_TABS}
          activeTab={tab}
          onChange={setTab}
          layoutId="crm-import-tab-pill"
        />

        <FormTabPanel panelKey={tab === 'history' ? 'history' : `import-${step}`} className="mt-3 flex-1 min-h-0">
          {tab === 'history' ? (
            <ImportHistoryTab />
          ) : (
            <>
              {step === 1 && <ImportUploadStep onFile={handleFile} loading={parsing} />}
              {step === 2 && <ImportPreviewStep rows={rows} />}
              {step === 3 && result && (
                <div className="crm-import text-center py-6">
                  <p className="text-lg font-semibold text-text mb-3">Import Summary</p>
                  <div className="crm-import__summary">
                    <span className="crm-import__summary-pill">
                      Total <strong>{result.total ?? rows.length}</strong>
                    </span>
                    <span className="crm-import__summary-pill crm-import__summary-pill--ok">
                      Uploaded <strong>{result.uploaded}</strong>
                    </span>
                    <span className="crm-import__summary-pill crm-import__summary-pill--warn">
                      Duplicate <strong>{result.duplicates}</strong>
                    </span>
                    <span className="crm-import__summary-pill crm-import__summary-pill--danger">
                      Failed <strong>{result.failed}</strong>
                    </span>
                  </div>
                </div>
              )}
            </>
          )}
        </FormTabPanel>
      </div>
    </Modal>
  );
}
