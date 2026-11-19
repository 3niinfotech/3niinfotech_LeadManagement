import { asyncHandler, sendSuccess, sendPaginated } from '../../utils/response.util.js';
import { ledgerService } from './ledger.service.js';

export const getLedger = asyncHandler(async (req, res) => {
  const result = await ledgerService.getAll(req.query);
  sendPaginated(res, result.data, result.pagination);
});

export const getLedgerSummary = asyncHandler(async (req, res) => {
  const summary = await ledgerService.getSummary(req.query);
  sendSuccess(res, summary);
});

export const exportLedger = asyncHandler(async (req, res) => {
  const csv = await ledgerService.exportCSV(req.query);
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', `attachment; filename="Account_Ledger_${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(csv);
});

