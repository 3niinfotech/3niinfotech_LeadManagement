import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  FiAward, FiBook, FiClock, FiCopy, FiDollarSign, FiEdit2, FiFileText,
  FiGlobe, FiGrid, FiHome, FiPlus, FiRefreshCw, FiSearch, FiShield,
  FiTrash2, FiUser, FiUsers, FiCheck,
} from 'react-icons/fi';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import SearchInput from '../../../components/ui/SearchInput';
import Drawer from '../../../components/ui/Drawer';
import FormField from '../../../components/ui/FormField';
import Avatar from '../../../components/ui/Avatar';
import TableLoader from '../../../components/ui/TableLoader';
import PermissionGate from '../../../components/common/PermissionGate';
import PermissionGridMatrix from '../../rbac/components/PermissionGridMatrix';
import RolePermissionSummary from '../../rbac/components/RolePermissionSummary';
import RoleActivityTimeline from '../../rbac/components/RoleActivityTimeline';
import { DATA_SCOPES } from '../../rbac/components/PermissionMatrix';
import { computePermissionStats } from '../../rbac/utils/permissionGrid.util';
import { rbacService } from '../../../services/rbac/rbac.service';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import { getRoleMeta } from '../../../config/roles';
import {
  FORCE_DENY_PREFIXES_BY_ROLE,
  isPermissionDeniedForRole,
} from '../../../config/access-policy.js';
import { DATA_SCOPE_PLAIN } from '../../rbac/config/permissionLabels';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { useDispatch } from 'react-redux';
import { fetchProfile } from '../../../redux/slices/authSlice';

const DETAIL_TABS = [
  { id: 'permissions', label: 'Permissions', icon: FiGrid },
  { id: 'details', label: 'Role details', icon: FiFileText },
  { id: 'log', label: 'Access log', icon: FiClock },
];

const ROLE_ICONS = {
  super_admin: FiAward,
  company_admin: FiShield,
  admin: FiShield,
  branch_manager: FiHome,
  counsellor: FiUser,
  counselor: FiUser,
  receptionist: FiUser,
  teacher: FiBook,
  finance_manager: FiDollarSign,
  finance_executive: FiDollarSign,
  visa_officer: FiGlobe,
  application_officer: FiGlobe,
};

function roleIcon(slug) {
  return ROLE_ICONS[slug] || FiShield;
}

const emptyForm = {
  name: '',
  description: '',
  dataScope: 'OWN',
  permissionKeys: [],
  isActive: true,
};

function hasRolesView(permissions = []) {
  return permissions.includes(PERMISSIONS.ROLES_VIEW) || permissions.includes('roles:view');
}

function hasRolesUpdate(permissions = []) {
  return permissions.includes(PERMISSIONS.ROLES_UPDATE) || permissions.includes('roles:update');
}

export default function RolesAccessPanel({ focusRoleId = null, onRolesLoaded }) {
  const { isAdmin, roleSlug: myRoleSlug, permissions } = usePermissions();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState({});
  const [allPermissions, setAllPermissions] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [keys, setKeys] = useState([]);
  const [dataScope, setDataScope] = useState('OWN');
  const [pendingKey, setPendingKey] = useState(null);
  const [savingScope, setSavingScope] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');
  const [permFilter, setPermFilter] = useState('all');
  const [detailTab, setDetailTab] = useState('permissions');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState('create');
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [copyFromId, setCopyFromId] = useState('');
  const [logRefresh, setLogRefresh] = useState(0);

  const canView = isAdmin || hasRolesView(permissions);
  const canEdit = isAdmin || hasRolesUpdate(permissions);

  const selected = useMemo(
    () => roles.find((r) => r.id === selectedId) || null,
    [roles, selectedId],
  );

  const lockedKeys = useMemo(() => {
    if (!FORCE_DENY_PREFIXES_BY_ROLE[selected?.slug]) return new Set();
    const locked = new Set();
    Object.values(groups).forEach((perms) => {
      perms.forEach((p) => {
        if (isPermissionDeniedForRole(selected.slug, p.key)) locked.add(p.key);
      });
    });
    return locked;
  }, [groups, selected?.slug]);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) =>
      `${r.name} ${r.slug} ${r.description || ''}`.toLowerCase().includes(q),
    );
  }, [roles, roleSearch]);

  const permStats = useMemo(
    () => computePermissionStats(allPermissions, keys, lockedKeys),
    [allPermissions, keys, lockedKeys],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rbacService.getRoles({ limit: 200 }),
        rbacService.getPermissions(),
      ]);
      const list = rolesRes.data || [];
      const groupMap = permsRes?.groups || permsRes || {};
      const flat = Object.values(groupMap).flat();
      setRoles(list);
      setGroups(groupMap);
      setAllPermissions(flat);
      onRolesLoaded?.(list);
      setSelectedId((prev) => {
        if (focusRoleId && list.some((r) => r.id === focusRoleId)) return focusRoleId;
        if (prev && list.some((r) => r.id === prev)) return prev;
        const prefer = list.find((r) => r.slug === 'counsellor') || list[0];
        return prefer?.id || null;
      });
    } catch (e) {
      toastService.error(e?.response?.data?.message || e?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, [focusRoleId, onRolesLoaded]);

  useEffect(() => {
    if (canView) load();
  }, [canView, load]);

  useEffect(() => {
    if (!selected) {
      setKeys([]);
      setDataScope('OWN');
      return;
    }
    const raw = Array.isArray(selected.permissions) ? selected.permissions : [];
    setKeys(raw.filter((k) => !isPermissionDeniedForRole(selected.slug, k)));
    setDataScope(selected.dataScope || 'OWN');
    setModuleSearch('');
    setPermFilter('all');
  }, [selected]);

  useEffect(() => {
    if (!selectedId) return undefined;
    let cancelled = false;
    rbacService.getRole(selectedId).then((role) => {
      if (!cancelled && role) {
        setRoles((prev) => prev.map((r) => (r.id === role.id ? { ...r, ...role } : r)));
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [selectedId]);

  const bumpLog = () => setLogRefresh((n) => n + 1);

  const persistKeys = async (nextKeys, flashKey = null) => {
    if (!selected || !canEdit) return;
    const cleaned = nextKeys.filter((k) => !isPermissionDeniedForRole(selected.slug, k));
    setPendingKey(flashKey);
    setKeys(cleaned);
    try {
      const updated = await rbacService.updateRole(selected.id, {
        permissionKeys: cleaned,
        dataScope,
      });
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      if (selected.slug === myRoleSlug) dispatch(fetchProfile());
      bumpLog();
      if (!flashKey) toastService.success('Permissions saved');
    } catch (e) {
      toastService.error(e?.response?.data?.message || e?.message || 'Save failed');
      await load();
    } finally {
      setPendingKey(null);
    }
  };

  const handleToggle = async (key, _enabled, nextKeys) => {
    await persistKeys(nextKeys, key);
  };

  const handleGroupChange = async (nextKeys) => {
    await persistKeys(nextKeys, null);
  };

  const handleScopeChange = async (value) => {
    if (!selected || !canEdit) return;
    setDataScope(value);
    setSavingScope(true);
    try {
      const updated = await rbacService.updateRole(selected.id, {
        dataScope: value,
        permissionKeys: keys,
      });
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      bumpLog();
      toastService.success(`Data access updated to ${DATA_SCOPE_PLAIN[value]?.label || value}`);
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Update failed');
      setDataScope(selected.dataScope || 'OWN');
    } finally {
      setSavingScope(false);
    }
  };

  const openCreate = () => {
    setFormMode('create');
    setForm({
      name: '',
      description: '',
      dataScope: 'OWN',
      parentRoleId: '',
      templateRoleId: '',
      permissionKeys: [],
      isActive: true,
    });
    setFormOpen(true);
  };

  const openEdit = (role) => {
    setFormMode('edit');
    setForm({
      name: role.name,
      description: role.description || '',
      dataScope: role.dataScope || 'OWN',
      parentRoleId: role.parentRoleId || '',
      templateRoleId: '',
      permissionKeys: role.permissions || [],
      isActive: role.isActive !== false,
    });
    setSelectedId(role.id);
    setDetailTab('details');
    setFormOpen(true);
  };

  const handleSaveRole = async () => {
    if (!form.name.trim()) {
      toastService.error('Role name is required');
      return;
    }
    setSaving(true);
    try {
      if (formMode === 'create') {
        let initialKeys = [];
        if (form.templateRoleId) {
          const tRole = roles.find((r) => r.id === form.templateRoleId);
          if (tRole?.permissions?.length) {
            initialKeys = tRole.permissions;
          }
        }
        const created = await rbacService.createRole({
          name: form.name.trim(),
          description: form.description?.trim() || null,
          dataScope: form.dataScope || 'OWN',
          parentRoleId: form.parentRoleId || undefined,
          permissionKeys: initialKeys,
          isActive: form.isActive !== false,
        });
        toastService.success(`Role "${created.name}" created successfully`);
        setSelectedId(created.id);
        bumpLog();
      } else if (selected) {
        await rbacService.updateRole(selected.id, {
          name: form.name.trim(),
          description: form.description?.trim() || null,
          dataScope: form.dataScope,
          parentRoleId: form.parentRoleId || undefined,
          permissionKeys: keys,
          isActive: form.isActive !== false,
        });
        toastService.success('Role updated');
        bumpLog();
      }
      setFormOpen(false);
      await load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role) => {
    const ok = await alertService.deleteConfirm({
      title: 'Delete role',
      text: 'This role will be deactivated and removed from the list.',
      confirmText: 'Delete role',
      itemName: role.name,
    });
    if (!ok) return;
    try {
      await rbacService.deleteRole(role.id);
      toastService.success('Role deleted');
      setSelectedId(null);
      await load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Cannot delete role');
    }
  };

  const handleClone = async (role) => {
    try {
      const cloned = await rbacService.cloneRole(role.id, { name: `${role.name} (Copy)` });
      toastService.success('Role cloned');
      setSelectedId(cloned.id);
      bumpLog();
      await load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Clone failed');
    }
  };

  const handleCopyPermissions = async () => {
    if (!selected || !copyFromId) return;
    try {
      const updated = await rbacService.copyPermissions(selected.id, copyFromId);
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      setKeys(updated.permissions || []);
      bumpLog();
      toastService.success('Permissions copied from selected role');
      await load();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Copy failed');
    }
  };

  if (!canView) {
    return (
      <Card className="!p-10 text-center text-text-muted">
        You do not have permission to manage roles and access.
      </Card>
    );
  }

  if (loading && !roles.length) {
    return (
      <div className="min-h-[420px] flex items-center justify-center">
        <TableLoader />
      </div>
    );
  }

  return (
    <div className="crm-team-access-panel crm-roles-workspace">
      <div className="crm-roles-workspace__toolbar">
        <div>
          <h2 className="crm-roles-workspace__title">Roles &amp; access</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <PermissionGate permission={PERMISSIONS.ROLES_CREATE}>
            <Button size="sm" icon={FiPlus} onClick={openCreate}>Create role</Button>
          </PermissionGate>
          <Button size="sm" variant="secondary" icon={FiRefreshCw} onClick={load} loading={loading}>
            Refresh
          </Button>
        </div>
      </div>

      <div className="crm-team-access-roles-layout">
        <Card className="crm-roles-sidebar !p-0">
          <div className="crm-roles-sidebar__head">
            <div>
              <p className="crm-roles-sidebar__title">Roles</p>
              <p className="crm-roles-sidebar__hint">Manage and organize user roles</p>
            </div>
            <span className="crm-roles-sidebar__count">{filteredRoles.length}</span>
          </div>
          <div className="crm-roles-sidebar__search">
            <SearchInput
              value={roleSearch}
              onChange={(e) => setRoleSearch(e.target.value)}
              placeholder="Search roles…"
              size="sm"
            />
          </div>
          <ul className="crm-roles-sidebar__list">
            {filteredRoles.map((role) => {
              const active = role.id === selectedId;
              const meta = getRoleMeta(role.slug);
              const Icon = roleIcon(role.slug);
              const desc = role.description || meta.description || DATA_SCOPE_PLAIN[role.dataScope]?.label;
              return (
                <li key={role.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedId(role.id)}
                    className={`crm-roles-sidebar__item ${active ? 'crm-roles-sidebar__item--active' : ''}`}
                  >
                    <span className={`crm-roles-sidebar__icon ${meta.iconBg || 'bg-brand-soft text-brand'}`}>
                      <Icon size={16} />
                    </span>
                    <span className="crm-roles-sidebar__meta">
                      <span className="crm-roles-sidebar__name">{role.name}</span>
                      <span className="crm-roles-sidebar__desc">{desc}</span>
                    </span>
                    <span className="crm-roles-sidebar__users">
                      {role.userCount ?? 0} users
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="crm-roles-sidebar__foot">
            <Button size="sm" variant="outline" className="w-full" icon={FiPlus} onClick={openCreate}>
              Create new role
            </Button>
          </div>
        </Card>

        <Card className="crm-roles-main !p-0">
          {selected ? (
            <>
              <div className="crm-roles-main__head">
                <div className="min-w-0">
                  <h2 className="crm-roles-main__title">{selected.name}</h2>
                  <p className="crm-roles-main__subtitle">
                    {selected.description || getRoleMeta(selected.slug).description}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <PermissionGate permission={PERMISSIONS.ROLES_UPDATE}>
                    <Button size="sm" variant="secondary" icon={FiEdit2} onClick={() => openEdit(selected)}>Edit</Button>
                  </PermissionGate>
                  <PermissionGate permission={PERMISSIONS.ROLES_CLONE}>
                    <Button size="sm" variant="secondary" icon={FiCopy} onClick={() => handleClone(selected)}>Clone</Button>
                  </PermissionGate>
                  <PermissionGate permission={PERMISSIONS.ROLES_DELETE}>
                    {!selected.isSystem && (
                      <Button size="sm" variant="danger" icon={FiTrash2} onClick={() => handleDelete(selected)}>Delete</Button>
                    )}
                  </PermissionGate>
                </div>
              </div>

              <div className="crm-roles-main__tabs" role="tablist">
                {DETAIL_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const active = detailTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`crm-roles-main__tab ${active ? 'crm-roles-main__tab--active' : ''}`}
                      onClick={() => setDetailTab(tab.id)}
                    >
                      <Icon size={14} />
                      {tab.label}
                    </button>
                  );
                })}
              </div>

              <div className="crm-roles-main__body">
                {detailTab === 'permissions' && (
                  <>
                    <div className="crm-roles-perm-bar">
                      <RolePermissionSummary
                        stats={permStats}
                        compact
                        activeFilter={permFilter}
                        onFilter={setPermFilter}
                      />

                      <div className="crm-roles-perm-bar__tools">
                        <div className="crm-roles-tools__copy crm-roles-tools__copy--inline">
                          <Select
                            value={copyFromId}
                            onChange={(e) => setCopyFromId(e.target.value)}
                            options={[
                              { value: '', label: 'Copy from role…' },
                              ...roles.filter((r) => r.id !== selected.id).map((r) => ({ value: r.id, label: r.name })),
                            ]}
                            disabled={!canEdit}
                            allowClear={false}
                          />
                          <Button size="sm" disabled={!copyFromId || !canEdit} onClick={handleCopyPermissions}>Apply</Button>
                        </div>
                        <div className="crm-roles-tools__scope crm-roles-tools__scope--inline">
                          <Select
                            value={dataScope}
                            onChange={(e) => handleScopeChange(e.target.value)}
                            options={DATA_SCOPES.map((s) => ({ value: s.value, label: s.label }))}
                            disabled={!canEdit || savingScope || selected.slug === 'super_admin'}
                            allowClear={false}
                          />
                        </div>
                        <div className="crm-pgrid-search">
                          <FiSearch className="crm-pgrid-search__icon" size={14} />
                          <input
                            type="search"
                            value={moduleSearch}
                            onChange={(e) => setModuleSearch(e.target.value)}
                            placeholder="Search modules…"
                            className="crm-pgrid-search__input"
                          />
                        </div>
                      </div>
                    </div>

                    <PermissionGridMatrix
                      groups={groups}
                      selected={keys}
                      search={moduleSearch}
                      accessFilter={permFilter}
                      onToggle={canEdit ? handleToggle : undefined}
                      onChange={canEdit ? handleGroupChange : undefined}
                      readOnly={!canEdit}
                      lockedKeys={lockedKeys}
                      pendingKey={pendingKey}
                    />
                  </>
                )}

                {detailTab === 'details' && (
                  <div className="crm-role-details">
                    <div className="crm-role-details__fields">
                      <FormField label="Role name">
                        <Input value={selected.name} disabled />
                      </FormField>
                      <FormField label="Description">
                        <Input value={selected.description || '—'} disabled />
                      </FormField>
                      <FormField label="Data access">
                        <Input value={DATA_SCOPE_PLAIN[dataScope]?.label || dataScope} disabled />
                      </FormField>
                      <FormField label="Status">
                        <span className={`crm-role-details__status ${selected.isActive ? 'crm-role-details__status--active' : ''}`}>
                          <span className="crm-role-details__status-dot" />
                          {selected.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </FormField>
                    </div>

                    {selected.users?.length > 0 && (
                      <div className="crm-role-details__users">
                        <p className="crm-role-details__users-title">Team members on this role ({selected.userCount ?? selected.users.length})</p>
                        <div className="crm-role-details__avatars">
                          {selected.users.slice(0, 6).map((u) => (
                            <Avatar key={u.id} name={`${u.firstName} ${u.lastName}`} size="sm" title={u.email} />
                          ))}
                          {(selected.userCount ?? 0) > 6 && (
                            <span className="crm-role-details__more">+{(selected.userCount ?? 0) - 6}</span>
                          )}
                        </div>
                      </div>
                    )}

                    <div className="crm-role-details__stats">
                      <RolePermissionSummary stats={permStats} />
                    </div>
                    <Button size="sm" variant="outline" icon={FiEdit2} onClick={() => openEdit(selected)}>Edit role details</Button>
                  </div>
                )}

                {detailTab === 'log' && (
                  <RoleActivityTimeline
                    key={`${selected.id}-${logRefresh}`}
                    roleId={selected.id}
                    roleName={selected.name}
                  />
                )}
              </div>
            </>
          ) : (
            <p className="text-text-secondary text-center py-16">Select a role to manage access.</p>
          )}
        </Card>
      </div>

      <Drawer
        open={formOpen}
        onClose={() => setFormOpen(false)}
        title={formMode === 'create' ? 'Create New Role' : 'Edit Role Settings'}
        subtitle={formMode === 'create' ? 'Configure role identity, data scope boundary & initial permissions' : 'Update role information, data scope, and hierarchy'}
        size="md"
        dense
        footer={(
          <div className="flex items-center justify-between w-full gap-3">
            <Button variant="outline" size="sm" onClick={() => setFormOpen(false)} disabled={saving}>
              Cancel
            </Button>
            <Button size="sm" onClick={handleSaveRole} loading={saving} icon={formMode === 'create' ? FiPlus : FiCheck}>
              {formMode === 'create' ? 'Create Role' : 'Save Changes'}
            </Button>
          </div>
        )}
      >
        <div className="p-4 space-y-5">
          {/* Section 1: Role Identity */}
          <div className="space-y-3.5 pb-4 border-b border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center text-[11px] font-bold">1</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Role Identity</h4>
            </div>

            <FormField label="Role Name" required hint="Display name for this role across the CRM">
              <Input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="e.g. Senior Academic Counsellor, Head Faculty"
              />
            </FormField>

            <FormField label="Description" hint="Explain the duties and operational scope of this role">
              <textarea
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand resize-none"
                rows={2}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="What responsibilities and actions does this staff role perform?"
              />
            </FormField>
          </div>

          {/* Section 2: Data Access Scope */}
          <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700/80">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center text-[11px] font-bold">2</span>
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Data Access Scope (Who can they see?)</h4>
                <p className="text-[11px] text-slate-500">Defines records boundary for enquiries, leads, and students</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DATA_SCOPES.filter((s) => s.value !== 'GLOBAL' || form.dataScope === 'GLOBAL').map((scope) => {
                const isSelected = form.dataScope === scope.value;
                return (
                  <button
                    key={scope.value}
                    type="button"
                    onClick={() => setForm((f) => ({ ...f, dataScope: scope.value }))}
                    className={`flex items-start gap-3 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'border-brand bg-brand-soft/40 dark:bg-brand-soft/20 shadow-xs'
                        : 'border-slate-200 dark:border-slate-700/80 bg-white dark:bg-slate-800/60 hover:bg-slate-50 dark:hover:bg-slate-800'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded-full mt-0.5 flex items-center justify-center border transition-all ${
                      isSelected ? 'border-brand bg-brand text-white' : 'border-slate-300 dark:border-slate-600'
                    }`}>
                      {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-white" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-slate-900 dark:text-slate-100 flex items-center justify-between">
                        <span>{scope.label}</span>
                        <span className="text-[10px] font-mono font-medium text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.2 rounded">{scope.value}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5 leading-tight">{scope.description}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 3: Permission Template (Create mode only) */}
          {formMode === 'create' && (
            <div className="space-y-3 pb-4 border-b border-slate-200 dark:border-slate-700/80">
              <div className="flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center text-[11px] font-bold">3</span>
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Permission Template</h4>
                  <p className="text-[11px] text-slate-500">Fast-track setup by copying permissions from an existing role</p>
                </div>
              </div>

              <FormField label="Start with template" hint="Choose an existing role to inherit permissions from">
                <Select
                  value={form.templateRoleId}
                  onChange={(e) => setForm((f) => ({ ...f, templateRoleId: e.target.value }))}
                  options={[
                    { value: '', label: 'Start from scratch (Zero permissions)' },
                    ...roles.map((r) => ({
                      value: r.id,
                      label: `Clone: ${r.name} (${r.permissions?.length || 0} permissions)`,
                    })),
                  ]}
                  allowClear={false}
                />
              </FormField>
            </div>
          )}

          {/* Section 4: Hierarchy & Status */}
          <div className="space-y-3.5 pb-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300 flex items-center justify-center text-[11px] font-bold">{formMode === 'create' ? '4' : '3'}</span>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">Hierarchy & Status</h4>
            </div>

            <FormField label="Reports To / Parent Role (Optional)" hint="Defines organizational reporting and escalation structure">
              <Select
                value={form.parentRoleId || ''}
                onChange={(e) => setForm((f) => ({ ...f, parentRoleId: e.target.value }))}
                options={[
                  { value: '', label: 'No parent role (Direct Top-Level)' },
                  ...roles.filter((r) => formMode === 'create' || r.id !== selected?.id).map((r) => ({
                    value: r.id,
                    label: r.name,
                  })),
                ]}
                allowClear={false}
              />
            </FormField>

            <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/60 dark:bg-slate-800/40">
              <div>
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Role Status</span>
                <p className="text-[11px] text-slate-500">Allow assigning this role to staff members</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.isActive !== false}
                  onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))}
                  className="sr-only peer"
                />
                <div className="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-brand"></div>
              </label>
            </div>
          </div>

          {/* Live Preview Card */}
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
            <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-2">Live Role Preview</span>
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-950 dark:text-blue-300 border border-blue-100 dark:border-blue-900/60 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  <FiShield size={16} />
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                    {form.name.trim() || 'Role Name Preview'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate max-w-[220px]">
                    {form.description?.trim() || 'No description entered'}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  {DATA_SCOPES.find((s) => s.value === form.dataScope)?.label || form.dataScope}
                </span>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                  form.isActive !== false ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                }`}>
                  {form.isActive !== false ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </Drawer>
    </div>
  );
}
