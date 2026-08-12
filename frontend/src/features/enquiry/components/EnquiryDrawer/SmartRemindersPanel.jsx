import { useMemo } from 'react';
import { FiBell, FiArrowDown, FiZap } from 'react-icons/fi';
import Badge from '../../../../components/ui/Badge';
import FormSection from '../../../../components/ui/FormSection';
import { buildSmartReminderFlow } from '../../utils/enquirySmartReminder.utils';

const STATUS_LABEL = {
  idle: 'Monitoring',
  active: 'In progress',
  done: 'Done',
  pending: 'Pending',
};

const STATUS_COLOR = {
  idle: 'secondary',
  active: 'warning',
  done: 'success',
  pending: 'secondary',
};

function FlowStep({ step, isLast }) {
  return (
    <>
      <div className="crm-smart-reminder__step" data-status={step.status}>
        <div className="crm-smart-reminder__step-main">
          <span className="crm-smart-reminder__step-dot" aria-hidden />
          <div className="min-w-0">
            <div className="crm-smart-reminder__step-title-row">
              <p className="crm-smart-reminder__step-title">
                {step.label}
                {step.suffix && (
                  <span className="crm-smart-reminder__step-suffix">{step.suffix}</span>
                )}
              </p>
              <Badge color={STATUS_COLOR[step.status] || 'secondary'} className="shrink-0">
                {STATUS_LABEL[step.status] || step.status}
              </Badge>
            </div>
            <p className="crm-smart-reminder__step-desc">{step.description}</p>
            {step.atLabel && (
              <p className="crm-smart-reminder__step-time">{step.atLabel}</p>
            )}
          </div>
        </div>
      </div>
      {!isLast && (
        <div className="crm-smart-reminder__arrow" aria-hidden>
          <FiArrowDown className="w-4 h-4" />
        </div>
      )}
    </>
  );
}

export default function SmartRemindersPanel({ enquiry }) {
  const flow = useMemo(() => buildSmartReminderFlow(enquiry), [enquiry]);

  if (!flow) {
    return (
      <FormSection
        title="Smart Reminders"
        description="Automatic follow-up reminders when outreach goes idle."
      >
        <p className="text-sm text-text-muted text-center py-6 border border-dashed border-border rounded-lg">
          Smart reminders activate once the enquiry is saved.
        </p>
      </FormSection>
    );
  }

  return (
    <FormSection
      title="Smart Reminders"
      description="Automatically — no follow-up for 3 days triggers reminder, notification, and email."
    >
      <div className="crm-smart-reminder">
        <div className="crm-smart-reminder__banner" data-phase={flow.phase}>
          <span className="crm-smart-reminder__banner-icon" aria-hidden>
            {flow.completed ? <FiBell className="w-4 h-4" /> : <FiZap className="w-4 h-4" />}
          </span>
          <div className="min-w-0">
            <p className="crm-smart-reminder__banner-title">{flow.headline}</p>
            <p className="crm-smart-reminder__banner-meta">
              {flow.daysWithoutFollowUp}
              {' '}
              day
              {flow.daysWithoutFollowUp === 1 ? '' : 's'}
              {' '}
              without follow-up
              {flow.completedAtLabel ? ` · Last run ${flow.completedAtLabel}` : ''}
            </p>
          </div>
          <Badge
            color={flow.completed ? 'success' : flow.phase === 'ready' ? 'danger' : 'warning'}
            className="shrink-0"
          >
            {flow.completed ? 'Sent' : `${flow.daysLeft}d left`}
          </Badge>
        </div>

        <div className="crm-smart-reminder__pipeline" aria-label="Smart reminder automation flow">
          {flow.steps.map((step, index) => (
            <FlowStep
              key={step.id}
              step={step}
              isLast={index === flow.steps.length - 1}
            />
          ))}
        </div>
      </div>
    </FormSection>
  );
}
