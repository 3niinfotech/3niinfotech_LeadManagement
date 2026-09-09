import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiSearch, FiFileText, FiClipboard } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Input from '../../../components/ui/Input';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import { useAsyncMasterOptions } from '../../master/hooks/useAsyncMasterOptions';
import { masterApi, getApiErrorMessage } from '../../master/services/masterApi.service';
import { useCreateApplicationMutation } from '../redux/applicationApiSlice';
import toastService from '../../../services/toast/toast.service';

const EMPTY_FORM = {
  studentId: '',
  university: '',
  course: '',
  intake: '',
  countryId: '',
  applicationStatusMasterId: '',
  applicationNo: '',
};

const FORM_ID = 'application-create-form';

function studentLabel(s) {
  if (!s) return '';
  return `${s.firstName || ''} ${s.lastName || ''}`.trim() || s.studentCode || 'Student';
}

export default function ApplicationCreateModal({ open, onClose, onSuccess }) {
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusOptions, setStatusOptions] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);
  const [studentSearch, setStudentSearch] = useState('');
  const [studentResults, setStudentResults] = useState([]);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [searching, setSearching] = useState(false);

  const [createApplication, { isLoading: saving }] = useCreateApplicationMutation();

  const countryEnabled = Boolean(open);
  const countryId = form.countryId || '';
  const dependentsEnabled = Boolean(open && countryId);

  const {
    options: countryOptions,
    loading: countryLoading,
    reload: reloadCountries,
  } = useRelationalMasterOptions('country', {}, { enabled: countryEnabled });

  const {
    options: universityOptions,
    loading: universityLoading,
    setSearch: setUniversitySearch,
  } = useAsyncMasterOptions(
    'university',
    countryId ? { countryId } : {},
    { enabled: dependentsEnabled },
  );

  const {
    options: courseOptions,
    loading: courseLoading,
    setSearch: setCourseSearch,
  } = useAsyncMasterOptions(
    'course',
    countryId ? { countryId } : {},
    { enabled: dependentsEnabled },
  );

  const countrySelectOptions = useMemo(
    () => (countryOptions || []).map((o) => ({
      value: o.value || o.id,
      label: o.label || o.name,
    })),
    [countryOptions],
  );

  const universitySelectOptions = useMemo(() => {
    const base = (universityOptions || []).map((o) => ({
      value: o.label || o.name,
      label: o.label || o.name,
    }));
    if (form.university && !base.some((o) => o.value === form.university)) {
      return [{ value: form.university, label: form.university }, ...base];
    }
    return base;
  }, [universityOptions, form.university]);

  const courseSelectOptions = useMemo(() => {
    const base = (courseOptions || []).map((o) => ({
      value: o.label || o.name,
      label: o.label || o.name,
    }));
    if (form.course && !base.some((o) => o.value === form.course)) {
      return [{ value: form.course, label: form.course }, ...base];
    }
    return base;
  }, [courseOptions, form.course]);

  const statusSelectOptions = useMemo(
    () => (statusOptions || []).map((o) => ({
      value: o.value,
      label: `${o.label}${o.defaultStatus ? ' (Default)' : ''}${o.setOfferLetter ? ' · Offer' : ''}`,
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

  /** Force-load masters whenever modal opens */
  useEffect(() => {
    if (!open) {
      reset();
      return;
    }
    reloadCountries();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only when modal opens
  }, [open, reset]);

  const loadCountryDependents = useCallback(async (nextCountryId) => {
    if (!nextCountryId) {
      setStatusOptions([]);
      setChecklist([]);
      return;
    }

    setWorkflowLoading(true);
    try {
      const [workflowRes, checklistRes] = await Promise.all([
        masterApi.applicationStatusWorkflow(nextCountryId),
        masterApi.applicationChecklistByCountry(nextCountryId),
      ]);
      const workflow = Array.isArray(workflowRes?.data)
        ? workflowRes.data
        : (Array.isArray(workflowRes) ? workflowRes : []);
      const docs = Array.isArray(checklistRes?.data)
        ? checklistRes.data
        : (Array.isArray(checklistRes) ? checklistRes : []);

      setStatusOptions(workflow);
      setChecklist(docs);

      const defaultStatus = workflow.find((s) => s.defaultStatus);
      setForm((prev) => ({
        ...prev,
        applicationStatusMasterId: defaultStatus?.value || workflow[0]?.value || '',
      }));
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Failed to load country workflow'));
      setStatusOptions([]);
      setChecklist([]);
      setForm((prev) => ({ ...prev, applicationStatusMasterId: '' }));
    } finally {
      setWorkflowLoading(false);
    }
  }, []);

  const handleCountryChange = async (nextCountryId) => {
    setForm((prev) => ({
      ...prev,
      countryId: nextCountryId || '',
      university: '',
      course: '',
      applicationStatusMasterId: '',
    }));
    setUniversitySearch('');
    setCourseSearch('');

    if (!nextCountryId) {
      setStatusOptions([]);
      setChecklist([]);
      return;
    }

    // Force workflow + checklist for selected country (university/course reload via hook params)
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
        const res = await apiGet(API.STUDENTS, {
          search: studentSearch.trim(),
          limit: 10,
        });
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

  const resolveCountryId = useCallback(async (student) => {
    const rawId = student?.countryId || student?.metadata?.countryId || '';
    const rawName = String(student?.country || student?.metadata?.countryName || '').trim();

    // Prefer already-loaded options
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

    // Force masters refresh, then map student profile → form
    reloadCountries();

    const nextCountryId = await resolveCountryId(full);
    const nextIntake = full.intake || '';
    const nextCourse = full.course || '';
    const nextUniversity = full.university || '';

    setForm((prev) => ({
      ...prev,
      studentId: full.id,
      countryId: nextCountryId,
      intake: nextIntake,
      course: nextCourse,
      university: nextUniversity,
      applicationStatusMasterId: '',
      applicationNo: '',
    }));
    setUniversitySearch(nextUniversity || '');
    setCourseSearch(nextCourse || '');

    if (nextCountryId) {
      await loadCountryDependents(nextCountryId);
    } else {
      setStatusOptions([]);
      setChecklist([]);
      if (full.country) {
        toastService.info(`Country "${full.country}" not found in masters — select Destination Country manually`);
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
    if (!form.university || !form.course) {
      toastService.error('Select university and course');
      return;
    }

    try {
      await createApplication({
        studentId: form.studentId,
        university: form.university,
        course: form.course,
        intake: form.intake || null,
        countryId: form.countryId || null,
        applicationStatusMasterId: form.applicationStatusMasterId || null,
        applicationNo: form.applicationNo || null,
      }).unwrap();
      toastService.success('Application created');
      onSuccess?.();
      onClose?.();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Unable to create application'));
    }
  };

  const canSubmit = Boolean(
    selectedStudent
    && form.countryId
    && form.university
    && form.course,
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Application"
      subtitle="Link a student to a university application — status workflow follows the selected country."
      size="lg"
      footer={(
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form={FORM_ID}
            loading={saving}
            disabled={!canSubmit}
          >
            Create Application
          </Button>
        </>
      )}
    >
      <form id={FORM_ID} onSubmit={handleSubmit} className="space-y-4">
        {/* Student */}
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
                  <h4 className="text-sm font-semibold text-text truncate">
                    {studentLabel(selectedStudent)}
                  </h4>
                  <div className="flex flex-wrap items-center gap-x-2 text-xs text-text-muted">
                    <span className="font-mono">{selectedStudent.studentCode}</span>
                    {selectedStudent.mobile && <span>· {selectedStudent.mobile}</span>}
                    {selectedStudent.email && <span>· {selectedStudent.email}</span>}
                  </div>
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

              {searching && (
                <div className="text-xs text-text-muted py-2 px-1">Searching students...</div>
              )}

              {studentResults.length > 0 && (
                <div className="mt-1 border border-border rounded-lg bg-card-bg shadow-lg max-h-48 overflow-y-auto divide-y divide-border z-10 relative">
                  {studentResults.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      className="w-full text-left p-2.5 hover:bg-row-hover flex items-center justify-between transition-colors"
                      onClick={() => pickStudent(s)}
                    >
                      <div className="min-w-0">
                        <div className="font-medium text-sm text-text truncate">
                          {studentLabel(s)}
                        </div>
                        <div className="text-xs text-text-muted truncate">
                          {s.studentCode}{s.mobile ? ` · ${s.mobile}` : ''}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary shrink-0 ml-2">Select</span>
                    </button>
                  ))}
                </div>
              )}

              {studentSearch.trim().length >= 2 && !searching && studentResults.length === 0 && (
                <div className="text-xs text-text-muted py-2 px-1">No matching students found.</div>
              )}
            </div>
          )}
        </div>

        {/* Country — always options prop (Ant Select) */}
        <Select
          label="Destination Country"
          value={form.countryId || undefined}
          onChange={(e) => handleCountryChange(e.target.value)}
          options={countrySelectOptions}
          placeholder={countryLoading ? 'Loading countries…' : 'Select country'}
          loading={countryLoading}
          disabled={!selectedStudent}
          notFoundContent={
            countryLoading
              ? 'Loading…'
              : 'No countries found — add under Master → Country'
          }
          required
        />

        {!selectedStudent && (
          <p className="text-xs text-text-muted -mt-2">Select a student first to unlock country and program fields.</p>
        )}

        {selectedStudent && (selectedStudent.country || selectedStudent.course || selectedStudent.intake) && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-text-secondary">
            Prefilling from student profile:
            {selectedStudent.country && <span className="font-medium text-text"> {selectedStudent.country}</span>}
            {selectedStudent.course && <span> · {selectedStudent.course}</span>}
            {selectedStudent.intake && <span> · {selectedStudent.intake}</span>}
            {!selectedStudent.university && (
              <span className="block mt-1 text-amber-700">University not set on student — choose one below.</span>
            )}
          </div>
        )}

        {/* University & Course */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Select
            label="University"
            value={form.university || undefined}
            onChange={(e) => setForm((prev) => ({ ...prev, university: e.target.value }))}
            options={universitySelectOptions}
            placeholder={
              !form.countryId
                ? 'Select country first'
                : (universityLoading ? 'Loading…' : 'Search university')
            }
            showSearch
            filterOption={false}
            onSearch={setUniversitySearch}
            loading={universityLoading}
            disabled={!form.countryId}
            notFoundContent={universityLoading ? 'Loading…' : 'No universities for this country'}
            required
          />

          <Select
            label="Course"
            value={form.course || undefined}
            onChange={(e) => setForm((prev) => ({ ...prev, course: e.target.value }))}
            options={courseSelectOptions}
            placeholder={
              !form.countryId
                ? 'Select country first'
                : (courseLoading ? 'Loading…' : 'Search course')
            }
            showSearch
            filterOption={false}
            onSearch={setCourseSearch}
            loading={courseLoading}
            disabled={!form.countryId}
            notFoundContent={courseLoading ? 'Loading…' : 'No courses for this country'}
            required
          />
        </div>

        {/* Intake & Status */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Input
            label="Intake"
            value={form.intake}
            onChange={(e) => setForm((prev) => ({ ...prev, intake: e.target.value }))}
            placeholder="e.g. Sep 2026"
            disabled={!selectedStudent}
          />

          <Select
            label="Initial Status"
            value={form.applicationStatusMasterId || undefined}
            onChange={(e) => setForm((prev) => ({
              ...prev,
              applicationStatusMasterId: e.target.value,
            }))}
            options={statusSelectOptions}
            placeholder={
              !form.countryId
                ? 'Select country first'
                : (workflowLoading ? 'Loading statuses…' : 'Select status')
            }
            loading={workflowLoading}
            disabled={!form.countryId || workflowLoading}
            notFoundContent={
              workflowLoading
                ? 'Loading…'
                : 'No statuses — add under Master → Application Status'
            }
            required
          />
        </div>

        <Input
          label="Application No (optional)"
          value={form.applicationNo}
          onChange={(e) => setForm((prev) => ({ ...prev, applicationNo: e.target.value }))}
          placeholder="Auto-generated if left empty"
          disabled={!selectedStudent}
        />

        {checklist.length > 0 && (
          <div className="rounded-lg border border-border bg-surface/60 p-3.5">
            <div className="flex items-center gap-2 mb-2.5">
              <FiClipboard className="w-4 h-4 text-primary shrink-0" />
              <div className="text-sm font-semibold text-text">Required Documents</div>
              <span className="text-xs text-text-muted">({checklist.length})</span>
            </div>
            <ul className="space-y-1.5">
              {checklist.map((item) => (
                <li key={item.id} className="flex items-start gap-2 text-sm text-text-secondary">
                  <FiFileText className="w-3.5 h-3.5 mt-0.5 text-text-muted shrink-0" />
                  <span>
                    {item.name}
                    {item.isMandatory && <span className="text-danger font-medium"> *</span>}
                    {item.documentType && (
                      <span className="text-text-muted"> ({item.documentType})</span>
                    )}
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
