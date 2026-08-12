import { Link } from 'react-router-dom';
import Badge from '../../../../components/ui/Badge';
import { STUDENT_STATUSES } from '../../../../config/constants';
import { ROUTES } from '../../../../config/routes';

function MetaItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="crm-enquiry-summary__item">
      <span className="crm-enquiry-summary__label">{label}</span>
      <span className="crm-enquiry-summary__value">{value}</span>
    </div>
  );
}

export default function StudentSummaryStrip({ student }) {
  if (!student) return null;

  const status = STUDENT_STATUSES.find((s) => s.value === student.status);
  const counsellor = student.assignedTo
    ? `${student.assignedTo.firstName} ${student.assignedTo.lastName}`.trim()
    : null;
  const enquiryId = student.metadata?.enquiryId;
  const enquiryCode = student.metadata?.enquiryCode;

  return (
    <div className="crm-enquiry-summary">
      <div className="crm-enquiry-summary__badges">
        {status && <Badge color={status.color}>{status.label}</Badge>}
        {student.studentCode && <Badge color="secondary">{student.studentCode}</Badge>}
      </div>
      <div className="crm-enquiry-summary__meta">
        <MetaItem label="Country" value={student.country} />
        <MetaItem label="Course" value={student.course} />
        <MetaItem label="University" value={student.university} />
        <MetaItem label="Intake" value={student.intake} />
        <MetaItem label="Counsellor" value={counsellor} />
      </div>
      {enquiryId && (
        <Link to={ROUTES.ENQUIRY_DETAIL(enquiryId)} className="crm-enquiry-summary__link">
          From enquiry {enquiryCode || ''} →
        </Link>
      )}
    </div>
  );
}
