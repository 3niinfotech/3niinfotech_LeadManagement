import { FiAlertTriangle, FiExternalLink } from 'react-icons/fi';
import Modal from '../../../../components/ui/Modal';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import { getEnquiryStatusLabel } from '../../../../config/constants';
import { getDuplicateFieldLabel } from '../../config/enquiryDuplicate.config';

export default function DuplicateFoundModal({
  open,
  matches = [],
  onClose,
  onViewRecord,
}) {
  const primary = matches[0];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Possible Duplicate Found"
      subtitle="Same email or mobile already exists — use the existing record instead of creating another."
      size="md"
      footer={(
        <>
          {primary && (
            <Button icon={FiExternalLink} onClick={() => onViewRecord?.(primary)}>
              Use existing record
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Create duplicate anyway
          </Button>
        </>
      )}
    >
      <div className="crm-duplicate-modal space-y-4">
        <div className="crm-duplicate-modal__alert">
          <FiAlertTriangle className="w-5 h-5 shrink-0" />
          <p className="text-sm">
            Matched on
            {' '}
            {primary?.matchedOn?.map(getDuplicateFieldLabel).join(', ') || 'contact details'}.
            {' '}
            One person should have one enquiry — open the existing record and add follow-up or demo there.
          </p>
        </div>

        <div className="space-y-3">
          {matches.map((match) => (
            <div key={match.id} className="crm-duplicate-modal__card">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <p className="text-sm font-semibold text-text">
                  {match.enquiryCode}
                  {' · '}
                  {`${match.firstName || ''} ${match.lastName || ''}`.trim()}
                </p>
                <Badge color="warning" className="text-[10px]">
                  {getEnquiryStatusLabel(match.status)}
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[12px] text-text-secondary">
                <span>Email: {match.email || '—'}</span>
                <span>Mobile: {match.mobile || '—'}</span>
                {match.alternateNo && <span>Alternate: {match.alternateNo}</span>}
                {match.passportNo && <span>Passport: {match.passportNo}</span>}
              </div>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {match.matchedOn?.map((field) => (
                  <Badge key={field} color="danger" className="text-[10px]">
                    Matched {getDuplicateFieldLabel(field)}
                  </Badge>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </Modal>
  );
}
