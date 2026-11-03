import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { FiChevronRight, FiLogOut, FiMapPin } from 'react-icons/fi';
import Avatar from '../ui/Avatar';
import { selectUser } from '../../redux/slices/authSlice';
import { ROUTES } from '../../config/routes';
import { resolvePublicAssetUrl } from '../../config/company-settings.config';
import { iconSize } from '../../theme/icons';

export default function SidebarProfileDock({ collapsed = false, onLogout }) {
  const user = useSelector(selectUser);
  const navigate = useNavigate();

  const name = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || user?.name || user?.email || 'User';
  const avatarUrl = resolvePublicAssetUrl(user?.avatar);
  const branchName = user?.branch?.name || user?.branchName || '';

  if (collapsed) {
    return (
      <div className="sidebar-profile-dock sidebar-profile-dock--collapsed">
        <button
          type="button"
          onClick={() => navigate(ROUTES.PROFILE)}
          title={`${name} — My profile`}
          className="sidebar-profile-dock__avatar-btn relative"
        >
          <Avatar
            name={name}
            src={avatarUrl}
            size="md"
            className="ring-2 ring-primary-500/20 shadow-sm"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
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
        title={`${name} — View Profile`}
        className="sidebar-profile-dock__profile"
      >
        <div className="relative shrink-0">
          <Avatar
            name={name}
            src={avatarUrl}
            size="md"
            className="ring-2 ring-primary-500/20 shadow-sm"
          />
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
        </div>
        <div className="sidebar-profile-dock__meta">
          <div className="sidebar-profile-dock__name-row">
            <span className="sidebar-profile-dock__name" title={name}>{name}</span>
            <FiChevronRight className="sidebar-profile-dock__chevron text-xs" aria-hidden />
          </div>
          {branchName && (
            <div className="sidebar-profile-dock__branch-row" title={branchName}>
              <FiMapPin className="shrink-0 text-[10px] text-primary-500" />
              <span className="truncate">{branchName}</span>
            </div>
          )}
        </div>
      </button>

      <button
        type="button"
        onClick={onLogout}
        className="sidebar-profile-dock__logout"
        title="Sign out of CRM"
      >
        <FiLogOut className={iconSize.sm} strokeWidth={1.75} aria-hidden />
        <span>Sign out</span>
      </button>
    </div>
  );
}
