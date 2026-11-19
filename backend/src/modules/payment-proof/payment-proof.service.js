import prisma from '../../config/database.js';
import { AppError } from '../../utils/response.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import { paymentService } from '../invoice/payment.service.js';
import { notifyFinancialEvent } from '../notification/notification.dispatcher.js';

export const paymentProofService = {
  create: async (data, userId, req) => {
    const { studentId, invoiceId, installmentId, amount, paymentMode, transactionRef, proofDocumentUrl, notes } = data;
    if (!studentId) throw new AppError('Student ID is required', 400);
    if (!amount || Number(amount) <= 0) throw new AppError('Valid amount is required', 400);
    if (!transactionRef) throw new AppError('Transaction reference / UTR is required', 400);
    if (!proofDocumentUrl) throw new AppError('Proof document URL is required', 400);

    const proof = await prisma.paymentProof.create({
      data: {
        studentId,
        invoiceId: invoiceId || null,
        installmentId: installmentId || null,
        amount: Number(amount),
        paymentMode: (paymentMode || 'BANK_TRANSFER').toUpperCase(),
        transactionRef,
        proofDocumentUrl,
        notes: notes || null,
        status: 'PENDING',
      },
      include: {
        student: { select: { firstName: true, lastName: true, studentCode: true } },
        invoice: { select: { invoiceNo: true, total: true, amountPaid: true } },
      },
    });

    if (req) {
      await auditLog({
        userId,
        action: 'CREATE',
        entityType: 'PaymentProof',
        entityId: proof.id,
        newData: proof,
        req,
      });
    }

    try {
      await notifyFinancialEvent({
        eventType: 'PAYMENT_PROOF_SUBMITTED',
        proof,
        invoice: proof.invoice,
        student: proof.student,
        companyId: req?.user?.companyId,
        branchId: req?.user?.branchId,
      });
    } catch (err) {
      console.warn('[paymentProofService.create] notification warning:', err.message);
    }

    return proof;
  },

  getAll: async (query) => {
    const { status, studentId, invoiceId } = query || {};
    const where = {};
    if (status && status !== 'ALL') where.status = status;
    if (studentId) where.studentId = studentId;
    if (invoiceId) where.invoiceId = invoiceId;

    return prisma.paymentProof.findMany({
      where,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true, email: true, phone: true } },
        invoice: { select: { id: true, invoiceNo: true, total: true, amountPaid: true, currency: true } },
        installment: { select: { id: true, title: true, dueDate: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  },

  getById: async (id) => {
    const proof = await prisma.paymentProof.findUnique({
      where: { id },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true, email: true, phone: true } },
        invoice: { select: { id: true, invoiceNo: true, total: true, amountPaid: true, currency: true } },
        installment: { select: { id: true, title: true, dueDate: true } },
        reviewedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
      },
    });
    if (!proof) throw new AppError('Payment proof not found', 404);
    return proof;
  },

  review: async (id, { status, reviewNotes }, userId, req) => {
    if (!['APPROVED', 'REJECTED'].includes(status)) {
      throw new AppError('Status must be either APPROVED or REJECTED', 400);
    }

    const proof = await prisma.paymentProof.findUnique({
      where: { id },
      include: { invoice: true },
    });

    if (!proof) throw new AppError('Payment proof not found', 404);
    if (proof.status !== 'PENDING') {
      throw new AppError(`Payment proof has already been ${proof.status.toLowerCase()}`, 400);
    }

    if (status === 'REJECTED') {
      const updated = await prisma.paymentProof.update({
        where: { id },
        data: {
          status: 'REJECTED',
          reviewNotes: reviewNotes || 'Rejected by accountant',
          reviewedById: userId,
          reviewedAt: new Date(),
        },
      });

      if (req) {
        await auditLog({
          userId,
          action: 'PAYMENT_PROOF_REJECTED',
          entityType: 'PaymentProof',
          entityId: id,
          newData: updated,
          req,
        });
      }

      try {
        const stu = await prisma.student.findUnique({ where: { id: proof.studentId } });
        await notifyFinancialEvent({
          eventType: 'PAYMENT_PROOF_REJECTED',
          proof: updated,
          student: stu,
          rejectionReason: reviewNotes,
        });
      } catch {}

      return { proof: updated };
    }

    // Approved: Execute payment collection atomically
    if (!proof.invoiceId) {
      throw new AppError('Cannot approve payment proof without an associated invoice', 400);
    }

    const paymentResult = await paymentService.recordPayment({
      invoiceId: proof.invoiceId,
      amount: proof.amount,
      mode: proof.paymentMode,
      referenceNo: proof.transactionRef,
      installmentId: proof.installmentId,
      notes: `Offline proof approved: ${reviewNotes || 'Verified'}`,
      userId,
      req,
    });

    const updatedProof = await prisma.paymentProof.update({
      where: { id },
      data: {
        status: 'APPROVED',
        reviewNotes: reviewNotes || 'Approved and payment recorded',
        reviewedById: userId,
        reviewedAt: new Date(),
      },
    });

    if (req) {
      await auditLog({
        userId,
        action: 'PAYMENT_PROOF_APPROVED',
        entityType: 'PaymentProof',
        entityId: id,
        newData: updatedProof,
        req,
      });
    }

    return { proof: updatedProof, payment: paymentResult.payment, receipt: paymentResult.receipt };
  },
};

