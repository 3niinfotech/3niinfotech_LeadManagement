import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiUsers, FiPlus, FiEye, FiEdit2, FiToggleLeft, FiToggleRight, FiShield,
} from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FormField from '../../../components/ui/FormField';
import Drawer from '../../../components/ui/Drawer';
import DataGrid from '../../../components/table/DataGrid';
import { createActionsColumn } from '../../../components/table/grid.columns';
import RoleBadge from '../../../components/profile/RoleBadge';
import { ROUTES } from '../../../config/routes';
import { resolveMasterPage } from '../../../config/master-registry.config';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { useBranchOptions } from '../../enquiry/hooks/useBranchOptions';
import { staffApi, getUserApiError } from '../services/staffApi.service';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

const USER_STATUS_FORM = [
  { value: 'ACTIVE', label: 'Active' },
  { value: 'INACTIVE', label: 'Inactive' },
  { value: 'SUSPENDED', label: 'Suspended' },
];

function StatusPill({ status }) {
  const tone =
    status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700'
      : status === 'SUSPENDED' ? 'bg-amber-50 text-amber-700'
        : 'bg-slate-100 text-slate-600';
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold ${tone}`}>
      {status}
    </span>
  );
}

function emptyForm() {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    roleId: '',
    branchId: '',
    status: 'ACTIVE',
  };
}

function userToForm(row) {
  if (!row) return emptyForm();
  return {
    firstName: row.firstName || '',
    lastName: row.lastName || '',
    email: row.email || '',
    phone: row.phone || '',
    password: '',
    roleId: row.role?.id || row.roleId || '',
    branchId: row.branch?.id || row.branchId || '',
    status: row.status || 'ACTIVE',
  };
}

export default function MasterStaffPage() {
  const hubItem = resolveMasterPage('staff');
  const { can } = usePermissions();
  const canView = can(PERMISSIONS.USERS_VIEW);
  const canCreate = can(PERMISSIONS.USERS_CREATE);
  const canUpdate = can(PERMISSIONS.USERS_UPDATE);
  const canManageRoles = can(PERMISSIONS.ROLES_VIEW);

  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [branchFilter, setBranchFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawer, setDrawer] = useState({ open: false, mode: 'add', record: null });
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);

  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();

  const roleOptions = useMemo(
    () => roles.map((r) => ({ value: r.id, label: r.name, slug: r.slug, description: r.description })),
    [roles],
  );

  const roleFilterOptions = useMemo(
    () => [{ value: '', label: 'All roles' }, ...roles.map((r) => ({ value: r.slug, label: r.name }))],
    [roles],
  );

  const loadRoles = useCallback(async () => {
    try {
      const data = await staffApi.getRoles();
      setRoles(Array.isArray(data) ? data : []);
    } catch {
      setRoles([]);
    }
  }, []);

  const load = useCallback(async (silent = false) => {
    if (!canView) return;
    if (silent) setFetching(true);
    else setLoading(true);
    try {
      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (branchFilter) params.branchId = branchFilter;
      if (statusFilter !== 'all') params.status = statusFilter;
      const { data } = await staffApi.list(params);
      setRows(Array.isArray(data) ? data : []);
    } catch (err) {
      toastService.error(getUserApiError(err, 'Failed to load staff'));
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [canView, search, roleFilter, branchFilter, statusFilter]);

  useEffect(() => {
    loadRoles();
  }, [loadRoles]);

  useEffect(() => {
    load();
  }, [load]);

  const openDrawer = (mode, record = null) => {
    setForm(userToForm(record));
    setDrawer({ open: true, mode, record });
  };

  const closeDrawer = () => {
    setDrawer({ open: false, mode: 'add', record: null });
    setForm(emptyForm());
  };

  const setField = (name, value) => setForm((prev) => ({ ...prev, [name]: value }));

  const handleSubmit = async () => {
    if (!form.firstName.trim() || !form.email.trim() || !form.roleId || !form.branchId) {
      toastService.error('Name, email, role, and branch are required');
      return;
    }
    if (drawer.mode === 'add' && !form.password.trim()) {
      toastService.error('Password is required for new users');
      return;
    }
    if (form.password && form.password.length < 8) {
      toastService.error('Password must be at least 8 characters');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || null,
        roleId: form.roleId,
        branchId: form.branchId,
        status: form.status,
      };
      if (form.password.trim()) payload.password = form.password;

      if (drawer.mode === 'add') {
        await staffApi.create(payload);
        toastService.success('User created');
      } else {
        await staffApi.update(drawer.record.id, payload);
        toastService.success('User updated');
      }
      closeDrawer();
      load(true);
    } catch (err) {
      toastService.error(getUserApiError(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (row) => {
    if (!canUpdate) return;
    const next = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const ok = await alertService.confirm({
      title: next === 'ACTIVE' ? 'Activate user' : 'Deactivate user',
      text: `Set "${row.firstName} ${row.lastName || ''}" as ${next}?`,
      confirmText: next === 'ACTIVE' ? 'Activate' : 'Deactivate',
    });
    if (!ok) return;
    setActionId(row.id);
    try {
      await staffApi.updateStatus(row.id, next);
      toastService.success(`User ${next === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      load(true);
    } catch (err) {
      toastService.error(getUserApiError(err, 'Status update failed'));
    } finally {
      setActionId(null);
    }
  };

  const columns = useMemo(() => [
    {
      field: 'name',
      headerName: 'Name',
      flex: 1,
      minWidth: 160,
      valueGetter: (p) => `${p.data?.firstName || ''} ${p.data?.lastName || ''}`.trim(),
    },
    { field: 'email', headerName: 'Email', flex: 1, minWidth: 180 },
    {
      field: 'role.name',
      headerName: 'Role',
      width: 140,
      cellRenderer: (p) => (
        <RoleBadge slug={p.data?.role?.slug} name={p.data?.role?.name} size="sm" />
      ),
    },
    {
      field: 'branch.name',
      headerName: 'Branch',
      width: 130,
      valueGetter: (p) => p.data?.branch?.code || p.data?.branch?.name || '—',
    },
    { field: 'phone', headerName: 'Phone', width: 120 },
    {
      field: 'status',
      headerName: 'Status',
      width: 100,
      cellRenderer: (p) => <StatusPill status={p.value} />,
    },
    createActionsColumn({
      width: canUpdate ? 120 : 56,
      cellRenderer: (p) => {
        const row = p.data;
        if (!row) return null;
        const busy = actionId === row.id;
        return (
          <div className="crm-grid-actions" onClick={(e) => e.stopPropagation()}>
            <button type="button" className="crm-grid-action-btn" title="View" onClick={() => openDrawer('view', row)}>
              <FiEye className="w-3.5 h-3.5" />
            </button>
            {canUpdate && (
              <>
                <button type="button" className="crm-grid-action-btn crm-grid-action-btn--edit" title="Edit" disabled={busy} onClick={() => openDrawer('edit', row)}>
                  <FiEdit2 className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="crm-grid-action-btn" title="Toggle status" disabled={busy} onClick={() => handleStatusToggle(row)}>
                  {row.status === 'ACTIVE'
                    ? <FiToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                    : <FiToggleLeft className="w-3.5 h-3.5" />}
                </button>
              </>
            )}
          </div>
        );
      },
    }),
  ], [canUpdate, actionId]);

  const readOnly = drawer.mode === 'view';
  const selectedRole = roleOptions.find((r) => r.value === form.roleId);
  const drawerTitle = drawer.mode === 'add' ? 'Add team member' : drawer.mode === 'edit' ? 'Edit team member' : 'Team member details';

  if (!canView) {
    return (
      <ModulePageCard title="Staff & Users" icon={FiUsers}>
        <Card className="p-8 text-center text-text-muted">You do not have permission to view staff.</Card>
      </ModulePageCard>
    );
  }

  return (
    <>
      <ModulePageCard
        title={hubItem?.label || 'Staff & Users'}
        subtitle={hubItem?.description || 'Add counsellors, assign roles, and manage team access'}
        icon={FiUsers}
        breadcrumbs={[
          { label: 'Dashboard', path: ROUTES.DASHBOARD },
          { label: 'Master', path: ROUTES.MASTER },
          { label: hubItem?.label || 'Staff & Users' },
        ]}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            {canManageRoles && (
              <Link to={ROUTES.ROLES}>
                <Button size="sm" variant="outline" icon={FiShield}>Manage Roles</Button>
              </Link>
            )}
            {canCreate && (
              <Button size="sm" icon={FiPlus} onClick={() => openDrawer('add')}>Add User</Button>
            )}
          </div>
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <Card className="!p-3 mx-4 mt-4 mb-0 shrink-0">
            <div className="flex flex-wrap items-center gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name or email..."
                className="max-w-xs"
              />
              <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} options={roleFilterOptions} className="w-40" />
              <Select value={branchFilter} onChange={(e) => setBranchFilter(e.target.value)} options={[{ value: '', label: 'All branches' }, ...branchOptions]} className="w-44" disabled={branchesLoading} />
              <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} options={STATUS_OPTIONS} className="w-36" />
              <Button variant="outline" size="sm" onClick={() => load(true)} disabled={fetching}>Refresh</Button>
            </div>
            <p className="text-[11px] text-text-muted mt-2">
              Counsellors are users with the Counsellor role — they appear in Enquiry and Register dropdowns automatically.
            </p>
          </Card>

          <ModulePageCard.Table className="min-h-[320px]">
            <DataGrid
              columns={columns}
              rowData={rows}
              loading={loading}
              fetching={fetching}
              pagination={false}
              getRowId={(p) => p.data.id}
              emptyTitle="No team members yet"
              emptyDescription="Add staff with any role — Counsellor, Team Leader, Receptionist, etc."
              emptyActionLabel={canCreate ? 'Add User' : undefined}
              onEmptyAction={canCreate ? () => openDrawer('add') : undefined}
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
                {drawer.mode === 'add' ? 'Create user' : 'Save changes'}
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="First name" required>
              <Input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} disabled={readOnly} />
            </FormField>
            <FormField label="Last name">
              <Input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} disabled={readOnly} />
            </FormField>
          </div>
          <FormField label="Email" required>
            <Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} disabled={readOnly || drawer.mode === 'edit'} />
          </FormField>
          <FormField label="Phone">
            <Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} disabled={readOnly} />
          </FormField>
          <FormField label="Role" required>
            <Select
              value={form.roleId}
              onChange={(e) => setField('roleId', e.target.value)}
              options={roleOptions}
              placeholder="Select role"
              disabled={readOnly}
            />
          </FormField>
          {selectedRole?.description && (
            <p className="text-xs text-text-muted -mt-2 px-1">{selectedRole.description}</p>
          )}
          <FormField label="Branch" required>
            <Select
              value={form.branchId}
              onChange={(e) => setField('branchId', e.target.value)}
              options={branchOptions}
              placeholder={branchesLoading ? 'Loading...' : 'Select branch'}
              disabled={readOnly || branchesLoading}
            />
          </FormField>
          {!readOnly && (
            <FormField label={drawer.mode === 'add' ? 'Password' : 'New password (optional)'} required={drawer.mode === 'add'}>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setField('password', e.target.value)}
                placeholder={drawer.mode === 'add' ? 'Min 8 characters' : 'Leave blank to keep current'}
              />
            </FormField>
          )}
          <FormField label="Status">
            <Select
              value={form.status}
              onChange={(e) => setField('status', e.target.value)}
              options={USER_STATUS_FORM}
              disabled={readOnly}
            />
          </FormField>
          {canManageRoles && !readOnly && (
            <p className="text-xs text-text-muted border-t border-card-border pt-3">
              Need custom permissions?{' '}
              <Link to={ROUTES.ROLES} className="text-primary hover:underline" onClick={closeDrawer}>
                Manage Roles & Permissions
              </Link>
            </p>
          )}
        </div>
      </Drawer>
    </>
  );
}
