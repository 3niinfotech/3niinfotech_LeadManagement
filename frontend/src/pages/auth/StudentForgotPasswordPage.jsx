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
  email: z.string().email('Invalid email address'),
  newPassword: z.string().min(1, 'New password is required').max(128),
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
  const emailFromQuery = searchParams.get('email') || 'aarav.patel@gmail.com';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      email: emailFromQuery,
      newPassword: '123',
      confirmPassword: '123',
    },
  });

  const onSubmit = async (data) => {
    setSubmitting(true);
    try {
      const result = await authService.forgotPassword({
        email: data.email,
        portal: PORTALS.STUDENT,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      const hint = result?.temporaryPassword
        ? ` Password is now "${result.temporaryPassword}".`
        : '';
      toastService.action.success(`Password updated everywhere.${hint} Sign in again.`);
      navigate(`${ROUTES.LOGIN_STUDENT}?email=${encodeURIComponent(data.email)}`);
    } catch (err) {
      toastService.action.error(err.response?.data?.message || 'Could not reset password');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthShell
      portal={PORTALS.STUDENT}
      variant="hero"
      minimal
      title="Reset password"
      subtitle="Sets a new password on your student login (all sessions sign out)"
      backTo={{ label: 'Back to sign in', href: ROUTES.LOGIN_STUDENT }}
      footerLinks={[
        { key: 'login', href: ROUTES.LOGIN_STUDENT, linkLabel: 'Back to sign in' },
      ]}
    >
      <p className="auth-login-form__hint">
        For testing, default password is <strong>123</strong>. Reset updates your single account password everywhere.
      </p>
      <form onSubmit={handleSubmit(onSubmit)} className="auth-login-form" noValidate>
        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="forgot-email">Email</label>
          <div className="auth-login-form__input-wrap">
            <IconMail className="auth-login-form__icon" />
            <input
              id="forgot-email"
              type="email"
              className="auth-login-form__input"
              autoComplete="email"
              {...register('email')}
            />
          </div>
          {errors.email?.message && (
            <p className="auth-login-form__error">{errors.email.message}</p>
          )}
        </div>

        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="forgot-password">New password</label>
          <div className="auth-login-form__input-wrap">
            <IconLock className="auth-login-form__icon" />
            <input
              id="forgot-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-login-form__input auth-login-form__input--password"
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
          <label className="auth-login-form__label" htmlFor="forgot-confirm">Confirm password</label>
          <div className="auth-login-form__input-wrap">
            <IconLock className="auth-login-form__icon" />
            <input
              id="forgot-confirm"
              type={showPassword ? 'text' : 'password'}
              className="auth-login-form__input"
              autoComplete="new-password"
              {...register('confirmPassword')}
            />
          </div>
          {errors.confirmPassword?.message && (
            <p className="auth-login-form__error">{errors.confirmPassword.message}</p>
          )}
        </div>

        <Button type="submit" loading={submitting} className="auth-login-form__submit w-full" size="lg">
          Reset password
        </Button>

        <p className="auth-login-form__footer-note">
          Remembered it? <Link to={ROUTES.LOGIN_STUDENT}>Sign in</Link>
        </p>
      </form>
    </AuthShell>
  );
}
