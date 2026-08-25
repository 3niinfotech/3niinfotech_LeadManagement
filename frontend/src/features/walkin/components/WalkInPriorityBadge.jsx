import Badge from '../../../components/ui/Badge';
import { getWalkInPriorityLabel, getWalkInPriorityMeta, toneToBadgeColor } from '../config/walkin.constants';

export default function WalkInPriorityBadge({ priority }) {
  const meta = getWalkInPriorityMeta(priority) || { label: priority, tone: 'neutral' };
  return <Badge color={toneToBadgeColor(meta.tone)}>{getWalkInPriorityLabel(priority)}</Badge>;
}
