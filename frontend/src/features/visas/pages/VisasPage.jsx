import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiGlobe, FiPlus } from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Select from '../../../components/ui/Select';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { PERMISSIONS } from '../../../config/permissions';
import PermissionGate from '../../../components/common/PermissionGate';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { masterApi, getApiErrorMessage } from '../../master/services/masterApi.service';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import MasterManageLink from '../../master/components/MasterManageLink';

const EMPTY_FORM = {
  studentId: '',
  countryId: '',
  visaType: '',
  visaStatusMasterId: '',
  applicationNo: '',
};

function displayStatus(record) {
  return record.metadata?.visaStatusName || record.status;
}

function statusColor(record) {
  if (record.metadata?.colorCode?.startsWith?.('#')) return 'info';
  if (record.metadata?.visaApproved || record.status === 'APPROVED') return 'success';
  if (record.metadata?.visaRejected || record.status === 'REJECTED') return 'danger';
  if (record.metadata?.visaWithdraw) return 'warning';
  return 'warning';
}

export default function VisasPage() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(EMPTY_FORM);
  const [statusOptions, setStatusOptions] = useState([]);
  const [checklist, setChecklist] = useState([]);
  const [workflowLoading, setWorkflowLoading] = useState(false);

  const { options: countryOptions } = useRelationalMasterOptions('country');
  const { options: visaTypeOptions } = useRelationalMasterOptions(
    'visa-type',
    form.countryId ? { countryId: form.countryId } : {},
    { enabled: Boolean(form.countryId) },
  );

  const load = async () => {
    setLoading(true);
    try {
      const response = await apiGet(API.VISAS);
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
      setForm((prev) => ({ ...prev, visaStatusMasterId: '', visaType: '' }));
      return;
    }
    setWorkflowLoading(true);
    try {
      const [workflowRes, checklistRes] = await Promise.all([
        masterApi.visaStatusWorkflow(countryId),
        masterApi.visaChecklistByCountry(countryId),
      ]);
      const workflow = Array.isArray(workflowRes?.data) ? workflowRes.data : (workflowRes || []);
      setStatusOptions(workflow);
      setChecklist(Array.isArray(checklistRes?.data) ? checklistRes.data : (checklistRes || []));
      const defaultStatus = workflow.find((s) => s.defaultStatus);
      setForm((prev) => ({
        ...prev,
        countryId,
        visaStatusMasterId: defaultStatus?.value || workflow[0]?.value || '',
      }));
    } catch (err) {
      toastService.error(getApiErrorMessage(err, 'Failed to load visa workflow'));
      setStatusOptions([]);
      setChecklist([]);
    } finally {
      setWorkflowLoading(false);
    }
  }, []);

  const stats = useMemo(() => ({
    total: records.length,
    pending: records.filter((r) => !r.metadata?.visaApproved && !r.metadata?.visaRejected).length,
    approved: records.filter((r) => r.metadata?.visaApproved || r.status === 'APPROVED').length,
  }), [records]);

  const submitCreate = async (event) => {
    event.preventDefault();
    try {
      const countryName = countryOptions.find((o) => o.value === form.countryId)?.label || '';
      await apiPost(API.VISAS, {
        ...form,
        country: countryName,
      });
      toastService.success('Visa case created');
      setForm(EMPTY_FORM);
      setStatusOptions([]);
      setChecklist([]);
      load();
    } catch (err) {
      toastService.error(err?.message || 'Unable to create visa case');
    }
  };

  const remove = async (id) => {
    const ok = await alertService.deleteConfirm({ title: 'Delete visa case', text: 'This will remove the visa case.' });
    if (!ok) return;
    try {
      await apiDelete(`${API.VISAS}/${id}`);
      toastService.success('Visa case removed');
      load();
    } catch (err) {
      toastService.error(err?.message || 'Delete failed');
    }
  };

  return (
    <PageShell>
      <PageHeader
        title="Visa Processing"
        subtitle="Filings use Visa Status and Visa Checklist masters by country"
        icon={FiGlobe}
        iconColor="primary"
        actions={<MasterManageLink to="/admin/master/visa-status-master">Manage Visa Status</MasterManageLink>}
      />
      <div className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-text">Visa Cases</h3>
              <p className="text-sm text-text-muted">Track visa stages from country workflow masters.</p>
            </div>
            <PermissionGate permission={PERMISSIONS.VISAS_VIEW}>
              <Button size="sm" icon={FiPlus}>New Visa</Button>
            </PermissionGate>
          </div>
          <div className="mb-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-card-border bg-surface p-3"><div className="text-sm text-text-muted">Total</div><div className="text-2xl font-semibold text-text">{stats.total}</div></div>
            <div className="rounded-xl border border-card-border bg-surface p-3"><div className="text-sm text-text-muted">Pending</div><div className="text-2xl font-semibold text-text">{stats.pending}</div></div>
            <div className="rounded-xl border border-card-border bg-surface p-3"><div className="text-sm text-text-muted">Approved</div><div className="text-2xl font-semibold text-text">{stats.approved}</div></div>
          </div>
          {loading ? <div className="text-sm text-text-muted">Loading visa cases…</div> : (
            <div className="space-y-3">
              {records.map((record) => (
                <div key={record.id} className="rounded-xl border border-card-border p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <div className="font-semibold text-text">{record.country} · {record.visaType || 'Visa'}</div>
                      <div className="text-sm text-text-muted">{record.student?.firstName} {record.student?.lastName} · {record.applicationNo}</div>
                    </div>
                    <Badge color={statusColor(record)}>{displayStatus(record)}</Badge>
                  </div>
                  <div className="mt-3">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const nextStatus = record.status === 'APPROVED' ? 'NOT_STARTED' : 'APPROVED';
                        apiPut(`${API.VISAS}/${record.id}`, { status: nextStatus }).then(() => {
                          toastService.success('Status updated');
                          load();
                        }).catch(() => toastService.error('Update failed'));
                      }}
                    >
                      Advance Status
                    </Button>
                    <Button size="sm" variant="danger" className="ml-2" onClick={() => remove(record.id)}>Delete</Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="rounded-2xl border border-card-border bg-card-bg p-4 shadow-card">
          <h3 className="text-lg font-semibold text-text">Create Visa Case</h3>
          <p className="mb-4 text-sm text-text-muted">Default status comes from Visa Status master for the selected country.</p>
          <form className="mt-4 space-y-3" onSubmit={submitCreate}>
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Student ID" value={form.studentId} onChange={(e) => setForm({ ...form, studentId: e.target.value })} required />
            <Select
              label="Country"
              value={form.countryId}
              onChange={(e) => loadCountryConfig(e.target.value)}
              options={[
                { value: '', label: 'Select country' },
                ...countryOptions.map((opt) => ({ value: opt.value, label: opt.label })),
              ]}
              required
            />
            <Select
              label="Visa Type"
              value={form.visaType}
              onChange={(e) => setForm({ ...form, visaType: e.target.value })}
              options={[
                { value: '', label: form.countryId ? 'Select visa type' : 'Select country first' },
                ...visaTypeOptions.map((opt) => ({ value: opt.label, label: opt.label })),
              ]}
              disabled={!form.countryId}
            />
            <Select
              label="Visa Status"
              value={form.visaStatusMasterId}
              onChange={(e) => setForm({ ...form, visaStatusMasterId: e.target.value })}
              options={[
                { value: '', label: workflowLoading ? 'Loading statuses…' : 'Select status' },
                ...statusOptions.map((opt) => ({
                  value: opt.value,
                  label: `${opt.label}${opt.defaultStatus ? ' (Default)' : ''}${opt.visaApproved ? ' · Approved' : ''}${opt.visaRejected ? ' · Rejected' : ''}`,
                })),
              ]}
              disabled={!form.countryId || workflowLoading}
            />
            <input className="w-full rounded-lg border border-card-border bg-surface px-3 py-2" placeholder="Application No (optional)" value={form.applicationNo} onChange={(e) => setForm({ ...form, applicationNo: e.target.value })} />

            {checklist.length > 0 && (
              <div className="rounded-lg border border-card-border bg-surface p-3">
                <div className="text-sm font-semibold text-text mb-2">Visa Documents</div>
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

            <Button type="submit" className="w-full">Save Visa Case</Button>
          </form>
        </div>
      </div>
    </PageShell>
  );
}
