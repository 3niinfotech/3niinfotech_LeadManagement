import { useCallback, useEffect, useState } from 'react';
import { FiPlus, FiTrash2 } from 'react-icons/fi';
import MasterFormShell from './MasterFormShell';
import MasterFormSection from './MasterFormSection';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FormField from '../../../components/ui/FormField';
import { masterApi, getApiErrorMessage } from '../services/masterApi.service';
import { useRelationalMasterOptions } from '../hooks/useRelationalMasterOptions';
import toastService from '../../../services/toast/toast.service';
import '../styles/master-form.theme.css';

const emptyRow = () => ({
  documentType: '',
  name: '',
  enquiryForm: false,
  isMandatory: true,
});

export default function ApplicationChecklistBulkModal({ open, onClose, onSuccess }) {
  const { options: countryOptions, loading: countriesLoading } = useRelationalMasterOptions('country');
  const [countryId, setCountryId] = useState('');
  const [rows, setRows] = useState([emptyRow()]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(null);

  useEffect(() => {
    if (!open) return;
    setCountryId('');
    setRows([emptyRow()]);
    setSubmitError(null);
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
        enquiryForm: Boolean(row.enquiryForm),
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
    setSubmitError(null);
    try {
      await masterApi.bulkCreateChecklist({ countryId, items });
      toastService.success(`${items.length} checklist item(s) created`);
      onSuccess?.();
      onClose();
    } catch (err) {
      setSubmitError(getApiErrorMessage(err, 'Bulk create failed'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <MasterFormShell
      open={open}
      onClose={onClose}
      title="Add Checklist Rows"
      subtitle="Bulk create application checklist for a country"
      size="lg"
      variant="default"
      error={submitError}
      footer={(
        <>
          <Button variant="outline" size="sm" onClick={onClose} disabled={submitting}>Cancel</Button>
          <Button size="sm" loading={submitting} form="crm-app-checklist-bulk-form" type="submit">
            {submitting ? 'Saving…' : 'Save all'}
          </Button>
        </>
      )}
    >
      <form id="crm-app-checklist-bulk-form" className="crm-master-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
        <MasterFormSection title="Country">
          <FormField label="Country" required>
            <Select
              value={countryId}
              onChange={(e) => setCountryId(e.target.value)}
              disabled={countriesLoading}
              showSearch
              placeholder={countriesLoading ? 'Loading…' : 'Select country'}
              options={countryOptions.map((opt) => ({ value: opt.value, label: opt.label }))}
            />
          </FormField>
        </MasterFormSection>

        <MasterFormSection title="Checklist items">
          <div className="crm-master-bulk-rows">
            {rows.map((row, index) => (
              <div key={index} className="crm-master-bulk-row">
                <div className="crm-master-bulk-row__head">
                  <span className="crm-master-bulk-row__label">Row {index + 1}</span>
                  {rows.length > 1 && (
                    <button
                      type="button"
                      className="crm-master-bulk-row__remove"
                      onClick={() => removeRow(index)}
                      aria-label="Remove row"
                    >
                      <FiTrash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <div className="crm-master-form-grid crm-master-form-grid--2col">
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
                    placeholder="e.g. 10th Mark Sheet"
                    required
                  />
                </div>
                <div className="crm-master-bulk-row__flags">
                  <label className="crm-master-bulk-row__check">
                    <input
                      type="checkbox"
                      checked={row.enquiryForm}
                      onChange={(e) => updateRow(index, 'enquiryForm', e.target.checked)}
                    />
                    Enquiry Form
                  </label>
                  <label className="crm-master-bulk-row__check">
                    <input
                      type="checkbox"
                      checked={row.isMandatory}
                      onChange={(e) => updateRow(index, 'isMandatory', e.target.checked)}
                    />
                    Mandatory
                  </label>
                </div>
              </div>
            ))}
          </div>
          <Button type="button" variant="outline" size="sm" icon={FiPlus} onClick={addRow} className="mt-2">
            Add row
          </Button>
        </MasterFormSection>
      </form>
    </MasterFormShell>
  );
}
