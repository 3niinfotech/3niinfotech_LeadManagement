import Badge from '../../../components/ui/Badge';
import { getWalkInStatusLabel, getWalkInStatusMeta, toneToBadgeColor } from '../config/walkin.constants';

export default function WalkInStatusBadge({ status, onChange, compact = false }) {
  const meta = getWalkInStatusMeta(status) || { label: status, tone: 'neutral' };

  if (!onChange) {
    return (
      <Badge color={toneToBadgeColor(meta.tone)} className={compact ? 'text-[0.6875rem] px-2' : ''}>
        {meta.label}
      </Badge>
    );
  }

  return (
    <select
      className="crm-walkin-status-select"
      value={status}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      title={getWalkInStatusLabel(status)}
    >
      {['WALK_IN', 'IN_COUNSELLING', 'COMPLETED', 'CANCELLED', 'APPOINTMENT'].map((value) => (
        <option key={value} value={value}>{getWalkInStatusLabel(value)}</option>
      ))}
    </select>
  );
}
