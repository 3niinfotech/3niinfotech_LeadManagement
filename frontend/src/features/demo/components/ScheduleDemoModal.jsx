import { useState, useEffect } from 'react';
import { FiSearch, FiUser, FiCalendar, FiClock, FiBookOpen } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import DatePicker from '../../../components/ui/DatePicker';
import Textarea from '../../../components/ui/Textarea';
import { DEMO_CLASSES, DEMO_BATCHES } from '../config/demoConstants';
import { useGetEnquiriesQuery, useAddDemoMutation } from '../../enquiry/redux/enquiryApiSlice';
import { useRelationalMasterOptions } from '../../master/hooks/useRelationalMasterOptions';
import { combineDateAndTime } from '../../enquiry/utils/enquiryForm.utils';
import toastService from '../../../services/toast/toast.service';

export default function ScheduleDemoModal({
  open,
  onClose,
  initialEnquiry = null,
  onSuccess,
}) {
  const [addDemo, { isLoading: submitting }] = useAddDemoMutation();
  const { options: facultyOptions, loading: facultyLoading } = useRelationalMasterOptions('faculty', {}, { enabled: Boolean(open) });

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedEnquiry, setSelectedEnquiry] = useState(initialEnquiry);
  const [demoDate, setDemoDate] = useState('');
  const [demoTime, setDemoTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [facultyId, setFacultyId] = useState('');
  const [className, setClassName] = useState('');
  const [batch, setBatch] = useState('');
  const [remark, setRemark] = useState('');

  const { data: searchResults, isFetching: searching } = useGetEnquiriesQuery(
    { search: searchQuery, limit: 8 },
    { skip: !open || selectedEnquiry || searchQuery.length < 2 },
  );

  const enquiryList = searchResults?.data || [];

  useEffect(() => {
    if (open) {
      if (initialEnquiry) {
        setSelectedEnquiry(initialEnquiry);
        setClassName(initialEnquiry.interestedCourse || '');
      } else {
        setSelectedEnquiry(null);
        setClassName('');
      }
      // default demo date to tomorrow if not set
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      setDemoDate(tomorrow.toISOString().slice(0, 10));
      setDemoTime('10:00');
      setEndTime('11:00');
      setFacultyId('');
      setBatch('');
      setRemark('');
      setSearchQuery('');
    }
  }, [open, initialEnquiry]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedEnquiry?.id) {
      toastService.error('Please select an enquiry or student');
      return;
    }
    if (!demoDate) {
      toastService.error('Please choose a demo date');
      return;
    }

    try {
      const startIso = combineDateAndTime(demoDate, demoTime);
      const endIso = combineDateAndTime(demoDate, endTime);

      await addDemo({
        id: selectedEnquiry.id,
        demoDate: startIso,
        endAt: endIso,
        facultyId: facultyId || undefined,
        className: className.trim() || selectedEnquiry.interestedCourse || undefined,
        batch: batch.trim() || undefined,
        attendance: 'NOT_MARKED',
        result: 'PENDING',
        remark: remark.trim() || undefined,
      }).unwrap();

      toastService.success('Demo session scheduled successfully');
      onSuccess?.();
      onClose();
    } catch (err) {
      toastService.error(err?.data?.message || 'Failed to schedule demo');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Schedule Demo Session"
      subtitle="Select a student/enquiry and set up a trial demo class."
      size="lg"
      footer={
        <>
          <Button variant="outline" type="button" onClick={onClose} disabled={submitting}>
            Cancel
          </Button>
          <Button
            variant="primary"
            type="submit"
            form="schedule-demo-form"
            loading={submitting}
            disabled={!selectedEnquiry}
          >
            Schedule Demo
          </Button>
        </>
      }
    >
      <form id="schedule-demo-form" onSubmit={handleSubmit} className="space-y-4">
        {/* Enquiry Selector */}
        <div>
          <label className="block text-xs font-semibold text-text mb-1.5">
            Student / Enquiry <span className="text-danger">*</span>
          </label>

          {selectedEnquiry ? (
            <div className="flex items-center justify-between p-3 rounded-lg border border-primary/30 bg-primary/5">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-primary/20 text-primary flex items-center justify-center font-bold text-sm">
                  {selectedEnquiry.firstName?.[0]}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-text">
                    {selectedEnquiry.firstName} {selectedEnquiry.lastName || ''}
                  </h4>
                  <div className="flex items-center gap-2 text-xs text-text-muted">
                    <span className="font-mono">{selectedEnquiry.enquiryCode}</span>
                    {selectedEnquiry.mobile && <span>· {selectedEnquiry.mobile}</span>}
                    {selectedEnquiry.interestedCourse && <span>· {selectedEnquiry.interestedCourse}</span>}
                  </div>
                </div>
              </div>
              {!initialEnquiry && (
                <Button
                  variant="outline"
                  size="xs"
                  type="button"
                  onClick={() => {
                    setSelectedEnquiry(null);
                    setSearchQuery('');
                  }}
                >
                  Change
                </Button>
              )}
            </div>
          ) : (
            <div className="relative">
              <div className="relative">
                <FiSearch className="absolute left-3 top-3 text-text-muted w-4 h-4" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Type name, phone, email or enquiry ID..."
                  className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-border bg-input-bg text-text focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary"
                />
              </div>

              {searching && (
                <div className="text-xs text-text-muted py-2 px-1">Searching enquiries...</div>
              )}

              {enquiryList.length > 0 && (
                <div className="mt-1 border border-border rounded-lg bg-card-bg shadow-lg max-h-48 overflow-y-auto divide-y divide-border">
                  {enquiryList.map((enq) => (
                    <button
                      key={enq.id}
                      type="button"
                      className="w-full text-left p-2.5 hover:bg-surface-hover flex items-center justify-between transition-colors"
                      onClick={() => {
                        setSelectedEnquiry(enq);
                        if (enq.interestedCourse && !className) {
                          setClassName(enq.interestedCourse);
                        }
                      }}
                    >
                      <div>
                        <div className="font-medium text-sm text-text">
                          {enq.firstName} {enq.lastName || ''}
                        </div>
                        <div className="text-xs text-text-muted">
                          {enq.enquiryCode} {enq.mobile ? `· ${enq.mobile}` : ''} {enq.interestedCourse ? `· ${enq.interestedCourse}` : ''}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-primary">Select</span>
                    </button>
                  ))}
                </div>
              )}

              {searchQuery.length >= 2 && !searching && enquiryList.length === 0 && (
                <div className="text-xs text-text-muted py-2 px-1">No matching enquiries found.</div>
              )}
            </div>
          )}
        </div>

        {/* Date and Time Pickers */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <DatePicker
              label="Demo Date"
              value={demoDate}
              onChange={setDemoDate}
              placeholder="Select date"
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

        {/* Course and Faculty */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-text mb-1">Course / Class</label>
            <div className="space-y-1.5">
              <Select
                value={DEMO_CLASSES.includes(className) ? className : 'other'}
                onChange={(e) => {
                  if (e.target.value !== 'other') setClassName(e.target.value);
                }}
                placeholder="Choose standard course"
              >
                {DEMO_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
                <option value="other">Custom Course Name...</option>
              </Select>
              {(!DEMO_CLASSES.includes(className) || className === 'other') && (
                <Input
                  placeholder="Enter course name"
                  value={className === 'other' ? '' : className}
                  onChange={(e) => setClassName(e.target.value)}
                  size="sm"
                />
              )}
            </div>
          </div>

          <div>
            <Select
              label="Faculty / Trainer"
              value={facultyId}
              onChange={(e) => setFacultyId(e.target.value)}
              placeholder={facultyLoading ? 'Loading faculty...' : 'Assign faculty (optional)'}
            >
              <option value="">Unassigned</option>
              {(facultyOptions || []).map((f) => (
                <option key={f.value || f.id} value={f.value || f.id}>
                  {f.label || f.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Batch & Notes */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <Select
              label="Batch / Slot"
              value={batch}
              onChange={(e) => setBatch(e.target.value)}
              placeholder="Select batch timing (optional)"
            >
              <option value="">No specific batch</option>
              {DEMO_BATCHES.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Input
              label="Batch / Classroom Details"
              placeholder="e.g. Room 204 / Zoom Link"
              value={batch.includes('(') ? '' : batch}
              onChange={(e) => setBatch(e.target.value)}
            />
          </div>
        </div>

        <div>
          <Textarea
            label="Remarks / Special Instructions"
            placeholder="e.g. Student requested focus on Speaking section..."
            value={remark}
            onChange={(e) => setRemark(e.target.value)}
            rows={2}
          />
        </div>
      </form>
    </Modal>
  );
}
