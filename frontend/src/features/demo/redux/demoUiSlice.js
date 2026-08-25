import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  filtersOpen: false,
  activeView: 'all',
  activeSummaryFilter: null,
  selectedRowIds: [],
  columnDensity: 'comfortable',
  scheduleModalOpen: false,
  attendanceModalOpen: false,
  rescheduleModalOpen: false,
  cancelModalOpen: false,
  detailDrawerOpen: false,
  bulkActionModal: null, // 'attendance' | 'cancel' | null
  activeDemo: null, // The currently active demo object for modals/drawer
};

const demoUiSlice = createSlice({
  name: 'demoUi',
  initialState,
  reducers: {
    toggleDemoFilters: (state) => {
      state.filtersOpen = !state.filtersOpen;
    },
    setDemoFiltersOpen: (state, { payload }) => {
      state.filtersOpen = Boolean(payload);
    },
    setActiveDemoView: (state, { payload }) => {
      state.activeView = payload;
      state.activeSummaryFilter = null;
    },
    setDemoSummaryFilter: (state, { payload }) => {
      state.activeSummaryFilter = payload;
      if (payload) {
        state.activeView = 'all';
      }
    },
    setSelectedDemoRowIds: (state, { payload }) => {
      state.selectedRowIds = payload || [];
    },
    setDemoColumnDensity: (state, { payload }) => {
      state.columnDensity = payload;
    },
    openScheduleDemoModal: (state, { payload }) => {
      state.activeDemo = payload || null;
      state.scheduleModalOpen = true;
    },
    closeScheduleDemoModal: (state) => {
      state.scheduleModalOpen = false;
      state.activeDemo = null;
    },
    openMarkAttendanceModal: (state, { payload }) => {
      state.activeDemo = payload;
      state.attendanceModalOpen = true;
    },
    closeMarkAttendanceModal: (state) => {
      state.attendanceModalOpen = false;
      state.activeDemo = null;
    },
    openRescheduleDemoModal: (state, { payload }) => {
      state.activeDemo = payload;
      state.rescheduleModalOpen = true;
    },
    closeRescheduleDemoModal: (state) => {
      state.rescheduleModalOpen = false;
      state.activeDemo = null;
    },
    openCancelDemoModal: (state, { payload }) => {
      state.activeDemo = payload;
      state.cancelModalOpen = true;
    },
    closeCancelDemoModal: (state) => {
      state.cancelModalOpen = false;
      state.activeDemo = null;
    },
    openDemoDetailDrawer: (state, { payload }) => {
      state.activeDemo = payload;
      state.detailDrawerOpen = true;
    },
    closeDemoDetailDrawer: (state) => {
      state.detailDrawerOpen = false;
      state.activeDemo = null;
    },
    openDemoBulkAction: (state, { payload }) => {
      state.bulkActionModal = payload;
    },
    closeDemoBulkAction: (state) => {
      state.bulkActionModal = null;
    },
    resetDemoListUi: (state) => {
      state.filtersOpen = false;
      state.activeView = 'all';
      state.activeSummaryFilter = null;
      state.selectedRowIds = [];
    },
  },
});

export const {
  toggleDemoFilters,
  setDemoFiltersOpen,
  setActiveDemoView,
  setDemoSummaryFilter,
  setSelectedDemoRowIds,
  setDemoColumnDensity,
  openScheduleDemoModal,
  closeScheduleDemoModal,
  openMarkAttendanceModal,
  closeMarkAttendanceModal,
  openRescheduleDemoModal,
  closeRescheduleDemoModal,
  openCancelDemoModal,
  closeCancelDemoModal,
  openDemoDetailDrawer,
  closeDemoDetailDrawer,
  openDemoBulkAction,
  closeDemoBulkAction,
  resetDemoListUi,
} = demoUiSlice.actions;

export const selectDemoUi = (state) => state.demoUi;
export default demoUiSlice.reducer;
