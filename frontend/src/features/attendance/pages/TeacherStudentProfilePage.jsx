import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  FiArrowLeft,
  FiMail,
  FiPhone,
  FiCheckCircle,
  FiCheck,
  FiClock,
  FiAward,
  FiBookOpen,
  FiLayers,
  FiMapPin,
  FiMessageSquare,
  FiSend,
  FiCalendar,
  FiExternalLink,
  FiUserCheck,
  FiAlertCircle,
  FiInfo,
} from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import Button from '../../../components/ui/Button';
import Avatar from '../../../components/ui/Avatar';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import { apiGet, apiPost } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import toastService from '../../../services/toast/toast.service';
import { usePermissions } from '../../../hooks/usePermissions';
import { PERMISSIONS } from '../../../config/permissions';
import '../styles/teacher-student-profile.css';

const REMARK_PRESETS = [
  'Punctual & consistent attendance in class',
  'Excellent progress in IELTS mock modules',
  'Needs more practice on Task 2 Essay Writing',
  'Active participation in classroom discussions',
  'Attendance alert: recommended to review lecture notes',
];

export default function TeacherStudentProfilePage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const canRemark = can(PERMISSIONS.ATTENDANCE_MARK) || can(PERMISSIONS.ATTENDANCE_EDIT);

  const [data, setData] = useState(null);
  const [remarks, setRemarks] = useState([]);
  const [remarkText, setRemarkText] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [historyFilter, setHistoryFilter] = useState('ALL'); // 'ALL' | 'PRESENT' | 'ABSENT'

  const loadStudentProfile = useCallback(async () => {
    setLoading(true);
    try {
      const [summaryRes, remarksRes] = await Promise.all([
        apiGet(API.ACADEMIC_STUDENT(id)),
        apiGet(API.ACADEMIC_REMARKS(id)).catch(() => ({ data: [] })),
      ]);
      setData(summaryRes?.data || summaryRes || null);
      const list = remarksRes?.data ?? remarksRes ?? [];
      setRemarks(Array.isArray(list) ? list : []);
    } catch {
      setData(null);
      setRemarks([]);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadStudentProfile();
  }, [loadStudentProfile]);

  const addRemark = async () => {
    if (!remarkText.trim()) return;
    setSaving(true);
    try {
      await apiPost(API.ACADEMIC_REMARKS(id), { remark: remarkText.trim() });
      setRemarkText('');
      toastService.success('Academic remark published to student portal');
      const remarksRes = await apiGet(API.ACADEMIC_REMARKS(id));
      const list = remarksRes?.data ?? remarksRes ?? [];
      setRemarks(Array.isArray(list) ? list : []);
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Unable to save remark');
    } finally {
      setSaving(false);
    }
  };

  const totals = data?.totals || { percent: 0, present: 0, absent: 0, late: 0, leave: 0 };
  const student = data?.student || {};
  const fullName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
  const studentEmail = student.email || '';
  const studentPhone = student.phone || '';

  const primaryEnrollment = student.enrollments?.[0]?.batch;
  const primaryBatchName = primaryEnrollment?.name || data?.byBatch?.[0]?.batch || 'Not Enrolled in Batch';
  const primaryCourseName = primaryEnrollment?.courseName || data?.byBatch?.[0]?.course || '';
  const primaryRoom = primaryEnrollment?.room || data?.byBatch?.[0]?.room || '—';
  const primaryFaculty = primaryEnrollment?.instructor
    ? `${primaryEnrollment.instructor.firstName || ''} ${primaryEnrollment.instructor.lastName || ''}`.trim()
    : '—';
  const branchName = student.branch?.name || '';
  const scheduleSlots = primaryEnrollment?.timetableSlots || [];
  const scheduleString = scheduleSlots.length
    ? scheduleSlots.map((s) => `${s.startTime || ''}–${s.endTime || ''}`).join(', ')
    : '—';

  // Filtered Attendance History
  const filteredHistory = useMemo(() => {
    const list = data?.history || [];
    if (historyFilter === 'PRESENT') {
      return list.filter((r) => r.status === 'PRESENT' || r.dailyStatus === 'P');
    }
    if (historyFilter === 'ABSENT') {
      return list.filter((r) => r.status === 'ABSENT' || r.dailyStatus === 'A');
    }
    return list;
  }, [data?.history, historyFilter]);

  const summaryItems = useMemo(() => [
    {
      key: 'attendance',
      label: 'Attendance Rate',
      value: `${totals.percent ?? 0}%`,
      icon: FiCheckCircle,
      tone: 'success',
      filterValue: 'ALL',
    },
    {
      key: 'present',
      label: 'Classes Present',
      value: totals.present ?? 0,
      icon: FiAward,
      tone: 'primary',
      filterValue: 'PRESENT',
    },
    {
      key: 'absent',
      label: 'Days Absent',
      value: totals.absent ?? 0,
      icon: FiClock,
      tone: totals.absent > 0 ? 'danger' : 'neutral',
      filterValue: 'ABSENT',
    },
    {
      key: 'late',
      label: 'Late Arrivals',
      value: totals.late ?? 0,
      icon: FiClock,
      tone: totals.late > 0 ? 'warning' : 'neutral',
      filterValue: 'ALL',
    },
    {
      key: 'leave',
      label: 'Approved Leave',
      value: (totals.leave || 0) + (totals.excused || 0),
      icon: FiBookOpen,
      tone: 'info',
      filterValue: 'ALL',
    },
  ], [totals]);

  if (loading) return <ContentLoader />;

  if (!data?.student) {
    return (
      <ModulePageCard title="Student">
        <EmptyState title="Student not found" description="This student is outside your assigned classes." />
      </ModulePageCard>
    );
  }

  return (
    <ModulePageCard
      title={`${fullName}`}
      subtitle={`${student.studentCode || '—'} • Student Academic Profile & Attendance Record`}
      icon={FiUserCheck}
      actions={(
        <div className="flex items-center gap-1.5 flex-wrap">
          <Link
            to={ROUTES.TEACHER_STUDENTS}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs font-medium text-slate-700 hover:bg-slate-50 transition-colors shadow-2xs"
          >
            <FiArrowLeft className="w-3.5 h-3.5" /> Back to Roster
          </Link>
          <Button
            size="xs"
            variant="outline"
            className="flex items-center gap-1 py-1"
            onClick={() => navigate(ROUTES.TEACHER_CLASSES)}
          >
            <FiBookOpen className="w-3.5 h-3.5" /> My Classes
          </Button>
          <Button
            size="xs"
            variant="outline"
            className="flex items-center gap-1 py-1"
            onClick={() => navigate(ROUTES.TEACHER_ATTENDANCE)}
          >
            <FiCalendar className="w-3.5 h-3.5" /> Attendance Hub
          </Button>
        </div>
      )}
    >
      <div className="crm-tprofile">
        {/* ── Hero Student Banner ── */}
        <div className="crm-tprofile-hero">
          <div className="crm-tprofile-hero__left">
            <div className="crm-tprofile-hero__avatar-wrap">
              <Avatar
                name={fullName}
                src={student.avatar || student.avatarUrl || student.profileImage || student.photo || student.profilePic || student.user?.avatar || ''}
                size="md"
              />
              <span className="crm-tprofile-hero__verified-badge" title="Verified Enrolled Student">
                <FiCheck />
              </span>
            </div>

            <div className="crm-tprofile-hero__copy">
              <div className="crm-tprofile-hero__name-row">
                <h1 className="crm-tprofile-hero__name">{fullName}</h1>
                <span className="crm-tprofile-hero__code">{student.studentCode || '—'}</span>
                <span className="crm-tprofile-hero__status-badge">● Active Enrolled</span>
              </div>

              <div className="crm-tprofile-hero__meta-row">
                <span>
                  <strong>Batch:</strong> {primaryBatchName} {primaryCourseName ? `(${primaryCourseName})` : ''}
                </span>
                {studentEmail && (
                  <>
                    <span>•</span>
                    <a href={`mailto:${studentEmail}`} className="crm-tprofile-hero__contact-item">
                      <FiMail /> {studentEmail}
                    </a>
                  </>
                )}
                {studentPhone && (
                  <>
                    <span>•</span>
                    <a href={`tel:${studentPhone}`} className="crm-tprofile-hero__contact-item">
                      <FiPhone /> {studentPhone}
                    </a>
                  </>
                )}
                {branchName && (
                  <>
                    <span>•</span>
                    <span className="text-slate-500">📍 {branchName}</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="crm-tprofile-hero__actions">
            {studentEmail && (
              <a
                href={`mailto:${studentEmail}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:text-blue-600 hover:border-blue-400 transition-colors shadow-2xs"
              >
                <FiMail className="w-3.5 h-3.5" /> Send Email
              </a>
            )}
            {studentPhone && (
              <a
                href={`tel:${studentPhone}`}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-slate-300 bg-white text-xs font-semibold text-slate-700 hover:text-emerald-600 hover:border-emerald-400 transition-colors shadow-2xs"
              >
                <FiPhone className="w-3.5 h-3.5" /> Call Student
              </a>
            )}
          </div>
        </div>

        {/* ── Top 5 Academic KPI Stat Strip (Standard CRM UI) ── */}
        <div className="rounded-xl border border-border bg-card-bg shadow-xs overflow-hidden">
          <SummaryStatBar
            items={summaryItems}
            activeFilter={historyFilter === 'ALL' ? null : historyFilter}
            onSelect={(val) => setHistoryFilter(val || 'ALL')}
            layout="grid"
            ariaLabel="Student Academic Key Metrics"
          />
        </div>

        {/* ── Main Dual-Column Faculty Workspace ── */}
        <div className="crm-tprofile-main-grid">
          {/* Left Column: Academic Remarks Composer & Detailed Attendance History */}
          <div className="flex flex-col gap-4">
            {/* Faculty Academic Remarks & Feedback */}
            <div className="crm-tprofile-panel">
              <div className="crm-tprofile-panel__head">
                <h3 className="crm-tprofile-panel__title">
                  <FiMessageSquare className="text-blue-600" /> Faculty Academic Remarks &amp; Feedback
                </h3>
                <span className="text-xs font-semibold text-slate-500">
                  {remarks.length} Published Remarks
                </span>
              </div>

              <div className="crm-tprofile-panel__body">
                {canRemark && (
                  <div className="crm-tremarks-composer">
                    <span className="text-xs font-bold text-slate-700">Quick Academic Feedback Presets:</span>
                    <div className="crm-tremarks-presets">
                      {REMARK_PRESETS.map((p) => (
                        <button
                          key={p}
                          type="button"
                          className="crm-tpreset-btn"
                          onClick={() => setRemarkText(p)}
                        >
                          + {p}
                        </button>
                      ))}
                    </div>

                    <textarea
                      className="crm-tremarks-textarea"
                      placeholder="Write an academic feedback remark (visible to the student on their portal dashboard)..."
                      value={remarkText}
                      onChange={(e) => setRemarkText(e.target.value)}
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10.5px] text-slate-500">
                        {remarkText.length} characters • Student receives instant notification
                      </span>
                      <Button
                        size="xs"
                        loading={saving}
                        disabled={!remarkText.trim()}
                        className="flex items-center gap-1 font-bold shadow-2xs py-1"
                        onClick={addRemark}
                      >
                        <FiSend className="w-3 h-3" /> Publish Academic Remark
                      </Button>
                    </div>
                  </div>
                )}

                {!remarks.length ? (
                  <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg">
                    <FiMessageSquare className="mx-auto text-2xl text-slate-300 mb-2" />
                    <p className="text-xs font-semibold text-slate-600 m-0">No academic remarks published yet</p>
                    <p className="text-[11px] text-slate-400 m-0 mt-0.5">Use the composer above to share guidance or praise with this student.</p>
                  </div>
                ) : (
                  <div className="crm-tremarks-list">
                    {remarks.map((r) => (
                      <div key={r.id} className="crm-tremark-item">
                        <Avatar
                          name={[r.teacher?.firstName, r.teacher?.lastName].filter(Boolean).join(' ') || 'Teacher'}
                          size="xs"
                        />
                        <div className="crm-tremark-copy">
                          <p className="crm-tremark-text">{r.remark}</p>
                          <div className="crm-tremark-meta">
                            <strong>{[r.teacher?.firstName, r.teacher?.lastName].filter(Boolean).join(' ') || 'Faculty'}</strong>
                            <span>•</span>
                            <span>{r.createdAt ? new Date(r.createdAt).toLocaleString('en-IN') : 'Just now'}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Academic Attendance History */}
            <div className="crm-tprofile-panel">
              <div className="crm-tprofile-panel__head">
                <h3 className="crm-tprofile-panel__title">
                  <FiClock className="text-indigo-600" /> Academic Session Attendance History
                </h3>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${historyFilter === 'ALL' ? 'bg-blue-100 text-blue-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                    onClick={() => setHistoryFilter('ALL')}
                  >
                    All ({data.history?.length || 5})
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${historyFilter === 'PRESENT' ? 'bg-emerald-100 text-emerald-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                    onClick={() => setHistoryFilter('PRESENT')}
                  >
                    Present ({totals.present || 5})
                  </button>
                  <button
                    type="button"
                    className={`px-2 py-0.5 rounded text-[11px] font-semibold cursor-pointer transition-colors ${historyFilter === 'ABSENT' ? 'bg-red-100 text-red-800 font-bold' : 'text-slate-600 hover:bg-slate-100'}`}
                    onClick={() => setHistoryFilter('ABSENT')}
                  >
                    Absent ({totals.absent || 0})
                  </button>
                </div>
              </div>

              <div className="crm-tprofile-panel__body">
                {!filteredHistory.length ? (
                  <EmptyState title="No attendance records match filter" />
                ) : (
                  <div className="crm-tatt-history-list">
                    {filteredHistory.map((row) => {
                      const d = new Date(row.startAt || row.date);
                      const dayNum = isNaN(d.getTime()) ? '—' : d.getDate().toString().padStart(2, '0');
                      const monthStr = isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-US', { month: 'short' });
                      const isPresent = row.status === 'PRESENT' || row.dailyStatus === 'P';
                      const timeDisplay = !isNaN(d.getTime()) ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';

                      return (
                        <div key={row.id} className="crm-tatt-history-item">
                          <div className="crm-tatt-date-box">
                            <span className="crm-tatt-date-box__day">{dayNum}</span>
                            <span className="crm-tatt-date-box__month">{monthStr}</span>
                          </div>

                          <div className="crm-tatt-info">
                            <span className="crm-tatt-title">{row.course || row.batch || 'Class Session'}</span>
                            <span className="crm-tatt-sub">
                              {row.room && (
                                <>
                                  <span>📍 {row.room}</span>
                                  <span>•</span>
                                </>
                              )}
                              <span>⏰ {timeDisplay}</span>
                              {row.batch && (
                                <>
                                  <span>•</span>
                                  <span>{row.batch}</span>
                                </>
                              )}
                            </span>
                          </div>

                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                              isPresent ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                            }`}
                          >
                            {isPresent ? '✓ PRESENT' : '✗ ABSENT'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Academic Particulars, Direct Communication & Faculty Guidance */}
          <div className="flex flex-col gap-4">
            {/* Academic Particulars Card */}
            <div className="crm-tprofile-panel">
              <div className="crm-tprofile-panel__head">
                <h3 className="crm-tprofile-panel__title">
                  <FiLayers className="text-violet-600" /> Academic Particulars
                </h3>
              </div>
              <div className="crm-tprofile-panel__body">
                <div className="crm-tpart-list">
                  <div className="crm-tpart-item">
                    <span className="crm-tpart-label">Student ID</span>
                    <span className="crm-tpart-val font-mono">{student.studentCode || '—'}</span>
                  </div>
                  <div className="crm-tpart-item">
                    <span className="crm-tpart-label">Enrolled Batch</span>
                    <span className="crm-tpart-val">{primaryBatchName}</span>
                  </div>
                  <div className="crm-tpart-item">
                    <span className="crm-tpart-label">Target Program</span>
                    <span className="crm-tpart-val">{primaryCourseName || '—'}</span>
                  </div>
                  <div className="crm-tpart-item">
                    <span className="crm-tpart-label">Assigned Room</span>
                    <span className="crm-tpart-val">{primaryRoom}</span>
                  </div>
                  <div className="crm-tpart-item">
                    <span className="crm-tpart-label">Class Schedule</span>
                    <span className="crm-tpart-val">{scheduleString}</span>
                  </div>
                  <div className="crm-tpart-item">
                    <span className="crm-tpart-label">Primary Faculty</span>
                    <span className="crm-tpart-val">{primaryFaculty}</span>
                  </div>
                  <div className="crm-tpart-item">
                    <span className="crm-tpart-label">Campus Branch</span>
                    <span className="crm-tpart-val">{branchName}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Direct Communication Shortcut Card — Managed in One Flex Row */}
            <div className="crm-tprofile-panel">
              <div className="crm-tprofile-panel__head">
                <h3 className="crm-tprofile-panel__title">
                  <FiMail className="text-blue-600" /> Direct Student Communication
                </h3>
                <span className="text-[11px] font-mono text-slate-400">
                  {studentPhone}
                </span>
              </div>
              <div className="crm-tprofile-panel__body">
                <div className="flex items-center gap-2 w-full">
                  <a
                    href={`mailto:${studentEmail}`}
                    title={`Email: ${studentEmail}`}
                    className="flex-1 min-w-0 py-2 px-2.5 rounded-lg bg-blue-50/80 hover:bg-blue-100 text-blue-700 dark:bg-blue-950/40 dark:border-blue-900/50 dark:text-blue-300 border border-blue-200/80 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold shadow-2xs"
                  >
                    <FiMail className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                    <span className="truncate">Email</span>
                  </a>

                  <a
                    href={`tel:${studentPhone}`}
                    title={`Call: ${studentPhone}`}
                    className="flex-1 min-w-0 py-2 px-2.5 rounded-lg bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:border-emerald-900/50 dark:text-emerald-300 border border-emerald-200/80 transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold shadow-2xs"
                  >
                    <FiPhone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <span className="truncate">Call</span>
                  </a>

                  <a
                    href={`https://wa.me/${studentPhone.replace(/[^0-9]/g, '')}`}
                    target="_blank"
                    rel="noreferrer"
                    title={`WhatsApp: ${studentPhone}`}
                    className="flex-1 min-w-0 py-2 px-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors flex items-center justify-center gap-1.5 text-xs font-bold shadow-2xs"
                  >
                    <FiMessageSquare className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">WhatsApp</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Faculty Academic Notice */}
            <div className="crm-tprofile-panel">
              <div className="crm-tprofile-panel__head">
                <h3 className="crm-tprofile-panel__title">
                  <FiInfo className="text-amber-600" /> Student Portal Synchronization
                </h3>
              </div>
              <div className="crm-tprofile-panel__body text-xs text-slate-600 space-y-2">
                <div className="p-2 rounded bg-amber-50 border border-amber-200 text-amber-900">
                  Remarks published on this profile are displayed directly on <strong>{fullName}'s</strong> student mobile app and desktop portal.
                </div>
                <div className="flex items-start gap-1.5 pt-1">
                  <FiCheck className="text-emerald-600 mt-0.5 shrink-0" />
                  <span>Attendance updates reflect on the student's progress ring within 60 seconds.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModulePageCard>
  );
}