import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate, authorize } from '../../middleware/auth.middleware.js';
import { PERMISSIONS } from '../../config/permissions.js';
import * as enquiryController from './enquiry.controller.js';
import { normalizeDocumentCategory } from './enquiryDocument.config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', '..', '..', 'uploads', 'enquiries');
const voiceNoteDir = path.join(uploadDir, 'voice-notes');
const noteAttachmentDir = path.join(uploadDir, 'note-attachments');
fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(voiceNoteDir, { recursive: true });
fs.mkdirSync(noteAttachmentDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const safe = String(file.originalname || 'file').replace(/\s+/g, '-').replace(/[^\w.\-()]+/g, '');
    cb(null, `${Date.now()}-${safe || 'file'}`);
  },
});

const fileUpload = multer({ storage });
const memoryUpload = multer({ storage: multer.memoryStorage() });
const voiceNoteStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, voiceNoteDir),
  filename: (_req, file, cb) => {
    const safe = String(file.originalname || 'audio').replace(/\s+/g, '-').replace(/[^\w.\-()]+/g, '');
    cb(null, `${Date.now()}-${safe || 'audio'}`);
  },
});
const voiceNoteUpload = multer({
  storage: voiceNoteStorage,
  limits: { fileSize: 15 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype?.startsWith('audio/')) cb(null, true);
    else cb(new Error('Only audio files are allowed'));
  },
});
const noteAttachmentStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, noteAttachmentDir),
  filename: (_req, file, cb) => {
    const safe = String(file.originalname || 'file').replace(/\s+/g, '-').replace(/[^\w.\-()]+/g, '');
    cb(null, `${Date.now()}-${safe || 'file'}`);
  },
});
const noteAttachmentUpload = multer({
  storage: noteAttachmentStorage,
  limits: { fileSize: 10 * 1024 * 1024 },
});

const    router = Router();
const view = authorize(PERMISSIONS.ENQUIRIES_VIEW);
const create = authorize(PERMISSIONS.ENQUIRIES_CREATE);
const update = authorize(PERMISSIONS.ENQUIRIES_UPDATE);
const remove = authorize(PERMISSIONS.ENQUIRIES_DELETE);
const exportPerm = authorize(PERMISSIONS.ENQUIRIES_EXPORT);

// Public contact / enquiry form
router.post('/public/contact', enquiryController.submitPublicEnquiry);

router.use(authenticate);

router.get('/summary', view, enquiryController.getSummary);
router.get('/import/history', view, enquiryController.importHistory);
router.get('/import/sample', view, enquiryController.downloadSample);
router.get('/import/:batchId/duplicates', view, enquiryController.importDuplicates);
router.post('/import', create, memoryUpload.single('file'), enquiryController.parseImport);
router.post('/import/confirm', create, enquiryController.confirmImport);
router.post('/export', exportPerm, enquiryController.exportEnquiries);
router.post('/bulk-delete', remove, enquiryController.bulkDelete);
router.post('/bulk-assign', update, enquiryController.bulkAssign);
router.post('/bulk-status', update, enquiryController.bulkUpdateStatus);
router.post('/bulk-tags', update, enquiryController.bulkAddTags);
router.post('/bulk-move-branch', update, enquiryController.bulkMoveBranch);
router.post('/bulk-merge', update, enquiryController.bulkMerge);
router.post('/bulk-communication', update, enquiryController.bulkCommunication);

router.get('/demos/summary', view, enquiryController.getDemoSummary);
router.post('/demos/export', exportPerm, enquiryController.exportDemos);
router.post('/demos/bulk-attendance', update, enquiryController.bulkMarkDemoAttendance);
router.post('/demos/bulk-cancel', update, enquiryController.bulkCancelDemos);
router.get('/demos', view, enquiryController.listDemos);
router.get('/branches', view, enquiryController.getBranches);
router.get('/check-duplicates', view, enquiryController.checkDuplicates);
router.get('/', view, enquiryController.getEnquiries);
router.post('/', create, enquiryController.createEnquiry);
router.get('/:id', view, enquiryController.getEnquiry);
router.put('/:id', update, enquiryController.updateEnquiry);
router.patch('/:id/status', update, enquiryController.patchStatus);
router.patch('/:id/priority', update, enquiryController.patchPriority);
router.patch('/:id/tags', update, enquiryController.patchTags);
router.delete('/:id', remove, enquiryController.deleteEnquiry);
router.post('/:id/followups', update, enquiryController.addFollowup);
router.post('/:id/appointments', update, enquiryController.addAppointment);
router.post('/:id/demos', update, enquiryController.addDemo);
router.patch('/:id/demos/:demoId/attendance', update, enquiryController.markDemoAttendance);
router.post('/:id/demos/:demoId/reschedule', update, enquiryController.rescheduleDemo);
router.post('/:id/demos/:demoId/cancel', update, enquiryController.cancelDemo);
router.post('/:id/demos/:demoId/complete', update, enquiryController.completeDemo);
router.post('/:id/notes', update, noteAttachmentUpload.array('attachments', 5), enquiryController.addNote);
router.patch('/:id/notes/:noteId/pin', update, enquiryController.pinNote);
router.patch('/:id/notes/:noteId/checklist', update, enquiryController.updateNoteChecklist);
router.post('/:id/communications', update, enquiryController.addCommunication);
router.post('/:id/communications/voice', update, voiceNoteUpload.single('file'), enquiryController.addVoiceNote);
router.post('/:id/drop', update, enquiryController.dropEnquiry);
router.post('/:id/convert', update, enquiryController.convertToStudent);
router.get('/:id/convert/preview', view, enquiryController.conversionPreview);
router.get('/:id/timeline', view, enquiryController.getTimeline);
router.get('/:id/documents', view, enquiryController.getDocuments);
router.post('/:id/documents', update, fileUpload.single('file'), enquiryController.uploadDocument);
router.delete('/:id/documents/:docId', update, enquiryController.deleteDocument);

export default router;
