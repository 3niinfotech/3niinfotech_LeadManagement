import { useEffect, useState } from 'react';
import { FiCalendar, FiDownload, FiMapPin, FiVideo, FiPlus } from 'react-icons/fi';
import DatePicker from '../../../../components/ui/DatePicker';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/ui/FormSection';
import {
  APPOINTMENT_MODES,
  MEETING_PLATFORMS,
  APPOINTMENT_ROOMS,
  getAppointmentModeLabel,
  getMeetingPlatformLabel,
  DEFAULT_MEETING_LINKS,
} from '../../config/enquiryAppointment.config';
import { useCounsellorOptions } from '../../hooks/useCounsellorOptions';
import { combineDateAndTime } from '../../utils/enquiryForm.utils';
import { buildGoogleCalendarUrl, downloadIcsFile } from '../../utils/followupCalendar.utils';
import { useAddAppointmentMutation } from '../../redux/enquiryApiSlice';
import toastService from '../../../../services/toast/toast.service';

const ROOM_OPTIONS = APPOINTMENT_ROOMS.map((r) => ({ value: r, label: r }));

function formatApptWhen(value) {
  if (!value) return '—';
  return new Date(value).toLocaleString('en-IN', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function AppointmentPanel({ enquiryId, enquiry, isEditMode, onBooked }) {
  const { options: counsellorOptions, loading: counsellorsLoading } = useCounsellorOptions({
    branchId: enquiry?.branchId,
    enabled: Boolean(enquiry?.branchId || !isEditMode),
  });
  const [addAppointment, { isLoading }] = useAddAppointmentMutation();

  const [date, setDate] = useState('');
  const [time, setTime] = useState('10:00');
  const [counsellorId, setCounsellorId] = useState('');
  const [mode, setMode] = useState('OFFLINE');
  const [platform, setPlatform] = useState('GOOGLE_MEET');
  const [room, setRoom] = useState('');
  const [meetingLink, setMeetingLink] = useState('');
  const [remark, setRemark] = useState('');

  const history = enquiry?.appointments || [];
  const isOnline = mode === 'ONLINE';

  useEffect(() => {
    if (enquiry?.assignedToId && !counsellorId) {
      setCounsellorId(enquiry.assignedToId);
    }
  }, [enquiry?.assignedToId, counsellorId]);

  useEffect(() => {
    if (isOnline && platform && !meetingLink) {
      setMeetingLink(DEFAULT_MEETING_LINKS[platform] || '');
    }
  }, [isOnline, platform, meetingLink]);

  const startAt = combineDateAndTime(date, time);
  const calendarTitle = `Counselling — ${enquiry?.firstName || 'Enquiry'} ${enquiry?.lastName || ''}`.trim();
  const calendarLocation = isOnline
    ? `${getMeetingPlatformLabel(platform)}${meetingLink ? ` · ${meetingLink}` : ''}`
    : room;

  const book = async () => {
    if (!isEditMode || !enquiryId) {
      toastService.info('Save the enquiry first');
      return;
    }
    if (!date || !time) {
      toastService.info('Date and time are required');
      return;
    }
    if (isOnline && !platform) {
      toastService.info('Select Google Meet or Zoom');
      return;
    }
    if (!isOnline && !room) {
      toastService.info('Select a room for offline appointment');
      return;
    }

    try {
      await addAppointment({
        id: enquiryId,
        startAt,
        counsellorId: counsellorId || undefined,
        mode,
        platform: isOnline ? platform : undefined,
        room: isOnline ? undefined : room,
        meetingLink: isOnline ? meetingLink : undefined,
        remark: remark.trim() || undefined,
        title: isOnline ? `${getMeetingPlatformLabel(platform)} Session` : 'In-person Counselling',
      }).unwrap();

      setRemark('');
      toastService.success('Appointment booked');
      onBooked?.();
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to book appointment');
    }
  };

  return (
    <FormSection
      title="Appointment"
      description="Book counselling — counsellor, mode, room or meeting link."
      className="crm-outreach-panel crm-appointment-panel"
    >
      <div className="crm-outreach-panel__stack">
        <div className="crm-outreach-panel__form">
          <div className="crm-outreach-panel__grid crm-outreach-panel__grid--3">
            <DatePicker
              label="Date"
              value={date}
              onChange={setDate}
              placeholder="Pick date"
              disabled={!isEditMode}
            />
            <Input
              label="Time"
              type="time"
              value={time}
              onChange={(e) => setTime(e.target.value)}
              disabled={!isEditMode}
            />
            <Select
              label="Counsellor"
              value={counsellorId}
              onChange={(e) => setCounsellorId(e.target.value)}
              options={counsellorOptions}
              placeholder="Select counsellor"
              loading={counsellorsLoading}
              disabled={!isEditMode}
            />
          </div>

          <div>
            <span className="crm-outreach-field-label">Mode</span>
            <div className="crm-appointment-mode crm-appointment-mode--segmented" role="group" aria-label="Appointment mode">
              {APPOINTMENT_MODES.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  disabled={!isEditMode}
                  onClick={() => setMode(m.value)}
                  className={`crm-appointment-mode__btn ${mode === m.value ? 'crm-appointment-mode__btn--active' : ''}`}
                >
                  {m.value === 'ONLINE' ? <FiVideo className="w-3.5 h-3.5" /> : <FiMapPin className="w-3.5 h-3.5" />}
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          {isOnline ? (
            <>
              <div>
                <span className="crm-outreach-field-label">Platform</span>
                <div className="crm-appointment-platform">
                  {MEETING_PLATFORMS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      disabled={!isEditMode}
                      onClick={() => {
                        setPlatform(p.value);
                        setMeetingLink(DEFAULT_MEETING_LINKS[p.value] || '');
                      }}
                      className={`crm-appointment-platform__btn ${
                        platform === p.value ? 'crm-appointment-platform__btn--active' : ''
                      }`}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
              </div>
              <Input
                label="Meeting link"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://meet.google.com/…"
                disabled={!isEditMode}
              />
            </>
          ) : (
            <Select
              label="Room"
              value={room}
              onChange={(e) => setRoom(e.target.value)}
              options={ROOM_OPTIONS}
              placeholder="Select room"
              disabled={!isEditMode}
            />
          )}

          <Textarea
            label="Remarks"
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            placeholder="Agenda or notes for this session…"
            rows={3}
            disabled={!isEditMode}
          />
        </div>

        {isEditMode && (
          <div className="crm-outreach-panel__footer">
            {startAt && (
              <div className="crm-outreach-panel__footer-secondary">
                <Button
                  type="button"
                  size="sm"
                  variant="outline-primary"
                  icon={FiCalendar}
                  onClick={() => window.open(buildGoogleCalendarUrl({
                    title: calendarTitle,
                    startAt,
                    description: remark,
                    location: calendarLocation,
                  }), '_blank', 'noopener')}
                >
                  Google Calendar
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  icon={FiDownload}
                  onClick={() => downloadIcsFile({
                    title: calendarTitle,
                    startAt,
                    description: remark,
                    uid: `appt-${enquiryId}-${Date.now()}`,
                  })}
                >
                  .ics
                </Button>
              </div>
            )}
            <Button
              type="button"
              size="sm"
              icon={FiPlus}
              onClick={book}
              loading={isLoading}
              className="crm-outreach-panel__cta"
            >
              Book appointment
            </Button>
          </div>
        )}

        {isEditMode && history.length > 0 && (
          <div className="crm-outreach-feed">
            <div className="crm-outreach-feed__head">
              <span className="crm-outreach-feed__title">Scheduled</span>
              <span className="crm-outreach-feed__count">{history.length}</span>
            </div>
            <ul className="crm-outreach-feed__list crm-outreach-feed__list--cards">
              {history.slice(0, 4).map((row) => {
                const counsellorName = row.counsellor
                  ? `${row.counsellor.firstName} ${row.counsellor.lastName || ''}`.trim()
                  : row.user
                    ? `${row.user.firstName} ${row.user.lastName || ''}`.trim()
                    : 'Unassigned';
                return (
                  <li key={row.id} className="crm-outreach-appt-card">
                    <div className="crm-outreach-appt-card__top">
                      <time className="crm-outreach-appt-card__when">{formatApptWhen(row.startAt)}</time>
                      <span className="crm-outreach-appt-card__mode">
                        {getAppointmentModeLabel(row.mode)}
                      </span>
                    </div>
                    <p className="crm-outreach-appt-card__counsellor">{counsellorName}</p>
                    <p className="crm-outreach-appt-card__meta">
                      {row.mode === 'ONLINE'
                        ? getMeetingPlatformLabel(row.platform)
                        : (row.room || 'Room TBA')}
                    </p>
                    {row.meetingLink && (
                      <a
                        href={row.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="crm-outreach-appt-card__link"
                      >
                        Join meeting
                      </a>
                    )}
                    {row.remark && (
                      <p className="crm-outreach-appt-card__remark">{row.remark}</p>
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
