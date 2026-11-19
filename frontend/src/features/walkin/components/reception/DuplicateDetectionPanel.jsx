import { FiAlertTriangle, FiExternalLink, FiUser, FiCheckCircle } from 'react-icons/fi';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import { getWalkInStatusLabel } from '../../config/walkin.constants';
import { getVisitorName, formatTimeShort } from '../../utils/reception.utils';

export default function DuplicateDetectionPanel({
  match,
  onContinueExisting,
  onOpenProfile,
}) {
  if (!match) return null;

  const name = match.name || getVisitorName(match);
  const matchType = match.matchType || 'LEAD';
  const matchedOn = match.matchedOn === 'both' ? 'Mobile Number & Email' : (match.matchedOn === 'email' ? 'Email Address' : 'Mobile Number');
  const code = match.code || match.leadCode || match.studentCode || match.enquiryCode || '—';
  const assignedToName = typeof match.assignedTo === 'string'
    ? match.assignedTo
    : (match.assignedTo ? `${match.assignedTo.firstName || ''} ${match.assignedTo.lastName || ''}`.trim() : '—');

  return (
    <div className="crm-reception-duplicate" role="alert" style={{ borderColor: 'var(--color-danger, #ef4444)' }}>
      <div className="crm-reception-duplicate__glow" aria-hidden style={{ background: 'rgba(239, 68, 68, 0.12)' }} />
      <div className="crm-reception-duplicate__head">
        <FiAlertTriangle className="w-5 h-5 text-red-500 shrink-0" />
        <div>
          <p className="crm-reception-duplicate__title font-bold text-red-700">
            Duplicate Entry Blocked ({matchType} Found)
          </p>
          <p className="crm-reception-duplicate__sub text-red-600">
            Matched by {matchedOn}. Re-registration is strictly blocked to maintain CRM data integrity.
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
            <Badge color={matchType === 'STUDENT' ? 'success' : 'warning'} className="text-[10px]">
              {matchType}: {getWalkInStatusLabel(match.status)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-text-secondary">
            <span>Reference ID: {code}</span>
            <span>Assigned: {assignedToName || 'Unassigned'}</span>
            <span>Mobile: {match.phone || '—'}</span>
            <span>Email: {match.email || '—'}</span>
            {match.branch && <span>Branch: {match.branch}</span>}
            {match.walkInAt && <span>Last visit: {formatTimeShort(match.walkInAt)}</span>}
          </div>
        </div>
      </div>

      <div className="crm-reception-duplicate__actions">
        {onOpenProfile && (
          <Button size="sm" variant="primary" icon={FiExternalLink} onClick={() => onOpenProfile(match.id)}>
            Open Existing {matchType === 'STUDENT' ? 'Student' : (matchType === 'ENQUIRY' ? 'Enquiry' : 'Lead')}
          </Button>
        )}
        {onContinueExisting && (
          <Button size="sm" variant="outline" onClick={() => onContinueExisting(match.id)}>
            Log Follow-up on Existing
          </Button>
        )}
      </div>
    </div>
  );
}
