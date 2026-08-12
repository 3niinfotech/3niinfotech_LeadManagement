/** Phase 1 — visible sidebar roots and routes (hide legacy items, do not delete routes) */
export const PHASE1_ROOT_IDS = new Set([
  'dashboard',
  'master',
  'master-data',
  'enquiries',
  'enquiry',
  'manage-enquiry',
  'demo',
  'students',
  'fees',
  'reports',
  'settings',
]);

export const PHASE1_ROUTES = new Set([
  '/admin/dashboard',
  '/admin/enquiries',
  '/admin/demo',
  '/admin/students',
  '/admin/fees',
  '/admin/reports',
  '/admin/settings',
  '/admin/master',
]);

/** Path prefixes that belong to Phase 1 */
export function isPhase1Path(path) {
  if (!path) return false;
  if (PHASE1_ROUTES.has(path)) return true;
  if (path.startsWith('/admin/master')) return true;
  if (path.startsWith('/admin/enquiries')) return true;
  if (path.startsWith('/admin/students')) return true;
  if (path.startsWith('/admin/settings')) return true;
  return false;
}

/** Master hub + slug routes remain reachable under Masters group */
export function isPhase1MenuItem(item) {
  if (!item) return false;
  if (PHASE1_ROOT_IDS.has(item.id)) return true;
  if (isPhase1Path(item.path)) return true;
  if (item.id === 'master-hub' || String(item.id || '').startsWith('master-')) return true;
  if (item.children?.some(isPhase1MenuItem)) return true;
  return false;
}

/**
 * Keep only Phase 1 menu items.
 * Matches by id OR path so legacy RBAC labels (e.g. "Manage Enquiry") still resolve.
 */
export function filterMenuToPhase1(items = []) {
  return items
    .filter((item) => isPhase1MenuItem(item))
    .map((item) => {
      if (item.children?.length) {
        const children = item.children
          .map((child) => {
            if (child.children?.length) {
              return {
                ...child,
                children: child.children.filter(isPhase1MenuItem),
              };
            }
            return child;
          })
          .filter((child) => isPhase1MenuItem(child) && (child.path || child.children?.length));
        return { ...item, children };
      }
      return item;
    })
    .filter((item) => item.path || (item.children && item.children.length > 0));
}
