import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiUsers,
  FiPlus,
} from 'react-icons/fi';
import ModulePageCard from '../../components/layout/ModulePageLayout';
import Button from '../../components/ui/Button';
import PermissionGate from '../../components/common/PermissionGate';
import alertService from '../../services/alert/alert.service';
import toastService from '../../services/toast/toast.service';
import { PERMISSIONS } from '../../config/permissions';
import { ROUTES } from '../../config/routes';
import { usePermissions } from '../../hooks/usePermissions';
import { useStudentStatusOptions } from '../../features/student/hooks/useStudentStatusOptions';
import { buildStudentSummaryItems } from '../../modules/student/config/studentSummary.config';
import StudentModal from '../../modules/student/components/StudentModal';

import StudentToolbar from '../../features/student/components/StudentToolbar';
import StudentFilters from '../../features/student/components/StudentFilters';
import StudentGrid from '../../features/student/components/StudentGrid';
import StudentBulkActionModal from '../../features/student/components/StudentBulkActionModal';

import {
  fetchStudents,
  deleteStudent,
  selectStudents,
  selectStudentLoading,
} from '../../modules/student/redux/studentSlice';
import { studentService } from '../../modules/student/services/student.service';
import { onViewingBranchChanged } from '../../config/viewingBranch.events';
import { useViewingBranchFilter } from '../../hooks/useViewingBranchFilter';

export default function StudentsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { can } = usePermissions();
  const {
    branchId: viewingBranchId,
    branchLocked,
    canViewAllBranches,
  } = useViewingBranchFilter();

  const students = useSelector(selectStudents);
  const loading = useSelector(selectStudentLoading);

  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [selectedRowIds, setSelectedRowIds] = useState([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [activeView, setActiveView] = useState('all');
  const [activeSummaryFilter, setActiveSummaryFilter] = useState(null);
  const [filterDraft, setFilterDraft] = useState({});
  const [appliedFilters, setAppliedFilters] = useState({});
  const [search, setSearch] = useState('');
  const [summary, setSummary] = useState({});
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [exportLoading, setExportLoading] = useState(false);
  const [bulkAction, setBulkAction] = useState(null);

  useEffect(() => {
    const nextId = viewingBranchId || undefined;
    setFilterDraft((prev) => ({ ...prev, branchId: nextId }));
    setAppliedFilters((prev) => ({ ...prev, branchId: nextId }));
  }, [viewingBranchId]);

  const { statusOptions } = useStudentStatusOptions();

  const canCreate = can(PERMISSIONS.STUDENTS_CREATE);
  const canDelete = can(PERMISSIONS.STUDENTS_DELETE);

  const queryParams = useMemo(() => {
    let status = appliedFilters.status || undefined;

    if (activeSummaryFilter) {
      status = activeSummaryFilter;
    } else if (activeView !== 'all') {
      status = activeView;
    }

    return {
      search: search || undefined,
      status,
      country: appliedFilters.country || undefined,
      course: appliedFilters.course || undefined,
      branchId: branchLocked
        ? (viewingBranchId || undefined)
        : (appliedFilters.branchId || viewingBranchId || undefined),
      assignedToId: appliedFilters.assignedToId || undefined,
      createdFrom: appliedFilters.createdFrom || undefined,
      createdTo: appliedFilters.createdTo || undefined,
      limit: 100,
    };
  }, [search, activeView, activeSummaryFilter, appliedFilters, branchLocked, viewingBranchId]);

  const loadSummary = useCallback(async () => {
    try {
      setSummaryLoading(true);
      const data = await studentService.getSummary({
        branchId: branchLocked
          ? (viewingBranchId || undefined)
          : (appliedFilters.branchId || viewingBranchId || undefined),
      });
      setSummary(data || {});
    } catch {
      // ignore
    } finally {
      setSummaryLoading(false);
    }
  }, [appliedFilters.branchId, branchLocked, viewingBranchId]);

  const loadStudents = useCallback(() => {
    dispatch(fetchStudents(queryParams));
    loadSummary();
  }, [dispatch, queryParams, loadSummary]);

  useEffect(() => {
    loadStudents();
  }, [loadStudents]);

  useEffect(() => onViewingBranchChanged(() => {
    loadStudents();
  }), [loadStudents]);

  const statItems = useMemo(() => buildStudentSummaryItems(summary), [summary]);

  const handleSelectSummary = (filterValue) => {
    setActiveSummaryFilter(filterValue);
    if (filterValue) {
      setActiveView('all');
    }
  };

  const handleViewChange = (v) => {
    setActiveView(v);
    setActiveSummaryFilter(null);
  };

  const handleSearchApply = () => {
    const next = branchLocked
      ? { ...filterDraft, branchId: viewingBranchId || undefined }
      : filterDraft;
    setAppliedFilters(next);
  };

  const handleResetFilters = () => {
    const next = branchLocked ? { branchId: viewingBranchId || undefined } : {};
    setFilterDraft(next);
    setAppliedFilters(next);
    setSearch('');
    setActiveView('all');
    setActiveSummaryFilter(null);
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const body = { ...queryParams };
      if (selectedRowIds.length > 0) {
        body.ids = selectedRowIds;
      }
      const res = await studentService.exportStudents(body);
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = res.filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      const count = res.count || 0;
      toastService.create(
        {
          title: res.selected
            ? `${count} selected student${count === 1 ? '' : 's'} exported`
            : `${count} student record${count === 1 ? '' : 's'} exported`,
          description: 'Excel spreadsheet is ready for download.',
        },
        { label: 'Exported' },
      );
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Export failed');
    } finally {
      setExportLoading(false);
    }
  };

  const handleBulkExport = () => handleExport();

  const handleBulkDelete = async () => {
    const ok = await alertService.bulkConfirm({
      action: 'delete',
      count: selectedRowIds.length,
      entity: 'students',
    });
    if (!ok) return;

    try {
      await studentService.bulkDelete(selectedRowIds);
      setSelectedRowIds([]);
      toastService.action.deleted('Selected students deleted');
      loadStudents();
    } catch (e) {
      toastService.error(e?.response?.data?.message || 'Bulk delete failed');
    }
  };

  const handleDeleteSingle = async (id) => {
    const ok = await alertService.deleteConfirm({
      title: 'Delete Student',
      text: 'Are you sure you want to delete this student record?',
      confirmText: 'Delete',
    });
    if (!ok) return;

    try {
      await dispatch(deleteStudent(id)).unwrap();
      toastService.action.deleted('Student deleted');
      loadStudents();
    } catch (e) {
      toastService.error(e?.message || 'Delete failed');
    }
  };

  const handleEditStudent = (student) => {
    setSelectedStudent(student);
    setModalOpen(true);
  };

  const handleOpenDetail = (id) => {
    navigate(ROUTES.STUDENT_DETAIL(id));
  };

  return (
    <>
      <div className="h-full min-h-0 flex flex-col">
        <ModulePageCard
          title="Students"
          subtitle="Manage student admissions, applications, visas, and educational journeys"
          icon={FiUsers}
          iconColor="success"
          scroll="contain"
          breadcrumbs={[
            { label: 'Dashboard', path: ROUTES.DASHBOARD },
            { label: 'Students' },
          ]}
          actions={
            canCreate ? (
              <PermissionGate permission={PERMISSIONS.STUDENTS_CREATE}>
                <Button
                  variant="primary"
                  size="sm"
                  icon={FiPlus}
                  onClick={() => {
                    setSelectedStudent(null);
                    setModalOpen(true);
                  }}
                >
                  Add Student
                </Button>
              </PermissionGate>
            ) : null
          }
        >
          <ModulePageCard.Stats
            items={statItems}
            activeFilter={activeSummaryFilter}
            onSelect={handleSelectSummary}
            loading={summaryLoading}
            ariaLabel="Student status summary cards"
            layout="grid"
          />

          <ModulePageCard.Toolbar>
            <StudentToolbar
              search={search}
              onSearchChange={setSearch}
              activeView={activeView}
              onViewChange={handleViewChange}
              onAddStudent={
                canCreate
                  ? () => {
                      setSelectedStudent(null);
                      setModalOpen(true);
                    }
                  : undefined
              }
              onExport={handleExport}
              exportLoading={exportLoading}
              filtersOpen={filtersOpen}
              onToggleFilters={() => setFiltersOpen((v) => !v)}
              selectedCount={selectedRowIds.length}
              onBulkAction={(action) => setBulkAction(action)}
              onBulkExport={handleBulkExport}
              onBulkDelete={handleBulkDelete}
              onRefresh={loadStudents}
              refreshLoading={loading}
            />
          </ModulePageCard.Toolbar>

          <ModulePageCard.Filters>
            <StudentFilters
              open={filtersOpen}
              values={filterDraft}
              onChange={setFilterDraft}
              onSearch={handleSearchApply}
              onReset={handleResetFilters}
              onClose={() => setFiltersOpen(false)}
              branchLocked={branchLocked}
              canViewAllBranches={canViewAllBranches}
            />
          </ModulePageCard.Filters>

          <ModulePageCard.Table className="flex-1 min-h-0">
            <StudentGrid
              rows={students}
              loading={loading}
              fetching={loading && students.length > 0}
              onOpenDetail={handleOpenDetail}
              onEdit={handleEditStudent}
              onDelete={canDelete ? handleDeleteSingle : undefined}
              onSelectionChanged={(selected) =>
                setSelectedRowIds((selected || []).map((r) => r.id))
              }
              onAddStudent={
                canCreate
                  ? () => {
                      setSelectedStudent(null);
                      setModalOpen(true);
                    }
                  : undefined
              }
            />
          </ModulePageCard.Table>
        </ModulePageCard>
      </div>

      <StudentModal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setSelectedStudent(null);
        }}
        initialData={selectedStudent}
        onSuccess={loadStudents}
      />

      <StudentBulkActionModal
        action={bulkAction}
        open={Boolean(bulkAction)}
        onClose={() => setBulkAction(null)}
        selectedIds={selectedRowIds}
        onSuccess={() => {
          setSelectedRowIds([]);
          loadStudents();
        }}
      />
    </>
  );
}
