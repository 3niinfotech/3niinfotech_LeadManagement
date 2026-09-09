import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiChevronRight, FiLogOut, FiShield } from 'react-icons/fi';
import Avatar from '../ui/Avatar';
import { selectUser } from '../../redux/slices/authSlice';
import { ROUTES } from '../../config/routes';
import { resolvePublicAssetUrl } from '../../config/company-settings.config';
import { getRoleMeta } from '../../config/roles';
import { iconSize } from '../../theme/icons';

export default function SidebarProfileDock({ collapsed = false, onLogout }) {
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.email || 'User';
  const avatarUrl = resolvePublicAssetUrl(user?.avatar);
  const roleSlug = user?.role?.slug;
  const roleName = user?.role?.name || getRoleMeta(roleSlug).label;
  const branchName = user?.branch?.name;

  if (collapsed) {
    return (
      <div className="sidebar-profile-dock sidebar-profile-dock--collapsed">
        <button
          type="button"
          onClick={() => navigate(ROUTES.PROFILE)}
          title={`${name} — My profile`}
          className="sidebar-profile-dock__avatar-btn"
        >
          <Avatar
            name={name}
            src={avatarUrl}
            size="md"
            className="ring-2 ring-sidebar-bg"
          />
        </button>
        <button
          type="button"
          onClick={onLogout}
          title="Sign out"
          className="sidebar-profile-dock__logout-icon"
          aria-label="Sign out"
        >
          <FiLogOut className={iconSize.sm} strokeWidth={1.75} />
        </button>
      </div>
    );
  }

  return (
    <div className="sidebar-profile-dock">
      <button
        type="button"
        onClick={() => navigate(ROUTES.PROFILE)}
        title={`${name} — My profile`}
        className="sidebar-profile-dock__profile"
      >
        <Avatar
          name={name}
          src={avatarUrl}
          size="md"
          className="sidebar-profile-dock__avatar ring-2 ring-sidebar-bg shrink-0"
        />
        <span className="sidebar-profile-dock__meta">
          <span className="sidebar-profile-dock__name-row">
            <span className="sidebar-profile-dock__name">{name}</span>
            <FiChevronRight className={`${iconSize.sm} sidebar-profile-dock__chevron`} aria-hidden />
          </span>
          <span className="sidebar-profile-dock__role">
            <FiShield className={iconSize.sm} strokeWidth={2} aria-hidden />
            <span className="truncate">{roleName}</span>
          </span>
          {branchName && (
            <span className="sidebar-profile-dock__branch truncate">{branchName}</span>
          )}
        </span>
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="sidebar-profile-dock__logout"
      >
        <FiLogOut className={iconSize.sm} strokeWidth={1.75} aria-hidden />
        <span>Sign out</span>
      </button>
    </div>
  );
}
