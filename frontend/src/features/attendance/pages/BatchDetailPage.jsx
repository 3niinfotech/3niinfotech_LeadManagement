import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  FiUsers, FiPlus, FiCalendar, FiUserCheck, FiRefreshCw, FiArrowLeft,
} from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import ContentLoader from '../../../components/ui/ContentLoader';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  useGetBatchQuery,
  useUpdateBatchMutation,
  useEnrollStudentsMutation,
  useUnenrollStudentMutation,
  useAddTimetableSlotMutation,
  useGenerateSessionsMutation,
  useGetSessionsQuery,
} from '../redux/attendanceApiSlice';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { userService } from '../../../services/user/user.service';
import toastService from '../../../services/toast/toast.service';
import {
  BATCH_WEEKDAYS,
  buildBatchDetailSummaryItems,
} from '../config/batchSummary.config';
import {
  BatchDetailHero,
  BatchWeekGrid,
} from '../components/BatchUi';
import { BatchStudentsGrid, BatchSessionsGrid } from '../components/BatchGrid';
import '../styles/batches.theme.css';

function isoDate(offset = 0) {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return d.toISOString().slice(0, 10);
}

function instructorName(user) {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || '';
}

export default function BatchDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canManage = can(PERMISSIONS.ATTENDANCE_EDIT);
  const canMark = can(PERMISSIONS.ATTENDANCE_MARK) || can(PERMISSIONS.ATTENDANCE_EDIT);

  const { data: batch, isLoading, refetch } = useGetBatchQuery(id, { skip: !id });
  const { data: sessions = [], refetch: refetchSessions } = useGetSessionsQuery(
    { batchId: id },
    { skip: !id },
  );

  const [enroll] = useEnrollStudentsMutation();
  const [unenroll] = useUnenrollStudentMutation();
  const [updateBatch, { isLoading: assigning }] = useUpdateBatchMutation();
  const [addSlot] = useAddTimetableSlotMutation();
  const [generate, { isLoading: generating }] = useGenerateSessionsMutation();

  const [dayOfWeek, setDayOfWeek] = useState('1');
  const [startTime, setStartTime] = useState('19:00');
  const [endTime, setEndTime] = useState('20:00');
  const [search, setSearch] = useState('');
  const [results, setResults] = useState([]);
  const [instructorId, setInstructorId] = useState('');
  const [teacherOptions, setTeacherOptions] = useState([]);
  const [showAtRiskOnly, setShowAtRiskOnly] = useState(false);

  const summary = batch?.summary;
  const enrollmentsAll = batch?.enrollments || [];
  const enrollments = showAtRiskOnly
    ? enrollmentsAll.filter((e) => e.attendance?.low)
    : enrollmentsAll;
  const slots = batch?.timetableSlots || [];

  useEffect(() => {
    if (batch?.instructorId) setInstructorId(batch.instructorId);
    else if (batch) setInstructorId('');
  }, [batch?.instructorId, batch]);

  useEffect(() => {
    let cancelled = false;
    userService.getAll({ role: 'teacher', status: 'ACTIVE', limit: 100 })
      .then((res) => {
        if (!cancelled) {
          const rows = res.data || [];
          setTeacherOptions([
            { value: '', label: 'No instructor' },
            ...rows.map((u) => ({
              value: u.id,
              label: instructorName(u),
            })),
          ]);
        }
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
      setSearch('');
      setResults([]);
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not enroll student');
    }
  };

  const removeStudent = async (studentId) => {
    try {
      await unenroll({ id, studentId }).unwrap();
      toastService.success('Student removed from batch');
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not unenroll');
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
      refetchSessions();
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not generate sessions');
    }
  };

  const dayOptions = useMemo(
    () => BATCH_WEEKDAYS.map((label, value) => ({ value: String(value), label })),
    [],
  );

  const upcomingSession = useMemo(() => {
    const now = Date.now();
    return [...(sessions || [])]
      .filter((s) => new Date(s.startAt).getTime() >= now - 2 * 3600000)
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))[0];
  }, [sessions]);

  const sortedSessions = useMemo(
    () => [...(sessions || [])].sort((a, b) => new Date(a.startAt) - new Date(b.startAt)),
    [sessions],
  );

  const statItems = useMemo(
    () => buildBatchDetailSummaryItems(summary || {}, {
      slotCount: slots.length,
      sessionCount: sessions?.length || 0,
    }),
    [summary, slots.length, sessions],
  );

  const faculty = instructorName(batch?.instructor);

  if (isLoading) return <ContentLoader variant="module" />;
  if (!batch) {
    return (
      <div className="p-8 text-center text-text-muted">
        Batch not found.
        <Button variant="outline" className="mt-4" onClick={() => navigate(ROUTES.BATCHES)}>
          Back to batches
        </Button>
      </div>
    );
  }

  return (
    <ModulePageCard
      title={batch.name}
      subtitle={`${batch.courseName} · ${batch.branch?.name || ''} · ${batch.code || ''}`}
      icon={FiUsers}
      iconColor="primary"
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Batches', path: ROUTES.BATCHES },
        { label: batch.name },
      ]}
      actions={(
        <div className="flex items-center gap-2 flex-wrap">
          {upcomingSession && canMark && (
            <Button
              size="sm"
              icon={FiCalendar}
              onClick={() => navigate(ROUTES.SESSION_ATTENDANCE(upcomingSession.id))}
            >
              Take attendance
            </Button>
          )}
          <Button size="sm" variant="outline" icon={FiRefreshCw} onClick={() => { refetch(); refetchSessions(); }}>
            Refresh
          </Button>
          <Button size="sm" variant="outline" icon={FiArrowLeft} onClick={() => navigate(ROUTES.BATCHES)}>
            Back
          </Button>
        </div>
      )}
    >
      <ModulePageCard.Stats
        items={statItems}
        activeFilter={showAtRiskOnly ? 'atRisk' : null}
        onSelect={(v) => setShowAtRiskOnly(v === 'atRisk')}
        ariaLabel="Batch KPIs"
        layout="grid"
      />

      <ModulePageCard.Table scroll="page">
        <div className="crm-batch-detail">
          <BatchDetailHero
            batch={batch}
            summary={summary}
            slots={slots.length}
            sessionCount={sortedSessions.length}
            instructorName={faculty}
          />

          {canManage && (
            <div className="crm-batch-panel">
              <div className="crm-batch-panel__head">
                <h3 className="crm-batch-panel__title">Instructor</h3>
                <p className="crm-batch-panel__desc">Teacher login only shows assigned batches.</p>
              </div>
              <div className="crm-batch-panel__body">
                <div className="crm-batch-inline">
                  <Select
                    label="Assign teacher"
                    value={instructorId}
                    onChange={(e) => setInstructorId(e.target.value)}
                    options={teacherOptions}
                    placeholder="Select teacher"
                  />
                  <Button size="sm" icon={FiUserCheck} onClick={saveInstructor} loading={assigning}>
                    Save
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="crm-batch-detail-grid">
            <div className="crm-batch-panel">
              <div className="crm-batch-panel__head">
                <h3 className="crm-batch-panel__title">Students</h3>
                <p className="crm-batch-panel__desc">
                  {showAtRiskOnly
                    ? `${enrollments.length} at risk · filtered view`
                    : `${enrollmentsAll.length} enrolled · attendance from class sessions`}
                </p>
              </div>
              <div className="crm-batch-panel__body">
                {canManage && (
                  <div className="crm-batch-enroll space-y-2 mb-3">
                    <Input
                      label="Enroll student"
                      value={search}
                      onChange={(e) => searchStudents(e.target.value)}
                      placeholder="Search name or code"
                    />
                    {results.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        className="crm-batch-search-hit"
                        onClick={() => addStudent(s.id)}
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-text truncate">
                            {s.firstName} {s.lastName}
                          </span>
                          <span className="block text-[11px] text-text-muted">{s.studentCode}</span>
                        </span>
                        <span className="text-xs font-bold text-brand inline-flex items-center gap-1 shrink-0">
                          <FiPlus className="w-3.5 h-3.5" /> Enroll
                        </span>
                      </button>
                    ))}
                  </div>
                )}

                {showAtRiskOnly && (
                  <div className="mb-3">
                    <Button size="sm" variant="outline" onClick={() => setShowAtRiskOnly(false)}>
                      Show all students
                    </Button>
                  </div>
                )}

                <BatchStudentsGrid
                  rows={enrollments}
                  canManage={canManage}
                  onUnenroll={removeStudent}
                  emptyTitle={showAtRiskOnly ? 'No at-risk students in this filter' : 'No students enrolled yet'}
                  emptyDescription={showAtRiskOnly
                    ? 'Clear the at-risk filter to see the full roster.'
                    : 'Search a student above to enroll them in this batch.'}
                />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <div className="crm-batch-panel">
                <div className="crm-batch-panel__head">
                  <h3 className="crm-batch-panel__title">Weekly timetable</h3>
                  <p className="crm-batch-panel__desc">Recurring slots used to generate sessions.</p>
                </div>
                <div className="crm-batch-panel__body">
                  {slots.length === 0 ? (
                    <p className="crm-batch-empty">No weekly slots yet.</p>
                  ) : (
                    <>
                      <BatchWeekGrid slots={slots} weekdays={BATCH_WEEKDAYS} />
                      <ul className="crm-batch-slot-list">
                        {slots.map((slot) => (
                          <li key={slot.id}>
                            <span className="crm-batch-slot-list__day">{BATCH_WEEKDAYS[slot.dayOfWeek]}</span>
                            <span className="crm-batch-slot-list__time">{slot.startTime}–{slot.endTime}</span>
                          </li>
                        ))}
                      </ul>
                    </>
                  )}

                  {canManage && (
                    <>
                      <div className="crm-batch-slot-form mt-4">
                        <Select
                          label="Day"
                          value={dayOfWeek}
                          onChange={(e) => setDayOfWeek(e.target.value)}
                          options={dayOptions}
                          allowClear={false}
                        />
                        <Input label="Start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
                        <Input label="End" type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
                        <Button size="sm" icon={FiPlus} onClick={saveSlot}>Add</Button>
                      </div>
                      <Button size="sm" variant="outline" icon={FiCalendar} loading={generating} onClick={generateWeek}>
                        Generate next 14 days
                      </Button>
                    </>
                  )}
                </div>
              </div>

              <div className="crm-batch-panel">
                <div className="crm-batch-panel__head">
                  <h3 className="crm-batch-panel__title">Class sessions</h3>
                  <p className="crm-batch-panel__desc">
                    {sortedSessions.length} session{sortedSessions.length === 1 ? '' : 's'}
                  </p>
                </div>
                <div className="crm-batch-panel__body crm-batch-panel__body--flush">
                  <BatchSessionsGrid
                    rows={sortedSessions}
                    batchRoom={batch.room}
                    canMark={canMark}
                    onOpen={(session) => navigate(ROUTES.SESSION_ATTENDANCE(session.id))}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </ModulePageCard.Table>
    </ModulePageCard>
  );
}
