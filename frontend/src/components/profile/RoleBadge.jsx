import { FiShield } from 'react-icons/fi';
import { getRoleMeta } from '../../config/roles';

export default function RoleBadge({ slug, name, size = 'md', showIcon = true }) {
  const meta = getRoleMeta(slug);
  const label = name || meta.label;

  const sizes = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-[11px] px-2.5 py-1',
    lg: 'text-xs px-3 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full font-semibold shadow-sm ${meta.badgeClass} ${sizes[size]}`}
    >
      {showIcon && <FiShield className="w-3 h-3 shrink-0" />}
      {label}
    </span>
  );
}
