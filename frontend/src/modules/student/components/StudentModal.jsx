import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import toastService from '../../../services/toast/toast.service';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Button from '../../../components/ui/Button';
import { createStudent } from '../redux/studentSlice';
import { selectUser } from '../../../redux/slices/authSlice';
import { MESSAGES } from '../../../config/messages';

const schema = z.object({
  firstName: z.string().min(1, 'Required'),
  lastName: z.string().min(1, 'Required'),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().optional(),
  country: z.string().optional(),
  course: z.string().optional(),
  university: z.string().optional(),
  intake: z.string().optional(),
  branchId: z.string().uuid('Branch is required'),
});

export default function StudentModal({ open, onClose, onSuccess }) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const branchId = user?.branch?.id;

  const { register, handleSubmit, reset, setValue, formState: { errors, isSubmitting } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { branchId: '' },
  });

  useEffect(() => {
    if (branchId) setValue('branchId', branchId);
  }, [branchId, setValue]);

  const onSubmit = async (data) => {
    const result = await dispatch(createStudent({ ...data, email: data.email || null }));
    if (createStudent.fulfilled.match(result)) {
      toastService.action.saved(MESSAGES.SAVE_SUCCESS);
      reset();
      onClose();
      onSuccess?.();
    }
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add Student"
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleSubmit(onSubmit)} loading={isSubmitting}>Save Student</Button>
        </>
      }
    >
      <form className="grid grid-cols-2 gap-4">
        <Input label="First Name" error={errors.firstName?.message} {...register('firstName')} />
        <Input label="Last Name" error={errors.lastName?.message} {...register('lastName')} />
        <Input label="Email" type="email" error={errors.email?.message} {...register('email')} />
        <Input label="Phone" {...register('phone')} />
        <Input label="Country" {...register('country')} />
        <Input label="Course" {...register('course')} />
        <Input label="University" {...register('university')} />
        <Input label="Intake" {...register('intake')} />
        <input type="hidden" {...register('branchId')} />
      </form>
    </Modal>
  );
}
