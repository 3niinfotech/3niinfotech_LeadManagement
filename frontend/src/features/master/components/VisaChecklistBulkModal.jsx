import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { masterApi, getApiErrorMessage } from '../services/masterApi.service';
import { useRelationalMasterOptions } from '../hooks/useRelationalMasterOptions';
import toastService from '../../../services/toast/toast.service';

const emptyRow = () => ({
  documentType: '',
  name: '',
  isMandatory: true,
});

export default function VisaChecklistBulkModal({ open, onClose, onSuccess }) {
  const { options: countryOptions, loading: countriesLoading } = useRelationalMasterOptions('country');
  const [countryId, setCountryId] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    setCountryId('');
    setRows([emptyRow()]);
  }, [open]);

  const updateRow = useCallback((index, field, value) => {
    setRows((prev) => prev.map((row, i) => (i === index ? { ...row, [field]: value } : row)));
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [...prev, emptyRow()]);
  }, []);

  const removeRow = useCallback((index) => {
    setRows((prev) => (prev.length <= 1 ? prev : prev.filter((_, i) => i !== index)));
  }, []);

  const handleSubmit = async () => {
    if (!countryId) {
      toastService.error('Country is required');
      return;
    }
    const items = rows
      .map((row) => ({
        documentType: row.documentType?.trim(),
        name: row.name?.trim(),
        isMandatory: Boolean(row.isMandatory),
      }))
      .filter((row) => row.documentType || row.name);

    if (!items.length) {
      toastService.error('Add at least one checklist row');
      return;
    }
    if (items.some((row) => !row.documentType || !row.name)) {
      toastService.error('Document type and name are required for each row');
      return;
    }

    setSubmitting(true);
    try {
      await masterApi.bulkCreateVisaChecklist({ countryId, items });
      toastService.success(`${items.length} visa checklist item(s) created`);
      onSuccess?.();
      onClose();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Bulk create failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Visa Checklist Rows"
      size="lg"
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button loading={submitting} onClick={handleSubmit}>Save All</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <Select
          label="Country"
          value={countryId}
          onChange={(e) => setCountryId(e.target.value)}
          required
          disabled={countriesLoading}
          options={[
            { value: '', label: 'Select country' },
            ...countryOptions.map((opt) => ({ value: opt.value, label: opt.label })),
          ]}
        />

        <div className="space-y-3">
          {rows.map((row, index) => (
            <div key={index} className="rounded-lg border border-border p-3 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-semibold text-text-muted">Row {index + 1}</span>
                {rows.length > 1 && (
                  <button
                    type="button"
                    className="text-danger hover:opacity-80"
                    onClick={() => removeRow(index)}
                    aria-label="Remove row"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  label="Document Type"
                  value={row.documentType}
                  onChange={(e) => updateRow(index, 'documentType', e.target.value)}
                  placeholder="e.g. Academic"
                  required
                />
                <Input
                  label="Document Name"
                  value={row.name}
                  onChange={(e) => updateRow(index, 'name', e.target.value)}
                  placeholder="e.g. Passport Copy"
                  required
                />
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={row.isMandatory}
                  onChange={(e) => updateRow(index, 'isMandatory', e.target.checked)}
                />
                Mandatory
              </label>
            </div>
          ))}
        </div>

        <Button type="button" variant="outline" size="sm" icon={FiPlus} onClick={addRow}>
          Add Row
        </Button>
      </div>
    </Modal>
  );
}
