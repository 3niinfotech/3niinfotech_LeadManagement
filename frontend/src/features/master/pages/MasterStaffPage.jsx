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
import MasterListToolbar from '../components/MasterListToolbar';
import RoleBadge from '../../../components/profile/RoleBadge';
import { ROUTES } from '../../../config/routes';
import { getRoleMeta } from '../../../config/roles';
import { resolveMasterPage, buildMasterBreadcrumbs } from '../../../config/master-registry.config';
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

/** Portal logins are not staff — hide from Add team member */
const NON_STAFF_ROLE_SLUGS = new Set(['student_portal', 'partner']);

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
  const hubItem = resolveMasterPage('staff')?.hubItem;
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

  const staffRoles = useMemo(
    () => roles.filter((r) => !NON_STAFF_ROLE_SLUGS.has(r.slug)),
    [roles],
  );

  const roleOptions = useMemo(
    () => staffRoles.map((r) => {
      const meta = getRoleMeta(r.slug);
      return {
        value: r.id,
        label: r.name,
        slug: r.slug,
        description: r.description || meta.description || '',
      };
    }),
    [staffRoles],
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
        breadcrumbs={buildMasterBreadcrumbs(hubItem, hubItem?.label || 'Staff')}
        actions={(
          <div className="flex flex-wrap items-center gap-2">
            {canManageRoles && (
              <Link to={ROUTES.ADVANCED_ACCESS}>
                <Button size="sm" variant="outline" icon={FiShield}>Roles & Access</Button>
              </Link>
            )}
            {canCreate && (
              <Button size="sm" icon={FiPlus} onClick={() => openDrawer('add')}>Add team member</Button>
            )}
          </div>
        )}
      >
        <div className="flex flex-col flex-1 min-h-0">
          <MasterListToolbar
            search={search}
            onSearchChange={setSearch}
            searchPlaceholder="Search name or email…"
            searchAriaLabel="Search staff"
            showStatus={false}
            filters={[
              {
                key: 'role',
                value: roleFilter,
                onChange: setRoleFilter,
                options: roleFilterOptions,
                widthClass: 'w-[150px]',
                ariaLabel: 'Filter by role',
              },
              {
                key: 'branch',
                value: branchFilter,
                onChange: setBranchFilter,
                options: [{ value: '', label: 'All branches' }, ...branchOptions],
                widthClass: 'w-[170px]',
                disabled: branchesLoading,
                ariaLabel: 'Filter by branch',
              },
              {
                key: 'status',
                value: statusFilter,
                onChange: setStatusFilter,
                options: STATUS_OPTIONS,
                widthClass: 'w-[140px]',
                ariaLabel: 'Filter by status',
              },
            ]}
            onRefresh={() => load(true)}
            refreshing={fetching}
            hint="Add a person here and pick their role (Counsellor, Receptionist, Teacher…). Change what that role can do in Roles & Access."
          />

          <ModulePageCard.Table className="min-h-[320px]">
            <DataGrid
              columns={columns}
              rowData={rows}
              loading={loading}
              fetching={fetching}
              pagination={false}
              getRowId={(p) => p.data.id}
              emptyTitle="No team members yet"
              emptyDescription="Add staff and assign a role — Counsellor, Team Leader, Receptionist, Teacher."
              emptyActionLabel={canCreate ? 'Add team member' : undefined}
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
                {drawer.mode === 'add' ? 'Create team member' : 'Save changes'}
              </Button>
            </div>
          )
        }
      >
        <div className="space-y-4">
          <p className="text-xs text-text-muted leading-relaxed rounded-lg bg-surface px-3 py-2">
            Assign an existing role here. Example: pick <strong>Counsellor</strong> — they show in Reception assign list. To change menus and buttons for a role, use Roles & Access.
          </p>
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
          <FormField label="Role" required hint="This is the job they do — Counsellor, Receptionist, Teacher, etc.">
            <Select
              value={form.roleId}
              onChange={(e) => setField('roleId', e.target.value)}
              options={roleOptions}
              placeholder="Select role — Counsellor, Receptionist…"
              disabled={readOnly}
              optionRender={(option) => (
                <div className="py-0.5">
                  <div className="text-sm font-medium">{option.data?.label}</div>
                  {option.data?.description ? (
                    <div className="text-[11px] text-text-muted leading-snug">{option.data.description}</div>
                  ) : null}
                </div>
              )}
            />
          </FormField>
          {selectedRole?.description && (
            <div className="rounded-lg border border-border bg-card-bg px-3 py-2 -mt-1">
              <p className="text-xs font-semibold text-text">{selectedRole.label}</p>
              <p className="text-[11px] text-text-muted mt-0.5">{selectedRole.description}</p>
            </div>
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
              Role access (menus / buttons) is not set per person.{' '}
              <Link to={ROUTES.ADVANCED_ACCESS} className="text-primary hover:underline" onClick={closeDrawer}>
                Open Roles & Access
              </Link>
            </p>
          )}
        </div>
      </Drawer>
    </>
  );
}
