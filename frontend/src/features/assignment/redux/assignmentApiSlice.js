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
  tagTypes: ['BranchOps'],
  endpoints: (builder) => ({
    resolveIdentity: builder.query({
      query: (params) => ({ url: API.ASSIGNMENT_RESOLVE_IDENTITY, params }),
      transformResponse: (res) => res.data,
    }),
    updatePresence: builder.mutation({
      query: (body) => ({ url: API.ASSIGNMENT_PRESENCE, method: 'PATCH', body }),
      invalidatesTags: ['BranchOps'],
      transformResponse: (res) => res.data ?? res,
    }),
    heartbeat: builder.mutation({
      query: () => ({ url: API.ASSIGNMENT_HEARTBEAT, method: 'POST' }),
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
      invalidatesTags: ['BranchOps'],
    }),
  }),
});

export const {
  useLazyResolveIdentityQuery,
  useUpdatePresenceMutation,
  useHeartbeatMutation,
  useAcceptOfferMutation,
  useRejectOfferMutation,
  useStartSessionMutation,
  useCompleteSessionMutation,
  useReassignLeadMutation,
} = assignmentApi;
