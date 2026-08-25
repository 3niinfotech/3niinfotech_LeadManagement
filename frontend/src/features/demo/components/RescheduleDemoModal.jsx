import { useState, useEffect } from 'react';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import DatePicker from '../../../components/ui/DatePicker';
import Textarea from '../../../components/ui/Textarea';
import { useRescheduleDemoMutation } from '../../enquiry/redux/enquiryApiSlice';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import { combineDateAndTime } from '../../enquiry/utils/enquiryForm.utils';
import toastService from '../../../services/toast/toast.service';

export default function RescheduleDemoModal({
  open,
  onClose,
  demo,
  onSuccess,
}) {
  const [rescheduleDemo, { isLoading: submitting }] = useRescheduleDemoMutation();
  const { options: facultyOptions, loading: facultyLoading } = useRelationalMasterOptions('faculty', {}, { enabled: Boolean(open) });

  const [demoDate, setDemoDate] = useState('');
  const [demoTime, setDemoTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [facultyId, setFacultyId] = useState('');
  const [className, setClassName] = useState('');
  const [batch, setBatch] = useState('');
  const [remark, setRemark] = useState('');

  useEffect(() => {
    if (open && demo) {
      const current = demo.demoDate ? new Date(demo.demoDate) : new Date();
      // default next date to 2 days after or tomorrow
      const nextDate = new Date(current);
      nextDate.setDate(nextDate.getDate() + 2);
      setDemoDate(nextDate.toISOString().slice(0, 10));

      const timeHours = String(current.getHours()).padStart(2, '0');
      const timeMins = String(current.getMinutes()).padStart(2, '0');
      setDemoTime(`${timeHours}:${timeMins}`);

      if (demo.endAt) {
        const endD = new Date(demo.endAt);
        const endHours = String(endD.getHours()).padStart(2, '0');
        const endMins = String(endD.getMinutes()).padStart(2, '0');
        setEndTime(`${endHours}:${endMins}`);
      } else {
        const endD = new Date(current.getTime() + 60 * 60 * 1000);
        setEndTime(`${String(endD.getHours()).padStart(2, '0')}:${String(endD.getMinutes()).padStart(2, '0')}`);
      }

      setFacultyId(demo.facultyId || '');
      setClassName(demo.className || '');
      setBatch(demo.batch || '');
      setRemark('');
    }
  }, [open, demo]);

  if (!demo) return null;

  const enquiry = demo.enquiry || {};
  const enquiryId = enquiry.id || demo.enquiryId;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!enquiryId) {
      toastService.error('Missing enquiry reference for this demo');
      return;
    }
    if (!demoDate) {
      toastService.error('Please pick a new date');
      return;
    }

    try {
      const startIso = combineDateAndTime(demoDate, demoTime);
      const endIso = combineDateAndTime(demoDate, endTime);

      await rescheduleDemo({
        id: enquiryId,
        demoId: demo.id,
        demoDate: startIso,
        endAt: endIso,
        facultyId: facultyId || undefined,
        className: className.trim() || undefined,
        batch: batch.trim() || undefined,
        remark: remark.trim() || 'Demo session rescheduled',
      }).unwrap();

      toastService.success('Demo session rescheduled successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toastService.error(err?.data?.message || 'Failed to reschedule demo');
    }
  };

  const studentName = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim() || 'Student';
  const currentDateFormatted = demo.demoDate
    ? new Date(demo.demoDate).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
      })
    : '—';

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Reschedule Demo Session"
      subtitle={`Reschedule trial for ${studentName}`}
      size="md"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="warning"
            type="submit"
            form="reschedule-demo-form"
            loading={submitting}
          >
            Confirm Reschedule
          </Button>
        </>
      }
    >
      <form id="reschedule-demo-form" onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-300">
          <span className="font-semibold">Current Schedule:</span> {currentDateFormatted} (Course: {demo.className || enquiry.interestedCourse || '—'})
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <DatePicker
              label="New Demo Date"
              value={demoDate}
              onChange={setDemoDate}
              placeholder="Pick new date"
              required
            />
          </div>
          <div>
            <Input
              label="Start Time"
              type="time"
              value={demoTime}
              onChange={(e) => setDemoTime(e.target.value)}
              required
            />
          </div>
          <div>
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Select
              label="Faculty / Trainer"
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              placeholder={facultyLoading ? 'Loading faculty...' : 'Select faculty'}
            >
              <option value="">Unassigned</option>
              {(facultyOptions || []).map((f) => (
                <option key={f.value || f.id} value={f.value || f.id}>
                  {f.label || f.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Input
              label="Course / Class"
              value={className}
              onChange={(e) => setClassName(e.target.value)}
              placeholder="Course name"
            />
          </div>
        </div>

        <div>
          <Textarea
            label="Reason for Rescheduling / Remarks"
            placeholder="e.g. Student was unwell, requested Saturday morning slot..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={2}
          />
        </div>
      </form>
    </Modal>
  );
}
