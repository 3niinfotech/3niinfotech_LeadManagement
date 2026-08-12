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

export const featureApi = createApi({
  reducerPath: 'featureApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Features'],
  endpoints: (builder) => ({
    getEffectiveFeatures: builder.query({
      query: () => ({ url: API.FEATURES_EFFECTIVE }),
      providesTags: ['Features'],
      transformResponse: (res) => res.data,
    }),
    getAdminFeatures: builder.query({
      query: () => ({ url: API.FEATURES_ADMIN }),
      providesTags: ['Features'],
      transformResponse: (res) => res.data,
    }),
    updateFeatures: builder.mutation({
      query: (updates) => ({
        url: API.FEATURES_BULK,
        method: 'PATCH',
        body: { updates },
      }),
      invalidatesTags: ['Features'],
      transformResponse: (res) => res.data,
    }),
  }),
});

export const {
  useGetEffectiveFeaturesQuery,
  useGetAdminFeaturesQuery,
  useUpdateFeaturesMutation,
} = featureApi;
