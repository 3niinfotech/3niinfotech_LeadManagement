/** Phase 1 — visible sidebar roots and routes (hide legacy items, do not delete routes) */
export const PHASE1_ROOT_IDS = new Set([
  'dashboard',
  'master',
  'master-data',
  'reception',
  'enquiries',
  'enquiry',
  'manage-enquiry',
  'calendar',
  'demo',
  'students',
  'batches',
  'teacher-attendance',
  'teacher-assignments',
  'teacher-tests',
  'teacher-materials',
  'teacher-performance',
  'applications',
  'visas',
  'fees',
  'reports',
  'reports-overview',
  'reports-leads-group',
  'reports-leads',
  'reports-source',
  'reports-country',
  'reports-counsellor',
  'reports-lead-performance',
  'reports-lost',
  'reports-ops-group',
  'reports-followup',
  'reports-demo',
  'reports-attendance',
  'reports-academic-group',
  'reports-students',
  'reports-performance',
  'reports-appvisa-group',
  'reports-applications',
  'reports-visa',
  'reports-finance-group',
  'reports-fees',
  'reports-outstanding',
  'reports-targets',
  'reports-export',
  'team-access',
  'settings',
]);

export const PHASE1_ROUTES = new Set([
  '/admin/dashboard',
  '/admin/reception',
  '/admin/reception/walk-ins',
  '/admin/enquiries',
  '/admin/calendar',
  '/admin/demo',
  '/admin/students',
  '/admin/batches',
  '/admin/applications',
  '/admin/visas',
  '/admin/fees',
  '/admin/reports',
  '/admin/users',
  '/admin/settings',
  '/admin/master',
  '/admin/master/partners',
]);

/** Path prefixes that belong to Phase 1 */
export function isPhase1Path(path) {
  if (!path) return false;
  if (PHASE1_ROUTES.has(path)) return true;
  if (path.startsWith('/admin/master')) return true;
  if (path.startsWith('/admin/reception')) return true;
  if (path.startsWith('/admin/enquiries')) return true;
  if (path.startsWith('/admin/calendar')) return true;
  if (path.startsWith('/admin/students')) return true;
  if (path.startsWith('/admin/batches')) return true;
  if (path.startsWith('/admin/teacher')) return true;
  if (path.startsWith('/admin/applications')) return true;
  if (path.startsWith('/admin/visas')) return true;
  if (path.startsWith('/admin/settings')) return true;
  if (path.startsWith('/admin/reports')) return true;
  if (path.startsWith('/admin/users')) return true;
  if (path.startsWith('/admin/fees')) return true;
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
