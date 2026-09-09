import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import { mergeScope } from '../../utils/tenant.util.js';
import { attendanceService } from '../attendance/attendance.service.js';
import { ROLE_WORKSPACE_META } from '../../config/role-workspace.js';
import { dashboardVisibleFlags, pickDashboardCards } from './dashboard.visibility.js';
import { getDashboardAnalytics, getCounsellorMonthlyTarget } from './dashboard.analytics.js';

export { dashboardVisibleFlags, pickDashboardCards, isOwnListScope } from './dashboard.visibility.js';

export const dashboardService = {
  getAnalytics: getDashboardAnalytics,
  getMyTarget: getCounsellorMonthlyTarget,
  getStats: async (user) => {
    const scopeWhere = mergeScope(user, { entity: 'student' });
    const leadScope = mergeScope(user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const slug = user.role?.slug;
    const workspace = ROLE_WORKSPACE_META[slug] || {
      title: 'Dashboard',
      subtitle: 'Overview of your CRM workspace',
    };
    const visible = dashboardVisibleFlags(user);

    const tasks = {};

    if (visible.leads) {
      tasks.totalLeads = prisma.lead.count({ where: { ...softDeleteWhere, ...leadScope } });
      tasks.todayFollowUps = prisma.lead.count({
        where: { ...softDeleteWhere, followUpAt: { gte: today, lt: tomorrow }, ...leadScope },
      });
      tasks.leadsByStatus = prisma.lead.groupBy({
        by: ['status'],
        where: { ...softDeleteWhere, ...leadScope },
        _count: true,
      });
    }

    if (visible.unassignedLeads) {
      tasks.unassignedLeads = prisma.lead.count({
        where: { ...softDeleteWhere, assignedToId: null, ...leadScope },
      });
    }

    if (visible.walkins) {
      tasks.todayWalkIns = prisma.lead.count({
        where: { ...softDeleteWhere, createdAt: { gte: today, lt: tomorrow }, ...leadScope },
      });
    }

    if (visible.students) {
      tasks.totalStudents = prisma.student.count({ where: { ...softDeleteWhere, ...scopeWhere } });
      tasks.studentsByCountry = prisma.student.groupBy({
        by: ['country'],
        where: { ...softDeleteWhere, ...scopeWhere, country: { not: null } },
        _count: true,
      });
    }

    if (visible.enquiries) {
      tasks.totalEnquiries = prisma.enquiry.count({
        where: { ...softDeleteWhere, ...mergeScope(user, { entity: 'enquiry' }) },
      });
    }

    if (visible.applications) {
      tasks.activeApplications = prisma.application.count({
        where: {
          ...softDeleteWhere,
          status: { in: ['SUBMITTED', 'UNDER_REVIEW'] },
          student: scopeWhere,
        },
      });
    }

    if (visible.visas) {
      tasks.pendingVisas = prisma.visa.count({
        where: {
          ...softDeleteWhere,
          status: { in: ['APPLICATION_SUBMITTED', 'BIOMETRICS_DONE', 'INTERVIEW_SCHEDULED'] },
          student: scopeWhere,
        },
      });
    }

    if (visible.calendar) {
      tasks.todayAppointments = prisma.appointment.count({
        where: {
          ...softDeleteWhere,
          startAt: { gte: today, lt: tomorrow },
          isCompleted: false,
          student: scopeWhere,
        },
      }).catch(() => 0);
    }

    if (visible.finance) {
      tasks.revenueThisMonth = prisma.invoice.aggregate({
        where: {
          ...softDeleteWhere,
          status: 'PAID',
          paidAt: { gte: monthStart },
          student: scopeWhere,
        },
        _sum: { total: true },
      });
    }

    const keys = Object.keys(tasks);
    const values = await Promise.all(keys.map((k) => tasks[k]));
    const resolved = Object.fromEntries(keys.map((k, i) => [k, values[i]]));

    return {
      workspace: { slug, ...workspace },
      visible,
      cards: pickDashboardCards(resolved, visible),
      leadsByStatus: visible.leads
        ? (resolved.leadsByStatus || []).map((s) => ({ status: s.status, count: s._count }))
        : [],
      studentsByCountry: visible.students
        ? (resolved.studentsByCountry || []).map((s) => ({ country: s.country, count: s._count }))
        : [],
      attendance: visible.attendance
        ? await attendanceService.dashboardWidgets(user, {
          classes: visible.classes,
          demos: visible.demos,
        }).catch(() => null)
        : null,
    };
  },

  getRecentActivity: async (user, limit = 20) => {
    const studentScope = mergeScope(user, { entity: 'student' });
    const leadScope = mergeScope(user);

    return prisma.activity.findMany({
      where: {
        OR: [
          { student: studentScope },
          { lead: leadScope },
          { userId: user.id },
        ],
      },
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, firstName: true, lastName: true } },
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
        lead: { select: { id: true, firstName: true, lastName: true } },
      },
    });
  },
};
