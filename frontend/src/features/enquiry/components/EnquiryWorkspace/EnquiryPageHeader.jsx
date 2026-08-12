import { Link } from 'react-router-dom';
import { FiArrowLeft, FiArrowUpRight, FiUser } from 'react-icons/fi';
import Breadcrumb from '../../../../components/layout/Breadcrumb';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import { ENQUIRY_STATUSES, ENQUIRY_PRIORITIES } from '../../../../config/constants';
import { ROUTES } from '../../../../config/routes';

function MetaItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="crm-enquiry-hero__meta-item">
      <span className="crm-enquiry-hero__meta-label">{label}</span>
      <span className="crm-enquiry-hero__meta-value">{value}</span>
    </div>
  );
}

/** Single header block — lead name & code shown once (not duplicated in subtitle strip) */
export default function EnquiryPageHeader({
  enquiry,
  breadcrumbs = [],
  quickActions,
  onBack,
}) {
  if (!enquiry) return null;

  const leadName = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim() || 'Lead';
  const status = ENQUIRY_STATUSES.find((s) => s.value === enquiry.status);
  const priority = ENQUIRY_PRIORITIES.find((p) => p.value === enquiry.priority);
  const nextFollowUp = enquiry.nextFollowUpAt
    ? new Date(enquiry.nextFollowUpAt).toLocaleDateString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
    })
    : null;
  const converted = enquiry.status === 'CONVERTED' && enquiry.studentId;

  return (
    <header className="crm-enquiry-hero">
      {breadcrumbs.length > 0 && (
        <div className="crm-enquiry-hero__crumb">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      <div className="crm-enquiry-hero__main">
        <div className="crm-enquiry-hero__lead">
          <div className="crm-enquiry-hero__avatar" aria-hidden>
            {leadName.charAt(0).toUpperCase()}
          </div>
          <div className="crm-enquiry-hero__info">
            <h1 className="crm-enquiry-hero__name">{leadName}</h1>
            <div className="crm-enquiry-hero__subline">
              {enquiry.enquiryCode && (
                <span className="crm-enquiry-hero__code">{enquiry.enquiryCode}</span>
              )}
              <div className="crm-enquiry-hero__badges">
                {status && <Badge color={status.color}>{status.label}</Badge>}
                {priority && <Badge color="secondary">{priority.label}</Badge>}
                {converted && <Badge color="success">Converted</Badge>}
              </div>
            </div>
          </div>
        </div>

        <div className="crm-enquiry-hero__actions">
          {quickActions}
          {onBack && (
            <Button variant="outline" icon={FiArrowLeft} onClick={onBack}>
              Back to list
            </Button>
          )}
        </div>
      </div>

      <div className="crm-enquiry-hero__meta-row">
        <div className="crm-enquiry-hero__meta-grid">
          <MetaItem label="Country" value={enquiry.interestedCountry} />
          <MetaItem label="Course" value={enquiry.interestedCourse} />
          <MetaItem label="Next follow-up" value={nextFollowUp} />
        </div>
        {converted && (
          <Link to={ROUTES.STUDENT_DETAIL(enquiry.studentId)} className="crm-enquiry-hero__student-link">
            <FiUser aria-hidden />
            Student profile
            <FiArrowUpRight aria-hidden />
          </Link>
        )}
      </div>
    </header>
  );
}
