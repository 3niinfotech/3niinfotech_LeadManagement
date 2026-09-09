import prisma from '../../config/database.js';
import { AppError, softDeleteWhere } from '../../utils/response.util.js';
import {
  mergeScope,
  mergeStudentRelationScope,
  assertBranchInTenant,
  resolveOptionalBranchFilter,
} from '../../utils/tenant.util.js';
import { ENQUIRY_STATUSES } from '../enquiry/enquiryStatus.config.js';

async function buildReportWhere(query, user) {
  const scopeWhere = mergeScope(user, { entity: 'enquiry' });
  const where = { ...softDeleteWhere, ...scopeWhere };

  // Never trust client branchId — only apply after allowed-branch check
  if (query.branchId) {
    const branchId = await resolveOptionalBranchFilter(user, query.branchId);
    if (branchId) where.branchId = branchId;
  }
  if (query.from || query.to) {
    where.createdAt = {};
    if (query.from) where.createdAt.gte = new Date(query.from);
    if (query.to) {
      const end = new Date(query.to);
      end.setHours(23, 59, 59, 999);
      where.createdAt.lte = end;
    }
  }

  return where;
}

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function labelOrUnknown(value, fallback = 'Unknown') {
  const text = String(value || '').trim();
  return text || fallback;
}

async function loadCounsellorNames(ids) {
  const clean = [...new Set(ids.filter(Boolean))];
  if (!clean.length) return new Map();
  const users = await prisma.user.findMany({
    where: { id: { in: clean } },
    select: { id: true, firstName: true, lastName: true },
  });
  return new Map(users.map((u) => [
    u.id,
    `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Unnamed',
  ]));
}

export const reportsService = {
  getEnquiryReports: async (query, user) => {
    const where = await buildReportWhere(query, user);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const [
      total,
      converted,
      statusGroups,
      sourceRows,
      countryRows,
      counsellorAssigned,
      counsellorConverted,
      lostRows,
      followupStages,
      followupsDueToday,
      followupsOverdue,
      demoAttendance,
      demoResults,
      followupsThisMonth,
      demosTotal,
    ] = await Promise.all([
      prisma.enquiry.count({ where }),
      prisma.enquiry.count({ where: { ...where, status: 'CONVERTED' } }),
      prisma.enquiry.groupBy({ by: ['status'], where, _count: { _all: true } }),
      prisma.enquiry.groupBy({ by: ['source'], where, _count: { _all: true } }),
      prisma.enquiry.groupBy({ by: ['interestedCountry'], where, _count: { _all: true } }),
      prisma.enquiry.groupBy({ by: ['assignedToId'], where, _count: { _all: true } }),
      prisma.enquiry.groupBy({
        by: ['assignedToId'],
        where: { ...where, status: 'CONVERTED' },
        _count: { _all: true },
      }),
      prisma.enquiry.groupBy({
        by: ['dropReason'],
        where: { ...where, status: 'LOST' },
        _count: { _all: true },
      }),
      prisma.enquiryFollowup.groupBy({
        by: ['stage'],
        where: { enquiry: where },
        _count: { _all: true },
      }),
      prisma.enquiryFollowup.count({
        where: {
          enquiry: where,
          nextDate: { gte: today, lt: tomorrow },
        },
      }),
      prisma.enquiryFollowup.count({
        where: {
          enquiry: where,
          nextDate: { lt: today },
        },
      }),
      prisma.enquiryDemo.groupBy({
        by: ['attendance'],
        where: { enquiry: where },
        _count: { _all: true },
      }),
      prisma.enquiryDemo.groupBy({
        by: ['result'],
        where: { enquiry: where },
        _count: { _all: true },
      }),
      prisma.enquiryFollowup.count({
        where: {
          enquiry: where,
          createdAt: { gte: new Date(today.getFullYear(), today.getMonth(), 1) },
        },
      }),
      prisma.enquiryDemo.count({ where: { enquiry: where } }),
    ]);

    const statusMap = Object.fromEntries(
      statusGroups.map((row) => [row.status, row._count._all]),
    );

    const conversionFunnel = ENQUIRY_STATUSES.map((s) => ({
      status: s.value,
      count: statusMap[s.value] || 0,
    })).filter((row) => row.count > 0);

    const sourceConverted = await Promise.all(
      sourceRows.map(async (row) => {
        const count = await prisma.enquiry.count({
          where: {
            ...where,
            source: row.source,
            status: 'CONVERTED',
          },
        });
        return {
          source: labelOrUnknown(row.source),
          count: row._count._all,
          converted: count,
          rate: pct(count, row._count._all),
        };
      }),
    );

    const countryConverted = await Promise.all(
      countryRows.map(async (row) => {
        const count = await prisma.enquiry.count({
          where: {
            ...where,
            interestedCountry: row.interestedCountry,
            status: 'CONVERTED',
          },
        });
        return {
          country: labelOrUnknown(row.interestedCountry, 'Not specified'),
          count: row._count._all,
          converted: count,
          rate: pct(count, row._count._all),
        };
      }),
    );

    const convertedMap = Object.fromEntries(
      counsellorConverted.map((row) => [row.assignedToId, row._count._all]),
    );
    const counsellorIds = counsellorAssigned.map((row) => row.assignedToId);
    const nameMap = await loadCounsellorNames(counsellorIds);

    const counsellorRows = await Promise.all(
      counsellorAssigned.map(async (row) => {
        const assigned = row._count._all;
        const convertedCount = convertedMap[row.assignedToId] || 0;
        const followups = row.assignedToId
          ? await prisma.enquiryFollowup.count({
            where: { enquiry: where, userId: row.assignedToId },
          })
          : 0;
        const demos = row.assignedToId
          ? await prisma.enquiryDemo.count({
            where: { enquiry: where, userId: row.assignedToId },
          })
          : 0;

        return {
          id: row.assignedToId,
          name: row.assignedToId ? (nameMap.get(row.assignedToId) || 'Counsellor') : 'Unassigned',
          assigned,
          converted: convertedCount,
          rate: pct(convertedCount, assigned),
          followups,
          demos,
        };
      }),
    );

    counsellorRows.sort((a, b) => b.converted - a.converted || b.assigned - a.assigned);

    const topCounsellor = counsellorRows.find((row) => row.id) || null;
    const activeCounsellors = counsellorRows.filter((row) => row.id).length;

    return {
      generatedAt: new Date().toISOString(),
      conversion: {
        total,
        converted,
        rate: pct(converted, total),
        funnel: conversionFunnel,
      },
      source: sourceConverted.sort((a, b) => b.count - a.count),
      country: countryConverted.sort((a, b) => b.count - a.count),
      counsellor: counsellorRows,
      performance: {
        activeCounsellors,
        totalFollowupsThisMonth: followupsThisMonth,
        totalDemos: demosTotal,
        avgConversionRate: activeCounsellors
          ? Math.round(
            (counsellorRows.filter((r) => r.id).reduce((sum, r) => sum + r.rate, 0) / activeCounsellors) * 10,
          ) / 10
          : 0,
        topCounsellor: topCounsellor
          ? { name: topCounsellor.name, converted: topCounsellor.converted, rate: topCounsellor.rate }
          : null,
        leaderboard: counsellorRows.filter((row) => row.id).slice(0, 5),
      },
      followUp: {
        dueToday: followupsDueToday,
        overdue: followupsOverdue,
        loggedThisMonth: followupsThisMonth,
        byStage: followupStages.map((row) => ({
          stage: labelOrUnknown(row.stage, 'CALL'),
          count: row._count._all,
        })).sort((a, b) => b.count - a.count),
      },
      demo: {
        total: demosTotal,
        byAttendance: demoAttendance.map((row) => ({
          attendance: row.attendance,
          count: row._count._all,
        })),
        byResult: demoResults.map((row) => ({
          result: row.result,
          count: row._count._all,
        })),
        bySessionStatus: await prisma.enquiryDemo.groupBy({
          by: ['sessionStatus'],
          where: { enquiry: where },
          _count: { _all: true },
        }).then((rows) => rows.map((row) => ({
          status: row.sessionStatus,
          count: row._count._all,
        }))).catch(() => []),
      },
      lostReason: lostRows
        .map((row) => ({
          reason: labelOrUnknown(row.dropReason, 'No reason recorded'),
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count),
    };
  },

  exportDataset: async (kind, user) => {
    const EXPORT_LIMIT = 5000;
    const key = String(kind || '').toLowerCase();
    const companyId = user?.companyId;
    if (!companyId && user?.dataScope !== 'GLOBAL') {
      throw new AppError('Company context required', 403);
    }

    if (key === 'enquiry' || key === 'drop') {
      const where = await buildReportWhere({}, user);
      if (key === 'drop') where.status = 'LOST';
      const rows = await prisma.enquiry.findMany({
        where,
        take: EXPORT_LIMIT,
        orderBy: { createdAt: 'desc' },
        select: {
          enquiryCode: true,
          firstName: true,
          lastName: true,
          email: true,
          mobile: true,
          status: true,
          source: true,
          interestedCountry: true,
          interestedCourse: true,
          intake: true,
          applyLevel: true,
          dropReason: true,
          createdAt: true,
          branch: { select: { name: true, code: true } },
        },
      });
      return {
        kind: key,
        count: rows.length,
        rows: rows.map((row) => ({
          code: row.enquiryCode,
          name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
          email: row.email,
          phone: row.mobile,
          status: row.status,
          source: row.source,
          country: row.interestedCountry,
          course: row.interestedCourse,
          intake: row.intake,
          applyLevel: row.applyLevel,
          dropReason: row.dropReason,
          branch: row.branch?.name,
          createdAt: row.createdAt,
        })),
      };
    }

    if (key === 'student' || key === 'enrolled' || key === 'defer') {
      const scopeWhere = mergeScope(user, { entity: 'student' });
      const where = { ...softDeleteWhere, ...scopeWhere };
      if (key === 'enrolled') where.status = 'ENROLLED';
      if (key === 'defer') where.status = 'DEFERRED';
      const rows = await prisma.student.findMany({
        where,
        take: EXPORT_LIMIT,
        orderBy: { createdAt: 'desc' },
        select: {
          studentCode: true,
          firstName: true,
          lastName: true,
          email: true,
          phone: true,
          status: true,
          nationality: true,
          country: true,
          university: true,
          course: true,
          intake: true,
          createdAt: true,
          branch: { select: { name: true } },
        },
      });
      return {
        kind: key,
        count: rows.length,
        rows: rows.map((row) => ({
          code: row.studentCode,
          name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
          email: row.email,
          phone: row.phone,
          status: row.status,
          nationality: row.nationality,
          country: row.country,
          university: row.university,
          course: row.course,
          intake: row.intake,
          branch: row.branch?.name,
          createdAt: row.createdAt,
        })),
      };
    }

    if (key === 'application') {
      const rows = await prisma.application.findMany({
        where: { ...softDeleteWhere, ...mergeStudentRelationScope(user) },
        take: EXPORT_LIMIT,
        orderBy: { createdAt: 'desc' },
        select: {
          applicationNo: true,
          university: true,
          course: true,
          intake: true,
          country: true,
          status: true,
          createdAt: true,
          student: { select: { studentCode: true, firstName: true, lastName: true } },
        },
      });
      return {
        kind: key,
        count: rows.length,
        rows: rows.map((row) => ({
          applicationNo: row.applicationNo,
          studentCode: row.student?.studentCode,
          student: `${row.student?.firstName || ''} ${row.student?.lastName || ''}`.trim(),
          university: row.university,
          course: row.course,
          intake: row.intake,
          country: row.country,
          status: row.status,
          createdAt: row.createdAt,
        })),
      };
    }

    if (key === 'visa') {
      const rows = await prisma.visa.findMany({
        where: { ...softDeleteWhere, ...mergeStudentRelationScope(user) },
        take: EXPORT_LIMIT,
        orderBy: { createdAt: 'desc' },
        select: {
          applicationNo: true,
          country: true,
          visaType: true,
          status: true,
          createdAt: true,
          student: { select: { studentCode: true, firstName: true, lastName: true } },
        },
      });
      return {
        kind: key,
        count: rows.length,
        rows: rows.map((row) => ({
          applicationNo: row.applicationNo,
          studentCode: row.student?.studentCode,
          student: `${row.student?.firstName || ''} ${row.student?.lastName || ''}`.trim(),
          country: row.country,
          visaType: row.visaType,
          status: row.status,
          createdAt: row.createdAt,
        })),
      };
    }

    throw new AppError('Unknown export kind', 400);
  },

  /**
   * Executive overview — real aggregates only.
   * Soft-fails per domain so one permission miss does not blank the page.
   */
  getOverview: async (query, user) => {
    const enquiry = await reportsService.getEnquiryReports(query, user).catch(() => null);

    const safe = async (fn) => {
      try {
        return await fn();
      } catch {
        return null;
      }
    };

    const [students, applications, visas, invoices, classAtt] = await Promise.all([
      safe(async () => {
        const { studentService } = await import('../student/student.service.js');
        return studentService.getSummary(query, user);
      }),
      safe(async () => {
        const { applicationService } = await import('../application/application.service.js');
        return applicationService.getSummary(query, user);
      }),
      safe(async () => {
        const { visaService } = await import('../visa/visa.service.js');
        return visaService.getSummary(query, user);
      }),
      safe(async () => {
        const { invoiceService } = await import('../invoice/invoice.service.js');
        return invoiceService.getSummary(query, user);
      }),
      safe(async () => {
        const { attendanceService } = await import('../attendance/attendance.service.js');
        return attendanceService.classReport(query, user);
      }),
    ]);

    const kpis = {
      enquiries: enquiry?.conversion?.total ?? null,
      converted: enquiry?.conversion?.converted ?? null,
      conversionRate: enquiry?.conversion?.rate ?? null,
      followupsDue: enquiry?.followUp?.dueToday ?? null,
      followupsOverdue: enquiry?.followUp?.overdue ?? null,
      demos: enquiry?.demo?.total ?? null,
      students: students?.total ?? null,
      applications: applications?.total ?? null,
      visas: visas?.total ?? null,
      invoicesPaid: invoices?.paid ?? null,
      outstanding: invoices?.outstanding ?? null,
      overdueInvoices: invoices?.overdue ?? null,
      attendancePresent: classAtt?.totals?.present ?? null,
      attendanceAbsent: classAtt?.totals?.absent ?? null,
    };

    const needsAttention = [
      {
        id: 'overdue-followups',
        label: 'Overdue follow-ups',
        count: enquiry?.followUp?.overdue ?? 0,
        href: '/admin/calendar',
        description: 'Follow-ups past due date',
      },
      {
        id: 'followups-today',
        label: 'Follow-ups due today',
        count: enquiry?.followUp?.dueToday ?? 0,
        href: '/admin/calendar',
        description: 'Scheduled for today',
      },
      {
        id: 'pending-applications',
        label: 'Applications in review',
        count: applications?.inReview ?? 0,
        href: '/admin/applications',
        description: 'Need status movement',
      },
      {
        id: 'pending-visas',
        label: 'Pending visa cases',
        count: visas?.pending ?? 0,
        href: '/admin/visas',
        description: 'Awaiting progress',
      },
      {
        id: 'outstanding-fees',
        label: 'Outstanding fees',
        count: invoices?.outstanding ?? 0,
        href: '/admin/fees?tab=outstanding',
        description: 'Unpaid / partial invoice totals',
        isAmount: true,
      },
      {
        id: 'overdue-invoices',
        label: 'Overdue invoices',
        count: invoices?.overdue ?? 0,
        href: '/admin/fees',
        description: 'Past due billing',
      },
    ].filter((item) => Number(item.count) > 0);

    return {
      generatedAt: new Date().toISOString(),
      kpis,
      needsAttention,
      conversion: enquiry?.conversion || null,
      source: enquiry?.source || null,
      demo: enquiry?.demo || null,
      followUp: enquiry?.followUp || null,
      applications,
      visas,
      invoices,
      students,
      attendance: classAtt,
    };
  },
};
