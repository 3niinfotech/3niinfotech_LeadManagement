import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import {
  FiAward,
  FiCheckSquare,
  FiFileText,
  FiGlobe,
  FiPhone,
  FiPlus,
  FiRefreshCw,
  FiTarget,
  FiTrendingUp,
  FiUsers,
} from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import CountryFlagLabel from '../../../components/ui/CountryFlagLabel';
import { useDashboardData } from '../hooks/useDashboardData';
import { selectUser } from '../../../redux/slices/authSlice';
import { ROUTES } from '../../../config/routes';
import { getEnquiryStatusLabel } from '../../../config/constants';
import {
  PortalEmpty,
  PortalError,
  PortalPage,
  PortalSkeletonPage,
  greetingForUser,
} from '../../../components/portal/PortalUi';
import {
  ReportBarChart,
  ReportDonutChart,
  ReportLineChart,
} from '../../reports/components/MuiReportCharts';
import '../../../components/portal/portal.theme.css';
import '../styles/counsellor-dashboard.theme.css';

function fmtMoney(value, currency = 'INR') {
  const n = Number(value) || 0;
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(n);
  } catch {
    return `₹ ${n.toLocaleString('en-IN')}`;
  }
}

function fmtTime(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function fmtDate(value) {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
}

function relativeTime(value) {
  if (!value) return '';
  const diff = Date.now() - new Date(value).getTime();
  const mins = Math.round(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} mins ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return fmtDate(value);
}

function trendText(delta, suffix = 'vs last month') {
  const n = Number(delta) || 0;
  const sign = n > 0 ? '+' : '';
  return `${sign}${n}% ${suffix}`;
}

const STAGE_TONES = {
  NEW: 'green',
  CONTACTED: 'blue',
  INTERESTED: 'blue',
  FOLLOW_UP: 'blue',
  DEMO_SCHEDULED: 'teal',
  APPLICATION: 'green',
  OFFER: 'orange',
  DOCUMENT: 'purple',
  CONVERTED: 'teal',
};

function Kpi({ label, value, hint, tone, icon: Icon, onClick }) {
  return (
    <button type="button" className={`crm-cdash-kpi crm-cdash-kpi--${tone}`} onClick={onClick}>
      <span className="crm-cdash-kpi__icon" aria-hidden>{Icon ? <Icon /> : null}</span>
      <div className="crm-cdash-kpi__copy">
        <span className="crm-cdash-kpi__label">{label}</span>
        <strong className="crm-cdash-kpi__value">{value}</strong>
        {hint ? <span className="crm-cdash-kpi__hint">{hint}</span> : null}
      </div>
    </button>
  );
}

export default function CounsellorDashboard() {
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { data, loading, error, reload } = useDashboardData('this_month');
  const [stageTab, setStageTab] = useState('ALL');

  const desk = data?.counsellorDesk || null;
  const metrics = desk?.metrics || {};
  const trends = metrics.trends || {};
  const target = desk?.target || null;
  const charts = desk?.charts || {};
  const performance = desk?.performance || {};
  const reminders = desk?.reminders || [];
  const tasks = desk?.tasks || [];
  const pipeline = desk?.myPipeline || desk?.recentOpen || [];
  const activities = desk?.recentActivities || [];

  const filteredPipeline = useMemo(() => {
    if (stageTab === 'ALL') return pipeline;
    return pipeline.filter((row) => {
      const label = (getEnquiryStatusLabel(row.stage || row.status) || row.stage || '').toLowerCase();
      if (stageTab === 'NEW') return /new|contact/.test(label) || row.stage === 'NEW';
      if (stageTab === 'INTERESTED') return /interest|follow/.test(label);
      if (stageTab === 'APPLICATION') return /application|document|demo/.test(label);
      if (stageTab === 'VISA') return /visa|offer|convert/.test(label);
      return true;
    });
  }, [pipeline, stageTab]);

  const stageTotal = (charts.studentsByStage || []).reduce((s, r) => s + (Number(r.count) || 0), 0)
    || metrics.openPipeline
    || metrics.myStudents
    || 0;

  const followUpTotal = (charts.followUpsOverview || []).reduce((s, r) => s + (Number(r.count) || 0), 0)
    || metrics.followUpsDue
    || 0;

  if (loading && !data) return <PortalSkeletonPage />;

  return (
    <PortalPage className="crm-cdash">
      <div className="crm-cdash-toolbar">
        <div>
          <h1 className="crm-cdash-toolbar__title">{greetingForUser(user, 'counsellor')}</h1>
          <p className="crm-cdash-toolbar__sub">
            {data?.workspace?.subtitle || 'Your students, applications, follow-ups, and targets'}
          </p>
        </div>
        <div className="crm-cdash-toolbar__actions">
          <Button size="sm" variant="outline" icon={FiRefreshCw} loading={loading} onClick={reload}>
            Refresh
          </Button>
          <Button size="sm" icon={FiPlus} onClick={() => navigate(ROUTES.ENQUIRY_CREATE)}>
            Add enquiry
          </Button>
        </div>
      </div>

      {error && <PortalError title="Could not load desk" description={error} onRetry={reload} />}

      <section className="crm-cdash-kpis" aria-label="Key metrics">
        <Kpi
          label="My Students"
          value={metrics.myStudents ?? 0}
          hint={trendText(trends.myStudents)}
          tone="green"
          icon={FiUsers}
          onClick={() => navigate(ROUTES.STUDENTS)}
        />
        <Kpi
          label="Active Applications"
          value={metrics.activeApplications ?? 0}
          hint={trendText(trends.activeApplications)}
          tone="blue"
          icon={FiFileText}
          onClick={() => navigate(ROUTES.APPLICATIONS)}
        />
        <Kpi
          label="Visas Granted"
          value={metrics.visasGranted ?? 0}
          hint={trendText(trends.visasGranted)}
          tone="teal"
          icon={FiGlobe}
          onClick={() => navigate(ROUTES.VISAS)}
        />
        <Kpi
          label="Follow Ups Due"
          value={metrics.followUpsDue ?? 0}
          hint={`${metrics.dueToday ?? 0} due today`}
          tone="orange"
          icon={FiPhone}
          onClick={() => navigate(ROUTES.CALENDAR)}
        />
        <Kpi
          label={target?.label || 'My Target'}
          value={fmtMoney(target?.achieved, target?.currency)}
          hint={`${target?.percent ?? 0}% of ${fmtMoney(target?.goal, target?.currency)}`}
          tone="purple"
          icon={FiTarget}
          onClick={() => navigate(ROUTES.DASHBOARD)}
        />
        <Kpi
          label="Success Rate"
          value={`${metrics.successRate ?? 0}%`}
          hint={trendText(trends.successRate)}
          tone="success"
          icon={FiAward}
          onClick={() => navigate(ROUTES.ENQUIRIES)}
        />
      </section>

      <section className="crm-cdash-row crm-cdash-row--4">
        <article className="crm-cdash-card crm-cdash-card--wide">
          <header className="crm-cdash-card__head">
            <h2>Enquiries Overview</h2>
            <span className="crm-cdash-chip">This Week</span>
          </header>
          <ReportLineChart
            data={charts.enquiriesTrend || []}
            xKey="label"
            yKey="count"
            height={210}
            area
            seriesLabel="Enquiries"
            color="#16a34a"
          />
        </article>

        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <h2>Students by Stage</h2>
          </header>
          <ReportDonutChart
            data={charts.studentsByStage || []}
            nameKey="label"
            valueKey="count"
            height={200}
            innerRadius={48}
            outerRadius={74}
            centerLabel="Total"
            centerValue={String(stageTotal)}
            hideLegend
          />
          <ul className="crm-cdash-legend">
            {(charts.studentsByStage || []).map((row, i) => (
              <li key={row.label}>
                <i className={`tone-${i % 5}`} />
                <span>{row.label}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <h2>Application Status</h2>
          </header>
          {(charts.applicationStatus || []).length ? (
            <ReportBarChart
              data={charts.applicationStatus}
              xKey="label"
              yKey="count"
              height={220}
              layout="horizontal"
              colorful
            />
          ) : (
            <PortalEmpty title="No applications yet" description="Assigned student apps appear here." />
          )}
        </article>

        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <h2>My Upcoming Tasks</h2>
            <Link to={ROUTES.CALENDAR} className="crm-cdash-link">View All</Link>
          </header>
          {tasks.length ? (
            <ul className="crm-cdash-tasks">
              {tasks.map((task) => (
                <li key={task.id}>
                  <button
                    type="button"
                    className="crm-cdash-task"
                    onClick={() => task.enquiryId && navigate(ROUTES.ENQUIRY_DETAIL(task.enquiryId))}
                  >
                    <span className={`crm-cdash-task__check${task.urgency === 'overdue' ? ' is-overdue' : ''}`}>
                      <FiCheckSquare aria-hidden />
                    </span>
                    <span className="crm-cdash-task__title">{task.title}</span>
                    <time>{fmtTime(task.at) || fmtDate(task.at)}</time>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <PortalEmpty title="All clear" description="No upcoming tasks right now." />
          )}
        </article>
      </section>

      <section className="crm-cdash-row crm-cdash-row--pipeline">
        <article className="crm-cdash-card crm-cdash-card--table">
          <header className="crm-cdash-card__head">
            <h2>My Students</h2>
          </header>
          <div className="crm-cdash-tabs" role="tablist">
            {[
              ['ALL', 'All'],
              ['NEW', 'New'],
              ['INTERESTED', 'Interested'],
              ['APPLICATION', 'Application'],
              ['VISA', 'Visa Granted'],
            ].map(([id, label]) => (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={stageTab === id}
                className={stageTab === id ? 'is-active' : ''}
                onClick={() => setStageTab(id)}
              >
                {label}
              </button>
            ))}
          </div>
          {filteredPipeline.length ? (
            <div className="crm-cdash-table-wrap">
              <table className="crm-cdash-table">
                <thead>
                  <tr>
                    <th>Student Name</th>
                    <th>Country</th>
                    <th>Stage</th>
                    <th>Next Follow Up</th>
                    <th>Activity</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPipeline.slice(0, 8).map((row) => {
                    const stage = row.stage || row.status;
                    const tone = STAGE_TONES[stage] || 'blue';
                    const initial = (row.name || '?').charAt(0).toUpperCase();
                    return (
                      <tr key={row.id} onClick={() => navigate(ROUTES.ENQUIRY_DETAIL(row.id))}>
                        <td>
                          <div className="crm-cdash-person">
                            <span className="crm-cdash-avatar" aria-hidden>{initial}</span>
                            <div>
                              <strong>{row.name}</strong>
                              <span>{row.code}</span>
                            </div>
                          </div>
                        </td>
                        <td>
                          {row.country
                            ? <CountryFlagLabel country={row.country} />
                            : '—'}
                        </td>
                        <td>
                          <span className={`crm-cdash-pill crm-cdash-pill--${tone}`}>
                            {getEnquiryStatusLabel(stage) || stage}
                          </span>
                        </td>
                        <td>{row.nextFollowUp ? fmtDate(row.nextFollowUp) : '—'}</td>
                        <td>
                          <span className="crm-cdash-act-icons" aria-hidden>
                            <FiPhone />
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <PortalEmpty title="No students in this filter" description="Try another stage tab." />
          )}
          <div className="crm-cdash-table-foot">
            <Button icon={FiPlus} onClick={() => navigate(ROUTES.ENQUIRY_CREATE)}>
              Add New Enquiry
            </Button>
          </div>
        </article>

        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <h2>Recent Activities</h2>
          </header>
          {activities.length ? (
            <ul className="crm-cdash-activity">
              {activities.map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => item.enquiryId && navigate(ROUTES.ENQUIRY_DETAIL(item.enquiryId))}
                  >
                    <span className="crm-cdash-activity__dot" aria-hidden />
                    <span className="crm-cdash-activity__copy">
                      <strong>{item.title}</strong>
                      <em>{relativeTime(item.at)}</em>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <PortalEmpty title="No recent activity" description="Pipeline updates will show here." />
          )}
        </article>

        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <h2>Top Countries</h2>
            <span className="crm-cdash-chip">This Month</span>
          </header>
          {(charts.topCountries || []).length ? (
            <ReportBarChart
              data={charts.topCountries}
              xKey="country"
              yKey="count"
              height={240}
              layout="horizontal"
              colorful
            />
          ) : (
            <PortalEmpty title="No country data" description="Interested countries appear as you add enquiries." />
          )}
        </article>
      </section>

      <section className="crm-cdash-row crm-cdash-row--3">
        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <h2>My Performance</h2>
          </header>
          <div className="crm-cdash-perf">
            <div><strong>{performance.enquiries ?? 0}</strong><span>Enquiries</span></div>
            <div><strong>{performance.applications ?? 0}</strong><span>Applications</span></div>
            <div><strong>{performance.visas ?? 0}</strong><span>Visas</span></div>
            <div><strong>{fmtMoney(performance.revenue, performance.currency)}</strong><span>Revenue</span></div>
          </div>
          <div className="crm-cdash-perf-banner">
            <FiTrendingUp aria-hidden />
            <p>{performance.rankHint || 'Keep guiding students toward their goals.'}</p>
          </div>
        </article>

        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <h2>Follow Ups Overview</h2>
          </header>
          <ReportDonutChart
            data={charts.followUpsOverview || []}
            nameKey="label"
            valueKey="count"
            height={190}
            innerRadius={48}
            outerRadius={72}
            centerLabel="Total"
            centerValue={String(followUpTotal)}
            hideLegend
            colors={['#dc2626', '#f59e0b', '#16a34a']}
          />
          <ul className="crm-cdash-legend">
            {(charts.followUpsOverview || []).map((row, i) => (
              <li key={row.label}>
                <i className={`tone-fu-${i}`} />
                <span>{row.label}</span>
                <strong>{row.count}</strong>
              </li>
            ))}
          </ul>
        </article>

        <article className="crm-cdash-card">
          <header className="crm-cdash-card__head">
            <h2>Reminders</h2>
          </header>
          {reminders.length ? (
            <ul className="crm-cdash-reminders">
              {reminders.map((item) => (
                <li key={item.id} className={`crm-cdash-reminder crm-cdash-reminder--${item.tone}`}>
                  <p>{item.text}</p>
                  <Link to={item.link || ROUTES.CALENDAR}>View</Link>
                </li>
              ))}
            </ul>
          ) : (
            <PortalEmpty title="No reminders" description="You're caught up." />
          )}
        </article>
      </section>

      <section className="crm-cdash-quote" aria-label="Motivation">
        <p>“Every student you guide today can achieve their dream tomorrow.”</p>
      </section>
    </PortalPage>
  );
}
