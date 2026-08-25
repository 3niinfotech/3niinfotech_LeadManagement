import {
  FiUser, FiBookOpen, FiUsers, FiClipboard, FiCheck, FiArrowRight,
  FiClock, FiMapPin, FiUserCheck, FiCompass, FiFileText,
} from 'react-icons/fi';
import { formatWaitDuration } from '../../utils/reception.utils';
import { getWalkInPriorityLabel, getWalkInStatusLabel } from '../../config/walkin.constants';

const JOURNEY_STEPS = [
  { id: 'registered', label: 'Registered' },
  { id: 'assigned', label: 'Assigned' },
  { id: 'counselling', label: 'Counselling' },
  { id: 'enquiry', label: 'Enquiry' },
];

function buildJourney(lead) {
  const hasEnquiry = Boolean(lead?.enquiry?.id);
  const done = {
    registered: true,
    assigned: Boolean(lead?.assignedToId),
    counselling: hasEnquiry || lead?.status === 'IN_COUNSELLING' || lead?.status === 'COMPLETED',
    enquiry: hasEnquiry,
  };
  const currentIndex = JOURNEY_STEPS.findIndex((s) => !done[s.id]);
  return { done, currentIndex: currentIndex === -1 ? JOURNEY_STEPS.length - 1 : currentIndex };
}

function JourneyStrip({ lead }) {
  const cancelled = lead?.status === 'CANCELLED';
  const { done, currentIndex } = buildJourney(lead);

  return (
    <div className={`crm-walkin-journey${cancelled ? ' crm-walkin-journey--closed' : ''}`}>
      {JOURNEY_STEPS.map((step, index) => {
        const isDone = done[step.id];
        const isCurrent = !cancelled && index === currentIndex && !isDone;
        return (
          <div
            key={step.id}
            className={`crm-walkin-journey__step${isDone ? ' is-done' : ''}${isCurrent ? ' is-current' : ''}`}
          >
            <span className="crm-walkin-journey__dot" aria-hidden>
              {isDone ? <FiCheck className="w-2.5 h-2.5" /> : <span>{index + 1}</span>}
            </span>
            <span className="crm-walkin-journey__label">{step.label}</span>
            {index < JOURNEY_STEPS.length - 1 && (
              <span className="crm-walkin-journey__line" aria-hidden />
            )}
          </div>
        );
      })}
      {cancelled && <span className="crm-walkin-journey__closed-tag">Cancelled</span>}
    </div>
  );
}

function FactCard({ icon: Icon, label, value, tone = '' }) {
  return (
    <div className={`crm-walkin-fact${tone ? ` crm-walkin-fact--${tone}` : ''}`}>
      <span className="crm-walkin-fact__icon" aria-hidden><Icon className="w-3.5 h-3.5" /></span>
      <span className="crm-walkin-fact__body">
        <span className="crm-walkin-fact__label">{label}</span>
        <span className="crm-walkin-fact__value">{value || '—'}</span>
      </span>
    </div>
  );
}

/** Every field stays visible — reception must see what is missing, not a filtered view. */
function DetailSection({ icon: Icon, title, rows, wide = false }) {
  return (
    <section className={`crm-walkin-detail${wide ? ' crm-walkin-detail--wide' : ''}`}>
      <header className="crm-walkin-detail__head">
        <Icon className="w-3.5 h-3.5 text-[var(--brand)]" aria-hidden />
        <h3 className="crm-walkin-detail__title">{title}</h3>
      </header>
      <dl className="crm-walkin-detail__list">
        {rows.filter(Boolean).map((row) => (
          <div key={row.label} className={`crm-walkin-drow${row.block ? ' crm-walkin-drow--block' : ''}`}>
            <dt className="crm-walkin-drow__key">{row.label}</dt>
            <dd className="crm-walkin-drow__value">{row.value || <span className="crm-walkin-drow__empty">—</span>}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

function fullName(user) {
  if (!user) return '';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim();
}

function dateTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export default function OverviewTab({ lead, onOpenEnquiry }) {
  if (!lead) return null;

  const meta = lead.metadata && typeof lead.metadata === 'object' ? lead.metadata : {};
  const counsellor = fullName(lead.assignedTo);
  const openVisit = lead.status !== 'COMPLETED' && lead.status !== 'CANCELLED';

  return (
    <div className="crm-walkin-overview">
      <JourneyStrip lead={lead} />

      <div className="crm-walkin-fact-grid">
        <FactCard
          icon={FiClock}
          label={openVisit ? 'In centre' : 'Duration'}
          value={formatWaitDuration(lead.walkInAt || lead.createdAt)}
          tone={openVisit && !lead.assignedToId ? 'warning' : ''}
        />
        <FactCard icon={FiMapPin} label="Branch" value={lead.branch?.name} />
        <FactCard
          icon={FiUserCheck}
          label="Counsellor"
          value={counsellor || 'Not assigned'}
          tone={counsellor ? 'success' : 'warning'}
        />
        <FactCard icon={FiCompass} label="Source" value={lead.source} />
      </div>

      {lead.enquiry?.id && (
        <button
          type="button"
          className="crm-walkin-linked-banner"
          onClick={onOpenEnquiry}
          disabled={!onOpenEnquiry}
        >
          <span className="crm-walkin-linked-banner__body">
            <span className="crm-walkin-linked-banner__title">
              Enquiry {lead.enquiry.enquiryCode} open with counsellor
            </span>
            <span className="crm-walkin-linked-banner__sub">
              Same person record — counselling and conversion continue there.
            </span>
          </span>
          {onOpenEnquiry && <FiArrowRight className="w-4 h-4 shrink-0" aria-hidden />}
        </button>
      )}

      <div className="crm-walkin-detail-grid">
        <DetailSection
          icon={FiUser}
          title="Contact"
          rows={[
            {
              label: 'Mobile',
              value: lead.phone
                ? <a className="crm-walkin-drow__link" href={`tel:${lead.phone}`}>{lead.phone}</a>
                : '',
            },
            {
              label: 'Email',
              value: lead.email
                ? <a className="crm-walkin-drow__link" href={`mailto:${lead.email}`}>{lead.email}</a>
                : '',
            },
            { label: 'City', value: meta.city },
            { label: 'Lead ID', value: lead.leadCode },
            { label: 'Token', value: lead.tokenNumber },
          ]}
        />

        <DetailSection
          icon={FiBookOpen}
          title="Study interest"
          rows={[
            { label: 'Country', value: lead.country || meta.interestedCountry },
            { label: 'Course', value: lead.interestedCourse },
            { label: 'Study level', value: meta.studyLevel },
            { label: 'Language', value: meta.preferredLanguage },
            { label: 'Purpose', value: meta.visitPurpose },
          ]}
        />

        <DetailSection
          icon={FiUsers}
          title="Visit & assignment"
          rows={[
            { label: 'Status', value: getWalkInStatusLabel(lead.status) },
            { label: 'Priority', value: getWalkInPriorityLabel(lead.priority) },
            { label: 'Branch', value: lead.branch?.name },
            { label: 'Counsellor', value: counsellor },
            { label: 'Registered by', value: fullName(lead.receptionUser) },
            { label: 'Registered at', value: dateTime(lead.walkInAt || lead.createdAt) },
            { label: 'Source', value: lead.source },
            { label: 'Follow-up', value: dateTime(lead.followUpAt) },
          ]}
        />

        <DetailSection
          icon={FiFileText}
          title="Conversion"
          rows={[
            { label: 'Enquiry', value: lead.enquiry?.enquiryCode },
            { label: 'Enquiry status', value: lead.enquiry?.status },
            { label: 'Converted at', value: dateTime(lead.convertedAt) },
            { label: 'Student', value: lead.studentId ? 'Linked' : '' },
            { label: 'Last update', value: dateTime(lead.updatedAt) },
          ]}
        />

        <DetailSection
          icon={FiClipboard}
          title="Reception remarks"
          wide
          rows={[{ label: 'Remarks', value: lead.notes, block: true }]}
        />
      </div>
    </div>
  );
}
