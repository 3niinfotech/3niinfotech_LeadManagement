import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector } from 'react-redux';
import { FiSave, FiRotateCcw, FiBookmark } from 'react-icons/fi';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import Button from '../../../../components/ui/Button';
import FormSection from '../../../../components/ui/FormSection';
import { walkInFormSchema } from '../../schemas/walkinSchema';
import { WALKIN_SOURCES } from '../../config/walkin.constants';
import { selectUser } from '../../../../redux/slices/authSlice';
import { useGetWalkInBranchesQuery } from '../../redux/walkinApiSlice';
import { useWalkInDuplicateCheck } from '../../hooks/useWalkInDuplicateCheck';
import DuplicateDetectionPanel from './DuplicateDetectionPanel';

const DRAFT_KEY = 'crm-enquiry-visitor-draft';

const defaultValues = {
  phone: '',
  fullName: '',
  email: '',
  city: '',
  interestedCountry: '',
  interestedCourse: '',
  source: 'Walk-in',
  branchId: '',
  notes: '',
};

export default function QuickRegistrationPanel({
  onSubmit,
  loading,
  onOpenProfile,
  focusSignal = 0,
}) {
  const user = useSelector(selectUser);
  const phoneRef = useRef(null);
  const { data: branchesData } = useGetWalkInBranchesQuery();
  const branches = branchesData ?? [];
  const defaultBranchId = user?.branchId || branches[0]?.id || '';

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

  const phone = watch('phone');
  const branchId = watch('branchId') || defaultBranchId;
  const { match, hasDuplicate } = useWalkInDuplicateCheck({ phone, branchId, enabled: Boolean(branchId) });

  const phoneReg = register('phone');

  useEffect(() => {
    reset({ ...defaultValues, branchId: defaultBranchId });
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) reset({ ...defaultValues, ...JSON.parse(raw), branchId: defaultBranchId });
    } catch { /* ignore */ }
  }, [defaultBranchId, reset]);

  useEffect(() => {
    if (defaultBranchId) setValue('branchId', defaultBranchId);
  }, [defaultBranchId, setValue]);

  useEffect(() => {
    if (focusSignal) phoneRef.current?.focus();
  }, [focusSignal]);

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(watch()));
  };

  const clearForm = () => {
    localStorage.removeItem(DRAFT_KEY);
    reset({ ...defaultValues, branchId: defaultBranchId });
    phoneRef.current?.focus();
  };

  const submit = (data) => {
    if (hasDuplicate && match) return;
    onSubmit({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || null,
      city: data.city || null,
      interestedCountry: data.interestedCountry || null,
      interestedCourse: data.interestedCourse || null,
      source: data.source,
      branchId: data.branchId || defaultBranchId,
      notes: data.notes || null,
      priority: 'NORMAL',
      assignedToId: null,
    });
    localStorage.removeItem(DRAFT_KEY);
  };

  return (
    <div className="crm-reception-register" id="enquiry-visitor-registration-form">
      <div className="crm-reception-register__head">
        <div>
          <h3 className="crm-reception-register__title">Register Visitor</h3>
          <p className="crm-reception-register__sub">Minimal check-in · mobile + name only</p>
        </div>
        <span className="crm-reception-register__kbd">Tab to move · Enter to save</span>
      </div>

      <form className="crm-reception-register__form" onSubmit={handleSubmit(submit)}>
        <FormSection
          title="Visitor Check-in"
          description="Mobile + name only. Counsellor collects detailed information later."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="sm:col-span-2">
              <Input
                label="Mobile Number *"
                placeholder="10-digit mobile — live duplicate check"
                error={errors.phone?.message}
                autoComplete="tel"
                {...phoneReg}
                ref={(el) => {
                  phoneRef.current = el;
                  phoneReg.ref(el);
                }}
              />
            </div>

            <DuplicateDetectionPanel
              match={hasDuplicate ? match : null}
              onContinueExisting={onOpenProfile}
              onOpenProfile={onOpenProfile}
              onDismiss={() => setValue('phone', '')}
            />

            <div className="sm:col-span-2">
              <Input
                label="Full Name *"
                placeholder="Visitor full name"
                error={errors.fullName?.message}
                {...register('fullName')}
              />
            </div>
            <Input label="Email" type="email" placeholder="Optional" {...register('email')} />
            <Input label="City" placeholder="Optional" {...register('city')} />
            <Input label="Interested Country" placeholder="e.g. Canada" {...register('interestedCountry')} />
            <Input label="Interested Course" placeholder="e.g. MBA" {...register('interestedCourse')} />
            <Controller
              name="source"
              control={control}
              render={({ field }) => (
                <Select
                  label="Source"
                  options={WALKIN_SOURCES.map((s) => ({ value: s, label: s }))}
                  value={field.value}
                  onChange={(e) => field.onChange(e.target.value)}
                  allowClear={false}
                />
              )}
            />
            <div className="sm:col-span-2">
              <Textarea
                label="Notes"
                rows={2}
                placeholder="Optional remarks for counsellor"
                {...register('notes')}
              />
            </div>
          </div>
        </FormSection>

        <p className="crm-reception-register__hint text-[11px] text-text-muted px-0.5">
          System auto-assigns token, checks duplicates, notifies counsellor, and logs timeline + audit.
          Passport, academics, and documents are collected in later stages.
        </p>

        <div className="crm-reception-register__actions">
          <Button type="submit" icon={FiSave} loading={loading} disabled={hasDuplicate}>
            Register Visitor
          </Button>
          <Button type="button" variant="outline" icon={FiRotateCcw} onClick={clearForm}>
            Clear
          </Button>
          <Button type="button" variant="ghost" icon={FiBookmark} onClick={saveDraft}>
            Save Draft
          </Button>
        </div>
      </form>
    </div>
  );
}
