import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector } from 'react-redux';
import { FiSave } from 'react-icons/fi';
import Modal from '../../../../components/ui/Modal';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/ui/FormSection';
import { walkInFormSchema } from '../../schemas/walkinSchema';
import { WALKIN_SOURCES, WALKIN_PRIORITIES } from '../../config/walkin.constants';
import { selectUser } from '../../../../redux/slices/authSlice';
import {
  useGetWalkInBranchesQuery,
  useGetWalkInCounsellorsQuery,
} from '../../redux/walkinApiSlice';

const EMPTY_LIST = Object.freeze([]);

const defaultValues = {
  fullName: '',
  phone: '',
  country: '',
  interestedCourse: '',
  source: 'Walk-in',
  branchId: '',
  assignedToId: '',
  priority: 'NORMAL',
  notes: '',
};

export default function WalkInFormModal({ open, onClose, onSubmit, loading }) {
  const user = useSelector(selectUser);
  const { data: branchesData } = useGetWalkInBranchesQuery(undefined, { skip: !open });
  const branches = branchesData ?? EMPTY_LIST;
  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(walkInFormSchema),
    defaultValues,
    mode: 'onTouched',
  });

  const branchId = watch('branchId');
  const { data: counsellorsData } = useGetWalkInCounsellorsQuery(branchId, { skip: !branchId });
  const counsellors = counsellorsData ?? EMPTY_LIST;
  const defaultBranchId = user?.branchId || branches[0]?.id || '';

  useEffect(() => {
    if (!open) return;
    reset({
      ...defaultValues,
      branchId: defaultBranchId,
    });
  }, [open, reset, defaultBranchId]);

  const submit = (data) => {
    onSubmit({
      ...data,
      assignedToId: data.assignedToId || null,
      country: data.country || null,
      interestedCourse: data.interestedCourse || null,
      notes: data.notes || null,
    });
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="New Walk-in"
      subtitle="Register the visitor in under a minute — counsellor continues from here."
      size="md"
      variant="form"
      className="crm-walkin-form-modal"
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button icon={FiSave} onClick={handleSubmit(submit)} loading={loading}>
            Register &amp; Generate Token
          </Button>
        </>
      )}
    >
      <form className="crm-walkin-form space-y-4" onSubmit={handleSubmit(submit)}>
        <FormSection title="Visitor" description="Only essentials — no admission form">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Full Name *"
                placeholder="e.g. Smit Patel"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
            </div>
            <Input
              label="Mobile Number *"
              placeholder="10-digit mobile"
              error={errors.phone?.message}
              {...register('phone')}
            />
            <Input
              label="Interested Country"
              placeholder="Optional"
              {...register('country')}
            />
            <Input
              label="Interested Course"
              placeholder="Optional"
              className="sm:col-span-2"
              {...register('interestedCourse')}
            />
          </div>
        </FormSection>

        <FormSection title="Routing">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Select
                  label="Lead Source"
                  error={errors.source?.message}
                  options={WALKIN_SOURCES.map((s) => ({ value: s, label: s }))}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  allowClear={false}
                />
              )}
            />
            <Controller
              name="branchId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Branch *"
                  error={errors.branchId?.message}
                  options={branches.map((b) => ({ value: b.id, label: b.name }))}
                  value={field.value}
                  onChange={(e) => {
                    field.onChange(e.target.value);
                    setValue('assignedToId', '');
                  }}
                  allowClear={false}
                />
              )}
            />
            <Controller
              name="assignedToId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Assign Counsellor"
                  options={[
                    { value: '', label: 'Auto / Unassigned' },
                    ...counsellors.map((u) => ({
                      value: u.id,
                      label: `${u.firstName} ${u.lastName || ''}`.trim(),
                    })),
                  ]}
                  value={field.value ?? ''}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
            />
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <Select
                  label="Priority"
                  options={WALKIN_PRIORITIES.map((p) => ({ value: p.value, label: p.label }))}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  allowClear={false}
                />
              )}
            />
            <div className="sm:col-span-2">
              <Textarea
                label="Remarks"
                placeholder="Optional note for counsellor"
                rows={2}
                {...register('notes')}
              />
            </div>
          </div>
        </FormSection>
      </form>
    </Modal>
  );
}
