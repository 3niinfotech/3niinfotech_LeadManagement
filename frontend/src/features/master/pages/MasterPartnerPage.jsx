import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiBriefcase, FiPlus, FiEye, FiEdit2, FiToggleLeft, FiToggleRight, FiTrash2 } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FormField from '../../../components/ui/FormField';
import MasterFormShell from '../components/MasterFormShell';
import MasterFormSection from '../components/MasterFormSection';
import { masterFormSubtitle, masterSubmitLabel } from '../utils/masterFormLayout.util';
import '../styles/master-form.theme.css';
import DataGrid from '../../../components/table/DataGrid';
import Pagination from '../../../components/ui/Pagination';
import { createActionsColumn } from '../../../components/table/grid.columns';
import { createCountryColumn } from '../../../components/table/countryColumn';
import MasterListToolbar from '../components/MasterListToolbar';
import { resolveMasterPage, buildMasterBreadcrumbs, getMasterTypeMeta } from '../../../config/master-registry.config';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { partnerApi, getPartnerApiError } from '../services/partnerApi.service';
import { useRelationalMasterOptions } from '../hooks/useRelationalMasterOptions';
import { organizationApi } from '../services/organizationApi.service';
import { staffApi } from '../services/staffApi.service';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { buildDeleteConfirmText } from '../utils/masterUsage.util';

const TYPE_OPTIONS = [
  { value: 'PARTNER', label: 'Partner' },
  { value: 'ASSOCIATE', label: 'Associate' },
];

function emptyForm(defaultType) {
  return {
    name: '',
    type: defaultType || 'PARTNER',
    email: '',
    phone: '',
    country: '',
    website: '',
    commission: '',
    agreementDate: '',
    agreementEmail: '',
    contactPerson: '',
    nationality: '',
    currencyCode: '',
    approvalDate: '',
    branchId: '',
    assignedToId: '',
    commissionRules: [],
    isActive: true,
  };
}

function rowToForm(row, defaultType) {
  if (!row) return emptyForm(defaultType);
  const meta = row.metadata && typeof row.metadata === 'object' ? row.metadata : {};
  return {
    name: row.name || '',
    type: row.type || defaultType || 'PARTNER',
    email: row.email || '',
    phone: row.phone || '',
    country: row.country || '',
    website: row.website || '',
    commission: row.commission ?? '',
    agreementDate: meta.agreementDate || '',
    agreementEmail: meta.agreementEmail || '',
    contactPerson: meta.contactPerson || '',
    nationality: meta.nationality || '',
    currencyCode: meta.currencyCode || '',
    approvalDate: meta.approvalDate || '',
    branchId: meta.branchId || '',
    assignedToId: meta.assignedToId || '',
    commissionRules: Array.isArray(meta.commissionRules) ? meta.commissionRules : [],
    isActive: row.isActive !== false,
  };
}

export default function MasterPartnerPage({ defaultType = null, slug = 'partners' }) {
  const hubItem = resolveMasterPage(slug)?.hubItem;
  const { can } = usePermissions();
  const canView = can(PERMISSIONS.PARTNERS_VIEW) || can(PERMISSIONS.MASTERS_VIEW);
  const canManage = can(PERMISSIONS.MASTERS_MANAGE) || can(PERMISSIONS.PARTNERS_VIEW);

  const [rows, setRows] = useState([]);
  const [pagination, setPagination] = useState({ page: 1, limit: 25, total: 0, totalPages: 0 });
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const { options: countryOptions } = useRelationalMasterOptions('country');
  const { options: currencyOptions } = useRelationalMasterOptions('currency');
  const [branchOptions, setBranchOptions] = useState([]);
  const [staffOptions, setStaffOptions] = useState([]);
  const [drawer, setDrawer] = useState({ open: false, mode: 'add', record: null });
  const [form, setForm] = useState(emptyForm(defaultType));
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await partnerApi.list({
        page: pagination.page,
        limit: pagination.limit,
        search: debouncedSearch.trim() || undefined,
        type: defaultType || undefined,
      });
      setRows(res.data || []);
      if (res.pagination) setPagination((p) => ({ ...p, ...res.pagination }));
    } catch (err) {
      toastService.error(getPartnerApiError(err, 'Failed to load partners'));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [pagination.page, pagination.limit, debouncedSearch, defaultType]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    organizationApi.listBranches({ status: 'active' }).then((res) => {
      const rows = res?.data || res || [];
      setBranchOptions((Array.isArray(rows) ? rows : []).map((b) => ({ value: b.id, label: b.name })));
    }).catch(() => setBranchOptions([]));
    staffApi.list({ limit: 100 }).then((res) => {
      setStaffOptions((res.data || []).map((u) => ({
        value: u.id,
        label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
      })));
    }).catch(() => setStaffOptions([]));
  }, []);

  const openDrawer = (mode, record = null) => {
    setForm(rowToForm(record, defaultType));
    setDrawer({ open: true, mode, record });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toastService.error('Name is required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        commission: form.commission === '' ? null : Number(form.commission),
        email: form.email || null,
        agreementEmail: form.agreementEmail || null,
        approvalDate: form.approvalDate || null,
        branchId: form.branchId || null,
        assignedToId: form.assignedToId || null,
        commissionRules: (form.commissionRules || []).map((rule) => ({
          ...rule,
          value: rule.value === '' ? null : Number(rule.value),
        })),
      };
      if (drawer.mode === 'add') {
        await partnerApi.create(payload);
        toastService.success('Partner created');
      } else {
        await partnerApi.update(drawer.record.id, payload);
        toastService.success('Partner updated');
      }
      setDrawer({ open: false, mode: 'add', record: null });
      load();
    } catch (err) {
      toastService.error(getPartnerApiError(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatus = async (row) => {
    const next = !row.isActive;
    const ok = await alertService.confirm({
      title: next ? 'Activate' : 'Deactivate',
      text: `Mark "${row.name}" as ${next ? 'active' : 'inactive'}?`,
      confirmText: next ? 'Activate' : 'Deactivate',
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      await partnerApi.updateStatus(row.id, next);
      toastService.success(`Marked ${next ? 'active' : 'inactive'}`);
      load();
    } catch (err) {
      toastService.error(getPartnerApiError(err, 'Status update failed'));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (row) => {
    const studentCount = row._count?.students ?? row.studentCount ?? 0;
    const usage = studentCount > 0
      ? { total: studentCount, dependencies: [{ label: 'students', count: studentCount }] }
      : { total: 0, dependencies: [] };
    const ok = await alertService.softDeleteConfirm({
      title: `Delete ${defaultType === 'ASSOCIATE' ? 'Associate' : 'Partner'}`,
      text: buildDeleteConfirmText(usage, row.name),
      itemName: row.name,
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      await partnerApi.remove(row.id);
      toastService.success(`${defaultType === 'ASSOCIATE' ? 'Associate' : 'Partner'} deleted`);
      load();
    } catch (err) {
      toastService.error(getPartnerApiError(err, 'Delete failed'));
    } finally {
      setActionId(null);
    }
  };

  const columns = useMemo(() => [
    { field: 'code', headerName: 'Code', width: 140 },
    { field: 'name', headerName: 'Organization', flex: 1, minWidth: 160 },
    { field: 'type', headerName: 'Type', width: 120 },
    { field: 'email', headerName: 'Email', minWidth: 160 },
    { field: 'phone', headerName: 'Mobile', width: 130 },
    createCountryColumn({ field: 'country', headerName: 'Country', width: 140 }),
    { field: 'commission', headerName: 'Commission %', width: 120 },
    {
      field: '_count.students',
      headerName: 'In use',
      width: 80,
      valueGetter: (p) => p.data?._count?.students ?? 0,
      cellRenderer: (p) => {
        const count = p.data?._count?.students ?? 0;
        return (
          <span className={`text-[11px] font-semibold ${count > 0 ? 'text-amber-700' : 'text-text-muted'}`}>
            {count}
          </span>
        );
      },
    },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 110,
      cellRenderer: (p) => (
        <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${p.value ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'}`}>
          {p.value ? 'Active' : 'Inactive'}
        </span>
      ),
    },
    createActionsColumn({
      width: canManage ? 148 : 72,
      cellRenderer: (p) => {
        const row = p.data;
        const busy = actionId === row.id;
        return (
          <div className="crm-grid-actions" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="crm-grid-action-btn" title="View" onClick={() => openDrawer('view', row)}>
              <FiEye className="w-3.5 h-3.5" />
            </button>
            {canManage && (
              <>
                <button type="button" className="crm-grid-action-btn crm-grid-action-btn--edit" title="Edit" disabled={busy} onClick={() => openDrawer('edit', row)}>
                  <FiEdit2 className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="crm-grid-action-btn" title="Toggle status" disabled={busy} onClick={() => handleStatus(row)}>
                  {row.isActive ? <FiToggleRight className="w-3.5 h-3.5 text-emerald-600" /> : <FiToggleLeft className="w-3.5 h-3.5" />}
                </button>
                <button type="button" className="crm-grid-action-btn crm-grid-action-btn--delete" title="Delete" disabled={busy} onClick={() => handleDelete(row)}>
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        );
      },
    }),
  ], [actionId, canManage, defaultType]);

  if (!canView) {
    return (
      <ModulePageCard title={hubItem?.label || 'Partners'} icon={FiBriefcase}>
        <Card className="p-8 text-center text-text-muted">You do not have access to partners.</Card>
      </ModulePageCard>
    );
  }

  const readOnly = drawer.mode === 'view';
  const title = hubItem?.label || 'Partners';
  const entityLabel = defaultType === 'ASSOCIATE' ? 'Associate' : 'Partner';
  const drawerTitle = drawer.mode === 'add'
    ? `Add ${entityLabel}`
    : drawer.mode === 'edit'
      ? `Edit ${entityLabel}`
      : `${entityLabel} details`;
  const drawerSubtitle = drawer.mode === 'view'
    ? 'Read-only details'
    : masterFormSubtitle(drawer.mode, entityLabel);
  const saveLabel = masterSubmitLabel(drawer.mode, entityLabel, saving);
  const closeDrawer = () => setDrawer({ open: false, mode: 'add', record: null });

  return (
    <>
      <ModulePageCard
        title={title}
        subtitle={`${getMasterTypeMeta(hubItem?.type).label} · ${hubItem?.description || ''}`}
        icon={FiBriefcase}
        breadcrumbs={buildMasterBreadcrumbs(hubItem, title)}
        actions={canManage ? (
          <Button size="sm" icon={FiPlus} onClick={() => openDrawer('add')}>Add {defaultType === 'ASSOCIATE' ? 'Associate' : 'Partner'}</Button>
        ) : null}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <MasterListToolbar
            search={search}
            onSearchChange={(value) => {
              setSearch(value);
              setPagination((p) => ({ ...p, page: 1 }));
            }}
            searchPlaceholder="Search name, code, email…"
            searchAriaLabel="Search partners"
            showStatus={false}
            onRefresh={load}
            refreshing={loading}
          />
          <ModulePageCard.Table className="min-h-[320px]">
            <DataGrid
              columns={columns}
              rowData={rows}
              loading={loading}
              pagination={false}
              getRowId={(p) => p.data.id}
              emptyTitle={`No ${defaultType === 'ASSOCIATE' ? 'associates' : 'partners'} yet`}
              emptyDescription="Add a record to use it on student and enquiry workflows."
            />
          </ModulePageCard.Table>
          <Pagination
            page={pagination.page || 1}
            limit={pagination.limit || 25}
            total={pagination.total || 0}
            totalPages={pagination.totalPages || 0}
            onPageChange={(page) => setPagination((p) => ({ ...p, page }))}
            onPageSizeChange={(limit) => setPagination((p) => ({ ...p, limit, page: 1 }))}
          />
        </div>
      </ModulePageCard>

      <MasterFormShell
        open={drawer.open}
        onClose={closeDrawer}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        size="lg"
        variant="default"
        footer={
          readOnly ? (
            <Button variant="outline" size="sm" onClick={closeDrawer}>Close</Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={closeDrawer} disabled={saving}>Cancel</Button>
              <Button size="sm" type="submit" form="crm-partner-form" loading={saving}>
                {saveLabel}
              </Button>
            </>
          )
        }
      >
        <form id="crm-partner-form" className="crm-master-form" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
          <MasterFormSection title="General Information">
            <div className="crm-master-drawer-grid crm-master-drawer-grid--2col">
              <div className="crm-master-drawer-grid__full">
                <FormField label="Organization name" required>
                  <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} disabled={readOnly} />
                </FormField>
              </div>
              <Select
                label="Type"
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                options={TYPE_OPTIONS}
                disabled={readOnly || Boolean(defaultType)}
              />
              <FormField label="Commission %">
                <Input type="number" value={form.commission} onChange={(e) => setForm({ ...form, commission: e.target.value })} disabled={readOnly} />
              </FormField>
            </div>
          </MasterFormSection>

          <MasterFormSection title="Contact Information">
            <div className="crm-master-drawer-grid crm-master-drawer-grid--2col">
              <FormField label="Email">
                <Input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} disabled={readOnly} />
              </FormField>
              <FormField label="Mobile">
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} disabled={readOnly} />
              </FormField>
              <FormField label="Contact person">
                <Input value={form.contactPerson} onChange={(e) => setForm({ ...form, contactPerson: e.target.value })} disabled={readOnly} />
              </FormField>
              <FormField label="Nationality">
                <Input value={form.nationality} onChange={(e) => setForm({ ...form, nationality: e.target.value })} disabled={readOnly} />
              </FormField>
              <FormField label="Country">
                <Select
                  value={form.country}
                  onChange={(e) => setForm({ ...form, country: e.target.value })}
                  options={countryOptions.map((o) => ({
                    value: o.label || o.name || o.value,
                    label: o.label || o.name || o.value,
                  }))}
                  placeholder="Select country"
                  disabled={readOnly}
                  allowClear
                  showSearch
                />
              </FormField>
              <FormField label="Currency">
                <Select
                  value={form.currencyCode}
                  onChange={(e) => setForm({ ...form, currencyCode: e.target.value })}
                  options={currencyOptions.map((o) => ({
                    value: o.code || o.label,
                    label: (o.code ? `${o.code} — ` : '') + o.label,
                  }))}
                  placeholder="Select currency"
                  disabled={readOnly}
                  allowClear
                />
              </FormField>
              <div className="crm-master-drawer-grid__full">
                <FormField label="Website">
                  <Input value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} disabled={readOnly} />
                </FormField>
              </div>
            </div>
          </MasterFormSection>

          <MasterFormSection title="Agreement">
            <div className="crm-master-drawer-grid crm-master-drawer-grid--2col">
              <FormField label="Agreement date">
                <Input type="date" value={form.agreementDate} onChange={(e) => setForm({ ...form, agreementDate: e.target.value })} disabled={readOnly} />
              </FormField>
              <FormField label="Approval date">
                <Input type="date" value={form.approvalDate} onChange={(e) => setForm({ ...form, approvalDate: e.target.value })} disabled={readOnly} />
              </FormField>
              <div className="crm-master-drawer-grid__full">
                <FormField label="Agreement email">
                  <Input value={form.agreementEmail} onChange={(e) => setForm({ ...form, agreementEmail: e.target.value })} disabled={readOnly} />
                </FormField>
              </div>
            </div>
          </MasterFormSection>

          <MasterFormSection title="Assignment">
            <div className="crm-master-drawer-grid crm-master-drawer-grid--2col">
              <Select
                label="Branch"
                value={form.branchId}
                onChange={(e) => setForm({ ...form, branchId: e.target.value })}
                options={branchOptions}
                allowClear
                showSearch
                disabled={readOnly}
              />
              <Select
                label="Assigned staff"
                value={form.assignedToId}
                onChange={(e) => setForm({ ...form, assignedToId: e.target.value })}
                options={staffOptions}
                allowClear
                showSearch
                disabled={readOnly}
              />
            </div>
          </MasterFormSection>

          <MasterFormSection title="Commission Rules">
            <div className="flex items-center justify-between mb-2">
              {!readOnly && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setForm({
                    ...form,
                    commissionRules: [...(form.commissionRules || []), {
                      country: '', course: '', type: 'PERCENT', value: '', currency: '', effectiveFrom: '', isActive: true,
                    }],
                  })}
                >
                  Add rule
                </Button>
              )}
            </div>
            {(form.commissionRules || []).map((rule, index) => (
              <div key={index} className="crm-master-drawer-grid crm-master-drawer-grid--2col mb-2 p-2.5 rounded-md border border-border bg-row-hover/30">
                <Input placeholder="Country" value={rule.country || ''} onChange={(e) => {
                  const next = [...form.commissionRules];
                  next[index] = { ...next[index], country: e.target.value };
                  setForm({ ...form, commissionRules: next });
                }} disabled={readOnly} />
                <Input placeholder="Course / service" value={rule.course || ''} onChange={(e) => {
                  const next = [...form.commissionRules];
                  next[index] = { ...next[index], course: e.target.value };
                  setForm({ ...form, commissionRules: next });
                }} disabled={readOnly} />
                <Select
                  value={rule.type || 'PERCENT'}
                  onChange={(e) => {
                    const next = [...form.commissionRules];
                    next[index] = { ...next[index], type: e.target.value };
                    setForm({ ...form, commissionRules: next });
                  }}
                  options={[{ value: 'PERCENT', label: '%' }, { value: 'AMOUNT', label: 'Amount' }]}
                  disabled={readOnly}
                />
                <Input type="number" placeholder="Value" value={rule.value ?? ''} onChange={(e) => {
                  const next = [...form.commissionRules];
                  next[index] = { ...next[index], value: e.target.value };
                  setForm({ ...form, commissionRules: next });
                }} disabled={readOnly} />
                {!readOnly && (
                  <div className="crm-master-drawer-grid__full">
                    <Button size="sm" variant="ghost" onClick={() => {
                      setForm({ ...form, commissionRules: form.commissionRules.filter((_, i) => i !== index) });
                    }}>Remove rule</Button>
                  </div>
                )}
              </div>
            ))}
          </MasterFormSection>
        </form>
      </MasterFormShell>
    </>
  );
}
