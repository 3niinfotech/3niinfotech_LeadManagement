import { FiCheckCircle, FiMinusCircle, FiShield, FiXCircle } from 'react-icons/fi';

const KPI_ITEMS = [
  { key: 'all', statKey: null, label: 'All', icon: FiShield, tone: 'brand' },
  { key: 'granted', statKey: 'granted', label: 'Granted', icon: FiCheckCircle, tone: 'success' },
  { key: 'off', statKey: 'notSet', label: 'Off', icon: FiMinusCircle, tone: 'muted' },
  { key: 'restricted', statKey: 'restricted', label: 'Restricted', icon: FiXCircle, tone: 'danger' },
];

export default function RolePermissionSummary({
  stats,
  compact = false,
  activeFilter = 'all',
  onFilter,
}) {
  if (compact && onFilter) {
    return (
      <div className="crm-role-kpi-strip" role="group" aria-label="Permission filters">
        {KPI_ITEMS.map(({ key, statKey, label, icon: Icon, tone }) => {
          const value = statKey ? stats[statKey] : stats.total;
          const active = activeFilter === key;
          return (
            <button
              key={key}
              type="button"
              className={`crm-role-kpi-chip crm-role-kpi-chip--${tone} ${active ? 'crm-role-kpi-chip--active' : ''}`}
              onClick={() => onFilter(key)}
              aria-pressed={active}
            >
              <Icon size={14} />
              <span className="crm-role-kpi-chip__value">{value}</span>
              <span className="crm-role-kpi-chip__label">{label}</span>
            </button>
          );
        })}
      </div>
    );
  }

  const items = [
    { key: 'total', label: 'Total', value: stats.total, icon: FiShield, tone: 'brand' },
    { key: 'granted', label: 'Granted', value: stats.granted, icon: FiCheckCircle, tone: 'success' },
    { key: 'restricted', label: 'Restricted', value: stats.restricted, icon: FiXCircle, tone: 'danger' },
    { key: 'notSet', label: 'Off', value: stats.notSet, icon: FiMinusCircle, tone: 'muted' },
  ];

  return (
    <div className="crm-role-perm-summary">
      {items.map(({ key, label, value, icon: Icon, tone }) => (
        <div key={key} className={`crm-role-perm-summary__card crm-role-perm-summary__card--${tone}`}>
          <span className="crm-role-perm-summary__icon" aria-hidden>
            <Icon size={16} />
          </span>
          <span className="crm-role-perm-summary__value">{value}</span>
          <span className="crm-role-perm-summary__label">{label}</span>
        </div>
      ))}
    </div>
  );
}
