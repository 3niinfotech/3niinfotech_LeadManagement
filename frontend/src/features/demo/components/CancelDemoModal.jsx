import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import { useCancelDemoMutation } from '../../enquiry/redux/enquiryApiSlice';
import toastService from '../../../services/toast/toast.service';

const CANCEL_REASONS = [
  'Student requested cancellation',
  'Student not reachable / Invalid phone',
  'Student not interested anymore',
  'Faculty unavailable',
  'Directly enrolled without trial',
  'Joined another institute',
  'Duplicate booking',
  'Other reason',
];

export default function CancelDemoModal({
  open,
  onClose,
  demo,
  onSuccess,
}) {
  const [cancelDemo, { isLoading: submitting }] = useCancelDemoMutation();
  const [reason, setReason] = useState(CANCEL_REASONS[0]);
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (open) {
      setReason(CANCEL_REASONS[0]);
      setRemark('');
    }
  }, [open]);

  if (!demo) return null;

  const enquiry = demo.enquiry || {};
  const enquiryId = enquiry.id || demo.enquiryId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!enquiryId) {
      toastService.error('Missing enquiry reference for this demo');
      return;
    }

    try {
      await cancelDemo({
        id: enquiryId,
        demoId: demo.id,
        reason: reason || 'Demo session cancelled',
        remark: remark.trim() || undefined,
      }).unwrap();

      toastService.success('Demo session cancelled');
      onSuccess?.();
      onClose();
    } catch (err) {
      toastService.error(err?.data?.message || 'Failed to cancel demo');
    }
  };

  const studentName = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim() || 'Student';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Cancel Demo Session"
      subtitle={`Cancel scheduled demo for ${studentName}`}
      size="sm"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Keep Session
          </Button>
          <Button
            variant="danger"
            type="submit"
            form="cancel-demo-form"
            loading={submitting}
          >
            Cancel Demo
          </Button>
        </>
      }
    >
      <form id="cancel-demo-form" onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Select
            label="Cancellation Reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            required
          >
            {CANCEL_REASONS.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </Select>
        </div>

        <div>
          <Textarea
            label="Additional Notes"
            placeholder="Provide any specific details about the cancellation..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={2}
          />
        </div>
      </form>
    </Modal>
  );
}
