import { useEffect, useState } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import toastService from '../../../services/toast/toast.service';
import { calendarApi } from '../services/calendarApi.service';

function toLocalDateTime(value) {
  if (!value) return '';
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

/**
 * Quick create through Calendar-scoped endpoints (does not grant Enquiry workspace access).
 */
export default function CalendarQuickAddModal({
  open,
  mode, // 'followup' | 'appointment'
  onClose,
  onSuccess,
  defaultDate,
  counsellorOptions = [],
}) {
  const [enquiryId, setEnquiryId] = useState('');
  const [enquiryOptions, setEnquiryOptions] = useState([]);
  const [search, setSearch] = useState('');
  const [remark, setRemark] = useState('');
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [appointmentMode, setAppointmentMode] = useState('OFFLINE');
  const [room, setRoom] = useState('Reception');
  const [platform, setPlatform] = useState('GOOGLE_MEET');
  const [meetingLink, setMeetingLink] = useState('');
  const [counsellorId, setCounsellorId] = useState('');
  const [stage, setStage] = useState('CALL');
  const [saving, setSaving] = useState(false);
  const [searching, setSearching] = useState(false);

  const title = mode === 'appointment' ? 'Add appointment' : 'Add follow-up';

  useEffect(() => {
    if (!open) return;
    const start = defaultDate ? new Date(defaultDate) : new Date();
    if (start.getHours() === 0 && start.getMinutes() === 0) start.setHours(10, 0, 0, 0);
    setStartAt(toLocalDateTime(start));
    setEndAt(toLocalDateTime(new Date(start.getTime() + 30 * 60000)));
  }, [open, defaultDate, mode]);

  const searchEnquiries = async (term) => {
    setSearch(term);
    if (!term || term.length < 2) {
      setEnquiryOptions([]);
      return;
    }
    setSearching(true);
    try {
      const rows = await calendarApi.searchEnquiries(term) || [];
      setEnquiryOptions(rows.map((r) => ({
        value: r.id,
        label: `${r.enquiryCode || ''} · ${r.firstName || ''} ${r.lastName || ''}`.trim(),
      })));
    } catch {
      setEnquiryOptions([]);
    } finally {
      setSearching(false);
    }
  };

  const handleSave = async () => {
    if (!enquiryId) {
      toastService.error('Select an enquiry');
      return;
    }
    setSaving(true);
    try {
      if (mode === 'appointment') {
        if (!startAt) {
          toastService.error('Start time is required');
          setSaving(false);
          return;
        }
        if (endAt && new Date(endAt) <= new Date(startAt)) {
          toastService.error('End time must be after start time');
          setSaving(false);
          return;
        }
        if (appointmentMode === 'OFFLINE' && !room.trim()) {
          toastService.error('Room is required for an offline appointment');
          setSaving(false);
          return;
        }
        await calendarApi.createAppointment(enquiryId, {
          mode: appointmentMode,
          room: appointmentMode === 'OFFLINE' ? room.trim() : null,
          platform: appointmentMode === 'ONLINE' ? platform : null,
          meetingLink: appointmentMode === 'ONLINE' ? meetingLink.trim() || null : null,
          startAt: new Date(startAt).toISOString(),
          endAt: endAt ? new Date(endAt).toISOString() : null,
          counsellorId: counsellorId || null,
          remark: remark || undefined,
          title: 'Calendar appointment',
        });
        toastService.success('Appointment created');
      } else {
        await calendarApi.createFollowup(enquiryId, {
          stage,
          remark: remark || 'Follow-up from Calendar',
          nextDate: startAt
            ? new Date(startAt).toISOString()
            : (defaultDate ? new Date(defaultDate).toISOString() : new Date().toISOString()),
        });
        toastService.success('Follow-up created');
      }
      onSuccess?.();
      onClose?.();
      setEnquiryId('');
      setRemark('');
      setStartAt('');
      setSearch('');
      setEndAt('');
      setCounsellorId('');
      setMeetingLink('');
    } catch (e) {
      toastService.error(e?.response?.data?.message || e?.message || 'Create failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal open={open} onClose={onClose} title={title} size="md">
      <div className="space-y-3 p-1">
        <div>
          <label className="text-xs font-medium text-text-secondary">Search enquiry</label>
          <Input
            value={search}
            onChange={(e) => searchEnquiries(e.target.value)}
            placeholder="Name, mobile, enquiry code..."
          />
          {searching && <p className="text-[11px] text-text-muted mt-1">Searching…</p>}
        </div>
        {mode === 'followup' && (
          <Select
            label="Follow-up channel"
            value={stage}
            onChange={(e) => setStage(e.target.value)}
            options={[
              { value: 'CALL', label: 'Call' },
              { value: 'WHATSAPP', label: 'WhatsApp' },
              { value: 'EMAIL', label: 'Email' },
              { value: 'MEETING', label: 'Meeting' },
              { value: 'VIDEO_CALL', label: 'Video call' },
              { value: 'REMINDER', label: 'Reminder' },
            ]}
          />
        )}
        <Select
          label="Enquiry"
          value={enquiryId}
          onChange={(e) => setEnquiryId(e.target.value)}
          options={[{ value: '', label: 'Select enquiry' }, ...enquiryOptions]}
        />
        <div>
          <label className="text-xs font-medium text-text-secondary">
            {mode === 'appointment' ? 'Start' : 'Next follow-up'}
          </label>
          <input
            type="datetime-local"
            className="crm-input w-full rounded-lg border border-border px-3 py-2 text-sm mt-1"
            value={startAt}
            onChange={(e) => setStartAt(e.target.value)}
          />
        </div>
        {mode === 'appointment' && (
          <>
            <div>
              <label className="text-xs font-medium text-text-secondary">End</label>
              <input
                type="datetime-local"
                className="crm-input w-full rounded-lg border border-border px-3 py-2 text-sm mt-1"
                value={endAt}
                min={startAt}
                onChange={(e) => setEndAt(e.target.value)}
              />
            </div>
            <Select
              label="Counsellor"
              value={counsellorId}
              onChange={(e) => setCounsellorId(e.target.value)}
              options={[{ value: '', label: 'Use enquiry assignee' }, ...counsellorOptions]}
            />
            <Select
              label="Meeting mode"
              value={appointmentMode}
              onChange={(e) => setAppointmentMode(e.target.value)}
              options={[
                { value: 'OFFLINE', label: 'In person' },
                { value: 'ONLINE', label: 'Online' },
              ]}
            />
            {appointmentMode === 'OFFLINE' ? (
              <Input
                label="Room / location"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="Reception, Room A..."
              />
            ) : (
              <>
                <Select
                  label="Platform"
                  value={platform}
                  onChange={(e) => setPlatform(e.target.value)}
                  options={[
                    { value: 'GOOGLE_MEET', label: 'Google Meet' },
                    { value: 'ZOOM', label: 'Zoom' },
                  ]}
                />
                <Input
                  label="Meeting link"
                  value={meetingLink}
                  onChange={(e) => setMeetingLink(e.target.value)}
                  placeholder="https://..."
                />
              </>
            )}
          </>
        )}
        <Input
          label="Remark"
          value={remark}
          onChange={(e) => setRemark(e.target.value)}
          placeholder="Optional notes"
        />
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="primary" size="sm" loading={saving} onClick={handleSave}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
