import { createApi } from '@reduxjs/toolkit/query/react';
import { apiGet, apiPatch } from '../../../api/apiClient';
import { API } from '../../../config/api';

const axiosBaseQuery = () => async ({ url, method = 'GET', body }) => {
  try {
    const data = method === 'PATCH' ? await apiPatch(url, body) : await apiGet(url);
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

export const organizationApi = createApi({
  reducerPath: 'organizationApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['ViewingBranch'],
  endpoints: (builder) => ({
    getViewingBranch: builder.query({
      query: () => ({ url: API.ORG_VIEWING_BRANCH }),
      providesTags: ['ViewingBranch'],
      transformResponse: (res) => res.data,
    }),
    setViewingBranch: builder.mutation({
      query: (branchId) => ({
        url: API.ORG_VIEWING_BRANCH,
        method: 'PATCH',
        body: { branchId: branchId || 'ALL' },
      }),
      invalidatesTags: ['ViewingBranch'],
      transformResponse: (res) => res.data,
    }),
  }),
});

export const {
  useGetViewingBranchQuery,
  useSetViewingBranchMutation,
} = organizationApi;
