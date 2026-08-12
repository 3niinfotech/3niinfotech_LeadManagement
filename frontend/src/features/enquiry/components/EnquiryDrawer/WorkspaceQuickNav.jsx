import { ENQUIRY_WORKSPACE_AREAS } from '../../config/enquiryWorkspace.config';

/** One-click jump to any workspace area — counsellor never leaves the lead */
export default function WorkspaceQuickNav({ activeTab, analyticsActive, onNavigate }) {
  return (
    <nav className="crm-workspace-quicknav" aria-label="Lead workspace areas">
      <p className="crm-workspace-quicknav__label">Workspace</p>
      <div className="crm-workspace-quicknav__track">
        {ENQUIRY_WORKSPACE_AREAS.map((area) => {
          const Icon = area.icon;
          const active = area.tab
            ? activeTab === area.tab
            : Boolean(analyticsActive);

          return (
            <button
              key={area.id}
              type="button"
              className={`crm-workspace-quicknav__chip${active ? ' crm-workspace-quicknav__chip--active' : ''}`}
              onClick={() => onNavigate(area)}
              title={area.label}
            >
              <Icon className="crm-workspace-quicknav__icon" aria-hidden />
              <span>{area.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
