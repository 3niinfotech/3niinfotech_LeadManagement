import { FiArrowUpRight, FiBookOpen, FiCalendar, FiGlobe, FiUser } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import FormSection from '../../../../../components/ui/FormSection';
import Badge from '../../../../../components/ui/Badge';
import { ROUTES } from '../../../../../config/routes';
import { getEnquiryStatusLabel } from '../../../../../config/constants';

function formatDate(value) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Fact({ icon: Icon, label, value }) {
  return (
    <div className="crm-student-history-fact">
      <span className="crm-student-history-fact__label">
        {Icon && <Icon aria-hidden />}
        {label}
      </span>
      <span className="crm-student-history-fact__value">{value || '—'}</span>
    </div>
  );
}

export default function StudentEnquiryHistoryTab({ enquiry, lead, onTabChange }) {
  if (!enquiry) {
    return (
      <FormSection title="Enquiry record" description="Pre-admission counselling history linked to this student.">
        <div className="crm-student-history-empty">
          <p>No linked enquiry found for this student.</p>
        </div>
      </FormSection>
    );
  }

  const counsellor = enquiry.assignedTo
    ? `${enquiry.assignedTo.firstName || ''} ${enquiry.assignedTo.lastName || ''}`.trim()
    : null;

  return (
    <FormSection
      title="Enquiry record"
      description="This student was converted from an enquiry. The original counselling record is kept here — nothing is duplicated."
    >
      <div className="crm-student-history-panel crm-student-history-panel--clean">
        <header className="crm-student-history-hero">
          <div className="crm-student-history-hero__main">
            <p className="crm-student-history-hero__code">{enquiry.enquiryCode}</p>
            <p className="crm-student-history-hero__meta">
              Created {formatDate(enquiry.createdAt)}
              {enquiry.source ? ` · ${enquiry.source}` : ''}
              {enquiry.convertedAt ? ` · Converted ${formatDate(enquiry.convertedAt)}` : ''}
            </p>
          </div>
          <div className="crm-student-history-hero__actions">
            <Badge color="info">{getEnquiryStatusLabel(enquiry.status)}</Badge>
            <Link to={ROUTES.ENQUIRY_DETAIL(enquiry.id)} className="crm-student-history-hero__link">
              Open enquiry
              <FiArrowUpRight aria-hidden />
            </Link>
          </div>
        </header>

        <div className="crm-student-history-facts">
          <Fact icon={FiGlobe} label="Country" value={enquiry.interestedCountry} />
          <Fact icon={FiBookOpen} label="Course" value={enquiry.interestedCourse} />
          <Fact icon={FiUser} label="Counsellor" value={counsellor} />
          <Fact icon={FiCalendar} label="Intake" value={enquiry.intake} />
        </div>

        {(enquiry.remark || enquiry.lastRemark) && (
          <div className="crm-student-history-remark">
            <span className="crm-student-history-remark__label">Initial remark</span>
            <p>{enquiry.remark || enquiry.lastRemark}</p>
          </div>
        )}

        {lead && (
          <div className="crm-student-history-lead">
            <span className="crm-student-history-lead__chip">{lead.leadCode}</span>
            <span>{lead.source || 'Walk-in'}</span>
            {lead.walkInAt && <span>· {formatDate(lead.walkInAt)}</span>}
          </div>
        )}

        <div className="crm-student-history-footer">
          <p>Follow-ups, demos, calls and notes from the enquiry period are in the <strong>Timeline</strong> tab.</p>
          <button type="button" className="crm-student-history-footer__btn" onClick={() => onTabChange?.('timeline')}>
            View full timeline
          </button>
        </div>
      </div>
    </FormSection>
  );
}
