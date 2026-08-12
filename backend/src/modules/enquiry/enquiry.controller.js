import { asyncHandler, sendSuccess, sendPaginated, parsePagination } from '../../utils/response.util.js';
import { enquiryService } from './enquiry.service.js';
import { enquiryConversionService } from './enquiryConversion.service.js';
import { enquiryImportService } from './enquiry.import.service.js';
import {
  createEnquirySchema, updateEnquirySchema, statusSchema, prioritySchema, tagsSchema, bulkIdsSchema,
  bulkAssignSchema, dropSchema, followupSchema, appointmentSchema, demoSchema,
  noteSchema, communicationSchema, bulkCommunicationSchema,
  notePinSchema, noteChecklistSchema, duplicateCheckSchema,
  bulkStatusSchema, bulkTagsSchema, bulkMoveBranchSchema, bulkMergeSchema,
} from './enquiry.validators.js';

export const getEnquiries = asyncHandler(async (req, res) => {
  const { page, limit } = parsePagination(req.query);
  const result = await enquiryService.getAll({ ...req.query, page, limit }, req.user);
  sendPaginated(res, result.data, result.pagination);
});

export const getSummary = asyncHandler(async (req, res) => {
  const data = await enquiryService.getSummary(req.query, req.user);
  sendSuccess(res, data);
});

export const getEnquiry = asyncHandler(async (req, res) => {
  const data = await enquiryService.getById(req.params.id, req.user);
  sendSuccess(res, data);
});

export const checkDuplicates = asyncHandler(async (req, res) => {
  const params = duplicateCheckSchema.parse(req.query);
  const data = await enquiryService.checkDuplicates(params, req.user);
  sendSuccess(res, data);
});

export const createEnquiry = asyncHandler(async (req, res) => {
  const data = createEnquirySchema.parse(req.body);
  const enquiry = await enquiryService.create(data, req.user.id, req);
  sendSuccess(res, enquiry, 'Enquiry created', 201);
});

export const updateEnquiry = asyncHandler(async (req, res) => {
  const data = updateEnquirySchema.parse(req.body);
  const enquiry = await enquiryService.update(req.params.id, data, req.user.id, req);
  sendSuccess(res, enquiry, 'Enquiry updated');
});

export const patchStatus = asyncHandler(async (req, res) => {
  const { status } = statusSchema.parse(req.body);
  const enquiry = await enquiryService.updateStatus(req.params.id, status, req.user.id, req);
  sendSuccess(res, enquiry, 'Status updated');
});

export const patchPriority = asyncHandler(async (req, res) => {
  const { priority } = prioritySchema.parse(req.body);
  const enquiry = await enquiryService.updatePriority(req.params.id, priority, req.user.id, req);
  sendSuccess(res, enquiry, 'Priority updated');
});

export const patchTags = asyncHandler(async (req, res) => {
  const { tags } = tagsSchema.parse(req.body);
  const enquiry = await enquiryService.updateTags(req.params.id, tags, req.user.id, req);
  sendSuccess(res, enquiry, 'Tags updated');
});

export const deleteEnquiry = asyncHandler(async (req, res) => {
  await enquiryService.remove(req.params.id, req.user.id, req);
  sendSuccess(res, null, 'Enquiry deleted');
});

export const bulkDelete = asyncHandler(async (req, res) => {
  const { ids } = bulkIdsSchema.parse(req.body);
  const result = await enquiryService.bulkDelete(ids, req.user.id, req);
  sendSuccess(res, result, 'Bulk delete completed');
});

export const bulkAssign = asyncHandler(async (req, res) => {
  const { ids, assignedToId } = bulkAssignSchema.parse(req.body);
  const result = await enquiryService.bulkAssign(ids, assignedToId, req.user.id, req);
  sendSuccess(res, result, 'Bulk assign completed');
});

export const bulkUpdateStatus = asyncHandler(async (req, res) => {
  const { ids, status } = bulkStatusSchema.parse(req.body);
  const result = await enquiryService.bulkUpdateStatus(ids, status, req.user.id, req);
  sendSuccess(res, result, 'Status updated for selected enquiries');
});

export const bulkAddTags = asyncHandler(async (req, res) => {
  const { ids, tags, mode } = bulkTagsSchema.parse(req.body);
  const result = await enquiryService.bulkAddTags(ids, tags, mode, req.user.id, req);
  sendSuccess(res, result, 'Tags updated for selected enquiries');
});

export const bulkMoveBranch = asyncHandler(async (req, res) => {
  const { ids, branchId } = bulkMoveBranchSchema.parse(req.body);
  const result = await enquiryService.bulkMoveBranch(ids, branchId, req.user.id, req);
  sendSuccess(res, result, 'Branch updated for selected enquiries');
});

export const bulkMerge = asyncHandler(async (req, res) => {
  const { primaryId, ids } = bulkMergeSchema.parse(req.body);
  const result = await enquiryService.mergeEnquiries(primaryId, ids, req.user.id, req);
  sendSuccess(res, result, 'Enquiries merged');
});

export const getBranches = asyncHandler(async (req, res) => {
  const data = await enquiryService.getBranches(req.user);
  sendSuccess(res, data);
});

export const dropEnquiry = asyncHandler(async (req, res) => {
  const { dropReason } = dropSchema.parse(req.body);
  const enquiry = await enquiryService.drop(req.params.id, dropReason, req.user.id, req);
  sendSuccess(res, enquiry, 'Enquiry dropped');
});

export const addFollowup = asyncHandler(async (req, res) => {
  const data = followupSchema.parse(req.body);
  const followup = await enquiryService.addFollowup(req.params.id, data, req.user.id, req);
  sendSuccess(res, followup, 'Follow-up added', 201);
});

export const addAppointment = asyncHandler(async (req, res) => {
  const data = appointmentSchema.parse(req.body);
  const appointment = await enquiryService.addAppointment(req.params.id, data, req.user.id, req);
  sendSuccess(res, appointment, 'Appointment added', 201);
});

export const addDemo = asyncHandler(async (req, res) => {
  const data = demoSchema.parse(req.body);
  const demo = await enquiryService.addDemo(req.params.id, data, req.user.id, req);
  sendSuccess(res, demo, 'Demo recorded', 201);
});

export const addNote = asyncHandler(async (req, res) => {
  const payload = req.body.payload
    ? noteSchema.parse(JSON.parse(req.body.payload))
    : noteSchema.parse(req.body);
  const note = await enquiryService.addNote(req.params.id, payload, req.user.id, req.files || []);
  sendSuccess(res, note, 'Note added', 201);
});

export const pinNote = asyncHandler(async (req, res) => {
  const { isPinned } = notePinSchema.parse(req.body);
  const note = await enquiryService.pinNote(req.params.id, req.params.noteId, isPinned, req.user.id);
  sendSuccess(res, note, isPinned ? 'Note pinned' : 'Note unpinned');
});

export const updateNoteChecklist = asyncHandler(async (req, res) => {
  const { checklist } = noteChecklistSchema.parse(req.body);
  const note = await enquiryService.updateNoteChecklist(
    req.params.id, req.params.noteId, checklist, req.user.id,
  );
  sendSuccess(res, note, 'Checklist updated');
});

export const addCommunication = asyncHandler(async (req, res) => {
  const data = communicationSchema.parse(req.body);
  const comm = await enquiryService.addCommunication(req.params.id, data, req.user.id, req);
  sendSuccess(res, comm, 'Communication logged', 201);
});

export const addVoiceNote = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'Voice note file required' });
  const comm = await enquiryService.addVoiceNote(req.params.id, req.file, req.body, req.user.id);
  sendSuccess(res, comm, 'Voice note saved', 201);
});

export const getTimeline = asyncHandler(async (req, res) => {
  const data = await enquiryService.getTimeline(req.params.id);
  sendSuccess(res, data);
});

export const getDocuments = asyncHandler(async (req, res) => {
  const data = await enquiryService.getDocuments(req.params.id);
  sendSuccess(res, data);
});

export const uploadDocument = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File required' });
  const doc = await enquiryService.addDocument(
    req.params.id, req.file, req.user.id, req.body.category
  );
  sendSuccess(res, doc, 'Document uploaded', 201);
});

export const deleteDocument = asyncHandler(async (req, res) => {
  await enquiryService.removeDocument(req.params.docId, req.user.id, req.params.id);
  sendSuccess(res, null, 'Document deleted');
});

export const parseImport = asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ success: false, message: 'File required' });
  const rows = await enquiryImportService.parseFile(req.file.buffer, req.file.originalname);
  sendSuccess(res, rows);
});

export const confirmImport = asyncHandler(async (req, res) => {
  const { rows, fileName } = req.body;
  const branchId = req.body.branchId || req.user.branchId;
  const result = await enquiryImportService.confirmImport(rows, req.user.id, branchId, fileName, req);
  sendSuccess(res, result, 'Import completed');
});

export const importHistory = asyncHandler(async (req, res) => {
  const data = await enquiryImportService.getImportHistory(req.user.id);
  sendSuccess(res, data);
});

export const importDuplicates = asyncHandler(async (req, res) => {
  const data = await enquiryImportService.getDuplicates(req.params.batchId);
  sendSuccess(res, data);
});

export const exportEnquiries = asyncHandler(async (req, res) => {
  const data = await enquiryService.exportEnquiries(req.body, req.user, req.user.id, req);
  sendSuccess(res, data, 'Export ready');
});

export const bulkCommunication = asyncHandler(async (req, res) => {
  const payload = bulkCommunicationSchema.parse(req.body);
  const data = await enquiryService.bulkCommunication(payload.ids, payload, req.user.id);
  sendSuccess(res, data, 'Communication queued');
});

export const downloadSample = asyncHandler(async (req, res) => {
  const csv = enquiryImportService.getSampleCsv();
  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=enquiry-import-sample.csv');
  res.send(csv);
});

export const convertToStudent = asyncHandler(async (req, res) => {
  const data = await enquiryConversionService.convertToStudent(req.params.id, req.user.id, req);
  const message = data.linkedExisting
    ? 'Linked to existing student — same record'
    : 'Converted to student — same record';
  sendSuccess(res, data, message);
});
