import prisma from '../../config/database.js';
import { AppError } from '../../utils/response.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';

export const feePlanService = {
  getByStudent: async (studentId) => {
    return prisma.feePlan.findMany({
      where: { studentId, deletedAt: null },
      include: {
        installments: {
          include: {
            payments: { select: { id: true, amount: true, receiptNo: true, paidAt: true, mode: true } },
          },
          orderBy: { dueDate: 'asc' },
        },
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  getById: async (id) => {
    const plan = await prisma.feePlan.findUnique({
      where: { id },
      include: {
        installments: {
          include: {
            payments: true,
          },
          orderBy: { dueDate: 'asc' },
        },
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true, branchId: true } },
      },
    });
    if (!plan || plan.deletedAt) throw new AppError('Fee plan not found', 404);
    return plan;
  },

  create: async (data, userId, req) => {
    const { studentId, title, totalAmount, installments = [], notes } = data;
    if (!studentId) throw new AppError('Student ID is required', 400);

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new AppError('Student not found', 404);

    const total = Number(totalAmount || 0);
    const plan = await prisma.$transaction(async (tx) => {
      // If student already has an active plan, clean up or update
      const existing = await tx.feePlan.findFirst({ where: { studentId } });
      let createdPlan;
      if (existing) {
        createdPlan = await tx.feePlan.update({
          where: { id: existing.id },
          data: {
            totalAmount: total,
            netAmount: total,
            status: 'ACTIVE',
            deletedAt: null,
          },
        });
      } else {
        createdPlan = await tx.feePlan.create({
          data: {
            student: { connect: { id: studentId } },
            totalAmount: total,
            netAmount: total,
            status: 'ACTIVE',
          },
        });
      }

      if (Array.isArray(installments) && installments.length > 0) {
        for (const inst of installments) {
          await tx.feeInstallment.create({
            data: {
              feePlanId: createdPlan.id,
              title: inst.title || 'Installment',
              amount: Number(inst.amount),
              dueDate: new Date(inst.dueDate),
              status: 'PENDING',
            },
          });
        }
      }

      return tx.feePlan.findUnique({
        where: { id: createdPlan.id },
        include: { installments: true },
      });
    });

    if (req) {
      await auditLog({
        userId,
        action: 'CREATE',
        entityType: 'FeePlan',
        entityId: plan.id,
        newData: plan,
        req,
      });
    }

    return plan;
  },

  addInstallment: async (planId, data, userId, req) => {
    const plan = await prisma.feePlan.findUnique({ where: { id: planId } });
    if (!plan || plan.deletedAt) throw new AppError('Fee plan not found', 404);

    const installment = await prisma.feeInstallment.create({
      data: {
        feePlanId: planId,
        title: data.title || 'Installment',
        amount: Number(data.amount),
        dueDate: new Date(data.dueDate),
        status: 'PENDING',
      },
    });

    // Update plan totalAmount
    const all = await prisma.feeInstallment.findMany({ where: { feePlanId: planId } });
    const newTotal = all.reduce((sum, item) => sum + Number(item.amount), 0);
    await prisma.feePlan.update({
      where: { id: planId },
      data: { totalAmount: newTotal, netAmount: newTotal },
    });

    if (req) {
      await auditLog({
        userId,
        action: 'CREATE',
        entityType: 'FeeInstallment',
        entityId: installment.id,
        newData: installment,
        req,
      });
    }

    return installment;
  },

  updateInstallment: async (installmentId, data, userId, req) => {
    const existing = await prisma.feeInstallment.findUnique({ where: { id: installmentId } });
    if (!existing) throw new AppError('Installment not found', 404);

    const updatePayload = {};
    if (data.title !== undefined) updatePayload.title = data.title;
    if (data.dueDate !== undefined) updatePayload.dueDate = new Date(data.dueDate);
    if (data.amount !== undefined) updatePayload.amount = Number(data.amount);
    if (data.status !== undefined) updatePayload.status = data.status;

    const updated = await prisma.feeInstallment.update({
      where: { id: installmentId },
      data: updatePayload,
    });

    if (req) {
      await auditLog({
        userId,
        action: 'UPDATE',
        entityType: 'FeeInstallment',
        entityId: installmentId,
        oldData: existing,
        newData: updated,
        req,
      });
    }

    return updated;
  },

  delete: async (id, userId, req) => {
    const existing = await prisma.feePlan.findUnique({ where: { id } });
    if (!existing) throw new AppError('Fee plan not found', 404);

    await prisma.feePlan.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    if (req) {
      await auditLog({
        userId,
        action: 'DELETE',
        entityType: 'FeePlan',
        entityId: id,
        req,
      });
    }
  },
};
