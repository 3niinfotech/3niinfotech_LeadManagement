import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { FiChevronDown, FiChevronRight, FiLogOut, FiMail, FiMapPin, FiSettings, FiShield, FiUser } from 'react-icons/fi';
import Avatar from '../ui/Avatar';
import { selectUser, logoutUser } from '../../redux/slices/authSlice';
import { ROUTES } from '../../config/routes';
import { PERMISSIONS } from '../../config/permissions';
import { pageEase } from '../../theme/pageMotion';
import { usePermissions } from '../../hooks/usePermissions';
import { resolvePublicAssetUrl } from '../../config/company-settings.config';

const MENU_WIDTH = 250;
const MENU_GAP = 8;

const menuVariants = {
  hidden: { opacity: 0, y: -6, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.16, ease: pageEase },
  },
  exit: { opacity: 0, y: -4, scale: 0.98, transition: { duration: 0.1 } },
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
  const branchName = user?.branch?.name || user?.branchName || '';

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
    navigate('/');
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
        className={`group flex items-center gap-2 h-9 pl-1.5 pr-2.5 rounded-xl border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary/20
          ${open
            ? 'bg-primary/10 border-primary/30 shadow-xs'
            : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-primary/30 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs'
          }`}
      >
        <div className="relative shrink-0">
          <Avatar name={avatarName} src={resolvePublicAssetUrl(user?.avatar)} size="sm" className="!w-7 !h-7 ring-1 ring-slate-200 dark:ring-slate-700" />
          <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-1.5 ring-white dark:ring-slate-900" />
        </div>
        <div className="hidden lg:block text-left min-w-0 max-w-[128px]">
          <p className="text-[12px] font-semibold text-slate-800 dark:text-slate-100 leading-tight truncate">{avatarName}</p>
          <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight truncate">{branchName || 'Active'}</p>
        </div>
        <FiChevronDown
          className={`w-3.5 h-3.5 text-slate-400 shrink-0 transition-transform duration-200
            ${open ? 'rotate-180 text-primary' : 'group-hover:text-slate-600'}`}
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
              className="fixed z-[1450] rounded-xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xl overflow-hidden ring-1 ring-black/[0.05]"
            >
              {/* Header profile area */}
              <div className="p-3 border-b border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40">
                <div className="flex items-center gap-2.5">
                  <div className="relative shrink-0">
                    <Avatar
                      name={avatarName}
                      src={resolvePublicAssetUrl(user?.avatar)}
                      size="sm"
                      className="!w-9 !h-9 rounded-xl ring-2 ring-primary/20 shadow-xs"
                    />
                    <span className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-2 ring-white dark:ring-slate-900" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-bold text-slate-900 dark:text-white truncate leading-tight">
                      {avatarName}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate mt-0.5">
                      {email}
                    </p>
                    {branchName ? (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded mt-1">
                        <FiMapPin className="w-2.5 h-2.5" />
                        {branchName}
                      </span>
                    ) : null}
                  </div>
                </div>
              </div>

              {/* Navigation Items */}
              <div className="p-1 space-y-0.5">
                {menuItems.map(({ id, label, icon: Icon, path }) => (
                  <button
                    key={id}
                    type="button"
                    role="menuitem"
                    onClick={() => go(path)}
                    className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-[13px] font-medium text-slate-700 dark:text-slate-200
                      hover:text-primary hover:bg-slate-100/70 dark:hover:bg-slate-800/60 transition-colors group/item"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <Icon className="w-4 h-4 text-slate-400 group-hover/item:text-primary transition-colors shrink-0" />
                      <span className="truncate">{label}</span>
                    </div>
                    <FiChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover/item:opacity-100 transition-opacity shrink-0" />
                  </button>
                ))}
              </div>

              {/* Logout button */}
              <div className="p-1 pt-0.5 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  role="menuitem"
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-lg text-[13px] font-medium text-rose-600 dark:text-rose-400
                    hover:bg-rose-50 dark:hover:bg-rose-950/30 transition-colors group/logout"
                >
                  <FiLogOut className="w-4 h-4 text-rose-500 group-hover/logout:text-rose-600 transition-colors shrink-0" />
                  <span>Logout</span>
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
