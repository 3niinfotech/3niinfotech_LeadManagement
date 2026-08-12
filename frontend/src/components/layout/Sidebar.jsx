import { useState, useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiChevronDown, FiChevronLeft, FiChevronRight, FiSearch, FiGrid, FiLogOut,
} from 'react-icons/fi';
import { iconSize } from '../../theme/icons';
import { pageEase } from '../../theme/pageMotion';
import Avatar from '../ui/Avatar';
import { toggleSidebar, selectSidebarCollapsed } from '../../redux/slices/uiSlice';
import { selectPermissions, selectUser, logoutUser } from '../../redux/slices/authSlice';
import { hasAnyPermission } from '../../config/permissions';
import { useSidebarMenu } from '../../hooks/useSidebarMenu';
import { sidebar as sidebarTheme } from '../../theme';

const submenuEase = pageEase;
const submenuSpring = { type: 'spring', stiffness: 400, damping: 34, mass: 0.82 };

const flyoutTooltipVariants = {
  hidden: { opacity: 0, x: -8, scale: 0.96 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.18, ease: submenuEase } },
  exit: { opacity: 0, x: -6, scale: 0.97, transition: { duration: 0.12 } },
};

const flyoutPanelVariants = {
  hidden: { opacity: 0, x: -16, scale: 0.94 },
  visible: {
    opacity: 1,
    x: 0,
    scale: 1,
    transition: {
      ...submenuSpring,
      staggerChildren: 0.05,
      delayChildren: 0.04,
    },
  },
  exit: {
    opacity: 0,
    x: -12,
    scale: 0.96,
    transition: { duration: 0.16, ease: submenuEase },
  },
};

const flyoutItemVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: submenuEase } },
};

const accordionVariants = {
  hidden: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.26, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.14 },
    },
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.34, ease: submenuEase },
      opacity: { duration: 0.22, delay: 0.06 },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.24, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.1 },
    },
  },
};

const submenuListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.045, delayChildren: 0.07 } },
  exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};

const submenuChildVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: submenuEase } },
  exit: { opacity: 0, x: -6, transition: { duration: 0.12 } },
};

const labelReveal = {
  collapsed: { opacity: 0, x: -6, maxWidth: 0 },
  expanded: { opacity: 1, x: 0, maxWidth: 220 },
};

const labelRevealTransition = (isExpanding) => ({
  opacity: {
    duration: isExpanding ? 0.26 : 0.14,
    ease: submenuEase,
    delay: isExpanding ? 0.07 : 0,
  },
  x: {
    duration: isExpanding ? 0.28 : 0.12,
    ease: submenuEase,
    delay: isExpanding ? 0.05 : 0,
  },
  maxWidth: {
    duration: isExpanding ? 0.32 : 0.16,
    ease: submenuEase,
    delay: isExpanding ? 0.04 : 0,
  },
});

function NavRevealText({ children, compact, isExpanding, className = '' }) {
  return (
    <motion.span
      initial={false}
      animate={compact ? 'collapsed' : 'expanded'}
      variants={labelReveal}
      transition={labelRevealTransition(isExpanding)}
      className={`overflow-hidden whitespace-nowrap ${compact ? 'flex-none w-0' : 'flex-1 min-w-0'} ${className}`}
    >
      {children}
    </motion.span>
  );
}

function getItemStyles({
  active,
  compact,
  depth,
  hasChildren,
  childActive,
  expanded,
  isSelfActive,
}) {
  const isChild = depth > 0;
  const parentOpen = hasChildren && expanded && !compact;
  const parentHighlighted = hasChildren && childActive && !isSelfActive;
  const highlighted = active || childActive;

  if (compact) {
    let shell = 'sidebar-nav-item relative flex items-center justify-center w-full h-10 rounded-xl font-medium transition-colors duration-200 ease-out';
    if (highlighted) return `${shell} text-sidebar-textActive bg-sidebar-activeBg`;
    return `${shell} text-sidebar-text hover:text-text hover:bg-sidebar-bgHover`;
  }

  let shell = 'sidebar-nav-item relative flex items-center gap-2.5 w-full font-medium transition-colors duration-200 ease-out';
  if (isChild) {
    shell += ` px-3 h-9 text-[13px] rounded-lg mx-0.5${depth > 1 ? ' ml-2' : ''}`;
  } else {
    shell += ' px-3 h-10 text-sm rounded-lg';
  }

  if (active) {
    return `${shell} text-sidebar-textActive bg-sidebar-activeBg font-medium`;
  }

  if (parentOpen && !isSelfActive) {
    return `${shell} text-text bg-transparent hover:bg-sidebar-bgHover/40`;
  }

  if (parentHighlighted) {
    return `${shell} text-sidebar-textActive bg-sidebar-activeBg font-medium`;
  }

  if (isChild) {
    return `${shell} text-sidebar-submenuText hover:text-text hover:bg-sidebar-bgHover`;
  }

  return `${shell} text-sidebar-text hover:text-text hover:bg-sidebar-bgHover`;
}

function NavIconSlot({ Icon, active, childActive, isChild, compact }) {
  const highlighted = active || childActive;
  const iconClass = highlighted ? 'text-sidebar-textActive' : 'text-current';

  return (
    <span
      className={`flex items-center justify-center shrink-0 relative z-10 transition-colors duration-200
        ${compact ? 'w-5 h-5' : isChild ? 'w-5 h-5' : 'w-5 h-5'}`}
    >
      <Icon className={`${iconSize.md} ${iconClass}`} strokeWidth={1.75} />
      {compact && childActive && !active && (
        <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 rounded-full bg-sidebar-activeBar ring-2 ring-sidebar-bg" />
      )}
    </span>
  );
}

function ActiveIndicator({ active, isChild, compact }) {
  if (!active || compact) return null;
  return (
    <span
      className={`absolute top-1/2 -translate-y-1/2 bg-sidebar-activeBar rounded-full
        ${isChild ? 'left-2 w-1 h-1' : 'left-1.5 w-[3px] h-4 rounded-r-full'}`}
    />
  );
}

function NavItemContent({
  Icon,
  label,
  active,
  compact,
  showChevron,
  expanded,
  isChild,
  childActive,
  isExpanding,
}) {
  if (compact) {
    return Icon ? (
      <NavIconSlot
        Icon={Icon}
        active={active}
        childActive={childActive}
        isChild={isChild}
        compact
      />
    ) : null;
  }

  return (
    <>
      <ActiveIndicator active={active} isChild={isChild} compact={compact} />
      {Icon && (
        <NavIconSlot
          Icon={Icon}
          active={active}
          childActive={childActive}
          isChild={isChild}
          compact={false}
        />
      )}
      <NavRevealText
        compact={compact}
        isExpanding={isExpanding}
        className={`relative z-10 min-w-0 truncate text-left flex-1 ${active ? 'font-medium' : ''}`}
      >
        {label}
      </NavRevealText>
      {showChevron && (
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={submenuSpring}
          className="relative z-10 flex items-center justify-center shrink-0"
        >
          <FiChevronDown
            className={`${iconSize.sm} transition-colors duration-200 ${
              expanded || childActive ? 'text-sidebar-textActive' : 'text-text-muted'
            }`}
          />
        </motion.span>
      )}
    </>
  );
}

function CollapsedTooltip({ label, children }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="relative" onMouseEnter={() => setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {children}
      <AnimatePresence>
        {open && (
          <motion.div
            variants={flyoutTooltipVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="absolute left-[calc(100%+12px)] top-1/2 -translate-y-1/2 z-[1060] px-2.5 py-1.5 bg-text text-white text-xs font-medium rounded-lg shadow-dropdown whitespace-nowrap pointer-events-none"
          >
            {label}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CollapsedFlyout({ label, children, items }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const timer = useRef(null);
  const triggerRef = useRef(null);
  const location = useLocation();

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setPos({
      top: rect.top + rect.height / 2,
      left: rect.right + sidebarTheme.flyoutGap,
    });
  }, []);

  const show = useCallback(() => {
    clearTimeout(timer.current);
    updatePosition();
    setOpen(true);
  }, [updatePosition]);

  const hide = useCallback(() => {
    timer.current = setTimeout(() => setOpen(false), sidebarTheme.flyoutHideDelay);
  }, []);

  useEffect(() => () => clearTimeout(timer.current), []);

  useEffect(() => {
    if (!open) return undefined;
    const onReflow = () => updatePosition();
    window.addEventListener('scroll', onReflow, true);
    window.addEventListener('resize', onReflow);
    return () => {
      window.removeEventListener('scroll', onReflow, true);
      window.removeEventListener('resize', onReflow);
    };
  }, [open, updatePosition]);

  return (
    <div ref={triggerRef} className="relative" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              key="flyout"
              variants={flyoutPanelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed z-[1060] -translate-y-1/2"
              style={{ top: pos.top, left: pos.left }}
              onMouseEnter={show}
              onMouseLeave={hide}
            >
              {/* Invisible bridge — smooth hover from sidebar to flyout */}
              <span
                className="absolute right-full top-1/2 -translate-y-1/2 h-[calc(100%+16px)] w-3"
                aria-hidden
              />
              <div className="min-w-[200px] py-1.5 rounded-xl border border-border bg-card-bg shadow-dropdown overflow-hidden">
                <motion.p
                  variants={flyoutItemVariants}
                  className="px-3.5 pt-2 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted"
                >
                  {label}
                </motion.p>
                <motion.div
                  className="px-1.5 pb-1.5 space-y-0.5"
                  variants={submenuListVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {items.map((child) => {
                    const ChildIcon = child.icon;
                    const isActive = isNavPathActive(location.pathname, child.path);
                    return (
                      <motion.div key={child.id} variants={flyoutItemVariants}>
                        <NavLink
                          to={child.path}
                          end={child.path === '/master'}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150
                            ${isActive
                              ? 'text-sidebar-textActive bg-sidebar-activeBg'
                              : 'text-text-secondary hover:text-text hover:bg-row-hover'
                            }`}
                        >
                          {ChildIcon && <ChildIcon className={`${iconSize.sm} shrink-0`} />}
                          <span>{child.label}</span>
                        </NavLink>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </div>
  );
}

function isNavPathActive(pathname, navPath) {
  if (!navPath) return false;
  if (pathname === navPath) return true;
  // Hub routes like /master should not stay active for every child path
  if (navPath === '/master') return false;
  return pathname.startsWith(`${navPath}/`);
}

function isTreePathActive(item, pathname) {
  if (item.path && isNavPathActive(pathname, item.path)) return true;
  return item.children?.some((child) => isTreePathActive(child, pathname)) ?? false;
}

function flattenNavLinks(items = []) {
  const links = [];
  for (const item of items) {
    if (item.path) links.push(item);
    if (item.children?.length) links.push(...flattenNavLinks(item.children));
  }
  return links;
}

function menuMatchesSearch(item, query) {
  const q = query.toLowerCase();
  if (item.label.toLowerCase().includes(q)) return true;
  return item.children?.some((child) => menuMatchesSearch(child, q)) ?? false;
}

function canViewNavItem(item, userPermissions) {
  const required = item.permissions || (item.permission ? [item.permission] : []);
  if (!required.length) return true;
  return hasAnyPermission(userPermissions, required);
}

function SidebarItem({
  item,
  compact,
  isAnimating,
  isExpanding,
  depth = 0,
  onExpandSidebar,
  expandItemId,
  onExpandConsumed,
}) {
  const location = useLocation();
  const permissions = useSelector(selectPermissions);
  const Icon = item.icon;
  const hasChildren = item.children?.length > 0;

  const visibleChildren = item.children?.filter(
    (child) => canViewNavItem(child, permissions)
  );

  const childActive = visibleChildren?.some(
    (c) => isTreePathActive(c, location.pathname),
  ) ?? false;

  const [expanded, setExpanded] = useState(false);
  const [userClosed, setUserClosed] = useState(false);

  const isSelfActive = item.path ? location.pathname === item.path : false;
  const canShowSubmenu = !compact && !isAnimating;

  useEffect(() => {
    setUserClosed(false);
  }, [location.pathname]);

  useEffect(() => {
    if (compact || isAnimating) {
      setExpanded(false);
      return;
    }
    if (!userClosed && childActive) setExpanded(true);
  }, [childActive, compact, isAnimating, userClosed]);

  useEffect(() => {
    if (canShowSubmenu && expandItemId === item.id) {
      setExpanded(true);
      setUserClosed(false);
      onExpandConsumed?.();
    }
  }, [canShowSubmenu, expandItemId, item.id, onExpandConsumed]);

  const toggleGroup = useCallback(() => {
    if (compact) return;
    setExpanded((prev) => {
      const next = !prev;
      setUserClosed(!next);
      return next;
    });
  }, [compact]);

  if (!canViewNavItem(item, permissions)) return null;
  if (hasChildren && !visibleChildren?.length) return null;

  if (hasChildren) {
    const groupOpen = canShowSubmenu && expanded;

    const groupBtn = (
      <motion.button
        type="button"
        onClick={toggleGroup}
        whileTap={compact ? undefined : { scale: 0.98 }}
        className={getItemStyles({
          active: isSelfActive,
          compact,
          depth,
          hasChildren: true,
          childActive,
          expanded: groupOpen,
          isSelfActive,
        })}
      >
        <NavItemContent
          Icon={Icon}
          label={item.label}
          active={isSelfActive}
          compact={compact}
          showChevron
          expanded={expanded}
          isChild={depth > 0}
          childActive={childActive}
          isExpanding={isExpanding}
        />
      </motion.button>
    );

    if (compact) {
      return (
        <CollapsedFlyout label={item.label} items={flattenNavLinks(visibleChildren)}>
          {groupBtn}
        </CollapsedFlyout>
      );
    }

    return (
      <motion.div
        layout
        initial={false}
        animate={groupOpen ? 'open' : 'closed'}
        variants={{
          open: { marginBottom: 8 },
          closed: { marginBottom: 0 },
        }}
        transition={{ duration: 0.28, ease: submenuEase }}
        className={`rounded-xl border overflow-hidden transition-colors duration-300 ease-out
          ${groupOpen
            ? 'bg-sidebar-submenuBg border-sidebar-submenuLine'
            : 'bg-transparent border-transparent'
          }`}
      >
        {groupBtn}
        <AnimatePresence initial={false}>
          {groupOpen && (
            <motion.div
              key={`submenu-${item.id}`}
              variants={accordionVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="overflow-hidden"
            >
              <motion.div
                variants={submenuListVariants}
                initial="hidden"
                animate="visible"
                exit="exit"
                className="border-t border-sidebar-submenuLine/50 px-1.5 pb-1.5 pt-1 space-y-0.5"
              >
                {visibleChildren.map((child) => (
                  <motion.div key={child.id} variants={submenuChildVariants}>
                    <SidebarItem
                      item={child}
                      compact={false}
                      isAnimating={false}
                      isExpanding={false}
                      depth={depth + 1}
                      onExpandSidebar={onExpandSidebar}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  }

  if (!item.path) return null;

  const link = (
    <NavLink
      to={item.path}
      end={item.path === '/master'}
      className="block outline-none focus:outline-none focus-visible:outline-none"
    >
      {({ isActive: active }) => (
        <motion.div
          whileTap={compact ? undefined : { scale: 0.98 }}
          className={getItemStyles({
            active,
            compact,
            depth,
            hasChildren: false,
            childActive: false,
            expanded: false,
            isSelfActive: active,
          })}
        >
          <NavItemContent
            Icon={Icon}
            label={item.label}
            active={active}
            compact={compact}
            isChild={depth > 0}
            isExpanding={isExpanding}
          />
        </motion.div>
      )}
    </NavLink>
  );

  return compact ? <CollapsedTooltip label={item.label}>{link}</CollapsedTooltip> : link;
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const collapsed = useSelector(selectSidebarCollapsed);
  const user = useSelector(selectUser);
  const menuConfig = useSidebarMenu();
  const [search, setSearch] = useState('');
  const [expandItemId, setExpandItemId] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const width = collapsed ? sidebarTheme.collapsedWidth : sidebarTheme.width;
  const isExpanding = !collapsed && isAnimating;

  useEffect(() => {
    if (collapsed) setExpandItemId(null);
  }, [collapsed]);

  const filteredConfig = search
    ? menuConfig.filter((item) => menuMatchesSearch(item, search))
    : menuConfig;

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/login');
  };

  const handleExpandConsumed = () => setExpandItemId(null);

  return (
    <motion.div
      animate={{ width }}
      transition={
        collapsed
          ? { type: 'tween', duration: 0.26, ease: pageEase }
          : { type: 'spring', stiffness: 320, damping: 32 }
      }
      onAnimationStart={() => setIsAnimating(true)}
      onAnimationComplete={() => setIsAnimating(false)}
      className="fixed left-0 top-0 h-screen z-[1020] overflow-visible pointer-events-none"
    >
      <aside className="h-full flex flex-col bg-sidebar-bg border-r border-sidebar-border shadow-sidebar overflow-hidden pointer-events-auto">
        <div className={`h-16 flex items-center justify-center border-b border-sidebar-border shrink-0 ${collapsed ? 'px-2' : 'px-4'}`}>
          <div className={`flex items-center min-w-0 ${collapsed ? 'justify-center' : 'gap-2.5 w-full'}`}>
            <div
              className={`rounded-xl bg-primary-600 flex items-center justify-center shrink-0 shadow-sm
                ${collapsed ? 'w-9 h-9' : 'w-9 h-9'}`}
            >
              <FiGrid className={`${iconSize.md} text-white`} strokeWidth={1.75} />
            </div>
            {!collapsed && (
              <NavRevealText
                compact={false}
                isExpanding={isExpanding}
                className="text-text font-semibold text-base tracking-tight flex-1 min-w-0"
              >
                Lead<span className="text-primary-600">CRM</span>
              </NavRevealText>
            )}
          </div>
        </div>

        <motion.div
          initial={false}
          animate={{
            opacity: collapsed ? 0 : 1,
            height: collapsed ? 0 : 'auto',
            marginTop: collapsed ? 0 : undefined,
          }}
          transition={{
            opacity: { duration: collapsed ? 0.12 : 0.24, delay: collapsed ? 0 : 0.08, ease: submenuEase },
            height: { duration: collapsed ? 0.18 : 0.28, ease: submenuEase },
          }}
          className="px-3 shrink-0 overflow-hidden border-b border-sidebar-border/60"
          style={{ pointerEvents: collapsed ? 'none' : 'auto' }}
        >
          <div className="relative pt-1.5 pb-1.5">
            <FiSearch className={`absolute left-2.5 top-1/2 -translate-y-1/2 ${iconSize.sm} text-text-muted pointer-events-none`} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter menu..."
              tabIndex={collapsed ? -1 : 0}
              className="w-full h-8 pl-8 pr-2.5 rounded-lg bg-card-bg/80 border border-border/80 text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-600/25 focus:border-primary-600/60 transition-colors"
            />
          </div>
        </motion.div>

        <nav className={`sidebar-nav flex-1 scroll-area overflow-y-auto overflow-x-hidden pt-2 pb-3 space-y-0.5 min-h-0 ${collapsed ? 'px-2' : 'px-2'}`}>
          {filteredConfig.map((item) => (
            <SidebarItem
              key={item.id}
              item={item}
              compact={collapsed}
              isAnimating={isAnimating}
              isExpanding={isExpanding}
              onExpandSidebar={() => dispatch(toggleSidebar())}
              expandItemId={expandItemId}
              onExpandConsumed={handleExpandConsumed}
            />
          ))}
        </nav>

        <div className={`border-t border-sidebar-border shrink-0 ${collapsed ? 'p-2 space-y-0.5' : 'p-2 space-y-1'}`}>
          {user && (
            <div className={`flex items-center rounded-xl hover:bg-sidebar-bgHover transition-colors duration-200
              ${collapsed ? 'justify-center h-10' : 'gap-2.5 px-2 py-2'}`}
            >
              <Avatar name={`${user.firstName} ${user.lastName}`} size="sm" />
              {!collapsed && (
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text truncate">{user.firstName} {user.lastName}</p>
                  <p className="text-[11px] text-text-muted truncate">{user.role?.name}</p>
                </div>
              )}
            </div>
          )}
          <button
            type="button"
            onClick={handleLogout}
            title="Logout"
            className={`w-full flex items-center text-sm font-medium text-danger hover:bg-danger-soft transition-colors duration-200
              ${collapsed ? 'justify-center h-10 rounded-xl' : 'gap-3 px-3 py-2.5 rounded-xl'}`}
          >
            <FiLogOut className={iconSize.md} strokeWidth={1.75} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </aside>

      <div
        className="absolute z-[1060] pointer-events-auto"
        style={{
          top: sidebarTheme.toggleTop,
          left: '100%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <motion.button
          type="button"
          onClick={() => dispatch(toggleSidebar())}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          className="rounded-full bg-card-bg border border-border-strong shadow-dropdown
            flex items-center justify-center text-text-secondary hover:text-primary-600 hover:border-primary-600
            hover:bg-brand-soft transition-colors duration-200"
          style={{
            width: sidebarTheme.toggleSize,
            height: sidebarTheme.toggleSize,
          }}
        >
          {collapsed ? <FiChevronRight className={iconSize.sm} /> : <FiChevronLeft className={iconSize.sm} />}
        </motion.button>
      </div>
    </motion.div>
  );
}
