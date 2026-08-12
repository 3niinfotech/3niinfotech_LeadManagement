import { iconBoxSize, iconSize } from '../../theme/icons';

const colorMap = {
  primary: 'bg-primary-50 text-primary-600 border-primary-100',
  success: 'bg-success-soft text-success border-success/20',
  warning: 'bg-warning-soft text-warning border-warning/20',
  danger: 'bg-danger-soft text-danger border-danger/20',
  info: 'bg-info-soft text-info border-info/20',
  secondary: 'bg-secondary-100 text-text-secondary border-border',
};

const variantMap = {
  default: '',
  header: 'border shadow-sm',
};

export default function IconBox({
  icon: Icon,
  color = 'primary',
  size = 'md',
  iconSize: iSize = 'md',
  variant = 'default',
}) {
  return (
    <div
      className={`flex items-center justify-center shrink-0 rounded-xl ${iconBoxSize[size]} ${colorMap[color]} ${variantMap[variant]}`}
    >
      <Icon className={iconSize[iSize]} strokeWidth={2} />
    </div>
  );
}
