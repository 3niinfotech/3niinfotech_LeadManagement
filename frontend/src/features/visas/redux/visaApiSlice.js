import { createApi } from '@reduxjs/toolkit/query/react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../api/apiClient';
import apiClient from '../../../api/axios';
import { API } from '../../../config/api';

const axiosBaseQuery = () => async ({ url, method = 'GET', body, params }) => {
  try {
    const handlers = {
      GET: () => apiGet(url, params),
      POST: () => apiPost(url, body),
      PUT: () => apiPut(url, body),
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

async function exportBlobMutation(url, body) {
  try {
    const res = await apiClient.post(url, body, { responseType: 'blob' });
    const disposition = res.headers?.['content-disposition'] || '';
    const match = /filename="?([^"]+)"?/i.exec(disposition);
    const filename = match?.[1] || `export-${new Date().toISOString().slice(0, 10)}.xlsx`;
    const count = Number(res.headers?.['x-export-count'] || 0);
    const selected = res.headers?.['x-export-selected'] === '1';
    return { data: { blob: res.data, filename, count, selected } };
  } catch (error) {
    let message = 'Export failed';
    const data = error.response?.data;
    if (data instanceof Blob) {
      try {
        const text = await data.text();
        const json = JSON.parse(text);
        message = json?.message || message;
      } catch { /* ignore */ }
    } else if (data?.message) {
      message = data.message;
    }
    return { error: { status: error.response?.status || 500, data: { message } } };
  }
}

export const visaApi = createApi({
  reducerPath: 'visaApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['VisaList', 'VisaSummary', 'VisaDetail'],
  endpoints: (builder) => ({
    listVisas: builder.query({
      query: (params) => ({ url: API.VISAS, params }),
      providesTags: ['VisaList'],
      transformResponse: (res) => ({ data: res.data, pagination: res.pagination }),
    }),
    getVisaSummary: builder.query({
      query: (params) => ({ url: API.VISAS_SUMMARY, params }),
      providesTags: ['VisaSummary'],
      transformResponse: (res) => res.data,
    }),
    getVisa: builder.query({
      query: (id) => ({ url: API.VISA_BY_ID(id) }),
      providesTags: (_r, _e, id) => [{ type: 'VisaDetail', id }],
      transformResponse: (res) => res.data,
    }),
    createVisa: builder.mutation({
      query: (body) => ({ url: API.VISAS, method: 'POST', body }),
      invalidatesTags: ['VisaList', 'VisaSummary'],
      transformResponse: (res) => res.data,
    }),
    updateVisa: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.VISA_BY_ID(id), method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [
        'VisaList',
        'VisaSummary',
        { type: 'VisaDetail', id },
      ],
      transformResponse: (res) => res.data,
    }),
    deleteVisa: builder.mutation({
      query: (id) => ({ url: API.VISA_BY_ID(id), method: 'DELETE' }),
      invalidatesTags: ['VisaList', 'VisaSummary'],
    }),
    exportVisas: builder.mutation({
      queryFn: (body) => exportBlobMutation(API.VISAS_EXPORT, body),
    }),
  }),
});

export const {
  useListVisasQuery,
  useGetVisaSummaryQuery,
  useGetVisaQuery,
  useCreateVisaMutation,
  useUpdateVisaMutation,
  useDeleteVisaMutation,
  useExportVisasMutation,
} = visaApi;
