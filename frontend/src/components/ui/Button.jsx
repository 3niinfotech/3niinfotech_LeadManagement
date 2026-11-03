import { iconSize } from '../../theme/icons';
import { SpinnerRing } from './Loader';

const variants = {
  primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800 shadow-sm shadow-primary-600/20',
  secondary: 'bg-row-hover text-text hover:bg-border/60 active:bg-border',
  success: 'bg-emerald-600 text-white hover:bg-emerald-700 active:bg-emerald-800 shadow-sm shadow-emerald-600/20',
  danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm shadow-red-600/20',
  warning: 'bg-amber-500 text-white hover:bg-amber-600 active:bg-amber-700 shadow-sm shadow-amber-500/20',
  info: 'bg-cyan-600 text-white hover:bg-cyan-700 active:bg-cyan-800 shadow-sm shadow-cyan-600/20',
  outline: 'border border-border bg-card-bg text-text hover:bg-row-hover hover:border-border-strong active:bg-row-hover',
  'outline-primary': 'border border-brand/30 bg-brand-soft text-brand hover:bg-brand-soft/80 active:bg-brand-soft',
  'outline-danger': 'border border-danger/30 bg-danger-soft text-danger hover:bg-danger-soft/80 active:bg-danger-soft',
  'outline-success': 'border border-success/30 bg-success-soft text-success hover:bg-success-soft/80 active:bg-success-soft',
  ghost: 'bg-transparent text-text-secondary hover:bg-row-hover active:bg-row-hover',
};

const sizes = {
  xs: 'h-7 px-2.5 text-xs gap-1.5',
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
