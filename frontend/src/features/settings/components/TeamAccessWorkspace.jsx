import { useCallback, useEffect, useMemo, useState } from 'react';
import { FiShield, FiUsers } from 'react-icons/fi';
import Card from '../../../components/ui/Card';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import { buildTeamAccessSummaryItems } from '../../team-access/config/teamAccessSummary.config';
import TeamMembersPanel from '../../team-access/components/TeamMembersPanel';
import RolesAccessPanel from '../../team-access/components/RolesAccessPanel';
import TeamAccessHelpMenu from '../../team-access/components/TeamAccessHelpMenu';
import '../../team-access/styles/team-access.theme.css';

const TABS = [
  { id: 'team', label: 'Team members', icon: FiUsers, permission: PERMISSIONS.USERS_VIEW },
  { id: 'roles', label: 'Roles & permissions', icon: FiShield, permission: PERMISSIONS.ROLES_VIEW },
];

export default function TeamAccessWorkspace({
  activeTab: activeTabProp = 'team',
  focusRoleId = null,
  onTabChange,
}) {
  const { can } = usePermissions();
  const canViewTeam = can(PERMISSIONS.USERS_VIEW);
  const canViewRoles = can(PERMISSIONS.ROLES_VIEW);

  const [internalTab, setInternalTab] = useState(activeTabProp);
  const [internalRoleId, setInternalRoleId] = useState(focusRoleId);
  const [summaryState, setSummaryState] = useState({ teamTotal: 0, activeCount: 0, summary: null });
  const [kpiFilter, setKpiFilter] = useState(null);

  const activeTab = onTabChange ? activeTabProp : internalTab;
  const roleFocus = onTabChange ? focusRoleId : internalRoleId;

  useEffect(() => {
    if (!onTabChange) setInternalTab(activeTabProp);
  }, [activeTabProp, onTabChange]);

  useEffect(() => {
    if (!onTabChange) setInternalRoleId(focusRoleId);
  }, [focusRoleId, onTabChange]);

  const visibleTabs = TABS.filter((t) => can(t.permission));

  const setTab = useCallback((tabId, extra = {}) => {
    if (onTabChange) {
      onTabChange(tabId, extra);
      return;
    }
    setInternalTab(tabId);
    setInternalRoleId(extra.roleId || null);
  }, [onTabChange]);

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
      <Card className="text-center !p-10">
        <p className="text-text-muted">You do not have permission to manage team or access.</p>
      </Card>
    );
  }

  return (
    <div className="crm-team-access crm-team-access--embedded">
      <div className="crm-settings-team-bar">
        {visibleTabs.length > 1 && (
          <div className="crm-team-access-tabs crm-team-access-tabs--inline" role="tablist">
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
                  <Icon size={14} />
                  <span className="crm-team-access-tab__label">{tab.label}</span>
                </button>
              );
            })}
          </div>
        )}
        <TeamAccessHelpMenu activeTab={activeTab} />
      </div>

      <SummaryStatBar
        items={kpiItems}
        loading={false}
        activeFilter={kpiFilter}
        onSelect={handleKpiSelect}
        className="crm-settings-team-kpis"
      />

      <div className="crm-team-access-content crm-team-access-content--embedded">
        {activeTab === 'team' && canViewTeam && (
          <TeamMembersPanel
            statusFilterExternal={kpiFilter}
            onSummaryUpdate={handleSummaryUpdate}
            onManageRole={(roleId) => setTab('roles', { roleId })}
          />
        )}
        {activeTab === 'roles' && canViewRoles && (
          <RolesAccessPanel focusRoleId={roleFocus} />
        )}
      </div>
    </div>
  );
}
