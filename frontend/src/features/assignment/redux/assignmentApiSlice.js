import { createApi } from '@reduxjs/toolkit/query/react';
import { apiGet, apiPost, apiPatch } from '../../../api/apiClient';
import { API } from '../../../config/api';

const axiosBaseQuery = () => async ({ url, method = 'GET', body, params }) => {
  try {
    const handlers = {
      GET: () => apiGet(url, params),
      POST: () => apiPost(url, body),
      PATCH: () => apiPatch(url, body),
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
  tagTypes: ['MyQueue', 'BranchOps'],
  endpoints: (builder) => ({
    getMyQueue: builder.query({
      query: () => ({ url: API.ASSIGNMENT_MY_QUEUE }),
      providesTags: ['MyQueue'],
      transformResponse: (res) => res.data,
    }),
    getBranchOps: builder.query({
      query: () => ({ url: API.ASSIGNMENT_BRANCH_OPS }),
      providesTags: ['BranchOps'],
      transformResponse: (res) => res.data,
    }),
    resolveIdentity: builder.query({
      query: (params) => ({ url: API.ASSIGNMENT_RESOLVE_IDENTITY, params }),
      transformResponse: (res) => res.data,
    }),
    updatePresence: builder.mutation({
      query: (body) => ({ url: API.ASSIGNMENT_PRESENCE, method: 'PATCH', body }),
      invalidatesTags: ['MyQueue', 'BranchOps'],
    }),
    heartbeat: builder.mutation({
      query: () => ({ url: API.ASSIGNMENT_HEARTBEAT, method: 'POST' }),
    }),
    acceptOffer: builder.mutation({
      query: (id) => ({ url: API.ASSIGNMENT_OFFER_ACCEPT(id), method: 'POST' }),
      invalidatesTags: ['MyQueue', 'BranchOps'],
    }),
    rejectOffer: builder.mutation({
      query: ({ id, reason }) => ({
        url: API.ASSIGNMENT_OFFER_REJECT(id),
        method: 'POST',
        body: { reason },
      }),
      invalidatesTags: ['MyQueue', 'BranchOps'],
    }),
    startSession: builder.mutation({
      query: (leadId) => ({ url: API.ASSIGNMENT_SESSION_START(leadId), method: 'POST' }),
      invalidatesTags: ['MyQueue', 'BranchOps'],
    }),
    completeSession: builder.mutation({
      query: ({ leadId, outcome }) => ({
        url: API.ASSIGNMENT_SESSION_COMPLETE(leadId),
        method: 'POST',
        body: { outcome },
      }),
      invalidatesTags: ['MyQueue', 'BranchOps'],
    }),
    reassignLead: builder.mutation({
      query: ({ leadId, counsellorId, reason }) => ({
        url: API.ASSIGNMENT_REASSIGN(leadId),
        method: 'POST',
        body: { counsellorId, reason },
      }),
      invalidatesTags: ['MyQueue', 'BranchOps'],
    }),
  }),
});

export const {
  useGetMyQueueQuery,
  useGetBranchOpsQuery,
  useLazyResolveIdentityQuery,
  useUpdatePresenceMutation,
  useHeartbeatMutation,
  useAcceptOfferMutation,
  useRejectOfferMutation,
  useStartSessionMutation,
  useCompleteSessionMutation,
  useReassignLeadMutation,
} = assignmentApi;
