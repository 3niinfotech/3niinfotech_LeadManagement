import { FiChevronLeft, FiChevronRight, FiPlus, FiRefreshCw, FiFilter } from 'react-icons/fi';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import SegmentControl from '../../../components/ui/SegmentControl';
import { CALENDAR_VIEW_OPTIONS } from '../constants/calendar.constants';
import { formatCalendarTitle } from '../utils/calendar-date.utils';
import PermissionGate from '../../../components/common/PermissionGate';
import { PERMISSIONS } from '../../../config/permissions';

export default function CalendarHeader({
  currentDate,
  viewId,
  onViewChange,
  onPrev,
  onNext,
  onToday,
  searchInput,
  onSearchChange,
  onToggleFilters,
  filtersOpen,
  onRefresh,
  refreshing,
  onAddFollowup,
  onAddAppointment,
  canCreate,
}) {
  const viewOptions = CALENDAR_VIEW_OPTIONS.map((v) => ({ id: v.id, label: v.label }));

  return (
    <div className="flex flex-col gap-3 px-4 py-3 border-b border-border bg-card-bg">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <Button variant="outline" size="sm" onClick={onToday}>Today</Button>
          <Button variant="outline" size="sm" icon={FiChevronLeft} onClick={onPrev} aria-label="Previous" />
          <Button variant="outline" size="sm" icon={FiChevronRight} onClick={onNext} aria-label="Next" />
          <h2 className="text-base font-semibold text-text-primary ml-1 truncate">
            {formatCalendarTitle(currentDate, viewId)}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="w-[200px] max-w-full">
            <SearchInput
              value={searchInput}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search calendar..."
            />
          </div>
          <Button
            variant={filtersOpen ? 'outline-primary' : 'outline'}
            size="sm"
            icon={FiFilter}
            onClick={onToggleFilters}
            aria-pressed={filtersOpen}
          >
            Filters
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={FiRefreshCw}
            loading={refreshing}
            onClick={onRefresh}
            title="Refresh calendar"
          >
            Refresh
          </Button>
          {canCreate && (
            <PermissionGate permissions={[PERMISSIONS.CALENDAR_CREATE, PERMISSIONS.ENQUIRIES_UPDATE]}>
              <div className="flex items-center gap-1">
                <Button variant="primary" size="sm" icon={FiPlus} onClick={onAddFollowup}>
                  Follow-up
                </Button>
                <Button variant="outline-primary" size="sm" icon={FiPlus} onClick={onAddAppointment}>
                  Appointment
                </Button>
              </div>
            </PermissionGate>
          )}
          <SegmentControl
            items={viewOptions}
            value={viewId}
            onChange={onViewChange}
            layoutId="crm-calendar-view"
          />
        </div>
      </div>
    </div>
  );
}
