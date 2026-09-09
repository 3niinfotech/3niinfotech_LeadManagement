import { AppError } from '../../utils/response.util.js';
import prisma from '../../config/database.js';
import { assertUserInTenant, requireTenantCompany } from '../../utils/tenant.util.js';
import { DEFAULT_WORKING_HOURS } from '../assignment/assignment.config.js';

export const userStaffProfileService = {
  getWorkingHours: async (userId, requester) => {
    await assertUserInTenant(userId, requester);
    const companyId = requireTenantCompany(requester);
    const rows = await prisma.staffWorkingHours.findMany({
      where: { userId, companyId },
      orderBy: { dayOfWeek: 'asc' },
    });
    if (!rows.length) return DEFAULT_WORKING_HOURS;
    return rows;
  },

  saveWorkingHours: async (userId, schedule, requester) => {
    await assertUserInTenant(userId, requester);
    const companyId = requireTenantCompany(requester);
    if (!Array.isArray(schedule) || !schedule.length) {
      throw new AppError('Working hours schedule is required', 400);
    }

    await prisma.$transaction(
      schedule.map((row) => prisma.staffWorkingHours.upsert({
        where: { userId_dayOfWeek: { userId, dayOfWeek: row.dayOfWeek } },
        create: {
          userId,
          companyId,
          dayOfWeek: row.dayOfWeek,
          startTime: row.startTime,
          endTime: row.endTime,
          isWorkingDay: row.isWorkingDay !== false,
          timezone: row.timezone || 'Asia/Kolkata',
        },
        update: {
          startTime: row.startTime,
          endTime: row.endTime,
          isWorkingDay: row.isWorkingDay !== false,
          timezone: row.timezone || 'Asia/Kolkata',
        },
      })),
    );

    return userStaffProfileService.getWorkingHours(userId, requester);
  },

  listLeave: async (userId, requester) => {
    await assertUserInTenant(userId, requester);
    const companyId = requireTenantCompany(requester);
    return prisma.staffLeaveRecord.findMany({
      where: { userId, companyId },
      orderBy: { startDate: 'desc' },
      take: 100,
    });
  },

  createLeave: async (userId, data, requester) => {
    await assertUserInTenant(userId, requester);
    const companyId = requireTenantCompany(requester);
    return prisma.staffLeaveRecord.create({
      data: {
        userId,
        companyId,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        leaveType: data.leaveType || 'FULL_DAY',
        status: data.status || 'APPROVED',
        reason: data.reason || null,
        createdBy: requester.id,
      },
    });
  },

  getCounsellorSkills: async (userId, requester) => {
    await assertUserInTenant(userId, requester);
    const companyId = requireTenantCompany(requester);
    return prisma.userCounsellorSkill.findMany({
      where: { userId, skill: { companyId, deletedAt: null } },
      include: { skill: { select: { id: true, code: true, name: true, category: true } } },
      orderBy: { createdAt: 'asc' },
    });
  },

  saveCounsellorSkills: async (userId, skills, requester) => {
    await assertUserInTenant(userId, requester);
    const companyId = requireTenantCompany(requester);
    if (!Array.isArray(skills)) throw new AppError('Skills array required', 400);

    const skillIds = skills.map((s) => s.skillId);
    const validSkills = await prisma.counsellorSkill.findMany({
      where: { id: { in: skillIds }, companyId, deletedAt: null },
      select: { id: true },
    });
    const validIds = new Set(validSkills.map((s) => s.id));

    await prisma.$transaction([
      prisma.userCounsellorSkill.deleteMany({ where: { userId } }),
      ...skills
        .filter((s) => validIds.has(s.skillId))
        .map((s) => prisma.userCounsellorSkill.create({
          data: {
            userId,
            skillId: s.skillId,
            category: s.category || 'GENERAL',
            skillValue: s.skillValue || null,
          },
        })),
    ]);

    return userStaffProfileService.getCounsellorSkills(userId, requester);
  },
};
