import prisma from '../../config/database.js';
import { AppError } from '../../utils/response.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import { notifyFinancialEvent } from '../notification/notification.dispatcher.js';

export const refundService = {
  requestRefund: async (data, userId, req) => {
    const { studentId, invoiceId, paymentId, amount, reason, refundMethod } = data;
    if (!studentId) throw new AppError('Student ID is required', 400);
    const refundAmount = Number(amount);
    if (isNaN(refundAmount) || refundAmount <= 0) {
      throw new AppError('Refund amount must be greater than zero', 400);
    }
    if (!reason) throw new AppError('Reason for refund is required', 400);

    const student = await prisma.student.findUnique({ where: { id: studentId } });
    if (!student) throw new AppError('Student not found', 404);

    if (invoiceId) {
      const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
      if (!invoice) throw new AppError('Invoice not found', 404);
      const paid = Number(invoice.amountPaid || 0);
      if (refundAmount > paid) {
        throw new AppError(`Refund amount (${refundAmount.toFixed(2)}) cannot exceed amount paid on invoice (${paid.toFixed(2)})`, 400);
      }
    }

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const refundCount = await prisma.refund.count();
    const refundNo = `REF-${dateStr}-${String(refundCount + 1).padStart(4, '0')}`;

    const refund = await prisma.refund.create({
      data: {
        refundNo,
        branchId: student.branchId,
        studentId,
        invoiceId: invoiceId || null,
        paymentId: paymentId || null,
        amount: refundAmount,
        reason,
        refundMethod: refundMethod || 'BANK_TRANSFER',
        status: 'PENDING',
        requestedById: userId,
      },
      include: {
        student: { select: { firstName: true, lastName: true, studentCode: true } },
        invoice: { select: { invoiceNo: true, amountPaid: true } },
      },
    });

    if (req) {
      await auditLog({
        userId,
        action: 'CREATE',
        entityType: 'Refund',
        entityId: refund.id,
        newData: refund,
        req,
      });
    }

    try {
      await notifyFinancialEvent({
        eventType: 'REFUND_REQUESTED',
        refund,
        student,
        companyId: req?.user?.companyId,
        branchId: student.branchId,
      });
    } catch (e) {
      console.warn('[refund.request] notifyFinancialEvent warning:', e.message);
    }

    return refund;
  },

  getAll: async (query) => {
    const { status, studentId, branchId } = query || {};
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (studentId) where.studentId = studentId;
    if (branchId) where.branchId = branchId;

    return prisma.refund.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true, email: true, phone: true } },
        invoice: { select: { id: true, invoiceNo: true, total: true, amountPaid: true, currency: true } },
        payment: { select: { id: true, receiptNo: true, mode: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  getById: async (id) => {
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true, email: true, phone: true } },
        invoice: { select: { id: true, invoiceNo: true, total: true, amountPaid: true, currency: true } },
        payment: { select: { id: true, receiptNo: true, mode: true } },
        requestedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!refund) throw new AppError('Refund not found', 404);
    return refund;
  },

  approveRefund: async (id, userId, req) => {
    const refund = await prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new AppError('Refund not found', 404);
    if (refund.status !== 'PENDING') throw new AppError(`Cannot approve refund with status ${refund.status}`, 400);

    const updated = await prisma.refund.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewedById: userId,
        reviewedAt: new Date(),
      },
    });

    if (req) {
      await auditLog({
        userId,
        action: 'REFUND_APPROVED',
        entityType: 'Refund',
        entityId: id,
        newData: updated,
        req,
      });
    }

    try {
      const student = await prisma.student.findUnique({ where: { id: refund.studentId } });
      await notifyFinancialEvent({
        eventType: 'REFUND_APPROVED',
        refund: updated,
        student,
        reviewerUser: req?.user,
        companyId: req?.user?.companyId,
        branchId: refund.branchId,
      });
    } catch (e) {
      console.warn('[refund.approve] notifyFinancialEvent warning:', e.message);
    }

    return updated;
  },

  rejectRefund: async (id, { rejectionReason }, userId, req) => {
    const refund = await prisma.refund.findUnique({ where: { id } });
    if (!refund) throw new AppError('Refund not found', 404);
    if (refund.status !== 'PENDING') throw new AppError(`Cannot reject refund with status ${refund.status}`, 400);

    const updated = await prisma.refund.update({
      where: { id },
      data: {
        status: 'REJECTED',
        rejectionReason: rejectionReason || 'Rejected by finance authority',
        reviewedById: userId,
        reviewedAt: new Date(),
      },
    });

    if (req) {
      await auditLog({
        userId,
        action: 'REFUND_REJECTED',
        entityType: 'Refund',
        entityId: id,
        newData: updated,
        req,
      });
    }

    try {
      const student = await prisma.student.findUnique({ where: { id: refund.studentId } });
      await notifyFinancialEvent({
        eventType: 'REFUND_REJECTED',
        refund: updated,
        student,
        rejectionReason,
        reviewerUser: req?.user,
        companyId: req?.user?.companyId,
        branchId: refund.branchId,
      });
    } catch (e) {
      console.warn('[refund.reject] notifyFinancialEvent warning:', e.message);
    }

    return updated;
  },

  disburseRefund: async (id, { refundTxRef, refundMethod }, userId, req) => {
    const refund = await prisma.refund.findUnique({
      where: { id },
      include: { invoice: true, student: true },
    });
    if (!refund) throw new AppError('Refund not found', 404);
    if (refund.status !== 'APPROVED') {
      throw new AppError('Refund must be APPROVED before disbursement', 400);
    }

    const refundAmount = Number(refund.amount);

    const result = await prisma.$transaction(async (tx) => {
      // 1. Mark refund PAID
      const updatedRefund = await tx.refund.update({
        where: { id },
        data: {
          status: 'PAID',
          paidAt: new Date(),
          refundTxRef: refundTxRef || null,
          refundMethod: refundMethod || refund.refundMethod || 'BANK_TRANSFER',
        },
      });

      // 2. Adjust invoice amountPaid if linked
      if (refund.invoiceId && refund.invoice) {
        const currentPaid = Number(refund.invoice.amountPaid || 0);
        const newPaid = Math.max(0, Math.round((currentPaid - refundAmount) * 100) / 100);
        const newStatus = newPaid <= 0 ? 'DRAFT' : 'PARTIAL';
        await tx.invoice.update({
          where: { id: refund.invoiceId },
          data: {
            amountPaid: newPaid,
            status: newStatus,
            updatedBy: userId,
          },
        });
      }

      // 3. Post debit entry into AccountLedger
      const branchId = refund.branchId || refund.student?.branchId || null;
      const lastLedger = await tx.accountLedger.findFirst({
        where: branchId ? { branchId } : {},
        orderBy: { createdAt: 'desc' },
      });
      const previousBalance = Number(lastLedger?.balanceAfter || 0);
      const newBalance = Math.round((previousBalance - refundAmount) * 100) / 100;

      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const ledgerCount = await tx.accountLedger.count();
      const entryNo = `LED-${dateStr}-${String(ledgerCount + 1).padStart(5, '0')}`;

      await tx.accountLedger.create({
        data: {
          entryNo,
          branchId,
          entryType: 'REFUND',
          amount: refundAmount,
          isCredit: false,
          balanceAfter: newBalance,
          description: `Disbursed refund ${refund.refundNo} for student ${refund.student?.firstName} ${refund.student?.lastName}`,
          referenceType: 'REFUND',
          referenceId: refund.id,
          refundId: refund.id,
          invoiceId: refund.invoiceId,
          createdById: userId,
        },
      });

      return updatedRefund;
    });

    if (req) {
      await auditLog({
        userId,
        action: 'REFUND_DISBURSED',
        entityType: 'Refund',
        entityId: id,
        newData: result,
        req,
      });
    }

    return result;
  },
};

