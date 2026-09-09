import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSearch, FiFileText, FiClipboard } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import { masterApi, getApiErrorMessage } from '../../master/services/masterApi.service';
import { useCreateVisaMutation } from '../redux/visaApiSlice';
import toastService from '../../../services/toast/toast.service';

const EMPTY_FORM = {
  studentId: '',
  countryId: '',
  visaType: '',
  visaStatusMasterId: '',
  applicationNo: '',
};

const FORM_ID = 'visa-create-form';

function studentLabel(s) {
  if (!s) return '';
  return `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentCode || 'Student';
}

export default function VisaCreateModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusOptions, setStatusOptions] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searching, setSearching] = useState(false);

  const [createVisa, { isLoading: saving }] = useCreateVisaMutation();
  const { options: countryOptions, loading: countryLoading, reload: reloadCountries } = useRelationalMasterOptions(
    'country',
    {},
    { enabled: Boolean(open) },
  );
  const { options: visaTypeOptions, loading: visaTypeLoading } = useRelationalMasterOptions(
    'visa-type',
    form.countryId ? { countryId: form.countryId } : {},
    { enabled: Boolean(open && form.countryId) },
  );

  const countrySelectOptions = useMemo(
    () => (countryOptions || []).map((o) => ({ value: o.value || o.id, label: o.label || o.name })),
    [countryOptions],
  );

  const visaTypeSelectOptions = useMemo(() => {
    const base = (visaTypeOptions || []).map((o) => ({
      value: o.label || o.name,
      label: o.label || o.name,
    }));
    if (form.visaType && !base.some((o) => o.value === form.visaType)) {
      return [{ value: form.visaType, label: form.visaType }, ...base];
    }
    return base;
  }, [visaTypeOptions, form.visaType]);

  const statusSelectOptions = useMemo(
    () => (statusOptions || []).map((o) => ({
      value: o.value,
      label: `${o.label}${o.defaultStatus ? ' (Default)' : ''}${o.visaApproved ? ' · Approved' : ''}${o.visaRejected ? ' · Rejected' : ''}`,
    })),
    [statusOptions],
  );

  const reset = useCallback(() => {
    setForm(EMPTY_FORM);
    setStatusOptions([]);
    setChecklist([]);
    setStudentSearch('');
    setStudentResults([]);
    setSelectedStudent(null);
    setSearching(false);
    setWorkflowLoading(false);
  }, []);

  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    reloadCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, reset]);

  const loadCountryDependents = useCallback(async (countryId) => {
    if (!countryId) {
      setStatusOptions([]);
      setChecklist([]);
      return;
    }
    setWorkflowLoading(true);
    try {
      const [workflowRes, checklistRes] = await Promise.all([
        masterApi.visaStatusWorkflow(countryId),
        masterApi.visaChecklistByCountry(countryId),
      ]);
      const workflow = Array.isArray(workflowRes?.data) ? workflowRes.data : (Array.isArray(workflowRes) ? workflowRes : []);
      const docs = Array.isArray(checklistRes?.data) ? checklistRes.data : (Array.isArray(checklistRes) ? checklistRes : []);
      setStatusOptions(workflow);
      setChecklist(docs);
      const defaultStatus = workflow.find((s) => s.defaultStatus);
      setForm((prev) => ({
        ...prev,
        visaStatusMasterId: defaultStatus?.value || workflow[0]?.value || '',
      }));
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Failed to load visa workflow'));
      setStatusOptions([]);
      setChecklist([]);
      setForm((prev) => ({ ...prev, visaStatusMasterId: '' }));
    } finally {
      setWorkflowLoading(false);
    }
  }, []);

  const resolveCountryId = useCallback(async (student) => {
    const rawId = student?.countryId || student?.metadata?.countryId || '';
    const rawName = String(student?.country || student?.metadata?.countryName || '').trim();
    let options = countrySelectOptions;
    if (!options.length) {
      try {
        const res = await masterApi.options('country', { limit: 100 });
        const rows = res?.data ?? res ?? [];
        options = (Array.isArray(rows) ? rows : []).map((o) => ({
          value: o.value || o.id,
          label: o.label || o.name,
        }));
      } catch {
        options = [];
      }
    }
    if (rawId && options.some((o) => o.value === rawId)) return rawId;
    if (rawName) {
      const needle = rawName.toLowerCase();
      const match = options.find((o) => String(o.label || '').toLowerCase() === needle)
        || options.find((o) => String(o.label || '').toLowerCase().includes(needle));
      if (match?.value) return match.value;
    }
    return '';
  }, [countrySelectOptions]);

  const handleCountryChange = async (nextCountryId) => {
    setForm((prev) => ({
      ...prev,
      countryId: nextCountryId || '',
      visaType: '',
      visaStatusMasterId: '',
    }));
    if (!nextCountryId) {
      setStatusOptions([]);
      setChecklist([]);
      return;
    }
    await loadCountryDependents(nextCountryId);
  };

  useEffect(() => {
    if (!open || selectedStudent || studentSearch.trim().length < 2) {
      if (studentSearch.trim().length < 2) setStudentResults([]);
      setSearching(false);
      return undefined;
    }
    let cancelled = false;
    setSearching(true);
    const timer = setTimeout(async () => {
      try {
        const res = await apiGet(API.STUDENTS, { search: studentSearch.trim(), limit: 10 });
        const rows = res?.data ?? res ?? [];
        if (!cancelled) setStudentResults(Array.isArray(rows) ? rows : []);
      } catch {
        if (!cancelled) setStudentResults([]);
      } finally {
        if (!cancelled) setSearching(false);
      }
    }, 280);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [studentSearch, selectedStudent, open]);

  const pickStudent = async (student) => {
    let full = student;
    try {
      const res = await apiGet(API.STUDENT_BY_ID(student.id));
      full = res?.data || res || student;
    } catch {
      full = student;
    }

    setSelectedStudent(full);
    setStudentSearch('');
    setStudentResults([]);
    reloadCountries();

    const nextCountryId = await resolveCountryId(full);
    setForm((prev) => ({
      ...prev,
      studentId: full.id,
      countryId: nextCountryId,
      visaType: '',
      visaStatusMasterId: '',
      applicationNo: '',
    }));

    if (nextCountryId) {
      await loadCountryDependents(nextCountryId);
    } else {
      setStatusOptions([]);
      setChecklist([]);
      if (full.country) {
        toastService.info(`Country "${full.country}" not in masters — select Destination Country manually`);
      }
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!form.studentId) {
      toastService.error('Select a student');
      return;
    }
    if (!form.countryId) {
      toastService.error('Select destination country');
      return;
    }
    if (statusSelectOptions.length > 0 && !form.visaStatusMasterId) {
      toastService.error('Select an initial visa status');
      return;
    }
    try {
      const countryName = countrySelectOptions.find((o) => o.value === form.countryId)?.label || '';
      await createVisa({
        studentId: form.studentId,
        countryId: form.countryId,
        country: countryName,
        visaType: form.visaType || null,
        visaStatusMasterId: form.visaStatusMasterId || null,
        applicationNo: form.applicationNo || null,
      }).unwrap();
      toastService.success('Visa case created');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Unable to create visa case'));
    }
  };

  // Status is preferred when masters exist, but must not block create if workflow is empty for country
  const canSubmit = Boolean(selectedStudent && form.countryId && !workflowLoading);
  const missingStatusMasters = Boolean(
    form.countryId && !workflowLoading && statusSelectOptions.length === 0,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Visa Case"
      subtitle="Status workflow and checklist follow Visa masters for the selected country."
      size="lg"
      footer={(
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>Cancel</Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={saving} disabled={!canSubmit}>
            Create Visa Case
          </Button>
        </>
      )}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5">
            Student <span className="text-danger">*</span>
          </label>
          {selectedStudent ? (
            <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm shrink-0">
                  {(selectedStudent.firstName?.[0] || 'S').toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-text truncate">{studentLabel(selectedStudent)}</h4>
                  <div className="text-xs text-text-muted font-mono truncate">{selectedStudent.studentCode}</div>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                type="button"
                onClick={() => {
                  setSelectedStudent(null);
                  setForm((prev) => ({ ...prev, studentId: '' }));
                }}
              >
                Change
              </Button>
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <FiSearch className="absolute left-3 top-2.5 text-text-muted w-4 h-4 pointer-events-none" />
                <input
                  type="text"
                  value={studentSearch}
                  onChange={(e) => setStudentSearch(e.target.value)}
                  placeholder="Type name or student code..."
                  autoComplete="off"
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-input-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>
              {searching && <div className="text-xs text-text-muted py-2 px-1">Searching…</div>}
              {studentResults.length > 0 && (
                <div className="mt-1 border border-border rounded-lg bg-card-bg shadow-lg max-h-48 overflow-y-auto divide-y divide-border z-10 relative">
                  {studentResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full text-left p-2.5 hover:bg-row-hover flex items-center justify-between"
                      onClick={() => pickStudent(s)}
                    >
                      <div>
                        <div className="font-medium text-sm text-text">{studentLabel(s)}</div>
                        <div className="text-xs text-text-muted">{s.studentCode}</div>
                      </div>
                      <span className="text-xs font-semibold text-primary">Select</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <Select
          label="Destination Country"
          value={form.countryId || undefined}
          onChange={(e) => handleCountryChange(e.target.value)}
          options={countrySelectOptions}
          placeholder={countryLoading ? 'Loading…' : 'Select country'}
          loading={countryLoading}
          disabled={!selectedStudent}
          required
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="Visa Type"
            value={form.visaType || undefined}
            onChange={(e) => setForm((prev) => ({ ...prev, visaType: e.target.value }))}
            options={visaTypeSelectOptions}
            placeholder={!form.countryId ? 'Select country first' : 'Select visa type'}
            loading={visaTypeLoading}
            disabled={!form.countryId}
          />
          <Select
            label="Initial Status"
            value={form.visaStatusMasterId || undefined}
            onChange={(e) => setForm((prev) => ({ ...prev, visaStatusMasterId: e.target.value }))}
            options={statusSelectOptions}
            placeholder={
              !form.countryId
                ? 'Select country first'
                : (workflowLoading
                  ? 'Loading…'
                  : (missingStatusMasters ? 'No status master for country' : 'Select status'))
            }
            loading={workflowLoading}
            disabled={!form.countryId || workflowLoading || missingStatusMasters}
            required={statusSelectOptions.length > 0}
          />
        </div>

        {missingStatusMasters && (
          <div className="rounded-lg border border-warning/30 bg-warning-soft/60 px-3.5 py-2.5 text-sm text-text-secondary">
            No <strong className="text-text">Visa Status</strong> masters for this country.
            You can still create the case — add statuses under{' '}
            <a href="/admin/master/visa-status-master" className="text-brand font-semibold hover:underline">
              Masters → Visa Status
            </a>
            {' '}so workflow advances correctly.
          </div>
        )}

        <Input
          label="Visa / Application No (optional)"
          value={form.applicationNo}
          onChange={(e) => setForm((prev) => ({ ...prev, applicationNo: e.target.value }))}
          placeholder="Auto-generated if left empty"
          disabled={!selectedStudent}
        />

        {checklist.length > 0 && (
          <div className="rounded-lg border border-border bg-surface/60 p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <FiClipboard className="w-4 h-4 text-primary shrink-0" />
              <div className="text-sm font-semibold text-text">Visa Documents</div>
              <span className="text-xs text-text-muted">({checklist.length})</span>
            </div>
            <ul className="space-y-1.5">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm text-text-secondary">
                  <FiFileText className="w-3.5 h-3.5 mt-0.5 text-text-muted shrink-0" />
                  <span>
                    {item.name}
                    {item.isMandatory && <span className="text-danger font-medium"> *</span>}
                    {item.documentType && <span className="text-text-muted"> ({item.documentType})</span>}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  );
}
