import { Link } from 'react-router-dom';
import Badge from '../../../../components/ui/Badge';
import { STUDENT_STATUSES } from '../../../../config/constants';
import { ROUTES } from '../../../../config/routes';
import { useStudentStatusOptions } from '../../hooks/useStudentStatusOptions';

function MetaItem({ label, value }) {
  if (!value) return null;
  return (
    <div className="crm-enquiry-summary__item">
      <span className="crm-enquiry-summary__label">{label}</span>
      <span className="crm-enquiry-summary__value font-medium">{value}</span>
    </div>
  );
}

export default function StudentSummaryStrip({ student }) {
  const { getStatusMeta } = useStudentStatusOptions();
  if (!student) return null;

  const meta = getStatusMeta(student.status);
  const statusMeta = meta || STUDENT_STATUSES.find((s) => s.value === student.status);
  const counsellor = student.assignedTo
    ? `${student.assignedTo.firstName || ''} ${student.assignedTo.lastName || ''}`.trim()
    : null;
  const enquiryId = student.metadata?.enquiryId || student.enquiry?.id;
  const enquiryCode = student.metadata?.enquiryCode || student.enquiry?.enquiryCode;

  return (
    <div className="crm-enquiry-summary">
      <div className="crm-enquiry-summary__badges">
        {statusMeta && (
          <Badge color={statusMeta.color || 'primary'}>
            {statusMeta.label || student.status}
          </Badge>
        )}
        {student.studentCode && (
          <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
            {student.studentCode}
          </span>
        )}
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
          Enquiry {enquiryCode || ''} →
        </Link>
      )}
    </div>
  );
}
