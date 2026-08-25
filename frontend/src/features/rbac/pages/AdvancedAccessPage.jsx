import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiShield, FiRefreshCw, FiSearch, FiUsers, FiLock,
} from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import TableLoader from '../../../components/ui/TableLoader';
import PermissionMatrix, { DATA_SCOPES } from '../components/PermissionMatrix';
import { rbacService } from '../../../services/rbac/rbac.service';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import {
  FORCE_DENY_PREFIXES_BY_ROLE,
  isPermissionDeniedForRole,
} from '../../../config/access-policy.js';
import { DATA_SCOPE_PLAIN, getPermissionPlainLabel } from '../config/permissionLabels';
import toastService from '../../../services/toast/toast.service';
import { useDispatch } from 'react-redux';
import { fetchProfile } from '../../../redux/slices/authSlice';

/**
 * Masters → Advanced Access
 * Live permission toggles for Admin / Super Admin.
 */
export default function AdvancedAccessPage() {
  const { isAdmin, roleSlug: myRoleSlug, permissions } = usePermissions();
  const dispatch = useDispatch();

  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [groups, setGroups] = useState({});
  const [selectedId, setSelectedId] = useState(null);
  const [keys, setKeys] = useState([]);
  const [dataScope, setDataScope] = useState('OWN');
  const [pendingKey, setPendingKey] = useState(null);
  const [savingScope, setSavingScope] = useState(false);
  const [showKeys, setShowKeys] = useState(false);
  const [roleSearch, setRoleSearch] = useState('');
  const [moduleSearch, setModuleSearch] = useState('');

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

  const permNameByKey = useMemo(() => {
    const map = {};
    Object.values(groups).forEach((perms) => {
      perms.forEach((p) => { map[p.key] = getPermissionPlainLabel(p); });
    });
    return map;
  }, [groups]);

  const filteredRoles = useMemo(() => {
    const q = roleSearch.trim().toLowerCase();
    if (!q) return roles;
    return roles.filter((r) =>
      `${r.name} ${r.slug} ${r.dataScope || ''}`.toLowerCase().includes(q),
    );
  }, [roles, roleSearch]);

  const filteredGroups = useMemo(() => {
    const q = moduleSearch.trim().toLowerCase();
    if (!q) return groups;
    const next = {};
    Object.entries(groups).forEach(([groupName, perms]) => {
      const matched = perms.filter((p) => {
        const label = getPermissionPlainLabel(p).toLowerCase();
        return (
          groupName.toLowerCase().includes(q)
          || label.includes(q)
          || String(p.key || '').toLowerCase().includes(q)
        );
      });
      if (matched.length) next[groupName] = matched;
    });
    return next;
  }, [groups, moduleSearch]);

  const allowedCount = keys.length;
  const totalCount = useMemo(
    () => Object.values(groups).reduce((n, perms) => n + perms.length, 0),
    [groups],
  );

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rolesRes, permsRes] = await Promise.all([
        rbacService.getRoles({ limit: 200 }),
        rbacService.getPermissions(),
      ]);
      const list = rolesRes.data || [];
      setRoles(list);
      setGroups(permsRes?.groups || permsRes || {});
      setSelectedId((prev) => {
        if (prev && list.some((r) => r.id === prev)) return prev;
        const prefer = list.find((r) => r.slug === 'counsellor') || list[0];
        return prefer?.id || null;
      });
    } catch (e) {
      toastService.error(e?.response?.data?.message || e?.message || 'Failed to load roles');
    } finally {
      setLoading(false);
    }
  }, []);

  // Stable deps only — do NOT depend on `can` (new function each render → infinite loop)
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
  }, [selected]);

  const persistKeys = async (nextKeys, flashKey = null) => {
    if (!selected || !canEdit) return;
    const cleaned = nextKeys.filter((k) => !isPermissionDeniedForRole(selected.slug, k));
    const enabled = flashKey ? cleaned.includes(flashKey) : null;
    setPendingKey(flashKey);
    setKeys(cleaned);
    try {
      const updated = await rbacService.updateRole(selected.id, {
        permissionKeys: cleaned,
        dataScope,
      });
      setRoles((prev) => prev.map((r) => (r.id === updated.id ? { ...r, ...updated } : r)));
      if (selected.slug === myRoleSlug) {
        dispatch(fetchProfile());
      }
      if (flashKey) {
        const label = permNameByKey[flashKey] || 'Permission';
        toastService.success(enabled ? `${label} — allowed` : `${label} — removed`);
      } else {
        toastService.success('Permissions saved');
      }
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
      toastService.success(`Data access: ${DATA_SCOPE_PLAIN[value]?.label || value}`);
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Scope update failed');
      setDataScope(selected.dataScope || 'OWN');
    } finally {
      setSavingScope(false);
    }
  };

  const scopeMeta = DATA_SCOPE_PLAIN[dataScope] || DATA_SCOPE_PLAIN.OWN;

  if (!canView) {
    return (
      <ModulePageCard
        title="Manage Permissions"
        subtitle="Access denied"
        icon={FiShield}
        breadcrumbs={[
          { label: 'Dashboard', path: ROUTES.DASHBOARD },
          { label: 'Masters', path: ROUTES.MASTER },
          { label: 'Manage Permissions' },
        ]}
      >
        <p className="p-8 text-center text-text-secondary">
          You do not have permission to manage role access. Contact your administrator.
        </p>
      </ModulePageCard>
    );
  }

  return (
    <ModulePageCard
      title="Manage Permissions"
      subtitle="Grant or remove menu, page, and button access for each role. Changes save instantly."
      icon={FiShield}
      iconColor="primary"
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Masters', path: ROUTES.MASTER },
        { label: 'Manage Permissions' },
      ]}
      actions={(
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" size="sm" icon={FiRefreshCw} onClick={load} disabled={loading}>
            Reload
          </Button>
          <Link to={ROUTES.ROLES}>
            <Button variant="outline" size="sm" icon={FiShield}>
              Roles list
            </Button>
          </Link>
        </div>
      )}
    >
      <div className="flex flex-col flex-1 min-h-0 p-4 md:p-5 gap-4">
        {loading ? (
          <div className="min-h-[420px] flex items-center justify-center">
            <TableLoader />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-4 flex-1 min-h-[520px]">
            {/* Role list */}
            <Card className="p-3 flex flex-col min-h-0 max-h-[75vh]">
              <div className="flex items-center justify-between gap-2 mb-2 px-1">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">
                  Roles
                </p>
                <span className="text-[11px] text-text-muted tabular-nums">
                  {filteredRoles.length}/{roles.length}
                </span>
              </div>
              <SearchInput
                value={roleSearch}
                onChange={(e) => setRoleSearch(e.target.value)}
                placeholder="Search roles…"
                size="sm"
                className="mb-2"
              />
              <ul className="space-y-0.5 overflow-y-auto flex-1 min-h-0 pr-0.5">
                {filteredRoles.map((role) => {
                  const active = role.id === selectedId;
                  const scopeLabel = DATA_SCOPE_PLAIN[role.dataScope]?.label || role.dataScope;
                  return (
                    <li key={role.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedId(role.id)}
                        className={`w-full text-left rounded-lg px-3 py-2.5 text-sm transition-colors ${
                          active
                            ? 'bg-brand text-white shadow-sm'
                            : 'hover:bg-row-hover text-text-primary'
                        }`}
                      >
                        <span className="font-medium block truncate">{role.name}</span>
                        <span className={`text-[11px] flex items-center gap-1 mt-0.5 ${active ? 'text-white/80' : 'text-text-muted'}`}>
                          <FiUsers size={11} />
                          {scopeLabel}
                          {typeof role.userCount === 'number' ? ` · ${role.userCount}` : ''}
                        </span>
                      </button>
                    </li>
                  );
                })}
                {!filteredRoles.length && (
                  <li className="px-2 py-6 text-center text-sm text-text-muted">No roles match</li>
                )}
              </ul>
            </Card>

            {/* Permission panel */}
            <Card className="p-4 flex flex-col gap-3 min-h-0 max-h-[75vh]">
              {selected ? (
                <>
                  <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border pb-3">
                    <div className="min-w-0">
                      <h2 className="text-lg font-semibold text-text-primary truncate">{selected.name}</h2>
                      {selected.description && (
                        <p className="text-sm text-text-secondary mt-0.5">{selected.description}</p>
                      )}
                      <p className="text-xs text-text-muted mt-1.5">{scopeMeta.help}</p>
                      <p className="text-[11px] text-text-muted mt-1 tabular-nums">
                        {allowedCount} of {totalCount} permissions allowed
                        {lockedKeys.size > 0 && (
                          <span className="ml-2 inline-flex items-center gap-1 text-warning">
                            <FiLock size={11} /> {lockedKeys.size} locked
                          </span>
                        )}
                      </p>
                    </div>
                    <div className="flex flex-col items-stretch sm:items-end gap-2">
                      <label className="text-xs text-text-secondary flex items-center gap-2">
                        Data access
                        <select
                          className="rounded-md border border-border bg-card-bg px-2 py-1.5 text-sm text-text-primary disabled:opacity-50 min-w-[160px]"
                          value={dataScope}
                          disabled={!canEdit || savingScope || selected.slug === 'super_admin'}
                          onChange={(e) => handleScopeChange(e.target.value)}
                        >
                          {DATA_SCOPES.map((s) => (
                            <option key={s.value} value={s.value}>{s.label}</option>
                          ))}
                        </select>
                      </label>
                      <label className="inline-flex items-center gap-1.5 text-[11px] text-text-muted cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={showKeys}
                          onChange={(e) => setShowKeys(e.target.checked)}
                        />
                        Show technical codes
                      </label>
                    </div>
                  </div>

                  {!canEdit && (
                    <p className="text-sm text-warning rounded-md bg-warning-soft/50 border border-warning/20 px-3 py-2">
                      View only — you need Admin access to change permissions.
                    </p>
                  )}

                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-text-muted pointer-events-none" size={14} />
                    <input
                      type="search"
                      value={moduleSearch}
                      onChange={(e) => setModuleSearch(e.target.value)}
                      placeholder="Filter modules or permissions…"
                      className="crm-input w-full rounded-lg border border-border pl-9 pr-3 py-2 text-sm"
                    />
                  </div>

                  <PermissionMatrix
                    groups={filteredGroups}
                    selected={keys}
                    onToggle={canEdit ? handleToggle : undefined}
                    onChange={canEdit ? handleGroupChange : undefined}
                    readOnly={!canEdit}
                    lockedKeys={lockedKeys}
                    pendingKey={pendingKey}
                    showKeys={showKeys}
                    className="flex-1 min-h-0 max-h-[52vh]"
                  />

                  {!Object.keys(filteredGroups).length && (
                    <p className="text-sm text-text-muted text-center py-8">No permissions match your filter.</p>
                  )}
                </>
              ) : (
                <p className="text-text-secondary text-center py-16">Select a role from the left to manage access.</p>
              )}
            </Card>
          </div>
        )}
      </div>
    </ModulePageCard>
  );
}

function hasRolesView(permissions = []) {
  return permissions.includes(PERMISSIONS.ROLES_VIEW) || permissions.includes('roles:view');
}

function hasRolesUpdate(permissions = []) {
  return permissions.includes(PERMISSIONS.ROLES_UPDATE) || permissions.includes('roles:update');
}
