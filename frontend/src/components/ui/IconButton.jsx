import { iconSize } from '../../theme/icons';

export default function IconButton({
  icon: Icon,
  onClick,
  badge,
  size = 'md',
  label,
  title,
  variant = 'default',
  className = '',
  ...props
}) {
  const variants = {
    default: 'p-2 rounded-sm text-text-secondary hover:bg-row-hover hover:text-text',
    toolbar: `p-2.5 rounded-lg text-text-secondary transition-all duration-200
      hover:bg-brand-soft hover:text-primary-600 hover:shadow-sm
      active:scale-95`,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={title || label}
      className={`relative transition-colors duration-150 focus-ring ${variants[variant] || variants.default} ${className}`}
      {...props}
    >
      <Icon className={iconSize[size]} />
      {badge > 0 && (
        <span className="absolute top-0.5 right-0.5 min-w-[16px] h-4 px-1 rounded-full bg-danger text-white text-[10px] font-semibold flex items-center justify-center ring-2 ring-card-bg">
          {badge > 9 ? '9+' : badge}
        </span>
      )}
    </button>
  );
}
