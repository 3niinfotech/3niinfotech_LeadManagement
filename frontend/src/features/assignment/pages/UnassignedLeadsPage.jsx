import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiInbox, FiRefreshCw, FiUserCheck, FiZap } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import PermissionGate from '../../../components/common/PermissionGate';
import { PERMISSIONS } from '../../../config/permissions';
import { ROUTES } from '../../../config/routes';
import toastService from '../../../services/toast/toast.service';
import {
  useGetUnassignedEnquiriesQuery,
  useAutoAssignEnquiryMutation,
  useBulkAutoAssignEnquiriesMutation,
} from '../redux/assignmentApiSlice';
import AssignEnquiryModal from '../components/AssignEnquiryModal';
import '../styles/assignment.theme.css';

const PRIORITY_OPTIONS = [
  { value: '', label: 'All priorities' },
  { value: 'HIGH', label: 'High' },
  { value: 'MEDIUM', label: 'Medium' },
  { value: 'LOW', label: 'Low' },
];

function formatName(row) {
  return `${row.firstName || ''} ${row.lastName || ''}`.trim() || row.enquiryCode || 'Enquiry';
}

export default function UnassignedLeadsPage() {
  const navigate = useNavigate();
  const [page, setPage] = useState(1);
  const [priority, setPriority] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [assignTarget, setAssignTarget] = useState(null);

  const queryParams = useMemo(() => ({
    page,
    limit: 25,
    ...(priority ? { priority } : {}),
  }), [page, priority]);

  const { data, isLoading, isFetching, refetch } = useGetUnassignedEnquiriesQuery(queryParams);
  const [autoAssign] = useAutoAssignEnquiryMutation();
  const [bulkAutoAssign, { isLoading: bulkLoading }] = useBulkAutoAssignEnquiriesMutation();

  const items = data?.items || [];
  const total = data?.total || 0;

  const summary = useMemo(() => {
    const high = items.filter((i) => ['HIGH', 'HOT', 'VIP'].includes(i.priority)).length;
    const medium = items.filter((i) => i.priority === 'MEDIUM').length;
    const low = items.filter((i) => ['LOW', 'NORMAL'].includes(i.priority)).length;
    return { high, medium, low, total };
  }, [items, total]);

  const toggleSelect = (id) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const toggleAll = () => {
    if (selectedIds.length === items.length) setSelectedIds([]);
    else setSelectedIds(items.map((i) => i.id));
  };

  const handleAutoAssign = async (enquiryId) => {
    try {
      const result = await autoAssign(enquiryId).unwrap();
      const name = result?.match
        ? `${result.match.firstName || ''} ${result.match.lastName || ''}`.trim()
        : 'counsellor';
      toastService.success(`Assigned to ${name} (${result?.match?.score || 0}% match)`);
    } catch (e) {
      toastService.error(e?.data?.message || 'No eligible counsellor available');
    }
  };

  const handleBulkAutoAssign = async () => {
    if (!selectedIds.length) return toastService.info('Select enquiries first');
    try {
      const result = await bulkAutoAssign(selectedIds).unwrap();
      toastService.success(`Auto-assigned ${result.assigned} of ${result.total} enquiries`);
      setSelectedIds([]);
    } catch (e) {
      toastService.error(e?.data?.message || 'Bulk auto-assign failed');
    }
  };

  return (
    <ModulePageCard
      title="Unassigned Leads"
      subtitle="Enquiries waiting for counsellor assignment"
      icon={FiInbox}
      actions={(
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} loading={isFetching}>
            <FiRefreshCw size={14} /> Refresh
          </Button>
          <PermissionGate permission={PERMISSIONS.ENQUIRIES_ASSIGN}>
            <Button size="sm" onClick={handleBulkAutoAssign} loading={bulkLoading} disabled={!selectedIds.length}>
              <FiZap size={14} /> Auto Assign Selected
            </Button>
          </PermissionGate>
        </div>
      )}
    >
      <div className="crm-assignment-hub">
        <div className="crm-assignment-hub__summary">
          <div className="crm-assignment-stat"><span>Total</span><strong>{total}</strong></div>
          <div className="crm-assignment-stat is-high"><span>High priority</span><strong>{summary.high}</strong></div>
          <div className="crm-assignment-stat"><span>Medium</span><strong>{summary.medium}</strong></div>
          <div className="crm-assignment-stat"><span>Low</span><strong>{summary.low}</strong></div>
        </div>

        <div className="crm-assignment-hub__filters">
          <Select
            label="Priority"
            value={priority}
            onChange={(e) => { setPriority(e.target.value); setPage(1); }}
            options={PRIORITY_OPTIONS}
          />
        </div>

        <div className="crm-assignment-table-wrap">
          <table className="crm-assignment-table">
            <thead>
              <tr>
                <th>
                  <input
                    type="checkbox"
                    checked={items.length > 0 && selectedIds.length === items.length}
                    onChange={toggleAll}
                    aria-label="Select all"
                  />
                </th>
                <th>Enquiry</th>
                <th>Branch</th>
                <th>Country</th>
                <th>Course</th>
                <th>Priority</th>
                <th>Suggested</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr><td colSpan={9} className="text-center py-6 text-sm text-text-secondary">Loading…</td></tr>
              )}
              {!isLoading && !items.length && (
                <tr><td colSpan={9} className="text-center py-6 text-sm text-text-secondary">No unassigned enquiries</td></tr>
              )}
              {items.map((row) => {
                const suggested = row.suggestedCounsellor;
                const suggestedName = suggested
                  ? `${suggested.firstName || ''} ${suggested.lastName || ''}`.trim()
                  : '—';
                return (
                  <tr key={row.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(row.id)}
                        onChange={() => toggleSelect(row.id)}
                        aria-label={`Select ${row.enquiryCode}`}
                      />
                    </td>
                    <td>
                      <button type="button" className="crm-assignment-link" onClick={() => navigate(ROUTES.ENQUIRY_DETAIL(row.id))}>
                        <strong>{row.enquiryCode}</strong>
                        <span>{formatName(row)}</span>
                      </button>
                    </td>
                    <td>{row.branch?.name || '—'}</td>
                    <td>{row.interestedCountry || '—'}</td>
                    <td>{row.interestedCourse || '—'}</td>
                    <td><span className={`crm-assignment-priority is-${(row.priority || 'medium').toLowerCase()}`}>{row.priority || 'MEDIUM'}</span></td>
                    <td>
                      {suggested ? (
                        <span className="crm-assignment-suggest">
                          {suggestedName}
                          <small>{suggested.score}%</small>
                        </span>
                      ) : '—'}
                    </td>
                    <td>{row.createdAt ? new Date(row.createdAt).toLocaleDateString() : '—'}</td>
                    <td>
                      <div className="crm-assignment-actions">
                        <PermissionGate permission={PERMISSIONS.ENQUIRIES_ASSIGN}>
                          <Button size="xs" variant="outline" onClick={() => setAssignTarget(row)}>
                            <FiUserCheck size={12} /> Assign
                          </Button>
                          <Button size="xs" onClick={() => handleAutoAssign(row.id)}>
                            <FiZap size={12} /> Auto
                          </Button>
                        </PermissionGate>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {total > 25 && (
          <div className="crm-assignment-pagination">
            <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</Button>
            <span>Page {page}</span>
            <Button variant="outline" size="sm" disabled={page * 25 >= total} onClick={() => setPage((p) => p + 1)}>Next</Button>
          </div>
        )}
      </div>

      <AssignEnquiryModal
        open={Boolean(assignTarget)}
        enquiry={assignTarget}
        onClose={() => setAssignTarget(null)}
        onSuccess={() => { setAssignTarget(null); refetch(); }}
      />
    </ModulePageCard>
  );
}
