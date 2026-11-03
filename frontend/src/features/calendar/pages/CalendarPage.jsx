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
import CalendarBoard from '../components/CalendarBoard';
import CalendarEventDrawer from '../components/CalendarEventDrawer';
import CalendarQuickAddModal from '../components/CalendarQuickAddModal';
import { DEFAULT_CALENDAR_FILTERS } from '../constants/calendar.constants';
import { buildCalendarSummaryItems } from '../config/calendarSummary.config';
import '../styles/calendar.theme.css';

const DEFAULT_EVENT_TYPES = DEFAULT_CALENDAR_FILTERS.eventTypes;

function countBy(events, key) {
  const map = {};
  events.forEach((e) => {
    const id = String(e?.[key] || '').toUpperCase();
    if (!id) return;
    map[id] = (map[id] || 0) + 1;
  });
  return map;
}

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
  const [quickAdd, setQuickAdd] = useState(null);
  const [activeSummaryFilter, setActiveSummaryFilter] = useState(null);

  const {
    filters, searchInput, setSearchInput,
    toggleCategory, toggleEventType, setCategories, setEventTypes,
    setField, applyPreset, applySmartPreset, activePreset,
    activeFilterCount, reset, queryParams,
    branchLocked, canViewAllBranches,
  } = useCalendarFilters();

  useEffect(() => {
    if (roleSlug === 'teacher') setViewId('week');
  }, [roleSlug]);

  const { events, summary, loading, error, refresh } = useCalendarEvents({
    currentDate,
    viewId,
    queryParams,
  });

  const categoryCounts = useMemo(() => countBy(events, 'category'), [events]);
  const eventTypeCounts = useMemo(() => countBy(events, 'eventType'), [events]);

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

  const handleSummarySelect = (filterValue) => {
    setActiveSummaryFilter(filterValue);
    setFiltersOpen(true);
    if (filterValue == null) {
      applySmartPreset('all');
      return;
    }
    if (filterValue === 'today') {
      setCurrentDate(new Date());
      setViewId('day');
      applyPreset({ status: '', eventTypes: DEFAULT_EVENT_TYPES }, 'all');
      return;
    }
    if (filterValue === 'upcoming') {
      setCurrentDate(new Date());
      setViewId('week');
      applyPreset({ status: '', eventTypes: DEFAULT_EVENT_TYPES }, 'all');
      return;
    }
    if (filterValue === 'overdue') {
      applySmartPreset('overdue');
      return;
    }
    if (filterValue === 'followups') {
      applySmartPreset('followups');
      return;
    }
    if (filterValue === 'appointments') {
      applySmartPreset('appointments');
      return;
    }
    if (filterValue === 'due') {
      applySmartPreset('due');
    }
  };

  const statItems = useMemo(() => buildCalendarSummaryItems(summary), [summary]);

  const empty = !loading && !error && events.length === 0;
  const filteredEmpty = empty && (filters.search || filters.status || filters.assignedTo || activeFilterCount > 0);

  return (
    <>
      <ModulePageCard
        hideHeader
        scroll="contain"
      >
        <ModulePageCard.Stats
          items={statItems}
          activeFilter={activeSummaryFilter}
          onSelect={handleSummarySelect}
          loading={loading && !summary}
          ariaLabel="Calendar summary filters"
          layout="grid"
        />

        <ModulePageCard.Toolbar>
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
            activeFilterCount={activeFilterCount}
            onRefresh={refresh}
            refreshing={loading}
            onAddFollowup={() => setQuickAdd({ mode: 'followup', date: currentDate })}
            onAddAppointment={() => setQuickAdd({ mode: 'appointment', date: currentDate })}
            canCreate={canCreate}
          />
        </ModulePageCard.Toolbar>

        <ModulePageCard.Table>
          <div className="crm-calendar-shell h-full min-h-0">
            {filtersOpen && (
              <CalendarFilters
                filters={filters}
                toggleCategory={toggleCategory}
                toggleEventType={toggleEventType}
                setCategories={setCategories}
                setEventTypes={setEventTypes}
                setField={setField}
                onReset={() => { reset(); setActiveSummaryFilter(null); }}
                applySmartPreset={(id) => {
                  applySmartPreset(id);
                  setActiveSummaryFilter(id === 'all' ? null : id);
                }}
                activePreset={activePreset}
                categoryCounts={categoryCounts}
                eventTypeCounts={eventTypeCounts}
                branchOptions={branchOptions}
                counsellorOptions={counsellorOptions}
                branchLocked={branchLocked}
                canViewAllBranches={canViewAllBranches}
              />
            )}

            <div className="crm-calendar-main">
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
                        ? 'Try a smart preset or widen category / type.'
                        : 'Pick a date on the calendar to add a follow-up or appointment.'}
                    </span>
                  </span>
                  {filteredEmpty ? (
                    <button
                      type="button"
                      className="shrink-0 rounded-lg border border-border bg-card-bg px-3 py-1.5 text-[11px] font-semibold text-text-secondary hover:border-border-strong hover:text-text"
                      onClick={() => { reset(); setActiveSummaryFilter(null); }}
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
              <div className="crm-calendar-board-wrap">
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
          </div>
        </ModulePageCard.Table>
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
