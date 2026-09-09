import ContentLoader from '../../../../../components/ui/ContentLoader';
import FormSection from '../../../../../components/ui/FormSection';
import Badge from '../../../../../components/ui/Badge';
import { useGetStudentAttendanceQuery } from '../../../../attendance/redux/attendanceApiSlice';

function formatWhen(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function statusTone(status) {
  const s = String(status || '').toUpperCase();
  if (s === 'PRESENT') return 'success';
  if (s === 'ABSENT') return 'danger';
  if (s === 'LATE' || s === 'HALF_DAY') return 'warning';
  if (s === 'EXCUSED' || s === 'LEAVE') return 'info';
  return 'secondary';
}

export default function StudentAttendanceTab({ studentId }) {
  const { data, isLoading } = useGetStudentAttendanceQuery(studentId, { skip: !studentId });

  if (isLoading) return <ContentLoader variant="section" />;

  if (!data) {
    return (
      <FormSection title="Class attendance" description="Academic attendance for this student.">
        <p className="text-sm text-text-muted py-4">Attendance history could not be loaded.</p>
      </FormSection>
    );
  }

  const t = data.totals || {};
  const history = data.history || [];

  const stats = [
    { label: 'Rate', value: `${t.percent ?? 0}%` },
    { label: 'Present', value: t.present || 0 },
    { label: 'Absent', value: t.absent || 0 },
    { label: 'Late', value: t.late || 0 },
    { label: 'Excused', value: t.excused || 0 },
    { label: 'Total', value: t.total || 0 },
  ];

  return (
    <div className="space-y-4">
      <FormSection
        title="Attendance summary"
        description="Records from teacher attendance marking."
      >
        {data.lowAttendance && (
          <p className="text-sm text-danger mb-3">
            Low attendance — below {data.threshold ?? 75}% threshold.
          </p>
        )}

        <div className="crm-student-att-kpis">
          {stats.map((s) => (
            <div key={s.label} className="crm-student-att-kpi">
              <div className="crm-student-att-kpi__label">{s.label}</div>
              <div className="crm-student-att-kpi__value">{s.value}</div>
            </div>
          ))}
        </div>
      </FormSection>

      <FormSection
        title="Session history"
        description={`${history.length} session${history.length === 1 ? '' : 's'}`}
      >
        {history.length === 0 ? (
          <p className="text-sm text-text-muted py-4">No class attendance recorded yet.</p>
        ) : (
          <ul className="crm-student-record-list">
            {history.map((row) => (
              <li
                key={row.id}
                className="crm-student-record"
                style={{ gridTemplateColumns: 'minmax(0,1.4fr) minmax(0,1fr) auto minmax(0,1fr)' }}
              >
                <div className="crm-student-record__primary">
                  {row.course || 'Class session'}
                  <div className="crm-student-record__muted mt-0.5">{formatWhen(row.startAt || row.date)}</div>
                </div>
                <div className="crm-student-record__meta">
                  <span className="block text-[10px] font-medium text-text-muted mb-0.5">Batch</span>
                  {row.batch || '—'}
                </div>
                <Badge color={statusTone(row.status)} size="sm">
                  {row.status || '—'}
                </Badge>
                <div className="crm-student-record__muted">
                  <span className="block text-[10px] font-medium text-text-muted mb-0.5">Marked by</span>
                  {row.markedBy
                    ? `${row.markedBy.firstName || ''} ${row.markedBy.lastName || ''}`.trim()
                    : '—'}
                </div>
              </li>
            ))}
          </ul>
        )}
      </FormSection>
    </div>
  );
}
