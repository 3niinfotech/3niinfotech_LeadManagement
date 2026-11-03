import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiLock, FiUser, FiPhone, FiCheck, FiEye, FiEyeOff } from 'react-icons/fi';
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
  branchId: z.string().uuid('Please select an institute branch'),
  firstName: z.string().min(1, 'First name is required').max(100),
  lastName: z.string().min(1, 'Last name is required').max(100),
  email: z.string().email('Please enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  phone: z.string().min(10, 'Valid 10-digit mobile number is required').max(15, 'Mobile number too long'),
});

const BENEFITS = [
  'Track applications & visa milestones in real time',
  'Access batches, timetable, and study materials',
  'View fee invoices and official payment receipts',
];

export default function StudentRegisterPage() {
  const navigate = useNavigate();
  const [branches, setBranches] = useState([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: { companyCode: 'MAIN', phone: '' },
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
        if (!cancelled) {
          const list = res.branches || [];
          setBranches(list);
          if (list.length > 0) {
            setValue('branchId', list[0].id, { shouldValidate: true });
          }
        }
      })
      .catch(() => {
        if (!cancelled) setBranches([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingBranches(false);
      });
    return () => { cancelled = true; };
  }, [companyCode, setValue]);

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await authService.registerStudent(data);
      toastService.action.success('Registration successful! Please sign in to your student portal.');
      navigate(`${ROUTES.LOGIN_STUDENT}?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toastService.action.error(err.response?.data?.message || 'Registration failed. Please check your details.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      portal={PORTALS.STUDENT}
      variant="hero"
      minimal
      title="Create Student Account"
      subtitle="Register to start tracking your study abroad profile"
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
          <p className="auth-register-form__label">Institute & Branch</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Company Code"
              error={errors.companyCode?.message}
              placeholder="e.g. MAIN"
              {...register('companyCode')}
            />
            <Select
              label="Branch Location"
              loading={loadingBranches}
              error={errors.branchId?.message}
              options={branches.map((b) => ({ value: b.id, label: `${b.name}${b.city ? ` (${b.city})` : ''}` }))}
              placeholder="Select branch"
              {...register('branchId')}
              onChange={(e) => setValue('branchId', e.target.value, { shouldValidate: true })}
            />
          </div>
        </div>

        <div className="auth-register-form__section">
          <p className="auth-register-form__label">Personal Details</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              icon={FiUser}
              placeholder="e.g. Aarav"
              error={errors.firstName?.message}
              {...register('firstName')}
            />
            <Input
              label="Last Name"
              placeholder="e.g. Patel"
              error={errors.lastName?.message}
              {...register('lastName')}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <Input
              label="Email Address"
              type="email"
              icon={FiMail}
              placeholder="student@example.com"
              error={errors.email?.message}
              autoComplete="email"
              {...register('email')}
            />
            <Input
              label="Mobile Number"
              icon={FiPhone}
              placeholder="10-digit number"
              error={errors.phone?.message}
              autoComplete="tel"
              {...register('phone')}
            />
          </div>

          <div className="mt-3 relative">
            <Input
              label="Portal Password"
              type={showPassword ? 'text' : 'password'}
              icon={FiLock}
              placeholder="Create a strong password"
              error={errors.password?.message}
              autoComplete="new-password"
              {...register('password')}
            />
            <button
              type="button"
              className="absolute right-3 top-9 text-slate-400 hover:text-slate-600 focus:outline-none"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <FiEyeOff size={16} /> : <FiEye size={16} />}
            </button>
          </div>
        </div>

        <Button
          type="submit"
          loading={submitting}
          className="auth-login-form__submit w-full mt-2"
          size="lg"
        >
          Create Student Account
        </Button>
      </form>
    </AuthShell>
  );
}
