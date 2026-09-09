import {
  FiClock,
  FiArrowRight,
  FiFileText,
  FiGlobe,
  FiFolder,
  FiMessageSquare,
} from 'react-icons/fi';
import CountryFlagLabel from '../../../../../components/ui/CountryFlagLabel';
import EnquiryTimelineItem from '../../../../enquiry/components/EnquiryDrawer/EnquiryTimelineItem';
import { buildStudentJourneyStats } from '../../../utils/studentJourney.utils';
import { useStudentStatusOptions } from '../../../hooks/useStudentStatusOptions';

function Field({ label, value, children }) {
  const display = children ?? value;
  if (display == null || display === '' || display === '—') return null;
  return (
    <div className="crm-sov-field">
      <dt>{label}</dt>
      <dd>{display}</dd>
    </div>
  );
}

function formatDate(value) {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

const STAT_ICONS = {
  applications: FiFileText,
  visa: FiGlobe,
  documents: FiFolder,
  notes: FiMessageSquare,
};

const STAT_TONES = {
  applications: 'brand',
  visa: 'info',
  documents: 'warning',
  notes: 'success',
};

/** Compact read-only overview — edit on Profile tab. */
export default function StudentOverviewTab({ student, onTabChange, timelineRows = [] }) {
  const { getStatusMeta } = useStudentStatusOptions();
  if (!student) return null;

  const stats = buildStudentJourneyStats(student);
  const statusMeta = getStatusMeta(student.status);
  const recentActivity = timelineRows.slice(0, 5);
  const meta = student.metadata || {};
  const tags = Array.isArray(meta.tags) ? meta.tags.filter(Boolean) : [];
  const testsGiven = Array.isArray(meta.testsGiven) ? meta.testsGiven.filter((t) => t?.name) : [];
  const hasEnquiryExtras = Boolean(
    meta.source || meta.remark || meta.otherReference || tags.length || testsGiven.length,
  );
  const showPreadmit = Boolean(stats.enquiryCode || hasEnquiryExtras);

  const journey = [
    { key: 'applications', label: 'Applications', value: student.applications?.length ?? 0, tab: 'applications' },
    { key: 'visa', label: 'Visa', value: student.visas?.length ?? 0, tab: 'visa' },
    { key: 'documents', label: 'Documents', value: stats.documents, tab: 'documents' },
    { key: 'notes', label: 'Notes', value: stats.notes, tab: 'notes' },
  ];

  return (
    <div className="crm-sov">
      <div className="crm-sov-strip" role="navigation" aria-label="Student journey shortcuts">
        {journey.map((item) => {
          const Icon = STAT_ICONS[item.key];
          const tone = STAT_TONES[item.key];
          return (
            <button
              key={item.key}
              type="button"
              className={`crm-sov-stat crm-sov-stat--${tone}`}
              onClick={() => onTabChange?.(item.tab)}
            >
              <span className="crm-sov-stat__icon" aria-hidden>
                {Icon ? <Icon /> : null}
              </span>
              <span className="crm-sov-stat__copy">
                <span className="crm-sov-stat__value">{item.value}</span>
                <span className="crm-sov-stat__label">{item.label}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div className="crm-sov-grid">
        <section className="crm-sov-block">
          <h3 className="crm-sov-block__title">Personal</h3>
          <dl className="crm-sov-dl">
            <Field label="Name" value={name} />
            <Field label="Email" value={student.email} />
            <Field label="Phone" value={student.phone} />
            <Field label="Emergency" value={meta.emergencyContact || meta.alternateNo} />
            <Field label="Date of birth" value={formatDate(student.dateOfBirth)} />
            <Field label="Gender" value={student.gender?.replace(/_/g, ' ')} />
            <Field label="Nationality" value={student.nationality} />
            <Field label="Passport" value={student.passportNo} />
            {student.address ? (
              <div className="crm-sov-field crm-sov-field--wide">
                <dt>Address</dt>
                <dd>{student.address}</dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="crm-sov-block">
          <h3 className="crm-sov-block__title">Study plan</h3>
          <dl className="crm-sov-dl">
            <Field label="Country">
              {student.country ? <CountryFlagLabel country={student.country} size="sm" /> : null}
            </Field>
            <Field label="Course" value={student.course} />
            <Field label="University" value={student.university} />
            <Field label="Intake" value={student.intake} />
            <Field label="Qualification" value={meta.highestQual} />
            <Field label="Apply level" value={meta.applyLevel?.replace(/_/g, ' ')} />
            <Field label="Status" value={statusMeta?.label || student.status} />
            <Field label="Branch" value={student.branch?.name} />
          </dl>
        </section>

        {showPreadmit && (
          <section className="crm-sov-block crm-sov-block--span">
            <div className="crm-sov-block__head">
              <h3 className="crm-sov-block__title">Pre-admission</h3>
              {stats.enquiryCode && (
                <button
                  type="button"
                  className="crm-sov-block__link"
                  onClick={() => onTabChange?.('enquiry-history')}
                >
                  Enquiry history
                  <FiArrowRight aria-hidden />
                </button>
              )}
            </div>

            {(stats.enquiryCode || stats.demos != null) && (
              <div className="crm-sov-lead">
                {stats.enquiryCode && (
                  <div className="crm-sov-lead__id">
                    <span className="crm-sov-lead__kicker">Enquiry</span>
                    <span className="crm-sov-lead__code">{stats.enquiryCode}</span>
                  </div>
                )}
                <div className="crm-sov-lead__counts">
                  <span>
                    <strong>{stats.demos}</strong> demos
                  </span>
                  <span>
                    <strong>{stats.followups}</strong> follow-ups
                  </span>
                  <span>
                    <strong>{stats.documents}</strong> docs
                  </span>
                </div>
              </div>
            )}

            {hasEnquiryExtras && (
              <dl className="crm-sov-dl crm-sov-dl--dense">
                <Field label="Source" value={meta.source} />
                <Field label="Reference" value={meta.otherReference} />
                <Field label="Remark" value={meta.remark} />
                {tags.length > 0 && (
                  <Field label="Tags">
                    <span className="crm-sov-tags">
                      {tags.map((tag) => (
                        <span key={tag}>{tag}</span>
                      ))}
                    </span>
                  </Field>
                )}
                {testsGiven.length > 0 && (
                  <Field label="Tests">
                    {testsGiven.map((t) => `${t.name}${t.score ? ` (${t.score})` : ''}`).join(', ')}
                  </Field>
                )}
              </dl>
            )}
          </section>
        )}

        {recentActivity.length > 0 && (
          <section className="crm-sov-block crm-sov-block--span">
            <div className="crm-sov-block__head">
              <h3 className="crm-sov-block__title">Recent activity</h3>
              <button
                type="button"
                className="crm-sov-block__link"
                onClick={() => onTabChange?.('timeline')}
              >
                <FiClock aria-hidden />
                Full timeline ({timelineRows.length})
              </button>
            </div>
            <div className="crm-timeline crm-timeline--advanced crm-timeline--compact crm-sov-timeline">
              <div className="crm-timeline__list">
                {recentActivity.map((entry) => (
                  <EnquiryTimelineItem key={entry.id} entry={entry} />
                ))}
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
