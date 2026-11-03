import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiMapPin, FiEye, FiEdit2, FiPlus, FiToggleLeft, FiToggleRight, FiTrash2 } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FormField from '../../../components/ui/FormField';
import MasterFormShell from '../components/MasterFormShell';
import MasterFormSection from '../components/MasterFormSection';
import { masterFormSubtitle, masterSubmitLabel } from '../utils/masterFormLayout.util';
import '../styles/master-form.theme.css';
import DataGrid from '../../../components/table/DataGrid';
import { createActionsColumn } from '../../../components/table/grid.columns';
import { createCountryColumn } from '../../../components/table/countryColumn';
import MasterListToolbar from '../components/MasterListToolbar';
import { ROUTES } from '../../../config/routes';
import { resolveMasterPage, buildMasterBreadcrumbs } from '../../../config/master-registry.config';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { useRelationalMasterOptions } from '../hooks/useRelationalMasterOptions';
import { organizationApi, getOrgApiErrorMessage } from '../services/organizationApi.service';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';

function StatusPill({ active }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${
        active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-600'
      }`}
    >
      {active ? 'Active' : 'Inactive'}
    </span>
  );
}

function emptyBranchForm() {
  return {
    name: '',
    code: '',
    email: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    postalCode: '',
    countryId: '',
    isActive: true,
  };
}

function branchToForm(row) {
  if (!row) return emptyBranchForm();
  return {
    name: row.name || '',
    code: row.code || '',
    email: row.email || '',
    phone: row.phone || '',
    addressLine1: row.addressLine1 || '',
    addressLine2: row.addressLine2 || '',
    city: row.city || '',
    state: row.state || '',
    postalCode: row.postalCode || '',
    countryId: row.country?.id || row.countryId || '',
    isActive: row.isActive ?? true,
  };
}

export default function OrganizationBranchPage() {
  const hubItem = resolveMasterPage('branch')?.hubItem;
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.SETTINGS_UPDATE) || can(PERMISSIONS.MASTERS_MANAGE);

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawer, setDrawer] = useState({ open: false, mode: 'add', record: null });
  const [form, setForm] = useState(emptyBranchForm());
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const { options: countryOptions, loading: countriesLoading } = useRelationalMasterOptions('country');

  const load = useCallback(async (silent = false) => {
    if (silent) setFetching(true);
    else setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (statusFilter === 'active') params.status = 'active';
      if (statusFilter === 'inactive') params.status = 'inactive';
      const data = await organizationApi.listBranches(params);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toastService.error(getOrgApiErrorMessage(err, 'Failed to load branches'));
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [search, statusFilter]);

  useEffect(() => {
    load();
  }, [load]);

  const openDrawer = (mode, record = null) => {
    setForm(branchToForm(record));
    setDrawer({ open: true, mode, record });
  };

  const closeDrawer = () => {
    setDrawer({ open: false, mode: 'add', record: null });
    setForm(emptyBranchForm());
  };

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    if (!form.name.trim() || !form.code.trim()) {
      toastService.error('Name and code are required');
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        code: form.code.trim().toUpperCase(),
        countryId: form.countryId || null,
        email: form.email || null,
      };
      if (drawer.mode === 'add') {
        await organizationApi.createBranch(payload);
        toastService.success('Branch created');
      } else if (drawer.mode === 'edit') {
        await organizationApi.updateBranch(drawer.record.id, payload);
        toastService.success('Branch updated');
      }
      closeDrawer();
      load(true);
    } catch (err) {
      toastService.error(getOrgApiErrorMessage(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (row) => {
    if (!canManage) return;
    const next = !row.isActive;
    const ok = await alertService.confirm({
      title: next ? 'Activate branch' : 'Deactivate branch',
      text: `Mark "${row.name}" as ${next ? 'active' : 'inactive'}?`,
      confirmText: next ? 'Activate' : 'Deactivate',
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      await organizationApi.updateBranchStatus(row.id, next);
      toastService.success(`Branch ${next ? 'activated' : 'deactivated'}`);
      load(true);
    } catch (err) {
      toastService.error(getOrgApiErrorMessage(err, 'Status update failed'));
    } finally {
      setActionId(null);
    }
  };

  const handleDelete = async (row) => {
    if (!canManage) return;
    const ok = await alertService.softDeleteConfirm({
      title: 'Delete branch',
      text: 'This branch will be soft-deleted only if no enquiries, students, or staff are linked.',
      itemName: row.name,
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      await organizationApi.removeBranch(row.id);
      toastService.success('Branch deleted');
      load(true);
    } catch (err) {
      toastService.error(getOrgApiErrorMessage(err, 'Delete failed'));
    } finally {
      setActionId(null);
    }
  };

  const columns = useMemo(() => [
    { field: 'code', headerName: 'Code', width: 90 },
    { field: 'name', headerName: 'Branch name', flex: 1, minWidth: 180 },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'state', headerName: 'State', width: 120 },
    createCountryColumn({
      field: 'country',
      headerName: 'Country',
      width: 140,
      valueGetter: (row) => row?.country?.name || row?.country || '',
    }),
    { field: 'phone', headerName: 'Phone', width: 130 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      cellRenderer: (p) => <StatusPill active={Boolean(p.value)} />,
    },
    createActionsColumn({
      width: canManage ? 148 : 56,
      cellRenderer: (p) => {
        const row = p.data;
        if (!row) return null;
        const busy = actionId === row.id;
        return (
          <div className="crm-grid-actions" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="crm-grid-action-btn"
              title="View"
              aria-label="View"
              onClick={() => openDrawer('view', row)}
            >
              <FiEye className="w-3.5 h-3.5" />
            </button>
            {canManage && (
              <>
                <button
                  type="button"
                  className="crm-grid-action-btn crm-grid-action-btn--edit"
                  title="Edit"
                  aria-label="Edit"
                  disabled={busy}
                  onClick={() => openDrawer('edit', row)}
                >
                  <FiEdit2 className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  className="crm-grid-action-btn"
                  title={row.isActive ? 'Deactivate' : 'Activate'}
                  aria-label="Toggle status"
                  disabled={busy}
                  onClick={() => handleStatusToggle(row)}
                >
                  {row.isActive
                    ? <FiToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                    : <FiToggleLeft className="w-3.5 h-3.5" />}
                </button>
                <button
                  type="button"
                  className="crm-grid-action-btn crm-grid-action-btn--delete"
                  title="Delete"
                  aria-label="Delete"
                  disabled={busy}
                  onClick={() => handleDelete(row)}
                >
                  <FiTrash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        );
      },
    }),
  ], [canManage, actionId]);

  const readOnly = drawer.mode === 'view';
  const drawerTitle =
    drawer.mode === 'add' ? 'Add Branch' : drawer.mode === 'edit' ? 'Edit Branch' : 'Branch details';
  const drawerSubtitle = drawer.mode === 'view'
    ? 'Read-only details'
    : masterFormSubtitle(drawer.mode, 'Branch');
  const saveLabel = masterSubmitLabel(drawer.mode, 'Branch', saving);

  return (
    <>
      <ModulePageCard
        title={hubItem?.label || 'Branch'}
        subtitle={hubItem?.description}
        icon={FiMapPin}
        breadcrumbs={buildMasterBreadcrumbs(hubItem, hubItem?.label || 'Branch')}
        actions={
          canManage ? (
            <Button size="sm" icon={FiPlus} onClick={() => openDrawer('add')}>
              Add branch
            </Button>
          ) : null
        }
      >
        <div className="flex flex-col flex-1 min-h-0">
          <MasterListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search by name, code, city…"
            searchAriaLabel="Search branches"
            status={statusFilter}
            onStatusChange={setStatusFilter}
            onRefresh={() => load(true)}
            refreshing={fetching}
          />

          <ModulePageCard.Table className="min-h-[320px]">
            <DataGrid
              columns={columns}
              rowData={rows}
              loading={loading}
              fetching={fetching}
              pagination={false}
              getRowId={(p) => p.data.id}
              emptyTitle={search || statusFilter !== 'all' ? 'No matching branches' : 'No branches yet'}
              emptyDescription={
                search || statusFilter !== 'all'
                  ? 'Try adjusting search or filters.'
                  : 'Add your first branch office location.'
              }
              emptyActionLabel={canManage && !search && statusFilter === 'all' ? 'Add branch' : undefined}
              onEmptyAction={canManage ? () => openDrawer('add') : undefined}
            />
          </ModulePageCard.Table>
        </div>
      </ModulePageCard>

      <MasterFormShell
        open={drawer.open}
        onClose={closeDrawer}
        title={drawerTitle}
        subtitle={drawerSubtitle}
        size="md"
        variant="default"
        footer={
          readOnly ? (
            <Button variant="outline" size="sm" onClick={closeDrawer}>Close</Button>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={closeDrawer} disabled={saving}>Cancel</Button>
              <Button size="sm" type="submit" form="crm-org-branch-form" loading={saving}>
                {saveLabel}
              </Button>
            </>
          )
        }
      >
        <form id="crm-org-branch-form" className="crm-master-form" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
          <MasterFormSection title="General Information">
            <div className="crm-master-drawer-grid crm-master-drawer-grid--2col">
              <div className="crm-master-drawer-grid__full">
                <FormField label="Branch name" required>
                  <Input value={form.name} onChange={(e) => setField('name', e.target.value)} disabled={readOnly} />
                </FormField>
              </div>
              <FormField label="Code" required>
                <Input
                  value={form.code}
                  onChange={(e) => setField('code', e.target.value.toUpperCase())}
                  disabled={readOnly || drawer.mode === 'edit'}
                  placeholder="e.g. HQ, MUM"
                />
              </FormField>
              {!readOnly ? (
                <FormField label="Status">
                  <Select
                    value={form.isActive ? 'active' : 'inactive'}
                    onChange={(e) => setField('isActive', e.target.value === 'active')}
                    options={[
                      { value: 'active', label: 'Active' },
                      { value: 'inactive', label: 'Inactive' },
                    ]}
                  />
                </FormField>
              ) : <span />}
            </div>
          </MasterFormSection>

          <MasterFormSection title="Contact Information">
            <div className="crm-master-drawer-grid crm-master-drawer-grid--2col">
              <FormField label="Email">
                <Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} disabled={readOnly} />
              </FormField>
              <FormField label="Phone">
                <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} disabled={readOnly} />
              </FormField>
            </div>
          </MasterFormSection>

          <MasterFormSection title="Address">
            <div className="crm-master-drawer-grid crm-master-drawer-grid--2col">
              <div className="crm-master-drawer-grid__full">
                <FormField label="Address line 1">
                  <Input value={form.addressLine1} onChange={(e) => setField('addressLine1', e.target.value)} disabled={readOnly} />
                </FormField>
              </div>
              <div className="crm-master-drawer-grid__full">
                <FormField label="Address line 2">
                  <Input value={form.addressLine2} onChange={(e) => setField('addressLine2', e.target.value)} disabled={readOnly} />
                </FormField>
              </div>
              <FormField label="City">
                <Input value={form.city} onChange={(e) => setField('city', e.target.value)} disabled={readOnly} />
              </FormField>
              <FormField label="State">
                <Input value={form.state} onChange={(e) => setField('state', e.target.value)} disabled={readOnly} />
              </FormField>
              <FormField label="Postal code">
                <Input value={form.postalCode} onChange={(e) => setField('postalCode', e.target.value)} disabled={readOnly} />
              </FormField>
              <FormField label="Country">
                <Select
                  value={form.countryId}
                  onChange={(e) => setField('countryId', e.target.value)}
                  options={countryOptions}
                  placeholder={countriesLoading ? 'Loading…' : 'Select country'}
                  allowClear
                  showSearch
                  disabled={readOnly || countriesLoading}
                  notFoundContent={countriesLoading ? 'Loading…' : 'No results found'}
                />
              </FormField>
            </div>
          </MasterFormSection>
        </form>
      </MasterFormShell>
    </>
  );
}
