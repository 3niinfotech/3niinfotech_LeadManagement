import {
  useState, useEffect, useCallback, useRef, useMemo, createContext, useContext,
} from 'react';
import { createPortal } from 'react-dom';
import { NavLink, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useDispatch, useSelector } from 'react-redux';
import {
  FiChevronDown, FiChevronLeft, FiChevronRight, FiSearch, FiGrid, FiX,
} from 'react-icons/fi';
import { iconSize } from '../../theme/icons';
import { pageEase } from '../../theme/pageMotion';
import { toggleSidebar, selectSidebarCollapsed } from '../../redux/slices/uiSlice';
import { logoutUser, selectPermissions, selectUser } from '../../redux/slices/authSlice';
import { hasAnyPermission } from '../../config/permissions';
import { isMastersForcedHidden, isReceptionForcedHidden } from '../../config/access-policy';
import { useSidebarMenu } from '../../hooks/useSidebarMenu';
import { sidebar as sidebarTheme } from '../../theme';
import { useCompanyRuntime } from '../../features/organization/CompanyRuntime';
import { resolvePublicAssetUrl } from '../../config/company-settings.config';
import SidebarProfileDock from './SidebarProfileDock';
import SidebarMonthlyTarget from './SidebarMonthlyTarget';
import { ROLES } from '../../config/roles';

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
      height: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.12, ease: 'easeOut' },
    },
  },
  visible: {
    height: 'auto',
    opacity: 1,
    transition: {
      height: { duration: 0.28, ease: [0, 0, 0.2, 1] },
      opacity: { duration: 0.18, delay: 0.05, ease: 'easeOut' },
    },
  },
  exit: {
    height: 0,
    opacity: 0,
    transition: {
      height: { duration: 0.22, ease: [0.4, 0, 0.2, 1] },
      opacity: { duration: 0.1, ease: 'easeIn' },
    },
  },
};

const ACCORDION_SWITCH_MS = 230;

const submenuListVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.035, delayChildren: 0.05 } },
  exit: { transition: { staggerChildren: 0, staggerDirection: -1 } },
};

const submenuChildVariants = {
  hidden: { opacity: 0, x: -8 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.22, ease: submenuEase } },
  exit: { opacity: 0, x: -6, transition: { duration: 0.12 } },
};

const labelReveal = {
  collapsed: { opacity: 0, x: -6, maxWidth: 0 },
  expanded: { opacity: 1, x: 0, maxWidth: 248 },
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
    shell += ` px-2.5 h-9 text-[13px] rounded-lg${depth > 1 ? ' ml-1' : ''}`;
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
    <span className="flex items-center justify-center shrink-0 relative z-10 w-5 h-5 transition-colors duration-200">
      <Icon className={`${iconSize.md} ${iconClass}`} strokeWidth={1.75} />
      {compact && childActive && !active && (
        <span className="absolute -bottom-1 -right-1 w-1.5 h-1.5 rounded-full bg-sidebar-activeBar ring-2 ring-sidebar-bg" />
      )}
    </span>
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
    if (!Icon) return null;
    return (
      <NavIconSlot
        Icon={Icon}
        active={active}
        childActive={childActive}
        isChild={isChild}
        compact
      />
    );
  }

  return (
    <>
      {Icon ? (
        <NavIconSlot
          Icon={Icon}
          active={active}
          childActive={childActive}
          isChild={isChild}
          compact={false}
        />
      ) : null}
      <NavRevealText
        compact={compact}
        isExpanding={isExpanding}
        className={`relative z-10 min-w-0 truncate text-left flex-1 ${active ? 'font-medium' : ''}`}
      >
        {label}
      </NavRevealText>
      {showChevron ? (
        <motion.span
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.22, ease: submenuEase }}
          className="relative z-10 flex items-center justify-center shrink-0"
        >
          <FiChevronDown
            className={`${iconSize.sm} transition-colors duration-200 ${
              expanded || childActive ? 'text-sidebar-textActive' : 'text-text-muted'
            }`}
          />
        </motion.span>
      ) : null}
    </>
  );
}

function CollapsedTooltip({ label, children }) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  return (
    <div
      ref={triggerRef}
      className="relative"
      onMouseEnter={() => {
        const rect = triggerRef.current?.getBoundingClientRect();
        if (rect) setPos({ top: rect.top + rect.height / 2, left: rect.right + 12 });
        setOpen(true);
      }}
      onMouseLeave={() => setOpen(false)}
    >
      {children}
      {createPortal(
        <AnimatePresence>
          {open && (
            <motion.div
              variants={flyoutTooltipVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed z-[1500] px-2.5 py-1.5 bg-text text-white text-xs font-medium rounded-lg shadow-dropdown whitespace-nowrap pointer-events-none -translate-y-1/2"
              style={{ top: pos.top, left: pos.left }}
            >
              {label}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </div>
  );
}

function CollapsedFlyout({ label, children, items }) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState({ top: 0, left: 0, maxHeight: 420 });
  const timer = useRef(null);
  const triggerRef = useRef(null);
  const activeNav = useContext(ActiveNavContext);

  const updatePosition = useCallback(() => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    const pad = 12;
    const left = rect.right + sidebarTheme.flyoutGap;
    const viewportH = window.innerHeight;

    // Prefer aligning with trigger top; clamp so the panel never clips off-screen
    let top = rect.top;
    let maxHeight = viewportH - top - pad;

    // If little room below, shift panel upward and use space above the trigger bottom
    if (maxHeight < 280) {
      maxHeight = Math.min(viewportH - pad * 2, Math.max(240, viewportH - pad * 2));
      top = Math.max(pad, viewportH - pad - maxHeight);
    } else {
      top = Math.max(pad, top);
      maxHeight = Math.max(200, viewportH - top - pad);
    }

    setPos({ top, left, maxHeight });
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
              className="fixed z-[1500]"
              style={{ top: pos.top, left: pos.left, maxHeight: pos.maxHeight }}
              onMouseEnter={show}
              onMouseLeave={hide}
            >
              {/* Invisible bridge — smooth hover from sidebar to flyout */}
              <span
                className="absolute right-full top-0 h-full w-3"
                aria-hidden
              />
              <div
                className="min-w-[200px] max-w-[260px] rounded-xl border border-border bg-card-bg shadow-dropdown
                  flex flex-col overflow-hidden"
                style={{ maxHeight: pos.maxHeight }}
              >
                <motion.p
                  variants={flyoutItemVariants}
                  className="px-3.5 pt-2.5 pb-1.5 text-[10px] font-semibold uppercase tracking-wider text-text-muted shrink-0"
                >
                  {label}
                </motion.p>
                <motion.div
                  className="px-1.5 pb-1.5 space-y-0.5 overflow-y-auto no-scrollbar overscroll-contain min-h-0 flex-1"
                  variants={submenuListVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                >
                  {items.map((child) => {
                    const ChildIcon = child.icon;
                    const isActive = child.id === activeNav.id;
                    return (
                      <motion.div key={child.id} variants={flyoutItemVariants}>
                        <NavLink
                          to={child.path}
                          onClick={() => setOpen(false)}
                          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150
                            ${isActive
                              ? 'text-sidebar-textActive bg-sidebar-activeBg'
                              : 'text-text-secondary hover:text-text hover:bg-row-hover'
                            }`}
                        >
                          {ChildIcon && <ChildIcon className={`${iconSize.sm} shrink-0`} />}
                          <span className="truncate">{child.label}</span>
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

/**
 * Only one menu row may be active. When several links share a route (e.g. Team & Access),
 * prefer the shallowest (top-level) item.
 */
function flattenNavLinks(items = [], depth = 0) {
  const links = [];
  for (const item of items) {
    if (item.path) links.push({ ...item, depth });
    if (item.children?.length) links.push(...flattenNavLinks(item.children, depth + 1));
  }
  return links;
}

function normalizeNavPath(p) {
  if (!p) return '';
  return p.split('?')[0].split('#')[0].replace(/\/+$/, '') || '/';
}

function resolveActiveNavLink(items, pathname) {
  const cleanCurrent = normalizeNavPath(pathname);
  if (!cleanCurrent) return null;

  let best = null;
  let bestScore = -1;

  for (const link of flattenNavLinks(items)) {
    if (!link.path) continue;
    const cleanLink = normalizeNavPath(link.path);
    if (!cleanLink) continue;

    let score = -1;

    // 1. Exact match (highest priority)
    if (cleanCurrent === cleanLink) {
      score = 100000 + cleanLink.length * 10 + link.depth;
    }
    // 2. Prefix match (only if cleanLink is not root '/')
    else if (cleanLink !== '/' && cleanCurrent.startsWith(`${cleanLink}/`)) {
      // Longest prefix match wins; deeper depth breaks ties
      score = cleanLink.length * 100 + link.depth;
    }

    if (score > bestScore) {
      bestScore = score;
      best = link;
    }
  }

  return best;
}

function subtreeHasActiveItem(item, activeId) {
  if (!activeId) return false;
  if (item.id === activeId) return true;
  return item.children?.some((child) => subtreeHasActiveItem(child, activeId)) ?? false;
}

const ActiveNavContext = createContext({ id: null, path: null });

/** Group ids that must stay open so the active route is visible */
function collectActiveAncestorIds(items, activeId) {
  const open = new Set();

  const walk = (list = []) => {
    let branchActive = false;
    for (const item of list) {
      const selfActive = item.id === activeId;
      const childActive = item.children?.length ? walk(item.children) : false;
      if (childActive && item.children?.length) open.add(item.id);
      if (selfActive || childActive) branchActive = true;
    }
    return branchActive;
  };

  walk(items);
  return open;
}

/** Nested group ids under a menu folder (for accordion close) */
function collectDescendantGroupIds(item) {
  const ids = [];
  const walk = (nodes = []) => {
    for (const node of nodes) {
      if (!node.children?.length) continue;
      ids.push(node.id);
      walk(node.children);
    }
  };
  walk(item.children);
  return ids;
}

function menuItemSearchText(item) {
  const parts = [
    item.label,
    item.path,
    item.id,
    ...(item.keywords || []),
  ];
  if (!item.children?.length) parts.push(item.description);
  return parts.filter(Boolean).join(' ').toLowerCase();
}

function menuItemMatchesTokens(item, tokens) {
  const haystack = menuItemSearchText(item);
  return tokens.every((token) => haystack.includes(token));
}

/** Keep only matching leaves. Groups stay only as folders for those matches. */
function filterMenuTree(items, query) {
  const q = String(query || '').trim().toLowerCase();
  if (!q) return items;
  const tokens = q.split(/\s+/).filter(Boolean);
  if (!tokens.length) return items;

  const walk = (list = []) => {
    const next = [];
    for (const item of list) {
      const childMatches = item.children?.length ? walk(item.children) : [];
      if (childMatches.length) {
        next.push({ ...item, children: childMatches });
        continue;
      }
      if (!item.children?.length && menuItemMatchesTokens(item, tokens)) {
        next.push(item);
      }
    }
    return next;
  };

  return walk(items);
}

function canViewNavItem(item, userPermissions, roleSlug) {
  if (item.id === 'master' && isMastersForcedHidden(roleSlug)) return false;
  if (String(item.id || '').startsWith('master-') && isMastersForcedHidden(roleSlug)) return false;
  if (item.id === 'reception' && isReceptionForcedHidden(roleSlug)) return false;
  if (String(item.id || '').startsWith('teacher-') && roleSlug !== 'teacher') return false;

  const required = item.permissions || (item.permission ? [item.permission] : []);
  if (required.length && !hasAnyPermission(userPermissions, required)) return false;

  if (item.children?.length) {
    return item.children.some((child) => canViewNavItem(child, userPermissions, roleSlug));
  }
  return true;
}

function SidebarItem({
  item,
  compact,
  isAnimating,
  isExpanding,
  depth = 0,
  siblingItems = [],
  openIds,
  onToggleGroup,
  forceExpand = false,
}) {
  const permissions = useSelector(selectPermissions);
  const roleSlug = useSelector(selectUser)?.role?.slug;
  const activeNav = useContext(ActiveNavContext);
  const Icon = item.icon;
  const hasChildren = item.children?.length > 0;

  const visibleChildren = item.children?.filter(
    (child) => canViewNavItem(child, permissions, roleSlug)
  );

  const childActive = visibleChildren?.some(
    (c) => subtreeHasActiveItem(c, activeNav.id),
  ) ?? false;

  const isSelfActive = item.id === activeNav.id;
  const canShowSubmenu = !compact && !isAnimating;
  const isOpen = forceExpand || openIds?.has(item.id);
  const groupOpen = canShowSubmenu && isOpen;

  const toggleGroup = useCallback(() => {
    if (compact || forceExpand) return;
    onToggleGroup?.(item, siblingItems, depth);
  }, [compact, forceExpand, item, onToggleGroup, siblingItems, depth]);

  if (!canViewNavItem(item, permissions, roleSlug)) return null;
  if (hasChildren && !visibleChildren?.length) return null;

  if (hasChildren) {
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
          expanded={groupOpen}
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
      <div
        className={`rounded-xl border overflow-hidden transition-[background-color,border-color,box-shadow,margin] duration-300 ease-out
          ${groupOpen ? 'mb-2 bg-sidebar-submenuBg border-sidebar-submenuLine shadow-sm' : 'mb-0.5 bg-transparent border-transparent'}
        `}
      >
        {groupBtn}
        <AnimatePresence initial={false} mode="wait">
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
                exit="hidden"
                className="sidebar-submenu-body border-t border-sidebar-submenuLine/50 px-2 pb-2 pt-1.5 space-y-0.5"
              >
                {visibleChildren.map((child) => (
                  <motion.div key={child.id} variants={submenuChildVariants}>
                    <SidebarItem
                      item={child}
                      compact={false}
                      isAnimating={false}
                      isExpanding={false}
                      depth={depth + 1}
                      siblingItems={visibleChildren}
                      openIds={openIds}
                      onToggleGroup={onToggleGroup}
                      forceExpand={forceExpand}
                    />
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (!item.path) return null;

  const active = isSelfActive;
  const link = (
    <NavLink
      to={item.path}
      className="block outline-none focus:outline-none focus-visible:outline-none"
    >
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
    </NavLink>
  );

  return compact ? <CollapsedTooltip label={item.label}>{link}</CollapsedTooltip> : link;
}

export default function Sidebar() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const collapsed = useSelector(selectSidebarCollapsed);
  const currentUser = useSelector(selectUser);
  const roleSlug = currentUser?.role?.slug || '';
  const showMonthlyTarget = roleSlug === ROLES.COUNSELLOR || roleSlug === ROLES.TEAM_LEADER;
  const { company } = useCompanyRuntime();
  const menuConfig = useSidebarMenu();
  const [search, setSearch] = useState('');
  const [openIds, setOpenIds] = useState(() => new Set());
  const [pendingOpenId, setPendingOpenId] = useState(null);
  const [isAnimating, setIsAnimating] = useState(false);
  const width = collapsed ? sidebarTheme.collapsedWidth : sidebarTheme.width;
  const isExpanding = !collapsed && isAnimating;

  const query = search.trim();
  const filteredConfig = query ? filterMenuTree(menuConfig, query) : menuConfig;
  const forceExpand = Boolean(query);
  const activeNav = useMemo(
    () => resolveActiveNavLink(menuConfig, location.pathname) || { id: null, path: null },
    [menuConfig, location.pathname],
  );

  useEffect(() => {
    if (collapsed || forceExpand) return;
    const activeAncestors = collectActiveAncestorIds(menuConfig, activeNav.id);
    setOpenIds((prev) => {
      const next = new Set(prev);
      activeAncestors.forEach((id) => next.add(id));
      return next;
    });
    setPendingOpenId(null);
  }, [activeNav.id, menuConfig, collapsed, forceExpand]);

  useEffect(() => {
    if (!pendingOpenId) return undefined;
    const timer = window.setTimeout(() => {
      setOpenIds((prev) => {
        const next = new Set(prev);
        next.add(pendingOpenId);
        return next;
      });
      setPendingOpenId(null);
    }, ACCORDION_SWITCH_MS);
    return () => window.clearTimeout(timer);
  }, [pendingOpenId]);

  const handleToggleGroup = useCallback((item, siblings = []) => {
    let deferOpenId = null;
    let clearPending = false;

    setOpenIds((prev) => {
      const next = new Set(prev);

      if (prev.has(item.id)) {
        next.delete(item.id);
        collectDescendantGroupIds(item).forEach((id) => next.delete(id));
        clearPending = true;
        return next;
      }

      const openSibling = siblings.some(
        (sibling) => sibling.id !== item.id
          && sibling.children?.length
          && prev.has(sibling.id),
      );

      for (const sibling of siblings) {
        if (sibling.id === item.id || !sibling.children?.length) continue;
        next.delete(sibling.id);
        collectDescendantGroupIds(sibling).forEach((id) => next.delete(id));
      }

      if (openSibling) {
        deferOpenId = item.id;
        return next;
      }

      clearPending = true;
      next.add(item.id);
      return next;
    });

    if (clearPending) setPendingOpenId(null);
    else if (deferOpenId) setPendingOpenId(deferOpenId);
  }, []);

  const handleLogout = () => {
    dispatch(logoutUser());
    navigate('/');
  };

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
      className="fixed left-0 top-0 h-screen z-[1120] overflow-visible pointer-events-none"
    >
      <aside className="h-full flex flex-col bg-sidebar-bg border-r border-sidebar-border shadow-sidebar overflow-hidden pointer-events-auto">
        <div className={`h-16 flex items-center justify-center border-b border-sidebar-border shrink-0 ${collapsed ? 'px-2' : 'px-4'}`}>
          <div className={`flex items-center min-w-0 ${collapsed ? 'justify-center' : 'gap-2.5 w-full'}`}>
            <div
              className={`rounded-xl bg-primary-600 flex items-center justify-center shrink-0 shadow-sm overflow-hidden
                ${collapsed ? 'w-9 h-9' : 'w-9 h-9'}`}
            >
              {company?.logo ? (
                <img src={resolvePublicAssetUrl(company.logo)} alt="" className="w-full h-full object-contain bg-white" />
              ) : (
                <FiGrid className={`${iconSize.md} text-white`} strokeWidth={1.75} />
              )}
            </div>
            {!collapsed && (
              <NavRevealText
                compact={false}
                isExpanding={isExpanding}
                className="text-text font-semibold text-base tracking-tight flex-1 min-w-0"
              >
                {company?.name || (
                  <>Lead<span className="text-primary-600">CRM</span></>
                )}
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
              onKeyDown={(e) => {
                if (e.key === 'Escape') setSearch('');
              }}
              placeholder="Filter menu..."
              aria-label="Filter menu"
              tabIndex={collapsed ? -1 : 0}
              className={`w-full h-8 pl-8 rounded-lg bg-card-bg/80 border border-border/80 text-[13px] text-text placeholder:text-text-muted focus:outline-none focus:ring-1 focus:ring-primary-600/25 focus:border-primary-600/60 transition-colors ${query ? 'pr-8' : 'pr-2.5'}`}
            />
            {query && (
              <button
                type="button"
                onClick={() => setSearch('')}
                aria-label="Clear menu filter"
                className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 rounded text-text-muted hover:text-text"
              >
                <FiX className={iconSize.sm} />
              </button>
            )}
          </div>
        </motion.div>

        <nav className={`sidebar-nav no-scrollbar flex-1 overflow-y-auto overflow-x-hidden pt-2 pb-3 space-y-0.5 min-h-0 ${collapsed ? 'px-2' : 'px-2'}`}>
          {filteredConfig.length === 0 ? (
            <p className="px-3 py-8 text-center text-xs text-text-muted">
              No menu items match “{query}”
            </p>
          ) : (
            <ActiveNavContext.Provider value={activeNav}>
              {filteredConfig.map((item) => (
                <SidebarItem
                  key={item.id}
                  item={item}
                  compact={collapsed}
                  isAnimating={isAnimating}
                  isExpanding={isExpanding}
                  siblingItems={filteredConfig}
                  openIds={openIds}
                  onToggleGroup={handleToggleGroup}
                  forceExpand={forceExpand}
                />
              ))}
            </ActiveNavContext.Provider>
          )}
        </nav>

        <div className="sidebar-footer shrink-0 mt-auto">
          {showMonthlyTarget ? (
            <SidebarMonthlyTarget collapsed={collapsed} />
          ) : null}
          <SidebarProfileDock collapsed={collapsed} onLogout={handleLogout} />
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
