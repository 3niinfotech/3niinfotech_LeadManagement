import { FiAlertTriangle, FiExternalLink, FiUser } from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import { getWalkInStatusLabel } from '../../config/walkin.constants';
import { getVisitorName, formatTimeShort } from '../../utils/reception.utils';

export default function DuplicateDetectionPanel({
  match,
  onContinueExisting,
  onOpenProfile,
  onDismiss,
}) {
  if (!match) return null;

  const name = getVisitorName(match);
  const meta = match.metadata || {};

  return (
    <div className="crm-reception-duplicate" role="alert">
      <div className="crm-reception-duplicate__glow" aria-hidden />
      <div className="crm-reception-duplicate__head">
        <FiAlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
        <div>
          <p className="crm-reception-duplicate__title">Existing person found</p>
          <p className="crm-reception-duplicate__sub">
            Mobile matches an active lead — avoid duplicate master records.
          </p>
        </div>
      </div>

      <div className="crm-reception-duplicate__card">
        <div className="crm-reception-duplicate__avatar">
          <FiUser className="w-6 h-6" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <p className="font-semibold text-text">{name}</p>
            <Badge color="warning" className="text-[10px]">
              {getWalkInStatusLabel(match.status)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-text-secondary">
            <span>Lead ID: {match.leadCode || '—'}</span>
            <span>Token: {match.tokenNumber || '—'}</span>
            <span>Mobile: {match.phone}</span>
            <span>Last visit: {formatTimeShort(match.walkInAt)}</span>
            <span>Country: {match.country || meta.interestedCountry || '—'}</span>
            <span>
              Counsellor:
              {' '}
              {match.assignedTo
                ? `${match.assignedTo.firstName} ${match.assignedTo.lastName || ''}`.trim()
                : 'Unassigned'}
            </span>
          </div>
        </div>
      </div>

      <div className="crm-reception-duplicate__actions">
        <Button size="sm" variant="outline" onClick={onDismiss}>
          Create New Visit
        </Button>
        <Button size="sm" icon={FiExternalLink} onClick={() => onOpenProfile?.(match.id)}>
          Open Profile
        </Button>
        <Button size="sm" variant="primary" onClick={() => onContinueExisting?.(match.id)}>
          Continue Existing
        </Button>
      </div>
    </div>
  );
}
