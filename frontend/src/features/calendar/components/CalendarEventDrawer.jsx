import {
  FiCalendar,
  FiCheck,
  FiClock,
  FiDownload,
  FiExternalLink,
  FiMessageCircle,
  FiPhone,
  FiUserCheck,
  FiX,
} from 'react-icons/fi';
import Drawer from '../../../components/ui/Drawer';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import { formatEventWhen } from '../utils/calendar-date.utils';
import { EVENT_TYPE_STYLE, STATUS_STYLE, getEventStyle } from '../utils/calendar-event.config';
import { useEffect, useState } from 'react';
import {
  buildGoogleCalendarUrl,
  buildTelUrl,
  buildWhatsAppUrl,
  downloadIcsFile,
} from '../../enquiry/utils/followupCalendar.utils';

export default function CalendarEventDrawer({
  open,
  event,
  onClose,
  onOpenRecord,
  onComplete,
  onReschedule,
  onAssign,
  counsellorOptions = [],
  actionLoading = false,
}) {
  const [assigneeId, setAssigneeId] = useState('');
  const [rescheduleAt, setRescheduleAt] = useState('');

  useEffect(() => {
    setAssigneeId(event?.assignedUserId || '');
    setRescheduleAt('');
  }, [event?.id, event?.assignedUserId]);

  if (!event) return null;

  const style = getEventStyle(event);
  const statusMeta = STATUS_STYLE[event.status] || { label: event.status, tone: 'secondary' };
  const durationMinutes = event.endAt
    ? Math.max(15, Math.round((new Date(event.endAt) - new Date(event.startAt)) / 60000))
    : 30;
  const exportPayload = {
    title: event.title,
    startAt: event.startAt,
    durationMinutes,
    description: event.description || '',
    location: event.location || '',
    uid: event.id,
  };
  const mobile = event.relatedEntity?.mobile;
  const telUrl = buildTelUrl(mobile);
  const whatsappUrl = buildWhatsAppUrl(mobile, `Regarding ${event.title}`);

  return (
    <Drawer open={open} onClose={onClose} title="Event details" width="420px" anchor="right">
      <div className="p-4 space-y-4">
        <div
          className="rounded-lg border px-3 py-3"
          style={{ background: style.bg, borderColor: style.border }}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: style.color }}>
            {EVENT_TYPE_STYLE[event.eventType]?.label || event.eventType} · {event.category}
          </p>
          <h3 className="text-base font-semibold text-text-primary mt-1">{event.title}</h3>
          <p className="text-sm text-text-secondary mt-1 flex items-center gap-1.5">
            <FiClock size={14} /> {formatEventWhen(event)}
          </p>
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm">
          <div>
            <dt className="text-[11px] uppercase text-text-muted font-semibold">Status</dt>
            <dd className="text-text-primary mt-0.5">{statusMeta.label}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-text-muted font-semibold">Assigned to</dt>
            <dd className="text-text-primary mt-0.5">{event.assignedUserName || '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-text-muted font-semibold">Branch</dt>
            <dd className="text-text-primary mt-0.5">{event.branchName || '—'}</dd>
          </div>
          <div>
            <dt className="text-[11px] uppercase text-text-muted font-semibold">Related</dt>
            <dd className="text-text-primary mt-0.5">
              {event.relatedEntity?.code ? `${event.relatedEntity.code} · ` : ''}
              {event.relatedEntity?.name || '—'}
            </dd>
          </div>
          {event.location && (
            <div>
              <dt className="text-[11px] uppercase text-text-muted font-semibold">Location</dt>
              <dd className="text-text-primary mt-0.5">{event.location}</dd>
            </div>
          )}
          {event.meetingLink && (
            <div>
              <dt className="text-[11px] uppercase text-text-muted font-semibold">Meeting link</dt>
              <dd className="mt-0.5">
                <a href={event.meetingLink} target="_blank" rel="noreferrer" className="text-brand hover:underline break-all">
                  {event.meetingLink}
                </a>
              </dd>
            </div>
          )}
          {event.description && (
            <div>
              <dt className="text-[11px] uppercase text-text-muted font-semibold">Notes</dt>
              <dd className="text-text-secondary mt-0.5 whitespace-pre-wrap">{event.description}</dd>
            </div>
          )}
        </dl>

        <div className="flex flex-wrap gap-2 pt-2 border-t border-border">
          {event.relatedEntity?.id && (
            <Button variant="outline-primary" size="sm" icon={FiExternalLink} onClick={() => onOpenRecord(event)}>
              Open record
            </Button>
          )}
          {telUrl && (
            <>
              <Button
                variant="outline"
                size="sm"
                icon={FiPhone}
                onClick={() => { window.location.href = telUrl; }}
              >
                Call
              </Button>
              <Button
                variant="outline"
                size="sm"
                icon={FiMessageCircle}
                onClick={() => window.open(whatsappUrl, '_blank', 'noopener,noreferrer')}
              >
                WhatsApp
              </Button>
            </>
          )}
          <Button
            variant="outline"
            size="sm"
            icon={FiCalendar}
            onClick={() => window.open(buildGoogleCalendarUrl(exportPayload), '_blank', 'noopener,noreferrer')}
          >
            Google
          </Button>
          <Button variant="outline" size="sm" icon={FiDownload} onClick={() => downloadIcsFile(exportPayload)}>
            .ics
          </Button>
          {event.canComplete && (
            <Button variant="outline-success" size="sm" icon={FiCheck} loading={actionLoading} onClick={() => onComplete(event)}>
              Complete
            </Button>
          )}
          <Button variant="outline" size="sm" icon={FiX} onClick={onClose}>Close</Button>
        </div>

        {event.canReschedule && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-text-muted uppercase">Reschedule</p>
            <input
              type="datetime-local"
              className="crm-input w-full rounded-lg border border-border px-3 py-2 text-sm"
              value={rescheduleAt}
              onChange={(e) => setRescheduleAt(e.target.value)}
            />
            <Button
              variant="primary"
              size="sm"
              disabled={!rescheduleAt}
              loading={actionLoading}
              onClick={() => onReschedule(event, new Date(rescheduleAt).toISOString())}
            >
              Save new time
            </Button>
          </div>
        )}

        {event.canAssign && (
          <div className="space-y-2 pt-2 border-t border-border">
            <p className="text-xs font-semibold text-text-muted uppercase">Assign counsellor</p>
            <Select
              value={assigneeId || event.assignedUserId || ''}
              onChange={(e) => setAssigneeId(e.target.value)}
              options={[{ value: '', label: 'Select counsellor' }, ...counsellorOptions]}
            />
            <Button
              variant="outline"
              size="sm"
              icon={FiUserCheck}
              disabled={!(assigneeId || event.assignedUserId)}
              loading={actionLoading}
              onClick={() => onAssign(event, assigneeId || event.assignedUserId)}
            >
              Assign
            </Button>
          </div>
        )}
      </div>
    </Drawer>
  );
}
