import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toastService from '../../services/toast/toast.service';
import Button from '../ui/Button';
import AuthShell from './AuthShell';
import { IconMail, IconLock, IconLogIn, IconEye, IconEyeOff } from './AuthIcons';
import {
  loginUser,
  clearAuthError,
  selectAuthLoading,
  selectAuthError,
} from '../../redux/slices/authSlice';
import { MESSAGES } from '../../config/messages';
import { PORTAL_META, PORTALS } from '../../config/portal.config';
import { ROUTES } from '../../config/routes';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

function defaultLoginValues(portal, emailFromQuery) {
  if (emailFromQuery) {
    return {
      email: emailFromQuery,
      password: portal === PORTALS.STUDENT ? '123' : '',
    };
  }
  if (portal === PORTALS.ADMIN) {
    return { email: 'admin@crm.com', password: 'Admin@123' };
  }
  if (portal === PORTALS.STUDENT) {
    return { email: 'aarav.patel@gmail.com', password: '123' };
  }
  return { email: '', password: '' };
}

export default function AuthLoginForm({ portal = PORTALS.ADMIN }) {
  const meta = PORTAL_META[portal] || PORTAL_META[PORTALS.ADMIN];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const [showPassword, setShowPassword] = useState(false);
  const emailFromQuery = searchParams.get('email') || '';

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: defaultLoginValues(portal, emailFromQuery),
  });
  const emailValue = watch('email') || '';

  useEffect(() => {
    if (error) toastService.action.error(error);
    return () => dispatch(clearAuthError());
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser({ ...data, portal }));
    if (loginUser.fulfilled.match(result)) {
      toastService.action.success(MESSAGES.LOGIN_SUCCESS);
      const route = result.payload.defaultRoute || result.payload.user?.defaultRoute || '/admin/dashboard';
      navigate(route);
      return;
    }
    const suggested = result.payload?.suggestedLoginPath;
    if (suggested && suggested !== meta.loginPath) {
      navigate(`${suggested}?email=${encodeURIComponent(data.email)}`);
    }
  };

  const footerLinks = [];
  if (portal === PORTALS.STUDENT) {
    footerLinks.push({ key: 'forgot', href: ROUTES.FORGOT_PASSWORD_STUDENT, linkLabel: 'Forgot password?' });
    footerLinks.push({ key: 'register', href: ROUTES.REGISTER_STUDENT, linkLabel: 'Create account' });
    footerLinks.push({ key: 'staff', href: '/login/admin', linkLabel: 'Staff login' });
  }
  if (portal === PORTALS.ADMIN) {
    footerLinks.push({ key: 'student', href: '/login/student', linkLabel: 'Student portal' });
    footerLinks.push({ key: 'apply', href: ROUTES.APPLY, linkLabel: 'Apply for staff role' });
  }
  if (portal === PORTALS.AGENT) {
    footerLinks.push({ key: 'staff', href: '/login/admin', linkLabel: 'Staff login' });
  }

  return (
    <AuthShell
      portal={portal}
      variant="hero"
      minimal
      backTo={{ label: 'Back to website', href: ROUTES.LANDING }}
      footerLinks={footerLinks}
    >
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="auth-login-form"
        noValidate
      >
        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="login-email">Email</label>
          <div className="auth-login-form__input-wrap">
            <IconMail className="auth-login-form__icon" />
            <input
              id="login-email"
              type="email"
              className="auth-login-form__input"
              placeholder="admin@crm.com"
              autoComplete="email"
              {...register('email')}
            />
          </div>
          {errors.email?.message && (
            <p className="auth-login-form__error">{errors.email.message}</p>
          )}
        </div>

        <div className="auth-login-form__field">
          <label className="auth-login-form__label" htmlFor="login-password">Password</label>
          <div className="auth-login-form__input-wrap">
            <IconLock className="auth-login-form__icon" />
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              className="auth-login-form__input auth-login-form__input--password"
              placeholder="••••••••"
              autoComplete="current-password"
              {...register('password')}
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
          {errors.password?.message && (
            <p className="auth-login-form__error">{errors.password.message}</p>
          )}
          {portal === PORTALS.STUDENT && (
            <p className="auth-login-form__forgot">
              <Link to={`${ROUTES.FORGOT_PASSWORD_STUDENT}?email=${encodeURIComponent(emailValue || 'aarav.patel@gmail.com')}`}>
                Forgot password?
              </Link>
            </p>
          )}
        </div>

        <Button
          type="submit"
          loading={loading}
          className="auth-login-form__submit w-full"
          size="lg"
          icon={IconLogIn}
        >
          Sign In
        </Button>
      </form>
    </AuthShell>
  );
}
