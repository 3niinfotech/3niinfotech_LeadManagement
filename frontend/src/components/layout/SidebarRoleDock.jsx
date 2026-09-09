import { NavLink } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { selectUser } from '../../redux/slices/authSlice';
import { getRoleSidebarDock } from '../../config/role-profile.config';
import { iconSize } from '../../theme/icons';

export default function SidebarRoleDock({ collapsed = false }) {
  const user = useSelector(selectUser);
  const slug = user?.role?.slug;
  const dock = getRoleSidebarDock(slug);

  if (!dock?.links?.length) return null;

  return (
    <div className="sidebar-role-dock shrink-0">
      {!collapsed && (
        <p className="px-2.5 mb-1 text-[10px] font-semibold uppercase tracking-wide text-text-muted truncate">
          {dock.title}
        </p>
      )}
      <div className="flex flex-col gap-0.5">
        {dock.links.map(({ id, label, path, icon: Icon }) => (
          <NavLink
            key={`${id}-${path}`}
            to={path}
            title={label}
            className={({ isActive }) => {
              const base = collapsed
                ? 'sidebar-nav-item relative flex items-center justify-center w-full h-10 rounded-xl font-medium transition-colors duration-200 ease-out'
                : 'sidebar-nav-item relative flex items-center gap-2.5 w-full px-3 h-10 text-sm rounded-lg font-medium transition-colors duration-200 ease-out';
              if (isActive) {
                return `${base} text-sidebar-textActive bg-sidebar-activeBg`;
              }
              return `${base} text-sidebar-text hover:text-text hover:bg-sidebar-bgHover`;
            }}
          >
            <span className="flex items-center justify-center shrink-0 w-5 h-5" aria-hidden>
              <Icon className={iconSize.md} strokeWidth={1.75} />
            </span>
            {!collapsed && <span className="truncate">{label}</span>}
          </NavLink>
        ))}
      </div>
    </div>
  );
}
