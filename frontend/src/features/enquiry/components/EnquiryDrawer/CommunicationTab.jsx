import { useMemo, useState, useEffect } from 'react';
import {
  FiExternalLink, FiPlus, FiPhone, FiMail, FiMessageSquare, FiMic,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import FormSection from '../../../../components/ui/FormSection';
import ScrollArea from '../../../../components/ui/ScrollArea';
import VoiceNoteRecorder from './VoiceNoteRecorder';
import FollowupActionTabs from './FollowupActionTabs';
import {
  COMMUNICATION_CHANNELS,
  COMMUNICATION_DIRECTION_OPTIONS,
  COMMUNICATION_STATUS_OPTIONS,
  getCommunicationChannelLabel,
  getCommunicationChannelMeta,
  getCommunicationStatusLabel,
  getCommunicationStatusTone,
  formatDuration,
  getVoiceNoteUrl,
} from '../../config/enquiryCommunication.config';
import {
  buildTelUrl, buildWhatsAppUrl, buildMailtoUrl, buildSmsUrl,
} from '../../utils/followupCalendar.utils';
import { useAddCommunicationMutation, useAddVoiceNoteMutation } from '../../redux/enquiryApiSlice';
import toastService from '../../../../services/toast/toast.service';
import { masterApi } from '../../../master/services/masterApi.service';

const ICONS = {
  phone: FiPhone,
  messageSquare: FaWhatsapp,
  mail: FiMail,
  message: FiMessageSquare,
  mic: FiMic,
};

const FILTER_OPTIONS = [
  { value: 'ALL', label: 'All channels' },
  ...COMMUNICATION_CHANNELS.map((c) => ({ value: c.value, label: c.label })),
];

function formatActor(user) {
  if (!user) return 'System';
  return `${user.firstName} ${user.lastName || ''}`.trim();
}

function groupByDate(items) {
  const groups = new Map();
  items.forEach((item) => {
    const key = new Date(item.sentAt).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(item);
  });
  return [...groups.entries()];
}

export default function CommunicationTab({ enquiryId, enquiry, isEditMode, onLogged }) {
  const [channel, setChannel] = useState('CALL');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [direction, setDirection] = useState('OUTBOUND');
  const [status, setStatus] = useState('SENT');
  const [filter, setFilter] = useState('ALL');

  const [addCommunication, { isLoading }] = useAddCommunicationMutation();
  const [addVoiceNote, { isLoading: savingVoice }] = useAddVoiceNoteMutation();
  const [templates, setTemplates] = useState([]);
  const [templateId, setTemplateId] = useState('');

  const history = enquiry?.communications || [];
  const filtered = useMemo(
    () => (filter === 'ALL' ? history : history.filter((h) => h.channel === filter)),
    [history, filter],
  );
  const grouped = useMemo(() => groupByDate(filtered), [filtered]);
  const selected = COMMUNICATION_CHANNELS.find((c) => c.value === channel);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await masterApi.list('communication-template', { pageSize: 100, status: 'active' });
        const rows = Array.isArray(res?.data) ? res.data : [];
        if (!cancelled) setTemplates(rows);
      } catch {
        if (!cancelled) setTemplates([]);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const channelTemplates = useMemo(() => {
    const map = { EMAIL: 'EMAIL', SMS: 'SMS', WHATSAPP: 'WHATSAPP' };
    const wanted = map[channel];
    if (!wanted) return [];
    return templates.filter((t) => String(t.channel || '').toUpperCase() === wanted);
  }, [templates, channel]);

  const applyTemplate = (id) => {
    setTemplateId(id);
    const tpl = templates.find((t) => t.id === id);
    if (!tpl) return;
    if (tpl.subject) setSubject(tpl.subject);
    if (tpl.body) setBody(tpl.body);
  };

  const resetForm = () => {
    setSubject('');
    setBody('');
    setDurationMin('');
    setDirection('OUTBOUND');
    setStatus('SENT');
    setTemplateId('');
  };

  const launchExternal = () => {
    if (channel === 'CALL') {
      const url = buildTelUrl(enquiry?.mobile);
      if (url) window.location.href = url;
      else toastService.info('Mobile number required');
      return;
    }
    if (channel === 'WHATSAPP') {
      const url = buildWhatsAppUrl(enquiry?.mobile, body);
      if (url) window.open(url, '_blank', 'noopener');
      else toastService.info('Mobile number required');
      return;
    }
    if (channel === 'EMAIL') {
      const url = buildMailtoUrl(enquiry?.email, subject || 'Enquiry update', body);
      if (url) window.location.href = url;
      else toastService.info('Email required');
      return;
    }
    if (channel === 'SMS') {
      const url = buildSmsUrl(enquiry?.mobile, body);
      if (url) window.location.href = url;
      else toastService.info('Mobile number required');
    }
  };

  const logCommunication = async (launch = false) => {
    if (!isEditMode || !enquiryId) {
      toastService.info('Save the enquiry first');
      return;
    }

    if (launch) launchExternal();

    const durationSec = durationMin !== '' ? Math.round(Number(durationMin) * 60) : undefined;

    try {
      await addCommunication({
        id: enquiryId,
        channel,
        subject: channel === 'EMAIL' ? subject.trim() || undefined : undefined,
        body: body.trim() || undefined,
        direction,
        status,
        durationSec: channel === 'CALL' ? durationSec : undefined,
      }).unwrap();

      resetForm();
      toastService.success(`${selected?.label || 'Communication'} logged`);
      onLogged?.();
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to log communication');
    }
  };

  const saveVoiceNote = async ({ file, body: noteBody, durationSec }) => {
    if (!isEditMode || !enquiryId) {
      toastService.info('Save the enquiry first');
      return;
    }

    try {
      await addVoiceNote({
        id: enquiryId,
        file,
        body: noteBody,
        durationSec,
        direction,
      }).unwrap();

      toastService.success('Voice note saved');
      onLogged?.();
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to save voice note');
    }
  };

  return (
    <div className="space-y-5">
      <FormSection
        title="Communication Center"
        description="Calls, WhatsApp, email, SMS, and voice notes — everything logs to history automatically."
      >
        <div className="space-y-4">
          <FollowupActionTabs
            actions={COMMUNICATION_CHANNELS}
            value={channel}
            onChange={setChannel}
            disabled={!isEditMode}
            ariaLabel="Communication channel"
            layoutId="crm-communication-channel-indicator"
          />

          {channel !== 'VOICE_NOTE' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
              {channelTemplates.length > 0 && (
                <div className="sm:col-span-2">
                  <Select
                    label="Template"
                    value={templateId}
                    onChange={(e) => applyTemplate(e.target.value)}
                    options={[
                      { value: '', label: 'Select a communication template' },
                      ...channelTemplates.map((t) => ({ value: t.id, label: t.name })),
                    ]}
                    disabled={!isEditMode}
                    allowClear
                  />
                </div>
              )}
              {channel === 'EMAIL' && (
                <div className="sm:col-span-2">
                  <Input
                    label="Subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Email subject"
                    disabled={!isEditMode}
                  />
                </div>
              )}
              {channel === 'CALL' && (
                <Input
                  label="Duration (minutes)"
                  type="number"
                  min="0"
                  step="1"
                  value={durationMin}
                  onChange={(e) => setDurationMin(e.target.value)}
                  placeholder="e.g. 5"
                  disabled={!isEditMode}
                />
              )}
              <Select
                label="Direction"
                value={direction}
                onChange={(e) => setDirection(e.target.value)}
                options={COMMUNICATION_DIRECTION_OPTIONS}
                disabled={!isEditMode}
              />
              <Select
                label="Status"
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                options={COMMUNICATION_STATUS_OPTIONS}
                disabled={!isEditMode}
              />
              <div className="sm:col-span-2">
                <Textarea
                  label={channel === 'CALL' ? 'Call notes' : 'Message'}
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                  placeholder={
                    channel === 'CALL'
                      ? 'Summary of the conversation...'
                      : `Write your ${selected?.label?.toLowerCase() || 'message'}...`
                  }
                  rows={3}
                  disabled={!isEditMode}
                />
              </div>
            </div>
          ) : (
            <VoiceNoteRecorder
              disabled={!isEditMode}
              saving={savingVoice}
              onSave={saveVoiceNote}
            />
          )}

          {isEditMode && channel !== 'VOICE_NOTE' && (
            <div className="flex flex-wrap items-center gap-2">
              {['CALL', 'WHATSAPP', 'EMAIL', 'SMS'].includes(channel) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline-primary"
                  icon={FiExternalLink}
                  onClick={launchExternal}
                >
                  Open {selected?.label}
                </Button>
              )}
              <Button
                type="button"
                size="sm"
                icon={FiPlus}
                onClick={() => logCommunication(false)}
                loading={isLoading}
                className="ml-auto"
              >
                Log to history
              </Button>
              {['WHATSAPP', 'EMAIL', 'SMS'].includes(channel) && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => logCommunication(true)}
                  loading={isLoading}
                >
                  Send & log
                </Button>
              )}
              {channel === 'CALL' && (
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => logCommunication(true)}
                  loading={isLoading}
                >
                  Call & log
                </Button>
              )}
            </div>
          )}
        </div>
      </FormSection>

      <div className="pt-1 border-t border-border">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div>
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide">
              Communication history
            </p>
            <p className="text-[12px] text-text-secondary mt-0.5">
              {filtered.length} entr{filtered.length === 1 ? 'y' : 'ies'} · updated automatically
            </p>
          </div>
          <div className="w-full sm:w-44">
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              options={FILTER_OPTIONS}
              allowClear={false}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <p className="text-sm text-text-muted text-center py-10 border border-dashed border-border rounded-lg">
            No communications yet. Log a call, message, or voice note above.
          </p>
        ) : (
          <ScrollArea hideBar className="max-h-[420px] pr-1">
            <div className="space-y-5">
              {grouped.map(([dateLabel, items]) => (
                <div key={dateLabel}>
                  <p className="text-[11px] font-semibold text-text-muted mb-2 sticky top-0 bg-bg-card py-1">
                    {dateLabel}
                  </p>
                  <div className="space-y-2">
                    {items.map((item) => {
                      const meta = getCommunicationChannelMeta(item.channel);
                      const Icon = ICONS[meta.icon] || FiPhone;
                      const voiceUrl = item.channel === 'VOICE_NOTE' ? getVoiceNoteUrl(item.filePath) : null;

                      return (
                        <div key={item.id} className="crm-comm-history-item">
                          <div className="crm-comm-history-item__icon" data-tone={meta.color}>
                            <Icon className="w-4 h-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex flex-wrap items-center gap-2 mb-1">
                              <span className="text-sm font-medium text-text">
                                {getCommunicationChannelLabel(item.channel)}
                              </span>
                              <Badge color={getCommunicationStatusTone(item.status)} className="text-[10px]">
                                {getCommunicationStatusLabel(item.status)}
                              </Badge>
                              <span className="text-[10px] text-text-muted uppercase tracking-wide">
                                {item.direction === 'INBOUND' ? 'Inbound' : 'Outbound'}
                              </span>
                            </div>
                            {item.subject && (
                              <p className="text-sm font-medium text-text-secondary">{item.subject}</p>
                            )}
                            {item.body && (
                              <p className="text-sm text-text-secondary mt-0.5 whitespace-pre-wrap">{item.body}</p>
                            )}
                            {item.channel === 'CALL' && item.durationSec != null && (
                              <p className="text-[12px] text-text-muted mt-1">
                                Duration: {formatDuration(item.durationSec)}
                              </p>
                            )}
                            {voiceUrl && (
                              <audio controls src={voiceUrl} className="w-full h-9 mt-2">
                                <track kind="captions" />
                              </audio>
                            )}
                            <p className="text-[11px] text-text-muted mt-2">
                              {formatActor(item.user)}
                              {' · '}
                              {new Date(item.sentAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit', minute: '2-digit',
                              })}
                              {item.channel === 'VOICE_NOTE' && item.durationSec != null && (
                                <> · {formatDuration(item.durationSec)}</>
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </div>
    </div>
  );
}
