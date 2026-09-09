import { createApi } from '@reduxjs/toolkit/query/react';
import { apiGet, apiPost, apiPut, apiDelete } from '../../../api/apiClient';
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

export const attendanceApi = createApi({
  reducerPath: 'attendanceApi',
  baseQuery: axiosBaseQuery(),
  tagTypes: ['Batches', 'BatchDetail', 'Sessions', 'SessionAttendance', 'StudentAttendance'],
  endpoints: (builder) => ({
    getBatches: builder.query({
      query: (params) => ({ url: API.ACADEMIC_BATCHES, params }),
      providesTags: ['Batches'],
      transformResponse: (res) => ({ data: res.data, pagination: res.pagination }),
    }),
    getBatch: builder.query({
      query: (id) => ({ url: API.ACADEMIC_BATCH(id) }),
      providesTags: (_r, _e, id) => [{ type: 'BatchDetail', id }],
      transformResponse: (res) => res.data,
    }),
    createBatch: builder.mutation({
      query: (body) => ({ url: API.ACADEMIC_BATCHES, method: 'POST', body }),
      invalidatesTags: ['Batches'],
      transformResponse: (res) => res.data,
    }),
    updateBatch: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.ACADEMIC_BATCH(id), method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => ['Batches', { type: 'BatchDetail', id }],
    }),
    enrollStudents: builder.mutation({
      query: ({ id, studentIds }) => ({
        url: API.ACADEMIC_BATCH_ENROLL(id),
        method: 'POST',
        body: { studentIds },
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'BatchDetail', id }],
    }),
    unenrollStudent: builder.mutation({
      query: ({ id, studentId }) => ({
        url: API.ACADEMIC_BATCH_UNENROLL(id, studentId),
        method: 'DELETE',
      }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'BatchDetail', id }, 'Batches'],
    }),
    addTimetableSlot: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.ACADEMIC_BATCH_TIMETABLE(id), method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'BatchDetail', id }],
    }),
    generateSessions: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.ACADEMIC_BATCH_GENERATE(id), method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => ['Sessions', { type: 'BatchDetail', id }],
    }),
    getSessions: builder.query({
      query: (params) => ({ url: API.ACADEMIC_SESSIONS, params }),
      providesTags: ['Sessions'],
      transformResponse: (res) => res.data,
    }),
    getSessionAttendance: builder.query({
      query: (id) => ({ url: API.ACADEMIC_SESSION_ATTENDANCE(id) }),
      providesTags: (_r, _e, id) => [{ type: 'SessionAttendance', id }],
      transformResponse: (res) => res.data,
    }),
    saveAttendance: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.ACADEMIC_SESSION_ATTENDANCE(id), method: 'PUT', body }),
      invalidatesTags: (_r, _e, { id }) => [
        { type: 'SessionAttendance', id },
        'Sessions',
        'StudentAttendance',
      ],
    }),
    correctAttendance: builder.mutation({
      query: ({ id, ...body }) => ({ url: API.ACADEMIC_SESSION_CORRECT(id), method: 'POST', body }),
      invalidatesTags: (_r, _e, { id }) => [{ type: 'SessionAttendance', id }, 'StudentAttendance'],
    }),
    getStudentAttendance: builder.query({
      query: (studentId) => ({ url: API.ACADEMIC_STUDENT(studentId) }),
      providesTags: (_r, _e, studentId) => [{ type: 'StudentAttendance', id: studentId }],
      transformResponse: (res) => res.data,
    }),
  }),
});

export const {
  useGetBatchesQuery,
  useGetBatchQuery,
  useCreateBatchMutation,
  useUpdateBatchMutation,
  useEnrollStudentsMutation,
  useUnenrollStudentMutation,
  useAddTimetableSlotMutation,
  useGenerateSessionsMutation,
  useGetSessionsQuery,
  useGetSessionAttendanceQuery,
  useSaveAttendanceMutation,
  useCorrectAttendanceMutation,
  useGetStudentAttendanceQuery,
} = attendanceApi;
