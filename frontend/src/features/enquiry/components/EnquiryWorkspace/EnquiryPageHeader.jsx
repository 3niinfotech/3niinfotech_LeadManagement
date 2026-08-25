import { Link } from 'react-router-dom';
import {
  FiArrowLeft,
  FiArrowUpRight,
  FiUser,
  FiGlobe,
  FiBookOpen,
  FiCalendar,
} from 'react-icons/fi';
import Breadcrumb from '../../../../components/layout/Breadcrumb';
import Badge from '../../../../components/ui/Badge';
import Button from '../../../../components/ui/Button';
import Avatar from '../../../../components/ui/Avatar';
import { ENQUIRY_STATUSES, ENQUIRY_PRIORITIES } from '../../../../config/constants';
import { ROUTES } from '../../../../config/routes';
import { getDocumentUrl } from '../../config/enquiryDocument.config';

/** Single unified modern header block — lead details, status badges, and destination info in one clean row */
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
  const photoUrl = getDocumentUrl(enquiry.photoUrl);

  return (
    <header className="crm-enquiry-hero p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-3.5">
      {breadcrumbs.length > 0 && (
        <div className="crm-enquiry-hero__crumb">
          <Breadcrumb items={breadcrumbs} />
        </div>
      )}

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Avatar + Identity + Live Badges + Destination metadata */}
        <div className="flex items-center gap-4 min-w-0">
          <Avatar
            src={photoUrl}
            name={leadName}
            size="lg"
            className="ring-4 ring-surface-hover shadow-xs shrink-0"
          />

          <div className="min-w-0 space-y-1.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-xl font-bold text-text truncate">{leadName}</h1>

              {enquiry.enquiryCode && (
                <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                  {enquiry.enquiryCode}
                </span>
              )}

              {status && (
                <Badge color={status.color || 'primary'}>
                  {status.label}
                </Badge>
              )}

              {priority && (
                <Badge color="secondary">
                  {priority.label}
                </Badge>
              )}

              {converted && (
                <Badge color="success">
                  Converted
                </Badge>
              )}
            </div>

            {/* Inline Destination & Follow-up Badges */}
            <div className="flex items-center gap-3 flex-wrap text-xs text-text-muted">
              {enquiry.interestedCountry && (
                <span className="inline-flex items-center gap-1.5 font-medium text-text bg-surface-hover/80 px-2 py-0.5 rounded-md border border-border">
                  <FiGlobe className="w-3.5 h-3.5 text-sky-500" />
                  <span>Country: <strong className="text-text">{enquiry.interestedCountry}</strong></span>
                </span>
              )}

              {enquiry.interestedCourse && (
                <span className="inline-flex items-center gap-1.5 font-medium text-text bg-surface-hover/80 px-2 py-0.5 rounded-md border border-border max-w-[280px] truncate" title={enquiry.interestedCourse}>
                  <FiBookOpen className="w-3.5 h-3.5 text-indigo-500" />
                  <span className="truncate">Course: <strong className="text-text">{enquiry.interestedCourse}</strong></span>
                </span>
              )}

              {nextFollowUp && (
                <span className="inline-flex items-center gap-1.5 text-text-muted bg-surface-hover/60 px-2 py-0.5 rounded-md border border-border">
                  <FiCalendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>Next: <strong className="text-text font-semibold">{nextFollowUp}</strong></span>
                </span>
              )}

              {converted && (
                <Link
                  to={ROUTES.STUDENT_DETAIL(enquiry.studentId)}
                  className="inline-flex items-center gap-1 font-semibold text-primary hover:underline ml-1"
                >
                  <FiUser className="w-3.5 h-3.5" />
                  Student profile
                  <FiArrowUpRight className="w-3 h-3" />
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Right: Quick Action Controls & Navigation */}
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
