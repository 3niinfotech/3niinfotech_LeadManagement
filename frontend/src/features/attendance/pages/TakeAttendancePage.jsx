import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheck } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Card from '../../../components/ui/Card';
import ContentLoader from '../../../components/ui/ContentLoader';
import { ROUTES } from '../../../config/routes';
import {
  useGetSessionAttendanceQuery,
  useSaveAttendanceMutation,
  useCorrectAttendanceMutation,
} from '../redux/attendanceApiSlice';
import toastService from '../../../services/toast/toast.service';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';

const STATUS_OPTIONS = [
  { value: 'PRESENT', label: 'Present' },
  { value: 'ABSENT', label: 'Absent' },
  { value: 'LATE', label: 'Late' },
  { value: 'EXCUSED', label: 'Excused' },
  { value: 'LEAVE', label: 'Leave' },
];

export default function TakeAttendancePage() {
  const { id } = useParams();
  const { can } = usePermissions();
  const canMark = can(PERMISSIONS.ATTENDANCE_MARK) || can(PERMISSIONS.ATTENDANCE_EDIT);
  const canCorrect = can(PERMISSIONS.ATTENDANCE_CORRECT);
  const { data, isLoading } = useGetSessionAttendanceQuery(id, { skip: !id });
  const [saveAttendance, { isLoading: saving }] = useSaveAttendanceMutation();
  const [correctAttendance, { isLoading: correcting }] = useCorrectAttendanceMutation();
  const [draft, setDraft] = useState({});
  const [search, setSearch] = useState('');
  const [correctingId, setCorrectingId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!data?.roster) return;
    const next = {};
    data.roster.forEach((row) => {
      next[row.studentId] = row.status || '';
    });
    setDraft(next);
  }, [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.roster || []).filter((row) => {
      if (!q) return true;
      const name = `${row.student?.firstName || ''} ${row.student?.lastName || ''} ${row.student?.studentCode || ''}`.toLowerCase();
      return name.includes(q);
    });
  }, [data, search]);

  const counts = useMemo(() => {
    const values = Object.values(draft);
    return {
      PRESENT: values.filter((v) => v === 'PRESENT').length,
      ABSENT: values.filter((v) => v === 'ABSENT').length,
      LATE: values.filter((v) => v === 'LATE').length,
      EXCUSED: values.filter((v) => v === 'EXCUSED').length,
      UNMARKED: values.filter((v) => !v).length,
    };
  }, [draft]);

  const markAllPresent = () => {
    const next = {};
    (data?.roster || []).forEach((row) => { next[row.studentId] = 'PRESENT'; });
    setDraft(next);
  };

  const save = async () => {
    const entries = Object.entries(draft)
      .filter(([, status]) => status)
      .map(([studentId, status]) => ({ studentId, status }));
    if (!entries.length) {
      toastService.info('Mark at least one student');
      return;
    }
    try {
      await saveAttendance({ id, entries }).unwrap();
      toastService.success('Attendance saved');
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not save attendance');
    }
  };

  const submitCorrection = async (studentId) => {
    if (!reason.trim()) {
      toastService.info('Correction reason is required');
      return;
    }
    try {
      await correctAttendance({ id, studentId, status: draft[studentId], reason: reason.trim() }).unwrap();
      toastService.success('Attendance corrected');
      setCorrectingId('');
      setReason('');
    } catch (e) {
      toastService.error(e?.data?.message || 'Correction failed');
    }
  };

  if (isLoading) return <ContentLoader variant="module" />;
  if (!data) return <p className="p-8 text-text-muted">Session not found.</p>;

  const session = data.session;
  const locked = data.window?.locked;

  return (
    <ModulePageCard
      title={session.batch?.name || 'Class attendance'}
      subtitle={`${session.batch?.courseName || ''} · ${new Date(session.startAt).toLocaleString('en-IN')} · ${data.totalStudents} students`}
      icon={FiCheck}
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Batches', path: ROUTES.BATCHES },
        { label: 'Attendance' },
      ]}
    >
      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
        <Card className="p-4 flex flex-wrap items-center gap-3">
          <Input className="min-w-[220px]" placeholder="Search student..." value={search} onChange={(e) => setSearch(e.target.value)} />
          {canMark && (
            <Button size="sm" variant="outline" onClick={markAllPresent} disabled={locked && !data.canCorrect}>Mark all present</Button>
          )}
          <div className="text-xs text-text-muted ml-auto">
            Present {counts.PRESENT} · Absent {counts.ABSENT} · Late {counts.LATE} · Excused {counts.EXCUSED} · Unmarked {counts.UNMARKED}
          </div>
          {canMark && (
            <Button size="sm" onClick={save} loading={saving} disabled={locked || saving}>{locked ? 'Locked' : 'Save attendance'}</Button>
          )}
        </Card>
        {locked && (
          <p className="text-sm text-warning">
            Attendance window is {data.window?.state === 'NOT_OPEN' ? 'not open yet' : 'locked'}.
            {data.canCorrect ? ' Authorized users can correct with a reason.' : ''}
          </p>
        )}
        <Card className="p-0 overflow-auto">
          <table className="w-full text-sm">
            <thead className="bg-row-hover text-left">
              <tr>
                <th className="px-3 py-2">Student</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Marked by</th>
                {data.canCorrect && canCorrect && <th className="px-3 py-2">Correct</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map((row) => (
                <tr key={row.studentId} className="border-t border-border">
                  <td className="px-3 py-2">
                    {row.student?.firstName} {row.student?.lastName}
                    <span className="block text-xs text-text-muted">{row.student?.studentCode}</span>
                  </td>
                  <td className="px-3 py-2 min-w-[160px]">
                    <Select
                      value={draft[row.studentId] || ''}
                      onChange={(e) => setDraft((prev) => ({ ...prev, [row.studentId]: e.target.value }))}
                      options={STATUS_OPTIONS}
                      placeholder="Not marked"
                      disabled={(locked && !data.canCorrect) || (!canMark && !canCorrect)}
                    />
                  </td>
                  <td className="px-3 py-2 text-text-muted">
                    {row.markedBy ? `${row.markedBy.firstName} ${row.markedBy.lastName || ''}` : '—'}
                  </td>
                  {data.canCorrect && canCorrect && (
                    <td className="px-3 py-2">
                      {correctingId === row.studentId ? (
                        <div className="flex gap-2">
                          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="Reason" />
                          <Button size="sm" loading={correcting} onClick={() => submitCorrection(row.studentId)}>Save</Button>
                        </div>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => setCorrectingId(row.studentId)}>Correct</Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
    </ModulePageCard>
  );
}
