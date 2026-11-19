import prisma from '../../config/database.js';
import { AppError } from '../../utils/response.util.js';
import { auditLog } from '../../middleware/audit.middleware.js';

export const paymentService = {
  /**
   * Record a payment for an invoice atomically:
   * 1. Validate invoice exists and not deleted
   * 2. Validate amount > 0
   * 3. Validate invoice.amountPaid + amount <= invoice.total (prevents overpayment)
   * 4. Insert AdmissionPayment record with unique receiptNo
   * 5. Insert AdmissionReceipt record with full snapshot
   * 6. Update invoice amountPaid and status (PAID if amountPaid >= total else PARTIAL)
   * 7. Update fee installment if linked
   * 8. Post credit entry to AccountLedger
   * All wrapped in prisma.$transaction
   */
  recordPayment: async ({
    invoiceId,
    amount,
    mode = 'CASH',
    referenceNo = null,
    installmentId = null,
    notes = null,
    idempotencyKey = null,
    userId,
    req,
  }) => {
    const paymentAmount = Number(amount);
    if (isNaN(paymentAmount) || paymentAmount <= 0) {
      throw new AppError('Payment amount must be greater than zero', 400);
    }

    if (idempotencyKey) {
      const existing = await prisma.admissionPayment.findUnique({
        where: { idempotencyKey },
        include: { receipts: true, invoice: true },
      });
      if (existing) return existing;
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, studentCode: true, branchId: true } },
      },
    });

    if (!invoice || invoice.deletedAt) {
      throw new AppError('Invoice not found', 404);
    }

    const currentPaid = Number(invoice.amountPaid || 0);
    const invoiceTotal = Number(invoice.total);
    const remainingBalance = Math.round((invoiceTotal - currentPaid) * 100) / 100;

    if (paymentAmount > remainingBalance) {
      throw new AppError(
        `Payment amount (${paymentAmount.toFixed(2)}) exceeds remaining invoice balance (${remainingBalance.toFixed(2)})`,
        400
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      // 1. Generate unique receipt number
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const countToday = await tx.admissionPayment.count();
      const receiptNo = `REC-${dateStr}-${String(countToday + 1).padStart(4, '0')}`;

      // 2. Insert payment
      const payment = await tx.admissionPayment.create({
        data: {
          invoiceId,
          studentId: invoice.studentId,
          installmentId: installmentId || null,
          amount: paymentAmount,
          mode: (mode || 'CASH').toUpperCase(),
          referenceNo: referenceNo || null,
          receiptNo,
          idempotencyKey: idempotencyKey || null,
          createdBy: userId,
          paidAt: new Date(),
        },
      });

      // 3. Insert detailed receipt
      const receiptDetails = JSON.stringify({
        receiptNo,
        paymentId: payment.id,
        invoiceNo: invoice.invoiceNo,
        studentName: invoice.student ? `${invoice.student.firstName} ${invoice.student.lastName}` : 'Walk-in Candidate',
        studentCode: invoice.student?.studentCode || 'N/A',
        studentEmail: invoice.student?.email || null,
        studentPhone: invoice.student?.phone || null,
        course: invoice.student?.course || null,
        country: invoice.student?.country || null,
        branchName: invoice.student?.branch?.name || null,
        branchCity: invoice.student?.branch?.city || null,
        subtotal: invoice.amount,
        tax: invoice.tax,
        total: invoice.total,
        taxName: invoice.metadata?.taxName || null,
        taxPercentage: invoice.metadata?.taxPercentage || null,
        amount: paymentAmount,
        currency: invoice.currency || 'USD',
        mode: (mode || 'CASH').toUpperCase(),
        referenceNo: referenceNo || null,
        paidAt: payment.paidAt,
        notes: notes || null,
      });

      const receipt = await tx.admissionReceipt.create({
        data: {
          paymentId: payment.id,
          receiptNo,
          amount: paymentAmount,
          details: receiptDetails,
        },
      });

      // 4. Update invoice amountPaid and status
      const newPaid = Math.round((currentPaid + paymentAmount) * 100) / 100;
      const newStatus = newPaid >= invoiceTotal ? 'PAID' : 'PARTIAL';

      const updatedInvoice = await tx.invoice.update({
        where: { id: invoiceId },
        data: {
          amountPaid: newPaid,
          status: newStatus,
          updatedBy: userId,
        },
      });

      // 5. If installment linked, update installment
      if (installmentId) {
        const inst = await tx.feeInstallment.findUnique({ where: { id: installmentId } });
        if (inst) {
          const instPaid = Math.round((Number(inst.amountPaid || 0) + paymentAmount) * 100) / 100;
          const instStatus = instPaid >= Number(inst.amount) ? 'PAID' : 'PARTIAL';
          await tx.feeInstallment.update({
            where: { id: installmentId },
            data: {
              amountPaid: instPaid,
              status: instStatus,
              paidAt: instStatus === 'PAID' ? new Date() : undefined,
            },
          });
        }
      }

      // 6. Post credit entry in AccountLedger
      const branchId = invoice.student?.branchId || null;
      const lastLedger = await tx.accountLedger.findFirst({
        where: branchId ? { branchId } : {},
        orderBy: { createdAt: 'desc' },
      });
      const previousBalance = Number(lastLedger?.balanceAfter || 0);
      const newBalance = Math.round((previousBalance + paymentAmount) * 100) / 100;

      const ledgerCount = await tx.accountLedger.count();
      const entryNo = `LED-${dateStr}-${String(ledgerCount + 1).padStart(5, '0')}`;

      await tx.accountLedger.create({
        data: {
          entryNo,
          branchId,
          entryType: 'PAYMENT',
          amount: paymentAmount,
          isCredit: true,
          balanceAfter: newBalance,
          description: `Fee Payment for Invoice ${invoice.invoiceNo} (${receiptNo})`,
          referenceType: 'PAYMENT',
          referenceId: payment.id,
          invoiceId,
          paymentId: payment.id,
          createdById: userId,
        },
      });

      return { payment, receipt, invoice: updatedInvoice };
    });

    if (req) {
      await auditLog({
        userId,
        action: 'CREATE',
        entityType: 'AdmissionPayment',
        entityId: result.payment.id,
        newData: { receiptNo: result.payment.receiptNo, amount: paymentAmount, invoiceId },
        req,
      });
    }

    return result;
  },

  /**
   * Get payments and receipts for an invoice
   */
  getInvoicePayments: async (invoiceId) => {
    return prisma.admissionPayment.findMany({
      where: { invoiceId },
      include: {
        receipts: true,
        installment: { select: { id: true, title: true, dueDate: true } },
      },
      orderBy: { paidAt: 'desc' },
    });
  },

  /**
   * Get printable receipt by receipt number
   */
  getReceiptByNo: async (receiptNo) => {
    const receipt = await prisma.admissionReceipt.findUnique({
      where: { receiptNo },
      include: {
        payment: {
          include: {
            invoice: {
              include: {
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    studentCode: true,
                    email: true,
                    phone: true,
                    course: true,
                    country: true,
                    branch: { select: { id: true, name: true, code: true, city: true, address: true, email: true, phone: true } },
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!receipt) {
      throw new AppError('Receipt not found', 404);
    }

    let parsedDetails = {};
    try {
      parsedDetails = JSON.parse(receipt.details);
    } catch {
      parsedDetails = {};
    }

    return {
      ...receipt,
      parsedDetails,
    };
  },
};

