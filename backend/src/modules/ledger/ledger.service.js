import prisma from '../../config/database.js';

export const ledgerService = {
  getAll: async (query) => {
    const { branchId, entryType, from, to, page = 1, limit = 50 } = query || {};
    const where = {};

    if (branchId) where.branchId = branchId;
    if (entryType && entryType !== 'ALL') where.entryType = entryType;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const take = Math.min(Math.max(Number(limit) || 50, 1), 500);
    const skip = (Math.max(Number(page) || 1, 1) - 1) * take;

    const [entries, total] = await Promise.all([
      prisma.accountLedger.findMany({
        where,
        take,
        skip,
        orderBy: { createdAt: 'desc' },
        include: {
          branch: { select: { id: true, name: true, code: true } },
          createdBy: { select: { id: true, firstName: true, lastName: true, email: true } },
          payment: { select: { id: true, receiptNo: true, mode: true } },
          refund: { select: { id: true, refundNo: true } },
          expense: { select: { id: true, expenseNo: true, title: true } },
        },
      }),
      prisma.accountLedger.count({ where }),
    ]);

    return {
      data: entries,
      pagination: {
        page: Math.max(Number(page) || 1, 1),
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    };
  },

  getSummary: async (query) => {
    const { branchId, from, to } = query || {};
    const where = {};
    if (branchId) where.branchId = branchId;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const [credits, debits] = await Promise.all([
      prisma.accountLedger.aggregate({
        where: { ...where, isCredit: true },
        _sum: { amount: true },
      }),
      prisma.accountLedger.aggregate({
        where: { ...where, isCredit: false },
        _sum: { amount: true },
      }),
    ]);

    const totalCredits = Number(credits._sum.amount || 0);
    const totalDebits = Number(debits._sum.amount || 0);
    const netBalance = Math.round((totalCredits - totalDebits) * 100) / 100;

    return {
      totalCredits,
      totalDebits,
      netBalance,
    };
  },

  exportCSV: async (query) => {
    const { branchId, entryType, from, to } = query || {};
    const where = {};
    if (branchId) where.branchId = branchId;
    if (entryType && entryType !== 'ALL') where.entryType = entryType;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) {
        const toDate = new Date(to);
        toDate.setHours(23, 59, 59, 999);
        where.createdAt.lte = toDate;
      }
    }

    const entries = await prisma.accountLedger.findMany({
      where,
      orderBy: { createdAt: 'asc' },
      include: {
        branch: { select: { name: true } },
        createdBy: { select: { firstName: true, lastName: true } },
      },
    });

    const headers = ['Entry No', 'Date', 'Type', 'Debit', 'Credit', 'Balance After', 'Description', 'Branch', 'Logged By'];
    const rows = entries.map((e) => {
      const debit = !e.isCredit ? Number(e.amount).toFixed(2) : '0.00';
      const credit = e.isCredit ? Number(e.amount).toFixed(2) : '0.00';
      return [
        `"${e.entryNo}"`,
        `"${new Date(e.createdAt).toISOString().replace('T', ' ').slice(0, 19)}"`,
        `"${e.entryType}"`,
        `"${debit}"`,
        `"${credit}"`,
        `"${Number(e.balanceAfter).toFixed(2)}"`,
        `"${(e.description || '').replace(/"/g, '""')}"`,
        `"${e.branch?.name || 'General'}"`,
        `"${e.createdBy ? `${e.createdBy.firstName} ${e.createdBy.lastName}` : 'System'}"`,
      ].join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  },
};

