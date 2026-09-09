import { useMemo, useState, useEffect } from 'react';
import {
  FiExternalLink, FiPlus, FiPhone, FiMail, FiMessageSquare, FiMic, FiCopy, FiClock,
} from 'react-icons/fi';
import { FaWhatsapp } from 'react-icons/fa';
import Input from '../../../../components/ui/Input';
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

function copyText(value, label) {
  if (!value) {
    toastService.info(`${label} not available`);
    return;
  }
  navigator.clipboard?.writeText(String(value)).then(
    () => toastService.success(`${label} copied`),
    () => toastService.error('Could not copy'),
  );
}

function snippet(text, max = 90) {
  const t = String(text || '').replace(/\s+/g, ' ').trim();
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max)}…` : t;
}

export default function CommunicationTab({ enquiryId, enquiry, isEditMode, onLogged }) {
  const [channel, setChannel] = useState('CALL');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [durationMin, setDurationMin] = useState('');
  const [direction, setDirection] = useState('OUTBOUND');
  const [status, setStatus] = useState('SENT');
  const [filter, setFilter] = useState('ALL');
  const [expandedId, setExpandedId] = useState(null);

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

  const noteLabel = channel === 'CALL' ? 'Call notes' : channel === 'EMAIL' ? 'Subject / notes' : 'Message';

  return (
    <div className="crm-comm">
      <FormSection
        title="Communication Center"
        description="Log calls and messages — appears in history and timeline."
        className="crm-comm-center"
      >
        <div className="">
          <div className="crm-comm-composer__top">
            <FollowupActionTabs
              actions={COMMUNICATION_CHANNELS}
              value={channel}
              onChange={setChannel}
              disabled={!isEditMode}
              ariaLabel="Communication channel"
              layoutId="crm-communication-channel-indicator"
              density="fit"
            />

            {(enquiry?.mobile || enquiry?.email) && channel !== 'VOICE_NOTE' && (
              <div className="crm-comm-contact">
                {enquiry?.mobile && ['CALL', 'WHATSAPP', 'SMS'].includes(channel) && (
                  <div className="crm-comm-contact__chip">
                    <span className="crm-comm-contact__label">Mobile</span>
                    <span className="crm-comm-contact__value tabular-nums">{enquiry.mobile}</span>
                    <button type="button" className="crm-comm-contact__btn" onClick={() => copyText(enquiry.mobile, 'Mobile')} aria-label="Copy mobile">
                      <FiCopy className="w-3 h-3" />
                    </button>
                    {channel === 'CALL' && (
                      <button type="button" className="crm-comm-contact__btn crm-comm-contact__btn--accent" onClick={launchExternal}>
                        Dial
                      </button>
                    )}
                  </div>
                )}
                {enquiry?.email && channel === 'EMAIL' && (
                  <div className="crm-comm-contact__chip">
                    <span className="crm-comm-contact__label">Email</span>
                    <span className="crm-comm-contact__value truncate" title={enquiry.email}>{enquiry.email}</span>
                    <button type="button" className="crm-comm-contact__btn" onClick={() => copyText(enquiry.email, 'Email')} aria-label="Copy email">
                      <FiCopy className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {channel !== 'VOICE_NOTE' ? (
            <>
              {(channelTemplates.length > 0 || channel === 'EMAIL') && (
                <div className="crm-comm-composer__row crm-comm-composer__row--secondary">
                  {channelTemplates.length > 0 && (
                    <Select
                      label="Template"
                      value={templateId}
                      onChange={(e) => applyTemplate(e.target.value)}
                      options={[
                        { value: '', label: 'Template' },
                        ...channelTemplates.map((t) => ({ value: t.id, label: t.name })),
                      ]}
                      disabled={!isEditMode}
                      allowClear
                    />
                  )}
                  {channel === 'EMAIL' && (
                    <Input
                      label="Subject"
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      placeholder="Email subject"
                      disabled={!isEditMode}
                    />
                  )}
                </div>
              )}

              <div className="crm-comm-composer__row">
                {channel === 'CALL' && (
                  <div className="crm-comm-field crm-comm-field--sm">
                    <Input
                      label="Duration"
                      type="number"
                      min="0"
                      step="1"
                      value={durationMin}
                      onChange={(e) => setDurationMin(e.target.value)}
                      placeholder="min"
                      disabled={!isEditMode}
                    />
                  </div>
                )}
                <div className="crm-comm-field crm-comm-field--sm">
                  <Select
                    label="Direction"
                    value={direction}
                    onChange={(e) => setDirection(e.target.value)}
                    options={COMMUNICATION_DIRECTION_OPTIONS}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="crm-comm-field crm-comm-field--sm">
                  <Select
                    label="Status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    options={COMMUNICATION_STATUS_OPTIONS}
                    disabled={!isEditMode}
                  />
                </div>
                <div className="crm-comm-field crm-comm-field--grow">
                  <Input
                    label={noteLabel}
                    value={body}
                    onChange={(e) => setBody(e.target.value)}
                    placeholder={channel === 'CALL' ? 'Brief call summary' : 'Message…'}
                    disabled={!isEditMode}
                  />
                </div>
                {isEditMode && (
                  <div className="crm-comm-composer__btns">
                    {['CALL', 'WHATSAPP', 'EMAIL', 'SMS'].includes(channel) && (
                      <Button
                        type="button"
                        size="sm"
                        variant="outline-primary"
                        icon={FiExternalLink}
                        onClick={launchExternal}
                      >
                        Open
                      </Button>
                    )}
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
                    <Button
                      type="button"
                      size="sm"
                      icon={FiPlus}
                      onClick={() => logCommunication(false)}
                      loading={isLoading}
                    >
                      Log
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <VoiceNoteRecorder
              disabled={!isEditMode}
              saving={savingVoice}
              onSave={saveVoiceNote}
            />
          )}
        </div>
      </FormSection>

      <section className="crm-comm-history">
        <div className="crm-comm-history__head">
          <p className="crm-comm-history__title">
            History
            <span className="crm-comm-history__count">{filtered.length}</span>
          </p>
          <div className="crm-comm-history__filter">
            <Select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              options={FILTER_OPTIONS}
              allowClear={false}
            />
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="crm-comm-history__empty">
            <FiClock className="w-4 h-4 text-text-muted" />
            <span>No entries yet</span>
          </div>
        ) : (
          <ScrollArea hideBar className="max-h-[380px]">
            <div className="crm-comm-history__list">
              {grouped.map(([dateLabel, items]) => (
                <div key={dateLabel} className="crm-comm-history__day">
                  <p className="crm-comm-history__date">{dateLabel}</p>
                  <ul className="crm-comm-history__rows">
                    {items.map((item) => {
                      const meta = getCommunicationChannelMeta(item.channel);
                      const Icon = ICONS[meta.icon] || FiPhone;
                      const voiceUrl = item.channel === 'VOICE_NOTE' ? getVoiceNoteUrl(item.filePath) : null;
                      const open = expandedId === item.id;
                      const preview = item.subject || snippet(item.body);

                      return (
                        <li key={item.id}>
                          <button
                            type="button"
                            className="crm-comm-row"
                            data-channel={item.channel}
                            onClick={() => setExpandedId(open ? null : item.id)}
                            aria-expanded={open}
                          >
                            <span className="crm-comm-row__icon" data-tone={meta.color}>
                              <Icon className="w-3.5 h-3.5" />
                            </span>
                            <span className="crm-comm-row__channel">
                              {getCommunicationChannelLabel(item.channel)}
                            </span>
                            <Badge color={getCommunicationStatusTone(item.status)} className="text-[10px] shrink-0">
                              {getCommunicationStatusLabel(item.status)}
                            </Badge>
                            <span className="crm-comm-row__dir">
                              {item.direction === 'INBOUND' ? 'In' : 'Out'}
                            </span>
                            <span className="crm-comm-row__preview" title={preview}>
                              {preview || '—'}
                            </span>
                            <span className="crm-comm-row__meta">
                              {formatActor(item.user)}
                            </span>
                            <time className="crm-comm-row__time" dateTime={item.sentAt}>
                              {new Date(item.sentAt).toLocaleTimeString('en-IN', {
                                hour: '2-digit', minute: '2-digit',
                              })}
                            </time>
                          </button>
                          {open && (
                            <div className="crm-comm-row__detail">
                              {item.subject && (
                                <p className="crm-comm-row__detail-subject">{item.subject}</p>
                              )}
                              {item.body && (
                                <p className="crm-comm-row__detail-body">{item.body}</p>
                              )}
                              <p className="crm-comm-row__detail-foot">
                                {formatActor(item.user)}
                                {item.durationSec != null && <> · {formatDuration(item.durationSec)}</>}
                              </p>
                              {voiceUrl && (
                                <audio controls src={voiceUrl} className="w-full max-w-md h-8 mt-2">
                                  <track kind="captions" />
                                </audio>
                              )}
                            </div>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </section>
    </div>
  );
}
