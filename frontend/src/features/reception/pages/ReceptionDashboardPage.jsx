import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiAlertCircle,
  FiCalendar,
  FiCheckCircle,
  FiRefreshCw,
  FiUserCheck,
  FiUserPlus,
  FiUsers,
} from 'react-icons/fi';
import PageShell from '../../../components/layout/PageShell';
import PageHeader from '../../../components/layout/PageHeader';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import ContentLoader from '../../../components/ui/ContentLoader';
import EmptyState from '../../../components/ui/EmptyState';
import WalkInStatusBadge from '../../walkin/components/WalkInStatusBadge';
import { apiGet } from '../../../api/apiClient';
import { API } from '../../../config/api';
import { ROUTES } from '../../../config/routes';
import toastService from '../../../services/toast/toast.service';

const POLL_MS = 30000;

function formatTime(value) {
  if (!value) return '—';
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function formatUpdated(value) {
  if (!value) return '';
  return new Date(value).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

function statusColor(status) {
  const value = String(status || '').toUpperCase();
  if (value === 'COMPLETED' || value === 'AVAILABLE') return 'success';
  if (value === 'OVERDUE' || value === 'UNAVAILABLE' || value === 'MEETING') return 'danger';
  if (value === 'WAITING' || value === 'IN_COUNSELLING') return 'warning';
  if (value === 'SCHEDULED') return 'info';
  return 'secondary';
}

function MetricCard({ icon: Icon, label, value, hint, tone = 'primary', onClick }) {
  const toneClass = {
    primary: 'bg-primary-50 text-primary-600 border-primary-100',
    warning: 'bg-warning-soft text-warning border-warning/20',
    success: 'bg-success-soft text-success border-success/20',
    info: 'bg-info-soft text-info border-info/20',
    danger: 'bg-danger-soft text-danger border-danger/20',
  }[tone];

  const Tag = onClick ? 'button' : 'div';
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className="min-w-0 rounded-xl border border-border bg-card-bg px-3 py-2.5 text-left shadow-sm transition-colors hover:border-border-strong"
    >
      <div className="flex items-start gap-2.5">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border ${toneClass}`}>
          <Icon className="h-4 w-4" />
        </span>
        <span className="min-w-0">
          <span className="block text-[10px] font-semibold uppercase tracking-wide text-text-muted">{label}</span>
          <span className="mt-0.5 block text-lg font-bold leading-none tabular-nums text-text">{value ?? 0}</span>
          <span className="mt-1 block truncate text-[11px] text-text-muted">{hint}</span>
        </span>
      </div>
    </Tag>
  );
}

function Panel({ title, subtitle, action, children, className = '' }) {
  return (
    <section className={`min-w-0 overflow-hidden rounded-xl border border-border bg-card-bg shadow-sm ${className}`}>
      <header className="flex min-h-11 items-center justify-between gap-3 border-b border-border bg-page/40 px-3.5 py-2">
        <div className="min-w-0">
          <h2 className="text-[13px] font-semibold text-text">{title}</h2>
          {subtitle && <p className="mt-0.5 truncate text-[11px] text-text-muted">{subtitle}</p>}
        </div>
        {action}
      </header>
      {children}
    </section>
  );
}

function VisitorsPanel({ rows, onOpen }) {
  return (
    <Panel
      title="Today's visitors"
      subtitle={`${rows.length} recent registration${rows.length === 1 ? '' : 's'} · latest first`}
      action={(
        <Button size="sm" variant="ghost" onClick={onOpen}>View all</Button>
      )}
    >
      {!rows.length ? (
        <EmptyState title="No visitors registered today" description="New registrations will appear here." />
      ) : (
        <div className="divide-y divide-border">
          {rows.slice(0, 8).map((row) => (
            <button
              key={row.id}
              type="button"
              onClick={onOpen}
              className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-3.5 py-2.5 text-left hover:bg-row-hover"
            >
              <span className="flex min-w-0 items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary-50 text-[11px] font-bold text-primary-600">
                  {row.name?.slice(0, 2).toUpperCase()}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-[13px] font-semibold text-text">{row.name}</span>
                  <span className="mt-0.5 block truncate text-[11px] text-text-muted">
                    {row.code} · {row.course || 'General enquiry'}
                  </span>
                </span>
              </span>
              <span className="flex items-center gap-3">
                <span className="hidden text-right sm:block">
                  <span className="block text-xs font-semibold tabular-nums text-text">{formatTime(row.walkInAt)}</span>
                  <span className="block max-w-28 truncate text-[10px] text-text-muted">
                    {row.assignedTo || 'Unassigned'}
                  </span>
                </span>
                <WalkInStatusBadge status={row.status} compact />
              </span>
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}

function CounsellorPanel({ rows }) {
  return (
    <Panel title="Counsellor availability" subtitle="Live presence and active workload">
      {!rows.length ? (
        <EmptyState title="No counsellors available" description="Presence appears when counsellors sign in." />
      ) : (
        <div className="divide-y divide-border">
          {rows.slice(0, 8).map((row) => (
            <div key={row.id} className="flex items-center gap-2.5 px-3.5 py-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-page text-[11px] font-semibold text-text-secondary">
                {`${row.firstName?.[0] || ''}${row.lastName?.[0] || ''}`}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-semibold text-text">
                  {row.firstName} {row.lastName}
                </span>
                <span className="block truncate text-[10px] text-text-muted">
                  {row.activeLeads} assigned · {row.activeSessions} in session
                </span>
              </span>
              <span className="text-right">
                <Badge color={statusColor(row.availability?.key)}>{row.availability?.label || 'Offline'}</Badge>
                <span className="mt-0.5 block max-w-28 truncate text-[9px] text-text-muted">
                  {row.availability?.detail}
                </span>
              </span>
            </div>
          ))}
        </div>
      )}
    </Panel>
  );
}

function SchedulePanel({
  appointments, followups, demos, classes, onOpen,
}) {
  const items = useMemo(() => [
    ...appointments.map((row) => ({ ...row, kind: 'Appointment' })),
    ...followups.map((row) => ({ ...row, kind: 'Follow-up' })),
    ...demos.map((row) => ({ ...row, kind: 'Demo' })),
    ...classes.map((row) => ({ ...row, kind: 'Class' })),
  ].sort((a, b) => new Date(a.time) - new Date(b.time)).slice(0, 10), [appointments, followups, demos, classes]);

  return (
    <Panel
      title="Today's schedule"
      subtitle="Appointments, follow-ups, demos and classes"
      action={<Button size="sm" variant="ghost" onClick={onOpen}>Calendar</Button>}
    >
      {!items.length ? (
        <EmptyState title="No schedule today" description="Book an appointment from Calendar." />
      ) : (
        <div className="divide-y divide-border">
          {items.map((row) => (
            <button
              key={`${row.kind}-${row.id}`}
              type="button"
              onClick={onOpen}
              className="flex w-full items-center gap-3 px-3.5 py-2.5 text-left hover:bg-row-hover"
            >
              <span className="w-16 shrink-0 text-xs font-semibold tabular-nums text-text-secondary">{formatTime(row.time)}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[12px] font-medium text-text">{row.visitor}</span>
                <span className="block truncate text-[10px] text-text-muted">
                  {row.kind} · {row.assignedTo || 'Unassigned'}
                </span>
              </span>
              <Badge color={statusColor(row.status)}>{row.status}</Badge>
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}

function TimelinePanel({ rows, onOpen }) {
  return (
    <Panel title="Operations timeline" subtitle="Chronological view of today">
      {!rows.length ? (
        <EmptyState title="No activity scheduled" description="Today’s events will appear here." />
      ) : (
        <div className="px-3.5 py-2">
          {rows.slice(0, 8).map((row, index) => (
            <button key={row.id} type="button" onClick={onOpen} className="group flex w-full gap-3 text-left">
              <span className="relative flex w-3 justify-center">
                <span className="mt-3 h-2 w-2 rounded-full bg-primary-500 ring-4 ring-primary-50" />
                {index < Math.min(rows.length, 8) - 1 && <span className="absolute bottom-0 top-5 w-px bg-border" />}
              </span>
              <span className="min-w-0 flex-1 border-b border-border py-2.5 group-last:border-0">
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-[12px] font-medium text-text">{row.title}</span>
                  <span className="shrink-0 text-[10px] tabular-nums text-text-muted">{formatTime(row.time)}</span>
                </span>
                <span className="mt-0.5 block truncate text-[10px] text-text-muted">
                  {row.eventType} · {row.assignedTo || 'Unassigned'} · {row.status}
                </span>
              </span>
            </button>
          ))}
        </div>
      )}
    </Panel>
  );
}

export default function ReceptionDashboardPage() {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async ({ quiet = false, notify = false } = {}) => {
    if (quiet) setRefreshing(true);
    else setLoading(true);
    setError('');
    try {
      const response = await apiGet(API.RECEPTION_DASHBOARD);
      setData(response?.data || response);
    } catch (requestError) {
      const message = requestError?.response?.data?.message
        || (requestError?.response
          ? 'Unable to load reception dashboard'
          : 'Cannot reach the server. Check that the API is running, then retry.');
      setError(message);
      if (notify) toastService.error(message);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
    const timer = window.setInterval(() => load({ quiet: true }), POLL_MS);
    return () => window.clearInterval(timer);
  }, [load]);

  if (loading && !data) return <ContentLoader variant="dashboard" />;

  const metrics = data?.metrics || {};
  const branch = data?.context?.branch;
  const openWalkIns = () => navigate(ROUTES.WALK_INS);
  const openCalendar = () => navigate(ROUTES.CALENDAR);

  return (
    <PageShell
      className="!space-y-3 pt-3"
      header={(
        <PageHeader
          title={data?.workspace?.title || 'Reception'}
          subtitle={`${branch?.name || 'Current branch'} · Live front-desk operations`}
          icon={FiUserPlus}
          iconColor="primary"
          actions={(
            <div className="flex items-center gap-2">
              <span className="hidden text-[11px] text-text-muted lg:inline">
                Updated {formatUpdated(data?.context?.generatedAt)}
              </span>
              <Button size="sm" variant="outline" icon={FiRefreshCw} loading={refreshing} onClick={() => load({ quiet: true, notify: true })}>
                Refresh
              </Button>
              <Button size="sm" variant="outline" icon={FiCalendar} onClick={openCalendar}>
                Book
              </Button>
              <Button size="sm" icon={FiUserPlus} onClick={openWalkIns}>
                Register Visitor
              </Button>
            </div>
          )}
        />
      )}
    >
      {error && (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-danger/20 bg-danger-soft px-3.5 py-2.5">
          <FiAlertCircle className="h-4 w-4 shrink-0 text-danger" />
          <p className="min-w-0 flex-1 text-[13px] text-danger">{error}</p>
          <Button size="sm" variant="outline" onClick={() => load()}>Retry</Button>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">
        <MetricCard icon={FiUsers} label="Visitors today" value={metrics.walkInsToday} hint={`${metrics.arrivedToday || 0} attended`} onClick={openWalkIns} />
        <MetricCard icon={FiCalendar} label="Appointments" value={metrics.appointmentsRemaining} hint={`${metrics.appointmentsToday || 0} today · ${metrics.demosToday || 0} demo`} tone="info" onClick={openCalendar} />
        <MetricCard icon={FiAlertCircle} label="Follow-ups due" value={metrics.followupsDueToday} hint={`${metrics.overdueFollowups || 0} overdue`} tone={metrics.overdueFollowups ? 'danger' : 'warning'} onClick={openCalendar} />
        <MetricCard icon={FiUserCheck} label="Counsellors free" value={metrics.availableCounsellors} hint={`${metrics.totalCounsellors || 0} total`} tone="success" />
        <MetricCard icon={FiCheckCircle} label="Completed" value={metrics.completedToday} hint={`${metrics.convertedToday || 0} converted`} tone="success" onClick={openWalkIns} />
        <MetricCard icon={FiUserPlus} label="Unassigned" value={metrics.unassignedWaiting} hint="Needs staff attention" tone={metrics.unassignedWaiting ? 'danger' : 'primary'} onClick={openWalkIns} />
      </div>

      {(metrics.unassignedWaiting > 0 || metrics.overdueAppointments > 0 || metrics.overdueFollowups > 0) && (
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 rounded-xl border border-warning/25 bg-warning-soft px-3.5 py-2 text-xs text-text-secondary">
          <FiAlertCircle className="h-4 w-4 shrink-0 text-warning" />
          <strong className="text-text">Attention needed</strong>
          {metrics.unassignedWaiting > 0 && <span>{metrics.unassignedWaiting} visitor(s) unassigned</span>}
          {metrics.overdueAppointments > 0 && <span>{metrics.overdueAppointments} overdue appointment(s)</span>}
          {metrics.overdueFollowups > 0 && <span>{metrics.overdueFollowups} overdue follow-up(s)</span>}
        </div>
      )}

      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-[minmax(0,1.5fr)_minmax(320px,0.85fr)]">
        <SchedulePanel
          appointments={data?.todayAppointments || []}
          followups={data?.followupsDue || []}
          demos={data?.demosToday || []}
          classes={data?.classesToday || []}
          onOpen={openCalendar}
        />
        <CounsellorPanel rows={data?.counsellorAvailability || []} />
      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 xl:grid-cols-2">
        <VisitorsPanel rows={data?.todayWalkIns || []} onOpen={openWalkIns} />
        <TimelinePanel rows={data?.timeline || []} onOpen={openCalendar} />
      </div>
    </PageShell>
  );
}
