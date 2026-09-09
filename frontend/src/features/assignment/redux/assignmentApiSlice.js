import { createApi } from '@reduxjs/toolkit/query/react';
import { apiGet, apiPost, apiPatch, apiPut } from '../../../api/apiClient';
import { API } from '../../../config/api';

const axiosBaseQuery = () => async ({ url, method = 'GET', body, params }) => {
  try {
    const handlers = {
      GET: () => apiGet(url, params),
      POST: () => apiPost(url, body),
      PATCH: () => apiPatch(url, body),
      PUT: () => apiPut(url, body),
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

export const assignmentApi = createApi({
  reducerPath: 'assignmentApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['BranchOps', 'UnassignedEnquiries', 'AssignmentConfig', 'MyAvailability', 'Sla', 'CourseCounsellorMappings'],
  endpoints: (builder) => ({
    resolveIdentity: builder.query({
      query: (params) => ({ url: API.ASSIGNMENT_RESOLVE_IDENTITY, params }),
      transformResponse: (res) => res.data,
    }),
    getMyAvailability: builder.query({
      query: () => ({ url: API.ASSIGNMENT_MY_AVAILABILITY }),
      providesTags: ['MyAvailability'],
      transformResponse: (res) => res.data ?? res,
    }),
    updatePresence: builder.mutation({
      query: (body) => ({ url: API.ASSIGNMENT_PRESENCE, method: 'PATCH', body }),
      invalidatesTags: ['BranchOps'],
      transformResponse: (res) => res.data ?? res,
    }),
    heartbeat: builder.mutation({
      query: () => ({ url: API.ASSIGNMENT_HEARTBEAT, method: 'POST' }),
      invalidatesTags: ['MyAvailability', 'BranchOps'],
      transformResponse: (res) => res.data ?? res,
    }),
    acceptOffer: builder.mutation({
      query: (id) => ({ url: API.ASSIGNMENT_OFFER_ACCEPT(id), method: 'POST' }),
      invalidatesTags: ['BranchOps'],
    }),
    rejectOffer: builder.mutation({
      query: ({ id, reason }) => ({
        url: API.ASSIGNMENT_OFFER_REJECT(id),
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['BranchOps'],
    }),
    startSession: builder.mutation({
      query: (leadId) => ({ url: API.ASSIGNMENT_SESSION_START(leadId), method: 'POST' }),
      invalidatesTags: ['BranchOps'],
    }),
    completeSession: builder.mutation({
      query: ({ leadId, outcome }) => ({
        url: API.ASSIGNMENT_SESSION_COMPLETE(leadId),
        method: 'POST',
        body: { outcome },
      }),
      invalidatesTags: ['BranchOps'],
    }),
    reassignLead: builder.mutation({
      query: ({ leadId, counsellorId, reason }) => ({
        url: API.ASSIGNMENT_REASSIGN(leadId),
        method: 'POST',
        body: { counsellorId, reason },
      }),
      invalidatesTags: ['BranchOps', 'UnassignedEnquiries'],
    }),
    getAssignmentConfig: builder.query({
      query: () => ({ url: API.ASSIGNMENT_CONFIG }),
      providesTags: ['AssignmentConfig'],
      transformResponse: (res) => res.data ?? res,
    }),
    updateAssignmentConfig: builder.mutation({
      query: (body) => ({ url: API.ASSIGNMENT_CONFIG, method: 'PUT', body }),
      invalidatesTags: ['AssignmentConfig'],
      transformResponse: (res) => res.data ?? res,
    }),
    getUnassignedEnquiries: builder.query({
      query: (params) => ({ url: API.ASSIGNMENT_UNASSIGNED, params }),
      providesTags: ['UnassignedEnquiries'],
      transformResponse: (res) => res.data ?? res,
    }),
    recommendForEnquiry: builder.query({
      query: (enquiryId) => ({ url: API.ASSIGNMENT_ENQUIRY_RECOMMEND(enquiryId) }),
      transformResponse: (res) => res.data ?? res,
    }),
    autoAssignEnquiry: builder.mutation({
      query: (enquiryId) => ({ url: API.ASSIGNMENT_ENQUIRY_AUTO_ASSIGN(enquiryId), method: 'POST' }),
      invalidatesTags: ['UnassignedEnquiries', 'BranchOps'],
      transformResponse: (res) => res.data ?? res,
    }),
    bulkAutoAssignEnquiries: builder.mutation({
      query: (ids) => ({ url: API.ASSIGNMENT_ENQUIRY_BULK_AUTO, method: 'POST', body: { ids } }),
      invalidatesTags: ['UnassignedEnquiries', 'BranchOps'],
      transformResponse: (res) => res.data ?? res,
    }),
    manualAssignEnquiry: builder.mutation({
      query: ({ enquiryId, counsellorId, reason }) => ({
        url: API.ASSIGNMENT_ENQUIRY_MANUAL_ASSIGN(enquiryId),
        method: 'POST',
        body: { counsellorId, reason },
      }),
      invalidatesTags: ['UnassignedEnquiries', 'BranchOps'],
      transformResponse: (res) => res.data ?? res,
    }),
    getEnquiryAssignmentHistory: builder.query({
      query: (enquiryId) => ({ url: API.ASSIGNMENT_ENQUIRY_HISTORY(enquiryId) }),
      transformResponse: (res) => res.data ?? res,
    }),
    setTemporaryOverride: builder.mutation({
      query: (body) => ({ url: API.ASSIGNMENT_TEMPORARY_OVERRIDE, method: 'POST', body }),
      invalidatesTags: ['BranchOps'],
      transformResponse: (res) => res.data ?? res,
    }),
    getMySla: builder.query({
      query: (params) => ({ url: API.ASSIGNMENT_SLA_MY, params }),
      providesTags: ['Sla'],
      transformResponse: (res) => res.data ?? res,
    }),
    getSlaOverview: builder.query({
      query: (params) => ({ url: API.ASSIGNMENT_SLA_OVERVIEW, params }),
      providesTags: ['Sla'],
      transformResponse: (res) => res.data ?? res,
    }),
    getCourseCounsellorMappings: builder.query({
      query: (params) => ({ url: API.ASSIGNMENT_COURSE_COUNSELLOR_MAPPINGS, params }),
      providesTags: ['CourseCounsellorMappings'],
      transformResponse: (res) => res.data ?? res,
    }),
    createCourseCounsellorMapping: builder.mutation({
      query: (body) => ({ url: API.ASSIGNMENT_COURSE_COUNSELLOR_MAPPINGS, method: 'POST', body }),
      invalidatesTags: ['CourseCounsellorMappings'],
      transformResponse: (res) => res.data ?? res,
    }),
    updateCourseCounsellorMapping: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API.ASSIGNMENT_COURSE_COUNSELLOR_MAPPING(id),
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['CourseCounsellorMappings'],
      transformResponse: (res) => res.data ?? res,
    }),
    deleteCourseCounsellorMapping: builder.mutation({
      query: (id) => ({
        url: API.ASSIGNMENT_COURSE_COUNSELLOR_MAPPING(id),
        method: 'DELETE',
      }),
      invalidatesTags: ['CourseCounsellorMappings'],
    }),
    resolveCourseCounsellor: builder.query({
      query: (params) => ({ url: API.ASSIGNMENT_COURSE_COUNSELLOR_RESOLVE, params }),
      transformResponse: (res) => res.data ?? res,
    }),
  }),
});

export const {
  useLazyResolveIdentityQuery,
  useGetMyAvailabilityQuery,
  useUpdatePresenceMutation,
  useHeartbeatMutation,
  useAcceptOfferMutation,
  useRejectOfferMutation,
  useStartSessionMutation,
  useCompleteSessionMutation,
  useReassignLeadMutation,
  useGetAssignmentConfigQuery,
  useUpdateAssignmentConfigMutation,
  useGetUnassignedEnquiriesQuery,
  useLazyRecommendForEnquiryQuery,
  useAutoAssignEnquiryMutation,
  useBulkAutoAssignEnquiriesMutation,
  useManualAssignEnquiryMutation,
  useGetEnquiryAssignmentHistoryQuery,
  useSetTemporaryOverrideMutation,
  useGetMySlaQuery,
  useGetSlaOverviewQuery,
  useGetCourseCounsellorMappingsQuery,
  useCreateCourseCounsellorMappingMutation,
  useUpdateCourseCounsellorMappingMutation,
  useDeleteCourseCounsellorMappingMutation,
  useLazyResolveCourseCounsellorQuery,
} = assignmentApi;
