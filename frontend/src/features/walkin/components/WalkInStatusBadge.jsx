import Badge from '../../../components/ui/Badge';
import { getWalkInStatusLabel, getWalkInStatusMeta } from '../config/walkin.constants';

export default function WalkInStatusBadge({ status, onChange, compact = false }) {
  const meta = getWalkInStatusMeta(status) || { label: status, tone: 'neutral' };

  if (!onChange) {
    return <Badge tone={meta.tone} size={compact ? 'sm' : 'md'}>{meta.label}</Badge>;
  }

  return (
    <select
      className="crm-walkin-status-select"
      value={status}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      title={getWalkInStatusLabel(status)}
    >
      {['WAITING', 'IN_COUNSELLING', 'COMPLETED', 'CANCELLED', 'APPOINTMENT'].map((value) => (
        <option key={value} value={value}>{getWalkInStatusLabel(value)}</option>
      ))}
    </select>
  );
}
