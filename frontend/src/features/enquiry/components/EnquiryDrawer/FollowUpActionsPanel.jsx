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
import FollowupActionTabs from './FollowupActionTabs';
import { ENQUIRY_FOLLOWUP_ACTIONS, getFollowupActionLabel, getFollowupActionMeta } from '../../config/enquiryFollowup.config';
import {
  buildGoogleCalendarUrl, downloadIcsFile, buildWhatsAppUrl, buildTelUrl, buildMailtoUrl,
} from '../../utils/followupCalendar.utils';
import { combineDateAndTime } from '../../utils/enquiryForm.utils';
import { useAddFollowupMutation } from '../../redux/enquiryApiSlice';
import toastService from '../../../../services/toast/toast.service';
import { useCompanyRuntime } from '../../../organization/CompanyRuntime';
import { followupSlotOptions } from '../../../../config/company-settings.config';
import Select from '../../../../components/ui/Select';

const CALENDAR_ACTIONS = new Set(['MEETING', 'REMINDER', 'VIDEO_CALL']);
const CONTACT_ACTIONS = new Set(['CALL', 'WHATSAPP', 'EMAIL']);

function formatActivityWhen(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

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
  const { settings } = useCompanyRuntime();
  const slotOptions = followupSlotOptions(settings);
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
    CALL: { value: enquiry?.mobile, label: 'Mobile', actionLabel: 'Dial' },
    WHATSAPP: { value: enquiry?.mobile, label: 'WhatsApp', actionLabel: 'Open chat' },
    EMAIL: { value: enquiry?.email, label: 'Email', actionLabel: 'Compose' },
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
      description="Log calls and messages, then schedule the next touchpoint."
      className="crm-outreach-panel crm-followup-actions-panel"
    >
      <div className="crm-outreach-panel__stack">
        {!hideChannelTabs && (
          <div className="crm-outreach-panel__channels">
            <FollowupActionTabs
              actions={ENQUIRY_FOLLOWUP_ACTIONS}
              value={actionType}
              onChange={setActionType}
              layoutId="crm-followup-outreach-indicator"
              ariaLabel="Outreach channels"
            />
          </div>
        )}

        <div className="crm-outreach-panel__form">
          {isEditMode ? (
            <>
              <div className="crm-outreach-panel__grid crm-outreach-panel__grid--2">
                <DatePicker
                  label={showCalendar ? 'Schedule date' : 'Next follow-up date'}
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
              </div>
              <Textarea
                label="Remarks"
                value={remark}
                onChange={(e) => setRemark(e.target.value)}
                placeholder={`Notes for this ${selected?.label?.toLowerCase() || 'action'}…`}
                rows={3}
              />
            </>
          ) : (
            <>
              <div className="crm-outreach-panel__grid crm-outreach-panel__grid--2">
                <Controller
                  name="followUpDate"
                  control={control}
                  render={({ field }) => (
                    <DatePicker
                      label="Follow-up date"
                      value={field.value || ''}
                      onChange={field.onChange}
                      error={errors.followUpDate?.message}
                    />
                  )}
                />
                {slotOptions.length ? (
                  <Controller
                    name="followUpTime"
                    control={control}
                    render={({ field }) => (
                      <Select
                        label="Time"
                        value={field.value || ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        options={slotOptions}
                        error={errors.followUpTime?.message}
                      />
                    )}
                  />
                ) : (
                  <Input
                    label="Time"
                    type="time"
                    {...register('followUpTime')}
                    error={errors.followUpTime?.message}
                  />
                )}
              </div>
              <Textarea
                label="Remarks"
                {...register('followUpRemarks')}
                error={errors.followUpRemarks?.message}
                placeholder="What to discuss on the next outreach…"
                rows={3}
              />
            </>
          )}

          {isEditMode && contactHint && CONTACT_ACTIONS.has(actionType) && (
            <div className="crm-outreach-contact">
              <div className="crm-outreach-contact__main">
                <span className="crm-outreach-contact__icon" aria-hidden>
                  <FiPhone />
                </span>
                <div className="min-w-0">
                  <span className="crm-outreach-contact__label">{contactHint.label}</span>
                  <span className="crm-outreach-contact__value">
                    {contactHint.value || 'Not set on this lead'}
                  </span>
                </div>
              </div>
              {contactHint.value && (
                <div className="crm-outreach-contact__actions">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    icon={FiCopy}
                    onClick={() => copyContact(contactHint.value, contactHint.label)}
                  >
                    Copy
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    icon={FiExternalLink}
                    onClick={() => openQuickAction(actionType)}
                  >
                    {contactHint.actionLabel}
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>

        {isEditMode && (
          <div className="crm-outreach-panel__footer">
            {showCalendar && (
              <div className="crm-outreach-panel__footer-secondary">
                <Button type="button" size="sm" variant="outline-primary" icon={FiCalendar} onClick={addToCalendar}>
                  Google Calendar
                </Button>
                <Button type="button" size="sm" variant="outline" icon={FiDownload} onClick={downloadIcs}>
                  .ics
                </Button>
              </div>
            )}
            <Button
              type="button"
              size="sm"
              icon={FiPlus}
              onClick={logFollowUp}
              loading={isLoading}
              className="crm-outreach-panel__cta"
            >
              Log {selected?.label}
            </Button>
          </div>
        )}

        {isEditMode && history.length > 0 && (
          <div className="crm-outreach-feed">
            <div className="crm-outreach-feed__head">
              <span className="crm-outreach-feed__title">Recent activity</span>
              <span className="crm-outreach-feed__count">{history.length}</span>
            </div>
            <ul className="crm-outreach-feed__list">
              {history.slice(0, 5).map((row) => {
                const meta = getFollowupActionMeta(row.stage);
                return (
                  <li key={row.id} className="crm-outreach-feed__item">
                    <div className="crm-outreach-feed__item-top">
                      <span className={`crm-outreach-feed__badge crm-outreach-feed__badge--${meta?.color || 'secondary'}`}>
                        {getFollowupActionLabel(row.stage) || 'Follow-up'}
                      </span>
                      <time className="crm-outreach-feed__time">
                        {formatActivityWhen(row.followupAt || row.createdAt)}
                      </time>
                    </div>
                    <p className="crm-outreach-feed__text">{row.remark}</p>
                    {row.nextDate && (
                      <p className="crm-outreach-feed__next">
                        Next: {formatActivityWhen(row.nextDate)}
                      </p>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </div>
    </FormSection>
  );
}
