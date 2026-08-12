import prisma from '../config/database.js';

export const auditLog = async ({ userId, action, entityType, entityId, oldData, newData, req }) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        action,
        entityType,
        entityId,
        oldData: oldData || undefined,
        newData: newData || undefined,
        ipAddress: req?.ip || req?.headers?.['x-forwarded-for'],
        userAgent: req?.headers?.['user-agent'],
      },
    });
  } catch {
    // Audit failures should not break main flow
  }
};
