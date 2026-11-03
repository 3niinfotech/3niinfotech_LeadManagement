import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import Button from '../../components/ui/Button';
import AuthShell from '../../components/auth/AuthShell';
import { IconMail, IconLock, IconEye, IconEyeOff } from '../../components/auth/AuthIcons';
import toastService from '../../services/toast/toast.service';
import { authService } from '../../services/auth/auth.service';
import { PORTALS } from '../../config/portal.config';
import { ROUTES } from '../../config/routes';

const schema = z.object({
  email: z.string().email('Please enter a valid student email address'),
  newPassword: z.string().min(6, 'Password must be at least 6 characters').max(128),
  confirmPassword: z.string().min(1, 'Confirm your new password'),
}).superRefine((data, ctx) => {
  if (data.newPassword !== data.confirmPassword) {
    ctx.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match' });
  }
});

export default function StudentForgotPasswordPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [submitting, setSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const emailFromQuery = searchParams.get('email') || '';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: emailFromQuery,
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      await authService.forgotPassword({
        email: data.email,
        portal: PORTALS.STUDENT,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      toastService.action.success('Password updated successfully. Please sign in with your new password.');
      navigate(`${ROUTES.LOGIN_STUDENT}?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toastService.action.error(err.response?.data?.message || 'Could not reset password. Please check your email.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      portal={PORTALS.STUDENT}
      variant="hero"
      minimal
      title="Reset Student Password"
      subtitle="Enter your registered email and choose a new secure password"
      backTo={{ label: 'Back to sign in', href: ROUTES.LOGIN_STUDENT }}
      footerLinks={[
        { key: 'login', text: 'Remembered your password?', href: ROUTES.LOGIN_STUDENT, linkLabel: 'Sign in' },
      ]}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="auth-login-form" noValidate>
        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="forgot-email">Student Email</label>
          <div className="auth-login-form__input-wrap">
            <IconMail className="auth-login-form__icon" />
            <input
              id="forgot-email"
              type="email"
              className="auth-login-form__input"
              placeholder="e.g. aarav.patel@gmail.com"
              autoComplete="email"
              {...register('email')}
            />
          </div>
          {errors.email?.message && (
            <p className="auth-login-form__error">{errors.email.message}</p>
          )}
        </div>

        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="forgot-password">New Password</label>
          <div className="auth-login-form__input-wrap">
            <IconLock className="auth-login-form__icon" />
            <input
              id="forgot-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-login-form__input auth-login-form__input--password"
              placeholder="Enter at least 6 characters"
              autoComplete="new-password"
              {...register('newPassword')}
            />
            <button
              type="button"
              className="auth-login-form__toggle"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? (
                <IconEyeOff className="auth-login-form__icon auth-login-form__icon--toggle" />
              ) : (
                <IconEye className="auth-login-form__icon auth-login-form__icon--toggle" />
              )}
            </button>
          </div>
          {errors.newPassword?.message && (
            <p className="auth-login-form__error">{errors.newPassword.message}</p>
          )}
        </div>

        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="forgot-confirm">Confirm New Password</label>
          <div className="auth-login-form__input-wrap">
            <IconLock className="auth-login-form__icon" />
            <input
              id="forgot-confirm"
              type={showPassword ? 'text' : 'password'}
              className="auth-login-form__input"
              placeholder="Re-enter your new password"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword?.message && (
            <p className="auth-login-form__error">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" loading={submitting} className="auth-login-form__submit w-full" size="lg">
          Update Password
        </Button>
      </form>
    </AuthShell>
  );
}
