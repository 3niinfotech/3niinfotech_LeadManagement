import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiCopy, FiDownload, FiEdit2, FiFilter, FiPlus, FiRefreshCw, FiSearch,
  FiShield, FiTrash2, FiUsers,
} from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import ModulePageHeader from '../../../components/layout/ModulePageHeader';
import Card from '../../../components/ui/Card';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Button from '../../../components/ui/Button';
import TableLoader from '../../../components/ui/TableLoader';
import Skeleton from '../../../components/ui/Skeleton';
import PermissionMatrix, { DATA_SCOPES } from '../components/PermissionMatrix';
import { rbacService } from '../../../services/rbac/rbac.service';
import { userService } from '../../../services/user/user.service';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import PermissionGate from '../../../components/common/PermissionGate';

const STATUS_OPTIONS = [
  { value: '', label: 'All statuses' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

const TYPE_OPTIONS = [
  { value: '', label: 'All types' },
  { value: 'true', label: 'System roles' },
  { value: 'false', label: 'Custom roles' },
];

const emptyForm = {
  name: '',
  description: '',
  dataScope: 'OWN',
  permissionKeys: [],
  isActive: true,
};

export default function RolesPage() {
  const { can } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [permissionGroups, setPermissionGroups] = useState({});
  const [selectedRole, setSelectedRole] = useState(null);
  const [filters, setFilters] = useState({ search: '', isActive: '', isSystem: '' });
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [users, setUsers] = useState([]);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [copyFromId, setCopyFromId] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rbacService.getRoles({
          limit: 100,
          search: filters.search || undefined,
          isActive: filters.isActive || undefined,
          isSystem: filters.isSystem || undefined,
        }),
        rbacService.getPermissions(),
      ]);
      const list = rolesRes.data || [];
      setRoles(list);
      setPermissionGroups(permsRes.groups || {});
      setSelectedRole((prev) => {
        if (!prev) return list[0] || null;
        return list.find((r) => r.id === prev.id) || list[0] || null;
      });
    } catch (e) {
      toastService.error(e?.response?.data?.message || e?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (can(PERMISSIONS.ROLES_VIEW)) load();
  }, [can, load]);

  const openCreate = () => {
    setFormMode('create');
    setForm(emptyForm);
    setFormOpen(true);
  };

  const openEdit = (role) => {
    setFormMode('edit');
    setForm({
      name: role.name,
      description: role.description || '',
      dataScope: role.dataScope,
      permissionKeys: role.permissions || [],
      isActive: role.isActive,
    });
    setSelectedRole(role);
    setFormOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toastService.error('Role name is required');
      return;
    }
    setSaving(true);
    try {
      if (formMode === 'create') {
        const created = await rbacService.createRole(form);
        toastService.success('Role created');
        setSelectedRole(created);
      } else if (selectedRole) {
        const updated = await rbacService.updateRole(selectedRole.id, form);
        toastService.success('Role updated');
        setSelectedRole(updated);
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toastService.error(err.response?.data?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role) => {
    const ok = await alertService.deleteConfirm({
      title: 'Delete Role',
      text: 'This role will be soft-deleted and deactivated.',
      confirmText: 'Delete Role',
      itemName: role.name,
    });
    if (!ok) return;
    try {
      await rbacService.deleteRole(role.id);
      toastService.success('Role deleted');
      setSelectedRole(null);
      await load();
    } catch (err) {
      toastService.error(err.response?.data?.message || 'Cannot delete role');
    }
  };

  const handleClone = async (role) => {
    try {
      const cloned = await rbacService.cloneRole(role.id, { name: `${role.name} (Copy)` });
      toastService.success('Role cloned');
      setSelectedRole(cloned);
      await load();
    } catch (err) {
      toastService.error(err.response?.data?.message || 'Clone failed');
    }
  };

  const handleToggle = async (role) => {
    try {
      await rbacService.toggleStatus(role.id, !role.isActive);
      toastService.success(role.isActive ? 'Role deactivated' : 'Role activated');
      await load();
    } catch (err) {
      toastService.error('Status update failed');
    }
  };

  const handleExport = async () => {
    try {
      const data = await rbacService.exportRoles({ search: filters.search || undefined });
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `roles-export-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      toastService.error('Export failed');
    }
  };

  const openAssign = async (role) => {
    setSelectedRole(role);
    const res = await userService.getAll({ limit: 200 });
    setUsers(res.data || []);
    setSelectedUserIds([]);
    setAssignOpen(true);
  };

  const handleAssign = async () => {
    if (!selectedRole || !selectedUserIds.length) return;
    try {
      await rbacService.assignUsers(selectedRole.id, selectedUserIds);
      toastService.success('Users assigned');
      setAssignOpen(false);
      await load();
    } catch (err) {
      toastService.error(err.response?.data?.message || 'Assign failed');
    }
  };

  const handleCopyPermissions = async () => {
    if (!selectedRole || !copyFromId) return;
    try {
      const updated = await rbacService.copyPermissions(selectedRole.id, copyFromId);
      setSelectedRole(updated);
      toastService.success('Permissions copied');
      await load();
    } catch (err) {
      toastService.error(err.response?.data?.message || 'Copy failed');
    }
  };

  const scopeLabel = useMemo(
    () => Object.fromEntries(DATA_SCOPES.map((s) => [s.value, s.label])),
    [],
  );

  if (!can(PERMISSIONS.ROLES_VIEW)) {
    return (
      <PageShell>
        <Card className="text-center !p-12">
          <p className="text-text-muted">You do not have permission to manage roles.</p>
        </Card>
      </PageShell>
    );
  }

  if (loading && !roles.length) {
    return (
      <PageShell>
        <ModulePageHeader
          title="Role Management"
          subtitle="Dynamic RBAC — create, clone, and assign permissions without hardcoded roles"
          icon={FiShield}
          breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Roles' }]}
        />
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
          <Card className="xl:col-span-1 !p-0 overflow-hidden min-h-[420px]">
            <TableLoader rows={8} columns={2} showCheckbox={false} showPagination={false} />
          </Card>
          <Card className="xl:col-span-2 !p-6 space-y-4">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-3 w-72" />
            <Skeleton className="h-40 w-full" rounded="lg" />
          </Card>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        title="Role Management"
        subtitle="Dynamic RBAC — create, clone, and assign permissions without hardcoded roles"
        icon={FiShield}
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Roles' }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <PermissionGate permission={PERMISSIONS.ROLES_EXPORT}>
              <Button variant="secondary" size="sm" icon={FiDownload} onClick={handleExport}>Export</Button>
            </PermissionGate>
            <PermissionGate permission={PERMISSIONS.ROLES_CREATE}>
              <Button size="sm" icon={FiPlus} onClick={openCreate}>Create Role</Button>
            </PermissionGate>
          </div>
        }
      />

      <Card className="!p-3 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search roles..."
              value={filters.search}
              onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
              icon={FiSearch}
            />
          </div>
          <Select
            className="w-40"
            value={filters.isActive}
            onChange={(v) => setFilters((f) => ({ ...f, isActive: v }))}
            options={STATUS_OPTIONS}
          />
          <Select
            className="w-40"
            value={filters.isSystem}
            onChange={(v) => setFilters((f) => ({ ...f, isSystem: v }))}
            options={TYPE_OPTIONS}
          />
          <Button variant="secondary" size="sm" icon={FiRefreshCw} onClick={load}>Refresh</Button>
        </div>
      </Card>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        <Card className="xl:col-span-1 !p-0 overflow-hidden">
          <div className="px-4 py-3 border-b border-border font-medium text-sm text-text-secondary flex items-center gap-2">
            <FiFilter size={14} /> Roles ({roles.length})
          </div>
          <div className="max-h-[560px] overflow-y-auto divide-y divide-border">
            {roles.map((role) => (
              <button
                key={role.id}
                type="button"
                onClick={() => setSelectedRole(role)}
                className={`w-full text-left px-4 py-3 hover:bg-row-hover transition-colors ${
                  selectedRole?.id === role.id ? 'bg-brand-soft/50' : ''
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium text-text-primary">{role.name}</span>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded ${role.isActive ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'}`}>
                    {role.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <p className="text-xs text-text-muted mt-0.5">{role.slug} · {scopeLabel[role.dataScope]}</p>
                <p className="text-xs text-text-muted">{role.userCount} users · {role.permissions?.length || 0} permissions</p>
              </button>
            ))}
          </div>
        </Card>

        <Card className="xl:col-span-2 !p-4">
          {!selectedRole ? (
            <p className="text-text-muted text-center py-12">Select a role to view details</p>
          ) : (
            <>
              <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-text-primary">{selectedRole.name}</h2>
                  <p className="text-sm text-text-muted">{selectedRole.description || 'No description'}</p>
                  <div className="flex flex-wrap gap-2 mt-2 text-xs">
                    <span className="px-2 py-0.5 rounded bg-row-hover">{scopeLabel[selectedRole.dataScope]}</span>
                    <span className="px-2 py-0.5 rounded bg-row-hover">Level {selectedRole.hierarchyLevel}</span>
                    {selectedRole.isSystem && <span className="px-2 py-0.5 rounded bg-info-soft text-info">System</span>}
                    {selectedRole.isCustom && <span className="px-2 py-0.5 rounded bg-warning-soft text-warning">Custom</span>}
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PermissionGate permission={PERMISSIONS.ROLES_UPDATE}>
                    <Button size="sm" variant="secondary" icon={FiEdit2} onClick={() => openEdit(selectedRole)}>Edit</Button>
                  </PermissionGate>
                  <PermissionGate permission={PERMISSIONS.ROLES_CLONE}>
                    <Button size="sm" variant="secondary" icon={FiCopy} onClick={() => handleClone(selectedRole)}>Clone</Button>
                  </PermissionGate>
                  <PermissionGate permission={PERMISSIONS.ROLES_ASSIGN}>
                    <Button size="sm" variant="secondary" icon={FiUsers} onClick={() => openAssign(selectedRole)}>Assign Users</Button>
                  </PermissionGate>
                  <PermissionGate permission={PERMISSIONS.ROLES_UPDATE}>
                    <Button size="sm" variant="secondary" onClick={() => handleToggle(selectedRole)}>
                      {selectedRole.isActive ? 'Deactivate' : 'Activate'}
                    </Button>
                  </PermissionGate>
                  <PermissionGate permission={PERMISSIONS.ROLES_DELETE}>
                    {!selectedRole.isSystem && (
                      <Button size="sm" variant="danger" icon={FiTrash2} onClick={() => handleDelete(selectedRole)}>Delete</Button>
                    )}
                  </PermissionGate>
                </div>
              </div>

              <PermissionGate permission={PERMISSIONS.ROLES_UPDATE}>
                <div className="flex flex-wrap gap-2 items-end mb-4 p-3 rounded-lg bg-row-hover/50">
                  <div className="flex-1 min-w-[200px]">
                    <label className="text-xs text-text-muted block mb-1">Copy permissions from</label>
                    <Select
                      value={copyFromId}
                      onChange={setCopyFromId}
                      options={[
                        { value: '', label: 'Select source role...' },
                        ...roles.filter((r) => r.id !== selectedRole.id).map((r) => ({ value: r.id, label: r.name })),
                      ]}
                    />
                  </div>
                  <Button size="sm" disabled={!copyFromId} onClick={handleCopyPermissions}>Copy Permissions</Button>
                </div>
              </PermissionGate>

              <h3 className="text-sm font-medium text-text-secondary mb-2">Permissions ({selectedRole.permissions?.length || 0})</h3>
              <PermissionMatrix
                groups={permissionGroups}
                selected={selectedRole.permissions || []}
                readOnly
              />
            </>
          )}
        </Card>
      </div>

      {formOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto !p-5">
            <h3 className="text-lg font-semibold mb-4">{formMode === 'create' ? 'Create Role' : 'Edit Role'}</h3>
            <div className="space-y-3 mb-4">
              <Input label="Role Name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} />
              <Input label="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
              <Select
                label="Data Scope"
                value={form.dataScope}
                onChange={(v) => setForm((f) => ({ ...f, dataScope: v }))}
                options={DATA_SCOPES.map((s) => ({ value: s.value, label: s.label }))}
              />
            </div>
            <h4 className="text-sm font-medium mb-2">Permissions</h4>
            <PermissionMatrix
              groups={permissionGroups}
              selected={form.permissionKeys}
              onChange={(keys) => setForm((f) => ({ ...f, permissionKeys: keys }))}
            />
            <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => setFormOpen(false)}>Cancel</Button>
              <Button loading={saving} onClick={handleSave}>Save Role</Button>
            </div>
          </Card>
        </div>
      )}

      {assignOpen && selectedRole && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40">
          <Card className="w-full max-w-md !p-5">
            <h3 className="text-lg font-semibold mb-2">Assign Users to {selectedRole.name}</h3>
            <div className="max-h-64 overflow-y-auto space-y-1 mb-4">
              {users.map((u) => (
                <label key={u.id} className="flex items-center gap-2 p-2 rounded hover:bg-row-hover text-sm">
                  <input
                    type="checkbox"
                    checked={selectedUserIds.includes(u.id)}
                    onChange={(e) => {
                      setSelectedUserIds((ids) =>
                        e.target.checked ? [...ids, u.id] : ids.filter((id) => id !== u.id),
                      );
                    }}
                  />
                  <span>{u.firstName} {u.lastName}</span>
                  <span className="text-text-muted text-xs ml-auto">{u.email}</span>
                </label>
              ))}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="secondary" onClick={() => setAssignOpen(false)}>Cancel</Button>
              <Button onClick={handleAssign} disabled={!selectedUserIds.length}>Assign</Button>
            </div>
          </Card>
        </div>
      )}
    </PageShell>
  );
}
