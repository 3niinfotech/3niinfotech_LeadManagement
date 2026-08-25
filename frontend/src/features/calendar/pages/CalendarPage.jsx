import {
  useCallback, useEffect, useMemo, useState,
} from 'react';
import { FiCalendar, FiFilter, FiPlus } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import { usePermissions } from '../../../hooks/usePermissions';
import toastService from '../../../services/toast/toast.service';
import { useBranchOptions } from '../../enquiry/hooks/useBranchOptions';
import { useCounsellorOptions } from '../../enquiry/hooks/useCounsellorOptions';
import { calendarApi } from '../services/calendarApi.service';
import { useCalendarFilters } from '../hooks/useCalendarFilters';
import { useCalendarEvents } from '../hooks/useCalendarEvents';
import { shiftDate } from '../utils/calendar-date.utils';
import CalendarHeader from '../components/CalendarHeader';
import CalendarFilters from '../components/CalendarFilters';
import CalendarSummary from '../components/CalendarSummary';
import CalendarBoard from '../components/CalendarBoard';
import CalendarEventDrawer from '../components/CalendarEventDrawer';
import CalendarQuickAddModal from '../components/CalendarQuickAddModal';
import { DEFAULT_CALENDAR_FILTERS } from '../constants/calendar.constants';

const DEFAULT_EVENT_TYPES = DEFAULT_CALENDAR_FILTERS.eventTypes;

export default function CalendarPage() {
  const navigate = useNavigate();
  const { can, canAny, roleSlug } = usePermissions();
  const [viewId, setViewId] = useState(() => (
    roleSlug === 'teacher' ? 'week' : (window.innerWidth < 768 ? 'list' : 'month')
  ));
  const [currentDate, setCurrentDate] = useState(() => new Date());
  const [filtersOpen, setFiltersOpen] = useState(() => window.innerWidth >= 1024);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [quickAdd, setQuickAdd] = useState(null); // { mode, date } | null

  const {
    filters, searchInput, setSearchInput,
    toggleCategory, toggleEventType, setField, applyPreset, reset, queryParams,
  } = useCalendarFilters();

  useEffect(() => {
    if (roleSlug === 'teacher') setViewId('week');
  }, [roleSlug]);

  const { events, summary, loading, error, refresh } = useCalendarEvents({
    currentDate,
    viewId,
    queryParams,
  });

  const { options: branchOptions } = useBranchOptions();
  const { options: counsellorOptions } = useCounsellorOptions();

  const canCreate = canAny([PERMISSIONS.CALENDAR_CREATE, PERMISSIONS.ENQUIRIES_UPDATE]);

  const handleOpenRecord = useCallback((event) => {
    const rel = event?.relatedEntity;
    if (!rel?.id) return;
    if (roleSlug === 'student_portal') {
      if (rel.type === 'application' || rel.type === 'visa') navigate(ROUTES.STUDENT_APPLICATIONS);
      return;
    }
    if (roleSlug === 'partner') {
      if (rel.type === 'student' || rel.studentId) navigate(ROUTES.AGENT_STUDENTS);
      return;
    }
    if (rel.type === 'enquiry') {
      if (can(PERMISSIONS.ENQUIRIES_VIEW)) navigate(ROUTES.ENQUIRY_DETAIL(rel.id));
      return;
    }
    if (rel.type === 'invoice' || rel.type === 'feeInstallment') {
      if (can(PERMISSIONS.INVOICES_VIEW)) navigate(ROUTES.FEES);
      return;
    }
    if (rel.type === 'application') {
      if (can(PERMISSIONS.APPLICATIONS_VIEW)) navigate(ROUTES.APPLICATIONS);
      return;
    }
    if (rel.type === 'classSession') {
      if (rel.batchId && can(PERMISSIONS.ATTENDANCE_VIEW)) navigate(ROUTES.BATCH_DETAIL(rel.batchId));
      return;
    }
    if (rel.type === 'student' || rel.studentId) {
      if (can(PERMISSIONS.STUDENTS_VIEW)) navigate(ROUTES.STUDENT_DETAIL(rel.studentId || rel.id));
      return;
    }
    if (rel.type === 'visa') {
      if (can(PERMISSIONS.VISAS_VIEW)) navigate(ROUTES.VISAS);
      return;
    }
    if (rel.type === 'lead') {
      if (rel.enquiryId) navigate(ROUTES.ENQUIRY_DETAIL(rel.enquiryId));
      else if (can(PERMISSIONS.WALKIN_VIEW)) navigate(ROUTES.WALK_INS);
      else navigate(ROUTES.ENQUIRIES);
    }
  }, [navigate, can, roleSlug]);

  const handleComplete = async (event) => {
    setActionLoading(true);
    try {
      await calendarApi.complete(event.id);
      toastService.success('Marked complete');
      setSelectedEvent(null);
      refresh();
    } catch (e) {
      toastService.error(e?.response?.data?.message || e?.message || 'Complete failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReschedule = async (event, startAt) => {
    setActionLoading(true);
    try {
      await calendarApi.reschedule(event.id, { startAt });
      toastService.success('Rescheduled');
      setSelectedEvent(null);
      refresh();
    } catch (e) {
      toastService.error(e?.response?.data?.message || e?.message || 'Reschedule failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssign = async (event, assignedToId) => {
    setActionLoading(true);
    try {
      await calendarApi.assign(event.id, assignedToId);
      toastService.success('Assigned');
      refresh();
    } catch (e) {
      toastService.error(e?.response?.data?.message || e?.message || 'Assign failed');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEventDrop = async (event, start, end) => {
    if (!event?.canReschedule) return false;
    try {
      await calendarApi.reschedule(event.id, {
        startAt: start?.toISOString?.() || start,
        endAt: end ? (end.toISOString?.() || end) : null,
      });
      refresh();
      return true;
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Reschedule failed');
      return false;
    }
  };

  const handleSummarySelect = (id) => {
    if (id === 'today') {
      setCurrentDate(new Date());
      setViewId('day');
      applyPreset({ status: '', eventTypes: DEFAULT_EVENT_TYPES });
      return;
    }
    if (id === 'upcoming') {
      setCurrentDate(new Date());
      setViewId('week');
      applyPreset({ status: '', eventTypes: DEFAULT_EVENT_TYPES });
      return;
    }
    if (id === 'overdue') applyPreset({ status: 'OVERDUE' });
    if (id === 'followups') applyPreset({ status: '', eventTypes: ['FOLLOWUP'] });
    if (id === 'appointments') applyPreset({ status: '', eventTypes: ['APPOINTMENT'] });
    if (id === 'due') applyPreset({ status: '', eventTypes: ['DUE_DATE', 'OFFER', 'EXPIRY'] });
  };

  const empty = !loading && !error && events.length === 0;
  const filteredEmpty = empty && (filters.search || filters.status || filters.assignedTo);

  const subtitle = useMemo(() => {
    if (summary?.overdue) return `${summary.overdue} overdue · ${summary.today || 0} today`;
    return 'Follow-ups, appointments & due dates in one place';
  }, [summary]);

  return (
    <>
      <ModulePageCard
        title="Calendar"
        subtitle={subtitle}
        icon={FiCalendar}
        iconColor="primary"
        breadcrumbs={[
          {
            label: 'Dashboard',
            path: roleSlug === 'student_portal'
              ? ROUTES.STUDENT_DASHBOARD
              : roleSlug === 'partner' ? ROUTES.AGENT_DASHBOARD : ROUTES.DASHBOARD,
          },
          { label: 'Calendar' },
        ]}
      >
        <CalendarSummary summary={summary} loading={loading} onSelect={handleSummarySelect} />

        <CalendarHeader
          currentDate={currentDate}
          viewId={viewId}
          onViewChange={setViewId}
          onPrev={() => setCurrentDate((d) => shiftDate(d, viewId, -1))}
          onNext={() => setCurrentDate((d) => shiftDate(d, viewId, 1))}
          onToday={() => setCurrentDate(new Date())}
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          onToggleFilters={() => setFiltersOpen((v) => !v)}
          filtersOpen={filtersOpen}
          onRefresh={refresh}
          refreshing={loading}
          onAddFollowup={() => setQuickAdd({ mode: 'followup', date: currentDate })}
          onAddAppointment={() => setQuickAdd({ mode: 'appointment', date: currentDate })}
          canCreate={canCreate}
        />

        <div className="flex flex-1 min-h-0 flex-col lg:flex-row">
          {filtersOpen && (
            <CalendarFilters
              filters={filters}
              toggleCategory={toggleCategory}
              toggleEventType={toggleEventType}
              setField={setField}
              onReset={reset}
              branchOptions={branchOptions}
              counsellorOptions={counsellorOptions}
            />
          )}

          <div className="flex flex-1 min-h-[560px] min-w-0 flex-col gap-3 p-3">
            {error && (
              <div className="rounded-xl border border-danger/30 bg-danger-soft px-3.5 py-2.5 text-sm text-danger">
                {error}
              </div>
            )}
            {empty && (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-border bg-page/60 px-3.5 py-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border bg-card-bg text-text-muted">
                  {filteredEmpty ? <FiFilter className="h-4 w-4" /> : <FiCalendar className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-[13px] font-semibold text-text">
                    {filteredEmpty ? 'No events match these filters' : 'Nothing scheduled in this period'}
                  </span>
                  <span className="mt-0.5 block text-[11px] text-text-muted">
                    {filteredEmpty
                      ? 'Try widening the category, type, or date range.'
                      : 'Pick a date on the calendar to add a follow-up or appointment.'}
                  </span>
                </span>
                {filteredEmpty ? (
                  <button
                    type="button"
                    className="shrink-0 rounded-lg border border-border bg-card-bg px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:border-border-strong hover:text-text"
                    onClick={reset}
                  >
                    Clear filters
                  </button>
                ) : canCreate && (
                  <button
                    type="button"
                    className="flex shrink-0 items-center gap-1.5 rounded-lg border border-brand/30 bg-brand-soft px-3 py-1.5 text-[11px] font-semibold text-brand hover:bg-brand hover:text-white"
                    onClick={() => setQuickAdd({ mode: 'followup', date: currentDate })}
                  >
                    <FiPlus className="h-3.5 w-3.5" />
                    Add event
                  </button>
                )}
              </div>
            )}
            <CalendarBoard
              viewId={viewId}
              currentDate={currentDate}
              events={events}
              loading={loading}
              onEventClick={setSelectedEvent}
              onDateClick={(date) => {
                setCurrentDate(date);
                if (canCreate) setQuickAdd({ mode: 'followup', date });
                else setViewId('day');
              }}
              onEventDrop={handleEventDrop}
            />
          </div>
        </div>
      </ModulePageCard>

      <CalendarEventDrawer
        open={Boolean(selectedEvent)}
        event={selectedEvent}
        onClose={() => setSelectedEvent(null)}
        onOpenRecord={handleOpenRecord}
        onComplete={handleComplete}
        onReschedule={handleReschedule}
        onAssign={handleAssign}
        counsellorOptions={counsellorOptions}
        actionLoading={actionLoading}
      />

      <CalendarQuickAddModal
        open={Boolean(quickAdd)}
        mode={quickAdd?.mode || 'followup'}
        onClose={() => setQuickAdd(null)}
        onSuccess={refresh}
        defaultDate={quickAdd?.date || currentDate}
        counsellorOptions={counsellorOptions}
      />
    </>
  );
}
