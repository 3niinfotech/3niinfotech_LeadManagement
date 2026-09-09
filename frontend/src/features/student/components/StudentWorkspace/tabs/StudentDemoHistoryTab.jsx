import { FiCalendar, FiUser, FiUsers } from 'react-icons/fi';
import FormSection from '../../../../../components/ui/FormSection';
import Badge from '../../../../../components/ui/Badge';
import { demoStatusLabel, demoStatusTone } from '../../../utils/studentJourney.utils';
import StudentEditableHint from './StudentEditableHint';

function formatDate(value, withTime = false) {
  if (!value) return '—';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-IN', withTime
    ? { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }
    : { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function StudentDemoHistoryTab({ demos = [], enquiryCode, onTabChange }) {
  if (!demos.length) {
    return (
      <FormSection title="Demo / assessment" description="Sessions from the enquiry stage.">
        <div className="crm-student-history-empty">
          <p>No demo or assessment recorded yet.</p>
        </div>
      </FormSection>
    );
  }

  return (
    <FormSection
      title="Demo / assessment"
      description={enquiryCode ? `From enquiry ${enquiryCode} · linked history` : 'Linked enquiry sessions'}
    >
      <StudentEditableHint onTabChange={onTabChange} />
      <ol className="crm-student-demo-timeline">
        {demos.map((demo, index) => {
          const staff = demo.user
            ? `${demo.user.firstName || ''} ${demo.user.lastName || ''}`.trim()
            : demo.faculty?.name || null;
          const statusLabel = demoStatusLabel(demo);
          const tone = demoStatusTone(demo);
          const isLast = index === demos.length - 1;

          return (
            <li
              key={demo.id}
              className={`crm-student-demo-timeline__item crm-student-demo-timeline__item--${tone}${isLast ? ' crm-student-demo-timeline__item--last' : ''}`}
            >
              <div className="crm-student-demo-timeline__rail" aria-hidden>
                <span className="crm-student-demo-timeline__node" />
              </div>

              <article className="crm-student-demo-timeline__card">
                <div className="crm-student-demo-timeline__head">
                  <div>
                    <h3 className="crm-student-demo-timeline__title">
                      {demo.className || demo.batch || 'Demo session'}
                    </h3>
                    <p className="crm-student-demo-timeline__when">
                      <FiCalendar aria-hidden />
                      {formatDate(demo.demoDate, true)}
                    </p>
                  </div>
                  <Badge color={tone}>{statusLabel}</Badge>
                </div>

                <div className="crm-student-demo-timeline__tags">
                  {demo.batch && <span className="crm-student-demo-timeline__tag">Batch · {demo.batch}</span>}
                  {staff && (
                    <span className="crm-student-demo-timeline__tag">
                      <FiUser aria-hidden /> {staff}
                    </span>
                  )}
                  {demo.attendance && demo.attendance !== 'NOT_MARKED' && (
                    <span className="crm-student-demo-timeline__tag">
                      <FiUsers aria-hidden /> {demo.attendance.replace(/_/g, ' ')}
                    </span>
                  )}
                  {demo.result && demo.result !== 'PENDING' && (
                    <span className="crm-student-demo-timeline__tag">Outcome · {demo.result.replace(/_/g, ' ')}</span>
                  )}
                </div>

                {(demo.feedback || demo.remark) && (
                  <div className="crm-student-demo-timeline__note">
                    {demo.feedback && <p>{demo.feedback}</p>}
                    {demo.remark && demo.remark !== demo.feedback && <p>{demo.remark}</p>}
                  </div>
                )}
              </article>
            </li>
          );
        })}
      </ol>
    </FormSection>
  );
}
