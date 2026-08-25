import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import toastService from '../../services/toast/toast.service';
import { motion } from 'framer-motion';
import { pageEase } from '../../theme/pageMotion';
import { FiMail, FiLock, FiArrowLeft } from 'react-icons/fi';
import Input from '../ui/Input';
import Button from '../ui/Button';
import {
  loginUser,
  clearAuthError,
  selectAuthLoading,
  selectAuthError,
} from '../../redux/slices/authSlice';
import { MESSAGES } from '../../config/messages';
import { PORTAL_META, PORTALS } from '../../config/portal.config';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export default function AuthLoginForm({ portal = PORTALS.ADMIN }) {
  const meta = PORTAL_META[portal] || PORTAL_META[PORTALS.ADMIN];
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);
  const emailFromQuery = searchParams.get('email') || '';

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: emailFromQuery
      ? { email: emailFromQuery, password: '' }
      : portal === PORTALS.ADMIN
        ? { email: 'admin@crm.com', password: 'Admin@123' }
        : { email: '', password: '' },
  });

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

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex flex-1 bg-primary-700 items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(circle_at_30%_20%,#3B82F6,transparent_55%)]" />
        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.45, ease: pageEase }}
          className="max-w-md text-white relative z-10"
        >
          <h1 className="text-4xl font-semibold mb-4 tracking-tight">{meta.label}</h1>
          <p className="text-primary-100 text-lg leading-relaxed font-normal">{meta.description}</p>
        </motion.div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: pageEase, delay: 0.08 }}
          className="w-full max-w-md"
        >
          <Link to="/login" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary-600 mb-6">
            <FiArrowLeft /> Back to portal selection
          </Link>
          <div className="bg-card-bg rounded-lg shadow-card p-8 border border-card-border">
            <h2 className="text-2xl font-semibold text-text mb-1">Sign in</h2>
            <p className="text-sm text-text-secondary mb-8">{meta.label}</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input label="Email" type="email" icon={FiMail} error={errors.email?.message} {...register('email')} />
              <Input label="Password" type="password" icon={FiLock} error={errors.password?.message} {...register('password')} />
              <Button type="submit" loading={loading} className="w-full" size="lg">Sign In</Button>
            </form>
            {portal === PORTALS.STUDENT && (
              <p className="text-xs text-text-muted mt-4 text-center">
                Counsellor / Reception / Admin?{' '}
                <Link to="/login/admin" className="text-primary-600 hover:underline font-medium">
                  Use Staff login
                </Link>
              </p>
            )}
            {portal === PORTALS.ADMIN && (
              <p className="text-xs text-text-muted mt-4 text-center">
                Student account?{' '}
                <Link to="/login/student" className="text-primary-600 hover:underline font-medium">
                  Student portal
                </Link>
              </p>
            )}
            {meta.registerPath && (
              <p className="text-sm text-text-secondary mt-4 text-center">
                No account?{' '}
                <Link to={meta.registerPath} className="text-primary-600 hover:underline font-medium">
                  Register here
                </Link>
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
