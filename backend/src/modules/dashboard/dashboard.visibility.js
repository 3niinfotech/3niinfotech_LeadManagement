import { hasPermission } from '../rbac/rbac.util.js';

function can(user, key) {
  return hasPermission(user?.permissions || [], key);
}

/** OWN-list roles never see unassigned-pool stats (scope already clamps to self). */
export function isOwnListScope(user) {
  const slug = user?.role?.slug;
  if (slug === 'counsellor' || slug === 'team_leader') return true;
  return user?.dataScope === 'OWN' || user?.role?.dataScope === 'OWN';
}

/** Widget visibility — must match what getStats actually queries. */
export function dashboardVisibleFlags(user) {
  const leads = can(user, 'lead.view');
  const classes = can(user, 'attendance.view');
  const demos = can(user, 'enquiry.view');
  return {
    leads,
    unassignedLeads: leads && !isOwnListScope(user),
    students: can(user, 'student.view'),
    enquiries: can(user, 'enquiry.view'),
    applications: can(user, 'application.view'),
    visas: can(user, 'visa.view'),
    calendar: can(user, 'calendar.view'),
    walkins: can(user, 'reception.walkin.view'),
    finance: can(user, 'accounts.invoice.view'),
    classes,
    demos,
    attendance: classes || demos,
  };
}

/** Omit unauthorized keys — zeros still leak that finance/visa widgets exist. */
export function pickDashboardCards(resolved, visible) {
  const cards = {};
  if (visible.walkins) cards.todayWalkIns = resolved.todayWalkIns || 0;
  if (visible.leads) {
    cards.totalLeads = resolved.totalLeads || 0;
    cards.todayFollowUps = resolved.todayFollowUps || 0;
  }
  if (visible.unassignedLeads) cards.unassignedLeads = resolved.unassignedLeads || 0;
  if (visible.enquiries) cards.totalEnquiries = resolved.totalEnquiries || 0;
  if (visible.students) cards.totalStudents = resolved.totalStudents || 0;
  if (visible.applications) cards.activeApplications = resolved.activeApplications || 0;
  if (visible.visas) cards.pendingVisas = resolved.pendingVisas || 0;
  if (visible.calendar) cards.todayAppointments = resolved.todayAppointments || 0;
  if (visible.finance) {
    cards.revenueThisMonth = resolved.revenueThisMonth?._sum?.total
      ?? resolved.revenueThisMonth
      ?? 0;
  }
  return cards;
}
