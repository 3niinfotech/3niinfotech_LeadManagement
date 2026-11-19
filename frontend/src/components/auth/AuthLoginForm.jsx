import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FiChevronDown, FiShield, FiBookOpen, FiUsers, FiZap } from 'react-icons/fi';
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
  if (portal === PORTALS.STUDENT) {
    return { email: 'kishan@gmail.com', password: '123' };
  }
  return { email: 'admin@crm.com', password: 'Admin@123' };
}

export default function AuthLoginForm({ portal = PORTALS.ADMIN }) {
  const meta = PORTAL_META[portal] || PORTAL_META[PORTALS.ADMIN];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const [showPassword, setShowPassword] = useState(false);
  const [demoMenuOpen, setDemoMenuOpen] = useState(false);
  const emailFromQuery = searchParams.get('email') || '';

  const isStudent = portal === PORTALS.STUDENT;
  const isAgent = portal === PORTALS.AGENT;

  const cardTitle = isStudent ? 'Student Portal' : isAgent ? 'Agent Portal' : 'Welcome Back';
  const cardSubtitle = isStudent
    ? 'Sign in to access your student account'
    : isAgent
      ? 'Sign in to access your partner portal'
      : 'Sign in to your CRM workspace';

  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: defaultLoginValues(portal, emailFromQuery),
  });

  useEffect(() => {
    if (error) toastService.action.error(error);
    return () => dispatch(clearAuthError());
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser({ email: data.email, password: data.password }));
    if (loginUser.fulfilled.match(result)) {
      toastService.action.success(MESSAGES.LOGIN_SUCCESS);
      const route = result.payload.defaultRoute || result.payload.user?.defaultRoute || '/admin/dashboard';
      navigate(route);
      return;
    }
  };

  return (
    <>
      {/* Floating Portals & Demo Switcher in Top-Right Corner (Outside the Card) */}
      <div className="fixed top-4 right-4 z-50">
        <div className="relative">
          <button
            type="button"
            onClick={() => setDemoMenuOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold bg-white/90 dark:bg-slate-900/90 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 shadow-md backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 transition-all cursor-pointer"
          >
            <FiZap className="w-3.5 h-3.5 text-amber-500" />
            <span>Portals & Demo</span>
            <FiChevronDown className={`w-3.5 h-3.5 transition-transform ${demoMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {demoMenuOpen && (
            <div className="absolute right-0 mt-2 w-72 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl z-50">
              <div className="mb-3">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
                  CRM Portals
                </div>
                <div className="space-y-1">
                  <Link
                    to="/login/admin"
                    onClick={() => setDemoMenuOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      portal === PORTALS.ADMIN ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FiShield className="w-3.5 h-3.5 text-blue-600" />
                      <span>Staff / Admin</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/login/admin</span>
                  </Link>

                  <Link
                    to="/login/student"
                    onClick={() => setDemoMenuOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      portal === PORTALS.STUDENT ? 'bg-emerald-50 text-emerald-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FiBookOpen className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Student Portal</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/login/student</span>
                  </Link>

                  <Link
                    to="/login/agent"
                    onClick={() => setDemoMenuOpen(false)}
                    className={`flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      portal === PORTALS.AGENT ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    <span className="flex items-center gap-2">
                      <FiUsers className="w-3.5 h-3.5 text-indigo-600" />
                      <span>Partner / Agent</span>
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">/login/agent</span>
                  </Link>
                </div>
              </div>

              <div className="pt-2.5 border-t border-slate-100 dark:border-slate-800">
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 px-1">
                  1-Click Demo Fill
                </div>
                <div className="space-y-1">
                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'admin@crm.com');
                      setValue('password', 'Admin@123');
                      setDemoMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Super Admin</div>
                      <div className="text-[10px] text-slate-400">admin@crm.com</div>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Fill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'reception.hq@3niinfotech.com');
                      setValue('password', '123');
                      setDemoMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Receptionist</div>
                      <div className="text-[10px] text-slate-400">reception.hq@3niinfotech.com</div>
                    </div>
                    <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">Fill</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setValue('email', 'kishan@gmail.com');
                      setValue('password', '123');
                      setDemoMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs text-left hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                  >
                    <div>
                      <div className="font-semibold text-slate-800 dark:text-slate-200">Student</div>
                      <div className="text-[10px] text-slate-400">kishan@gmail.com</div>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Fill</span>
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <AuthShell
        portal={portal}
        variant="hero"
        minimal
        title={cardTitle}
        subtitle={cardSubtitle}
        backTo={null}
        footerLinks={[]}
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="auth-login-form"
          noValidate
        >
          <div className="auth-login-form__field">
            <label className="auth-login-form__label" htmlFor="login-email">Email Address</label>
            <div className="auth-login-form__input-wrap">
              <IconMail className="auth-login-form__icon" />
              <input
                id="login-email"
                type="email"
                className="auth-login-form__input"
                placeholder={isStudent ? 'student@email.com' : 'name@company.com'}
                autoComplete="email"
                {...register('email')}
              />
            </div>
            {errors.email?.message && (
              <p className="auth-login-form__error">{errors.email.message}</p>
            )}
          </div>

          <div className="auth-login-form__field">
            <div className="flex items-center justify-between">
              <label className="auth-login-form__label" htmlFor="login-password">Password</label>
              {isStudent && (
                <Link
                  to={ROUTES.FORGOT_PASSWORD_STUDENT}
                  className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                >
                  Forgot password?
                </Link>
              )}
            </div>
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
          </div>

          <Button
            type="submit"
            loading={loading}
            className="auth-login-form__submit w-full mt-2"
            size="lg"
            icon={IconLogIn}
          >
            Sign In
          </Button>
        </form>
      </AuthShell>
    </>
  );
}
