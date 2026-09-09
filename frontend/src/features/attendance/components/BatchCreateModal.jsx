import { useEffect, useState } from 'react';
import { FiPlus } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import { useCreateBatchMutation } from '../redux/attendanceApiSlice';
import { userService } from '../../../services/user/user.service';
import toastService from '../../../services/toast/toast.service';

function instructorLabel(user) {
  if (!user) return 'Unassigned';
  return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
}

export default function BatchCreateModal({ open, onClose, onCreated }) {
  const [createBatch, { isLoading }] = useCreateBatchMutation();
  const [name, setName] = useState('');
  const [courseName, setCourseName] = useState('');
  const [room, setRoom] = useState('');
  const [instructorId, setInstructorId] = useState('');
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
    if (!open) {
      setName('');
      setCourseName('');
      setRoom('');
      setInstructorId('');
    }
  }, [open]);

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
      onCreated?.(created?.id || created?.data?.id);
      onClose?.();
    } catch (e) {
      toastService.error(e?.data?.message || 'Could not create batch');
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New batch"
      subtitle="Name, course, room, and teacher"
      size="md"
      compact
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button icon={FiPlus} loading={isLoading} onClick={submit}>Create batch</Button>
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
      </div>
    </Modal>
  );
}
