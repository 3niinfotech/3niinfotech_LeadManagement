import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { studentService } from '../../../modules/student/services/student.service';
import { useStudentStatusOptions } from '../hooks/useStudentStatusOptions';
import { useCounsellorOptions } from '../../enquiry/hooks/useCounsellorOptions';
import toastService from '../../../services/toast/toast.service';

export default function StudentBulkActionModal({
  action, // 'assign' | 'status'
  open,
  onClose,
  selectedIds = [],
  onSuccess,
}) {
  const { statusOptions } = useStudentStatusOptions();
  const { options: staffOptions } = useCounsellorOptions({ enabled: Boolean(open) });

  const [counsellorId, setCounsellorId] = useState('');
  const [status, setStatus] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setCounsellorId('');
      setStatus(statusOptions[0]?.value || '');
    }
  }, [open, statusOptions]);

  if (!open || !action) return null;

  const count = selectedIds.length;
  const isAssign = action === 'assign';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!count) {
      toastService.error('No students selected');
      return;
    }

    setSubmitting(true);
    try {
      if (isAssign) {
        if (!counsellorId) {
          toastService.error('Please choose a counsellor');
          setSubmitting(false);
          return;
        }
        await studentService.bulkAssign(selectedIds, counsellorId);
        toastService.success(`Assigned ${count} students to counsellor`);
      } else {
        if (!status) {
          toastService.error('Please choose a status');
          setSubmitting(false);
          return;
        }
        await studentService.bulkUpdateStatus(selectedIds, status);
        toastService.success(`Updated status for ${count} students`);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toastService.error(err?.response?.data?.message || 'Bulk operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isAssign ? `Assign Counsellor (${count})` : `Update Status (${count})`}
      subtitle={
        isAssign
          ? `Assign ${count} selected students to an educational counsellor.`
          : `Change status for ${count} selected students.`
      }
      size="sm"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="student-bulk-action-form"
            loading={submitting}
          >
            {isAssign ? 'Assign Counsellor' : 'Update Status'}
          </Button>
        </>
      }
    >
      <form id="student-bulk-action-form" onSubmit={handleSubmit} className="space-y-4">
        {isAssign ? (
          <div>
            <Select
              label="Select Counsellor"
              value={counsellorId}
              onChange={(e) => setCounsellorId(e.target.value)}
              required
            >
              <option value="">Choose counsellor...</option>
              {(staffOptions || []).map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div>
            <Select
              label="Select New Status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              required
            >
              {statusOptions.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </Select>
          </div>
        )}
      </form>
    </Modal>
  );
}
