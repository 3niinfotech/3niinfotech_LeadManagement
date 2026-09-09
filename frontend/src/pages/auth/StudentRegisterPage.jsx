import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiPhone, FiCheck } from 'react-icons/fi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import AuthShell from '../../components/auth/AuthShell';
import toastService from '../../services/toast/toast.service';
import { authService } from '../../services/auth/auth.service';
import { PORTALS } from '../../config/portal.config';
import { ROUTES } from '../../config/routes';

const schema = z.object({
  companyCode: z.string().min(1, 'Company code is required'),
  branchId: z.string().uuid('Select a branch'),
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  email: z.string().email(),
  password: z.string().min(1, 'Password is required').max(128),
  phone: z.string().max(20).optional(),
});

const BENEFITS = [
  'Track applications & visa progress',
  'Access classes, attendance & assignments',
  'View fees, receipts & documents',
];

export default function StudentRegisterPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { companyCode: 'MAIN' },
  });

  const companyCode = watch('companyCode');

  useEffect(() => {
    if (!companyCode?.trim()) {
      setBranches([]);
      return;
    }
    let cancelled = false;
    setLoadingBranches(true);
    authService.getRegistrationBranches(companyCode)
      .then((res) => {
        if (!cancelled) setBranches(res.branches || []);
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBranches(false);
      });
    return () => { cancelled = true; };
  }, [companyCode]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await authService.registerStudent(data);
      toastService.action.success('Account created. Please sign in.');
      navigate(ROUTES.LOGIN_STUDENT);
    } catch (err) {
      toastService.action.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      portal={PORTALS.STUDENT}
      variant="hero"
      minimal
      title="Create your account"
      subtitle="Student registration"
      wide
      backTo={{ label: 'Back to website', href: ROUTES.LANDING }}
      footerLinks={[
        {
          key: 'login',
          text: 'Already registered?',
          href: ROUTES.LOGIN_STUDENT,
          linkLabel: 'Sign in',
        },
      ]}
    >
      <ul className="auth-register-benefits">
        {BENEFITS.map((item) => (
          <li key={item}><FiCheck size={13} aria-hidden />{item}</li>
        ))}
      </ul>

      <form onSubmit={handleSubmit(onSubmit)} className="auth-login-form auth-register-form">
        <div className="auth-register-form__section">
          <p className="auth-register-form__label">Institute</p>
          <Input label="Company code" error={errors.companyCode?.message} {...register('companyCode')} />
          <Select
            label="Branch"
            loading={loadingBranches}
            error={errors.branchId?.message}
            options={branches.map((b) => ({ value: b.id, label: `${b.name}${b.city ? ` — ${b.city}` : ''}` }))}
            placeholder="Select your branch"
            {...register('branchId')}
            onChange={(e) => setValue('branchId', e.target.value, { shouldValidate: true })}
          />
        </div>

        <div className="auth-register-form__section">
          <p className="auth-register-form__label">Your details</p>
          <div className="auth-register-form__row">
            <Input label="First name" icon={FiUser} error={errors.firstName?.message} {...register('firstName')} />
            <Input label="Last name" error={errors.lastName?.message} {...register('lastName')} />
          </div>
          <Input label="Email" type="email" icon={FiMail} error={errors.email?.message} autoComplete="email" {...register('email')} />
          <Input label="Phone" icon={FiPhone} error={errors.phone?.message} autoComplete="tel" {...register('phone')} />
          <Input
            label="Password"
            type="password"
            icon={FiLock}
            error={errors.password?.message}
            autoComplete="new-password"
            hint="At least 8 characters"
            {...register('password')}
          />
        </div>

        <Button type="submit" loading={submitting} className="auth-login-form__submit w-full" size="lg">
          Create Student Account
        </Button>
      </form>
    </AuthShell>
  );
}
