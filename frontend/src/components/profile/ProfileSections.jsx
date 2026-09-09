import { FiInbox, FiLayers, FiUserPlus, FiUsers } from 'react-icons/fi';
import '../../pages/profile/profile.theme.css';

export function WorkloadStats({ workload, compact = false }) {
  if (!workload) return null;

  const items = [
    { label: 'Enquiries', value: workload.enquiries, icon: FiInbox },
    { label: 'Leads', value: workload.leads, icon: FiUserPlus },
    { label: 'Students', value: workload.students, icon: FiUsers },
    { label: 'Total', value: workload.total, icon: FiLayers },
  ].filter((item) => item.value != null);

  const shown = compact ? items.slice(0, 4) : items;

  return (
    <div className="crm-profile__stats">
      {shown.map(({ label, value }) => (
        <div key={label} className="crm-profile__stat">
          <p className="crm-profile__stat-label">{label}</p>
          <p className="crm-profile__stat-value">{value ?? 0}</p>
        </div>
      ))}
    </div>
  );
}

export function ProfileInfoRow({ icon: Icon, label, value }) {
  return (
    <div className="crm-profile__meta-row">
      <span className="crm-profile__meta-icon" aria-hidden>
        <Icon className="h-3.5 w-3.5" />
      </span>
      <div className="min-w-0">
        <p className="crm-profile__meta-label">{label}</p>
        <p className="crm-profile__meta-value">{value || '—'}</p>
      </div>
    </div>
  );
}
