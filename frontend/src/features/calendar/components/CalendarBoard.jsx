import { useEffect, useMemo, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import listPlugin from '@fullcalendar/list';
import interactionPlugin from '@fullcalendar/interaction';
import { CALENDAR_VIEW_OPTIONS } from '../constants/calendar.constants';
import { toFullCalendarEvent } from '../utils/calendar-event.config.js';
import '../styles/calendar.theme.css';

export default function CalendarBoard({
  viewId,
  currentDate,
  events,
  onEventClick,
  onDateClick,
  onEventDrop,
  loading,
}) {
  const calendarRef = useRef(null);
  const containerRef = useRef(null);
  const fcEvents = useMemo(() => events.map(toFullCalendarEvent), [events]);
  const fcView = CALENDAR_VIEW_OPTIONS.find((v) => v.id === viewId)?.fc || 'dayGridMonth';

  useEffect(() => {
    const api = calendarRef.current?.getApi?.();
    if (!api) return;
    if (api.view?.type !== fcView) api.changeView(fcView);
    api.gotoDate(currentDate);
  }, [fcView, currentDate]);

  // FullCalendar caches its layout width, so collapsing the app sidebar or
  // toggling the filter rail leaves the grid misaligned until it is told to remeasure.
  useEffect(() => {
    const node = containerRef.current;
    if (!node || typeof ResizeObserver === 'undefined') return undefined;

    let frame = 0;
    const observer = new ResizeObserver(() => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(() => calendarRef.current?.getApi?.()?.updateSize());
    });

    observer.observe(node);
    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className={`crm-calendar-board flex-1 min-w-0 min-h-[560px] relative ${loading ? 'opacity-70' : ''}`}
      style={{ height: 'min(720px, calc(100vh - 260px))' }}
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, listPlugin, interactionPlugin]}
        initialView={fcView}
        initialDate={currentDate}
        headerToolbar={false}
        height="100%"
        events={fcEvents}
        nowIndicator
        editable
        eventStartEditable
        eventDurationEditable={false}
        dayMaxEvents={3}
        moreLinkClick="popover"
        eventClick={(info) => {
          info.jsEvent.preventDefault();
          onEventClick?.(info.event.extendedProps);
        }}
        dateClick={(info) => onDateClick?.(info.date)}
        eventDrop={async (info) => {
          const props = info.event.extendedProps;
          if (!props?.canReschedule) {
            info.revert();
            return;
          }
          const ok = await onEventDrop?.(props, info.event.start, info.event.end);
          if (!ok) info.revert();
        }}
        eventAllow={(_dropInfo, draggedEvent) => Boolean(draggedEvent?.extendedProps?.canReschedule)}
        slotMinTime="07:00:00"
        slotMaxTime="21:00:00"
        eventDisplay="block"
        eventClassNames="crm-fc-event"
      />
    </div>
  );
}
