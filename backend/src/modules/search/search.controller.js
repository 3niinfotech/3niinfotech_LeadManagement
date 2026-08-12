import { asyncHandler, sendSuccess } from '../../utils/response.util.js';
import { searchService } from './search.service.js';

const EMPTY = {
  enquiries: [],
  students: [],
  leads: [],
  visas: [],
  applications: [],
  invoices: [],
  partners: [],
  users: [],
  total: 0,
};

export const globalSearch = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || q.trim().length < 2) {
    return sendSuccess(res, EMPTY);
  }
  const results = await searchService.globalSearch(q.trim(), req.user);
  sendSuccess(res, results);
});

export const searchSuggestions = asyncHandler(async (req, res) => {
  const { q } = req.query;
  if (!q || !q.trim()) {
    return sendSuccess(res, { enquiries: [], students: [], leads: [] });
  }
  const results = await searchService.getSuggestions(q.trim(), req.user);
  sendSuccess(res, results);
});
