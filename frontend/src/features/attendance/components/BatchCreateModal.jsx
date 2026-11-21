import { useEffect, useState } from 'react';
import { FiPlus, FiEdit2 } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { useCreateBatchMutation, useUpdateBatchMutation } from '../redux/attendanceApiSlice';
import { userService } from '../../../services/user/user.service';
import toastService from '../../../services/toast/toast.service';

function instructorLabel(user) {
  if (!user) return 'Unassigned';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
}

export default function BatchCreateModal({ open, onClose, onCreated, batch = null }) {
  const isEdit = Boolean(batch?.id);
  const [createBatch, { isLoading: isCreating }] = useCreateBatchMutation();
  const [updateBatch, { isLoading: isUpdating }] = useUpdateBatchMutation();
  const isLoading = isCreating || isUpdating;

  const [name, setName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [room, setRoom] = useState('');
  const [instructorId, setInstructorId] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [teacherOptions, setTeacherOptions] = useState([{ value: '', label: 'No instructor yet' }]);

  useEffect(() => {
    if (!open) return undefined;
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
  }, [open]);

  useEffect(() => {
    if (open && batch) {
      setName(batch.name || '');
      setCourseName(batch.courseName || '');
      setRoom(batch.room || '');
      setInstructorId(batch.instructorId || batch.instructor?.id || '');
      setIsActive(batch.isActive !== false);
    } else if (open) {
      setName('');
      setCourseName('');
      setRoom('');
      setInstructorId('');
      setIsActive(true);
    }
  }, [open, batch]);

  const submit = async () => {
    if (!name.trim() || !courseName.trim()) {
      toastService.info('Name and course are required');
      return;
    }
    try {
      if (isEdit) {
        await updateBatch({
          id: batch.id,
          name: name.trim(),
          courseName: courseName.trim(),
          room: room.trim() || null,
          instructorId: instructorId || null,
          isActive,
        }).unwrap();
        toastService.success(`Batch "${name.trim()}" updated successfully`);
        onCreated?.(batch.id);
        onClose?.();
      } else {
        const created = await createBatch({
          name: name.trim(),
          courseName: courseName.trim(),
          room: room.trim() || undefined,
          instructorId: instructorId || undefined,
          isActive,
        }).unwrap();
        toastService.success(`Batch "${name.trim()}" created successfully`);
        onCreated?.(created?.id || created?.data?.id);
        onClose?.();
      }
    } catch (e) {
      toastService.error(e?.data?.message || (isEdit ? 'Could not update batch' : 'Could not create batch'));
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={isEdit ? 'Edit Batch' : 'New Batch'}
      subtitle={isEdit ? `Update details and assignments for ${batch?.code || 'batch'}` : 'Name, course, room, and teacher'}
      size="md"
      compact
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button
            icon={isEdit ? FiEdit2 : FiPlus}
            loading={isLoading}
            onClick={submit}
          >
            {isEdit ? 'Update Batch' : 'Create Batch'}
          </Button>
        </>
      )}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Input
          label="Batch name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="IELTS Batch A — Morning"
        />
        <Input
          label="Course"
          required
          value={courseName}
          onChange={(e) => setCourseName(e.target.value)}
          placeholder="IELTS"
        />
        <Input
          label="Room"
          value={room}
          onChange={(e) => setRoom(e.target.value)}
          placeholder="Room 2"
        />
        <Select
          label="Instructor (Teacher)"
          value={instructorId}
          onChange={(e) => setInstructorId(e.target.value)}
          options={teacherOptions}
          placeholder="Select teacher"
        />
        {isEdit && (
          <div className="sm:col-span-2">
            <Select
              label="Batch Status"
              value={isActive ? 'active' : 'inactive'}
              onChange={(e) => setIsActive(e.target.value === 'active')}
              options={[
                { value: 'active', label: 'Active (Ongoing)' },
                { value: 'inactive', label: 'Inactive / Completed' },
              ]}
              allowClear={false}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
