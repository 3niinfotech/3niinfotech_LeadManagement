import { useState } from 'react';
import { FiMonitor, FiPlus } from 'react-icons/fi';
import DatePicker from '../../../../components/ui/DatePicker';
import Input from '../../../../components/ui/Input';
import Textarea from '../../../../components/ui/Textarea';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/ui/FormSection';
import ScrollArea from '../../../../components/ui/ScrollArea';
import Badge from '../../../../components/ui/Badge';
import {
  DEMO_ATTENDANCE_OPTIONS,
  DEMO_RESULT_OPTIONS,
  DEMO_CLASSES,
  DEMO_BATCHES,
  getDemoAttendanceLabel,
  getDemoResultLabel,
  getDemoAttendanceTone,
  getDemoResultTone,
} from '../../config/enquiryDemo.config';
import { useCounsellorOptions } from '../../hooks/useCounsellorOptions';
import { combineDateAndTime } from '../../utils/enquiryForm.utils';
import { useAddDemoMutation } from '../../redux/enquiryApiSlice';
import toastService from '../../../../services/toast/toast.service';

function formatFacultyName(user) {
  if (!user) return '—';
  return `${user.firstName} ${user.lastName || ''}`.trim();
}

export default function DemoTab({ enquiryId, enquiry, isEditMode, onRecorded }) {
  const { options: facultyOptions, loading: facultyLoading } = useCounsellorOptions({
    branchId: enquiry?.branchId,
  });
  const [addDemo, { isLoading }] = useAddDemoMutation();

  const [demoDate, setDemoDate] = useState('');
  const [demoTime, setDemoTime] = useState('10:00');
  const [facultyId, setFacultyId] = useState('');
  const [className, setClassName] = useState('');
  const [batch, setBatch] = useState('');
  const [attendance, setAttendance] = useState('NOT_MARKED');
  const [feedback, setFeedback] = useState('');
  const [result, setResult] = useState('PENDING');
  const [remark, setRemark] = useState('');

  const history = enquiry?.demos || [];

  const resetForm = () => {
    setDemoDate('');
    setDemoTime('10:00');
    setFacultyId('');
    setClassName('');
    setBatch('');
    setAttendance('NOT_MARKED');
    setFeedback('');
    setResult('PENDING');
    setRemark('');
  };

  const recordDemo = async () => {
    if (!isEditMode || !enquiryId) {
      toastService.info('Save the enquiry first');
      return;
    }
    if (!demoDate) {
      toastService.info('Demo date is required');
      return;
    }

    try {
      await addDemo({
        id: enquiryId,
        demoDate: combineDateAndTime(demoDate, demoTime),
        facultyId: facultyId || undefined,
        className: className.trim() || undefined,
        batch: batch.trim() || undefined,
        attendance,
        feedback: feedback.trim() || undefined,
        result,
        remark: remark.trim() || undefined,
      }).unwrap();

      resetForm();
      toastService.success('Demo recorded');
      onRecorded?.();
    } catch (e) {
      toastService.error(e?.data?.message || 'Failed to record demo');
    }
  };

  return (
    <FormSection
      title="Demo Management"
      description="Schedule demos and capture attendance, feedback, and outcomes."
    >
      <div className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3.5">
          <DatePicker
            label="Demo Date"
            value={demoDate}
            onChange={setDemoDate}
            placeholder="Pick demo date"
            disabled={!isEditMode}
          />
          <Input
            label="Time"
            type="time"
            value={demoTime}
            onChange={(e) => setDemoTime(e.target.value)}
            disabled={!isEditMode}
          />
          <Select
            label="Faculty"
            value={facultyId}
            onChange={(e) => setFacultyId(e.target.value)}
            options={facultyOptions}
            placeholder="Select faculty"
            loading={facultyLoading}
            disabled={!isEditMode}
          />
          <Input
            label="Class"
            value={className}
            onChange={(e) => setClassName(e.target.value)}
            placeholder="e.g. IELTS Foundation"
            list="demo-class-suggestions"
            disabled={!isEditMode}
          />
          <datalist id="demo-class-suggestions">
            {DEMO_CLASSES.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
          <Input
            label="Batch"
            value={batch}
            onChange={(e) => setBatch(e.target.value)}
            placeholder="e.g. Morning A"
            list="demo-batch-suggestions"
            disabled={!isEditMode}
          />
          <datalist id="demo-batch-suggestions">
            {DEMO_BATCHES.map((b) => (
              <option key={b} value={b} />
            ))}
          </datalist>
          <Select
            label="Attendance"
            value={attendance}
            onChange={(e) => setAttendance(e.target.value)}
            options={DEMO_ATTENDANCE_OPTIONS}
            disabled={!isEditMode}
          />
          <Select
            label="Result"
            value={result}
            onChange={(e) => setResult(e.target.value)}
            options={DEMO_RESULT_OPTIONS}
            disabled={!isEditMode}
          />
          <div className="sm:col-span-2">
            <Textarea
              label="Feedback"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Student or counsellor feedback from the demo session..."
              rows={2}
              disabled={!isEditMode}
            />
          </div>
          <div className="sm:col-span-2">
            <Textarea
              label="Remarks"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Internal notes or follow-up actions..."
              rows={2}
              disabled={!isEditMode}
            />
          </div>
        </div>

        {isEditMode && (
          <div className="flex flex-wrap items-center gap-2">
            <Button
              type="button"
              size="sm"
              icon={FiPlus}
              onClick={recordDemo}
              loading={isLoading}
              className="ml-auto"
            >
              Record Demo
            </Button>
          </div>
        )}

        {isEditMode && history.length > 0 && (
          <div className="pt-2 border-t border-border">
            <p className="text-[11px] font-semibold text-text-muted uppercase tracking-wide mb-2">
              Demo history
            </p>
            <ScrollArea axis="x" className="rounded-lg border border-border">
              <table className="w-full text-[12px]">
                <thead className="bg-row-hover text-left text-text-secondary">
                  <tr>
                    <th className="px-3 py-2 font-semibold">Demo Date</th>
                    <th className="px-3 py-2 font-semibold">Faculty</th>
                    <th className="px-3 py-2 font-semibold">Class</th>
                    <th className="px-3 py-2 font-semibold">Batch</th>
                    <th className="px-3 py-2 font-semibold">Attendance</th>
                    <th className="px-3 py-2 font-semibold">Feedback</th>
                    <th className="px-3 py-2 font-semibold">Result</th>
                    <th className="px-3 py-2 font-semibold">Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {history.map((row) => (
                    <tr key={row.id} className="border-t border-border">
                      <td className="px-3 py-2 whitespace-nowrap tabular-nums">
                        {new Date(row.demoDate).toLocaleString('en-IN')}
                      </td>
                      <td className="px-3 py-2">{formatFacultyName(row.faculty)}</td>
                      <td className="px-3 py-2">{row.className || '—'}</td>
                      <td className="px-3 py-2">{row.batch || '—'}</td>
                      <td className="px-3 py-2">
                        <Badge color={getDemoAttendanceTone(row.attendance)} className="text-[10px]">
                          {getDemoAttendanceLabel(row.attendance)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 max-w-[160px] truncate">{row.feedback || '—'}</td>
                      <td className="px-3 py-2">
                        <Badge color={getDemoResultTone(row.result)} className="text-[10px]">
                          {getDemoResultLabel(row.result)}
                        </Badge>
                      </td>
                      <td className="px-3 py-2 max-w-[140px] truncate">{row.remark || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </ScrollArea>
          </div>
        )}

        {isEditMode && history.length === 0 && (
          <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-border rounded-lg">
            <FiMonitor className="w-8 h-8 text-text-muted mb-2" />
            <p className="text-sm text-text-muted">No demos recorded yet.</p>
            <p className="text-[12px] text-text-secondary mt-1">
              Use the form above to schedule and log demo sessions.
            </p>
          </div>
        )}
      </div>
    </FormSection>
  );
}
