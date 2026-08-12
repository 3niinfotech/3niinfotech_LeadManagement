import { useState } from 'react';
import DatePicker from '../../../../components/ui/DatePicker';
import Textarea from '../../../../components/ui/Textarea';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/ui/FormSection';
import { COUNSELLOR_DECISIONS } from '../../config/counsellorDecision.config';
import { useApplyCounsellorDecisionMutation } from '../../redux/walkinApiSlice';
import { useCompleteSessionMutation } from '../../../assignment/redux/assignmentApiSlice';
import toastService from '../../../../services/toast/toast.service';

const TONE_CLASS = {
  success: 'crm-counsellor-decision--success',
  warning: 'crm-counsellor-decision--warning',
  info: 'crm-counsellor-decision--info',
  brand: 'crm-counsellor-decision--brand',
  danger: 'crm-counsellor-decision--danger',
  secondary: 'crm-counsellor-decision--secondary',
};

export default function CounsellorDecisionPanel({
  leadId,
  lead,
  onDecisionComplete,
  disabled = false,
}) {
  const [selected, setSelected] = useState(null);
  const [reason, setReason] = useState('');
  const [followUpDate, setFollowUpDate] = useState('');
  const [applyDecision, { isLoading }] = useApplyCounsellorDecisionMutation();
  const [completeSession] = useCompleteSessionMutation();

  const config = COUNSELLOR_DECISIONS.find((d) => d.id === selected);
  const hasEnquiry = Boolean(lead?.enquiry?.id);
  const canDecide = lead?.status === 'IN_COUNSELLING' && !hasEnquiry && !disabled;

  const submit = async () => {
    if (!selected || !leadId) return;
    if (config?.needsReason && !reason.trim()) {
      toastService.info('Please enter a reason');
      return;
    }
    try {
      const result = await applyDecision({
        id: leadId,
        decision: selected,
        reason: reason.trim() || undefined,
        followUpDate: followUpDate || undefined,
        remarks: reason.trim() || undefined,
      }).unwrap();
      try {
        await completeSession({ leadId, outcome: selected }).unwrap();
      } catch { /* session may already be closed */ }
      toastService.success(
        selected === 'INTERESTED'
          ? 'Qualified enquiry created'
          : 'Decision recorded',
      );
      setSelected(null);
      setReason('');
      setFollowUpDate('');
      onDecisionComplete?.(result?.data ?? result);
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not record decision');
    }
  };

  if (hasEnquiry) {
    return (
      <div className="crm-counsellor-decision-banner crm-counsellor-decision-banner--linked">
        <p className="text-sm font-semibold text-text">Qualified enquiry created</p>
        <p className="text-xs text-text-secondary mt-0.5">
          {lead.enquiry.enquiryCode} — open Enquiry Workspace for detailed counselling.
        </p>
      </div>
    );
  }

  if (!canDecide) {
    return (
      <div className="crm-counsellor-decision-banner">
        <p className="text-sm text-text-secondary">
          {lead?.status === 'WAITING'
            ? 'Start counselling to record a decision for this visitor.'
            : 'Counsellor decisions are available during active counselling.'}
        </p>
      </div>
    );
  }

  return (
    <FormSection
      title="Counsellor Decision"
      description="Enquiry is created only when the visitor is interested. Other paths keep the same master record without an enquiry."
    >
      <div className="crm-counsellor-decision-grid">
        {COUNSELLOR_DECISIONS.map((item) => {
          const Icon = item.icon;
          const active = selected === item.id;
          return (
            <button
              key={item.id}
              type="button"
              disabled={isLoading}
              onClick={() => setSelected(item.id)}
              className={`crm-counsellor-decision ${TONE_CLASS[item.tone] || ''} ${active ? 'crm-counsellor-decision--active' : ''}`}
            >
              <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span className="crm-counsellor-decision__label">{item.label}</span>
              <span className="crm-counsellor-decision__desc">{item.description}</span>
            </button>
          );
        })}
      </div>

      {config && (
        <div className="crm-counsellor-decision-form space-y-3 mt-4 pt-4 border-t border-border">
          {config.needsFollowUpDate && (
            <DatePicker
              label="Follow-up Date"
              value={followUpDate}
              onChange={setFollowUpDate}
              placeholder="When to call back"
            />
          )}
          {(config.needsReason || config.needsFollowUpDate) && (
            <Textarea
              label={config.needsReason ? 'Reason / Notes' : 'Remarks'}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={2}
              placeholder="Counsellor notes for this decision..."
            />
          )}
          <div className="flex justify-end gap-2">
            <Button variant="outline" size="sm" onClick={() => setSelected(null)} disabled={isLoading}>
              Cancel
            </Button>
            <Button size="sm" onClick={submit} loading={isLoading}>
              Confirm — {config.label}
            </Button>
          </div>
        </div>
      )}
    </FormSection>
  );
}
