import { createApi } from '@reduxjs/toolkit/query/react';
import { apiGet, apiPatch, apiPost } from '../../../api/apiClient';

const axiosBaseQuery = () => async ({ url, method = 'GET', body, params }) => {
  try {
    let data;
    if (method === 'POST') data = await apiPost(url, body);
    else if (method === 'PATCH') data = await apiPatch(url, body);
    else data = await apiGet(url, params);
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

export const roleApplicationApi = createApi({
  reducerPath: 'roleApplicationApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['RoleApplication', 'RoleApplicationSummary'],
  endpoints: (builder) => ({
    getOpenRoles: builder.query({
      query: () => ({ url: '/role-applications/open-roles' }),
      transformResponse: (res) => res.data ?? res,
    }),
    getApplyBranches: builder.query({
      query: (companyCode) => ({
        url: '/role-applications/branches',
        params: { companyCode },
      }),
      transformResponse: (res) => res.data ?? res,
    }),
    submitRoleApplication: builder.mutation({
      query: (body) => ({
        url: '/role-applications/apply',
        method: 'POST',
        body,
      }),
      transformResponse: (res) => res.data ?? res,
    }),
    getRoleApplicationSummary: builder.query({
      query: () => ({ url: '/role-applications/summary' }),
      providesTags: ['RoleApplicationSummary'],
      transformResponse: (res) => res.data ?? res,
    }),
    getRoleApplications: builder.query({
      query: (params = {}) => ({ url: '/role-applications', params }),
      providesTags: (result) => [
        'RoleApplication',
        ...(result?.data || []).map((r) => ({ type: 'RoleApplication', id: r.id })),
      ],
      transformResponse: (res) => res.data ?? res,
    }),
    getRoleApplicationById: builder.query({
      query: (id) => ({ url: `/role-applications/${id}` }),
      providesTags: (_r, _e, id) => [{ type: 'RoleApplication', id }],
      transformResponse: (res) => res.data ?? res,
    }),
    approveRoleApplication: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/role-applications/${id}/approve`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['RoleApplication', 'RoleApplicationSummary'],
      transformResponse: (res) => res.data ?? res,
    }),
    rejectRoleApplication: builder.mutation({
      query: ({ id, ...body }) => ({
        url: `/role-applications/${id}/reject`,
        method: 'PATCH',
        body,
      }),
      invalidatesTags: ['RoleApplication', 'RoleApplicationSummary'],
      transformResponse: (res) => res.data ?? res,
    }),
  }),
});

export const {
  useGetOpenRolesQuery,
  useGetApplyBranchesQuery,
  useSubmitRoleApplicationMutation,
  useGetRoleApplicationSummaryQuery,
  useGetRoleApplicationsQuery,
  useGetRoleApplicationByIdQuery,
  useApproveRoleApplicationMutation,
  useRejectRoleApplicationMutation,
} = roleApplicationApi;
