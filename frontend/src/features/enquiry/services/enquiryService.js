import { API } from '../../../config/api';
import { apiGet } from '../../../api/apiClient';
import apiClient from '../../../api/axios';

export const enquiryService = {
  getSampleFormat: async () => {
    const { data } = await apiClient.get(API.ENQUIRIES_IMPORT_SAMPLE, { responseType: 'blob' });
    return data;
  },
  getImportDuplicates: (batchId) => apiGet(API.ENQUIRY_IMPORT_DUPLICATES(batchId)),
  uploadDocument: async (enquiryId, file, category) => {
    const form = new FormData();
    form.append('file', file);
    if (category) form.append('category', category);
    const { data } = await apiClient.post(API.ENQUIRY_DOCUMENTS(enquiryId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
  deleteDocument: (enquiryId, docId) => apiClient.delete(API.ENQUIRY_DOCUMENT(enquiryId, docId)),
  addNote: async (enquiryId, payload, attachments = []) => {
    const form = new FormData();
    form.append('payload', JSON.stringify(payload));
    attachments.forEach((file) => form.append('attachments', file));
    const { data } = await apiClient.post(API.ENQUIRY_NOTES(enquiryId), form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data.data;
  },
  pinNote: (enquiryId, noteId, isPinned) => apiClient.patch(
    API.ENQUIRY_NOTE_PIN(enquiryId, noteId),
    { isPinned },
  ),
  updateNoteChecklist: (enquiryId, noteId, checklist) => apiClient.patch(
    API.ENQUIRY_NOTE_CHECKLIST(enquiryId, noteId),
    { checklist },
  ),
};
