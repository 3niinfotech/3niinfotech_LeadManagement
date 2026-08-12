import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiUser } from 'react-icons/fi';
import Badge from '../../../../components/ui/Badge';
import { ENQUIRY_STATUSES, ENQUIRY_PRIORITIES } from '../../../../config/constants';
import { ROUTES } from '../../../../config/routes';

function MetaChip({ label, value }) {
  if (!value) return null;
  return (
    <div className="crm-enquiry-summary__chip">
      <span className="crm-enquiry-summary__chip-label">{label}</span>
      <span className="crm-enquiry-summary__chip-value">{value}</span>
    </div>
  );
}

export default function EnquirySummaryStrip({ enquiry }) {
  if (!enquiry) return null;

  const status = ENQUIRY_STATUSES.find((s) => s.value === enquiry.status);
  const priority = ENQUIRY_PRIORITIES.find((p) => p.value === enquiry.priority);
  const counsellor = enquiry.assignedTo
    ? `${enquiry.assignedTo.firstName} ${enquiry.assignedTo.lastName}`.trim()
    : null;
  const counsellorInitials = counsellor
    ? counsellor.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : null;
  const nextFollowUp = enquiry.nextFollowUpAt
    ? new Date(enquiry.nextFollowUpAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
    : null;
  const converted = enquiry.status === 'CONVERTED' && enquiry.studentId;
  const leadName = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim();

  return (
    <div className="crm-enquiry-summary">
      <div className="crm-enquiry-summary__lead">
        <div className="crm-enquiry-summary__avatar" aria-hidden>
          {(leadName || '?').charAt(0).toUpperCase()}
        </div>
        <div className="crm-enquiry-summary__lead-text">
          <span className="crm-enquiry-summary__lead-name">{leadName || 'Lead'}</span>
          {enquiry.enquiryCode && (
            <span className="crm-enquiry-summary__lead-code">{enquiry.enquiryCode}</span>
          )}
        </div>
      </div>

      <div className="crm-enquiry-summary__badges">
        {status && <Badge color={status.color}>{status.label}</Badge>}
        {priority && <Badge color="secondary">{priority.label}</Badge>}
        {converted && <Badge color="success">Converted</Badge>}
      </div>

      <div className="crm-enquiry-summary__meta">
        <MetaChip label="Source" value={enquiry.source} />
        <MetaChip label="Country" value={enquiry.interestedCountry} />
        <MetaChip label="Course" value={enquiry.interestedCourse} />
        {counsellor && (
          <div className="crm-enquiry-summary__chip crm-enquiry-summary__chip--counsellor">
            <span className="crm-enquiry-summary__chip-label">Counsellor</span>
            <span className="crm-enquiry-summary__counsellor">
              <span className="crm-enquiry-summary__counsellor-avatar">{counsellorInitials}</span>
              <span className="crm-enquiry-summary__chip-value">{counsellor}</span>
            </span>
          </div>
        )}
        <MetaChip label="Next follow-up" value={nextFollowUp} />
      </div>

      {converted && (
        <Link to={ROUTES.STUDENT_DETAIL(enquiry.studentId)} className="crm-enquiry-summary__cta">
          <FiUser className="crm-enquiry-summary__cta-icon" aria-hidden />
          Student profile
          <FiArrowUpRight className="crm-enquiry-summary__cta-arrow" aria-hidden />
        </Link>
      )}
    </div>
  );
}
