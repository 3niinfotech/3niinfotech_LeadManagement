import { useMemo, useState } from 'react';
import { FiPlus, FiTrash2, FiUserCheck } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Modal from '../../../components/ui/Modal';
import PermissionGate from '../../../components/common/PermissionGate';
import { PERMISSIONS } from '../../../config/permissions';
import toastService from '../../../services/toast/toast.service';
import { useCounsellorOptions } from '../../enquiry/hooks/useCounsellorOptions';
import {
  useGetCourseCounsellorMappingsQuery,
  useCreateCourseCounsellorMappingMutation,
  useUpdateCourseCounsellorMappingMutation,
  useDeleteCourseCounsellorMappingMutation,
} from '../redux/assignmentApiSlice';
import '../styles/assignment.theme.css';

const EMPTY_FORM = {
  courseLabel: '',
  counsellorId: '',
  branchId: '',
};

function formatCounsellor(row) {
  const c = row?.counsellor;
  if (!c) return '—';
  return `${c.firstName || ''} ${c.lastName || ''}`.trim() || c.email;
}

export default function CourseCounsellorMappingPage() {
  const { data: mappings = [], isLoading, refetch } = useGetCourseCounsellorMappingsQuery({});
  const { options: counsellorOptions, loading: counsellorsLoading } = useCounsellorOptions({});
  const [createMapping, { isLoading: creating }] = useCreateCourseCounsellorMappingMutation();
  const [updateMapping, { isLoading: updating }] = useUpdateCourseCounsellorMappingMutation();
  const [deleteMapping] = useDeleteCourseCounsellorMappingMutation();

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return mappings;
    return mappings.filter((m) =>
      m.courseLabel?.toLowerCase().includes(q)
      || formatCounsellor(m).toLowerCase().includes(q));
  }, [mappings, search]);

  const openCreate = () => {
    setEditing(null);
    setForm(EMPTY_FORM);
    setModalOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({
      courseLabel: row.courseLabel || '',
      counsellorId: row.counsellorId || '',
      branchId: row.branchId || '',
    });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.courseLabel.trim() || !form.counsellorId) {
      toastService.error('Course and counsellor are required');
      return;
    }
    const body = {
      courseLabel: form.courseLabel.trim(),
      counsellorId: form.counsellorId,
      ...(form.branchId ? { branchId: form.branchId } : { branchId: null }),
    };
    try {
      if (editing) {
        await updateMapping({ id: editing.id, ...body }).unwrap();
        toastService.action.saved('Mapping updated');
      } else {
        await createMapping(body).unwrap();
        toastService.action.saved('Mapping created');
      }
      setModalOpen(false);
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to save mapping');
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm(`Remove mapping for ${row.courseLabel}?`)) return;
    try {
      await deleteMapping(row.id).unwrap();
      toastService.action.deleted('Mapping removed');
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to remove mapping');
    }
  };

  return (
    <ModulePageCard
      title="Course → Counsellor Mapping"
      subtitle="Default counsellor per course/service for automatic enquiry assignment"
      icon={FiUserCheck}
      actions={(
        <PermissionGate permission={PERMISSIONS.MASTERS_MANAGE}>
          <Button icon={FiPlus} onClick={openCreate}>Add Mapping</Button>
        </PermissionGate>
      )}
    >
      <div className="crm-assignment-toolbar mb-4 flex flex-wrap gap-3 items-end">
        <Input
          label="Search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Course or counsellor"
          className="max-w-xs"
        />
        <Button variant="outline" onClick={() => refetch()}>Refresh</Button>
      </div>

      <div className="overflow-x-auto border border-gray-200 rounded-lg">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-50 text-left text-gray-600">
            <tr>
              <th className="px-4 py-2 font-medium">Course / Service</th>
              <th className="px-4 py-2 font-medium">Assigned Counsellor</th>
              <th className="px-4 py-2 font-medium">Scope</th>
              <th className="px-4 py-2 font-medium w-28">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">Loading…</td></tr>
            )}
            {!isLoading && !filtered.length && (
              <tr><td colSpan={4} className="px-4 py-6 text-center text-gray-500">No mappings yet</td></tr>
            )}
            {filtered.map((row) => (
              <tr key={row.id} className="border-t border-gray-100">
                <td className="px-4 py-2 font-medium">{row.courseLabel}</td>
                <td className="px-4 py-2">{formatCounsellor(row)}</td>
                <td className="px-4 py-2 text-gray-600">
                  {row.branch?.name ? row.branch.name : 'Company-wide'}
                </td>
                <td className="px-4 py-2">
                  <PermissionGate permission={PERMISSIONS.MASTERS_MANAGE}>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" onClick={() => openEdit(row)}>Edit</Button>
                      <Button size="sm" variant="ghost" icon={FiTrash2} onClick={() => handleDelete(row)} />
                    </div>
                  </PermissionGate>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editing ? 'Edit Mapping' : 'Add Mapping'}>
        <div className="space-y-3">
          <Input
            label="Course / Service"
            value={form.courseLabel}
            onChange={(e) => setForm((f) => ({ ...f, courseLabel: e.target.value }))}
            placeholder="e.g. IELTS, PTE, Study Visa"
            required
          />
          <Select
            label="Assigned Counsellor"
            value={form.counsellorId}
            onChange={(e) => setForm((f) => ({ ...f, counsellorId: e.target.value }))}
            options={counsellorOptions}
            placeholder="Select counsellor"
            loading={counsellorsLoading}
          />
          <p className="text-xs text-gray-500 m-0">
            Leave branch empty for company-wide default. Branch-specific mappings override company-wide.
          </p>
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={() => setModalOpen(false)}>Cancel</Button>
          <Button onClick={handleSave} loading={creating || updating}>Save</Button>
        </div>
      </Modal>
    </ModulePageCard>
  );
}
