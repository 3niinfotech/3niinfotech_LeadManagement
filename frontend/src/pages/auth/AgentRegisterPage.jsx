import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { FiArrowLeft, FiMail, FiLock, FiBriefcase, FiPhone } from 'react-icons/fi';
import Input from '../../components/ui/Input';
import Button from '../../components/ui/Button';
import Select from '../../components/ui/Select';
import toastService from '../../services/toast/toast.service';
import { authService } from '../../services/auth/auth.service';

const schema = z.object({
  companyCode: z.string().min(1, 'Company code is required'),
  branchId: z.string().uuid('Select a branch'),
  name: z.string().min(1).max(200),
  email: z.string().email(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  phone: z.string().max(20).optional(),
  type: z.string().max(100).optional(),
});

export default function AgentRegisterPage() {
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
      await authService.registerAgent(data);
      toastService.action.success('Account created. Please sign in.');
      navigate('/login/agent');
    } catch (err) {
      toastService.action.error(err.response?.data?.message || 'Registration failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-8">
      <div className="w-full max-w-lg">
        <Link to="/login/agent" className="inline-flex items-center gap-2 text-sm text-text-secondary hover:text-primary-600 mb-6">
          <FiArrowLeft /> Back to sign in
        </Link>
        <div className="bg-card-bg rounded-lg shadow-card p-8 border border-card-border">
          <h1 className="text-2xl font-semibold text-text mb-1">Agent Registration</h1>
          <p className="text-sm text-text-secondary mb-6">Register as a partner agent</p>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input label="Company Code" error={errors.companyCode?.message} {...register('companyCode')} />
            <Select
              label="Branch"
              loading={loadingBranches}
              error={errors.branchId?.message}
              options={branches.map((b) => ({ value: b.id, label: `${b.name}${b.city ? ` — ${b.city}` : ''}` }))}
              placeholder="Select branch"
              {...register('branchId')}
              onChange={(e) => setValue('branchId', e.target.value, { shouldValidate: true })}
            />
            <Input label="Organization / Agent Name" icon={FiBriefcase} error={errors.name?.message} {...register('name')} />
            <Input label="Email" type="email" icon={FiMail} error={errors.email?.message} {...register('email')} />
            <Input label="Phone" icon={FiPhone} error={errors.phone?.message} {...register('phone')} />
            <Input label="Agent Type (optional)" error={errors.type?.message} {...register('type')} />
            <Input label="Password" type="password" icon={FiLock} error={errors.password?.message} {...register('password')} />
            <Button type="submit" loading={submitting} className="w-full" size="lg">Create Account</Button>
          </form>
        </div>
      </div>
    </div>
  );
}
