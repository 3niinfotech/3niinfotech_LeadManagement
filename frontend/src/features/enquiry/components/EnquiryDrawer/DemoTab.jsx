import { useState, useMemo } from 'react';
import {
  FiMonitor,
  FiPlus,
  FiRefreshCw,
} from 'react-icons/fi';
import { usePermissions } from '../../../../hooks/usePermissions';
import DatePicker from '../../../../components/ui/DatePicker';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Button from '../../../../components/ui/Button';
import Badge from '../../../../components/ui/Badge';
import DataGrid from '../../../../components/table/DataGrid';
import { createActionsColumn } from '../../../../components/table/grid.columns';
import {
  DEMO_RESULT_OPTIONS,
  DEMO_CLASSES,
  DEMO_BATCHES,
  DEMO_SESSION_STATUS_OPTIONS,
  getDemoAttendanceLabel,
  getDemoResultLabel,
  getDemoAttendanceTone,
  getDemoResultTone,
} from '../../config/enquiryDemo.config';
import { useRelationalMasterOptions } from '../../../master/hooks/useRelationalMasterOptions';
import { combineDateAndTime } from '../../utils/enquiryForm.utils';
import { useAddDemoMutation } from '../../redux/enquiryApiSlice';
import { PERMISSIONS } from '../../../../config/permissions';
import toastService from '../../../../services/toast/toast.service';
import { GridActionButton, GridActionGroup } from '../../../../components/table/GridActionButtons';
import MarkAttendanceModal from '../../../demo/components/MarkAttendanceModal';
import RescheduleDemoModal from '../../../demo/components/RescheduleDemoModal';
import CancelDemoModal from '../../../demo/components/CancelDemoModal';

const centerCell = 'crm-grid-cell--center';
const centerHeader = 'crm-grid-header-cell--center';

function formatFacultyName(faculty) {
  if (!faculty) return '—';
  if (faculty.name) return faculty.name;
  return `${faculty.firstName || ''} ${faculty.lastName || ''}`.trim() || '—';
}

function formatDemoDateTime(dateStr) {
  if (!dateStr) return { date: '—', time: '' };
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return { date: '—', time: '' };

  return {
    date: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    time: d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }),
  };
}

export default function DemoTab({ enquiryId, enquiry, isEditMode, onRecorded }) {
  const { canAny } = usePermissions();
  const canSchedule = canAny([PERMISSIONS.ENQUIRIES_UPDATE, PERMISSIONS.CALENDAR_CREATE]);
  const { options: facultyOptions, loading: facultyLoading } = useRelationalMasterOptions('faculty', {}, { enabled: true });
  const [addDemo, { isLoading }] = useAddDemoMutation();

  // Form State
  const [demoDate, setDemoDate] = useState('');
  const [demoTime, setDemoTime] = useState('10:00');
  const [endTime, setEndTime] = useState('11:00');
  const [facultyId, setFacultyId] = useState('');
  const [className, setClassName] = useState(enquiry?.interestedCourse || '');
  const [batch, setBatch] = useState('Morning A');
  const [result, setResult] = useState('PENDING');
  const [feedback, setFeedback] = useState('');
  const [remark, setRemark] = useState('');

  // Modals state
  const [selectedDemo, setSelectedDemo] = useState(null);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
  const [cancelModalOpen, setCancelModalOpen] = useState(false);

  const history = enquiry?.demos || [];

  const resetForm = () => {
    setDemoDate('');
    setDemoTime('10:00');
    setEndTime('11:00');
    setFacultyId('');
    setClassName(enquiry?.interestedCourse || '');
    setBatch('Morning A');
    setResult('PENDING');
    setFeedback('');
    setRemark('');
  };

  const recordDemo = async (e) => {
    e?.preventDefault();
    if (!enquiryId) {
      toastService.info('Please save the enquiry first');
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
        endAt: combineDateAndTime(demoDate, endTime),
        facultyId: facultyId || undefined,
        className: className.trim() || undefined,
        batch: batch.trim() || undefined,
        attendance: 'NOT_MARKED',
        feedback: feedback.trim() || undefined,
        result,
        remark: remark.trim() || undefined,
      }).unwrap();

      resetForm();
      toastService.success('Demo session scheduled successfully');
      onRecorded?.();
    } catch (err) {
      toastService.error(err?.data?.message || 'Failed to record demo session');
    }
  };

  const handleActionSuccess = () => {
    onRecorded?.();
  };

  const columns = useMemo(() => [
    {
      field: 'demoDate',
      headerName: 'Date & Time',
      width: 145,
      minWidth: 135,
      cellClass: `tabular-nums ${centerCell}`,
      headerClass: centerHeader,
      cellRenderer: (p) => {
        const dt = formatDemoDateTime(p.value);
        return (
          <div className="leading-tight py-1">
            <span className="font-semibold text-text">{dt.date}</span>
            <span className="block text-[11px] text-text-muted">{dt.time}</span>
          </div>
        );
      },
    },
    {
      field: 'faculty',
      headerName: 'Faculty',
      width: 140,
      minWidth: 120,
      cellClass: `text-text-secondary ${centerCell}`,
      headerClass: centerHeader,
      valueGetter: (p) => formatFacultyName(p.data?.faculty),
    },
    {
      field: 'className',
      headerName: 'Course',
      width: 130,
      minWidth: 110,
      cellClass: `font-medium text-text ${centerCell}`,
      headerClass: centerHeader,
      valueGetter: (p) => p.data?.className || '—',
    },
    {
      field: 'batch',
      headerName: 'Batch',
      width: 110,
      minWidth: 95,
      cellClass: `text-text-secondary ${centerCell}`,
      headerClass: centerHeader,
      valueGetter: (p) => p.data?.batch || 'Standard',
    },
    {
      field: 'sessionStatus',
      headerName: 'Session',
      width: 120,
      minWidth: 105,
      cellClass: centerCell,
      headerClass: centerHeader,
      cellRenderer: (p) => {
        const val = p.value;
        const color = val === 'CANCELLED' ? 'danger' : val === 'RESCHEDULED' ? 'warning' : 'secondary';
        const label = DEMO_SESSION_STATUS_OPTIONS.find((s) => s.value === val)?.label || val || 'Scheduled';
        return <Badge color={color} size="sm">{label}</Badge>;
      },
    },
    {
      field: 'attendance',
      headerName: 'Attendance',
      width: 125,
      minWidth: 110,
      cellClass: centerCell,
      headerClass: centerHeader,
      cellRenderer: (p) => (
        <Badge color={getDemoAttendanceTone(p.value)} size="sm">
          {getDemoAttendanceLabel(p.value)}
        </Badge>
      ),
    },
    {
      field: 'result',
      headerName: 'Outcome',
      width: 120,
      minWidth: 105,
      cellClass: centerCell,
      headerClass: centerHeader,
      cellRenderer: (p) => (
        <Badge color={getDemoResultTone(p.value)} size="sm">
          {getDemoResultLabel(p.value)}
        </Badge>
      ),
    },
    {
      field: 'feedback',
      headerName: 'Feedback / Remarks',
      flex: 1,
      minWidth: 160,
      cellClass: `text-text-secondary text-xs crm-grid-cell--truncate ${centerCell}`,
      headerClass: centerHeader,
      valueGetter: (p) => p.data?.feedback || p.data?.remark || '—',
      tooltipValueGetter: (p) => p.value || '',
    },
    createActionsColumn({
      width: 110,
      pinned: 'right',
      cellRenderer: (p) => {
        const row = p.data;
        if (!row) return null;
        const isInactive = row.sessionStatus === 'CANCELLED' || row.sessionStatus === 'RESCHEDULED';
        if (isInactive) return <span className="text-text-muted text-xs">—</span>;

        return (
          <GridActionGroup>
            <GridActionButton
              action="attendance"
              title="Mark Attendance & Outcome"
              onClick={() => {
                setSelectedDemo({ ...row, enquiry });
                setAttendanceModalOpen(true);
              }}
            />

            <GridActionButton
              action="schedule"
              title="Reschedule Demo"
              onClick={() => {
                setSelectedDemo({ ...row, enquiry });
                setRescheduleModalOpen(true);
              }}
            />

            <GridActionButton
              action="cancel"
              title="Cancel Demo"
              onClick={() => {
                setSelectedDemo({ ...row, enquiry });
                setCancelModalOpen(true);
              }}
            />
          </GridActionGroup>
        );
      },
    }),
  ], [enquiry]);

  return (
    <div className="space-y-6">
      {/* 6-Column Schedule Form with integrated action buttons in Row 2 */}
      {canSchedule && (
        <div className="p-5 rounded-2xl bg-surface border border-border shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border">
            <div>
              <h3 className="text-sm font-bold text-text flex items-center gap-2">
                <FiMonitor className="w-4 h-4 text-primary" />
                Schedule New Trial / Demo Session
              </h3>
              <p className="text-xs text-text-muted mt-0.5">
                Assign faculty trainer, course, batch timing, and trial slots.
              </p>
            </div>
          </div>

          <div className="space-y-3.5">
            {/* Row 1: 6-Column Grid for Scheduling Parameters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3.5">
              <div>
                <DatePicker
                  label="Demo Date"
                  value={demoDate}
                  onChange={setDemoDate}
                  placeholder="Pick date"
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

              <div>
                <Select
                  label="Faculty"
                  value={facultyId}
                  onChange={(e) => setFacultyId(e.target.value)}
                  placeholder={facultyLoading ? 'Loading...' : 'Select faculty'}
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
                  placeholder="e.g. IELTS"
                  list="demo-class-suggestions"
                />
                <datalist id="demo-class-suggestions">
                  {DEMO_CLASSES.map((c) => (
                    <option key={c} value={c} />
                  ))}
                </datalist>
              </div>

              <div>
                <Input
                  label="Batch / Slot"
                  value={batch}
                  onChange={(e) => setBatch(e.target.value)}
                  placeholder="e.g. Morning A"
                  list="demo-batch-suggestions"
                />
                <datalist id="demo-batch-suggestions">
                  {DEMO_BATCHES.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>
            </div>

            {/* Row 2: 3 Inputs + Integrated Right-Side Action Buttons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5 pt-0.5">
              <div className="lg:col-span-1">
                <Select
                  label="Expected Outcome"
                  value={result}
                  onChange={(e) => setResult(e.target.value)}
                >
                  {DEMO_RESULT_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label}
                    </option>
                  ))}
                </Select>
              </div>

              <div className="lg:col-span-2">
                <Input
                  label="Student Feedback (Optional)"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Initial student response / expectations..."
                />
              </div>

              <div className="lg:col-span-2">
                <Input
                  label="Internal Remarks (Optional)"
                  value={remark}
                  onChange={(e) => setRemark(e.target.value)}
                  placeholder="Counsellor / staff internal note..."
                />
              </div>

              <div className="lg:col-span-1 flex items-end justify-end gap-1.5 pb-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={resetForm}
                  className="px-2.5"
                  title="Reset form"
                >
                  Reset
                </Button>

                <Button
                  type="button"
                  variant="primary"
                  size="sm"
                  icon={FiPlus}
                  loading={isLoading}
                  onClick={recordDemo}
                  className="w-auto px-4 whitespace-nowrap"
                >
                  Schedule
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Common DataGrid Table for Demo History */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-text uppercase tracking-wider">
            Demo History ({history.length})
          </h3>
        </div>

        <div className="w-full">
          <DataGrid
            columns={columns}
            rowData={history}
            loading={false}
            fitContent={true}
            pagination={history.length > 10}
            paginationPageSize={10}
            hideSinglePagePagination={true}
            emptyTitle="No demo sessions recorded yet"
            emptyDescription="Use the form above to schedule trial classes and log student attendance."
            getRowId={(p) => p.data.id}
          />
        </div>
      </div>

      {/* Interactive Modals */}
      <MarkAttendanceModal
        open={attendanceModalOpen}
        onClose={() => {
          setAttendanceModalOpen(false);
          setSelectedDemo(null);
        }}
        demo={selectedDemo}
        onSuccess={handleActionSuccess}
      />

      <RescheduleDemoModal
        open={rescheduleModalOpen}
        onClose={() => {
          setRescheduleModalOpen(false);
          setSelectedDemo(null);
        }}
        demo={selectedDemo}
        onSuccess={handleActionSuccess}
      />

      <CancelDemoModal
        open={cancelModalOpen}
        onClose={() => {
          setCancelModalOpen(false);
          setSelectedDemo(null);
        }}
        demo={selectedDemo}
        onSuccess={handleActionSuccess}
      />
    </div>
  );
}
