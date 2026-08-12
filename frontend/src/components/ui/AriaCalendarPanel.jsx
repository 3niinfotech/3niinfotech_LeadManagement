import {
  Calendar,
  Heading,
  Button,
  CalendarGrid,
  CalendarGridHeader,
  CalendarGridBody,
  CalendarCell,
  CalendarHeaderCell,
} from 'react-aria-components';
import { FiChevronLeft, FiChevronRight } from 'react-icons/fi';

/** Shared React Aria calendar panel — used by DatePicker & DateTimePicker */
export default function AriaCalendarPanel({ className = '' }) {
  return (
    <Calendar className={`crm-aria-calendar p-3 ${className}`.trim()}>
      <header className="flex items-center justify-between px-1 pb-3">
        <Button
          slot="previous"
          className="crm-aria-cal-nav p-1.5 rounded-md text-slate-500 hover:bg-slate-100 outline-none"
        >
          <FiChevronLeft className="w-4 h-4" />
        </Button>
        <Heading className="text-sm font-semibold text-slate-800" />
        <Button
          slot="next"
          className="crm-aria-cal-nav p-1.5 rounded-md text-slate-500 hover:bg-slate-100 outline-none"
        >
          <FiChevronRight className="w-4 h-4" />
        </Button>
      </header>

      <CalendarGrid className="crm-aria-calendar-grid">
        <CalendarGridHeader>
          {(day) => (
            <CalendarHeaderCell className="crm-aria-cal-head text-[11px] font-semibold text-slate-500 pb-2">
              {day}
            </CalendarHeaderCell>
          )}
        </CalendarGridHeader>
        <CalendarGridBody>
          {(date) => (
            <CalendarCell
              date={date}
              className="crm-aria-cal-cell"
            >
              {({ formattedDate, isSelected, isToday }) => (
                <span
                  className={`inline-flex items-center justify-center w-9 h-9 text-[13px] rounded-lg
                    ${isSelected ? 'bg-primary-600 text-white font-semibold' : 'text-slate-700'}
                    ${isToday && !isSelected ? 'font-bold text-primary-600' : ''}
                  `}
                >
                  {formattedDate}
                </span>
              )}
            </CalendarCell>
          )}
        </CalendarGridBody>
      </CalendarGrid>
    </Calendar>
  );
}
