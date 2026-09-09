import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiClipboard, FiCheckCircle } from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { PERMISSIONS } from '../../../config/permissions';
import PermissionGate from '../../../components/common/PermissionGate';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { masterApi, getApiErrorMessage } from '../../master/services/masterApi.service';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import { useAsyncMasterOptions } from '../../master/hooks/useAsyncMasterOptions';
import Select from '../../../components/ui/Select';
import MasterManageLink from '../../master/components/MasterManageLink';
import CountryFlagLabel from '../../../components/ui/CountryFlagLabel';

const EMPTY_FORM = {
  studentId: '',
  university: '',
  course: '',
  intake: '',
  countryId: '',
  applicationStatusMasterId: '',
  applicationNo: '',
};

export default function AdmissionsPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusOptions, setStatusOptions] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const { options: countryOptions } = useRelationalMasterOptions('country');
  const { options: universityOptions, loading: universityLoading, setSearch: setUniversitySearch } = useAsyncMasterOptions(
    'university',
    form.countryId ? { countryId: form.countryId } : {},
  );
  const { options: courseOptions, loading: courseLoading, setSearch: setCourseSearch } = useAsyncMasterOptions(
    'course',
    {
      ...(form.countryId ? { countryId: form.countryId } : {}),
    },
  );

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiGet(API.APPLICATIONS);
      setRecords(response?.data || []);
    } catch {
      setRecords([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const loadCountryConfig = useCallback(async (countryId) => {
    if (!countryId) {
      setStatusOptions([]);
      setChecklist([]);
      setForm((prev) => ({ ...prev, applicationStatusMasterId: '' }));
      return;
    }
    setWorkflowLoading(true);
    try {
      const [workflowRes, checklistRes] = await Promise.all([
        masterApi.applicationStatusWorkflow(countryId),
        masterApi.applicationChecklistByCountry(countryId),
      ]);
      const workflow = Array.isArray(workflowRes?.data) ? workflowRes.data : (workflowRes || []);
      setStatusOptions(workflow);
      setChecklist(Array.isArray(checklistRes?.data) ? checklistRes.data : (checklistRes || []));
      const defaultStatus = workflow.find((s) => s.defaultStatus);
      setForm((prev) => ({
        ...prev,
        countryId,
        applicationStatusMasterId: defaultStatus?.value || workflow[0]?.value || '',
      }));
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Failed to load country workflow'));
      setStatusOptions([]);
      setChecklist([]);
    } finally {
      setWorkflowLoading(false);
    }
  }, []);

  useEffect(() => {
    if (form.countryId) loadCountryConfig(form.countryId);
  }, [form.countryId, loadCountryConfig]);

  const handleCountryChange = (countryId) => {
    setForm((prev) => ({ ...prev, countryId, applicationStatusMasterId: '' }));
  };

  const stats = useMemo(() => ({
    total: records.length,
    inReview: records.filter((r) => {
      const name = r.metadata?.applicationStatusName || r.status;
      return /review|submitted/i.test(String(name));
    }).length,
    offer: records.filter((r) => r.metadata?.setOfferLetter || /offer/i.test(String(r.metadata?.applicationStatusName || r.status))).length,
  }), [records]);

  const submitCreate = async (event) => {
    event.preventDefault();
    try {
      await apiPost(API.APPLICATIONS, {
        studentId: form.studentId,
        university: form.university,
        course: form.course,
        intake: form.intake || null,
        countryId: form.countryId || null,
        applicationStatusMasterId: form.applicationStatusMasterId || null,
        applicationNo: form.applicationNo || null,
      });
      toastService.success('Application created');
      setForm(EMPTY_FORM);
      setStatusOptions([]);
      setChecklist([]);
      load();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Unable to create application'));
    }
  };

  const advanceStatus = async (record) => {
    const countryId = record.metadata?.countryId;
    if (!countryId) {
      toastService.error('Application has no country — assign a country first');
      return;
    }
    try {
      const workflowRes = await masterApi.applicationStatusWorkflow(countryId);
      const workflow = Array.isArray(workflowRes?.data) ? workflowRes.data : (workflowRes || []);
      const currentId = record.metadata?.applicationStatusMasterId;
      const idx = workflow.findIndex((s) => s.value === currentId);
      const next = idx >= 0 ? workflow[idx + 1] : workflow[0];
      if (!next) {
        toastService.info('Already at the final status');
        return;
      }
      await apiPut(API.APPLICATION_BY_ID(record.id), {
        applicationStatusMasterId: next.value,
      });
      toastService.success(`Status updated to ${next.label}`);
      load();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Update failed'));
    }
  };

  const remove = async (id) => {
    const ok = await alertService.deleteConfirm({ title: 'Delete application', text: 'This will remove the application record.' });
    if (!ok) return;
    try {
      await apiDelete(API.APPLICATION_BY_ID(id));
      toastService.success('Application removed');
      load();
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Delete failed'));
    }
  };

  const displayStatus = (record) => record.metadata?.applicationStatusName || record.status;

  return (
    <PageShell>
      <PageHeader
        title="Admissions"
        subtitle="Track applications, approvals, and student readiness"
        icon={FiClipboard}
        iconColor="primary"
        actions={<MasterManageLink to="/admin/master/application-status-master">Manage Application Status</MasterManageLink>}
      />

      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text">Applications</h3>
              <p className="text-sm text-text-muted">Country-specific status workflow from Application Status master.</p>
            </div>
          </div>

          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-surface p-3">
              <div className="text-sm text-text-muted">Total</div>
              <div className="text-2xl font-semibold text-text">{stats.total}</div>
            </div>
            <div className="rounded-xl border border-card-border bg-surface p-3">
              <div className="text-sm text-text-muted">In Review</div>
              <div className="text-2xl font-semibold text-text">{stats.inReview}</div>
            </div>
            <div className="rounded-xl border border-card-border bg-surface p-3">
              <div className="text-sm text-text-muted">Offer Stage</div>
              <div className="text-2xl font-semibold text-text">{stats.offer}</div>
            </div>
          </div>

          {loading ? <div className="text-sm text-text-muted">Loading applications…</div> : (
            <div className="space-y-3">
              {records.length === 0 && <div className="text-sm text-text-muted">No applications yet.</div>}
              {records.map((record) => (
                <div key={record.id} className="rounded-xl border border-card-border p-3">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-text">{record.university} · {record.course}</div>
                      <div className="text-sm text-text-muted inline-flex flex-wrap items-center gap-1">
                        <span>{record.student?.firstName} {record.student?.lastName} · {record.applicationNo}</span>
                        {record.country ? (
                          <>
                            <span>·</span>
                            <CountryFlagLabel country={record.country} size="xs" />
                          </>
                        ) : null}
                      </div>
                    </div>
                    <Badge color={record.metadata?.setOfferLetter ? 'success' : 'warning'}>{displayStatus(record)}</Badge>
                  </div>
                  {record.metadata?.mailSend && (
                    <p className="mt-1 text-xs text-text-muted">Mail send enabled for this status</p>
                  )}
                  <div className="mt-3 flex flex-wrap gap-2">
                    <PermissionGate permission={PERMISSIONS.APPLICATIONS_UPDATE}>
                      <Button size="sm" variant="outline" icon={FiCheckCircle} onClick={() => advanceStatus(record)}>
                        Advance Status
                      </Button>
                    </PermissionGate>
                    <PermissionGate permission={PERMISSIONS.APPLICATIONS_DELETE}>
                      <Button size="sm" variant="danger" onClick={() => remove(record.id)}>Delete</Button>
                    </PermissionGate>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card">
          <h3 className="text-lg font-semibold text-text">Create Admission</h3>
          <p className="mb-4 text-sm text-text-muted">Default status is applied from Application Status master for the selected country.</p>
          <PermissionGate permission={PERMISSIONS.APPLICATIONS_CREATE}>
            <form className="space-y-3" onSubmit={submitCreate}>
              <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
              <Select
                label="University"
                value={form.university}
                onChange={(e) => setForm({ ...form, university: e.target.value })}
                options={universityOptions.map((opt) => ({ value: opt.label, label: opt.label }))}
                placeholder="Search university"
                showSearch
                filterOption={false}
                onSearch={setUniversitySearch}
                loading={universityLoading}
                required
              />
              <Select
                label="Course"
                value={form.course}
                onChange={(e) => setForm({ ...form, course: e.target.value })}
                options={courseOptions.map((opt) => ({ value: opt.label, label: opt.label }))}
                placeholder="Search course"
                showSearch
                filterOption={false}
                onSearch={setCourseSearch}
                loading={courseLoading}
                required
              />
              <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Intake" value={form.intake} onChange={(e) => setForm({ ...form, intake: e.target.value })} />
              <select
                className="w-full rounded-lg border border-card-border bg-surface px-3 py-2"
                value={form.countryId}
                onChange={(e) => handleCountryChange(e.target.value)}
                required
              >
                <option value="">Select country</option>
                {countryOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
              <select
                className="w-full rounded-lg border border-card-border bg-surface px-3 py-2"
                value={form.applicationStatusMasterId}
                onChange={(e) => setForm({ ...form, applicationStatusMasterId: e.target.value })}
                disabled={!form.countryId || workflowLoading}
                required
              >
                <option value="">{workflowLoading ? 'Loading statuses…' : 'Select status'}</option>
                {statusOptions.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}{opt.defaultStatus ? ' (Default)' : ''}{opt.setOfferLetter ? ' · Offer' : ''}
                  </option>
                ))}
              </select>
              <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Application No (optional)" value={form.applicationNo} onChange={(e) => setForm({ ...form, applicationNo: e.target.value })} />

              {checklist.length > 0 && (
                <div className="rounded-lg border border-card-border bg-surface p-3">
                  <div className="text-sm font-semibold text-text mb-2">Required Documents</div>
                  <ul className="space-y-1 text-sm text-text-muted">
                    {checklist.map((item) => (
                      <li key={item.id}>
                        {item.name}
                        {item.isMandatory ? ' *' : ''}
                        {item.documentType ? ` (${item.documentType})` : ''}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button type="submit" className="w-full">Save Admission</Button>
            </form>
          </PermissionGate>
        </div>
      </div>
    </PageShell>
  );
}
