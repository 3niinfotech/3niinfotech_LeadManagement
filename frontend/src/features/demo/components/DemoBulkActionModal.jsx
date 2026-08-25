import { useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import {
  DEMO_ATTENDANCE_OPTIONS,
  DEMO_RESULT_OPTIONS,
} from '../config/demoConstants';
import {
  useBulkMarkDemoAttendanceMutation,
  useBulkCancelDemosMutation,
} from '../../enquiry/redux/enquiryApiSlice';
import toastService from '../../../services/toast/toast.service';

export default function DemoBulkActionModal({
  action, // 'attendance' | 'cancel'
  open,
  onClose,
  selectedIds = [],
  onSuccess,
}) {
  const [bulkMarkAttendance, { isLoading: attendanceLoading }] = useBulkMarkDemoAttendanceMutation();
  const [bulkCancel, { isLoading: cancelLoading }] = useBulkCancelDemosMutation();

  const [attendance, setAttendance] = useState('ATTENDED');
  const [result, setResult] = useState('POSITIVE');
  const [reason, setReason] = useState('Bulk cancelled by administrator');
  const [remark, setRemark] = useState('');

  if (!open || !action) return null;

  const count = selectedIds.length;
  const isAttendance = action === 'attendance';
  const submitting = attendanceLoading || cancelLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!count) {
      toastService.error('No demo sessions selected');
      return;
    }

    try {
      if (isAttendance) {
        await bulkMarkAttendance({
          ids: selectedIds,
          attendance,
          result,
          remark: remark.trim() || undefined,
        }).unwrap();
        toastService.success(`Attendance updated for ${count} demo sessions`);
      } else {
        await bulkCancel({
          ids: selectedIds,
          reason: reason.trim() || 'Bulk cancelled',
        }).unwrap();
        toastService.success(`${count} demo sessions cancelled`);
      }

      onSuccess?.();
      onClose();
    } catch (err) {
      toastService.error(err?.data?.message || 'Bulk operation failed');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isAttendance ? `Bulk Mark Attendance (${count})` : `Bulk Cancel Demos (${count})`}
      subtitle={
        isAttendance
          ? `Apply attendance and outcome across ${count} selected demo sessions.`
          : `Cancel ${count} selected demo sessions.`
      }
      size="sm"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant={isAttendance ? 'primary' : 'danger'}
            type="submit"
            form="demo-bulk-action-form"
            loading={submitting}
          >
            {isAttendance ? 'Apply Attendance' : 'Cancel Demos'}
          </Button>
        </>
      }
    >
      <form id="demo-bulk-action-form" onSubmit={handleSubmit} className="space-y-4">
        {isAttendance ? (
          <>
            <div>
              <Select
                label="Attendance Status"
                value={attendance}
                onChange={(e) => setAttendance(e.target.value)}
                required
              >
                {DEMO_ATTENDANCE_OPTIONS.filter((a) => a.value !== 'NOT_MARKED').map((a) => (
                  <option key={a.value} value={a.value}>
                    {a.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Select
                label="Outcome / Result"
                value={result}
                onChange={(e) => setResult(e.target.value)}
                required
              >
                {DEMO_RESULT_OPTIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </Select>
            </div>

            <div>
              <Textarea
                label="Remarks (Optional)"
                placeholder="Add shared note for all selected sessions..."
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                rows={2}
              />
            </div>
          </>
        ) : (
          <div>
            <Textarea
              label="Cancellation Reason"
              placeholder="e.g. Center closed due to severe weather / holiday..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              required
            />
          </div>
        )}
      </form>
    </Modal>
  );
}
