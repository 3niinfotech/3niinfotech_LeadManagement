import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FiUsers, FiPlus, FiFilter, FiRefreshCw,
} from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import SearchInput from '../../../components/ui/SearchInput';
import Select from '../../../components/ui/Select';
import FilterPanel from '../../../components/ui/FilterPanel';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import PermissionGate from '../../../components/common/PermissionGate';
import { useGetBatchesQuery } from '../redux/attendanceApiSlice';
import {
  buildBatchListSummary,
  buildBatchListSummaryItems,
} from '../config/batchSummary.config';
import BatchCreateModal from '../components/BatchCreateModal';
import BatchGrid from '../components/BatchGrid';
import '../styles/batches.theme.css';

export default function BatchListPage() {
  const navigate = useNavigate();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [summaryFilter, setSummaryFilter] = useState(null);
  const [instructorFilter, setInstructorFilter] = useState('all');
  const [courseFilter, setCourseFilter] = useState('');
  const [createOpen, setCreateOpen] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  const { data, isLoading, isFetching, refetch } = useGetBatchesQuery({
    search: search || undefined,
    limit: 100,
  });

  const batches = data?.data || [];

  const courses = useMemo(() => {
    const map = new Map();
    batches.forEach((b) => {
      const c = b.courseName || 'Other';
      map.set(c, (map.get(c) || 0) + 1);
    });
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [batches]);

  const visible = useMemo(() => {
    let rows = batches;
    if (instructorFilter === 'assigned') {
      rows = rows.filter((b) => b.instructorId || b.instructor);
    } else if (instructorFilter === 'unassigned') {
      rows = rows.filter((b) => !(b.instructorId || b.instructor));
    }
    if (courseFilter) rows = rows.filter((b) => b.courseName === courseFilter);
    if (summaryFilter === 'active') rows = rows.filter((b) => b.isActive !== false);
    if (summaryFilter === 'assigned') rows = rows.filter((b) => b.instructorId || b.instructor);
    if (summaryFilter === 'unassigned') rows = rows.filter((b) => !(b.instructorId || b.instructor));
    if (summaryFilter === 'withSlots') rows = rows.filter((b) => (b._count?.sessions || 0) > 0);
    return rows;
  }, [batches, instructorFilter, courseFilter, summaryFilter]);

  const summary = useMemo(() => buildBatchListSummary(batches), [batches]);
  const statItems = useMemo(() => buildBatchListSummaryItems(summary), [summary]);

  const activeFilterCount = [
    instructorFilter !== 'all' ? 1 : 0,
    courseFilter ? 1 : 0,
    summaryFilter ? 1 : 0,
  ].reduce((a, b) => a + b, 0);

  const resetFilters = () => {
    setInstructorFilter('all');
    setCourseFilter('');
    setSummaryFilter(null);
    setSearchInput('');
  };

  const openBatch = (batch) => {
    if (batch?.id) navigate(ROUTES.BATCH_DETAIL(batch.id));
  };

  return (
    <>
      <ModulePageCard
        title="Batches"
        subtitle="Coaching batches, timetable, and class attendance"
        icon={FiUsers}
        iconColor="primary"
        breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Batches' }]}
        actions={(
          <PermissionGate permission={PERMISSIONS.ATTENDANCE_EDIT}>
            <Button size="sm" icon={FiPlus} onClick={() => setCreateOpen(true)}>New Batch</Button>
          </PermissionGate>
        )}
      >
        <ModulePageCard.Stats
          items={statItems}
          activeFilter={summaryFilter}
          onSelect={setSummaryFilter}
          loading={isLoading}
          ariaLabel="Batch summary filters"
          layout="grid"
        />

        <ModulePageCard.Toolbar>
          <div className="crm-batch-toolbar">
            <div className="w-[220px] max-w-full">
              <SearchInput
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search batch, course, code..."
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Button
                variant={filtersOpen ? 'outline-primary' : 'outline'}
                size="sm"
                icon={FiFilter}
                onClick={() => setFiltersOpen((v) => !v)}
              >
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1.5 inline-flex min-w-[1.125rem] h-[1.125rem] items-center justify-center rounded-full bg-brand text-[10px] font-bold text-white px-1">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={FiRefreshCw}
                loading={isFetching}
                onClick={() => refetch()}
              >
                Refresh
              </Button>
            </div>
          </div>
        </ModulePageCard.Toolbar>

        <ModulePageCard.Filters>
          <FilterPanel
            open={filtersOpen}
            activeCount={activeFilterCount}
            onClose={() => setFiltersOpen(false)}
            onReset={resetFilters}
            onApply={() => setFiltersOpen(false)}
            applyLabel="Done"
            columns="grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"
          >
            <Select
              label="Instructor"
              size="sm"
              value={instructorFilter}
              onChange={(e) => setInstructorFilter(e.target.value)}
              options={[
                { value: 'all', label: 'All batches' },
                { value: 'assigned', label: 'Assigned' },
                { value: 'unassigned', label: 'Unassigned' },
              ]}
              allowClear={false}
            />
            <Select
              label="Course"
              size="sm"
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              options={[
                { value: '', label: 'All courses' },
                ...courses.map(([name, count]) => ({
                  value: name,
                  label: `${name} (${count})`,
                })),
              ]}
            />
          </FilterPanel>
        </ModulePageCard.Filters>

        <ModulePageCard.Table>
          <BatchGrid
            rows={visible}
            loading={isLoading}
            fetching={isFetching}
            onRowClick={openBatch}
            onOpen={openBatch}
            emptyTitle={batches.length ? 'No batches match filters' : 'No batches yet'}
            emptyDescription={batches.length
              ? 'Widen filters or clear search.'
              : 'Create a batch, enroll students, add timetable, then take attendance.'}
            emptyActionLabel={batches.length === 0 ? 'New Batch' : 'Clear filters'}
            onEmptyAction={() => {
              if (batches.length === 0) setCreateOpen(true);
              else resetFilters();
            }}
          />
        </ModulePageCard.Table>
      </ModulePageCard>

      <BatchCreateModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onCreated={(id) => {
          if (id) navigate(ROUTES.BATCH_DETAIL(id));
        }}
      />
    </>
  );
}
