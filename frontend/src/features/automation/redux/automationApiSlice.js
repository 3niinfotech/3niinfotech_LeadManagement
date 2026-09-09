import { createApi } from '@reduxjs/toolkit/query/react';
import { apiGet, apiPatch } from '../../../api/apiClient';
import { API } from '../../../config/api';

const axiosBaseQuery = () => async ({ url, method = 'GET', body, params }) => {
  try {
    const data = method === 'PATCH'
      ? await apiPatch(url, body)
      : await apiGet(url, params);
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

export const automationApi = createApi({
  reducerPath: 'automationApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['AutomationCenter'],
  endpoints: (builder) => ({
    getAutomationCenter: builder.query({
      query: () => ({ url: API.AUTOMATION_CENTER }),
      providesTags: ['AutomationCenter'],
      transformResponse: (res) => res.data ?? res,
    }),
    getAutomationHistory: builder.query({
      query: (params) => ({ url: API.AUTOMATION_HISTORY, params }),
      transformResponse: (res) => res.data ?? res,
    }),
    updateAutomationRule: builder.mutation({
      query: ({ ruleId, enabled }) => ({
        url: API.AUTOMATION_RULE(ruleId),
        method: 'PATCH',
        body: { enabled },
      }),
      invalidatesTags: ['AutomationCenter'],
      transformResponse: (res) => res.data ?? res,
    }),
  }),
});

export const {
  useGetAutomationCenterQuery,
  useGetAutomationHistoryQuery,
  useUpdateAutomationRuleMutation,
} = automationApi;
