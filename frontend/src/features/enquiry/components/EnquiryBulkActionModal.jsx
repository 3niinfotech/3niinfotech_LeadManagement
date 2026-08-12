import { useEffect, useMemo, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import Textarea from '../../../components/ui/Textarea';
import Input from '../../../components/ui/Input';
import {
  ENQUIRY_STATUSES,
} from '../../../config/constants';
import { useEnquiryTagOptions } from '../hooks/useEnquiryTagOptions';
import { useCounsellorOptions } from '../hooks/useCounsellorOptions';
import { useBranchOptions } from '../hooks/useBranchOptions';
import {
  useBulkAssignEnquiriesMutation,
  useBulkUpdateStatusMutation,
  useBulkAddTagsMutation,
  useBulkMoveBranchMutation,
  useBulkMergeEnquiriesMutation,
  useBulkCommunicationMutation,
} from '../redux/enquiryApiSlice';
import toastService from '../../../services/toast/toast.service';

const STATUS_OPTIONS = ENQUIRY_STATUSES.map(({ value, label }) => ({ value, label }));

const TITLES = {
  assign: 'Assign Enquiries',
  status: 'Change Status',
  tags: 'Add Tags',
  email: 'Send Email',
  sms: 'Send SMS',
  whatsapp: 'Send WhatsApp',
  merge: 'Merge Enquiries',
  branch: 'Move Branch',
};

export default function EnquiryBulkActionModal({
  action,
  open,
  onClose,
  selectedIds = [],
  selectedRows = [],
  onSuccess,
}) {
  const assignBranchId = useMemo(() => {
    const ids = [...new Set((selectedRows || []).map((r) => r.branchId).filter(Boolean))];
    return ids.length === 1 ? ids[0] : undefined;
  }, [selectedRows]);

  const { options: counsellorOptions, loading: counsellorsLoading } = useCounsellorOptions({
    branchId: assignBranchId,
  });
  const { options: branchOptions, loading: branchesLoading } = useBranchOptions();
  const { options: tagOptions } = useEnquiryTagOptions();

  const [assigneeId, setAssigneeId] = useState('');
  const [status, setStatus] = useState('CONTACTED');
  const [tags, setTags] = useState([]);
  const [branchId, setBranchId] = useState('');
  const [primaryId, setPrimaryId] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');

  const [bulkAssign, { isLoading: assigning }] = useBulkAssignEnquiriesMutation();
  const [bulkStatus, { isLoading: statusLoading }] = useBulkUpdateStatusMutation();
  const [bulkTags, { isLoading: tagsLoading }] = useBulkAddTagsMutation();
  const [bulkBranch, { isLoading: branchLoading }] = useBulkMoveBranchMutation();
  const [bulkMerge, { isLoading: mergeLoading }] = useBulkMergeEnquiriesMutation();
  const [bulkComm, { isLoading: commLoading }] = useBulkCommunicationMutation();

  const mergeOptions = useMemo(
    () => selectedRows.map((row) => ({
      value: row.id,
      label: `${row.enquiryCode || row.id} · ${row.firstName || ''} ${row.lastName || ''}`.trim(),
    })),
    [selectedRows],
  );

  useEffect(() => {
    if (!open) return;
    setAssigneeId('');
    setStatus('CONTACTED');
    setTags([]);
    setBranchId('');
    setPrimaryId(selectedIds[0] || '');
    setSubject('');
    setBody('');
  }, [open, selectedIds]);

  const loading = assigning || statusLoading || tagsLoading || branchLoading || mergeLoading || commLoading;
  const count = selectedIds.length;

  const submit = async () => {
    try {
      if (action === 'assign') {
        if (!assigneeId) return toastService.info('Select a counsellor');
        await bulkAssign({ ids: selectedIds, assignedToId: assigneeId }).unwrap();
        toastService.success(`Assigned ${count} enquiries`);
      }

      if (action === 'status') {
        await bulkStatus({ ids: selectedIds, status }).unwrap();
        toastService.success(`Updated status for ${count} enquiries`);
      }

      if (action === 'tags') {
        if (!tags.length) return toastService.info('Select at least one tag');
        await bulkTags({ ids: selectedIds, tags, mode: 'add' }).unwrap();
        toastService.success(`Tags added to ${count} enquiries`);
      }

      if (action === 'branch') {
        if (!branchId) return toastService.info('Select a branch');
        await bulkBranch({ ids: selectedIds, branchId }).unwrap();
        toastService.success(`Moved ${count} enquiries`);
      }

      if (action === 'merge') {
        if (!primaryId) return toastService.info('Select primary enquiry');
        await bulkMerge({ primaryId, ids: selectedIds }).unwrap();
        toastService.success('Enquiries merged');
      }

      if (['email', 'sms', 'whatsapp'].includes(action)) {
        if (!body.trim()) return toastService.info('Message is required');
        const channel = action.toUpperCase();
        await bulkComm({
          ids: selectedIds,
          channel,
          subject: action === 'email' ? subject : undefined,
          body: body.trim(),
        }).unwrap();
        toastService.success(`${channel} queued for ${count} enquiries`);
      }

      onSuccess?.();
      onClose?.();
    } catch (e) {
      toastService.error(e?.data?.message || 'Bulk action failed');
    }
  };

  if (!action) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={TITLES[action] || 'Bulk Action'}
      subtitle={`${count} enquiry${count === 1 ? '' : 'ies'} selected`}
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={submit} loading={loading}>Apply</Button>
        </>
      )}
    >
      <div className="space-y-4">
        {action === 'assign' && (
          <Select
            label="Assign to"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
            options={counsellorOptions}
            placeholder="Select counsellor"
            loading={counsellorsLoading}
          />
        )}

        {action === 'status' && (
          <Select
            label="New status"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            options={STATUS_OPTIONS}
          />
        )}

        {action === 'tags' && (
          <Select
            label="Tags to add"
            mode="multiple"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            options={tagOptions}
            placeholder="Select tags"
          />
        )}

        {action === 'branch' && (
          <Select
            label="Move to branch"
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            options={branchOptions}
            placeholder="Select branch"
            loading={branchesLoading}
          />
        )}

        {action === 'merge' && (
          <>
            <p className="text-sm text-text-secondary">
              Pick the primary record to keep. Other selected enquiries will be merged into it and marked as duplicate.
            </p>
            <Select
              label="Primary enquiry"
              value={primaryId}
              onChange={(e) => setPrimaryId(e.target.value)}
              options={mergeOptions}
            />
          </>
        )}

        {action === 'email' && (
          <Input
            label="Subject"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Email subject"
          />
        )}

        {['email', 'sms', 'whatsapp'].includes(action) && (
          <Textarea
            label="Message"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder={`Write your ${action} message...`}
            rows={4}
          />
        )}
      </div>
    </Modal>
  );
}
