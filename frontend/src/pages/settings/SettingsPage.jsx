import { useCallback, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FiSliders } from 'react-icons/fi';
import ModulePageCard from '../../components/layout/ModulePageLayout';
import { ROUTES } from '../../config/routes';
import {
  SETTINGS_CONSOLE_GROUPS,
  SETTINGS_DEFAULT_SECTION,
  getSettingsSection,
} from '../../config/settings-console.config';
import { usePermissions } from '../../hooks/usePermissions';
import NotificationPreferencesCard from '../../features/settings/components/NotificationPreferencesCard';
import FeatureTogglePanel from '../../features/settings/components/FeatureTogglePanel';
import CompanySettingsWorkspace from '../../features/settings/components/CompanySettingsWorkspace';
import TeamAccessWorkspace from '../../features/settings/components/TeamAccessWorkspace';
import MasterHubWorkspace from '../../features/settings/components/MasterHubWorkspace';
import '../../features/settings/styles/settings.theme.css';

export default function SettingsPage() {
  const { canAny } = usePermissions();
  const [params, setParams] = useSearchParams();

  const groups = useMemo(
    () =>
      SETTINGS_CONSOLE_GROUPS.map((group) => ({
        ...group,
        sections: group.sections.filter(
          (s) => !s.permissions?.length || canAny(s.permissions),
        ),
      })).filter((g) => g.sections.length > 0),
    [canAny],
  );

  const allowedIds = useMemo(
    () => groups.flatMap((g) => g.sections.map((s) => s.id)),
    [groups],
  );

  const requested = params.get('tab') || SETTINGS_DEFAULT_SECTION;
  const activeId = allowedIds.includes(requested)
    ? requested
    : (allowedIds[0] || SETTINGS_DEFAULT_SECTION);
  const active = getSettingsSection(activeId);

  const teamSubTab = params.get('sub') === 'roles' ? 'roles' : 'team';
  const focusRoleId = params.get('roleId') || null;

  useEffect(() => {
    if (!allowedIds.length) return;
    if (params.get('tab') === activeId) return;
    const next = new URLSearchParams();
    next.set('tab', activeId);
    setParams(next, { replace: true });
  }, [activeId, allowedIds, params, setParams]);

  const selectSection = (id) => {
    setParams({ tab: id });
  };

  const handleTeamTabChange = useCallback((tabId, extra = {}) => {
    const next = new URLSearchParams(params);
    next.set('tab', 'team-access');
    if (tabId === 'roles') next.set('sub', 'roles');
    else next.delete('sub');
    if (extra.roleId) next.set('roleId', extra.roleId);
    else next.delete('roleId');
    setParams(next, { replace: true });
  }, [params, setParams]);

  return (
    <ModulePageCard
      title="Settings"
      subtitle="Manage company, team, features, and reference data — all in one place"
      icon={FiSliders}
      iconColor="secondary"
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Settings' },
      ]}
    >
      <div className="crm-settings flex-1 min-h-0">
        <aside className="crm-settings__rail" aria-label="Settings sections">
          {groups.map((group) => (
            <div key={group.id} className="crm-settings__group">
              <p className="crm-settings__group-label">{group.label}</p>
              {group.sections.map((section) => {
                const Icon = section.icon;
                const isActive = section.id === activeId;
                return (
                  <button
                    key={section.id}
                    type="button"
                    className={`crm-settings__nav-btn${isActive ? ' crm-settings__nav-btn--active' : ''}`}
                    aria-current={isActive ? 'page' : undefined}
                    onClick={() => selectSection(section.id)}
                  >
                    {Icon ? <Icon strokeWidth={1.75} /> : null}
                    <span className="truncate">{section.label}</span>
                  </button>
                );
              })}
            </div>
          ))}
        </aside>

        <div className="crm-settings__main">
          {active && (
            <>
              <header className="crm-settings__main-head">
                <h2>{active.label}</h2>
                <p>{active.description}</p>
              </header>
              <div className={`crm-settings__main-body ${active.id === 'team-access' || active.id === 'company' ? 'crm-settings__main-body--wide' : ''}`}>
                {active.id === 'notifications' && (
                  <div className="crm-settings-notify">
                    <NotificationPreferencesCard embedded />
                  </div>
                )}
                {active.id === 'company' && <CompanySettingsWorkspace embedded />}
                {active.id === 'team-access' && (
                  <TeamAccessWorkspace
                    activeTab={teamSubTab}
                    focusRoleId={focusRoleId}
                    onTabChange={handleTeamTabChange}
                  />
                )}
                {active.id === 'features' && <FeatureTogglePanel />}
                {active.id === 'masters' && <MasterHubWorkspace />}
              </div>
            </>
          )}
        </div>
      </div>
    </ModulePageCard>
  );
}
