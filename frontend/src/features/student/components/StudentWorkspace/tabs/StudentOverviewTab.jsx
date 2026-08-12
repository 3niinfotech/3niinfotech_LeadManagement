import { Link } from 'react-router-dom';
import FormSection from '../../../../../components/ui/FormSection';
import Badge from '../../../../../components/ui/Badge';
import { STUDENT_STATUSES } from '../../../../../config/constants';
import { ROUTES } from '../../../../../config/routes';

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-[0.65rem] font-semibold uppercase tracking-wide text-text-muted">{label}</span>
      <span className="text-sm text-text">{value || '—'}</span>
    </div>
  );
}

export default function StudentOverviewTab({ student }) {
  if (!student) return null;

  const status = STUDENT_STATUSES.find((s) => s.value === student.status);
  const enquiryId = student.metadata?.enquiryId;

  return (
    <div className="space-y-4">
      <FormSection title="Student Snapshot" description="Key details at a glance.">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          <InfoRow label="Name" value={`${student.firstName} ${student.lastName}`.trim()} />
          <InfoRow label="Email" value={student.email} />
          <InfoRow label="Phone" value={student.phone} />
          <InfoRow label="Status" value={status?.label || student.status} />
          <InfoRow label="Country" value={student.country} />
          <InfoRow label="Course" value={student.course} />
          <InfoRow label="University" value={student.university} />
          <InfoRow label="Intake" value={student.intake} />
        </div>
        {status && (
          <div className="mt-3">
            <Badge color={status.color}>{status.label}</Badge>
          </div>
        )}
      </FormSection>

      {enquiryId && (
        <FormSection title="Source Enquiry" description="This student was converted from an enquiry.">
          <Link to={ROUTES.ENQUIRY_DETAIL(enquiryId)} className="text-sm font-medium text-primary hover:underline">
            View enquiry {student.metadata?.enquiryCode || ''}
          </Link>
        </FormSection>
      )}

      <FormSection title="Quick counts" description="Records linked to this student.">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Applications', count: student.applications?.length ?? 0 },
            { label: 'Visa cases', count: student.visas?.length ?? 0 },
            { label: 'Documents', count: student.documents?.length ?? 0 },
            { label: 'Notes', count: student.notes?.length ?? 0 },
          ].map(({ label, count }) => (
            <div
              key={label}
              className="rounded-lg border border-border bg-[color-mix(in_srgb,var(--bg-page)_40%,transparent)] px-3 py-2.5"
            >
              <p className="text-xs text-text-muted">{label}</p>
              <p className="text-lg font-semibold text-text tabular-nums">{count}</p>
            </div>
          ))}
        </div>
      </FormSection>
    </div>
  );
}
