import { createApi } from '@reduxjs/toolkit/query/react';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../../../api/apiClient';
import { API } from '../../../config/api';
import apiClient from '../../../api/axios';
import { enquiryService } from '../services/enquiryService';

const axiosBaseQuery = () => async ({ url, method = 'GET', body, params }) => {
  try {
    const handlers = {
      GET: () => apiGet(url, params),
      POST: () => apiPost(url, body),
      PUT: () => apiPut(url, body),
      PATCH: () => apiPatch(url, body),
      DELETE: () => apiDelete(url),
    };
    const data = await (handlers[method] || handlers.GET)();
    return { data };
  } catch (error) {
    return {
      error: {
        status: error.response?.status,
        data: error.response?.data,
      },
    };
  }
};

export const enquiryApi = createApi({
  reducerPath: 'enquiryApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['EnquiryList', 'EnquirySummary', 'EnquiryDetail', 'ImportHistory'],
  endpoints: (builder) => ({
    getEnquiries: builder.query({
      query: (params) => ({ url: API.ENQUIRIES, params }),
      providesTags: ['EnquiryList'],
      transformResponse: (res) => ({ data: res.data, pagination: res.pagination }),
    }),
    getEnquirySummary: builder.query({
      query: (params) => ({ url: API.ENQUIRY_SUMMARY, params }),
      providesTags: ['EnquirySummary'],
      transformResponse: (res) => res.data,
    }),
    getEnquiry: builder.query({
      query: (id) => ({ url: API.ENQUIRY_BY_ID(id) }),
      providesTags: (_r, _e, id) => [{ type: 'EnquiryDetail', id }],
      transformResponse: (res) => res.data,
    }),
    checkDuplicates: builder.query({
      query: (params) => ({ url: API.ENQUIRY_CHECK_DUPLICATES, params }),
      transformResponse: (res) => res.data,
    }),
    createEnquiry: builder.mutation({
      query: (body) => ({ url: API.ENQUIRIES, method: 'POST', body }),
      invalidatesTags: ['EnquiryList', 'EnquirySummary'],
    }),
    updateEnquiry: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.ENQUIRY_BY_ID(id), method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['EnquiryList', 'EnquirySummary', { type: 'EnquiryDetail', id }],
    }),
    patchEnquiryStatus: builder.mutation({
      query: ({ id, status }) => ({ url: API.ENQUIRY_STATUS(id), method: 'PATCH', body: { status } }),
      invalidatesTags: ['EnquiryList', 'EnquirySummary'],
      async onQueryStarted({ id, status }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          enquiryApi.util.updateQueryData('getEnquiries', undefined, (draft) => {
            const row = draft?.data?.find((e) => e.id === id);
            if (row) row.status = status;
          })
        );
        try { await queryFulfilled; } catch { patch.undo(); }
      },
    }),
    patchEnquiryPriority: builder.mutation({
      query: ({ id, priority }) => ({ url: API.ENQUIRY_PRIORITY(id), method: 'PATCH', body: { priority } }),
      invalidatesTags: ['EnquiryList'],
      async onQueryStarted({ id, priority }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          enquiryApi.util.updateQueryData('getEnquiries', undefined, (draft) => {
            const row = draft?.data?.find((e) => e.id === id);
            if (row) row.priority = priority;
          })
        );
        try { await queryFulfilled; } catch { patch.undo(); }
      },
    }),
    patchEnquiryTags: builder.mutation({
      query: ({ id, tags }) => ({ url: API.ENQUIRY_TAGS(id), method: 'PATCH', body: { tags } }),
      invalidatesTags: ['EnquiryList'],
      async onQueryStarted({ id, tags }, { dispatch, queryFulfilled }) {
        const patch = dispatch(
          enquiryApi.util.updateQueryData('getEnquiries', undefined, (draft) => {
            const row = draft?.data?.find((e) => e.id === id);
            if (row) row.tags = tags;
          })
        );
        try { await queryFulfilled; } catch { patch.undo(); }
      },
    }),
    deleteEnquiry: builder.mutation({
      query: (id) => ({ url: API.ENQUIRY_BY_ID(id), method: 'DELETE' }),
      invalidatesTags: ['EnquiryList', 'EnquirySummary'],
    }),
    bulkDeleteEnquiries: builder.mutation({
      query: (ids) => ({ url: API.ENQUIRIES_BULK_DELETE, method: 'POST', body: { ids } }),
      invalidatesTags: ['EnquiryList', 'EnquirySummary'],
    }),
    bulkAssignEnquiries: builder.mutation({
      query: (body) => ({ url: API.ENQUIRIES_BULK_ASSIGN, method: 'POST', body }),
      invalidatesTags: ['EnquiryList'],
    }),
    bulkUpdateStatus: builder.mutation({
      query: (body) => ({ url: API.ENQUIRIES_BULK_STATUS, method: 'POST', body }),
      invalidatesTags: ['EnquiryList', 'EnquirySummary'],
    }),
    bulkAddTags: builder.mutation({
      query: (body) => ({ url: API.ENQUIRIES_BULK_TAGS, method: 'POST', body }),
      invalidatesTags: ['EnquiryList'],
    }),
    bulkMoveBranch: builder.mutation({
      query: (body) => ({ url: API.ENQUIRIES_BULK_MOVE_BRANCH, method: 'POST', body }),
      invalidatesTags: ['EnquiryList'],
    }),
    bulkMergeEnquiries: builder.mutation({
      query: (body) => ({ url: API.ENQUIRIES_BULK_MERGE, method: 'POST', body }),
      invalidatesTags: ['EnquiryList', 'EnquirySummary'],
    }),
    getEnquiryBranches: builder.query({
      query: () => ({ url: API.ENQUIRIES_BRANCHES }),
      transformResponse: (res) => res.data,
    }),
    dropEnquiry: builder.mutation({
      query: ({ id, dropReason }) => ({ url: API.ENQUIRY_DROP(id), method: 'POST', body: { dropReason } }),
      invalidatesTags: ['EnquiryList', 'EnquirySummary'],
    }),
    convertEnquiry: builder.mutation({
      query: (id) => ({ url: API.ENQUIRY_CONVERT(id), method: 'POST' }),
      invalidatesTags: (_r, _e, id) => [
        { type: 'EnquiryDetail', id },
        'EnquiryList',
        'EnquirySummary',
      ],
    }),
    addFollowup: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.ENQUIRY_FOLLOWUPS(id), method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'EnquiryDetail', id }],
    }),
    addAppointment: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.ENQUIRY_APPOINTMENTS(id), method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'EnquiryDetail', id }],
    }),
    addDemo: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.ENQUIRY_DEMOS(id), method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'EnquiryDetail', id }, 'EnquiryList', 'EnquirySummary'],
    }),
    addNote: builder.mutation({
      queryFn: async ({ id, attachments = [], ...payload }) => {
        try {
          const data = await enquiryService.addNote(id, payload, attachments);
          return { data };
        } catch (error) {
          return {
            error: { status: error.response?.status, data: error.response?.data },
          };
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'EnquiryDetail', id }],
    }),
    pinNote: builder.mutation({
      query: ({ id, noteId, isPinned }) => ({
        url: API.ENQUIRY_NOTE_PIN(id, noteId),
        method: 'PATCH',
        body: { isPinned },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'EnquiryDetail', id }],
    }),
    updateNoteChecklist: builder.mutation({
      query: ({ id, noteId, checklist }) => ({
        url: API.ENQUIRY_NOTE_CHECKLIST(id, noteId),
        method: 'PATCH',
        body: { checklist },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'EnquiryDetail', id }],
    }),
    addCommunication: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.ENQUIRY_COMMUNICATIONS(id), method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'EnquiryDetail', id }],
    }),
    addVoiceNote: builder.mutation({
      queryFn: async ({ id, file, body, durationSec, direction }) => {
        try {
          const form = new FormData();
          form.append('file', file);
          if (body) form.append('body', body);
          if (durationSec != null) form.append('durationSec', String(durationSec));
          if (direction) form.append('direction', direction);
          const { data } = await apiClient.post(API.ENQUIRY_VOICE_NOTE(id), form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return { data: data.data };
        } catch (error) {
          return {
            error: { status: error.response?.status, data: error.response?.data },
          };
        }
      },
      invalidatesTags: (_r, _e, { id }) => [{ type: 'EnquiryDetail', id }],
    }),
    getTimeline: builder.query({
      query: (id) => ({ url: API.ENQUIRY_TIMELINE(id) }),
      transformResponse: (res) => res.data,
    }),
    getImportHistory: builder.query({
      query: () => ({ url: API.ENQUIRIES_IMPORT_HISTORY }),
      providesTags: ['ImportHistory'],
      transformResponse: (res) => res.data,
    }),
    exportEnquiries: builder.mutation({
      query: (body) => ({ url: API.ENQUIRIES_EXPORT, method: 'POST', body }),
      transformResponse: (res) => res.data,
    }),
    bulkCommunication: builder.mutation({
      query: (body) => ({ url: API.ENQUIRIES_BULK_COMM, method: 'POST', body }),
    }),
    parseImportFile: builder.mutation({
      queryFn: async (file) => {
        try {
          const form = new FormData();
          form.append('file', file);
          const { data } = await apiClient.post(API.ENQUIRIES_IMPORT, form, {
            headers: { 'Content-Type': 'multipart/form-data' },
          });
          return { data: data.data };
        } catch (error) {
          return { error: { status: error.response?.status, data: error.response?.data } };
        }
      },
    }),
    confirmImport: builder.mutation({
      query: (body) => ({ url: API.ENQUIRIES_IMPORT_CONFIRM, method: 'POST', body }),
      invalidatesTags: ['EnquiryList', 'EnquirySummary', 'ImportHistory'],
    }),
  }),
});

export const {
  useGetEnquiriesQuery, useGetEnquirySummaryQuery, useGetEnquiryQuery, useLazyCheckDuplicatesQuery,
  useCreateEnquiryMutation, useUpdateEnquiryMutation, usePatchEnquiryStatusMutation, usePatchEnquiryPriorityMutation, usePatchEnquiryTagsMutation,
  useDeleteEnquiryMutation, useBulkDeleteEnquiriesMutation, useBulkAssignEnquiriesMutation,
  useBulkUpdateStatusMutation, useBulkAddTagsMutation, useBulkMoveBranchMutation, useBulkMergeEnquiriesMutation,
  useGetEnquiryBranchesQuery,
  useDropEnquiryMutation, useConvertEnquiryMutation, useAddFollowupMutation, useAddAppointmentMutation, useAddDemoMutation,
  useAddNoteMutation, usePinNoteMutation, useUpdateNoteChecklistMutation, useAddCommunicationMutation, useAddVoiceNoteMutation,
  useGetTimelineQuery, useGetImportHistoryQuery, useExportEnquiriesMutation,
  useBulkCommunicationMutation, useParseImportFileMutation, useConfirmImportMutation,
} = enquiryApi;
