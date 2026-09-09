import {
  FiArrowLeft,
  FiArrowUpRight,
  FiUser,
  FiBookOpen,
  FiCalendar,
} from 'react-icons/fi';
import Breadcrumb from '../../../../components/layout/Breadcrumb';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import Avatar from '../../../../components/ui/Avatar';
import CountryFlagLabel from '../../../../components/ui/CountryFlagLabel';
import { ENQUIRY_STATUSES, ENQUIRY_PRIORITIES } from '../../../../config/constants';
import { ROUTES } from '../../../../config/routes';
import { resolveEnquiryPhotoUrl } from '../../config/enquiryDocument.config';

/** Single unified modern header — forces photo when available (photoUrl or PHOTO document). */
export default function EnquiryPageHeader({
  enquiry,
  breadcrumbs = [],
  quickActions,
  onBack,
}) {
  if (!enquiry) return null;

  const leadName = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim() || 'Lead';
  const status = ENQUIRY_STATUSES.find((s) => s.value === enquiry.status);
  const priority = ENQUIRY_PRIORITIES.find((p) => p.value === enquiry.priority);
  const nextFollowUp = enquiry.nextFollowUpAt
    ? new Date(enquiry.nextFollowUpAt).toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;
  const converted = enquiry.status === 'CONVERTED' && enquiry.studentId;
  const photoUrl = resolveEnquiryPhotoUrl(enquiry);

  return (
    <header className="crm-enquiry-hero p-4 sm:p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-3">
      {breadcrumbs.length > 0 && (
        <div className="crm-enquiry-hero__crumb !p-0">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="relative shrink-0">
            <Avatar
              src={photoUrl || ''}
              name={leadName}
              size="lg"
              className="!rounded-xl ring-2 ring-brand/25 ring-offset-2 ring-offset-surface shadow-sm"
            />

          </div>

          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-bold text-text truncate tracking-tight">{leadName}</h1>

              {enquiry.enquiryCode && (
                <span className="font-mono text-[11px] font-semibold px-2 py-0.5 rounded-md bg-brand-soft text-brand border border-brand/20">
                  {enquiry.enquiryCode}
                </span>
              )}

              {status && (
                <Badge color={status.color || 'primary'}>
                  {status.label}
                </Badge>
              )}

              {priority && enquiry.status !== 'CONVERTED' && (
                <span className="text-xs font-medium text-text-muted">{priority.label}</span>
              )}
            </div>

            <div className="flex items-center gap-2 flex-wrap text-xs text-text-muted">
              {enquiry.interestedCountry && (
                <span className="inline-flex items-center gap-1.5 font-medium text-text bg-page px-2 py-0.5 rounded-lg border border-border">
                  <CountryFlagLabel country={enquiry.interestedCountry} size="sm" />
                </span>
              )}

              {enquiry.interestedCourse && (
                <span className="inline-flex items-center gap-1.5 font-medium text-text bg-page px-2 py-0.5 rounded-lg border border-border max-w-[280px] truncate" title={enquiry.interestedCourse}>
                  <FiBookOpen className="w-3.5 h-3.5 text-brand" />
                  <span className="truncate">Course: <strong>{enquiry.interestedCourse}</strong></span>
                </span>
              )}

              {nextFollowUp && (
                <span className="inline-flex items-center gap-1.5 bg-page px-2 py-0.5 rounded-lg border border-border">
                  <FiCalendar className="w-3.5 h-3.5 text-warning" />
                  Next: <strong className="text-text">{nextFollowUp}</strong>
                </span>
              )}

              {converted && !enquiry.student?.deletedAt && (
                <a
                  href={ROUTES.STUDENT_DETAIL(enquiry.studentId)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 font-semibold text-brand hover:underline"
                >
                  <FiUser className="w-3.5 h-3.5" />
                  Student profile
                  <FiArrowUpRight className="w-3 h-3" />
                </a>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 flex-wrap">
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
