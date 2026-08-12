import { iconSize } from '../../theme/icons';
import { SpinnerRing } from './Loader';

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm shadow-primary-600/20',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 active:bg-slate-300',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-600/20',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-600/20',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm shadow-amber-500/20',
  info: 'bg-cyan-600 text-white hover:bg-cyan-700 active:bg-cyan-800 shadow-sm shadow-cyan-600/20',
  outline: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 active:bg-slate-100',
  'outline-primary': 'border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100 active:bg-primary-100',
  'outline-danger': 'border border-red-200 bg-red-50 text-red-700 hover:bg-red-100 active:bg-red-100',
  'outline-success': 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 active:bg-emerald-100',
  ghost: 'bg-transparent text-slate-600 hover:bg-slate-100 active:bg-slate-200',
};

const sizes = {
  sm: 'h-9 px-3.5 text-[13px] gap-1.5',
  md: 'h-10 px-4 text-sm gap-2',
  lg: 'h-11 px-5 text-sm gap-2',
};

export default function Button({
  children,
  variant = 'primary',
  size = 'sm',
  loading = false,
  disabled = false,
  icon: Icon,
  iconRight: IconRight,
  className = '',
  type = 'button',
  ...props
}) {
  const filled = ['primary', 'success', 'danger', 'warning', 'info'].includes(variant);
  const spinnerClass = filled
    ? 'border-white/30 border-t-white'
    : 'border-primary-200 border-t-primary-600';

  return (
    <button
      type={type}
      disabled={disabled || loading}
      className={`
        inline-flex items-center justify-center font-medium rounded-lg
        transition-all duration-200 ease-out focus-ring
        active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
        ${variants[variant] || variants.primary} ${sizes[size]} ${className}
      `}
      {...props}
    >
      {loading && <SpinnerRing size="xs" className={spinnerClass} />}
      {Icon && !loading && <Icon className={iconSize.sm} />}
      {children}
      {IconRight && !loading && <IconRight className={iconSize.sm} />}
    </button>
  );
}
