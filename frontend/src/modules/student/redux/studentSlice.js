import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { studentService } from '../services/student.service';
import { DEFAULT_PAGE_SIZE } from '../../../config/constants';

export const fetchStudents = createAsyncThunk('student/fetchAll', async (params) => {
  return studentService.getAll(params);
});

export const fetchStudent = createAsyncThunk('student/fetchOne', async (id) => {
  return studentService.getById(id);
});

export const createStudent = createAsyncThunk('student/create', async (data) => {
  return studentService.create(data);
});

export const updateStudent = createAsyncThunk('student/update', async ({ id, data }) => {
  return studentService.update(id, data);
});

export const deleteStudent = createAsyncThunk('student/delete', async (id) => {
  await studentService.delete(id);
  return id;
});

const studentSlice = createSlice({
  name: 'student',
  initialState: {
    list: [],
    current: null,
    pagination: { page: 1, limit: DEFAULT_PAGE_SIZE, total: 0, totalPages: 0 },
    loading: true,
    error: null,
    filters: {},
  },
  reducers: {
    setStudentFilters: (state, action) => { state.filters = action.payload; },
    clearCurrentStudent: (state) => { state.current = null; },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchStudents.pending, (state) => { state.loading = true; })
      .addCase(fetchStudents.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload.data;
        state.pagination = action.payload.pagination;
      })
      .addCase(fetchStudents.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message;
      })
      .addCase(fetchStudent.pending, (state) => { state.loading = true; })
      .addCase(fetchStudent.fulfilled, (state, action) => {
        state.loading = false;
        state.current = action.payload;
      })
      .addCase(fetchStudent.rejected, (state) => { state.loading = false; })
      .addCase(createStudent.fulfilled, (state, action) => {
        state.list.unshift(action.payload);
      })
      .addCase(updateStudent.fulfilled, (state, action) => {
        const idx = state.list.findIndex((s) => s.id === action.payload.id);
        if (idx >= 0) state.list[idx] = action.payload;
        if (state.current?.id === action.payload.id) state.current = action.payload;
      })
      .addCase(deleteStudent.fulfilled, (state, action) => {
        state.list = state.list.filter((s) => s.id !== action.payload);
      });
  },
});

export const { setStudentFilters, clearCurrentStudent } = studentSlice.actions;
export default studentSlice.reducer;

export const selectStudents = (state) => state.student.list;
export const selectStudentPagination = (state) => state.student.pagination;
export const selectStudentLoading = (state) => state.student.loading;
export const selectCurrentStudent = (state) => state.student.current;
