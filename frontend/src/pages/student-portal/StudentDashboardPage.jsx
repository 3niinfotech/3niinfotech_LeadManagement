import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  FiCalendar,
  FiCheck,
  FiCheckSquare,
  FiCreditCard,
  FiDollarSign,
  FiFileText,
  FiFolder,
  FiMapPin,
  FiMessageCircle,
  FiRefreshCw,
  FiClock,
} from 'react-icons/fi';
import { apiGet } from '../../api/apiClient';
import { API } from '../../config/api';
import { ROUTES } from '../../config/routes';
import { formatDate, formatMoney } from './components/portalFormat';
import {
  PortalPage,
  PortalEmpty,
  PortalError,
  PortalSkeletonPage,
} from '../../components/portal/PortalUi';
import Button from '../../components/ui/Button';
import {
  ReportDonutChart,
  ReportSemiDonutChart,
} from '../../features/reports/components/MuiReportCharts';

const JOURNEY_QUOTE = 'The expert in anything was once a beginner. Stay focused and keep moving forward.';

const DOC_COLORS = ['#16a34a', '#f59e0b', '#dc2626'];
const PAY_COLORS = ['#2563eb', '#e2e8f0'];

function relativeTime(value) {
  if (!value) return '';
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  const diff = Date.now() - d.getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.round(hrs / 24);
  if (days < 14) return `${days}d ago`;
  return formatDate(value);
}

function KpiCard({ to, label, value, hint, tone = 'brand', icon: Icon }) {
  const inner = (
    <>
      <span className={`crm-sdash-kpi__icon crm-sdash-kpi__icon--${tone}`} aria-hidden>
        {Icon ? <Icon /> : null}
      </span>
      <div className="crm-sdash-kpi__copy">
        <span className="crm-sdash-kpi__label">{label}</span>
        <strong className="crm-sdash-kpi__value">{value}</strong>
        {hint ? <span className={`crm-sdash-kpi__hint crm-sdash-kpi__hint--${tone}`}>{hint}</span> : null}
      </div>
    </>
  );
  if (to) {
    return <Link to={to} className="crm-sdash-kpi">{inner}</Link>;
  }
  return <div className="crm-sdash-kpi">{inner}</div>;
}

function ProgressStepper({ steps = [] }) {
  if (!steps.length) return null;
  return (
    <ol className="crm-sdash-stepper" aria-label="Application progress">
      {steps.map((step, idx) => {
        const state = step.current ? 'is-current' : step.done ? 'is-done' : 'is-pending';
        return (
          <li key={step.key || idx} className={`crm-sdash-stepper__item ${state}`}>
            <span className="crm-sdash-stepper__node" aria-hidden>
              {step.done && !step.current ? <FiCheck size={12} /> : idx + 1}
            </span>
            {idx < steps.length - 1 && (
              <span className={`crm-sdash-stepper__line${step.done ? ' is-done' : ''}`} aria-hidden />
            )}
            <span className="crm-sdash-stepper__label">{step.label}</span>
          </li>
        );
      })}
    </ol>
  );
}

function ActivityList({ items = [] }) {
  if (!items.length) {
    return <PortalEmpty title="No activity yet" description="Milestones will appear here." />;
  }
  return (
    <ol className="crm-sdash-activity">
      {items.map((item, idx) => {
        const state = item.current ? 'is-current' : item.done ? 'is-done' : 'is-pending';
        return (
          <li key={item.key || idx} className={`crm-sdash-activity__item ${state}`}>
            <span className="crm-sdash-activity__dot" aria-hidden />
            <div className="crm-sdash-activity__copy">
              <p className="crm-sdash-activity__label">{item.label}</p>
              {item.at && <p className="crm-sdash-activity__at">{formatDate(item.at, true)}</p>}
              {item.current && !item.at && <p className="crm-sdash-activity__at">Current</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

export default function StudentDashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiGet(API.PORTAL_STUDENT_DASHBOARD);
      setData(res.data || null);
    } catch {
      setData(null);
      setError('Unable to load your dashboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const kpis = data?.kpis;
  const progress = data?.progressTrack;
  const docStatus = data?.documentStatus;
  const attendance = data?.attendanceOverview;
  const finance = data?.finance;
  const nextAppointment = data?.nextAppointment;
  const classes = data?.academic?.courseCards || [];
  const reminders = data?.reminders || data?.pendingTasks || [];
  const updates = data?.notifications || [];
  const messages = data?.messages || [];

  const paymentSlices = useMemo(() => {
    const paid = Number(finance?.paid ?? kpis?.totalPaid) || 0;
    const due = Number(finance?.pending ?? kpis?.balanceDue) || 0;
    return [
      { label: 'Paid', count: paid },
      { label: 'Due', count: due },
    ].filter((r) => r.count > 0);
  }, [finance, kpis]);

  const docSlices = useMemo(() => {
    const rows = docStatus?.breakdown || [];
    if (rows.some((r) => Number(r.count) > 0)) return rows;
    return [{ label: 'No documents', count: 1 }];
  }, [docStatus]);

  if (loading && !data) return <PortalSkeletonPage />;
  if (error && !data) {
    return <PortalError title="Dashboard unavailable" description={error} onRetry={load} />;
  }

  const currency = kpis?.currency || finance?.currency || 'INR';
  const paidPct = finance?.paidPercent
    ?? (kpis?.totalFees ? Math.round((kpis.totalPaid / kpis.totalFees) * 100) : 0);

  return (
    <PortalPage className="crm-sdash">
      <div className="crm-portal-page-toolbar">
        <Button size="sm" variant="outline" icon={FiRefreshCw} onClick={load} loading={loading}>
          Refresh
        </Button>
      </div>

      <section className="crm-sdash-kpis" aria-label="Key metrics">
        <KpiCard
          to={ROUTES.STUDENT_APPLICATIONS}
          label="My Applications"
          value={kpis?.applicationsInProgress ?? 0}
          hint={kpis?.applicationsTotal ? `${kpis.applicationsTotal} total` : 'In Progress'}
          tone="purple"
          icon={FiFileText}
        />
        <KpiCard
          to={ROUTES.STUDENT_DOCUMENTS}
          label="Documents"
          value={`${kpis?.documentsPending ?? 0}/${kpis?.documentsTotal ?? 0}`}
          hint="Pending"
          tone="blue"
          icon={FiFolder}
        />
        <KpiCard
          to={ROUTES.STUDENT_COUNSELING}
          label="Next Appointment"
          value={kpis?.nextAppointmentAt ? formatDate(kpis.nextAppointmentAt, true) : '—'}
          hint={nextAppointment?.title || 'None scheduled'}
          tone="green"
          icon={FiCalendar}
        />
        <KpiCard
          to={ROUTES.STUDENT_FEES}
          label="Total Payments"
          value={formatMoney(kpis?.totalPaid ?? finance?.paid, currency)}
          hint="Paid"
          tone="orange"
          icon={FiDollarSign}
        />
        <KpiCard
          to={ROUTES.STUDENT_FEES}
          label="Balance Due"
          value={formatMoney(kpis?.balanceDue ?? finance?.pending, currency)}
          hint="Due"
          tone="red"
          icon={FiCreditCard}
        />
      </section>

      <section className="crm-sdash-row crm-sdash-row--progress">
        <article className="crm-sdash-card crm-sdash-card--wide">
          <header className="crm-sdash-card__head">
            <div>
              <h2 className="crm-sdash-card__title">Application Progress</h2>
              <p className="crm-sdash-card__sub">{progress?.title || 'Your study journey'}</p>
            </div>
            <Link to={ROUTES.STUDENT_APPLICATIONS} className="crm-sdash-link">Details</Link>
          </header>
          <ProgressStepper steps={progress?.steps || data?.journey?.stages || []} />
          {progress?.hint && (
            <div className="crm-sdash-alert" role="status">
              <FiCheckSquare aria-hidden />
              <p>{progress.hint.startsWith('Great') ? progress.hint : `Great! ${progress.hint}`}</p>
            </div>
          )}
        </article>

        <article className="crm-sdash-card">
          <header className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Application Timeline</h2>
          </header>
          <ActivityList items={data?.activityTimeline || []} />
        </article>
      </section>

      <section className="crm-sdash-row crm-sdash-row--3">
        <article className="crm-sdash-card">
          <header className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Upcoming Appointment</h2>
          </header>
          {nextAppointment ? (
            <div className="crm-sdash-appt">
              <div className="crm-sdash-appt__banner">
                <span className="crm-sdash-appt__icon" aria-hidden><FiCalendar /></span>
                <div>
                  <p className="crm-sdash-appt__title">{nextAppointment.title}</p>
                  {nextAppointment.counselorName && (
                    <p className="crm-sdash-appt__with">with {nextAppointment.counselorName}</p>
                  )}
                </div>
              </div>
              <ul className="crm-sdash-appt__meta">
                <li><FiClock aria-hidden /> {formatDate(nextAppointment.startAt, true)}</li>
                {nextAppointment.location && (
                  <li><FiMapPin aria-hidden /> {nextAppointment.location}</li>
                )}
              </ul>
              <div className="crm-sdash-appt__actions">
                <Link to={ROUTES.STUDENT_COUNSELING} className="crm-sdash-btn crm-sdash-btn--ghost">Reschedule</Link>
                <Link to={ROUTES.STUDENT_COUNSELING} className="crm-sdash-btn crm-sdash-btn--primary">View Details</Link>
              </div>
            </div>
          ) : (
            <PortalEmpty
              title="No upcoming session"
              description="Book counselling when you need guidance."
            />
          )}
        </article>

        <article className="crm-sdash-card">
          <header className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Document Status</h2>
            <Link to={ROUTES.STUDENT_DOCUMENTS} className="crm-sdash-link">Manage</Link>
          </header>
          <ReportDonutChart
            data={docSlices}
            nameKey="label"
            valueKey="count"
            height={200}
            innerRadius={52}
            outerRadius={78}
            centerLabel="Total"
            centerValue={String(docStatus?.total ?? 0)}
            colors={DOC_COLORS}
            hideLegend
          />
          <ul className="crm-sdash-legend">
            <li><i style={{ background: DOC_COLORS[0] }} /> Uploaded <strong>{docStatus?.uploaded ?? 0}</strong></li>
            <li><i style={{ background: DOC_COLORS[1] }} /> Pending <strong>{docStatus?.pending ?? 0}</strong></li>
            <li><i style={{ background: DOC_COLORS[2] }} /> Rejected <strong>{docStatus?.rejected ?? 0}</strong></li>
          </ul>
        </article>

        <article className="crm-sdash-card">
          <header className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Payment Summary</h2>
            <Link to={ROUTES.STUDENT_FEES} className="crm-sdash-link">Fees</Link>
          </header>
          <ReportSemiDonutChart
            data={paymentSlices.length ? paymentSlices : [{ label: 'Paid', count: 1 }]}
            nameKey="label"
            valueKey="count"
            height={168}
            colors={PAY_COLORS}
            centerValue={formatMoney(kpis?.totalPaid ?? finance?.paid, currency)}
            centerLabel={`${paidPct}% paid`}
          />
          <ul className="crm-sdash-paylist">
            <li>
              <span>Total Fees</span>
              <strong>{formatMoney(kpis?.totalFees ?? finance?.totalFees, currency)}</strong>
            </li>
            <li>
              <span><i className="is-paid" /> Paid Amount</span>
              <strong className="is-paid">{formatMoney(kpis?.totalPaid ?? finance?.paid, currency)}</strong>
            </li>
            <li>
              <span><i className="is-due" /> Balance Due</span>
              <strong className="is-due">{formatMoney(kpis?.balanceDue ?? finance?.pending, currency)}</strong>
            </li>
          </ul>
        </article>
      </section>

      <section className="crm-sdash-row crm-sdash-row--3">
        <article className="crm-sdash-card">
          <header className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">My Classes</h2>
            <Link to={ROUTES.STUDENT_COURSES} className="crm-sdash-link">View all</Link>
          </header>
          {classes.length ? (
            <ul className="crm-sdash-classes">
              {classes.slice(0, 4).map((course) => (
                <li key={course.id} className="crm-sdash-class">
                  <div className="min-w-0">
                    <p className="crm-sdash-class__name">{course.courseName || course.batchName}</p>
                    <p className="crm-sdash-class__meta">
                      {[course.batchName, course.teacher].filter(Boolean).join(' · ')}
                    </p>
                    {course.nextClassAt && (
                      <p className="crm-sdash-class__time">{formatDate(course.nextClassAt, true)}</p>
                    )}
                  </div>
                  {course.badge && (
                    <span className={`crm-sdash-badge crm-sdash-badge--${course.badge.tone}`}>
                      {course.badge.label}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <PortalEmpty title="No classes yet" description="Enrolled batches appear here." />
          )}
        </article>

        <article className="crm-sdash-card">
          <header className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Attendance Overview</h2>
          </header>
          <div className="crm-sdash-att">
            <p className="crm-sdash-att__pct">{attendance?.percent ?? 0}%</p>
            <p className="crm-sdash-att__label">Overall Attendance</p>
            <div className="crm-sdash-att__bar" aria-hidden>
              <i style={{ width: `${Math.min(100, Math.max(0, attendance?.percent ?? 0))}%` }} />
            </div>
            <div className="crm-sdash-att__stats">
              <div><strong>{attendance?.present ?? 0}</strong><span>Present</span></div>
              <div><strong>{attendance?.absent ?? 0}</strong><span>Absent</span></div>
              <div><strong>{attendance?.total ?? 0}</strong><span>Total</span></div>
            </div>
            <Link to={ROUTES.STUDENT_ATTENDANCE} className="crm-sdash-btn crm-sdash-btn--primary crm-sdash-btn--block">
              View Attendance
            </Link>
          </div>
        </article>

        <article className="crm-sdash-card">
          <header className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Important Reminders</h2>
          </header>
          {reminders.length ? (
            <ul className="crm-sdash-reminders">
              {reminders.slice(0, 5).map((task, idx) => (
                <li key={`${task.type}-${task.title}-${idx}`}>
                  <Link to={task.link || ROUTES.STUDENT_NOTIFICATIONS} className="crm-sdash-reminder">
                    <span className="crm-sdash-reminder__icon" aria-hidden>
                      {task.type === 'FEE' ? <FiDollarSign /> : task.type === 'DOCUMENT' ? <FiFolder /> : <FiClock />}
                    </span>
                    <div className="min-w-0">
                      <p className="crm-sdash-reminder__title">{task.title}</p>
                      <p className="crm-sdash-reminder__meta">
                        {task.dueDate ? `Due ${formatDate(task.dueDate)}` : (task.description || task.actionLabel || 'Action needed')}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <PortalEmpty title="All clear" description="No urgent reminders right now." />
          )}
        </article>
      </section>

      <section className="crm-sdash-row crm-sdash-row--2">
        <article className="crm-sdash-card">
          <header className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Latest Updates</h2>
            <Link to={ROUTES.STUDENT_NOTIFICATIONS} className="crm-sdash-link">All</Link>
          </header>
          {updates.length ? (
            <ul className="crm-sdash-updates">
              {updates.slice(0, 5).map((item) => (
                <li key={item.id}>
                  <Link to={item.link || ROUTES.STUDENT_NOTIFICATIONS} className="crm-sdash-update">
                    {!item.isRead && <span className="crm-sdash-update__dot" aria-hidden />}
                    <div className="min-w-0">
                      <p className="crm-sdash-update__title">{item.title}</p>
                      {item.message && <p className="crm-sdash-update__msg">{item.message}</p>}
                    </div>
                    <time className="crm-sdash-update__time">{relativeTime(item.createdAt)}</time>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <PortalEmpty title="No updates" description="Notifications will show up here." />
          )}
        </article>

        <article className="crm-sdash-card">
          <header className="crm-sdash-card__head">
            <h2 className="crm-sdash-card__title">Messages</h2>
          </header>
          {messages.length ? (
            <>
              <ul className="crm-sdash-msgs">
                {messages.slice(0, 4).map((msg) => (
                  <li key={msg.id}>
                    <Link to={msg.link || ROUTES.STUDENT_NOTIFICATIONS} className="crm-sdash-msg">
                      <span className="crm-sdash-msg__avatar" aria-hidden>
                        <FiMessageCircle />
                      </span>
                      <div className="min-w-0">
                        <p className="crm-sdash-msg__from">
                          {msg.from}
                          {msg.role ? <em>{msg.role}</em> : null}
                        </p>
                        <p className="crm-sdash-msg__preview">{msg.preview}</p>
                      </div>
                      {msg.unread > 0 && (
                        <span className="crm-sdash-msg__badge">{msg.unread}</span>
                      )}
                    </Link>
                  </li>
                ))}
              </ul>
              <Link to={ROUTES.STUDENT_NOTIFICATIONS} className="crm-sdash-btn crm-sdash-btn--primary crm-sdash-btn--block">
                Go to Messages
              </Link>
            </>
          ) : (
            <PortalEmpty title="Inbox clear" description="Counsellor and support notes appear here." />
          )}
        </article>
      </section>

      <section className="crm-sdash-journey" aria-label="My Journey">
        <div className="crm-sdash-journey__art" aria-hidden>
          <div className="crm-sdash-journey__scene">
            <span className="crm-sdash-journey__flag" />
            <span className="crm-sdash-journey__peak" />
            <span className="crm-sdash-journey__climber" />
          </div>
        </div>
        <blockquote className="crm-sdash-journey__quote">
          <p className="crm-sdash-journey__eyebrow">My Journey</p>
          <p>“{JOURNEY_QUOTE}”</p>
        </blockquote>
      </section>
    </PortalPage>
  );
}
