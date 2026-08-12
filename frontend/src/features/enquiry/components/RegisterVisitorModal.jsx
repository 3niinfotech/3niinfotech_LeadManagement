import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector, useDispatch } from 'react-redux';
import { FiSave } from 'react-icons/fi';
import Modal from '../../../components/ui/Modal';
import Input from '../../../components/ui/Input';
import Select from '../../../components/ui/Select';
import CreatableSelect from '../../../components/ui/CreatableSelect';
import Textarea from '../../../components/ui/Textarea';
import Button from '../../../components/ui/Button';
import { selectUser } from '../../../redux/slices/authSlice';
import { useCreateWalkInMutation } from '../../walkin/redux/walkinApiSlice';
import { useCounsellorOptions } from '../hooks/useCounsellorOptions';
import { useLazyResolveIdentityQuery } from '../../assignment/redux/assignmentApiSlice';
import { useFeature } from '../../../hooks/useFeature';
import { useMasterOptions } from '../../master/hooks/useMasterOptions';
import { visitorRegisterSchema } from '../schemas/visitorRegisterSchema';
import toastService from '../../../services/toast/toast.service';
import { getUserBranchId } from '../../../utils/userContext';
import { enquiryApi } from '../redux/enquiryApiSlice';

function useDebounced(value, delay = 450) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function RegisterVisitorModal({
  open,
  onClose,
  onRegistered,
  onOpenLead,
  onOpenEnquiry,
  onOpenStudent,
}) {
  const dispatch = useDispatch();
  const user = useSelector(selectUser);
  const branchId = getUserBranchId(user);
  const { enabled: manualCounsellor } = useFeature('reception.manual_counsellor_selection');
  const { enabled: autoAssign } = useFeature('reception.auto_counsellor_assignment');
  const { enabled: tokenSystem } = useFeature('reception.token_system');
  const [createWalkIn, { isLoading }] = useCreateWalkInMutation();
  const showCounsellorPicker = manualCounsellor && !autoAssign;

  const { options: counsellorOptions, loading: counsellorsLoading } = useCounsellorOptions({
    branchId,
    enabled: Boolean(open && showCounsellorPicker && branchId),
  });

  const {
    options: visitPurposeOptions,
    loading: purposesLoading,
    ensureOption: ensureVisitPurpose,
  } = useMasterOptions('visit-purpose', { enabled: open });

  const [resolveIdentity] = useLazyResolveIdentityQuery();
  const [identity, setIdentity] = useState(null);

  const {
    register,
    handleSubmit,
    watch,
    reset,
    control,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(visitorRegisterSchema),
    defaultValues: {
      fullName: '',
      phone: '',
      visitPurpose: '',
      email: '',
      notes: '',
      assignedToId: '',
      branchId,
    },
  });

  const phone = watch('phone');
  const debouncedPhone = useDebounced(phone?.trim() || '');

  useEffect(() => {
    if (!open) {
      reset({
        fullName: '',
        phone: '',
        visitPurpose: '',
        email: '',
        notes: '',
        assignedToId: '',
        branchId,
      });
      setIdentity(null);
      return;
    }
    if (branchId) {
      reset((current) => ({ ...current, branchId }));
    }
  }, [open, reset, branchId]);

  useEffect(() => {
    if (!branchId || debouncedPhone.length < 8) {
      setIdentity(null);
      return;
    }
    resolveIdentity({ phone: debouncedPhone, branchId })
      .unwrap()
      .then((res) => setIdentity(res))
      .catch(() => setIdentity(null));
  }, [debouncedPhone, branchId, resolveIdentity]);

  const onInvalid = (formErrors) => {
    const first = Object.values(formErrors).find((e) => e?.message);
    toastService.error(first?.message || 'Please complete all required fields');
  };

  const submit = async (data) => {
    if (identity?.matchType === 'STUDENT') {
      onOpenStudent?.(identity.record);
      onClose();
      return;
    }
    if (identity?.matchType === 'ENQUIRY') {
      onOpenEnquiry?.(identity.record.id);
      onClose();
      return;
    }
    if (identity?.matchType === 'LEAD') {
      onOpenLead?.(identity.record.id);
      onClose();
      return;
    }

    try {
      const effectiveBranchId = data.branchId || branchId;
      if (!effectiveBranchId) {
        toastService.error('Your account has no branch assigned. Contact admin.');
        return;
      }
      const visitPurpose = await ensureVisitPurpose(data.visitPurpose);
      const assignedToId = data.assignedToId?.trim() || null;
      const result = await createWalkIn({
        fullName: data.fullName,
        phone: data.phone,
        email: data.email || null,
        visitPurpose: visitPurpose || data.visitPurpose,
        notes: data.notes || null,
        branchId: effectiveBranchId,
        source: 'Walk-in',
        priority: 'NORMAL',
        assignedToId,
      }).unwrap();
      const lead = result?.data ?? result;
      const enquiry = lead?.enquiry;
      const code = enquiry?.enquiryCode || lead?.leadCode || '';
      const visitorName = data.fullName?.trim() || 'Visitor';
      const tokenMsg = tokenSystem && lead.tokenNumber ? ` · Token ${lead.tokenNumber}` : '';
      toastService.success(
        code
          ? `${code} — ${visitorName} added to enquiry list${tokenMsg}`
          : `${visitorName} registered${tokenMsg}`,
      );
      onRegistered?.(lead);
      onClose();
    } catch (e) {
      const msg = e?.data?.message || 'Registration failed';
      if (e?.status === 409) {
        toastService.warning(msg);
        dispatch(enquiryApi.util.invalidateTags(['EnquiryList', 'EnquirySummary']));
        onRegistered?.();
        onClose();
      } else toastService.error(msg);
    }
  };

  const identityBanner = () => {
    if (!identity || identity.matchType === 'NEW') return null;
    const labels = {
      STUDENT: 'Existing student',
      ENQUIRY: 'Existing enquiry',
      LEAD: 'Active visitor in queue',
    };
    const rec = identity.record;
    const name = rec.firstName
      ? `${rec.firstName} ${rec.lastName || ''}`.trim()
      : rec.studentCode || rec.enquiryCode || rec.leadCode;
    return (
      <div className="crm-identity-banner mb-3">
        <p className="crm-identity-banner__title">{labels[identity.matchType]} found</p>
        <p className="crm-identity-banner__sub">
          {name} — system will open existing record instead of creating duplicate.
        </p>
      </div>
    );
  };

  const subtitle = autoAssign
    ? 'Counsellor assigned automatically'
    : showCounsellorPicker
      ? 'Select counsellor manually (Simple Mode)'
      : 'Register walk-in visitor';

  const counsellorSelectOptions = [
    { value: '', label: 'Unassigned' },
    ...counsellorOptions,
  ];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Register Visitor"
      subtitle={subtitle}
      size="md"
      compact
      footer={(
        <>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button icon={FiSave} loading={isLoading} onClick={handleSubmit(submit, onInvalid)}>
            {identity?.matchType && identity.matchType !== 'NEW' ? 'Open Existing' : 'Register Visitor'}
          </Button>
        </>
      )}
    >
      {identityBanner()}
      <form className="space-y-3" onSubmit={handleSubmit(submit, onInvalid)}>
        <input type="hidden" {...register('branchId')} />
        <Input
          placeholder="10-digit mobile"
          error={errors.phone?.message}
          {...register('phone')}
        />
        <Input
          label="Full Name *"
          placeholder="Visitor full name"
          error={errors.fullName?.message}
          {...register('fullName')}
        />
        <div className="space-y-3">
          <Controller
            name="visitPurpose"
            control={control}
            render={({ field }) => (
              <CreatableSelect
                label="Visit Purpose *"
                placeholder="Select purpose"
                hint="Pick from list or type a new purpose"
                options={visitPurposeOptions}
                loading={purposesLoading}
                allowClear={false}
                searchable
                value={field.value || undefined}
                onChange={(e) => field.onChange(e.target.value)}
                error={errors.visitPurpose?.message}
              />
            )}
          />
          {showCounsellorPicker ? (
            <Controller
              name="assignedToId"
              control={control}
              render={({ field }) => (
                <Select
                  label="Assign Counsellor"
                  placeholder={counsellorsLoading ? 'Loading…' : 'Select counsellor'}
                  options={counsellorSelectOptions}
                  loading={counsellorsLoading}
                  searchable
                  value={field.value || ''}
                  onChange={(e) => field.onChange(e.target.value)}
                  hint={counsellorOptions.length === 0 && !counsellorsLoading
                    ? 'No counsellors — add users with Counsellor role'
                    : undefined}
                />
              )}
            />
          ) : null}
        </div>
        <Input label="Email" type="email" placeholder="Optional" {...register('email')} />
        <Textarea label="Notes" rows={2} placeholder="Optional remarks" {...register('notes')} />
      </form>
    </Modal>
  );
}
