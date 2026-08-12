import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';

export const dashboardService = {
  getStats: async (branchId) => {
    const branchFilter = branchId ? { branchId } : {};
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      totalLeads,
      totalStudents,
      activeApplications,
      pendingVisas,
      todayFollowUps,
      todayAppointments,
      revenueThisMonth,
      leadsByStatus,
      studentsByCountry,
    ] = await Promise.all([
      prisma.lead.count({ where: { ...softDeleteWhere, ...branchFilter } }),
      prisma.student.count({ where: { ...softDeleteWhere, ...branchFilter } }),
      prisma.application.count({ where: { ...softDeleteWhere, status: { in: ['SUBMITTED', 'UNDER_REVIEW'] }, student: branchFilter } }),
      prisma.visa.count({ where: { ...softDeleteWhere, status: { in: ['APPLICATION_SUBMITTED', 'BIOMETRICS_DONE', 'INTERVIEW_SCHEDULED'] }, student: branchFilter } }),
      prisma.lead.count({ where: { ...softDeleteWhere, followUpAt: { gte: today, lt: tomorrow }, ...branchFilter } }),
      prisma.appointment.count({ where: { ...softDeleteWhere, startAt: { gte: today, lt: tomorrow }, isCompleted: false } }),
      prisma.invoice.aggregate({
        where: { ...softDeleteWhere, status: 'PAID', paidAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) } },
        _sum: { total: true },
      }),
      prisma.lead.groupBy({ by: ['status'], where: { ...softDeleteWhere, ...branchFilter }, _count: true }),
      prisma.student.groupBy({ by: ['country'], where: { ...softDeleteWhere, ...branchFilter, country: { not: null } }, _count: true }),
    ]);

    return {
      cards: {
        totalLeads,
        totalStudents,
        activeApplications,
        pendingVisas,
        todayFollowUps,
        todayAppointments,
        revenueThisMonth: revenueThisMonth._sum.total || 0,
      },
      leadsByStatus: leadsByStatus.map((s) => ({ status: s.status, count: s._count })),
      studentsByCountry: studentsByCountry.map((s) => ({ country: s.country, count: s._count })),
    };
  },

  getRecentActivity: async (limit = 20) => {
    return prisma.activity.findMany({
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
