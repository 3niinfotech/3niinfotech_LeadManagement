import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useParams } from 'react-router-dom';
import toastService from '../../../services/toast/toast.service';
import Button from '../../../components/ui/Button';
import Select from '../../../components/ui/Select';
import AuthShell from '../../../components/auth/AuthShell';
import { IconMail, IconLock, IconLogIn } from '../../../components/auth/AuthIcons';
import { PORTALS } from '../../../config/portal.config';
import {
  APPLY_FEATURED_ROLES,
  APPLY_OTHER_ROLES,
  ROLE_APPLY_PATH,
} from '../../../config/role-application.config';
import {
  useGetApplyBranchesQuery,
  useSubmitRoleApplicationMutation,
} from '../redux/roleApplicationApiSlice';
import '../styles/role-applications.theme.css';

const schema = z.object({
  companyCode: z.string().min(1, 'Company code is required'),
  branchId: z.string().uuid('Select a branch'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  phone: z.string().max(20).optional(),
  qualification: z.string().max(200).optional(),
  experience: z.string().max(2000).optional(),
  message: z.string().max(2000).optional(),
});

const ALL_ROLES = [...APPLY_FEATURED_ROLES, ...APPLY_OTHER_ROLES];

function roleLabel(slug) {
  return ALL_ROLES.find((r) => r.slug === slug)?.label
    || slug?.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function RoleApplyPage() {
  const { roleSlug } = useParams();
  const navigate = useNavigate();
  const [companyCode, setCompanyCode] = useState('MAIN');
  const { data: branchData, isFetching: loadingBranches } = useGetApplyBranchesQuery(companyCode, {
    skip: !companyCode?.trim(),
  });
  const [submit, { isLoading }] = useSubmitRoleApplicationMutation();

  const branches = branchData?.branches || [];

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { companyCode: 'MAIN' },
  });

  const watchedCode = watch('companyCode');

  useEffect(() => {
    if (watchedCode !== companyCode) setCompanyCode(watchedCode || '');
  }, [watchedCode, companyCode]);

  const onSubmit = async (data) => {
    try {
      await submit({ ...data, roleSlug }).unwrap();
      toastService.action.success('Application submitted! Admin will review and contact you.');
      navigate('/apply');
    } catch (e) {
      toastService.action.error(e?.data?.message || 'Could not submit application');
    }
  };

  if (!roleSlug || !ALL_ROLES.some((r) => r.slug === roleSlug)) {
    return (
      <div className="role-apply-invalid">
        <p>Invalid role. <Link to="/apply">Choose a role</Link></p>
      </div>
    );
  }

  return (
    <AuthShell
      portal={PORTALS.ADMIN}
      variant="hero"
      minimal
      backTo={{ label: 'Back to roles', href: '/apply' }}
    >
      <div className="role-apply-form-head">
        <span className="role-apply-form-head__badge">{roleLabel(roleSlug)}</span>
        <p>Fill in your details. Admin will review before account is created.</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-login-form role-apply-form" noValidate>
        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="apply-company">Company code</label>
          <input id="apply-company" className="auth-login-form__input" {...register('companyCode')} />
          {errors.companyCode && <p className="auth-login-form__error">{errors.companyCode.message}</p>}
        </div>

        <div className="auth-login-form__field">
          <Select
            label="Branch"
            loading={loadingBranches}
            error={errors.branchId?.message}
            options={branches.map((b) => ({
              value: b.id,
              label: `${b.name}${b.city ? ` — ${b.city}` : ''}`,
            }))}
            placeholder="Select branch"
            {...register('branchId')}
            onChange={(e) => setValue('branchId', e.target.value, { shouldValidate: true })}
          />
        </div>

        <div className="role-apply-form__row">
          <div className="auth-login-form__field">
            <label className="auth-login-form__label" htmlFor="apply-fn">First name</label>
            <input id="apply-fn" className="auth-login-form__input" {...register('firstName')} />
            {errors.firstName && <p className="auth-login-form__error">{errors.firstName.message}</p>}
          </div>
          <div className="auth-login-form__field">
            <label className="auth-login-form__label" htmlFor="apply-ln">Last name</label>
            <input id="apply-ln" className="auth-login-form__input" {...register('lastName')} />
            {errors.lastName && <p className="auth-login-form__error">{errors.lastName.message}</p>}
          </div>
        </div>

        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="apply-email">Email</label>
          <div className="auth-login-form__input-wrap">
            <IconMail className="auth-login-form__icon" />
            <input id="apply-email" type="email" className="auth-login-form__input" {...register('email')} />
          </div>
          {errors.email && <p className="auth-login-form__error">{errors.email.message}</p>}
        </div>

        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="apply-phone">Phone</label>
          <input id="apply-phone" className="auth-login-form__input" {...register('phone')} />
        </div>

        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="apply-qual">Qualification</label>
          <input id="apply-qual" className="auth-login-form__input" placeholder="e.g. MBA, B.Ed" {...register('qualification')} />
        </div>

        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="apply-exp">Experience</label>
          <textarea id="apply-exp" className="role-apply-form__textarea" rows={3} {...register('experience')} />
        </div>

        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="apply-msg">Message (optional)</label>
          <textarea id="apply-msg" className="role-apply-form__textarea" rows={2} {...register('message')} />
        </div>

        <Button type="submit" loading={isLoading} className="auth-login-form__submit w-full" size="lg" icon={IconLogIn}>
          Submit Application
        </Button>
      </form>
    </AuthShell>
  );
}
