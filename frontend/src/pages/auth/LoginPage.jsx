import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import toastService from '../../services/toast/toast.service';
import { motion } from 'framer-motion';
import { pageEase } from '../../theme/pageMotion';
import { FiMail, FiLock } from 'react-icons/fi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import { loginUser, clearAuthError, selectAuthLoading, selectAuthError } from '../../redux/slices/authSlice';
import { MESSAGES } from '../../config/messages';
import { ROUTES } from '../../config/routes';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export default function LoginPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const loading = useSelector(selectAuthLoading);
  const error = useSelector(selectAuthError);

  const { register, handleSubmit, formState: { errors } } = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: 'admin@crm.com', password: 'Admin@123' },
  });

  useEffect(() => {
    if (error) toastService.action.error(error);
    return () => dispatch(clearAuthError());
  }, [error, dispatch]);

  const onSubmit = async (data) => {
    const result = await dispatch(loginUser(data));
    if (loginUser.fulfilled.match(result)) {
      toastService.action.success(MESSAGES.LOGIN_SUCCESS);
      navigate(ROUTES.DASHBOARD);
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
          <h1 className="text-4xl font-semibold mb-4 tracking-tight">Lead Management CRM</h1>
          <p className="text-primary-100 text-lg leading-relaxed font-normal">
            Enterprise-grade CRM for Lead Management, Student Tracking, and Visa Processing.
          </p>
        </motion.div>
      </div>
      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: pageEase, delay: 0.08 }}
          className="w-full max-w-md"
        >
          <div className="bg-card-bg rounded-lg shadow-card p-8 border border-card-border">
            <h2 className="text-2xl font-semibold text-text mb-1">Welcome back</h2>
            <p className="text-sm text-text-secondary mb-8">Sign in to your account</p>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <Input label="Email" type="email" icon={FiMail} error={errors.email?.message} {...register('email')} />
              <Input label="Password" type="password" icon={FiLock} error={errors.password?.message} {...register('password')} />
              <Button type="submit" loading={loading} className="w-full" size="lg">Sign In</Button>
            </form>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
