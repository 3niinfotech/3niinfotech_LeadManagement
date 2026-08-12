import { useEffect, useState, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiPlus, FiTrash2, FiUserCheck, FiUsers,
} from 'react-icons/fi';
import toastService from '../../services/toast/toast.service';
import ModulePageCard, { countByStatus } from '../../components/layout/ModulePageCard';
import DataGrid from '../../components/table/DataGrid';
import { createActionsColumn, GridRowActions } from '../../components/table/grid.columns';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import alertService from '../../services/alert/alert.service';
import PermissionGate from '../../components/common/PermissionGate';
import StudentModal from '../../modules/student/components/StudentModal';
import { fetchStudents, deleteStudent } from '../../modules/student/redux/studentSlice';
import { selectStudents, selectStudentLoading } from '../../modules/student/redux/studentSlice';
import { PERMISSIONS } from '../../config/permissions';
import { ROUTES } from '../../config/routes';
import { STUDENT_STATUSES, DEFAULT_PAGE_SIZE } from '../../config/constants';
import { MESSAGES } from '../../config/messages';
import { buildStudentSummaryItems } from '../../modules/student/config/studentSummary.config';

export default function StudentsPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const students = useSelector(selectStudents);
  const loading = useSelector(selectStudentLoading);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [selectedRows, setSelectedRows] = useState([]);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(DEFAULT_PAGE_SIZE);
  const [statusFilter, setStatusFilter] = useState(null);

  const summary = useMemo(
    () => countByStatus(students, STUDENT_STATUSES.map((s) => ({ ...s, summaryKey: s.value }))),
    [students],
  );
  const statItems = useMemo(() => buildStudentSummaryItems(summary), [summary]);
  const filteredStudents = useMemo(() => {
    if (!statusFilter) return students;
    return students.filter((s) => s.status === statusFilter);
  }, [students, statusFilter]);

  const loadStudents = useCallback(() => {
    toastService.runReload(() => dispatch(fetchStudents({ page, limit: pageSize })));
  }, [dispatch, page, pageSize]);

  useEffect(() => { loadStudents(); }, [loadStudents]);

  const getStatusColor = (status) =>
    STUDENT_STATUSES.find((s) => s.value === status)?.color || 'secondary';

  const columns = [
    {
      field: 'studentCode',
      headerName: 'Code',
      width: 110,
      pinned: 'left',
      cellClass: 'font-medium text-text tabular-nums',
    },
    { field: 'firstName', headerName: 'First Name', width: 130, cellClass: 'text-text' },
    { field: 'lastName', headerName: 'Last Name', width: 130, cellClass: 'text-text-secondary' },
    { field: 'email', headerName: 'Email', width: 200, cellClass: 'text-text-secondary' },
    { field: 'phone', headerName: 'Phone', width: 130, cellClass: 'tabular-nums text-text-secondary' },
    { field: 'country', headerName: 'Country', width: 110, cellClass: 'text-text-secondary' },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      cellRenderer: (params) => {
        const status = STUDENT_STATUSES.find((s) => s.value === params.value);
        return <Badge color={getStatusColor(params.value)}>{status?.label || params.value}</Badge>;
      },
    },
    {
      field: 'assignedTo',
      headerName: 'Assigned To',
      width: 150,
      valueGetter: (params) => params.data.assignedTo
        ? `${params.data.assignedTo.firstName} ${params.data.assignedTo.lastName}` : '—',
      cellClass: 'text-text-secondary',
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 110,
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: '2-digit' }),
      cellClass: 'text-text-muted tabular-nums',
    },
  ];

  const handleDelete = async (id) => {
    const ok = await alertService.deleteConfirm({
      title: 'Delete Student',
      text: MESSAGES.DELETE_CONFIRM,
      confirmText: 'Delete',
    });
    if (!ok) return;
    await dispatch(deleteStudent(id || selectedId));
    toastService.action.deleted(MESSAGES.DELETE_SUCCESS);
    loadStudents();
  };

  return (
    <>
      <div className="h-full min-h-0 flex flex-col">
        <ModulePageCard
          title="Students"
          subtitle="Manage student records and applications"
          icon={FiUsers}
          iconColor="success"
          breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Students' }]}
          actions={(
            <PermissionGate permission={PERMISSIONS.STUDENTS_CREATE}>
              <Button size="sm" icon={FiPlus} onClick={() => setModalOpen(true)}>Add Student</Button>
            </PermissionGate>
          )}
        >
          <ModulePageCard.Stats
            items={statItems}
            activeFilter={statusFilter}
            onSelect={setStatusFilter}
            loading={loading}
            ariaLabel="Student status filters"
          />

          {selectedRows.length > 0 && (
            <ModulePageCard.Toolbar>
              <div className="flex items-center gap-3 px-4 py-2 border-b border-primary-200 bg-primary-50/80">
                <span className="text-xs font-medium text-primary-700">{selectedRows.length} selected</span>
                <PermissionGate permission={PERMISSIONS.STUDENTS_DELETE}>
                  <Button variant="danger" size="sm" icon={FiTrash2}>Bulk Delete</Button>
                </PermissionGate>
                <PermissionGate permission={PERMISSIONS.STUDENTS_ASSIGN}>
                  <Button variant="outline" size="sm" icon={FiUserCheck}>Bulk Assign</Button>
                </PermissionGate>
              </div>
            </ModulePageCard.Toolbar>
          )}

          <ModulePageCard.Table>
            <DataGrid
              columns={columns}
              rowData={filteredStudents}
              loading={loading}
              rowSelection
              onSelectionChanged={setSelectedRows}
              onRowClick={(row) => navigate(ROUTES.STUDENT_DETAIL(row.id))}
              pagination
              paginationPageSize={pageSize}
              height="100%"
            />
          </ModulePageCard.Table>
        </ModulePageCard>
      </div>

      <StudentModal open={modalOpen} onClose={() => setModalOpen(false)} onSuccess={loadStudents} />
    </>
  );
}
