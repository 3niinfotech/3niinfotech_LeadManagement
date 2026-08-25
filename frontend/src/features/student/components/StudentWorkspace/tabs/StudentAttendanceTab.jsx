import Badge from '../../../../../components/ui/Badge';
import Card from '../../../../../components/ui/Card';
import ContentLoader from '../../../../../components/ui/ContentLoader';
import { useGetStudentAttendanceQuery } from '../../../../attendance/redux/attendanceApiSlice';

function formatWhen(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN');
}

export default function StudentAttendanceTab({ studentId }) {
  const { data, isLoading } = useGetStudentAttendanceQuery(studentId, { skip: !studentId });

  if (isLoading) return <ContentLoader variant="section" />;
  if (!data) return <p className="text-sm text-text-muted">Attendance history is unavailable.</p>;

  const t = data.totals || {};

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3">
        <Card className="p-3"><p className="text-xs text-text-muted">Total classes</p><p className="text-lg font-semibold">{t.total || 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-text-muted">Present</p><p className="text-lg font-semibold">{t.present || 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-text-muted">Absent</p><p className="text-lg font-semibold">{t.absent || 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-text-muted">Late</p><p className="text-lg font-semibold">{t.late || 0}</p></Card>
        <Card className="p-3"><p className="text-xs text-text-muted">Excused</p><p className="text-lg font-semibold">{t.excused || 0}</p></Card>
        <Card className="p-3">
          <p className="text-xs text-text-muted">Attendance %</p>
          <p className="text-lg font-semibold">{t.percent || 0}%</p>
          {data.lowAttendance && <Badge color="danger" className="text-[10px]">Low attendance</Badge>}
        </Card>
      </div>
      <div className="overflow-auto rounded-lg border border-border">
        <table className="w-full text-sm">
          <thead className="bg-row-hover text-left">
            <tr>
              <th className="px-3 py-2">Date</th>
              <th className="px-3 py-2">Course</th>
              <th className="px-3 py-2">Batch</th>
              <th className="px-3 py-2">Status</th>
              <th className="px-3 py-2">Marked by</th>
            </tr>
          </thead>
          <tbody>
            {(data.history || []).length === 0 && (
              <tr><td className="px-3 py-6 text-text-muted" colSpan={5}>No class attendance recorded yet.</td></tr>
            )}
            {(data.history || []).map((row) => (
              <tr key={row.id} className="border-t border-border">
                <td className="px-3 py-2 whitespace-nowrap">{formatWhen(row.startAt || row.date)}</td>
                <td className="px-3 py-2">{row.course || '—'}</td>
                <td className="px-3 py-2">{row.batch || '—'}</td>
                <td className="px-3 py-2">{row.status}</td>
                <td className="px-3 py-2">{row.markedBy ? `${row.markedBy.firstName} ${row.markedBy.lastName || ''}` : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
