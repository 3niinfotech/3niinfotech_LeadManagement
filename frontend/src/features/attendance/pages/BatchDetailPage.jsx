import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { FiUsers } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Card from '../../../components/ui/Card';
import Badge from '../../../components/ui/Badge';
import ContentLoader from '../../../components/ui/ContentLoader';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  useGetBatchQuery,
  useUpdateBatchMutation,
  useEnrollStudentsMutation,
  useAddTimetableSlotMutation,
  useGenerateSessionsMutation,
  useGetSessionsQuery,
} from '../redux/attendanceApiSlice';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { userService } from '../../../services/user/user.service';
import toastService from '../../../services/toast/toast.service';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function isoDate(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.ATTENDANCE_EDIT);
  const canMark = can(PERMISSIONS.ATTENDANCE_MARK) || can(PERMISSIONS.ATTENDANCE_EDIT);
  const { data: batch, isLoading } = useGetBatchQuery(id, { skip: !id });
  const { data: sessions = [] } = useGetSessionsQuery({ batchId: id }, { skip: !id });
  const [enroll] = useEnrollStudentsMutation();
  const [updateBatch, { isLoading: assigning }] = useUpdateBatchMutation();
  const [addSlot] = useAddTimetableSlotMutation();
  const [generate, { isLoading: generating }] = useGenerateSessionsMutation();
  const [studentId, setStudentId] = useState('');
  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [instructorId, setInstructorId] = useState('');
  const [teacherOptions, setTeacherOptions] = useState([]);

  const summary = batch?.summary;

  useEffect(() => {
    if (batch?.instructorId) setInstructorId(batch.instructorId);
  }, [batch?.instructorId]);

  useEffect(() => {
    let cancelled = false;
    userService.getAll({ role: 'teacher', status: 'ACTIVE', limit: 100 })
      .then((res) => {
        if (cancelled) return;
        const rows = res.data || [];
        setTeacherOptions([
          { value: '', label: 'No instructor' },
          ...rows.map((u) => ({
            value: u.id,
            label: `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email,
          })),
        ]);
      })
      .catch(() => {
        if (!cancelled) setTeacherOptions([{ value: '', label: 'No instructor' }]);
      });
    return () => { cancelled = true; };
  }, []);

  const searchStudents = async (q) => {
    setSearch(q);
    if (q.length < 2) {
      setResults([]);
      return;
    }
    try {
      const res = await apiGet(API.STUDENTS, { search: q, limit: 8 });
      setResults(res.data || []);
    } catch {
      setResults([]);
    }
  };

  const addStudent = async (sid) => {
    try {
      await enroll({ id, studentIds: [sid] }).unwrap();
      toastService.success('Student enrolled');
      setStudentId('');
      setSearch('');
      setResults([]);
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not enroll student');
    }
  };

  const saveInstructor = async () => {
    try {
      await updateBatch({ id, instructorId: instructorId || null }).unwrap();
      toastService.success('Instructor assigned');
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not assign instructor');
    }
  };

  const saveSlot = async () => {
    try {
      await addSlot({ id, dayOfWeek: Number(dayOfWeek), startTime, endTime }).unwrap();
      toastService.success('Timetable slot added');
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not add slot');
    }
  };

  const generateWeek = async () => {
    try {
      const result = await generate({ id, from: isoDate(0), to: isoDate(14) }).unwrap();
      toastService.success(`${result?.data?.created ?? result?.created ?? 0} sessions generated`);
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not generate sessions');
    }
  };

  const dayOptions = useMemo(() => DAYS.map((label, value) => ({ value: String(value), label })), []);

  if (isLoading) return <ContentLoader variant="module" />;
  if (!batch) return <p className="p-8 text-text-muted">Batch not found.</p>;

  return (
    <ModulePageCard
      title={batch.name}
      subtitle={`${batch.courseName} · ${batch.branch?.name || ''} · ${batch.code}`}
      icon={FiUsers}
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Batches', path: ROUTES.BATCHES },
        { label: batch.name },
      ]}
    >
      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <Card className="p-3"><p className="text-xs text-text-muted">Students</p><p className="text-xl font-semibold">{summary?.totalStudents || 0}</p></Card>
          <Card className="p-3"><p className="text-xs text-text-muted">Avg attendance</p><p className="text-xl font-semibold">{summary?.averageAttendance || 0}%</p></Card>
          <Card className="p-3"><p className="text-xs text-text-muted">Low attendance</p><p className="text-xl font-semibold">{summary?.lowAttendanceStudents || 0}</p></Card>
        </div>

        {canManage && (
          <Card className="p-4 space-y-3">
            <h3 className="font-semibold">Instructor (Teacher)</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Select
                label="Assign teacher"
                value={instructorId}
                onChange={(e) => setInstructorId(e.target.value)}
                options={teacherOptions}
                placeholder="Select teacher"
              />
              <div className="flex items-end">
                <Button size="sm" onClick={saveInstructor} loading={assigning}>Save instructor</Button>
              </div>
            </div>
            <p className="text-xs text-text-muted">Teacher login only shows batches assigned to them.</p>
          </Card>
        )}

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Students</h3>
          {canManage && (
            <>
              <Input label="Search students to enroll" value={search} onChange={(e) => searchStudents(e.target.value)} placeholder="Name or code" />
              {results.map((s) => (
                <button key={s.id} type="button" className="block text-sm text-primary" onClick={() => addStudent(s.id)}>
                  {s.firstName} {s.lastName} · {s.studentCode}
                </button>
              ))}
            </>
          )}
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-left text-text-muted"><th className="py-2">Student</th><th>Present</th><th>Absent</th><th>%</th></tr></thead>
              <tbody>
                {(batch.enrollments || []).map((en) => (
                  <tr key={en.id} className="border-t border-border">
                    <td className="py-2">{en.student?.firstName} {en.student?.lastName}</td>
                    <td>{en.attendance?.present || 0}</td>
                    <td>{en.attendance?.absent || 0}</td>
                    <td>
                      {en.attendance?.percent || 0}%
                      {en.attendance?.low && <Badge color="danger" className="ml-2 text-[10px]">At risk</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Timetable</h3>
          {canManage && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <Select label="Day" value={dayOfWeek} onChange={(e) => setDayOfWeek(e.target.value)} options={dayOptions} allowClear={false} />
              <Input label="Start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              <Input label="End" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
              <div className="flex items-end"><Button size="sm" onClick={saveSlot}>Add slot</Button></div>
            </div>
          )}
          {(batch.timetableSlots || []).map((slot) => (
            <p key={slot.id} className="text-sm text-text-secondary">{DAYS[slot.dayOfWeek]} {slot.startTime}–{slot.endTime}</p>
          ))}
          {canManage && (
            <Button size="sm" variant="outline" loading={generating} onClick={generateWeek}>Generate next 14 days</Button>
          )}
        </Card>

        <Card className="p-4 space-y-3">
          <h3 className="font-semibold">Classes</h3>
          {(sessions || []).length === 0 && <p className="text-sm text-text-muted">No sessions yet. Add a timetable slot and generate classes.</p>}
          {(sessions || []).map((session) => (
            <div key={session.id} className="flex items-center justify-between border-t border-border py-2">
              <div>
                <p className="text-sm font-medium">{new Date(session.startAt).toLocaleString('en-IN')}</p>
                <p className="text-xs text-text-muted">{session.window?.state || session.status}</p>
              </div>
              {canMark ? (
                <Button size="sm" onClick={() => navigate(ROUTES.SESSION_ATTENDANCE(session.id))}>Take attendance</Button>
              ) : (
                <Button size="sm" variant="outline" onClick={() => navigate(ROUTES.SESSION_ATTENDANCE(session.id))}>View</Button>
              )}
            </div>
          ))}
        </Card>
      </div>
    </ModulePageCard>
  );
}
