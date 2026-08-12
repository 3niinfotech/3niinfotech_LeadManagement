import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiFilter, FiRefreshCw, FiSearch, FiUsers } from 'react-icons/fi';
import PageShell from '../../components/layout/PageShell';
import ModulePageHeader from '../../components/layout/ModulePageHeader';
import Card from '../../components/ui/Card';
import Input from '../../components/ui/Input';
import Select from '../../components/ui/Select';
import Button from '../../components/ui/Button';
import Avatar from '../../components/ui/Avatar';
import RoleBadge from '../../components/profile/RoleBadge';
import { WorkloadStats } from '../../components/profile/ProfileSections';
import { userService } from '../../services/user/user.service';
import { ROUTES } from '../../config/routes';
import { getRoleMeta } from '../../config/roles';
import { usePermissions } from '../../hooks/usePermissions';
import TableLoader from '../../components/ui/TableLoader';
import Skeleton from '../../components/ui/Skeleton';

export default function UsersPage() {
  const navigate = useNavigate();
  const { canManageUsers, isSuperAdmin } = usePermissions();
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [roles, setRoles] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [filters, setFilters] = useState({ search: '', role: '' });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [usersRes, summaryRes, rolesRes] = await Promise.all([
        userService.getAll({ limit: 100, search: filters.search || undefined, role: filters.role || undefined }),
        userService.getTeamSummary(),
        userService.getRoles(),
      ]);
      const list = usersRes.data || [];
      setUsers(list);
      setSummary(summaryRes);
      setRoles(rolesRes || []);
      setSelectedUser((prev) => prev || list[0] || null);
    } finally {
      setLoading(false);
    }
  }, [filters.search, filters.role]);

  useEffect(() => {
    if (canManageUsers) load();
  }, [canManageUsers, load]);

  const roleOptions = useMemo(
    () => [{ value: '', label: 'All roles' }, ...roles.map((r) => ({ value: r.slug, label: r.name }))],
    [roles],
  );

  if (!canManageUsers) {
    return (
      <PageShell>
        <Card className="text-center !p-12">
          <p className="text-text-muted">You do not have permission to view team members.</p>
          <Button className="mt-4" onClick={() => navigate(ROUTES.DASHBOARD)}>Go to Dashboard</Button>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <ModulePageHeader
        title="Team & Access"
        subtitle={isSuperAdmin ? 'Super Admin — full visibility of roles, users, and workload' : 'Admin view of team members and assignments'}
        icon={FiUsers}
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Users' }]}
      />

      {loading && !users.length ? (
        <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
          <Card className="xl:col-span-2 !p-0 overflow-hidden min-h-[480px]">
            <TableLoader rows={10} columns={3} showCheckbox={false} showPagination={false} />
          </Card>
          <Card className="xl:col-span-3 !p-6 space-y-4">
            <div className="flex gap-4">
              <Skeleton className="w-16 h-16 shrink-0" rounded="full" />
              <div className="flex-1 space-y-2 pt-1">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-56" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-24 w-full" rounded="lg" />
            <Skeleton className="h-24 w-full" rounded="lg" />
          </Card>
        </div>
      ) : (
        <>
      {summary && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          {summary.roles?.map((role) => {
            const meta = getRoleMeta(role.slug);
            return (
              <Card key={role.id} padding className="!p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">{meta.label}</p>
                <p className="text-2xl font-bold text-text mt-1 tabular-nums">{role._count?.users || 0}</p>
                <p className="text-[11px] text-text-muted mt-1">active users</p>
              </Card>
            );
          })}
          <Card className="!p-4 border-dashed">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-text-muted">Unassigned</p>
            <p className="text-2xl font-bold text-danger mt-1 tabular-nums">{summary.totals?.unassignedEnquiries || 0}</p>
            <p className="text-[11px] text-text-muted mt-1">enquiries</p>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <Card className="xl:col-span-2 !p-0 overflow-hidden flex flex-col min-h-[480px]">
          <div className="p-4 border-b border-border space-y-3">
            <div className="flex items-center gap-2">
              <Input
                value={filters.search}
                onChange={(e) => setFilters((f) => ({ ...f, search: e.target.value }))}
                placeholder="Search name or email..."
                icon={FiSearch}
                size="sm"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={filters.role}
                onChange={(v) => setFilters((f) => ({ ...f, role: v }))}
                options={roleOptions}
                placeholder="Filter by role"
                size="sm"
                className="flex-1"
              />
              <Button variant="outline" size="sm" icon={FiRefreshCw} onClick={load}>Refresh</Button>
            </div>
          </div>

          <ul className="flex-1 overflow-y-auto scroll-area divide-y divide-border">
            {users.map((user) => {
              const name = [user.firstName, user.lastName].filter(Boolean).join(' ');
              const isActive = selectedUser?.id === user.id;
              return (
                <li key={user.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedUser(user)}
                    className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                      isActive ? 'bg-brand-soft border-l-2 border-brand' : 'hover:bg-row-hover'
                    }`}
                  >
                    <Avatar name={name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-text truncate">{name}</p>
                      <p className="text-[11px] text-text-muted truncate">{user.email}</p>
                    </div>
                    <span className="text-[11px] font-bold text-brand tabular-nums shrink-0">
                      {user.workload?.total || 0}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        <Card className="xl:col-span-3">
          {selectedUser ? (
            <div className="space-y-5">
              <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                <Avatar
                  name={[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ')}
                  size="lg"
                  className="w-16 h-16 text-lg ring-4 ring-brand-soft"
                />
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold text-text">
                    {[selectedUser.firstName, selectedUser.lastName].filter(Boolean).join(' ')}
                  </h2>
                  <p className="text-sm text-text-secondary mt-0.5">{selectedUser.email}</p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <RoleBadge slug={selectedUser.role?.slug} name={selectedUser.role?.name} />
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-page border border-border text-text-muted">
                      {selectedUser.branch?.name || 'No branch'}
                    </span>
                    <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${
                      selectedUser.status === 'ACTIVE' ? 'bg-success-soft text-success' : 'bg-danger-soft text-danger'
                    }`}>
                      {selectedUser.status}
                    </span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text mb-3">Assignment workload</h3>
                <WorkloadStats workload={selectedUser.workload} />
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Role description</h3>
                <p className="text-sm text-text-secondary leading-relaxed">
                  {getRoleMeta(selectedUser.role?.slug).description}
                </p>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-text mb-2">Handles</h3>
                <div className="flex flex-wrap gap-2">
                  {['enquiries', 'leads', 'students'].map((module) => {
                    const count = selectedUser.workload?.[module] || 0;
                    return (
                      <span
                        key={module}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border bg-page text-[12px] font-medium text-text-secondary"
                      >
                        <FiFilter className="w-3 h-3 text-brand" />
                        {module}: <strong className="text-text">{count}</strong>
                      </span>
                    );
                  })}
                </div>
              </div>

              {isSuperAdmin && (
                <div className="rounded-lg border border-brand/20 bg-brand-soft/30 p-3">
                  <p className="text-[12px] text-text-secondary">
                    <strong className="text-brand">Super Admin view:</strong> This user has{' '}
                    <strong>{selectedUser.role?.permissions?.length || 0}</strong> permissions via the{' '}
                    <strong>{selectedUser.role?.name}</strong> role.
                  </p>
                </div>
              )}
            </div>
          ) : (
            <p className="text-text-muted text-center py-12">Select a team member</p>
          )}
        </Card>
      </div>
        </>
      )}
    </PageShell>
  );
}
