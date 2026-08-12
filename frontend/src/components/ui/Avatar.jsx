const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

export default function Avatar({ name = '', size = 'sm', className = '' }) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || '?';

  return (
    <div
      className={`rounded-full bg-primary-100 dark:bg-primary-900/40 flex items-center justify-center font-medium text-primary-700 dark:text-primary-300 ${sizes[size]} ${className}`}
    >
      {initials}
    </div>
  );
}
