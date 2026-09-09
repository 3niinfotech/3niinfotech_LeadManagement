import {
  FiArrowLeft,
  FiPhone,
  FiMail,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Breadcrumb from '../../../../components/layout/Breadcrumb';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import Avatar from '../../../../components/ui/Avatar';
import { STUDENT_STATUSES } from '../../../../config/constants';
import { useStudentStatusOptions } from '../../hooks/useStudentStatusOptions';
import { resolveStudentPhotoUrl } from '../../config/studentDocument.config';

/** Minimal student header — identity + contact only. Details live on Overview / Profile tabs. */
export default function StudentPageHeader({
  student,
  breadcrumbs = [],
  quickActions,
  onBack,
}) {
  const { getStatusMeta } = useStudentStatusOptions();
  if (!student) return null;

  const name = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
  const meta = getStatusMeta(student.status);
  const statusMeta = meta || STUDENT_STATUSES.find((s) => s.value === student.status);
  const cleanPhone = student.phone ? String(student.phone).replace(/\D/g, '') : '';
  const photoUrl = resolveStudentPhotoUrl(student);

  return (
    <header className="crm-enquiry-hero crm-student-hero crm-student-hero--compact p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-xs">
      {breadcrumbs.length > 0 && (
        <div className="crm-enquiry-hero__crumb !p-0 mb-3">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <Avatar
            name={name}
            src={photoUrl || ''}
            size="lg"
            className="!rounded-2xl ring-2 ring-brand/25 ring-offset-2 ring-offset-surface shadow-sm shrink-0"
          />

          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg sm:text-xl font-bold text-text truncate tracking-tight">{name}</h1>
              {student.studentCode && (
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-soft text-brand border border-brand/20">
                  {student.studentCode}
                </span>
              )}
              {statusMeta && (
                <Badge color={statusMeta.color || 'primary'}>
                  {statusMeta.label || student.status}
                </Badge>
              )}
            </div>

            {(student.phone || student.email) && (
              <div className="flex items-center gap-3 flex-wrap mt-1 text-xs text-text-muted">
                {student.phone && (
                  <span className="inline-flex items-center gap-1 tabular-nums">
                    <FiPhone className="w-3 h-3" /> {student.phone}
                  </span>
                )}
                {student.email && (
                  <span className="inline-flex items-center gap-1 truncate max-w-[240px]">
                    <FiMail className="w-3 h-3" /> {student.email}
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {cleanPhone && (
            <a
              href={`https://wa.me/${cleanPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-700 text-xs font-semibold border border-emerald-500/20 hover:bg-emerald-500/15"
            >
              <FaWhatsapp className="w-3.5 h-3.5" />
              WhatsApp
            </a>
          )}
          {cleanPhone && (
            <a
              href={`tel:${cleanPhone}`}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-brand-soft text-brand text-xs font-semibold border border-brand/20 hover:opacity-90"
            >
              <FiPhone className="w-3.5 h-3.5" />
              Call
            </a>
          )}
          {quickActions}
          {onBack && (
            <Button variant="outline" size="sm" icon={FiArrowLeft} onClick={onBack}>
              Back to list
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
