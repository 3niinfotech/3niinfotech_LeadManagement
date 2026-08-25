import { Link, useNavigate } from 'react-router-dom';
import {
  FiSend,
  FiGlobe,
  FiFileText,
  FiMessageSquare,
  FiPhone,
  FiMail,
  FiMapPin,
  FiCalendar,
  FiBookOpen,
  FiAward,
  FiExternalLink,
  FiPlus,
  FiUserCheck,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Avatar from '../../../../../components/ui/Avatar';
import Badge from '../../../../../components/ui/Badge';
import Button from '../../../../../components/ui/Button';
import { STUDENT_STATUSES } from '../../../../../config/constants';
import { ROUTES } from '../../../../../config/routes';
import { useStudentStatusOptions } from '../../../hooks/useStudentStatusOptions';

function QuickStatCard({ label, count, icon: Icon, color, onClick }) {
  return (
    <div
      onClick={onClick}
      className={`p-4 rounded-xl border border-border bg-surface transition-all duration-200 hover:shadow-sm ${
        onClick ? 'cursor-pointer hover:border-primary/40' : ''
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-text-muted uppercase tracking-wider">{label}</span>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="mt-2 text-2xl font-bold text-text tabular-nums">{count}</div>
    </div>
  );
}

export default function StudentOverviewTab({ student, onTabChange }) {
  const navigate = useNavigate();
  const { getStatusMeta } = useStudentStatusOptions();

  if (!student) return null;

  const meta = getStatusMeta(student.status);
  const statusMeta = meta || STUDENT_STATUSES.find((s) => s.value === student.status);
  const enquiryId = student.metadata?.enquiryId || student.enquiry?.id;
  const enquiryCode = student.metadata?.enquiryCode || student.enquiry?.enquiryCode;

  const name = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
  const cleanPhone = student.phone ? String(student.phone).replace(/\D/g, '') : '';

  const appsCount = student.applications?.length ?? 0;
  const visasCount = student.visas?.length ?? 0;
  const docsCount = student.documents?.length ?? 0;
  const notesCount = student.notes?.length ?? 0;

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <div className="p-5 rounded-2xl bg-surface border border-border flex flex-col md:flex-row md:items-center justify-between gap-5 shadow-xs">
        <div className="flex items-start sm:items-center gap-4">
          <Avatar
            name={name}
            size="xl"
            className="ring-4 ring-surface-hover shadow-sm"
          />
          <div>
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-xl font-bold text-text">{name}</h2>
              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-primary/10 text-primary">
                {student.studentCode}
              </span>
              {statusMeta && (
                <Badge color={statusMeta.color || 'primary'}>
                  {statusMeta.label || student.status}
                </Badge>
              )}
            </div>

            <div className="flex items-center gap-4 mt-2 flex-wrap text-xs text-text-muted">
              {student.phone && (
                <span className="flex items-center gap-1">
                  <FiPhone className="w-3.5 h-3.5" />
                  <span className="tabular-nums font-medium text-text">{student.phone}</span>
                </span>
              )}
              {student.email && (
                <span className="flex items-center gap-1">
                  <FiMail className="w-3.5 h-3.5" />
                  <span className="font-medium text-text">{student.email}</span>
                </span>
              )}
              {student.branch?.name && (
                <span className="flex items-center gap-1">
                  <FiMapPin className="w-3.5 h-3.5" />
                  <span>{student.branch.name}</span>
                </span>
              )}
              {student.assignedTo && (
                <span className="flex items-center gap-1">
                  <FiUserCheck className="w-3.5 h-3.5" />
                  <span>
                    Counsellor: <strong className="text-text font-semibold">{`${student.assignedTo.firstName || ''} ${student.assignedTo.lastName || ''}`.trim()}</strong>
                  </span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Quick Communication Actions */}
        <div className="flex items-center gap-2 shrink-0">
          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 transition-colors text-xs font-semibold"
            >
              <FaWhatsapp className="w-4 h-4" />
              WhatsApp
            </a>
          )}
          {cleanPhone && (
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-xs font-semibold"
            >
              <FiPhone className="w-4 h-4" />
              Call
            </a>
          )}
          {enquiryId && (
            <Link
              to={ROUTES.ENQUIRY_DETAIL(enquiryId)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-500/10 text-purple-600 hover:bg-purple-500/20 transition-colors text-xs font-semibold"
            >
              <FiExternalLink className="w-4 h-4" />
              Enquiry {enquiryCode || ''}
            </Link>
          )}
        </div>
      </div>

      {/* Target Destination & Academic Roadmap */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            <FiGlobe className="w-4 h-4 text-sky-500" /> Target Country
          </div>
          <div className="text-base font-bold text-text">{student.country || '—'}</div>
          <div className="text-xs text-text-muted mt-1">Destination of interest</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            <FiBookOpen className="w-4 h-4 text-indigo-500" /> Course / Program
          </div>
          <div className="text-base font-bold text-text">{student.course || '—'}</div>
          <div className="text-xs text-text-muted mt-1">Study major</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            <FiAward className="w-4 h-4 text-amber-500" /> University
          </div>
          <div className="text-base font-bold text-text truncate" title={student.university || '—'}>
            {student.university || '—'}
          </div>
          <div className="text-xs text-text-muted mt-1">Preferred institution</div>
        </div>

        <div className="p-4 rounded-xl border border-border bg-surface">
          <div className="flex items-center gap-2 text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
            <FiCalendar className="w-4 h-4 text-emerald-500" /> Target Intake
          </div>
          <div className="text-base font-bold text-text">{student.intake || '—'}</div>
          <div className="text-xs text-text-muted mt-1">Semester / Year</div>
        </div>
      </div>

      {/* Quick Counts & Module Summary Cards */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold text-text uppercase tracking-wider">Application & Journey Metrics</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <QuickStatCard
            label="Applications"
            count={appsCount}
            icon={FiSend}
            color="bg-sky-500/10 text-sky-600"
            onClick={() => onTabChange?.('applications')}
          />
          <QuickStatCard
            label="Visa Cases"
            count={visasCount}
            icon={FiGlobe}
            color="bg-amber-500/10 text-amber-600"
            onClick={() => onTabChange?.('visa')}
          />
          <QuickStatCard
            label="Documents"
            count={docsCount}
            icon={FiFileText}
            color="bg-emerald-500/10 text-emerald-600"
            onClick={() => onTabChange?.('documents')}
          />
          <QuickStatCard
            label="Notes & Remarks"
            count={notesCount}
            icon={FiMessageSquare}
            color="bg-purple-500/10 text-purple-600"
            onClick={() => onTabChange?.('notes')}
          />
        </div>
      </div>
    </div>
  );
}
