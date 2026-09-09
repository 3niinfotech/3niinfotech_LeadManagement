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
    const filename = match?.[1] || `fees-export-${new Date().toISOString().slice(0, 10)}.xlsx`;
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

export const feesApi = createApi({
  reducerPath: 'feesApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['FeesList', 'FeesSummary', 'FeesDetail'],
  endpoints: (builder) => ({
    listInvoices: builder.query({
      query: (params) => ({ url: API.INVOICES, params }),
      providesTags: ['FeesList'],
      transformResponse: (res) => ({ data: res.data, pagination: res.pagination }),
    }),
    getFeesSummary: builder.query({
      query: (params) => ({ url: API.INVOICES_SUMMARY, params }),
      providesTags: ['FeesSummary'],
      transformResponse: (res) => res.data,
    }),
    getInvoice: builder.query({
      query: (id) => ({ url: API.INVOICE_BY_ID(id) }),
      providesTags: (_r, _e, id) => [{ type: 'FeesDetail', id }],
      transformResponse: (res) => res.data,
    }),
    createInvoice: builder.mutation({
      query: (body) => ({ url: API.INVOICES, method: 'POST', body }),
      invalidatesTags: ['FeesList', 'FeesSummary'],
      transformResponse: (res) => res.data,
    }),
    updateInvoice: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.INVOICE_BY_ID(id), method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [
        'FeesList',
        'FeesSummary',
        { type: 'FeesDetail', id },
      ],
      transformResponse: (res) => res.data,
    }),
    deleteInvoice: builder.mutation({
      query: (id) => ({ url: API.INVOICE_BY_ID(id), method: 'DELETE' }),
      invalidatesTags: ['FeesList', 'FeesSummary'],
    }),
    exportInvoices: builder.mutation({
      queryFn: (body) => exportBlobMutation(API.INVOICES_EXPORT, body),
    }),
  }),
});

export const {
  useListInvoicesQuery,
  useGetFeesSummaryQuery,
  useGetInvoiceQuery,
  useCreateInvoiceMutation,
  useUpdateInvoiceMutation,
  useDeleteInvoiceMutation,
  useExportInvoicesMutation,
} = feesApi;
