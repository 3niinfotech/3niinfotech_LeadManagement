import { hasPermission } from '../../config/permissions';
import { useSelector } from 'react-redux';
import { selectPermissions } from '../../redux/slices/authSlice';

export default function PermissionGate({ permission, children, fallback = null }) {
  const permissions = useSelector(selectPermissions);
  if (!hasPermission(permissions, permission)) return fallback;
  return children;
}
