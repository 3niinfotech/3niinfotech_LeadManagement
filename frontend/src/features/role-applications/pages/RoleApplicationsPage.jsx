import { useMemo, useState } from 'react';
import { FiCheck, FiRefreshCw, FiUserPlus, FiX } from 'react-icons/fi';
import ModulePageLayout from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Badge from '../../../components/ui/Badge';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Drawer from '../../../components/ui/Drawer';
import ContentLoader from '../../../components/ui/ContentLoader';
import PermissionGate from '../../../components/common/PermissionGate';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import { PERMISSIONS } from '../../../config/permissions';
import { APPLY_STATUS_LABELS, APPLY_STATUS_TONES } from '../../../config/role-application.config';
import toastService from '../../../services/toast/toast.service';
import {
  useGetRoleApplicationsQuery,
  useGetRoleApplicationSummaryQuery,
  useGetRoleApplicationByIdQuery,
  useApproveRoleApplicationMutation,
  useRejectRoleApplicationMutation,
} from '../redux/roleApplicationApiSlice';
import '../styles/role-applications.theme.css';

function fmtDate(v) {
  if (!v) return '—';
  return new Date(v).toLocaleString();
}

export default function RoleApplicationsPage() {
  const [status, setStatus] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState(null);
  const [approvePassword, setApprovePassword] = useState('');
  const [employeeCode, setEmployeeCode] = useState('');
  const [department, setDepartment] = useState('');
  const [reviewNotes, setReviewNotes] = useState('');

  const { data: summary, refetch: refetchSummary } = useGetRoleApplicationSummaryQuery();
  const { data: listRes, isLoading, isFetching, refetch } = useGetRoleApplicationsQuery({
    status: status || undefined,
    search: search.trim() || undefined,
    limit: 50,
  });
  const { data: detail } = useGetRoleApplicationByIdQuery(selectedId, { skip: !selectedId });
  const [approve, { isLoading: approving }] = useApproveRoleApplicationMutation();
  const [reject, { isLoading: rejecting }] = useRejectRoleApplicationMutation();

  const rows = listRes?.data || [];

  const stats = useMemo(() => [
    { label: 'Pending', value: summary?.pending ?? 0, tone: 'warning' },
    { label: 'Approved', value: summary?.approved ?? 0, tone: 'success' },
    { label: 'Rejected', value: summary?.rejected ?? 0, tone: 'danger' },
    { label: 'Total', value: summary?.total ?? 0, tone: 'neutral' },
  ], [summary]);

  const openDetail = (row) => {
    setSelectedId(row.id);
    setApprovePassword('');
    setEmployeeCode('');
    setDepartment('');
    setReviewNotes('');
  };

  const handleApprove = async () => {
    if (!selectedId || approvePassword.length < 8) {
      toastService.error('Set a password (min 8 characters) for the new staff account');
      return;
    }
    try {
      await approve({
        id: selectedId,
        password: approvePassword,
        employeeCode: employeeCode || undefined,
        department: department || undefined,
        reviewNotes: reviewNotes || undefined,
      }).unwrap();
      toastService.success('Application approved — staff account created');
      setSelectedId(null);
      refetch();
      refetchSummary();
    } catch (e) {
      toastService.error(e?.data?.message || 'Approval failed');
    }
  };

  const handleReject = async () => {
    if (!selectedId) return;
    try {
      await reject({ id: selectedId, reviewNotes: reviewNotes || undefined }).unwrap();
      toastService.success('Application rejected');
      setSelectedId(null);
      refetch();
      refetchSummary();
    } catch (e) {
      toastService.error(e?.data?.message || 'Reject failed');
    }
  };

  if (isLoading) return <ContentLoader variant="module" />;

  return (
    <ModulePageLayout
      className="role-apps-page"
      title="Role Applications"
      subtitle="Review staff apply requests — counsellor, teacher, reception & other roles. Students use enquiry flow."
      icon={FiUserPlus}
      actions={(
        <Button variant="outline" size="sm" icon={FiRefreshCw} loading={isFetching} onClick={() => { refetch(); refetchSummary(); }}>
          Refresh
        </Button>
      )}
    >
      <SummaryStatBar items={stats} />

      <div className="role-apps-filters">
        <Select
          label="Status"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          options={[
            { value: '', label: 'All' },
            { value: 'PENDING', label: 'Pending' },
            { value: 'APPROVED', label: 'Approved' },
            { value: 'REJECTED', label: 'Rejected' },
          ]}
        />
        <Input
          label="Search"
          placeholder="Name, email, code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="role-apps-table-wrap">
        <table className="role-apps-table">
          <thead>
            <tr>
              <th>Applicant</th>
              <th>Role</th>
              <th>Branch</th>
              <th>Status</th>
              <th>Applied</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>
                  No applications found
                </td>
              </tr>
            ) : rows.map((row) => (
              <tr key={row.id} onClick={() => openDetail(row)} style={{ cursor: 'pointer' }}>
                <td>
                  <div className="role-apps-table__name">{row.fullName || `${row.firstName} ${row.lastName}`}</div>
                  <div className="role-apps-table__sub">{row.email}</div>
                  <div className="role-apps-table__sub">{row.applicationCode}</div>
                </td>
                <td>{row.roleLabel || row.roleSlug}</td>
                <td>{row.branch?.name || '—'}</td>
                <td>
                  <Badge tone={APPLY_STATUS_TONES[row.status] || 'neutral'}>
                    {APPLY_STATUS_LABELS[row.status] || row.status}
                  </Badge>
                </td>
                <td>{fmtDate(row.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Drawer
        open={Boolean(selectedId)}
        onClose={() => setSelectedId(null)}
        title="Application detail"
        size="md"
      >
        {detail && (
          <div className="role-apps-detail">
            <div className="role-apps-detail__grid">
              <div className="role-apps-detail__item">
                <label>Name</label>
                <span>{detail.fullName}</span>
              </div>
              <div className="role-apps-detail__item">
                <label>Role</label>
                <span>{detail.roleLabel}</span>
              </div>
              <div className="role-apps-detail__item">
                <label>Email</label>
                <span>{detail.email}</span>
              </div>
              <div className="role-apps-detail__item">
                <label>Phone</label>
                <span>{detail.phone || '—'}</span>
              </div>
              <div className="role-apps-detail__item">
                <label>Branch</label>
                <span>{detail.branch?.name}</span>
              </div>
              <div className="role-apps-detail__item">
                <label>Code</label>
                <span>{detail.applicationCode}</span>
              </div>
              <div className="role-apps-detail__item">
                <label>Qualification</label>
                <span>{detail.qualification || '—'}</span>
              </div>
              <div className="role-apps-detail__item">
                <label>Status</label>
                <Badge tone={APPLY_STATUS_TONES[detail.status]}>{APPLY_STATUS_LABELS[detail.status]}</Badge>
              </div>
            </div>
            {detail.experience && (
              <div className="role-apps-detail__item">
                <label>Experience</label>
                <p>{detail.experience}</p>
              </div>
            )}
            {detail.message && (
              <div className="role-apps-detail__item">
                <label>Message</label>
                <p>{detail.message}</p>
              </div>
            )}

            {detail.status === 'PENDING' && (
              <>
                <PermissionGate permissions={[PERMISSIONS.ROLE_APPLICATION_APPROVE]}>
                  <Input
                    label="Account password (for approved user)"
                    type="password"
                    value={approvePassword}
                    onChange={(e) => setApprovePassword(e.target.value)}
                    autoComplete="new-password"
                  />
                  <div className="role-apps-detail__grid">
                    <Input label="Employee code" value={employeeCode} onChange={(e) => setEmployeeCode(e.target.value)} />
                    <Input label="Department" value={department} onChange={(e) => setDepartment(e.target.value)} />
                  </div>
                </PermissionGate>
                <Input
                  label="Review notes"
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                />
                <div className="role-apps-detail__actions">
                  <PermissionGate permissions={[PERMISSIONS.ROLE_APPLICATION_APPROVE]}>
                    <Button icon={FiCheck} loading={approving} onClick={handleApprove}>
                      Approve & create account
                    </Button>
                  </PermissionGate>
                  <PermissionGate permissions={[PERMISSIONS.ROLE_APPLICATION_REVIEW]}>
                    <Button variant="outline-danger" icon={FiX} loading={rejecting} onClick={handleReject}>
                      Reject
                    </Button>
                  </PermissionGate>
                </div>
              </>
            )}
          </div>
        )}
      </Drawer>
    </ModulePageLayout>
  );
}
