import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiLogOut, FiMail, FiSettings, FiShield, FiUser } from 'react-icons/fi';
import Avatar from '../ui/Avatar';
import RoleBadge from '../profile/RoleBadge';
import { iconSize } from '../../theme/icons';
import { selectUser, logoutUser } from '../../redux/slices/authSlice';
import { ROUTES } from '../../config/routes';
import { PERMISSIONS } from '../../config/permissions';
import { pageEase } from '../../theme/pageMotion';
import { usePermissions } from '../../hooks/usePermissions';
import { resolvePublicAssetUrl } from '../../config/company-settings.config';

const MENU_WIDTH = 280;
const MENU_GAP = 8;

const menuVariants = {
  hidden: { opacity: 0, y: -8, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.22, ease: pageEase },
  },
  exit: { opacity: 0, y: -6, scale: 0.97, transition: { duration: 0.15 } },
};

export default function NavbarProfileMenu({ open, onToggle, onClose }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector(selectUser);
  const { canManageUsers, can } = usePermissions();
  const triggerRef = useRef(null);
  const menuRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  const avatarName = [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
  const email = user?.email || '—';
  const roleSlug = user?.role?.slug;

  const updatePosition = useCallback(() => {
    const el = triggerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const left = Math.min(
      Math.max(8, rect.right - MENU_WIDTH),
      window.innerWidth - MENU_WIDTH - 8,
    );
    setPos({
      top: rect.bottom + MENU_GAP,
      left,
    });
  }, []);

  useLayoutEffect(() => {
    if (!open) return undefined;
    updatePosition();
    return undefined;
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open) return undefined;

    const handlePointer = (e) => {
      const t = e.target;
      if (triggerRef.current?.contains(t)) return;
      if (menuRef.current?.contains(t)) return;
      onClose();
    };
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    const onReflow = () => updatePosition();

    document.addEventListener('mousedown', handlePointer);
    document.addEventListener('keydown', handleKey);
    window.addEventListener('resize', onReflow);
    window.addEventListener('scroll', onReflow, true);
    return () => {
      document.removeEventListener('mousedown', handlePointer);
      document.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', onReflow);
      window.removeEventListener('scroll', onReflow, true);
    };
  }, [open, onClose, updatePosition]);

  const handleLogout = () => {
    onClose();
    dispatch(logoutUser());
    navigate('/login');
  };

  const go = (path) => {
    onClose();
    navigate(path);
  };

  const menuItems = [
    { id: 'profile', label: 'My Profile', icon: FiUser, path: ROUTES.PROFILE },
    ...(canManageUsers ? [{ id: 'users', label: 'Team & Access', icon: FiShield, path: ROUTES.USERS }] : []),
    ...(can(PERMISSIONS.SETTINGS_VIEW) ? [{ id: 'settings', label: 'Settings', icon: FiSettings, path: ROUTES.SETTINGS }] : []),
  ];

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="menu"
        className={`group flex items-center gap-2 h-10 pl-1 pr-2 rounded-xl border transition-all duration-200 focus-ring
          ${open
            ? 'bg-brand-soft/80 border-brand/25 shadow-sm'
            : 'bg-card-bg/80 border-border/70 hover:border-brand/20 hover:bg-page shadow-sm'
          }`}
      >
        <Avatar name={avatarName} src={resolvePublicAssetUrl(user?.avatar)} size="sm" className="ring-2 ring-card-bg" />
        <div className="hidden lg:block text-left min-w-0 max-w-[128px]">
          <p className="text-[12px] font-semibold text-text leading-tight truncate">{avatarName}</p>
          <p className="text-[10px] text-text-muted leading-tight truncate">{user?.role?.name}</p>
        </div>
        <FiChevronDown
          className={`w-3.5 h-3.5 text-text-muted shrink-0 transition-transform duration-200
            ${open ? 'rotate-180 text-brand' : 'group-hover:text-text'}`}
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              ref={menuRef}
              role="menu"
              variants={menuVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              style={{ top: pos.top, left: pos.left, width: MENU_WIDTH }}
              className="fixed z-[1450] rounded-2xl border border-border bg-card-bg shadow-dropdown overflow-hidden"
            >
              <div className="px-4 py-3.5 border-b border-border bg-gradient-to-br from-brand-soft/30 to-transparent">
                <div className="flex items-center gap-3">
                  <Avatar name={avatarName} src={resolvePublicAssetUrl(user?.avatar)} size="md" className="ring-2 ring-brand-soft shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-text truncate">{avatarName}</p>
                    <div className="mt-1">
                      <RoleBadge slug={roleSlug} name={user?.role?.name} size="sm" />
                    </div>
                    <p className="flex items-center gap-1 text-[11px] text-text-muted truncate mt-1.5">
                      <FiMail className="w-3 h-3 shrink-0" />
                      <span className="truncate">{email}</span>
                    </p>
                  </div>
                </div>
              </div>

              <div className="p-1.5">
                {menuItems.map(({ id, label, icon: Icon, path }) => (
                  <button
                    key={id}
                    type="button"
                    role="menuitem"
                    onClick={() => go(path)}
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-medium text-text-secondary
                      hover:text-text hover:bg-row-hover transition-colors group/item"
                  >
                    <span className="flex items-center justify-center w-7 h-7 rounded-md bg-page text-text-muted
                      group-hover/item:bg-brand-soft group-hover/item:text-brand transition-colors">
                      <Icon className={iconSize.sm} />
                    </span>
                    {label}
                  </button>
                ))}
              </div>

              <div className="p-1.5 pt-0 border-t border-border/60">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-sm font-semibold text-danger
                    hover:bg-danger-soft transition-colors group/logout mt-1"
                >
                  <span className="flex items-center justify-center w-7 h-7 rounded-md bg-danger-soft/50 text-danger
                    group-hover/logout:bg-danger group-hover/logout:text-white transition-colors">
                    <FiLogOut className={iconSize.sm} />
                  </span>
                  Logout
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}
