import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiUsers, FiPlus, FiRefreshCw, FiSearch, FiPhone, FiHash, FiBriefcase,
} from 'react-icons/fi';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import FormField from '../../../components/ui/FormField';
import Drawer from '../../../components/ui/Drawer';
import Avatar from '../../../components/ui/Avatar';
import TableLoader from '../../../components/ui/TableLoader';
import Skeleton from '../../../components/ui/Skeleton';
import MasterFormSection from '../../master/components/MasterFormSection';
import RoleBadge from '../../../components/profile/RoleBadge';
import { masterDrawerSubtitle, masterSubmitLabel } from '../../master/utils/masterFormLayout.util';
import { getRoleMeta } from '../../../config/roles';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { useBranchOptions } from '../../enquiry/hooks/useBranchOptions';
import { staffApi, getUserApiError } from '../../master/services/staffApi.service';
import toastService from '../../../services/toast/toast.service';
import alertService from '../../../services/alert/alert.service';
import { resolvePublicAssetUrl } from '../../../config/company-settings.config';
import { patchAuthUser, selectUser } from '../../../redux/slices/authSlice';
import TeamMemberDetail from './TeamMemberDetail';
import StaffAvatarEditor from './StaffAvatarEditor';

function mergeMemberRecord(prev, next) {
  if (!next?.id) return prev ?? null;
  if (!prev || prev.id !== next.id) return next;
  return {
    ...prev,
    ...next,
    role: next.role ?? prev.role,
    branch: next.branch ?? prev.branch,
    company: next.company ?? prev.company,
    workload: next.workload ?? prev.workload,
  };
}

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

const NON_STAFF_ROLE_SLUGS = new Set(['student_portal', 'partner']);

function StatusPill({ status }) {
  const tone = status === 'ACTIVE'
    ? 'crm-staff-status--active'
    : status === 'SUSPENDED'
      ? 'crm-staff-status--suspended'
      : 'crm-staff-status--inactive';
  return <span className={`crm-staff-status ${tone}`}>{status}</span>;
}

function emptyForm() {
  return {
    firstName: '', lastName: '', email: '', phone: '', employeeCode: '', department: '',
    password: '', roleId: '', branchId: '', status: 'ACTIVE',
  };
}

function userToForm(row) {
  if (!row) return emptyForm();
  return {
    firstName: row.firstName || '',
    lastName: row.lastName || '',
    email: row.email || '',
    phone: row.phone || '',
    employeeCode: row.employeeCode || '',
    department: row.department || '',
    password: '',
    roleId: row.role?.id || row.roleId || '',
    branchId: row.branch?.id || row.branchId || '',
    status: row.status || 'ACTIVE',
  };
}

function fullName(row) {
  return `${row?.firstName || ''} ${row?.lastName || ''}`.trim() || row?.email || 'User';
}

function useDebouncedValue(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = window.setTimeout(() => setDebounced(value), delay);
    return () => window.clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function countTeamFromSummary(summary) {
  if (!summary?.roles?.length) return null;
  return summary.roles.reduce((sum, role) => sum + (role._count?.users || 0), 0);
}

export default function TeamMembersPanel({
  statusFilterExternal = null,
  onSummaryUpdate,
  onManageRole,
}) {
  const dispatch = useDispatch();
  const currentUser = useSelector(selectUser);
  const { can } = usePermissions();
  const canCreate = can(PERMISSIONS.USERS_CREATE);
  const canUpdate = can(PERMISSIONS.USERS_UPDATE);
  const canDelete = can(PERMISSIONS.USERS_DELETE);
  const canManageRoles = can(PERMISSIONS.ROLES_VIEW);

  const [rows, setRows] = useState([]);
  const [roles, setRoles] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetching, setFetching] = useState(false);
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebouncedValue(search.trim());
  const onSummaryUpdateRef = useRef(onSummaryUpdate);
  onSummaryUpdateRef.current = onSummaryUpdate;
  const [roleFilter, setRoleFilter] = useState('all');
  const [branchFilter, setBranchFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [drawer, setDrawer] = useState({ open: false, mode: 'add', record: null });
  const [form, setForm] = useState(emptyForm());
  const [saving, setSaving] = useState(false);
  const [actionBusy, setActionBusy] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const hasLoadedRef = useRef(false);
  const teamTotalsRef = useRef({ teamTotal: 0, activeCount: 0 });

  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();

  const effectiveStatusFilter = statusFilterExternal || statusFilter;

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
    () => [{ value: 'all', label: 'All roles' }, ...roles.map((r) => ({ value: r.slug, label: r.name }))],
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
    if (silent) setFetching(true);
    else if (!hasLoadedRef.current) setLoading(true);
    try {
      const params = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (roleFilter && roleFilter !== 'all') params.role = roleFilter;
      if (branchFilter && branchFilter !== 'all') params.branchId = branchFilter;
      if (effectiveStatusFilter !== 'all') params.status = effectiveStatusFilter;

      const hasFilters = Boolean(
        debouncedSearch
        || (roleFilter && roleFilter !== 'all')
        || (branchFilter && branchFilter !== 'all')
        || effectiveStatusFilter !== 'all',
      );

      const [listRes, summaryRes] = await Promise.all([
        staffApi.list(params),
        staffApi.getTeamSummary().catch(() => null),
      ]);

      const list = Array.isArray(listRes.data) ? listRes.data : [];
      setRows(list);
      hasLoadedRef.current = true;

      const summaryActive = countTeamFromSummary(summaryRes);
      const pageTotal = listRes.pagination?.total ?? list.length;
      const pageActive = list.filter((r) => r.status === 'ACTIVE').length;

      if (!hasFilters) {
        teamTotalsRef.current = {
          teamTotal: pageTotal,
          activeCount: summaryActive ?? pageActive,
        };
      }

      onSummaryUpdateRef.current?.({
        summary: summaryRes,
        teamTotal: hasFilters ? teamTotalsRef.current.teamTotal : pageTotal,
        activeCount: effectiveStatusFilter === 'ACTIVE'
          ? pageActive
          : (hasFilters ? teamTotalsRef.current.activeCount : (summaryActive ?? pageActive)),
      });

      setSelected((prev) => {
        if (!list.length) return prev ?? null;
        if (prev) {
          const match = list.find((u) => u.id === prev.id);
          return match ? mergeMemberRecord(prev, match) : prev;
        }
        return list[0];
      });
    } catch (err) {
      toastService.error(getUserApiError(err, 'Failed to load staff'));
    } finally {
      setLoading(false);
      setFetching(false);
    }
  }, [debouncedSearch, roleFilter, branchFilter, effectiveStatusFilter]);

  useEffect(() => { loadRoles(); }, [loadRoles]);
  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (statusFilterExternal) setStatusFilter(statusFilterExternal);
  }, [statusFilterExternal]);

  useEffect(() => {
    if (!selected?.id) return undefined;
    let cancelled = false;
    setDetailLoading(true);
    staffApi.getById(selected.id).then((user) => {
      if (!cancelled && user?.id) {
        setSelected((prev) => mergeMemberRecord(prev, user));
        setRows((prev) => prev.map((r) => (r.id === user.id ? mergeMemberRecord(r, user) : r)));
      }
    }).catch(() => {}).finally(() => {
      if (!cancelled) setDetailLoading(false);
    });
    return () => { cancelled = true; };
  }, [selected?.id]);

  const syncMember = useCallback((user) => {
    if (!user?.id) return;
    setSelected((prev) => mergeMemberRecord(prev, user));
    setRows((prev) => prev.map((r) => (r.id === user.id ? mergeMemberRecord(r, user) : r)));
    if (currentUser?.id === user.id) {
      dispatch(patchAuthUser(user));
    }
  }, [currentUser?.id, dispatch]);

  const handleQuickRoleChange = async (roleId) => {
    if (!selected || !canUpdate) return;
    setActionBusy(true);
    try {
      const updated = await staffApi.update(selected.id, { roleId });
      syncMember(updated);
      toastService.success('Role updated');
    } catch (err) {
      toastService.error(getUserApiError(err, 'Role update failed'));
    } finally {
      setActionBusy(false);
    }
  };

  const openDrawer = (mode, record = null) => {
    const snapshot = record || selected;
    setForm(userToForm(snapshot));
    setDrawer({ open: true, mode, record: snapshot });
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
        employeeCode: form.employeeCode.trim() || null,
        department: form.department.trim() || null,
        roleId: form.roleId,
        branchId: form.branchId,
        status: form.status,
      };
      if (form.password.trim()) payload.password = form.password;

      if (drawer.mode === 'add') {
        const created = await staffApi.create(payload);
        toastService.success('Team member added');
        closeDrawer();
        await load(true);
        setSelected(created);
      } else {
        const updated = await staffApi.update(drawer.record.id, payload);
        toastService.success('Team member updated');
        closeDrawer();
        syncMember(updated);
        await load(true);
      }
    } catch (err) {
      toastService.error(getUserApiError(err, 'Save failed'));
    } finally {
      setSaving(false);
    }
  };

  const handleStatusToggle = async (row) => {
    if (!canUpdate || !row) return;
    const next = row.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    const ok = await alertService.confirm({
      title: next === 'ACTIVE' ? 'Activate user' : 'Deactivate user',
      text: `Set "${fullName(row)}" as ${next}?`,
      confirmText: next === 'ACTIVE' ? 'Activate' : 'Deactivate',
    });
    if (!ok) return;
    setActionBusy(true);
    try {
      const updated = await staffApi.updateStatus(row.id, next);
      toastService.success(`User ${next === 'ACTIVE' ? 'activated' : 'deactivated'}`);
      syncMember(updated);
      await load(true);
    } catch (err) {
      toastService.error(getUserApiError(err, 'Status update failed'));
    } finally {
      setActionBusy(false);
    }
  };

  const handleDelete = async (row) => {
    if (!canDelete || !row) return;
    const ok = await alertService.deleteConfirm({
      title: 'Remove team member',
      text: 'This user will be deactivated and removed from staff lists.',
      confirmText: 'Remove user',
      itemName: fullName(row),
    });
    if (!ok) return;
    setActionBusy(true);
    try {
      await staffApi.delete(row.id);
      toastService.success('Team member removed');
      setSelected(null);
      await load(true);
    } catch (err) {
      toastService.error(getUserApiError(err, 'Delete failed'));
    } finally {
      setActionBusy(false);
    }
  };

  const readOnly = drawer.mode === 'view';
  const formRole = roleOptions.find((r) => r.value === form.roleId);
  const drawerRecord = drawer.record || (drawer.mode === 'edit' ? selected : null);
  const drawerTitle = drawer.mode === 'add' ? 'Add Team Member' : drawer.mode === 'edit' ? 'Edit Team Member' : 'Team member details';
  const drawerSubtitle = drawer.mode === 'view' ? 'Read-only details' : masterDrawerSubtitle(drawer.mode, 'Team Member');
  const saveLabel = masterSubmitLabel(drawer.mode, 'Team Member', saving);

  if (loading && !rows.length) {
    return (
      <div className="crm-staff-layout">
        <Card className="!p-0 overflow-hidden min-h-[420px]">
          <TableLoader rows={10} columns={2} showCheckbox={false} showPagination={false} />
        </Card>
        <Card className="!p-6 space-y-4">
          <Skeleton className="h-24 w-full" rounded="lg" />
        </Card>
      </div>
    );
  }

  return (
    <div className="crm-team-access-panel">
      <div className="crm-team-filter-bar">
        <div className="crm-team-filter-field">
          <label>Search</label>
          <Input
            placeholder="Search name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            icon={FiSearch}
            aria-label="Search staff"
            name="team-member-list-search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            data-1p-ignore
            data-lpignore="true"
          />
        </div>
        <div className="crm-team-filter-field">
          <label>Role</label>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            options={roleFilterOptions}
            placeholder="All roles"
            allowClear={false}
          />
        </div>
        <div className="crm-team-filter-field">
          <label>Branch</label>
          <Select
            value={branchFilter}
            onChange={(e) => setBranchFilter(e.target.value)}
            options={[{ value: 'all', label: 'All branches' }, ...branchOptions]}
            placeholder="All branches"
            disabled={branchesLoading}
            allowClear={false}
          />
        </div>
        <div className="crm-team-filter-field">
          <label>Status</label>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={STATUS_OPTIONS}
            placeholder="All statuses"
            disabled={Boolean(statusFilterExternal)}
            allowClear={false}
          />
        </div>
        <div className="crm-team-filter-bar__actions">
          <Button variant="secondary" size="sm" icon={FiRefreshCw} loading={fetching} onClick={() => load(true)}>Refresh</Button>
          {canCreate && (
            <Button size="sm" icon={FiPlus} onClick={() => openDrawer('add')}>Add member</Button>
          )}
        </div>
      </div>

      <div className="crm-staff-layout">
        <div className="crm-staff-list">
          <div className="crm-staff-list__head">
            <span><FiUsers className="inline mr-1.5" size={14} /> Team ({rows.length})</span>
          </div>
          <div className="crm-staff-list__body">
            {!rows.length ? (
              <div className="crm-staff-empty">
                <p className="crm-staff-empty__title">
                  {debouncedSearch || roleFilter !== 'all' || branchFilter !== 'all' || effectiveStatusFilter !== 'all'
                    ? 'No members match your filters'
                    : 'No team members yet'}
                </p>
                <p className="crm-staff-empty__text">
                  {debouncedSearch || roleFilter !== 'all' || branchFilter !== 'all' || effectiveStatusFilter !== 'all'
                    ? 'Try clearing search or filters to see the full team.'
                    : 'Add staff and assign roles to control access.'}
                </p>
                {(debouncedSearch || roleFilter !== 'all' || branchFilter !== 'all' || effectiveStatusFilter !== 'all') && (
                  <Button
                    className="mt-4"
                    size="sm"
                    variant="secondary"
                    onClick={() => {
                      setSearch('');
                      setRoleFilter('all');
                      setBranchFilter('all');
                      if (!statusFilterExternal) setStatusFilter('all');
                    }}
                  >
                    Clear filters
                  </Button>
                )}
                {canCreate && !debouncedSearch && roleFilter === 'all' && branchFilter === 'all' && effectiveStatusFilter === 'all' && (
                  <Button className="mt-4" size="sm" icon={FiPlus} onClick={() => openDrawer('add')}>Add member</Button>
                )}
              </div>
            ) : rows.map((row) => (
              <button key={row.id} type="button" className={`crm-staff-list-item ${selected?.id === row.id ? 'crm-staff-list-item--active' : ''}`} onClick={() => setSelected(row)}>
                <div className="crm-staff-list-item__row">
                  <Avatar name={fullName(row)} src={resolvePublicAssetUrl(row.avatar)} size="md" />
                  <div className="crm-staff-list-item__meta">
                    <p className="crm-staff-list-item__name">{fullName(row)}</p>
                    <p className="crm-staff-list-item__email">{row.email}</p>
                    <div className="crm-staff-list-item__foot">
                      <RoleBadge slug={row.role?.slug} name={row.role?.name} size="sm" />
                      <StatusPill status={row.status} />
                      {row.workload?.total > 0 && <span className="crm-staff-tag">{row.workload.total} assigned</span>}
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="crm-staff-detail">
          {!selected ? (
            <div className="crm-staff-empty">
              <p className="crm-staff-empty__title">Select a team member</p>
              <p className="crm-staff-empty__text">View profile, role, branch, and permissions.</p>
            </div>
          ) : detailLoading && !selected.role?.permissions ? (
            <div className="crm-staff-detail__loading">
              <Skeleton className="h-24 w-full mb-4" rounded="lg" />
              <Skeleton className="h-40 w-full" rounded="lg" />
            </div>
          ) : (
            <TeamMemberDetail
              member={selected}
              roleOptions={roleOptions}
              canUpdate={canUpdate}
              canDelete={canDelete}
              canManageRoles={canManageRoles}
              actionBusy={actionBusy}
              onEdit={() => openDrawer('edit', selected)}
              onStatusToggle={() => handleStatusToggle(selected)}
              onDelete={() => handleDelete(selected)}
              onManageRole={onManageRole}
              onRoleChange={handleQuickRoleChange}
              onAvatarUpdated={syncMember}
            />
          )}
        </div>
      </div>

      <Drawer open={drawer.open} onClose={closeDrawer} title={drawerTitle} subtitle={drawerSubtitle} size="md" dense
        footer={readOnly ? <Button variant="outline" size="sm" onClick={closeDrawer}>Close</Button> : (
          <>
            <Button variant="outline" size="sm" onClick={closeDrawer} disabled={saving}>Cancel</Button>
            <Button size="sm" onClick={handleSubmit} loading={saving}>{saveLabel}</Button>
          </>
        )}
      >
        <div className="crm-master-drawer-form" autoComplete="off">
          {(drawer.mode === 'edit' && drawerRecord) && (
            <div className="crm-staff-drawer-avatar">
              <StaffAvatarEditor
                userId={drawerRecord.id}
                name={fullName(drawerRecord)}
                avatar={drawerRecord.avatar}
                size="xl"
                canEdit={canUpdate}
                onUpdated={(user) => {
                  syncMember(user);
                  setDrawer((d) => ({ ...d, record: mergeMemberRecord(d.record, user) }));
                }}
              />
              <p className="crm-staff-drawer-avatar__hint">Profile photo shown across the app</p>
            </div>
          )}
          <MasterFormSection title="Personal Information">
            <div className="crm-master-drawer-grid crm-master-drawer-grid--2col">
              <FormField label="First name" required><Input value={form.firstName} onChange={(e) => setField('firstName', e.target.value)} disabled={readOnly} name="staff-first-name" autoComplete="off" /></FormField>
              <FormField label="Last name"><Input value={form.lastName} onChange={(e) => setField('lastName', e.target.value)} disabled={readOnly} name="staff-last-name" autoComplete="off" /></FormField>
              <div className="crm-master-drawer-grid__full"><FormField label="Email" required><Input type="email" value={form.email} onChange={(e) => setField('email', e.target.value)} disabled={readOnly || drawer.mode === 'edit'} name="staff-email" autoComplete="off" /></FormField></div>
              <FormField label="Phone"><Input value={form.phone} onChange={(e) => setField('phone', e.target.value)} disabled={readOnly} icon={FiPhone} name="staff-phone" autoComplete="off" /></FormField>
              <FormField label="Employee code"><Input value={form.employeeCode} onChange={(e) => setField('employeeCode', e.target.value)} disabled={readOnly} icon={FiHash} name="staff-employee-code" autoComplete="off" /></FormField>
              <FormField label="Department"><Input value={form.department} onChange={(e) => setField('department', e.target.value)} disabled={readOnly} icon={FiBriefcase} name="staff-department" autoComplete="off" /></FormField>
              <FormField label="Status"><Select value={form.status} onChange={(e) => setField('status', e.target.value)} options={USER_STATUS_FORM} disabled={readOnly} name="staff-status" autoComplete="off" /></FormField>
            </div>
          </MasterFormSection>
          <MasterFormSection title="Role & Branch Access">
            <div className="crm-master-drawer-grid crm-master-drawer-grid--2col">
              <div className="crm-master-drawer-grid__full">
                <FormField label="Role" required hint="Controls menus, buttons, and data scope">
                  <Select value={form.roleId} onChange={(e) => setField('roleId', e.target.value)} options={roleOptions} placeholder="Select role" disabled={readOnly} name="staff-role-id" autoComplete="off" />
                </FormField>
              </div>
              {formRole?.description && <p className="crm-master-drawer-hint crm-master-drawer-grid__full">{formRole.description}</p>}
              <div className="crm-master-drawer-grid__full">
                <FormField label="Home branch" required>
                  <Select
                    value={form.branchId || undefined}
                    onChange={(e) => setField('branchId', e.target.value)}
                    options={branchOptions}
                    placeholder={branchesLoading ? 'Loading…' : 'Select branch'}
                    disabled={readOnly || branchesLoading}
                    showSearch
                    name="staff-branch-id"
                    autoComplete="off"
                  />
                </FormField>
              </div>
            </div>
          </MasterFormSection>
          {!readOnly && (
            <MasterFormSection title="Security">
              <FormField label={drawer.mode === 'add' ? 'Password' : 'New password (optional)'} required={drawer.mode === 'add'}>
                <Input type="password" value={form.password} onChange={(e) => setField('password', e.target.value)} placeholder={drawer.mode === 'add' ? 'Min 8 characters' : 'Leave blank to keep current'} name="staff-new-password" autoComplete="new-password" />
              </FormField>
            </MasterFormSection>
          )}
        </div>
      </Drawer>
    </div>
  );
}
