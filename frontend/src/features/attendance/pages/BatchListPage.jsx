import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FiUsers, FiPlus } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import ContentLoader from '../../../components/ui/ContentLoader';
import { ROUTES } from '../../../config/routes';
import { PERMISSIONS } from '../../../config/permissions';
import PermissionGate from '../../../components/common/PermissionGate';
import { useGetBatchesQuery, useCreateBatchMutation } from '../redux/attendanceApiSlice';
import { userService } from '../../../services/user/user.service';
import toastService from '../../../services/toast/toast.service';

function instructorLabel(user) {
  if (!user) return 'Unassigned';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
}

export default function BatchListPage() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetBatchesQuery();
  const [createBatch, { isLoading: creating }] = useCreateBatchMutation();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [room, setRoom] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [teacherOptions, setTeacherOptions] = useState([]);

  const batches = data?.data || [];

  useEffect(() => {
    let cancelled = false;
    userService.getAll({ role: 'teacher', status: 'ACTIVE', limit: 100 })
      .then((res) => {
        if (cancelled) return;
        const rows = res.data || [];
        setTeacherOptions([
          { value: '', label: 'No instructor yet' },
          ...rows.map((u) => ({ value: u.id, label: instructorLabel(u) })),
        ]);
      })
      .catch(() => {
        if (!cancelled) setTeacherOptions([{ value: '', label: 'No instructor yet' }]);
      });
    return () => { cancelled = true; };
  }, []);

  const submit = async () => {
    if (!name.trim() || !courseName.trim()) {
      toastService.info('Name and course are required');
      return;
    }
    try {
      const created = await createBatch({
        name: name.trim(),
        courseName: courseName.trim(),
        room: room.trim() || undefined,
        instructorId: instructorId || undefined,
      }).unwrap();
      toastService.success('Batch created');
      setOpen(false);
      setName('');
      setCourseName('');
      setRoom('');
      setInstructorId('');
      const id = created?.id || created?.data?.id;
      if (id) navigate(ROUTES.BATCH_DETAIL(id));
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not create batch');
    }
  };

  return (
    <ModulePageCard
      title="Batches"
      subtitle="Coaching batches, timetable, and class attendance"
      icon={FiUsers}
      breadcrumbs={[{ label: 'Dashboard', path: ROUTES.DASHBOARD }, { label: 'Batches' }]}
      actions={(
        <PermissionGate permission={PERMISSIONS.ATTENDANCE_EDIT}>
          <Button size="sm" icon={FiPlus} onClick={() => setOpen((v) => !v)}>New Batch</Button>
        </PermissionGate>
      )}
    >
      <div className="flex-1 min-h-0 overflow-auto p-4 space-y-4">
        {open && (
          <Card className="p-4 grid grid-cols-1 sm:grid-cols-5 gap-3">
            <Input label="Batch name" value={name} onChange={(e) => setName(e.target.value)} placeholder="IELTS Batch A" />
            <Input label="Course" value={courseName} onChange={(e) => setCourseName(e.target.value)} placeholder="IELTS" />
            <Input label="Room" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="Room 2" />
            <Select
              label="Instructor (Teacher)"
              value={instructorId}
              onChange={(e) => setInstructorId(e.target.value)}
              options={teacherOptions}
              placeholder="Select teacher"
            />
            <div className="flex items-end">
              <Button onClick={submit} loading={creating}>Create</Button>
            </div>
          </Card>
        )}
        {isLoading ? <ContentLoader variant="module" /> : batches.length === 0 ? (
          <EmptyState title="No batches yet" description="Create a batch, enroll students, add a timetable, then take attendance from each scheduled class." />
        ) : (
          <div className="grid gap-3">
            {batches.map((batch) => (
              <button
                key={batch.id}
                type="button"
                className="text-left rounded-lg border border-border bg-card-bg p-4 hover:bg-surface-hover"
                onClick={() => navigate(ROUTES.BATCH_DETAIL(batch.id))}
              >
                <p className="font-semibold text-text">{batch.name}</p>
                <p className="text-xs text-text-muted mt-0.5">Instructor: {instructorLabel(batch.instructor)}</p>
                <p className="text-sm text-text-muted mt-1">
                  {batch.courseName} · {batch.branch?.name || 'Branch'} · {batch._count?.enrollments || 0} students
                </p>
              </button>
            ))}
          </div>
        )}
      </div>
    </ModulePageCard>
  );
}
