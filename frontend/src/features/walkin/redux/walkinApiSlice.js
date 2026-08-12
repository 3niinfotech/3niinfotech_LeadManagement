import { createApi } from '@reduxjs/toolkit/query/react';
import { apiGet, apiPost, apiPut, apiPatch, apiDelete } from '../../../api/apiClient';
import { API } from '../../../config/api';

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

export const walkinApi = createApi({
  reducerPath: 'walkinApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['WalkInList', 'WalkInSummary', 'WalkInDetail'],
  endpoints: (builder) => ({
    getWalkIns: builder.query({
      query: (params) => ({ url: API.WALK_INS, params }),
      providesTags: ['WalkInList'],
      transformResponse: (res) => ({ data: res.data, pagination: res.pagination }),
    }),
    getWalkInSummary: builder.query({
      query: (params) => ({ url: API.WALK_IN_SUMMARY, params }),
      providesTags: ['WalkInSummary'],
      transformResponse: (res) => res.data,
    }),
    getWalkIn: builder.query({
      query: (id) => ({ url: API.WALK_IN_BY_ID(id) }),
      providesTags: (_r, _e, id) => [{ type: 'WalkInDetail', id }],
      transformResponse: (res) => res.data,
    }),
    checkWalkInDuplicate: builder.query({
      query: (params) => ({ url: API.WALK_IN_CHECK_DUPLICATE, params }),
      transformResponse: (res) => res.data,
    }),
    createWalkIn: builder.mutation({
      query: (body) => ({ url: API.WALK_INS, method: 'POST', body }),
      invalidatesTags: ['WalkInList', 'WalkInSummary'],
      async onQueryStarted(_arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          const { assignmentApi } = await import('../../assignment/redux/assignmentApiSlice');
          dispatch(assignmentApi.util.invalidateTags(['MyQueue', 'BranchOps']));
          const { enquiryApi } = await import('../../enquiry/redux/enquiryApiSlice');
          dispatch(enquiryApi.util.invalidateTags(['EnquiryList', 'EnquirySummary']));
        } catch { /* ignore */ }
      },
    }),
    updateWalkIn: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.WALK_IN_BY_ID(id), method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['WalkInList', 'WalkInSummary', { type: 'WalkInDetail', id }],
    }),
    patchWalkInStatus: builder.mutation({
      query: ({ id, status }) => ({ url: API.WALK_IN_STATUS(id), method: 'PATCH', body: { status } }),
      invalidatesTags: ['WalkInList', 'WalkInSummary'],
    }),
    applyCounsellorDecision: builder.mutation({
      query: ({ id, ...body }) => ({
        url: API.WALK_IN_COUNSELLOR_DECISION(id),
        method: 'POST',
        body,
      }),
      invalidatesTags: (_r, _e, { id }) => ['WalkInList', 'WalkInSummary', { type: 'WalkInDetail', id }],
    }),
    deleteWalkIn: builder.mutation({
      query: (id) => ({ url: API.WALK_IN_BY_ID(id), method: 'DELETE' }),
      invalidatesTags: ['WalkInList', 'WalkInSummary'],
    }),
    addWalkInNote: builder.mutation({
      query: ({ id, content }) => ({ url: API.WALK_IN_NOTES(id), method: 'POST', body: { content } }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'WalkInDetail', id }],
    }),
    getWalkInBranches: builder.query({
      query: () => ({ url: API.WALK_IN_BRANCHES }),
      transformResponse: (res) => res.data,
    }),
    getWalkInCounsellors: builder.query({
      query: (branchId) => ({ url: API.WALK_IN_COUNSELLORS, params: { branchId } }),
      transformResponse: (res) => res.data,
    }),
  }),
});

export const {
  useGetWalkInsQuery,
  useGetWalkInSummaryQuery,
  useGetWalkInQuery,
  useLazyCheckWalkInDuplicateQuery,
  useCreateWalkInMutation,
  useUpdateWalkInMutation,
  usePatchWalkInStatusMutation,
  useApplyCounsellorDecisionMutation,
  useDeleteWalkInMutation,
  useAddWalkInNoteMutation,
  useGetWalkInBranchesQuery,
  useGetWalkInCounsellorsQuery,
} = walkinApi;
