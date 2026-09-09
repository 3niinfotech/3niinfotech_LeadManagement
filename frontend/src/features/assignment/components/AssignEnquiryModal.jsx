import { useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import toastService from '../../../services/toast/toast.service';
import {
  useLazyRecommendForEnquiryQuery,
  useManualAssignEnquiryMutation,
} from '../redux/assignmentApiSlice';
import CounsellorRecommendPanel from '../../walkin/components/reception/CounsellorRecommendPanel';

export default function AssignEnquiryModal({ open, enquiry, onClose, onSuccess }) {
  const [counsellorId, setCounsellorId] = useState('');
  const [reason, setReason] = useState('');
  const [fetchRecommend, { data: recommendations = [], isFetching, error }] = useLazyRecommendForEnquiryQuery();
  const [manualAssign, { isLoading }] = useManualAssignEnquiryMutation();

  useEffect(() => {
    if (!open || !enquiry?.id) return;
    setCounsellorId('');
    setReason('');
    fetchRecommend(enquiry.id);
  }, [open, enquiry?.id, fetchRecommend]);

  const submit = async () => {
    if (!counsellorId) return toastService.info('Select a counsellor');
    if (!reason.trim()) return toastService.info('Reason is required');
    try {
      await manualAssign({ enquiryId: enquiry.id, counsellorId, reason: reason.trim() }).unwrap();
      toastService.success('Enquiry assigned');
      onSuccess?.();
    } catch (e) {
      toastService.error(e?.data?.message || 'Assignment failed');
    }
  };

  const top = recommendations.find((r) => r.recommended) || recommendations.find((r) => r.routable);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Assign Enquiry"
      subtitle={enquiry ? `${enquiry.enquiryCode} · ${enquiry.interestedCountry || '—'}` : ''}
      size="lg"
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={isLoading}>Assign</Button>
        </>
      )}
    >
      <div className="space-y-4">
        <CounsellorRecommendPanel
          recommendations={recommendations}
          loading={isFetching}
          selectedId={counsellorId}
          onSelect={setCounsellorId}
          error={error?.data?.message}
          onRefresh={() => enquiry?.id && fetchRecommend(enquiry.id)}
          showScores
        />

        {top && !counsellorId && (
          <p className="text-xs text-text-secondary">
            Recommended: {top.firstName} {top.lastName} — {top.score}% match
          </p>
        )}

        <Select
          label="Assign to"
          value={counsellorId}
          onChange={(e) => setCounsellorId(e.target.value)}
          options={recommendations.map((r) => ({
            value: r.id,
            label: `${r.firstName || ''} ${r.lastName || ''}`.trim() + (r.score ? ` (${r.score}%)` : ''),
          }))}
          placeholder="Select counsellor"
        />

        <Textarea
          label="Reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder="Why this counsellor?"
          rows={2}
        />
      </div>
    </Modal>
  );
}
