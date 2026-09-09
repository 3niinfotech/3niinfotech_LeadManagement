import prisma from '../../config/database.js';
import {
  AVAILABILITY_STATE,
  AVAILABILITY_DISPLAY,
  DEFAULT_WORKING_HOURS,
  MAX_CONCURRENT_SESSIONS,
} from './assignment.config.js';

const TERMINAL_ENQUIRY_STATUSES = ['LOST', 'CONVERTED', 'NOT_INTERESTED', 'SPAM', 'DUPLICATE'];
const HOT_ENQUIRY_PRIORITIES = ['URGENT', 'HIGH'];

export function isHotLeadPriority(priority) {
  return HOT_ENQUIRY_PRIORITIES.includes(String(priority || '').toUpperCase());
}

function parseTimeToMinutes(timeStr) {
  if (!timeStr || typeof timeStr !== 'string') return null;
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return h * 60 + m;
}

function isWithinWorkingHours(workingHours, now = new Date(), timezone = 'Asia/Kolkata') {
  const day = now.getDay();
  const row = workingHours.find((w) => w.dayOfWeek === day);
  if (!row || !row.isWorkingDay) return false;
  const start = parseTimeToMinutes(row.startTime);
  const end = parseTimeToMinutes(row.endTime);
  if (start == null || end == null) return true;

  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone: timezone,
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  const parts = formatter.formatToParts(now);
  const hour = Number(parts.find((p) => p.type === 'hour')?.value || 0);
  const minute = Number(parts.find((p) => p.type === 'minute')?.value || 0);
  const current = hour * 60 + minute;
  return current >= start && current < end;
}

function formatTime12h(timeStr) {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':').map(Number);
  if (Number.isNaN(h)) return timeStr;
  const suffix = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  return `${hour12}:${String(m || 0).padStart(2, '0')} ${suffix}`;
}

function formatTodayWorkingHours(workingHours, now = new Date(), timezone = 'Asia/Kolkata') {
  const day = now.getDay();
  const row = workingHours.find((w) => w.dayOfWeek === day);
  if (!row || !row.isWorkingDay) return 'Not a working day';
  return `${formatTime12h(row.startTime)} – ${formatTime12h(row.endTime)}`;
}

async function getTodaySchedule(userId, now = new Date()) {
  const startOfDay = new Date(now);
  startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(now);
  endOfDay.setHours(23, 59, 59, 999);

  const [todayAppointments, nextAppointment] = await Promise.all([
    prisma.enquiryAppointment.count({
      where: {
        counsellorId: userId,
        isCompleted: false,
        startAt: { gte: startOfDay, lte: endOfDay },
      },
    }),
    prisma.enquiryAppointment.findFirst({
      where: {
        counsellorId: userId,
        isCompleted: false,
        startAt: { gt: now },
      },
      orderBy: { startAt: 'asc' },
      select: { id: true, title: true, startAt: true, endAt: true },
    }),
  ]);

  return { todayAppointments, nextAppointment };
}

function dateOnly(d) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

async function getWorkingHours(userId, companyId) {
  const rows = await prisma.staffWorkingHours.findMany({ where: { userId, companyId } });
  if (!rows.length) return DEFAULT_WORKING_HOURS;
  return rows.map((r) => ({
    dayOfWeek: r.dayOfWeek,
    isWorkingDay: r.isWorkingDay,
    startTime: r.startTime,
    endTime: r.endTime,
    timezone: r.timezone || 'Asia/Kolkata',
  }));
}

async function isOnLeave(userId, companyId, now = new Date(), timezone = 'Asia/Kolkata') {
  const dayFormatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  const todayStr = dayFormatter.format(now);

  const leaves = await prisma.staffLeaveRecord.findMany({
    where: { userId, companyId, status: 'APPROVED' },
    orderBy: { startDate: 'desc' },
    take: 20,
  });

  for (const leave of leaves) {
    const startStr = dayFormatter.format(new Date(leave.startDate));
    const endStr = dayFormatter.format(new Date(leave.endDate));
    if (todayStr >= startStr && todayStr <= endStr) return leave;
  }
  return null;
}

async function getActiveAppointmentBlock(userId, now = new Date()) {
  return prisma.enquiryAppointment.findFirst({
    where: {
      counsellorId: userId,
      isCompleted: false,
      startAt: { lte: now },
      OR: [{ endAt: null }, { endAt: { gte: now } }],
    },
    select: { id: true, title: true, startAt: true, endAt: true },
  });
}

async function getActiveSession(userId) {
  return prisma.counsellingSession.findFirst({
    where: { counsellorId: userId, status: 'ACTIVE' },
    select: { id: true, leadId: true, startedAt: true },
  });
}

function hasTemporaryOverride(presence) {
  const meta = presence?.metadata;
  if (!meta || typeof meta !== 'object' || Array.isArray(meta)) return null;
  if (meta.temporaryOverride === 'UNAVAILABLE' && meta.overrideUntil) {
    const until = new Date(meta.overrideUntil).getTime();
    if (!Number.isNaN(until) && until > Date.now()) {
      return { reason: meta.overrideReason || 'Temporary override', until: meta.overrideUntil };
    }
  }
  return null;
}

export const availabilityEngine = {
  async getCounsellorSkillsProfile(userId, companyId) {
    const links = await prisma.userCounsellorSkill.findMany({
      where: { userId, skill: { companyId, isActive: true, deletedAt: null } },
      include: { skill: { select: { id: true, code: true, name: true } } },
    });

    const profile = { countries: [], courses: [], languages: [], services: [], domains: [], general: [] };
    for (const link of links) {
      const val = link.skillValue || link.skill.name;
      switch (link.category) {
        case 'COUNTRY': profile.countries.push(val); break;
        case 'COURSE': profile.courses.push(val); break;
        case 'LANGUAGE': profile.languages.push(val); break;
        case 'SERVICE': profile.services.push(val); break;
        case 'DOMAIN': profile.domains.push(val); break;
        default: profile.general.push(val);
      }
    }

    const presence = await prisma.counsellorPresence.findUnique({ where: { userId } });
    const legacy = presence?.skills;
    if (legacy && typeof legacy === 'object' && !Array.isArray(legacy)) {
      for (const key of ['countries', 'courses', 'languages', 'services']) {
        if (Array.isArray(legacy[key])) {
          profile[key] = [...new Set([...profile[key], ...legacy[key]])];
        }
      }
    }
    return profile;
  },

  async getWorkload(userId, presence) {
    const maxActive = presence?.maxActiveLeads ?? 50;
    const maxDaily = presence?.maxDailyCapacity ?? 20;
    const maxHot = presence?.hotLeadCapacity ?? 10;

    const [activeEnquiries, activeLeads, activeSessions, todayAssigned, hotAssigned] = await Promise.all([
      prisma.enquiry.count({
        where: {
          assignedToId: userId,
          deletedAt: null,
          status: { notIn: TERMINAL_ENQUIRY_STATUSES },
        },
      }),
      prisma.lead.count({
        where: {
          assignedToId: userId,
          deletedAt: null,
          status: { in: ['WALK_IN', 'WAITING', 'IN_COUNSELLING', 'APPOINTMENT'] },
        },
      }),
      prisma.counsellingSession.count({ where: { counsellorId: userId, status: 'ACTIVE' } }),
      prisma.enquiryAssignmentLog.count({
        where: {
          toUserId: userId,
          assignmentType: { in: ['AUTO', 'MANUAL', 'REASSIGN', 'BULK', 'FALLBACK'] },
          createdAt: { gte: new Date(new Date().setHours(0, 0, 0, 0)) },
        },
      }),
      prisma.enquiry.count({
        where: {
          assignedToId: userId,
          deletedAt: null,
          priority: { in: HOT_ENQUIRY_PRIORITIES },
          status: { notIn: TERMINAL_ENQUIRY_STATUSES },
        },
      }),
    ]);

    const activeLeadTotal = activeEnquiries + activeLeads;
    const activeLeadCapacityPct = maxActive > 0 ? (activeLeadTotal / maxActive) * 100 : 0;
    const dailyCapacityPct = maxDaily > 0 ? (todayAssigned / maxDaily) * 100 : 0;

    const lastAssigned = presence?.lastAssignedAt?.getTime() || 0;
    const roundRobinBonus = Math.min(20, (Date.now() - lastAssigned) / 60000);

    return {
      activeEnquiries,
      activeLeads,
      activeLeadTotal,
      activeSessions,
      todayAssigned,
      hotAssigned,
      maxActiveLeads: maxActive,
      maxDailyCapacity: maxDaily,
      hotLeadCapacity: maxHot,
      activeLeadCapacityPct,
      dailyCapacityPct,
      roundRobinBonus,
      atCapacity: activeLeadTotal >= maxActive,
      hotCapReached: hotAssigned >= maxHot,
      dailyCapReached: todayAssigned >= maxDaily,
    };
  },

  async evaluateCounsellor(counsellor, { companyId, branchId, now = new Date(), leadPriority = null } = {}) {
    const exclusions = [];
    const userId = counsellor.id;
    const presence = await prisma.counsellorPresence.findUnique({ where: { userId } })
      || counsellor.counsellorPresence
      || null;

    if (counsellor.status !== 'ACTIVE' || counsellor.deletedAt) {
      return {
        state: AVAILABILITY_STATE.INELIGIBLE,
        label: AVAILABILITY_DISPLAY[AVAILABILITY_STATE.INELIGIBLE].label,
        eligible: false,
        exclusions: ['Inactive staff account'],
        display: { tone: 'neutral', detail: 'Staff inactive' },
      };
    }

    const override = hasTemporaryOverride(presence);
    if (override) {
      return {
        state: AVAILABILITY_STATE.UNAVAILABLE,
        label: AVAILABILITY_DISPLAY[AVAILABILITY_STATE.UNAVAILABLE].label,
        eligible: false,
        exclusions: [`Temporary override: ${override.reason}`],
        display: { tone: 'danger', detail: override.reason },
      };
    }

    const workingHours = await getWorkingHours(userId, companyId);
    const tz = workingHours[0]?.timezone || 'Asia/Kolkata';

    const leave = await isOnLeave(userId, companyId, now, tz);
    if (leave) {
      return {
        state: AVAILABILITY_STATE.ON_LEAVE,
        label: AVAILABILITY_DISPLAY[AVAILABILITY_STATE.ON_LEAVE].label,
        eligible: false,
        exclusions: ['On approved leave'],
        display: { tone: 'danger', detail: 'On approved leave' },
      };
    }

    if (!isWithinWorkingHours(workingHours, now, tz)) {
      return {
        state: AVAILABILITY_STATE.OUTSIDE_WORKING_HOURS,
        label: AVAILABILITY_DISPLAY[AVAILABILITY_STATE.OUTSIDE_WORKING_HOURS].label,
        eligible: false,
        exclusions: ['Outside working hours'],
        display: { tone: 'caution', detail: formatTodayWorkingHours(workingHours, now, tz) },
      };
    }

    const workload = await this.getWorkload(userId, presence);
    const hotLeadContext = isHotLeadPriority(leadPriority);
    const capacityBlocks = [];

    if (workload.atCapacity) {
      capacityBlocks.push(`Active lead capacity reached (${workload.activeLeadTotal}/${workload.maxActiveLeads})`);
    }
    if (hotLeadContext && workload.hotCapReached) {
      capacityBlocks.push(`Hot lead capacity reached (${workload.hotAssigned}/${workload.hotLeadCapacity})`);
    }
    if (workload.dailyCapReached) {
      capacityBlocks.push(`Daily assignment capacity reached (${workload.todayAssigned}/${workload.maxDailyCapacity})`);
    }

    if (capacityBlocks.length) {
      return {
        state: AVAILABILITY_STATE.AT_CAPACITY,
        label: AVAILABILITY_DISPLAY[AVAILABILITY_STATE.AT_CAPACITY].label,
        eligible: false,
        exclusions: capacityBlocks,
        display: {
          tone: AVAILABILITY_DISPLAY[AVAILABILITY_STATE.AT_CAPACITY].tone,
          detail: workload.atCapacity
            ? `${workload.activeLeadTotal} / ${workload.maxActiveLeads} active leads`
            : hotLeadContext && workload.hotCapReached
              ? `${workload.hotAssigned} / ${workload.hotLeadCapacity} hot leads`
              : `Daily limit ${workload.todayAssigned} / ${workload.maxDailyCapacity}`,
        },
        workload,
      };
    }

    const session = await getActiveSession(userId);
    if (session || workload.activeSessions >= MAX_CONCURRENT_SESSIONS) {
      return {
        state: AVAILABILITY_STATE.TEMPORARILY_BUSY,
        label: AVAILABILITY_DISPLAY[AVAILABILITY_STATE.TEMPORARILY_BUSY].label,
        eligible: false,
        exclusions: ['Active counselling session'],
        display: { tone: 'warning', detail: 'Active counselling session' },
        workload,
        session,
      };
    }

    const appointment = await getActiveAppointmentBlock(userId, now);
    if (appointment) {
      return {
        state: AVAILABILITY_STATE.TEMPORARILY_BUSY,
        label: AVAILABILITY_DISPLAY[AVAILABILITY_STATE.TEMPORARILY_BUSY].label,
        eligible: false,
        exclusions: ['Calendar appointment in progress'],
        display: { tone: 'warning', detail: appointment.title || 'In appointment' },
        workload,
        appointment,
      };
    }

    return {
      state: AVAILABILITY_STATE.AVAILABLE,
      label: AVAILABILITY_DISPLAY[AVAILABILITY_STATE.AVAILABLE].label,
      eligible: true,
      exclusions: [],
      display: { tone: 'success', detail: 'Available for new enquiries' },
      workload,
    };
  },

  /** Full read-only snapshot for counsellor header / detail panel */
  async getAvailabilitySnapshot(userId, { companyId, branchId, now = new Date() }) {
    const counsellor = await prisma.user.findFirst({
      where: { id: userId, companyId, deletedAt: null },
      include: { counsellorPresence: true, role: { select: { slug: true, name: true } } },
    });
    if (!counsellor) return null;

    const evaluation = await this.evaluateCounsellor(counsellor, { companyId, branchId, now });
    const workingHours = await getWorkingHours(userId, companyId);
    const tz = workingHours[0]?.timezone || 'Asia/Kolkata';
    const schedule = await getTodaySchedule(userId, now);
    const workload = evaluation.workload || await this.getWorkload(userId, counsellor.counsellorPresence);

    const leave = await isOnLeave(userId, companyId, now);
    const session = await getActiveSession(userId);
    const appointment = await getActiveAppointmentBlock(userId, now);

    let currentActivity = evaluation.display?.detail || evaluation.label;
    if (evaluation.session || session) currentActivity = 'Active counselling session';
    else if (evaluation.appointment || appointment) {
      currentActivity = (evaluation.appointment || appointment).title || 'In appointment';
    } else if (evaluation.state === AVAILABILITY_STATE.AVAILABLE) {
      currentActivity = 'Within working hours and capacity available';
    } else if (evaluation.state === AVAILABILITY_STATE.ON_LEAVE && leave) {
      currentActivity = `Approved leave until ${dayjsFormat(leave.endDate)}`;
    }

    return {
      status: evaluation.state,
      label: evaluation.label,
      tone: evaluation.display?.tone || 'neutral',
      detail: evaluation.display?.detail,
      eligible: evaluation.eligible,
      exclusions: evaluation.exclusions || [],
      whyStatus: (evaluation.exclusions || []).join(' · ') || currentActivity,
      workingHoursToday: formatTodayWorkingHours(workingHours, now, tz),
      workload: {
        activeLeads: workload.activeLeadTotal,
        maxActiveLeads: workload.maxActiveLeads,
        hotLeads: workload.hotAssigned,
        hotLeadCapacity: workload.hotLeadCapacity,
        todayAssigned: workload.todayAssigned,
        maxDailyCapacity: workload.maxDailyCapacity,
        activeSessions: workload.activeSessions,
      },
      currentActivity,
      currentSession: session
        ? { id: session.id, leadId: session.leadId, startedAt: session.startedAt }
        : null,
      currentAppointment: appointment
        ? { id: appointment.id, title: appointment.title, startAt: appointment.startAt, endAt: appointment.endAt }
        : null,
      leave: leave
        ? { startDate: leave.startDate, endDate: leave.endDate, reason: leave.reason }
        : null,
      schedule: {
        todayAppointments: schedule.todayAppointments,
        nextAppointment: schedule.nextAppointment
          ? {
            time: schedule.nextAppointment.startAt,
            title: schedule.nextAppointment.title,
          }
          : null,
      },
      evaluatedAt: now.toISOString(),
    };
  },
};

function dayjsFormat(d) {
  if (!d) return '';
  const x = new Date(d);
  return x.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
}

export function mapAvailabilityLabelFromState(stateResult) {
  const display = AVAILABILITY_DISPLAY[stateResult.state];
  return {
    key: stateResult.state,
    label: display?.label || stateResult.label,
    tone: stateResult.display?.tone || display?.tone || 'neutral',
    detail: stateResult.display?.detail || stateResult.label,
  };
}
