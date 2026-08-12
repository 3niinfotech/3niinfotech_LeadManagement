const colorMap = {
  primary: 'bg-primary-50 text-primary-600',
  secondary: 'bg-secondary-100 text-secondary-600',
  success: 'bg-success-soft text-success',
  danger: 'bg-danger-soft text-danger',
  warning: 'bg-warning-soft text-warning',
  info: 'bg-info-soft text-info',
};

export default function Badge({ children, color = 'secondary', className = '' }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${colorMap[color]} ${className}`}>
      {children}
    </span>
  );
}
