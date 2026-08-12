import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiMapPin, FiEye, FiEdit2, FiPlus, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FormField from '../../../components/ui/FormField';
import Drawer from '../../../components/ui/Drawer';
import DataGrid from '../../../components/table/DataGrid';
import { createActionsColumn } from '../../../components/table/grid.columns';
import { ROUTES } from '../../../config/routes';
import { resolveMasterPage } from '../../../config/master-registry.config';
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
  const hubItem = resolveMasterPage('branch');
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

  const { options: countryOptions, loading: countriesLoading } = useRelationalMasterOptions('countries');

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

  const columns = useMemo(() => [
    { field: 'code', headerName: 'Code', width: 90 },
    { field: 'name', headerName: 'Branch name', flex: 1, minWidth: 180 },
    { field: 'city', headerName: 'City', width: 120 },
    { field: 'state', headerName: 'State', width: 120 },
    {
      field: 'country.name',
      headerName: 'Country',
      width: 110,
      valueGetter: (p) => p.data?.country?.name || '—',
    },
    { field: 'phone', headerName: 'Phone', width: 130 },
    {
      field: 'isActive',
      headerName: 'Status',
      width: 100,
      cellRenderer: (p) => <StatusPill active={Boolean(p.value)} />,
    },
    createActionsColumn({
      width: canManage ? 120 : 56,
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
              </>
            )}
          </div>
        );
      },
    }),
  ], [canManage, actionId]);

  const readOnly = drawer.mode === 'view';
  const drawerTitle =
    drawer.mode === 'add' ? 'Add branch' : drawer.mode === 'edit' ? 'Edit branch' : 'Branch details';

  return (
    <>
      <ModulePageCard
        title={hubItem?.label || 'Branch'}
        subtitle={hubItem?.description}
        icon={FiMapPin}
        breadcrumbs={[
          { label: 'Dashboard', path: ROUTES.DASHBOARD },
          { label: 'Master', path: ROUTES.MASTER },
          { label: hubItem?.label || 'Branch' },
        ]}
        actions={
          canManage ? (
            <Button size="sm" icon={FiPlus} onClick={() => openDrawer('add')}>
              Add branch
            </Button>
          ) : null
        }
      >
        <div className="flex flex-col flex-1 min-h-0">
          <Card className="!p-3 mx-4 mt-4 mb-0 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, code, city..."
                className="max-w-xs"
              />
              <Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                options={[
                  { value: 'all', label: 'All statuses' },
                  { value: 'active', label: 'Active only' },
                  { value: 'inactive', label: 'Inactive only' },
                ]}
                className="w-40"
              />
              <Button variant="outline" size="sm" onClick={() => load(true)} disabled={fetching}>
                Refresh
              </Button>
            </div>
          </Card>

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

      <Drawer
        open={drawer.open}
        onClose={closeDrawer}
        title={drawerTitle}
        size="md"
        footer={
          readOnly ? (
            <div className="flex justify-end">
              <Button variant="ghost" onClick={closeDrawer}>Close</Button>
            </div>
          ) : (
            <div className="flex justify-end gap-2">
              <Button variant="ghost" onClick={closeDrawer} disabled={saving}>Cancel</Button>
              <Button onClick={handleSubmit} loading={saving}>
                {drawer.mode === 'add' ? 'Create branch' : 'Save changes'}
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4">
          <FormField label="Branch name" required>
            <Input
              value={form.name}
              onChange={(e) => setField('name', e.target.value)}
              disabled={readOnly}
            />
          </FormField>
          <FormField label="Code" required>
            <Input
              value={form.code}
              onChange={(e) => setField('code', e.target.value.toUpperCase())}
              disabled={readOnly || drawer.mode === 'edit'}
              placeholder="e.g. HQ, MUM"
            />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Email">
              <Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} disabled={readOnly} />
            </FormField>
            <FormField label="Phone">
              <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} disabled={readOnly} />
            </FormField>
          </div>
          <FormField label="Address line 1">
            <Input value={form.addressLine1} onChange={(e) => setField('addressLine1', e.target.value)} disabled={readOnly} />
          </FormField>
          <FormField label="Address line 2">
            <Input value={form.addressLine2} onChange={(e) => setField('addressLine2', e.target.value)} disabled={readOnly} />
          </FormField>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                placeholder={countriesLoading ? 'Loading...' : 'Select country'}
                allowClear
                disabled={readOnly || countriesLoading}
              />
            </FormField>
          </div>
          {!readOnly && (
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
          )}
        </div>
      </Drawer>
    </>
  );
}
