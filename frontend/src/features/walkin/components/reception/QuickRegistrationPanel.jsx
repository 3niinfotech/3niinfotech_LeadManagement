import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useSelector } from 'react-redux';
import { FiSave, FiRotateCcw, FiBookmark, FiRefreshCw, FiUserPlus } from 'react-icons/fi';
import IconBox from '../../../../components/ui/IconBox';
import Input from '../../../../components/ui/Input';
import Select from '../../../../components/ui/Select';
import Textarea from '../../../../components/ui/Textarea';
import Button from '../../../../components/ui/Button';
import { walkInFormSchema } from '../../schemas/walkinSchema';
import { WALKIN_SOURCES } from '../../config/walkin.constants';
import { selectUser } from '../../../../redux/slices/authSlice';
import {
  useGetWalkInBranchesQuery,
  useRecommendCounsellorsQuery,
} from '../../redux/walkinApiSlice';
import { useWalkInDuplicateCheck } from '../../hooks/useWalkInDuplicateCheck';
import { useRelationalMasterOptions } from '../../../master/hooks/useRelationalMasterOptions';
import DuplicateDetectionPanel from './DuplicateDetectionPanel';
import CounsellorRecommendPanel from './CounsellorRecommendPanel';
import toastService from '../../../../services/toast/toast.service';

const DRAFT_KEY = 'crm-enquiry-visitor-draft';
const PRESENCE_POLL_MS = 8000;
const OTHER = '__OTHER__';

const defaultValues = {
  phone: '',
  fullName: '',
  email: '',
  city: '',
  interestedCountry: '',
  interestedCourse: '',
  visitPurpose: '',
  source: 'Walk-in',
  branchId: '',
  assignedToId: '',
  notes: '',
};

function masterSelectOptions(rows = [], labelKey = 'name') {
  return (rows || [])
    .map((r) => {
      const label = r[labelKey] || r.name || r.label || r.code;
      const value = r.name || r.code || r.id;
      if (!label || !value) return null;
      return { value: String(value), label: String(label) };
    })
    .filter(Boolean);
}

function withOther(options) {
  return [...options, { value: OTHER, label: 'Other (type below)' }];
}

export default function QuickRegistrationPanel({
  onSubmit,
  loading,
  onOpenProfile,
  focusSignal = 0,
}) {
  const user = useSelector(selectUser);
  const phoneRef = useRef(null);
  const [countryMode, setCountryMode] = useState('');
  const [courseMode, setCourseMode] = useState('');
  const [purposeMode, setPurposeMode] = useState('');
  const { data: branchesData } = useGetWalkInBranchesQuery();
  const branches = branchesData ?? [];
  const defaultBranchId = user?.branchId || branches[0]?.id || '';

  const { options: countryRows, loading: countriesLoading } = useRelationalMasterOptions('country');
  const { options: courseRows, loading: coursesLoading } = useRelationalMasterOptions('course');
  const { options: purposeRows, loading: purposesLoading } = useRelationalMasterOptions('visit-purpose');

  const countryOptions = useMemo(() => withOther(masterSelectOptions(countryRows)), [countryRows]);
  const courseOptions = useMemo(() => withOther(masterSelectOptions(courseRows)), [courseRows]);
  const purposeOptions = useMemo(() => withOther(masterSelectOptions(purposeRows)), [purposeRows]);

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
  const interestedCountry = watch('interestedCountry');
  const interestedCourse = watch('interestedCourse');
  const assignedToId = watch('assignedToId');
  const { match, hasDuplicate } = useWalkInDuplicateCheck({ phone, branchId, enabled: Boolean(branchId) });

  const {
    data: recommendations = [],
    isLoading: recommendLoading,
    isFetching: recommending,
    isError: recommendError,
    error: recommendErr,
    refetch: refetchCounsellors,
  } = useRecommendCounsellorsQuery(
    {
      branchId,
      interestedCountry: interestedCountry || undefined,
      interestedCourse: interestedCourse || undefined,
    },
    {
      skip: !branchId,
      pollingInterval: PRESENCE_POLL_MS,
      refetchOnFocus: true,
      refetchOnMountOrArgChange: true,
    },
  );

  const phoneReg = register('phone');
  const branchName = branches.find((b) => b.id === branchId)?.name || '';
  const freeCounsellors = recommendations.filter(
    (r) => r.availability?.key === 'AVAILABLE',
  ).length;

  useEffect(() => {
    reset({ ...defaultValues, branchId: defaultBranchId });
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        reset({ ...defaultValues, ...parsed, branchId: defaultBranchId });
        if (parsed.interestedCountry) setCountryMode(OTHER);
        if (parsed.interestedCourse) setCourseMode(OTHER);
        if (parsed.visitPurpose) setPurposeMode(OTHER);
      }
    } catch { /* ignore */ }
  }, [defaultBranchId, reset]);

  useEffect(() => {
    if (defaultBranchId) setValue('branchId', defaultBranchId);
  }, [defaultBranchId, setValue]);

  useEffect(() => {
    if (focusSignal) phoneRef.current?.focus();
  }, [focusSignal]);

  useEffect(() => {
    if (assignedToId || !recommendations?.length) return;
    const top = recommendations.find((r) => r.recommended)
      || recommendations.find((r) => r.availability?.key === 'AVAILABLE')
      || recommendations[0];
    if (top?.id) setValue('assignedToId', top.id, { shouldValidate: true });
  }, [recommendations, assignedToId, setValue]);

  const saveDraft = () => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify(watch()));
    toastService.info('Draft saved on this device');
  };

  const clearForm = () => {
    localStorage.removeItem(DRAFT_KEY);
    reset({ ...defaultValues, branchId: defaultBranchId });
    setCountryMode('');
    setCourseMode('');
    setPurposeMode('');
    phoneRef.current?.focus();
  };

  const submit = (data) => {
    if (hasDuplicate && match) return;
    if (!data.assignedToId) {
      toastService.info('Select a counsellor');
      return;
    }
    onSubmit({
      fullName: data.fullName,
      phone: data.phone,
      email: data.email || null,
      city: data.city || null,
      interestedCountry: data.interestedCountry || null,
      interestedCourse: data.interestedCourse || null,
      visitPurpose: data.visitPurpose || 'Study Abroad Enquiry',
      source: data.source,
      branchId: data.branchId || defaultBranchId,
      notes: data.notes || null,
      priority: 'NORMAL',
      assignedToId: data.assignedToId,
    });
    localStorage.removeItem(DRAFT_KEY);
  };

  const bindMasterSelect = (mode, setMode, fieldName) => ({
    value: mode === OTHER ? OTHER : (watch(fieldName) || ''),
    onChange: (e) => {
      const v = e?.target ? e.target.value : e;
      if (v === OTHER) {
        setMode(OTHER);
        setValue(fieldName, '', { shouldValidate: true });
      } else {
        setMode(v);
        setValue(fieldName, v, { shouldValidate: true });
      }
    },
  });

  return (
    <div className="crm-reception-register" id="reception-registration-form">
      <header className="crm-reception-register__head">
        <div className="crm-reception-register__head-main">
          <IconBox icon={FiUserPlus} color="primary" size="sm" iconSize="sm" variant="header" />
          <div className="min-w-0">
            <h3 className="crm-reception-register__title">Register visitor</h3>
            <p className="crm-reception-register__sub">
              Mobile first — duplicates are checked automatically before you save.
            </p>
          </div>
        </div>
        <div className="crm-reception-register__head-meta">
          {branchName && <span className="crm-reception-register__head-chip">{branchName}</span>}
          {Boolean(recommendations.length) && (
            <span className="crm-reception-register__head-chip">
              {freeCounsellors} of {recommendations.length} counsellors free
            </span>
          )}
        </div>
      </header>

      <form className="crm-reception-register__body" onSubmit={handleSubmit(submit)}>
        <div className="crm-reception-register__cols">
          <section className="crm-reception-register__col">
            <h4 className="crm-reception-register__section-title">Visitor details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
              <Input
                label="Mobile"
                required
                error={errors.phone?.message}
                {...phoneReg}
                ref={(el) => {
                  phoneReg.ref(el);
                  phoneRef.current = el;
                }}
              />
              <Input label="Full name" required error={errors.fullName?.message} {...register('fullName')} />
              <Input label="Email" error={errors.email?.message} {...register('email')} />
              <Input label="City" {...register('city')} />

              <div>
                <Select
                  label="Interested country"
                  options={countryOptions}
                  loading={countriesLoading}
                  placeholder="Select country"
                  allowClear
                  {...bindMasterSelect(countryMode, setCountryMode, 'interestedCountry')}
                />
                {countryMode === OTHER && (
                  <Input className="mt-2" label="Other country" placeholder="Type country" {...register('interestedCountry')} />
                )}
              </div>

              <div>
                <Select
                  label="Course / service"
                  options={courseOptions}
                  loading={coursesLoading}
                  placeholder="Select course"
                  allowClear
                  {...bindMasterSelect(courseMode, setCourseMode, 'interestedCourse')}
                />
                {courseMode === OTHER && (
                  <Input className="mt-2" label="Other course" placeholder="Type course / service" {...register('interestedCourse')} />
                )}
              </div>

              <div>
                <Select
                  label="Visit purpose"
                  options={purposeOptions}
                  loading={purposesLoading}
                  placeholder="Select purpose"
                  allowClear
                  {...bindMasterSelect(purposeMode, setPurposeMode, 'visitPurpose')}
                />
                {purposeMode === OTHER && (
                  <Input className="mt-2" label="Other purpose" placeholder="Type purpose" {...register('visitPurpose')} />
                )}
              </div>

              <Controller
                name="source"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Source"
                    options={WALKIN_SOURCES.map((s) => ({ value: s, label: s }))}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
              <Controller
                name="branchId"
                control={control}
                render={({ field }) => (
                  <Select
                    label="Branch"
                    required
                    error={errors.branchId?.message}
                    options={branches.map((b) => ({ value: b.id, label: b.name }))}
                    value={field.value}
                    onChange={field.onChange}
                  />
                )}
              />
            </div>
            <div className="mt-3">
              <Textarea label="Notes" rows={2} {...register('notes')} />
            </div>

            {hasDuplicate && match && (
              <div className="mt-3">
                <DuplicateDetectionPanel match={match} onOpenProfile={onOpenProfile} />
              </div>
            )}
          </section>

          <section className="crm-reception-register__col crm-reception-register__col--assign">
            <div className="crm-reception-assign-card">
              <div className="crm-reception-assign-card__head">
                <h4 className="crm-reception-register__section-title !mb-0">Assign counsellor</h4>
                <button
                  type="button"
                  className="crm-reception-counsellor__refresh"
                  onClick={() => refetchCounsellors()}
                  title="Refresh"
                >
                  <FiRefreshCw className={recommending ? 'animate-spin' : ''} size={14} />
                </button>
              </div>
              <CounsellorRecommendPanel
                recommendations={recommendations}
                loading={recommendLoading && !recommendations.length}
                selectedId={assignedToId}
                onSelect={(id) => setValue('assignedToId', id, { shouldValidate: true })}
                onRefresh={() => refetchCounsellors()}
                error={
                  errors.assignedToId?.message
                  || (recommendError
                    ? (recommendErr?.data?.message || 'Could not load counsellors')
                    : null)
                }
              />
            </div>
            <input type="hidden" {...register('assignedToId')} />
          </section>
        </div>

        <div className="crm-reception-register__footer">
          <Button type="submit" icon={FiSave} loading={loading} disabled={hasDuplicate}>
            Create &amp; Assign
          </Button>
          <Button type="button" variant="outline" icon={FiBookmark} onClick={saveDraft}>
            Save draft
          </Button>
          <Button type="button" variant="outline" icon={FiRotateCcw} onClick={clearForm}>
            Clear
          </Button>
        </div>
      </form>
    </div>
  );
}
