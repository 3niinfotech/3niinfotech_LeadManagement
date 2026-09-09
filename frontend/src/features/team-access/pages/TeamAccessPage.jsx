import { useCallback, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiShield, FiUsers } from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import ModulePageHeader from '../../../components/layout/ModulePageHeader';
import Card from '../../../components/ui/Card';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { buildTeamAccessSummaryItems } from '../config/teamAccessSummary.config';
import TeamMembersPanel from '../components/TeamMembersPanel';
import RolesAccessPanel from '../components/RolesAccessPanel';
import TeamAccessHelpMenu from '../components/TeamAccessHelpMenu';
import '../styles/team-access.theme.css';

const TABS = [
  { id: 'team', label: 'Team members', icon: FiUsers, permission: PERMISSIONS.USERS_VIEW },
  { id: 'roles', label: 'Roles & permissions', icon: FiShield, permission: PERMISSIONS.ROLES_VIEW },
];

export default function TeamAccessPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { can } = usePermissions();

  const canViewTeam = can(PERMISSIONS.USERS_VIEW);
  const canViewRoles = can(PERMISSIONS.ROLES_VIEW);

  const requestedTab = searchParams.get('tab') === 'roles' ? 'roles' : 'team';
  const focusRoleId = searchParams.get('roleId') || null;

  const activeTab = useMemo(() => {
    if (requestedTab === 'roles' && canViewRoles) return 'roles';
    if (canViewTeam) return 'team';
    if (canViewRoles) return 'roles';
    return 'team';
  }, [requestedTab, canViewTeam, canViewRoles]);

  const [summaryState, setSummaryState] = useState({
    teamTotal: 0,
    activeCount: 0,
    summary: null,
  });
  const [kpiFilter, setKpiFilter] = useState(null);

  const visibleTabs = TABS.filter((t) => can(t.permission));

  const setTab = useCallback((tabId, extra = {}) => {
    const next = new URLSearchParams(searchParams);
    if (tabId === 'roles') next.set('tab', 'roles');
    else next.delete('tab');
    if (extra.roleId) next.set('roleId', extra.roleId);
    else next.delete('roleId');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const handleSummaryUpdate = useCallback(({ summary, teamTotal, activeCount }) => {
    setSummaryState({ summary, teamTotal, activeCount });
  }, []);

  const kpiItems = useMemo(() => buildTeamAccessSummaryItems({
    teamTotal: summaryState.teamTotal,
    activeCount: summaryState.activeCount,
    rolesInUse: summaryState.summary?.roles?.filter((r) => r._count?.users > 0).length || 0,
    unassignedEnquiries: summaryState.summary?.totals?.unassignedEnquiries ?? 0,
  }), [summaryState]);

  const handleKpiSelect = (filterValue) => {
    if (filterValue === '__roles__') {
      setTab('roles');
      setKpiFilter(null);
      return;
    }
    if (filterValue === 'ACTIVE') {
      setTab('team');
      setKpiFilter('ACTIVE');
      return;
    }
    setTab('team');
    setKpiFilter(null);
  };

  if (!canViewTeam && !canViewRoles) {
    return (
      <PageShell>
        <Card className="text-center !p-12">
          <p className="text-text-muted">You do not have permission to manage team or access.</p>
        </Card>
      </PageShell>
    );
  }

  return (
    <PageShell scroll={false} className="crm-team-access">
      <ModulePageHeader
        title="Team & Access"
        subtitle="Add team members, assign roles, and manage permissions — all in one place"
        icon={FiShield}
        className="crm-team-access-header"
        breadcrumbs={[
          { label: 'Dashboard', path: ROUTES.DASHBOARD },
          { label: 'Team & Access' },
        ]}
        actions={(
          <div className="crm-team-access-header-actions">
            {visibleTabs.length > 1 && (
              <div className="crm-team-access-tabs" role="tablist" aria-label="Team and access sections">
                {visibleTabs.map((tab) => {
                  const Icon = tab.icon;
                  const active = activeTab === tab.id;
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      className={`crm-team-access-tab ${active ? 'crm-team-access-tab--active' : ''}`}
                      onClick={() => setTab(tab.id)}
                    >
                      <Icon size={15} />
                      <span className="crm-team-access-tab__label">{tab.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
            <TeamAccessHelpMenu activeTab={activeTab} />
          </div>
        )}
      />

      <div className="crm-team-access__kpis">
        <SummaryStatBar
          items={kpiItems}
          loading={false}
          activeFilter={kpiFilter}
          onSelect={handleKpiSelect}
        />
      </div>

      <div className="crm-team-access__body">
        <Card className="crm-team-access-content !p-3 md:!p-3.5">
        {activeTab === 'team' && canViewTeam && (
          <TeamMembersPanel
            statusFilterExternal={kpiFilter}
            onSummaryUpdate={handleSummaryUpdate}
            onManageRole={(roleId) => setTab('roles', { roleId })}
          />
        )}
        {activeTab === 'roles' && canViewRoles && (
          <RolesAccessPanel focusRoleId={focusRoleId} />
        )}
        </Card>
      </div>
    </PageShell>
  );
}
