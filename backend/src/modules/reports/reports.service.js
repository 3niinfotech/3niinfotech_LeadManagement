import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import { buildDataScopeWhere } from '../../utils/scope.util.js';
import { ENQUIRY_STATUSES } from '../enquiry/enquiryStatus.config.js';

function buildReportWhere(query, user) {
  const scopeWhere = buildDataScopeWhere(user, { companyViaBranch: true });
  const where = { ...softDeleteWhere, ...scopeWhere };

  if (query.branchId) where.branchId = query.branchId;
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
    const where = buildReportWhere(query, user);
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
      },
      lostReason: lostRows
        .map((row) => ({
          reason: labelOrUnknown(row.dropReason, 'No reason recorded'),
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count),
    };
  },
};
