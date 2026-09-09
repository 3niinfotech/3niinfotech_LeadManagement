import { useState, useEffect } from 'react';
import {
  FiCheckCircle,
  FiXCircle,
  FiClock,
  FiThumbsUp,
  FiThumbsDown,
  FiAward,
  FiMinus,
  FiCalendar,
  FiUser,
  FiBookOpen,
} from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Textarea from '../../../components/ui/Textarea';
import Badge from '../../../components/ui/Badge';
import {
  DEMO_ATTENDANCE_OPTIONS,
  DEMO_RESULT_OPTIONS,
  getDemoAttendanceBadgeTone,
  getDemoResultBadgeTone,
} from '../config/demoConstants';
import { useMarkDemoAttendanceMutation } from '../../enquiry/redux/enquiryApiSlice';
import toastService from '../../../services/toast/toast.service';

const ATTENDANCE_PRESETS = [
  {
    value: 'PRESENT',
    label: 'PRESENT',
    icon: FiCheckCircle,
    activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    value: 'ABSENT',
    label: 'ABSENT',
    icon: FiXCircle,
    activeClass: 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30',
    iconClass: 'text-rose-600 dark:text-rose-400',
  },
];

const OUTCOME_PRESETS = [
  {
    value: 'POSITIVE',
    label: 'Positive',
    icon: FiThumbsUp,
    activeClass: 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 ring-2 ring-emerald-500/30',
    iconClass: 'text-emerald-600 dark:text-emerald-400',
  },
  {
    value: 'CONVERTED',
    label: 'Converted',
    icon: FiAward,
    activeClass: 'border-purple-500 bg-purple-500/10 text-purple-700 dark:text-purple-300 ring-2 ring-purple-500/30',
    iconClass: 'text-purple-600 dark:text-purple-400',
  },
  {
    value: 'NEUTRAL',
    label: 'Neutral',
    icon: FiMinus,
    activeClass: 'border-slate-500 bg-slate-500/10 text-slate-700 dark:text-slate-300 ring-2 ring-slate-500/30',
    iconClass: 'text-slate-600 dark:text-slate-400',
  },
  {
    value: 'NEGATIVE',
    label: 'Negative',
    icon: FiThumbsDown,
    activeClass: 'border-rose-500 bg-rose-500/10 text-rose-700 dark:text-rose-300 ring-2 ring-rose-500/30',
    iconClass: 'text-rose-600 dark:text-rose-400',
  },
  {
    value: 'PENDING',
    label: 'Pending Outcome',
    icon: FiClock,
    activeClass: 'border-primary bg-primary/10 text-primary ring-2 ring-primary/30',
    iconClass: 'text-primary',
  },
];

export default function MarkAttendanceModal({
  open,
  onClose,
  demo,
  onSuccess,
}) {
  const [markAttendance, { isLoading: submitting }] = useMarkDemoAttendanceMutation();

  const [activeSessionId, setActiveSessionId] = useState(null);
  const [attendance, setAttendance] = useState('PRESENT');
  const [result, setResult] = useState('POSITIVE');
  const [feedback, setFeedback] = useState('');
  const [remark, setRemark] = useState('');

  // Extract all sessions for multi-day timeline
  const enquiry = demo?.enquiry || {};
  const allSessions = enquiry?.demos?.length ? enquiry.demos : (demo ? [demo] : []);

  useEffect(() => {
    if (open && demo) {
      setActiveSessionId(demo.id);
      const att = demo.attendance === 'ATTENDED' ? 'PRESENT'
        : demo.attendance === 'NO_SHOW' ? 'ABSENT'
          : (demo.attendance === 'NOT_MARKED' ? 'PRESENT' : (demo.attendance || 'PRESENT'));
      setAttendance(att === 'LATE' || att === 'PARTIAL' ? 'PRESENT' : att);
      setResult(demo.result || 'POSITIVE');
      setFeedback(demo.feedback || '');
      setRemark(demo.remark || '');
    }
  }, [open, demo]);

  const currentSession = allSessions.find((s) => s.id === activeSessionId) || demo;

  const handleSelectSession = (session) => {
    setActiveSessionId(session.id);
    const att = session.attendance === 'ATTENDED' ? 'PRESENT'
      : session.attendance === 'NO_SHOW' ? 'ABSENT'
        : (session.attendance === 'NOT_MARKED' ? 'PRESENT' : (session.attendance || 'PRESENT'));
    setAttendance(att === 'LATE' || att === 'PARTIAL' ? 'PRESENT' : att);
    setResult(session.result || 'POSITIVE');
    setFeedback(session.feedback || '');
    setRemark(session.remark || '');
  };

  if (!demo) return null;

  const enquiryId = enquiry.id || demo.enquiryId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const targetSessionId = activeSessionId || demo.id;

    if (!enquiryId) {
      toastService.error('Missing enquiry reference for this demo session');
      return;
    }

    try {
      await markAttendance({
        id: enquiryId,
        demoId: targetSessionId,
        attendance,
        result,
        feedback: feedback.trim() || undefined,
        remark: remark.trim() || undefined,
      }).unwrap();

      toastService.success('Attendance & outcome recorded successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toastService.error(err?.data?.message || 'Failed to mark attendance');
    }
  };

  const studentName = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim() || 'Student';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Mark Attendance & Demo Outcome"
      subtitle={`Student: ${studentName} (${enquiry.enquiryCode || ''})`}
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="mark-demo-attendance-form"
            loading={submitting}
            icon={FiCheckCircle}
          >
            Save Attendance
          </Button>
        </>
      }
    >
      <form id="mark-demo-attendance-form" onSubmit={handleSubmit} className="space-y-5">
        {/* Multi-Day Demo Sessions Grid / Timeline */}
        {allSessions.length > 0 && (
          <div className="p-3.5 rounded-xl bg-surface-hover/50 border border-border space-y-2.5">
            <div className="flex items-center justify-between text-xs font-bold text-text uppercase tracking-wider">
              <span className="flex items-center gap-1.5">
                <FiCalendar className="w-3.5 h-3.5 text-primary" />
                Demo Sessions Schedule ({allSessions.length} {allSessions.length === 1 ? 'Day' : 'Days'})
              </span>
              <span className="text-[11px] font-normal text-text-muted">
                Click a day to view/update attendance
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {allSessions.map((session, index) => {
                const isSelected = (currentSession?.id === session.id);
                const isAttended = session.attendance === 'ATTENDED' || session.attendance === 'PRESENT';
                const isAbsent = session.attendance === 'ABSENT' || session.attendance === 'NO_SHOW';
                const isLateOrPartial = false;
                const isNotMarked = !session.attendance || session.attendance === 'NOT_MARKED'
                  || session.attendance === 'LATE' || session.attendance === 'PARTIAL';

                const sDate = session.demoDate
                  ? new Date(session.demoDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })
                  : '—';
                const sTime = session.demoDate
                  ? new Date(session.demoDate).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
                  : '';

                return (
                  <div
                    key={session.id || index}
                    onClick={() => handleSelectSession(session)}
                    className={`p-2.5 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? 'border-primary bg-primary/10 ring-2 ring-primary/20 shadow-xs'
                        : 'border-border bg-surface hover:border-primary/40'
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-text">Day {index + 1}</span>
                        <span className="text-[11px] text-text-muted tabular-nums">({sDate})</span>
                      </div>
                      <div className="text-[11px] text-text-muted truncate mt-0.5">
                        {session.className || enquiry.interestedCourse || 'Demo'} · {sTime}
                      </div>
                    </div>

                    {/* Status Icon Badge */}
                    <div className="shrink-0">
                      {isAttended ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 text-[10px] font-bold">
                          <FiCheckCircle className="w-3 h-3" /> Attended
                        </span>
                      ) : isAbsent ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-600 text-[10px] font-bold">
                          <FiXCircle className="w-3 h-3" /> Absent
                        </span>
                      ) : isLateOrPartial ? (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-600 text-[10px] font-bold">
                          <FiClock className="w-3 h-3" /> {session.attendance}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-slate-500/10 text-slate-500 text-[10px] font-medium">
                          <FiClock className="w-3 h-3" /> Pending
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Session Info Bar */}
        <div className="p-3 rounded-xl bg-surface border border-border flex items-center justify-between text-xs flex-wrap gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <FiBookOpen className="w-4 h-4" />
            </div>
            <div>
              <div className="font-bold text-text">
                {currentSession?.className || enquiry.interestedCourse || 'Demo Session'}
                <span className="text-text-muted font-normal ml-1.5">({currentSession?.batch || 'Morning A'})</span>
              </div>
              <div className="text-[11px] text-text-muted mt-0.5">
                {currentSession?.demoDate ? new Date(currentSession.demoDate).toLocaleString('en-IN', {
                  day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
                }) : '—'}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <Badge color={getDemoAttendanceBadgeTone(attendance)}>
              {DEMO_ATTENDANCE_OPTIONS.find((a) => a.value === attendance)?.label || attendance}
            </Badge>
            <Badge color={getDemoResultBadgeTone(result)}>
              {DEMO_RESULT_OPTIONS.find((r) => r.value === result)?.label || result}
            </Badge>
          </div>
        </div>

        {/* Interactive Attendance Status Cards */}
        <div>
          <label className="block text-xs font-bold text-text uppercase tracking-wider mb-2">
            Mark Attendance Status <span className="text-danger">*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
            {ATTENDANCE_PRESETS.map((item) => {
              const isSelected = attendance === item.value;
              const Icon = item.icon;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setAttendance(item.value)}
                  className={`p-3 rounded-xl border text-left transition-all duration-150 flex flex-col items-center justify-center gap-1.5 text-center ${
                    isSelected
                      ? `${item.activeClass} shadow-xs font-bold`
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-hover hover:border-border-hover'
                  }`}
                >
                  <Icon className={`w-5 h-5 ${isSelected ? item.iconClass : 'text-text-muted'}`} />
                  <span className="text-xs">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Interactive Outcome Result Cards */}
        <div>
          <label className="block text-xs font-bold text-text uppercase tracking-wider mb-2">
            Demo Outcome & Conversion Signal
          </label>
          <div className="flex flex-wrap gap-2">
            {OUTCOME_PRESETS.map((item) => {
              const isSelected = result === item.value;
              const Icon = item.icon;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setResult(item.value)}
                  className={`flex-1 min-w-[120px] p-2.5 rounded-xl border transition-all duration-150 flex items-center justify-center gap-1.5 text-center ${
                    isSelected
                      ? `${item.activeClass} shadow-xs font-bold`
                      : 'border-border bg-surface text-text-secondary hover:bg-surface-hover hover:border-border-hover'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isSelected ? item.iconClass : 'text-text-muted'}`} />
                  <span className="text-xs whitespace-nowrap">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Feedback & Remarks Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pt-1">
          <div>
            <Textarea
              label="Student / Faculty Feedback"
              placeholder="e.g. Student found the session helpful, wants to proceed with foundation batch..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              rows={2}
            />
          </div>

          <div>
            <Textarea
              label="Internal Remarks / Next Steps"
              placeholder="e.g. Follow up on fee structure, send quotation, convert to student..."
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              rows={2}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
