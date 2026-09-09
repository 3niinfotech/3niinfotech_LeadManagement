import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { FiCheck, FiRefreshCw, FiSave, FiSearch, FiUserCheck } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
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
import {
  AttendanceHero,
  AttendanceLockedBanner,
  AttendanceMetricBar,
  SimplePAStudentRow,
  computeCounts,
  dailyPresentPercent,
  isDraftDirty,
  normalizeToDailyStatus,
  studentName,
} from '../components/AttendanceUi';
import '../styles/batches.theme.css';

export default function TakeAttendancePage() {
  const { id } = useParams();
  const { can } = usePermissions();
  const canMark = can(PERMISSIONS.ATTENDANCE_MARK) || can(PERMISSIONS.ATTENDANCE_EDIT);
  const canCorrect = can(PERMISSIONS.ATTENDANCE_CORRECT);

  const { data, isLoading, refetch, isFetching } = useGetSessionAttendanceQuery(id, { skip: !id });
  const [saveAttendance, { isLoading: saving }] = useSaveAttendanceMutation();
  const [correctAttendance, { isLoading: correcting }] = useCorrectAttendanceMutation();

  const [draft, setDraft] = useState({});
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [correctingId, setCorrectingId] = useState('');
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!data?.roster) return;
    const next = {};
    data.roster.forEach((row) => {
      next[row.studentId] = normalizeToDailyStatus(row.status);
    });
    setDraft(next);
  }, [data]);

  const locked = data?.window?.locked;
  const editable = canMark && !locked;
  const counts = useMemo(() => computeCounts(draft, data?.roster?.length || 0), [draft, data]);
  const markedRate = useMemo(() => {
    if (!counts.TOTAL) return 0;
    return Math.round((counts.MARKED / counts.TOTAL) * 100);
  }, [counts]);
  const presentRate = useMemo(() => dailyPresentPercent(counts), [counts]);
  const dirty = useMemo(() => isDraftDirty(data, draft), [data, draft]);
  const showCorrectionCol = Boolean(data?.canCorrect && canCorrect && locked);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (data?.roster || []).filter((row) => {
      const status = draft[row.studentId] || '';
      if (statusFilter === 'UNMARKED' && status) return false;
      if (statusFilter !== 'ALL' && statusFilter !== 'UNMARKED' && status !== statusFilter) return false;
      if (!q) return true;
      const name = studentName(row.student).toLowerCase();
      const code = String(row.student?.studentCode || '').toLowerCase();
      return name.includes(q) || code.includes(q);
    });
  }, [data, draft, search, statusFilter]);

  const setStatus = useCallback((studentId, status) => {
    setDraft((prev) => ({ ...prev, [studentId]: status }));
    if (locked && data?.canCorrect && canCorrect) {
      setCorrectingId(studentId);
    }
  }, [locked, data?.canCorrect, canCorrect]);

  const markAllPresent = () => {
    const next = {};
    (data?.roster || []).forEach((row) => { next[row.studentId] = 'PRESENT'; });
    setDraft(next);
  };

  const save = async () => {
    const roster = data?.roster || [];
    const unmarked = roster.filter((row) => !draft[row.studentId]);
    if (unmarked.length) {
      toastService.info(`Mark all ${unmarked.length} remaining student(s) as P or A`);
      return;
    }
    const entries = roster.map((row) => ({
      studentId: row.studentId,
      status: draft[row.studentId],
    }));
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
    if (!draft[studentId]) {
      toastService.info('Select P or A for correction');
      return;
    }
    try {
      await correctAttendance({
        id,
        studentId,
        status: draft[studentId],
        reason: reason.trim(),
      }).unwrap();
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

  return (
    <ModulePageCard
      title={session.batch?.name || 'Class attendance'}
      subtitle={`${session.batch?.courseName || ''} · ${new Date(session.startAt).toLocaleString('en-IN')}`}
      icon={FiCheck}
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Batches', path: ROUTES.BATCHES },
        { label: session.batch?.name || 'Batch', path: ROUTES.BATCH_DETAIL(session.batch?.id) },
        { label: 'Attendance' },
      ]}
    >
      <div className="crm-attendance-page crm-attendance-page--v2 crm-attendance-page--daily">
        <div className="crm-att-sticky">
          <AttendanceHero
            session={session}
            window={data.window}
            totalStudents={data.totalStudents}
            rate={markedRate}
            batchId={session.batch?.id}
            compact
          />

          <AttendanceMetricBar
            counts={counts}
            activeFilter={statusFilter}
            onFilter={setStatusFilter}
            simple
          />

          {locked && (
            <AttendanceLockedBanner
              window={data.window}
              canCorrect={data.canCorrect && canCorrect}
              compact
            />
          )}

          <div className="crm-att-toolbar crm-att-toolbar--daily">
            <div className="crm-att-toolbar__search">
              <FiSearch className="w-4 h-4 text-text-muted" />
              <input
                type="search"
                placeholder="Search student name or code…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="crm-att-toolbar__actions">
              {(dirty && editable) || counts.UNMARKED > 0 ? (
                <span className="crm-att-toolbar__hint">
                  {counts.UNMARKED > 0 && `${counts.UNMARKED} unmarked · `}
                  {presentRate}% present · {counts.MARKED}/{counts.TOTAL}
                </span>
              ) : null}
              {editable && (
                <Button size="sm" variant="outline" onClick={markAllPresent}>
                  <FiUserCheck className="w-3.5 h-3.5 mr-1" />
                  All Present
                </Button>
              )}
              {canMark && (
                <Button
                  size="sm"
                  onClick={save}
                  loading={saving}
                  disabled={!editable || saving || !dirty}
                >
                  <FiSave className="w-3.5 h-3.5 mr-1" />
                  {locked ? 'Locked' : 'Save'}
                </Button>
              )}
              <button
                type="button"
                className="crm-att-toolbar__refresh"
                onClick={() => refetch()}
                disabled={isFetching}
                title="Refresh"
              >
                <FiRefreshCw className={`w-4 h-4 ${isFetching ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        <div className="crm-att-scroll">
          <div className="crm-att-pa-table-wrap">
            {filtered.length === 0 ? (
              <div className="crm-att-empty">
                <p className="text-sm font-semibold text-text">No students match</p>
                <p className="text-[12px] text-text-muted mt-1">Try clearing search or changing the filter.</p>
              </div>
            ) : (
              <table className="crm-att-pa-table">
                <thead>
                  <tr>
                    <th>Student</th>
                    <th>Attendance</th>
                    <th>Marked</th>
                    {showCorrectionCol && <th>Correction</th>}
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((row) => (
                    <SimplePAStudentRow
                      key={row.studentId}
                      row={row}
                      status={draft[row.studentId] || ''}
                      onStatusChange={(status) => setStatus(row.studentId, status)}
                      disabled={!editable && !(data.canCorrect && canCorrect && locked)}
                      canCorrect={showCorrectionCol}
                      locked={locked}
                      correcting={correctingId === row.studentId}
                      reason={reason}
                      onReasonChange={setReason}
                      onStartCorrect={() => {
                        setCorrectingId(row.studentId);
                        setReason('');
                      }}
                      onSubmitCorrect={() => submitCorrection(row.studentId)}
                      onCancelCorrect={() => {
                        setCorrectingId('');
                        setReason('');
                        setDraft((prev) => ({
                          ...prev,
                          [row.studentId]: normalizeToDailyStatus(row.status),
                        }));
                      }}
                      correctingBusy={correcting}
                    />
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </ModulePageCard>
  );
}
