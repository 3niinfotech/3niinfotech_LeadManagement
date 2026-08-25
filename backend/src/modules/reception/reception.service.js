/**
 * Reception workspace dashboard — aggregates existing CRM data.
 * No ReceptionVisit / Queue / duplicate entities.
 */
import prisma from '../../config/database.js';
import { softDeleteWhere } from '../../utils/response.util.js';
import { mergeScope } from '../../utils/tenant.util.js';
import { hasPermission } from '../rbac/rbac.util.js';
import { calendarService } from '../calendar/calendar.service.js';
import { ROLE_WORKSPACE_META } from '../../config/role-workspace.js';
import { assignmentEngine } from '../assignment/assignment.engine.js';

function dayBounds(base = new Date()) {
  const start = new Date(base);
  start.setHours(0, 0, 0, 0);
  const end = new Date(base);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function can(user, key) {
  return hasPermission(user?.permissions || [], key);
}

function mapAppointmentEvent(e) {
  return {
    id: e.id,
    time: e.startAt,
    endAt: e.endAt,
    visitor: e.relatedEntity?.name || e.title,
    type: e.eventType,
    purpose: e.title,
    status: e.status,
    assignedTo: e.assignedUserName || null,
    assignedToId: e.assignedUserId || null,
    branchName: e.branchName || null,
    relatedEntity: e.relatedEntity || null,
    location: e.location || null,
  };
}

function mapFollowupEvent(e) {
  return {
    id: e.id,
    time: e.startAt,
    visitor: e.relatedEntity?.name || e.title,
    remark: e.description || null,
    status: e.status,
    assignedTo: e.assignedUserName || null,
    relatedEntity: e.relatedEntity || null,
  };
}

function mapSessionEvent(e) {
  return {
    id: e.id,
    time: e.startAt,
    endAt: e.endAt,
    kind: e.eventType === 'DEMO' ? 'Demo' : 'Class',
    visitor: e.relatedEntity?.name || e.title,
    title: e.title,
    detail: e.description || null,
    status: e.status,
    assignedTo: e.assignedUserName || null,
    relatedEntity: e.relatedEntity || null,
  };
}

export const receptionService = {
  getDashboard: async (user) => {
    const { start, end } = dayBounds();
    const now = new Date();
    const leadScope = mergeScope(user);
    const enquiryScope = mergeScope(user, { entity: 'enquiry' });
    const branchId = user.viewingBranchId || user.branchId || null;
    const workspace = ROLE_WORKSPACE_META.receptionist || {
      title: 'Reception',
      subtitle: "Today's appointments, visitors, and follow-ups",
    };

    const emptyEvents = { events: [] };
    const calendarPromise = can(user, 'calendar.view') || can(user, 'enquiry.view') || can(user, 'lead.view')
      ? calendarService.getEvents({
        from: start.toISOString(),
        to: end.toISOString(),
      }, user).catch((error) => {
        // Calendar must never break the dashboard, but a silent failure hides missing data.
        console.error('[reception] calendar events failed:', error.message);
        return emptyEvents;
      })
      : Promise.resolve(emptyEvents);

    const branchPromise = branchId
      ? prisma.branch.findFirst({
        where: {
          id: branchId,
          deletedAt: null,
          ...(user.companyId ? { companyId: user.companyId } : {}),
        },
        select: { id: true, name: true, code: true },
      })
      : Promise.resolve(null);

    const counsellorPromise = can(user, 'reception.walkin.assign') && branchId
      ? assignmentEngine.recommendCounsellors({
        branchId,
        companyId: user.companyId,
      }).catch(() => [])
      : Promise.resolve([]);

    const walkinTasks = can(user, 'reception.walkin.view') || can(user, 'lead.view')
      ? {
        todayVisitors: prisma.lead.count({
          where: {
            ...softDeleteWhere,
            ...leadScope,
            walkInAt: { gte: start, lte: end },
          },
        }),
        expectedVisitors: prisma.lead.count({
          where: {
            ...softDeleteWhere,
            ...leadScope,
            walkInAt: { gte: start, lte: end },
            status: { in: ['WALK_IN', 'WAITING', 'APPOINTMENT'] },
          },
        }),
        arrivedVisitors: prisma.lead.count({
          where: {
            ...softDeleteWhere,
            ...leadScope,
            walkInAt: { gte: start, lte: end },
            status: { in: ['IN_COUNSELLING', 'COMPLETED'] },
          },
        }),
        waitingVisitors: prisma.lead.count({
          where: {
            ...softDeleteWhere,
            ...leadScope,
            walkInAt: { gte: start, lte: end },
            status: 'WAITING',
          },
        }),
        todayWalkInsList: prisma.lead.findMany({
          where: {
            ...softDeleteWhere,
            ...leadScope,
            walkInAt: { gte: start, lte: end },
          },
          orderBy: { walkInAt: 'desc' },
          take: 8,
          select: {
            id: true,
            leadCode: true,
            firstName: true,
            lastName: true,
            phone: true,
            status: true,
            interestedCourse: true,
            walkInAt: true,
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
            enquiry: { select: { id: true, enquiryCode: true } },
          },
        }),
        completedToday: prisma.lead.count({
          where: {
            ...softDeleteWhere,
            ...leadScope,
            status: 'COMPLETED',
            walkInAt: { gte: start, lte: end },
          },
        }),
        convertedToday: prisma.lead.count({
          where: {
            ...softDeleteWhere,
            ...leadScope,
            convertedAt: { gte: start, lte: end },
          },
        }),
        priorityVisitors: prisma.lead.count({
          where: {
            ...softDeleteWhere,
            ...leadScope,
            priority: { in: ['HIGH', 'VIP'] },
            status: { in: ['WALK_IN', 'WAITING', 'IN_COUNSELLING', 'APPOINTMENT'] },
          },
        }),
        unassignedWaiting: prisma.lead.count({
          where: {
            ...softDeleteWhere,
            ...leadScope,
            assignedToId: null,
            status: { in: ['WALK_IN', 'WAITING'] },
          },
        }),
      }
      : {
        todayVisitors: Promise.resolve(0),
        expectedVisitors: Promise.resolve(0),
        arrivedVisitors: Promise.resolve(0),
        waitingVisitors: Promise.resolve(0),
        todayWalkInsList: Promise.resolve([]),
        completedToday: Promise.resolve(0),
        convertedToday: Promise.resolve(0),
        priorityVisitors: Promise.resolve(0),
        unassignedWaiting: Promise.resolve(0),
      };

    const enquiryTasks = can(user, 'enquiry.view')
      ? {
        pendingEnquiries: prisma.enquiry.count({
          where: {
            ...softDeleteWhere,
            ...enquiryScope,
            status: {
              notIn: ['CONVERTED', 'LOST', 'NOT_INTERESTED', 'SPAM', 'DUPLICATE'],
            },
          },
        }),
        recentEnquiries: prisma.enquiry.findMany({
          where: { ...softDeleteWhere, ...enquiryScope },
          orderBy: [{ lastTouchedAt: 'desc' }, { updatedAt: 'desc' }],
          take: 8,
          select: {
            id: true,
            enquiryCode: true,
            firstName: true,
            lastName: true,
            mobile: true,
            email: true,
            status: true,
            source: true,
            interestedCountry: true,
            interestedCourse: true,
            createdAt: true,
            lastTouchedAt: true,
            assignedTo: { select: { id: true, firstName: true, lastName: true } },
          },
        }),
      }
      : {
        pendingEnquiries: Promise.resolve(0),
        recentEnquiries: Promise.resolve([]),
      };

    const [
      calendarResult,
      todayVisitors,
      expectedVisitors,
      arrivedVisitors,
      waitingVisitors,
      todayWalkInsList,
      completedToday,
      convertedToday,
      priorityVisitors,
      unassignedWaiting,
      pendingEnquiries,
      recentEnquiries,
      branch,
      counsellorAvailability,
    ] = await Promise.all([
      calendarPromise,
      walkinTasks.todayVisitors,
      walkinTasks.expectedVisitors,
      walkinTasks.arrivedVisitors,
      walkinTasks.waitingVisitors,
      walkinTasks.todayWalkInsList,
      walkinTasks.completedToday,
      walkinTasks.convertedToday,
      walkinTasks.priorityVisitors,
      walkinTasks.unassignedWaiting,
      enquiryTasks.pendingEnquiries,
      enquiryTasks.recentEnquiries,
      branchPromise,
      counsellorPromise,
    ]);

    const events = calendarResult.events || [];
    const appointmentsToday = events
      .filter((e) => e.eventType === 'APPOINTMENT')
      .map(mapAppointmentEvent);
    const followupsDue = events
      .filter((e) => e.eventType === 'FOLLOWUP')
      .map(mapFollowupEvent);
    const demosToday = events.filter((e) => e.eventType === 'DEMO').map(mapSessionEvent);
    const classesToday = events.filter((e) => e.eventType === 'CLASS').map(mapSessionEvent);
    const overdueFollowups = followupsDue.filter((e) => e.status === 'OVERDUE');
    const upcomingAppointments = appointmentsToday
      .filter((e) => e.status !== 'COMPLETED' && new Date(e.time) >= now)
      .slice(0, 5);
    const timeline = [...events]
      .sort((a, b) => new Date(a.startAt) - new Date(b.startAt))
      .slice(0, 12)
      .map((e) => ({
        id: e.id,
        time: e.startAt,
        title: e.title,
        eventType: e.eventType,
        status: e.status,
        visitor: e.relatedEntity?.name || null,
        assignedTo: e.assignedUserName || null,
        relatedEntity: e.relatedEntity || null,
      }));

    const appointmentsRemaining = appointmentsToday.filter(
      (event) => event.status !== 'COMPLETED' && new Date(event.time) >= now,
    ).length;
    const completedAppointments = appointmentsToday.filter((event) => event.status === 'COMPLETED').length;
    const overdueAppointments = appointmentsToday.filter((event) => event.status === 'OVERDUE').length;
    const availableCounsellors = counsellorAvailability.filter(
      (row) => row.availability?.key === 'AVAILABLE',
    ).length;
    const busyCounsellors = counsellorAvailability.filter(
      (row) => ['IN_COUNSELLING', 'UNAVAILABLE', 'MEETING'].includes(row.availability?.key),
    ).length;

    return {
      workspace,
      date: start.toISOString(),
      context: {
        generatedAt: new Date().toISOString(),
        branch,
      },
      metrics: {
        walkInsToday: todayVisitors,
        waitingNow: waitingVisitors,
        arrivedToday: arrivedVisitors,
        completedToday,
        convertedToday,
        priorityVisitors,
        unassignedWaiting,
        appointmentsToday: appointmentsToday.length,
        appointmentsRemaining,
        completedAppointments,
        overdueAppointments,
        followupsDueToday: followupsDue.length,
        overdueFollowups: overdueFollowups.length,
        demosToday: demosToday.length,
        classesToday: classesToday.length,
        availableCounsellors,
        busyCounsellors,
        totalCounsellors: counsellorAvailability.length,
      },
      counsellorAvailability,
      summary: {
        todayAppointments: appointmentsToday.length,
        expectedVisitors,
        arrivedVisitors,
        waitingVisitors,
        todayVisitors,
        pendingEnquiries,
        followupsDue: followupsDue.length,
        overdueFollowups: overdueFollowups.length,
      },
      todayAppointments: appointmentsToday,
      upcomingAppointments,
      followupsDue,
      overdueFollowups,
      demosToday,
      classesToday,
      recentEnquiries,
      todayWalkIns: todayWalkInsList.map((row) => ({
        id: row.id,
        code: row.leadCode,
        name: `${row.firstName || ''} ${row.lastName || ''}`.trim(),
        phone: row.phone,
        status: row.status,
        course: row.interestedCourse,
        walkInAt: row.walkInAt,
        assignedTo: row.assignedTo
          ? `${row.assignedTo.firstName || ''} ${row.assignedTo.lastName || ''}`.trim()
          : null,
        enquiryId: row.enquiry?.id || null,
        enquiryCode: row.enquiry?.enquiryCode || null,
      })),
      timeline,
      capabilities: {
        walkins: can(user, 'reception.walkin.view') || can(user, 'lead.view'),
        walkinCreate: can(user, 'reception.walkin.create'),
        enquiries: can(user, 'enquiry.view'),
        enquiryCreate: can(user, 'enquiry.create') || can(user, 'reception.walkin.create'),
        calendar: can(user, 'calendar.view'),
        calendarCreate: can(user, 'calendar.create'),
        calendarUpdate: can(user, 'calendar.update'),
        calendarAssign: can(user, 'calendar.assign'),
        walkinAssign: can(user, 'reception.walkin.assign'),
        students: can(user, 'student.view'),
        search: false,
        profile: true,
      },
    };
  },
};
