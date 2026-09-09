import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import {
  mergeScope,
  resolveOptionalBranchFilter,
  requireTenantCompany,
} from '../../utils/tenant.util.js';
import { reportsService } from '../reports/reports.service.js';
import { attendanceService } from '../attendance/attendance.service.js';
import { dashboardVisibleFlags, pickDashboardCards } from './dashboard.visibility.js';
import { ROLE_WORKSPACE_META } from '../../config/role-workspace.js';
import { academicBranchScope } from '../attendance/attendance.scope.js';
import { attendanceRepository } from '../attendance/attendance.repository.js';
import { resolveBranchAccessPolicy } from '../../utils/branch-access.policy.js';

function pct(part, total) {
  if (!total) return 0;
  return Math.round((part / total) * 1000) / 10;
}

function monthKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
}

function monthLabel(key) {
  const [y, m] = key.split('-').map(Number);
  return new Date(y, m - 1, 1).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
}

async function buildEnquiryWhere(query, user) {
  const scopeWhere = mergeScope(user, { entity: 'enquiry' });
  const where = { ...softDeleteWhere, ...scopeWhere };
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

async function buildStudentWhere(query, user) {
  const scopeWhere = mergeScope(user, { entity: 'student' });
  const where = { ...softDeleteWhere, ...scopeWhere };
  if (query.branchId) {
    const branchId = await resolveOptionalBranchFilter(user, query.branchId);
    if (branchId) where.branchId = branchId;
  }
  return where;
}

async function getStatsSnapshot(user) {
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
}

async function getRecentActivitySnapshot(user, limit = 30) {
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
}

async function getCounsellorDesk(user, enquiryWhere) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const dayAfter = new Date(tomorrow);
  dayAfter.setDate(dayAfter.getDate() + 1);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const prevMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
  const prevMonthEnd = monthStart;

  const closedStatuses = ['CONVERTED', 'LOST', 'CLOSED', 'REJECTED', 'CANCELLED'];
  const openWhere = {
    ...enquiryWhere,
    status: { notIn: closedStatuses },
  };
  const studentWhere = {
    ...softDeleteWhere,
    ...mergeScope(user, { entity: 'student' }),
  };
  const prefs = (user.preferences && typeof user.preferences === 'object') ? user.preferences : {};
  const targetGoal = Math.max(Number(prefs.monthlyTarget) || Number(prefs.monthlyTargetAmount) || 1000000, 1);

  const [
    openCount,
    newThisWeek,
    convertedMonth,
    convertedPrevMonth,
    statusGroups,
    followupsToday,
    followupsTomorrow,
    followupsWeek,
    followupsOverdue,
    demosToday,
    appointmentsToday,
    recentOpen,
    myStudents,
    studentsPrevMonth,
    activeApps,
    appsPrevMonth,
    visasGranted,
    visasPrevMonth,
    paidThisMonth,
    enquiryTrendRaw,
    countryGroups,
    appStatusGroups,
    recentActivityRows,
  ] = await Promise.all([
    prisma.enquiry.count({ where: openWhere }).catch(() => 0),
    prisma.enquiry.count({
      where: { ...enquiryWhere, createdAt: { gte: today, lt: tomorrow } },
    }).catch(() => 0),
    prisma.enquiry.count({
      where: { ...enquiryWhere, status: 'CONVERTED', updatedAt: { gte: monthStart } },
    }).catch(() => 0),
    prisma.enquiry.count({
      where: {
        ...enquiryWhere,
        status: 'CONVERTED',
        updatedAt: { gte: prevMonthStart, lt: prevMonthEnd },
      },
    }).catch(() => 0),
    prisma.enquiry.groupBy({
      by: ['status'],
      where: openWhere,
      _count: { _all: true },
    }).catch(() => []),
    prisma.enquiryFollowup.findMany({
      where: { nextDate: { gte: today, lt: tomorrow }, enquiry: openWhere },
      orderBy: { nextDate: 'asc' },
      take: 12,
      select: {
        id: true, nextDate: true, remark: true, stage: true,
        enquiry: {
          select: {
            id: true, enquiryCode: true, firstName: true, lastName: true,
            status: true, interestedCourse: true, phone: true, interestedCountry: true,
          },
        },
      },
    }).catch(() => []),
    prisma.enquiryFollowup.findMany({
      where: { nextDate: { gte: tomorrow, lt: dayAfter }, enquiry: openWhere },
      orderBy: { nextDate: 'asc' },
      take: 12,
      select: {
        id: true, nextDate: true, remark: true, stage: true,
        enquiry: {
          select: {
            id: true, enquiryCode: true, firstName: true, lastName: true,
            status: true, interestedCourse: true, phone: true,
          },
        },
      },
    }).catch(() => []),
    prisma.enquiryFollowup.findMany({
      where: { nextDate: { gte: today, lt: weekEnd }, enquiry: openWhere },
      orderBy: { nextDate: 'asc' },
      take: 30,
      select: {
        id: true, nextDate: true, remark: true, stage: true,
        enquiry: {
          select: {
            id: true, enquiryCode: true, firstName: true, lastName: true,
            status: true, interestedCourse: true, phone: true,
          },
        },
      },
    }).catch(() => []),
    prisma.enquiryFollowup.findMany({
      where: { nextDate: { lt: today }, enquiry: openWhere },
      orderBy: { nextDate: 'asc' },
      take: 12,
      select: {
        id: true, nextDate: true, remark: true, stage: true,
        enquiry: {
          select: {
            id: true, enquiryCode: true, firstName: true, lastName: true,
            status: true, interestedCourse: true, phone: true,
          },
        },
      },
    }).catch(() => []),
    prisma.enquiryDemo.findMany({
      where: {
        demoDate: { gte: today, lt: tomorrow },
        sessionStatus: { not: 'CANCELLED' },
        enquiry: enquiryWhere,
      },
      orderBy: { demoDate: 'asc' },
      take: 12,
      select: {
        id: true, demoDate: true, className: true, batch: true,
        sessionStatus: true, attendance: true,
        enquiry: {
          select: {
            id: true, enquiryCode: true, firstName: true, lastName: true,
            status: true, phone: true,
          },
        },
      },
    }).catch(() => []),
    prisma.enquiryAppointment.findMany({
      where: {
        startAt: { gte: today, lt: tomorrow },
        isCompleted: false,
        OR: [{ counsellorId: user.id }, { enquiry: enquiryWhere }],
      },
      orderBy: { startAt: 'asc' },
      take: 12,
      select: {
        id: true, title: true, startAt: true, mode: true, room: true,
        enquiry: {
          select: {
            id: true, enquiryCode: true, firstName: true, lastName: true, phone: true,
          },
        },
      },
    }).catch(() => []),
    prisma.enquiry.findMany({
      where: openWhere,
      orderBy: [{ updatedAt: 'desc' }],
      take: 12,
      select: {
        id: true, enquiryCode: true, firstName: true, lastName: true,
        status: true, source: true, interestedCourse: true, phone: true,
        interestedCountry: true, updatedAt: true, createdAt: true,
        followups: {
          where: { nextDate: { gte: today } },
          orderBy: { nextDate: 'asc' },
          take: 1,
          select: { nextDate: true },
        },
      },
    }).catch(() => []),
    prisma.student.count({ where: studentWhere }).catch(() => 0),
    prisma.student.count({
      where: { ...studentWhere, createdAt: { gte: prevMonthStart, lt: prevMonthEnd } },
    }).catch(() => 0),
    prisma.application.count({
      where: {
        deletedAt: null,
        status: { notIn: ['REJECTED', 'WITHDRAWN', 'CLOSED'] },
        student: studentWhere,
      },
    }).catch(() => 0),
    prisma.application.count({
      where: {
        deletedAt: null,
        createdAt: { gte: prevMonthStart, lt: prevMonthEnd },
        student: studentWhere,
      },
    }).catch(() => 0),
    prisma.visa.count({
      where: {
        deletedAt: null,
        status: 'APPROVED',
        student: studentWhere,
      },
    }).catch(() => 0),
    prisma.visa.count({
      where: {
        deletedAt: null,
        status: 'APPROVED',
        decisionAt: { gte: prevMonthStart, lt: prevMonthEnd },
        student: studentWhere,
      },
    }).catch(() => 0),
    prisma.invoice.aggregate({
      where: {
        deletedAt: null,
        status: 'PAID',
        paidAt: { gte: monthStart },
        student: studentWhere,
      },
      _sum: { total: true },
    }).catch(() => ({ _sum: { total: 0 } })),
    prisma.enquiry.findMany({
      where: {
        ...enquiryWhere,
        createdAt: { gte: new Date(today.getTime() - 6 * 24 * 3600 * 1000) },
      },
      select: { createdAt: true },
      take: 500,
    }).catch(() => []),
    prisma.enquiry.groupBy({
      by: ['interestedCountry'],
      where: { ...enquiryWhere, interestedCountry: { not: null } },
      _count: { _all: true },
      orderBy: { _count: { interestedCountry: 'desc' } },
      take: 8,
    }).catch(() => []),
    prisma.application.groupBy({
      by: ['status'],
      where: { deletedAt: null, student: studentWhere },
      _count: { _all: true },
    }).catch(() => []),
    prisma.enquiry.findMany({
      where: enquiryWhere,
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true, firstName: true, lastName: true, status: true, updatedAt: true, enquiryCode: true,
      },
    }).catch(() => []),
  ]);

  const person = (row) => `${row?.firstName || ''} ${row?.lastName || ''}`.trim() || 'Lead';

  const mapFollowup = (row, urgency) => ({
    id: `fu-${row.id}`,
    type: 'followup',
    urgency,
    title: person(row.enquiry),
    subtitle: row.enquiry?.interestedCourse || row.stage || 'Follow-up',
    meta: row.enquiry?.enquiryCode,
    at: row.nextDate,
    enquiryId: row.enquiry?.id,
    phone: row.enquiry?.phone,
    status: row.enquiry?.status,
  });

  const workQueue = [
    ...followupsOverdue.map((r) => mapFollowup(r, 'overdue')),
    ...followupsToday.map((r) => mapFollowup(r, 'today')),
    ...demosToday.map((row) => ({
      id: `demo-${row.id}`,
      type: 'demo',
      urgency: 'today',
      title: person(row.enquiry),
      subtitle: row.className || row.batch || 'Demo class',
      meta: row.enquiry?.enquiryCode,
      at: row.demoDate,
      enquiryId: row.enquiry?.id,
      phone: row.enquiry?.phone,
      status: row.sessionStatus,
    })),
    ...appointmentsToday.map((row) => ({
      id: `appt-${row.id}`,
      type: 'appointment',
      urgency: 'today',
      title: person(row.enquiry),
      subtitle: row.title || row.mode || 'Appointment',
      meta: row.enquiry?.enquiryCode,
      at: row.startAt,
      enquiryId: row.enquiry?.id,
      phone: row.enquiry?.phone,
      status: row.room || null,
    })),
  ].slice(0, 20);

  const trendDelta = (now, prev) => {
    if (!prev && !now) return 0;
    if (!prev) return now ? 100 : 0;
    return Math.round(((now - prev) / prev) * 100);
  };

  const achieved = Number(paidThisMonth?._sum?.total) || 0;
  const targetPercent = Math.min(100, Math.round((achieved / targetGoal) * 100));
  const monthName = today.toLocaleDateString('en-IN', { month: 'short' });

  const enquiriesCreated = enquiryTrendRaw.length;
  const successDenom = Math.max(enquiriesCreated + convertedMonth, 1);
  const successRate = Math.min(100, Math.round((convertedMonth / successDenom) * 100));
  const prevSuccess = Math.min(100, Math.round((convertedPrevMonth / Math.max(convertedPrevMonth + studentsPrevMonth, 1)) * 100));

  const dayLabels = [];
  for (let i = 6; i >= 0; i -= 1) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dayLabels.push({
      key: d.toISOString().slice(0, 10),
      label: d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
      count: 0,
    });
  }
  for (const row of enquiryTrendRaw) {
    const key = new Date(row.createdAt).toISOString().slice(0, 10);
    const bucket = dayLabels.find((b) => b.key === key);
    if (bucket) bucket.count += 1;
  }

  const stageMap = {
    NEW: 'New Enquiry',
    CONTACTED: 'Interested',
    INTERESTED: 'Interested',
    FOLLOW_UP: 'Interested',
    DEMO_SCHEDULED: 'Application',
    APPLICATION: 'Application',
    OFFER: 'Offer',
    DOCUMENT: 'Application',
  };
  const studentsByStageAcc = {};
  for (const g of statusGroups || []) {
    const label = stageMap[g.status] || (String(g.status || '')
      .replace(/_/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (c) => c.toUpperCase()));
    studentsByStageAcc[label] = (studentsByStageAcc[label] || 0) + g._count._all;
  }
  const studentsByStage = Object.entries(studentsByStageAcc)
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const appStatusLabel = (s) => String(s || '')
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase());

  const applicationStatus = (appStatusGroups || [])
    .map((g) => ({ label: appStatusLabel(g.status), count: g._count._all, status: g.status }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);

  const topCountries = (countryGroups || [])
    .filter((g) => g.interestedCountry)
    .map((g) => ({ country: g.interestedCountry, count: g._count._all }));

  const totalCountries = topCountries.reduce((s, r) => s + r.count, 0);
  const top5 = topCountries.slice(0, 5);
  const others = totalCountries - top5.reduce((s, r) => s + r.count, 0);
  if (others > 0) top5.push({ country: 'Others', count: others });

  const followUpsDue = followupsToday.length + followupsOverdue.length;
  const tasks = workQueue.slice(0, 6).map((item) => ({
    id: item.id,
    title: item.type === 'followup'
      ? `Follow up with ${item.title}`
      : `${item.type === 'demo' ? 'Demo' : 'Meeting'} — ${item.title}`,
    at: item.at,
    enquiryId: item.enquiryId,
    done: false,
    urgency: item.urgency,
  }));

  return {
    metrics: {
      openPipeline: openCount,
      dueToday: followupsToday.length + demosToday.length + appointmentsToday.length,
      overdue: followupsOverdue.length,
      demosToday: demosToday.length,
      appointmentsToday: appointmentsToday.length,
      newToday: newThisWeek,
      convertedMonth,
      myStudents,
      activeApplications: activeApps,
      visasGranted,
      followUpsDue,
      successRate,
      trends: {
        myStudents: trendDelta(myStudents, studentsPrevMonth),
        activeApplications: trendDelta(activeApps, appsPrevMonth),
        visasGranted: trendDelta(visasGranted, visasPrevMonth),
        followUpsDue: 0,
        successRate: trendDelta(successRate, prevSuccess),
      },
    },
    target: {
      monthLabel: monthName,
      achieved,
      goal: targetGoal,
      percent: targetPercent,
      currency: 'INR',
      label: `My Target (${monthName})`,
    },
    charts: {
      enquiriesTrend: dayLabels.map(({ label, count }) => ({ label, count })),
      studentsByStage,
      applicationStatus,
      topCountries: top5,
      followUpsOverview: [
        { label: 'Today', count: followupsToday.length + followupsOverdue.length },
        { label: 'Tomorrow', count: followupsTomorrow.length },
        { label: 'This Week', count: Math.max(followupsWeek.length - followupsToday.length - followupsTomorrow.length, 0) },
      ],
    },
    performance: {
      enquiries: openCount + convertedMonth,
      applications: activeApps,
      visas: visasGranted,
      revenue: achieved,
      currency: 'INR',
      rankHint: successRate >= 60
        ? `Great going! You are performing better than ${Math.min(95, 50 + Math.round(successRate / 2))}% of counselors`
        : 'Keep nurturing your pipeline — consistency wins offers.',
    },
    reminders: [
      followUpsDue > 0
        ? { id: 'fu', tone: 'danger', text: `${followUpsDue} follow up${followUpsDue === 1 ? '' : 's'} due today`, link: '/admin/calendar' }
        : null,
      activeApps > 0
        ? { id: 'app', tone: 'warning', text: `${activeApps} application${activeApps === 1 ? '' : 's'} in progress`, link: '/admin/applications' }
        : null,
      achieved > 0 && targetPercent < 100
        ? { id: 'pay', tone: 'success', text: `Target ${targetPercent}% complete this month`, link: '/admin/invoices' }
        : null,
    ].filter(Boolean),
    tasks,
    myPipeline: (recentOpen || []).map((row) => ({
      id: row.id,
      code: row.enquiryCode,
      name: person(row),
      country: row.interestedCountry,
      stage: row.status,
      course: row.interestedCourse,
      phone: row.phone,
      nextFollowUp: row.followups?.[0]?.nextDate || null,
      updatedAt: row.updatedAt,
    })),
    recentActivities: (recentActivityRows || []).map((row) => ({
      id: row.id,
      title: `${person(row)} — ${String(row.status || '').replace(/_/g, ' ').toLowerCase()}`,
      at: row.updatedAt,
      enquiryId: row.id,
      code: row.enquiryCode,
    })),
    statusBreakdown: (statusGroups || [])
      .map((g) => ({ status: g.status, count: g._count._all }))
      .sort((a, b) => b.count - a.count),
    workQueue,
    recentOpen: (recentOpen || []).map((row) => ({
      id: row.id,
      code: row.enquiryCode,
      name: person(row),
      course: row.interestedCourse,
      source: row.source,
      status: row.status,
      phone: row.phone,
      updatedAt: row.updatedAt,
    })),
    demosToday: demosToday.map((row) => ({
      id: row.id,
      name: person(row.enquiry),
      code: row.enquiry?.enquiryCode,
      at: row.demoDate,
      className: row.className || row.batch,
      attendance: row.attendance,
      enquiryId: row.enquiry?.id,
    })),
    appointmentsToday: appointmentsToday.map((row) => ({
      id: row.id,
      name: person(row.enquiry),
      code: row.enquiry?.enquiryCode,
      at: row.startAt,
      title: row.title,
      mode: row.mode,
      room: row.room,
      enquiryId: row.enquiry?.id,
    })),
  };
}

/** Lightweight monthly target for sidebar (counsellor / team_leader). */
export async function getCounsellorMonthlyTarget(user) {
  const slug = user?.role?.slug;
  if (slug !== 'counsellor' && slug !== 'team_leader') return null;

  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const studentWhere = {
    ...softDeleteWhere,
    ...mergeScope(user, { entity: 'student' }),
  };

  let prefs = (user.preferences && typeof user.preferences === 'object') ? user.preferences : {};
  if (prefs.monthlyTarget == null && prefs.monthlyTargetAmount == null) {
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { preferences: true },
    }).catch(() => null);
    if (dbUser?.preferences && typeof dbUser.preferences === 'object') prefs = dbUser.preferences;
  }
  const goal = Math.max(Number(prefs.monthlyTarget) || Number(prefs.monthlyTargetAmount) || 1000000, 1);

  const paid = await prisma.invoice.aggregate({
    where: {
      deletedAt: null,
      status: 'PAID',
      paidAt: { gte: monthStart },
      student: studentWhere,
    },
    _sum: { total: true },
  }).catch(() => ({ _sum: { total: 0 } }));

  const achieved = Number(paid?._sum?.total) || 0;
  return {
    monthLabel: today.toLocaleDateString('en-IN', { month: 'short' }),
    achieved,
    goal,
    percent: Math.min(100, Math.round((achieved / goal) * 100)),
    currency: 'INR',
    label: 'Monthly Target',
  };
}

export async function getDashboardAnalytics(query = {}, user) {
  const companyId = requireTenantCompany(user);

  const [overview, enquiry, stats, activity, enquiryWhere, studentWhere] = await Promise.all([
    reportsService.getOverview(query, user).catch(() => null),
    reportsService.getEnquiryReports(query, user).catch(() => null),
    getStatsSnapshot(user).catch(() => null),
    getRecentActivitySnapshot(user, 30).catch(() => []),
    buildEnquiryWhere(query, user),
    buildStudentWhere(query, user),
  ]);

  const slug = user?.role?.slug;
  const wantsCounsellorDesk = slug === 'counsellor' || slug === 'team_leader';
  const counsellorDesk = wantsCounsellorDesk
    ? await getCounsellorDesk(user, enquiryWhere).catch(() => null)
    : null;

  const [
    recentEnquiries,
    recentAdmissions,
    recentPayments,
    studentsByCourse,
    activeBatches,
    staffCounts,
    upcomingSessions,
    monthlyEnquiries,
    branchRows,
    todayAttendance,
    batchAttendanceToday,
  ] = await Promise.all([
    prisma.enquiry.findMany({
      where: enquiryWhere,
      orderBy: { createdAt: 'desc' },
      take: 8,
      select: {
        id: true,
        enquiryCode: true,
        firstName: true,
        lastName: true,
        status: true,
        source: true,
        interestedCourse: true,
        createdAt: true,
        assignedTo: { select: { id: true, firstName: true, lastName: true } },
        branch: { select: { name: true } },
      },
    }).catch(() => []),

    prisma.student.findMany({
      where: {
        ...studentWhere,
        status: { in: ['ENROLLED', 'REGISTERED', 'VISA_GRANTED', 'APPLICATION_SUBMITTED'] },
      },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        studentCode: true,
        firstName: true,
        lastName: true,
        course: true,
        status: true,
        updatedAt: true,
        branch: { select: { name: true } },
        assignedTo: { select: { firstName: true, lastName: true } },
      },
    }).catch(() => []),

    prisma.invoice.findMany({
      where: {
        ...softDeleteWhere,
        status: { in: ['PAID', 'PARTIAL', 'SENT', 'OVERDUE'] },
        ...(query.branchId ? { student: { branchId: query.branchId } } : { student: studentWhere }),
      },
      orderBy: { updatedAt: 'desc' },
      take: 8,
      select: {
        id: true,
        invoiceNo: true,
        total: true,
        status: true,
        paidAt: true,
        updatedAt: true,
        student: { select: { firstName: true, lastName: true } },
      },
    }).catch(() => []),

    prisma.student.groupBy({
      by: ['course'],
      where: { ...studentWhere, course: { not: null } },
      _count: { _all: true },
    }).catch(() => []),

    prisma.academicBatch.count({
      where: {
        deletedAt: null,
        companyId,
        isActive: true,
        ...(query.branchId ? { branchId: query.branchId } : {}),
      },
    }).catch(() => 0),

    prisma.user.groupBy({
      by: ['roleId'],
      where: {
        companyId,
        deletedAt: null,
        status: 'ACTIVE',
      },
      _count: { _all: true },
    }).catch(() => []),

    (async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 7);
      const scope = academicBranchScope(user, 'session');
      return attendanceRepository.findSessions({
        ...scope,
        startAt: { gte: start, lt: end },
        status: { not: 'CANCELLED' },
        ...(query.branchId ? { branchId: query.branchId } : {}),
      });
    })().catch(() => []),

    prisma.enquiry.findMany({
      where: {
        ...enquiryWhere,
        createdAt: {
          gte: new Date(new Date().getFullYear(), new Date().getMonth() - 5, 1),
        },
      },
      select: { createdAt: true, status: true },
      take: 5000,
    }).catch(() => []),

    (async () => {
      const branchPolicy = resolveBranchAccessPolicy(user);
      const branchWhere = {
        companyId,
        deletedAt: null,
      };
      if (query.branchId) {
        branchWhere.id = query.branchId;
      } else if (branchPolicy.mode === 'LIST' && branchPolicy.branchIds?.length) {
        branchWhere.id = { in: branchPolicy.branchIds };
      }
      if (branchPolicy.mode === 'NONE') return [];

      const branches = await prisma.branch.findMany({
        where: branchWhere,
        select: { id: true, name: true, code: true },
        take: 20,
      });
      const rows = await Promise.all(branches.map(async (branch) => {
        const [students, enquiries, admissions] = await Promise.all([
          prisma.student.count({ where: { branchId: branch.id, ...softDeleteWhere } }),
          prisma.enquiry.count({ where: { branchId: branch.id, ...softDeleteWhere } }),
          prisma.student.count({
            where: {
              branchId: branch.id,
              ...softDeleteWhere,
              status: { in: ['ENROLLED', 'REGISTERED', 'VISA_GRANTED', 'APPLICATION_SUBMITTED'] },
            },
          }),
        ]);
        return {
          branchId: branch.id,
          branch: branch.name,
          code: branch.code,
          students,
          enquiries,
          admissions,
          revenue: null,
          attendance: null,
          conversion: pct(admissions, enquiries),
        };
      }));
      return rows.sort((a, b) => b.students - a.students);
    })().catch(() => []),

    (async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const scope = academicBranchScope(user, 'session');
      const rows = await prisma.classAttendance.findMany({
        where: {
          session: {
            deletedAt: null,
            startAt: { gte: start, lt: end },
            ...scope,
            ...(query.branchId ? { branchId: query.branchId } : {}),
          },
        },
        select: { status: true },
      });
      const present = rows.filter((r) => ['PRESENT', 'LATE', 'HALF_DAY', 'EXCUSED'].includes(r.status)).length;
      const absent = rows.filter((r) => ['ABSENT', 'LEAVE'].includes(r.status)).length;
      const total = rows.length;
      return { present, absent, total, percent: pct(present, total) };
    })().catch(() => ({ present: 0, absent: 0, total: 0, percent: 0 })),

    (async () => {
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(end.getDate() + 1);
      const sessions = await prisma.classSession.findMany({
        where: {
          deletedAt: null,
          startAt: { gte: start, lt: end },
          status: { not: 'CANCELLED' },
          ...(query.branchId ? { branchId: query.branchId } : {}),
          ...academicBranchScope(user, 'session'),
        },
        include: {
          batch: { select: { name: true, courseName: true } },
          instructor: { select: { firstName: true, lastName: true } },
          _count: { select: { attendances: true } },
        },
        take: 12,
      });
      const result = [];
      for (const session of sessions) {
        const enrolled = await prisma.batchEnrollment.count({
          where: { batchId: session.batchId, isActive: true },
        });
        const marks = await prisma.classAttendance.groupBy({
          by: ['status'],
          where: { sessionId: session.id },
          _count: { _all: true },
        });
        const present = marks
          .filter((m) => ['PRESENT', 'LATE', 'HALF_DAY', 'EXCUSED'].includes(m.status))
          .reduce((s, m) => s + m._count._all, 0);
        const absent = marks
          .filter((m) => ['ABSENT', 'LEAVE'].includes(m.status))
          .reduce((s, m) => s + m._count._all, 0);
        result.push({
          batch: session.batch?.name,
          course: session.batch?.courseName,
          students: enrolled,
          present,
          absent,
          percent: pct(present, enrolled),
          sessionId: session.id,
        });
      }
      return result;
    })().catch(() => []),
  ]);

  const roleMap = new Map(
    (await prisma.role.findMany({
      where: { companyId },
      select: { id: true, slug: true, name: true },
    }).catch(() => [])).map((r) => [r.id, r]),
  );

  const staff = {
    counsellors: 0,
    teachers: 0,
    total: 0,
  };
  staffCounts.forEach((row) => {
    const role = roleMap.get(row.roleId);
    const count = row._count._all;
    staff.total += count;
    if (role?.slug === 'counsellor') staff.counsellors += count;
    if (role?.slug === 'teacher' || role?.slug === 'faculty') staff.teachers += count;
  });

  const monthBuckets = {};
  monthlyEnquiries.forEach((row) => {
    const key = monthKey(row.createdAt);
    if (!monthBuckets[key]) monthBuckets[key] = { month: key, enquiries: 0, converted: 0 };
    monthBuckets[key].enquiries += 1;
    if (row.status === 'CONVERTED') monthBuckets[key].converted += 1;
  });
  const monthlyTrend = Object.values(monthBuckets)
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((row) => ({ ...row, label: monthLabel(row.month) }));

  const attendanceWidgets = stats?.attendance || null;
  const classReport = overview?.attendance || null;

  return {
    generatedAt: new Date().toISOString(),
    workspace: stats?.workspace || null,
    visible: stats?.visible || {},
    overview,
    enquiry,
    stats,
    kpis: {
      students: overview?.students?.total ?? stats?.cards?.totalStudents ?? null,
      enquiries: overview?.kpis?.enquiries ?? enquiry?.conversion?.total ?? null,
      converted: overview?.kpis?.converted ?? enquiry?.conversion?.converted ?? null,
      conversionRate: overview?.kpis?.conversionRate ?? enquiry?.conversion?.rate ?? null,
      applications: overview?.applications?.total ?? stats?.cards?.activeApplications ?? null,
      applicationsInReview: overview?.applications?.inReview ?? null,
      visasPending: overview?.visas?.pending ?? stats?.cards?.pendingVisas ?? null,
      revenueCollected: overview?.invoices?.paid ?? stats?.cards?.revenueThisMonth ?? null,
      feesOutstanding: overview?.kpis?.outstanding ?? overview?.invoices?.outstanding ?? null,
      feesOverdue: overview?.kpis?.overdueInvoices ?? overview?.invoices?.overdue ?? null,
      attendancePercent: todayAttendance.percent,
      attendancePresent: todayAttendance.present,
      attendanceAbsent: todayAttendance.absent,
      activeBatches,
      counsellors: staff.counsellors,
      teachers: staff.teachers,
    },
    charts: {
      monthlyTrend,
      funnel: enquiry?.conversion?.funnel || [],
      studentsByCourse: studentsByCourse
        .map((row) => ({
          course: row.course || 'Other',
          count: row._count._all,
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 8),
      applicationStatus: overview?.applications
        ? [
          { label: 'In review', count: overview.applications.inReview || 0 },
          { label: 'Draft', count: overview.applications.draft || 0 },
          { label: 'Submitted', count: overview.applications.submitted || 0 },
          { label: 'Rejected', count: overview.applications.rejected || 0 },
        ].filter((r) => r.count > 0)
        : [],
      visaStatus: overview?.visas
        ? [
          { label: 'Pending', count: overview.visas.pending || 0 },
          { label: 'Approved', count: overview.visas.approved || 0 },
          { label: 'Rejected', count: overview.visas.rejected || 0 },
        ].filter((r) => r.count > 0)
        : [],
    },
    attendance: {
      today: todayAttendance,
      widgets: attendanceWidgets,
      report: classReport,
      batchRows: batchAttendanceToday,
    },
    branches: branchRows,
    counsellors: enquiry?.counsellor?.filter((c) => c.id).slice(0, 10) || [],
    alerts: overview?.needsAttention || [],
    recentEnquiries: recentEnquiries.map((row) => ({
      id: row.id,
      code: row.enquiryCode,
      name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      course: row.interestedCourse,
      source: row.source,
      status: row.status,
      counsellor: row.assignedTo
        ? `${row.assignedTo.firstName || ''} ${row.assignedTo.lastName || ''}`.trim()
        : '—',
      branch: row.branch?.name,
      date: row.createdAt,
    })),
    recentAdmissions: recentAdmissions.map((row) => ({
      id: row.id,
      code: row.studentCode,
      name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
      course: row.course,
      batch: null,
      counsellor: row.assignedTo
        ? `${row.assignedTo.firstName || ''} ${row.assignedTo.lastName || ''}`.trim()
        : '—',
      branch: row.branch?.name,
      date: row.updatedAt,
      feeStatus: '—',
    })),
    recentPayments: recentPayments.map((row) => ({
      id: row.id,
      invoiceNo: row.invoiceNo,
      student: row.student
        ? `${row.student.firstName || ''} ${row.student.lastName || ''}`.trim()
        : '—',
      amount: Number(row.total) || 0,
      status: row.status,
      date: row.paidAt || row.updatedAt,
    })),
    upcomingClasses: (upcomingSessions || []).slice(0, 8).map((session) => ({
      id: session.id,
      batch: session.batch?.name,
      course: session.batch?.courseName,
      teacher: session.instructor
        ? `${session.instructor.firstName || ''} ${session.instructor.lastName || ''}`.trim()
        : '—',
      room: session.room,
      startAt: session.startAt,
      endAt: session.endAt,
      students: session._count?.attendances || 0,
      status: session.status,
    })),
    activity,
    academic: {
      activeBatches,
      todayClasses: attendanceWidgets?.todayClasses ?? 0,
      attendancePending: attendanceWidgets?.attendancePending ?? 0,
      teachers: staff.teachers,
    },
    counsellorDesk,
  };
}
