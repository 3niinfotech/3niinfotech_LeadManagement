import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector, useDispatch } from 'react-redux';
import { FiSave, FiUserCheck, FiAlertCircle, FiUsers } from 'react-icons/fi';
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
import { useMasterOptions } from '../../master/hooks/useMasterOptions';
import { visitorRegisterSchema } from '../schemas/visitorRegisterSchema';
import toastService from '../../../services/toast/toast.service';
import { getUserBranchId } from '../../../utils/userContext';
import { enquiryApi } from '../redux/enquiryApiSlice';
import Avatar from '../../../components/ui/Avatar';
import { getDocumentUrl } from '../config/enquiryDocument.config';

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
  const [createWalkIn, { isLoading }] = useCreateWalkInMutation();
  const autoAssign = false;
  const showCounsellorPicker = true;

  const { options: counsellorOptions, loading: counsellorsLoading } = useCounsellorOptions({
    // Company-wide list — register pe koi bhi counsellor select kar sake (branch filter nahi)
    branchId: undefined,
    enabled: Boolean(open && showCounsellorPicker),
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
        assignedToId: user?.role?.slug === 'counsellor' ? (user.id || user._id) : '',
        branchId: branchId || '',
      });
      setIdentity(null);
      return;
    }
    reset({
      fullName: '',
      phone: '',
      visitPurpose: '',
      email: '',
      notes: '',
      assignedToId: user?.role?.slug === 'counsellor' ? (user.id || user._id) : '',
      branchId: branchId || '',
    });
  }, [open, reset, branchId, user]);

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
      const assignedToId = data.assignedToId?.trim();
      if (!assignedToId) {
        toastService.error('Select a counsellor before registering');
        return;
      }
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
      toastService.create(
        {
          title: `${visitorName} registered`,
          description: code
            ? `${code} · assigned to counsellor`
            : 'Walk-in created and assigned',
        },
        {
          label: 'Registered',
          id: lead?.id ? `visitor-reg-${lead.id}` : 'visitor-reg',
        },
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

  const hasExisting = Boolean(identity?.matchType && identity.matchType !== 'NEW');

  const identityBanner = () => {
    if (!hasExisting) return null;
    const labels = {
      STUDENT: 'Existing student found',
      ENQUIRY: 'Existing enquiry found',
      LEAD: 'Active visitor already registered',
    };
    const tones = {
      STUDENT: {
        wrap: 'border-info/30 bg-info-soft/60',
        icon: 'text-info bg-info/15',
        Icon: FiUserCheck,
      },
      ENQUIRY: {
        wrap: 'border-warning/35 bg-warning-soft/70',
        icon: 'text-warning bg-warning/15',
        Icon: FiAlertCircle,
      },
      LEAD: {
        wrap: 'border-brand/30 bg-brand-soft/70',
        icon: 'text-brand bg-brand/15',
        Icon: FiUsers,
      },
    };
    const rec = identity.record;
    const name = rec.firstName
      ? `${rec.firstName} ${rec.lastName || ''}`.trim()
      : rec.studentCode || rec.enquiryCode || rec.leadCode;
    const code = rec.enquiryCode || rec.studentCode || rec.leadCode || '';
    const registeredAt = rec.createdAt || rec.enquiry?.createdAt;
    const registeredOn = registeredAt
      ? new Date(registeredAt).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
      : null;
    const tone = tones[identity.matchType] || tones.ENQUIRY;
    const Icon = tone.Icon;
    const photoSrc = getDocumentUrl(rec.photoUrl) || '';

    return (
      <div className={`mb-4 flex items-start gap-3 rounded-xl border px-3.5 py-3 ${tone.wrap}`}>
        <span className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${tone.icon}`}>
          {photoSrc ? (
            <Avatar name={name} src={photoSrc} size="sm" className="!w-9 !h-9" />
          ) : (
            <Icon className="h-4 w-4" strokeWidth={2} />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-text leading-tight">
            {labels[identity.matchType]}
          </p>
          <p className="mt-1 text-[12px] text-text-secondary leading-snug">
            <span className="font-medium text-text">{name}</span>
            {code ? <span className="text-text-muted"> · {code}</span> : null}
          </p>
          {registeredOn ? (
            <p className="mt-1 text-[12px] text-text-secondary leading-snug">
              Registered on{' '}
              <span className="font-medium text-text">{registeredOn}</span>
            </p>
          ) : null}
          <p className="mt-1 text-[11px] text-text-muted leading-snug">
            A duplicate will not be created. Use Open Existing to continue with this record.
          </p>
        </div>
      </div>
    );
  };

  const subtitle = autoAssign
    ? 'Counsellor assigned automatically'
    : 'Select a counsellor, then register the walk-in';

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
            {hasExisting ? 'Open Existing' : 'Register Visitor'}
          </Button>
        </>
      )}
    >
      {identityBanner()}

      <form
        className={hasExisting ? 'opacity-60 pointer-events-none select-none' : undefined}
        onSubmit={handleSubmit(submit, onInvalid)}
        aria-disabled={hasExisting}
      >
        <input type="hidden" {...register('branchId')} />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-3.5 gap-y-3.5">
          <Input
            label="Mobile *"
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
          ) : (
            <Input
              label="Email"
              type="email"
              placeholder="Optional"
              {...register('email')}
            />
          )}

          {showCounsellorPicker ? (
            <div className="sm:col-span-2">
              <Input
                label="Email"
                type="email"
                placeholder="Optional"
                {...register('email')}
              />
            </div>
          ) : null}

          <div className="sm:col-span-2 pt-0.5">
            <Textarea
              label="Notes"
              rows={2}
              placeholder="Optional remarks"
              {...register('notes')}
            />
          </div>
        </div>
      </form>
    </Modal>
  );
}
