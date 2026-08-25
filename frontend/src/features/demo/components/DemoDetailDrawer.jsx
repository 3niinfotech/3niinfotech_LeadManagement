import { useNavigate } from 'react-router-dom';
import {
  FiCalendar,
  FiClock,
  FiUser,
  FiBookOpen,
  FiMapPin,
  FiCheckCircle,
  FiXCircle,
  FiPhone,
  FiMail,
  FiExternalLink,
  FiEdit,
  FiMessageSquare,
  FiInfo,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Drawer from '../../../components/ui/Drawer';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Avatar from '../../../components/ui/Avatar';
import { ROUTES } from '../../../config/routes';
import {
  getDemoAttendanceBadgeTone,
  getDemoSessionStatusTone,
  getDemoResultBadgeTone,
  DEMO_ATTENDANCE_OPTIONS,
  DEMO_SESSION_STATUS_OPTIONS,
  DEMO_RESULT_OPTIONS,
} from '../config/demoConstants';
import { getDocumentUrl } from '../../enquiry/config/enquiryDocument.config';

function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export default function DemoDetailDrawer({
  open,
  onClose,
  demo,
  onMarkAttendance,
  onReschedule,
  onCancel,
}) {
  const navigate = useNavigate();

  if (!demo) return null;

  const enquiry = demo.enquiry || {};
  const enquiryId = enquiry.id || demo.enquiryId;
  const studentName = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim() || 'Unknown Student';
  const mobile = enquiry.mobile;
  const cleanMobile = mobile ? String(mobile).replace(/\D/g, '') : '';
  const email = enquiry.email;

  const isCancelled = demo.sessionStatus === 'CANCELLED';
  const isRescheduled = demo.sessionStatus === 'RESCHEDULED';
  const isInactive = isCancelled || isRescheduled;

  const handleOpenEnquiry = () => {
    if (!enquiryId) return;
    navigate(ROUTES.ENQUIRY_TAB(enquiryId, 'demo'));
    onClose();
  };

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Demo Session Details"
      width="540px"
      footer={
        <div className="flex items-center justify-between gap-2 w-full">
          <Button
            variant="outline"
            size="sm"
            icon={FiExternalLink}
            onClick={handleOpenEnquiry}
          >
            Open Enquiry
          </Button>

          <div className="flex items-center gap-2">
            {!isInactive && (
              <>
                <Button
                  variant="outline-danger"
                  size="sm"
                  icon={FiXCircle}
                  onClick={() => {
                    onClose();
                    onCancel?.(demo);
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="outline-warning"
                  size="sm"
                  icon={FiCalendar}
                  onClick={() => {
                    onClose();
                    onReschedule?.(demo);
                  }}
                >
                  Reschedule
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  icon={FiCheckCircle}
                  onClick={() => {
                    onClose();
                    onMarkAttendance?.(demo);
                  }}
                >
                  Attendance
                </Button>
              </>
            )}
          </div>
        </div>
      }
    >
      <div className="space-y-5">
        {/* Student Profile Card */}
        <div className="p-4 rounded-xl bg-surface border border-border flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar
              name={studentName}
              src={getDocumentUrl(enquiry.photoUrl)}
              size="lg"
            />
            <div className="min-w-0">
              <h3 className="text-base font-bold text-text truncate">{studentName}</h3>
              <div className="flex items-center gap-2 mt-0.5 text-xs text-text-muted">
                <span className="font-mono font-medium text-primary cursor-pointer hover:underline" onClick={handleOpenEnquiry}>
                  {enquiry.enquiryCode}
                </span>
                {enquiry.status && (
                  <span>· <span className="uppercase">{enquiry.status.replace(/_/g, ' ')}</span></span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {cleanMobile && (
              <a
                href={`https://wa.me/${cleanMobile}`}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors"
                title="WhatsApp student"
              >
                <FaWhatsapp className="w-4 h-4" />
              </a>
            )}
            {cleanMobile && (
              <a
                href={`tel:${cleanMobile}`}
                className="p-2 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
                title="Call student"
              >
                <FiPhone className="w-4 h-4" />
              </a>
            )}
            {email && (
              <a
                href={`mailto:${email}`}
                className="p-2 rounded-lg bg-sky-500/10 text-sky-600 hover:bg-sky-500/20 transition-colors"
                title="Email student"
              >
                <FiMail className="w-4 h-4" />
              </a>
            )}
          </div>
        </div>

        {/* Statuses Badges Strip */}
        <div className="grid grid-cols-3 gap-2">
          <div className="p-2.5 rounded-lg border border-border bg-card-bg text-center">
            <div className="text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1">Session</div>
            <Badge color={getDemoSessionStatusTone(demo.sessionStatus)}>
              {DEMO_SESSION_STATUS_OPTIONS.find((s) => s.value === demo.sessionStatus)?.label || demo.sessionStatus || 'SCHEDULED'}
            </Badge>
          </div>

          <div className="p-2.5 rounded-lg border border-border bg-card-bg text-center">
            <div className="text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1">Attendance</div>
            <Badge color={getDemoAttendanceBadgeTone(demo.attendance)}>
              {DEMO_ATTENDANCE_OPTIONS.find((a) => a.value === demo.attendance)?.label || demo.attendance || 'NOT_MARKED'}
            </Badge>
          </div>

          <div className="p-2.5 rounded-lg border border-border bg-card-bg text-center">
            <div className="text-[11px] text-text-muted font-medium uppercase tracking-wider mb-1">Outcome</div>
            <Badge color={getDemoResultBadgeTone(demo.result)}>
              {DEMO_RESULT_OPTIONS.find((r) => r.value === demo.result)?.label || demo.result || 'PENDING'}
            </Badge>
          </div>
        </div>

        {/* Demo Details Section */}
        <div className="space-y-3">
          <h4 className="text-xs font-bold text-text uppercase tracking-wider">Session Details</h4>
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded-lg border border-border bg-card-bg">
              <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                <FiCalendar className="w-3.5 h-3.5" /> Date & Time
              </div>
              <div className="font-semibold text-text">{formatDateTime(demo.demoDate)}</div>
              {demo.endAt && (
                <div className="text-xs text-text-muted mt-0.5">Until {formatDateTime(demo.endAt)}</div>
              )}
            </div>

            <div className="p-3 rounded-lg border border-border bg-card-bg">
              <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                <FiBookOpen className="w-3.5 h-3.5" /> Course & Batch
              </div>
              <div className="font-semibold text-text">{demo.className || enquiry.interestedCourse || '—'}</div>
              <div className="text-xs text-text-muted mt-0.5">{demo.batch || 'Standard Batch'}</div>
            </div>

            <div className="p-3 rounded-lg border border-border bg-card-bg">
              <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                <FiUser className="w-3.5 h-3.5" /> Faculty / Trainer
              </div>
              <div className="font-semibold text-text">
                {demo.faculty?.name || `${demo.faculty?.firstName || ''} ${demo.faculty?.lastName || ''}`.trim() || 'Unassigned'}
              </div>
              {demo.faculty?.email && (
                <div className="text-xs text-text-muted mt-0.5">{demo.faculty.email}</div>
              )}
            </div>

            <div className="p-3 rounded-lg border border-border bg-card-bg">
              <div className="flex items-center gap-1.5 text-xs text-text-muted mb-1">
                <FiMapPin className="w-3.5 h-3.5" /> Branch & Counsellor
              </div>
              <div className="font-semibold text-text">{enquiry.branch?.name || 'Main Branch'}</div>
              <div className="text-xs text-text-muted mt-0.5">
                Counsellor: {enquiry.assignedTo ? `${enquiry.assignedTo.firstName || ''} ${enquiry.assignedTo.lastName || ''}`.trim() : 'Unassigned'}
              </div>
            </div>
          </div>
        </div>

        {/* Feedback & Notes */}
        {(demo.feedback || demo.remark || demo.cancelledReason) && (
          <div className="space-y-3">
            <h4 className="text-xs font-bold text-text uppercase tracking-wider">Feedback & Notes</h4>

            {demo.cancelledReason && (
              <div className="p-3 rounded-lg border border-rose-500/20 bg-rose-500/5 text-xs">
                <span className="font-bold text-rose-600 dark:text-rose-400">Cancellation Reason: </span>
                <span className="text-text">{demo.cancelledReason}</span>
              </div>
            )}

            {demo.feedback && (
              <div className="p-3 rounded-lg border border-border bg-card-bg text-xs">
                <div className="font-semibold text-text mb-1">Student / Faculty Feedback</div>
                <p className="text-text-secondary leading-relaxed">{demo.feedback}</p>
              </div>
            )}

            {demo.remark && (
              <div className="p-3 rounded-lg border border-border bg-card-bg text-xs">
                <div className="font-semibold text-text mb-1">Internal Remarks</div>
                <p className="text-text-secondary leading-relaxed">{demo.remark}</p>
              </div>
            )}
          </div>
        )}

        {/* Audit Lifecycle */}
        <div className="space-y-2 pt-2 border-t border-border text-xs text-text-muted">
          {demo.attendanceMarkedAt && (
            <div className="flex items-center justify-between">
              <span>Attendance Marked</span>
              <span className="tabular-nums font-medium text-text">
                {formatDateTime(demo.attendanceMarkedAt)}
                {demo.attendanceMarkedBy ? ` by ${demo.attendanceMarkedBy.firstName}` : ''}
              </span>
            </div>
          )}

          {demo.createdAt && (
            <div className="flex items-center justify-between">
              <span>Scheduled On</span>
              <span className="tabular-nums font-medium text-text">
                {formatDateTime(demo.createdAt)}
                {demo.user ? ` by ${demo.user.firstName}` : ''}
              </span>
            </div>
          )}

          {demo.rescheduledFromId && (
            <div className="p-2 rounded bg-amber-500/10 text-amber-800 dark:text-amber-300 text-[11px]">
              This session was rescheduled from an earlier appointment.
            </div>
          )}
        </div>
      </div>
    </Drawer>
  );
}
