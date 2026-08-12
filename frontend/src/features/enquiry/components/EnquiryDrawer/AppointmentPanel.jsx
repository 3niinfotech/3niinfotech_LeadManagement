import { useEffect, useState } from 'react';
import { FiCalendar, FiDownload, FiMapPin, FiVideo, FiPlus } from 'react-icons/fi';
import DatePicker from '../../../../components/ui/DatePicker';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/ui/FormSection';
import ScrollArea from '../../../../components/ui/ScrollArea';
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
      description="Book counselling with counsellor, room, and online or offline mode."
    >
      <div className="space-y-4">
        <div className="crm-followup-appointment-fields">
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
          <div className="col-span-full">
            <span className="block text-[12px] font-medium text-text mb-1.5">Mode</span>
            <div className="crm-appointment-mode" role="group" aria-label="Appointment mode">
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
              <div className="col-span-full">
                <span className="block text-[12px] font-medium text-text mb-1.5">Platform</span>
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
              <div className="col-span-full">
                <Input
                  label="Meeting Link"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://meet.google.com/..."
                  disabled={!isEditMode}
                />
              </div>
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

          <div className="col-span-full">
            <Textarea
              label="Remarks"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Agenda or notes for this session..."
              rows={2}
              disabled={!isEditMode}
            />
          </div>
        </div>

        {isEditMode && (
          <div className="flex flex-wrap items-center gap-2">
            {startAt && (
              <>
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
                  Download .ics
                </Button>
              </>
            )}
            <Button
              type="button"
              size="sm"
              icon={FiPlus}
              onClick={book}
              loading={isLoading}
              className="ml-auto"
            >
              Book Appointment
            </Button>
          </div>
        )}

        {isEditMode && history.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">
              Scheduled appointments
            </p>
            <ScrollArea axis="x" className="rounded-lg border border-border">
              <table className="w-full text-[12px]">
                <thead className="bg-row-hover text-left text-text-secondary">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Date & Time</th>
                    <th className="px-3 py-2 font-semibold">Counsellor</th>
                    <th className="px-3 py-2 font-semibold">Mode</th>
                    <th className="px-3 py-2 font-semibold">Room / Platform</th>
                    <th className="px-3 py-2 font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                        {new Date(row.startAt).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2">
                        {row.counsellor
                          ? `${row.counsellor.firstName} ${row.counsellor.lastName || ''}`.trim()
                          : row.user
                            ? `${row.user.firstName} ${row.user.lastName || ''}`.trim()
                            : '—'}
                      </td>
                      <td className="px-3 py-2">{getAppointmentModeLabel(row.mode)}</td>
                      <td className="px-3 py-2">
                        {row.mode === 'ONLINE'
                          ? getMeetingPlatformLabel(row.platform)
                          : row.room || '—'}
                        {row.meetingLink && (
                          <a
                            href={row.meetingLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="block text-[10px] text-brand truncate max-w-[140px]"
                          >
                            Join link
                          </a>
                        )}
                      </td>
                      <td className="px-3 py-2 max-w-[160px] truncate">{row.remark || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}
      </div>
    </FormSection>
  );
}
