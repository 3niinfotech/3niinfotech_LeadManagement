import { useState } from 'react';
import { Controller } from 'react-hook-form';
import {
  FiCalendar, FiExternalLink, FiDownload, FiPlus, FiCopy, FiPhone,
} from 'react-icons/fi';
import DatePicker from '../../../../components/ui/DatePicker';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/ui/FormSection';
import ScrollArea from '../../../../components/ui/ScrollArea';
import FollowupActionTabs from './FollowupActionTabs';
import { ENQUIRY_FOLLOWUP_ACTIONS, getFollowupActionLabel } from '../../config/enquiryFollowup.config';
import {
  buildGoogleCalendarUrl, downloadIcsFile, buildWhatsAppUrl, buildTelUrl, buildMailtoUrl,
} from '../../utils/followupCalendar.utils';
import { combineDateAndTime } from '../../utils/enquiryForm.utils';
import { useAddFollowupMutation } from '../../redux/enquiryApiSlice';
import toastService from '../../../../services/toast/toast.service';

const CALENDAR_ACTIONS = new Set(['MEETING', 'REMINDER', 'VIDEO_CALL']);

export default function FollowUpActionsPanel({
  enquiryId,
  enquiry,
  isEditMode,
  register,
  control,
  errors,
  onLogged,
  actionType: actionTypeProp,
  onActionTypeChange,
  hideChannelTabs = false,
}) {
  const [internalActionType, setInternalActionType] = useState('CALL');
  const actionType = actionTypeProp ?? internalActionType;
  const setActionType = onActionTypeChange ?? setInternalActionType;
  const [scheduleDate, setScheduleDate] = useState('');
  const [scheduleTime, setScheduleTime] = useState('10:00');
  const [remark, setRemark] = useState('');
  const [addFollowup, { isLoading }] = useAddFollowupMutation();

  const history = enquiry?.followups || [];
  const selected = ENQUIRY_FOLLOWUP_ACTIONS.find((a) => a.value === actionType);
  const showCalendar = CALENDAR_ACTIONS.has(actionType);

  const openQuickAction = (type) => {
    if (type === 'WHATSAPP') {
      const url = buildWhatsAppUrl(enquiry?.mobile, remark || `Hi ${enquiry?.firstName || ''},`);
      if (url) window.open(url, '_blank', 'noopener');
      else toastService.info('Mobile number required');
      return;
    }
    if (type === 'CALL') {
      const url = buildTelUrl(enquiry?.mobile);
      if (url) window.open(url, '_self');
      else toastService.info('Mobile number required');
      return;
    }
    if (type === 'EMAIL') {
      const url = buildMailtoUrl(enquiry?.email, 'Enquiry follow-up', remark);
      if (url) window.open(url, '_self');
      else toastService.info('Email required');
    }
  };

  const copyContact = async (value, label) => {
    if (!value?.trim()) {
      toastService.info(`${label} not available`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value.trim());
      toastService.success(`${label} copied`);
    } catch {
      toastService.error('Could not copy to clipboard');
    }
  };

  const contactHint = {
    CALL: {
      value: enquiry?.mobile,
      label: 'Mobile',
      hint: 'Opens your PC phone app (Skype, Phone Link, etc.). Browser may ask which app to use — that is normal on laptop.',
      actionLabel: 'Dial number',
    },
    WHATSAPP: {
      value: enquiry?.mobile,
      label: 'WhatsApp',
      hint: 'Opens WhatsApp Web or the desktop app with this number.',
      actionLabel: 'Open WhatsApp',
    },
    EMAIL: {
      value: enquiry?.email,
      label: 'Email',
      hint: 'Opens your default mail app (Outlook, Gmail, etc.).',
      actionLabel: 'Open email',
    },
  }[actionType];

  const addToCalendar = () => {
    const startAt = combineDateAndTime(scheduleDate, scheduleTime);
    if (!startAt) {
      toastService.info('Pick a date and time first');
      return;
    }
    const title = `${getFollowupActionLabel(actionType)} — ${enquiry?.firstName || 'Enquiry'} ${enquiry?.lastName || ''}`.trim();
    window.open(buildGoogleCalendarUrl({
      title,
      startAt,
      description: remark || `Enquiry ${enquiry?.enquiryCode || ''}`,
    }), '_blank', 'noopener');
  };

  const downloadIcs = () => {
    const startAt = combineDateAndTime(scheduleDate, scheduleTime);
    if (!startAt) {
      toastService.info('Pick a date and time first');
      return;
    }
    const title = `${getFollowupActionLabel(actionType)} — ${enquiry?.firstName || 'Enquiry'}`;
    downloadIcsFile({ title, startAt, description: remark, uid: `${enquiryId}-${Date.now()}` });
  };

  const logFollowUp = async () => {
    const text = remark.trim();
    if (!text) {
      toastService.info('Add a remark before logging');
      return;
    }

    if (!isEditMode || !enquiryId) {
      toastService.info('Save the enquiry first, then log follow-ups');
      return;
    }

    try {
      const nextDate = combineDateAndTime(scheduleDate, scheduleTime);
      await addFollowup({
        id: enquiryId,
        remark: text,
        stage: actionType,
        nextDate: nextDate || undefined,
      }).unwrap();

      setRemark('');
      toastService.success(`${getFollowupActionLabel(actionType)} logged`);
      onLogged?.();
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to log follow-up');
    }
  };

  return (
    <FormSection
      title="Follow-up & Outreach"
      description="Pick a channel, log calls and messages, and schedule with calendar sync."
      className="crm-followup-actions-panel"
    >
      <div className="space-y-4">
        {!hideChannelTabs && (
          <div className="crm-followup-channel-tabs-wrap">
            <FollowupActionTabs
              actions={ENQUIRY_FOLLOWUP_ACTIONS}
              value={actionType}
              onChange={setActionType}
              layoutId="crm-followup-outreach-indicator"
              ariaLabel="Outreach channels"
              edgeFade={false}
              variant="inline"
            />
          </div>
        )}

        {isEditMode ? (
          <div className="crm-followup-appointment-fields">
            <DatePicker
              label={showCalendar ? 'Schedule Date' : 'Next Follow-up Date'}
              value={scheduleDate}
              onChange={setScheduleDate}
              placeholder="Pick date"
            />
            <Input
              label="Time"
              type="time"
              value={scheduleTime}
              onChange={(e) => setScheduleTime(e.target.value)}
            />
            <div className="col-span-full">
              <Textarea
                label="Remarks"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder={`Notes for this ${selected?.label?.toLowerCase() || 'action'}...`}
                rows={2}
              />
            </div>
          </div>
        ) : (
          <div className="crm-followup-appointment-fields">
            <Controller
              name="followUpDate"
              control={control}
              render={({ field }) => (
                <DatePicker
                  label="Follow-up Date"
                  value={field.value || ''}
                  onChange={field.onChange}
                  error={errors.followUpDate?.message}
                />
              )}
            />
            <Input
              label="Time"
              type="time"
              {...register('followUpTime')}
              error={errors.followUpTime?.message}
            />
            <div className="col-span-full">
              <Textarea
                label="Remarks"
                {...register('followUpRemarks')}
                error={errors.followUpRemarks?.message}
                placeholder="What to discuss on the next outreach..."
                rows={2}
              />
            </div>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {isEditMode && contactHint && (
            <div className="crm-followup-contact-card w-full">
              <div className="crm-followup-contact-card__row">
                <FiPhone className="crm-followup-contact-card__icon" aria-hidden />
                <div className="min-w-0 flex-1">
                  <span className="crm-followup-contact-card__label">{contactHint.label}</span>
                  <span className="crm-followup-contact-card__value">
                    {contactHint.value || 'Not set on this lead'}
                  </span>
                </div>
                {contactHint.value && (
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    icon={FiCopy}
                    onClick={() => copyContact(contactHint.value, contactHint.label)}
                  >
                    Copy
                  </Button>
                )}
                {contactHint.value && ['CALL', 'WHATSAPP', 'EMAIL'].includes(actionType) && (
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={FiExternalLink}
                    onClick={() => openQuickAction(actionType)}
                  >
                    {contactHint.actionLabel}
                  </Button>
                )}
              </div>
              <p className="crm-followup-contact-card__hint">{contactHint.hint}</p>
            </div>
          )}
          {isEditMode && showCalendar && (
            <>
              <Button type="button" size="sm" variant="outline-primary" icon={FiCalendar} onClick={addToCalendar}>
                Google Calendar
              </Button>
              <Button type="button" size="sm" variant="outline" icon={FiDownload} onClick={downloadIcs}>
                Download .ics
              </Button>
            </>
          )}
          {isEditMode && (
            <Button
              type="button"
              size="sm"
              icon={FiPlus}
              onClick={logFollowUp}
              loading={isLoading}
              className="ml-auto"
            >
              Log {selected?.label}
            </Button>
          )}
        </div>

        {isEditMode && history.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">
              Recent activity
            </p>
            <ScrollArea axis="y" hideBar className="max-h-40 rounded-lg border border-border">
              <ul className="divide-y divide-border">
                {history.map((row) => (
                  <li key={row.id} className="px-3 py-2.5 text-[12px]">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-text">
                        {getFollowupActionLabel(row.stage) || 'Follow-up'}
                      </span>
                      <span className="text-text-muted tabular-nums shrink-0">
                        {new Date(row.followupAt || row.createdAt).toLocaleString('en-IN', {
                          day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p className="text-text-secondary mt-0.5 line-clamp-2">{row.remark}</p>
                    {row.nextDate && (
                      <p className="text-[10px] text-text-muted mt-0.5">
                        Next: {new Date(row.nextDate).toLocaleString('en-IN')}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          </div>
        )}
      </div>
    </FormSection>
  );
}
