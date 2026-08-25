import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  drawerOpen: false,
  drawerTab: 'overview',
  selectedLeadId: null,
  filtersOpen: false,
  activeView: 'today',
  activeSummaryFilter: null,
  selectedRowIds: [],
  columnDensity: 'comfortable',
};

const walkinUiSlice = createSlice({
  name: 'walkinUi',
  initialState,
  reducers: {
    openWalkInDrawer: (state, { payload }) => {
      state.drawerOpen = true;
      state.selectedLeadId = payload?.id || null;
      state.drawerTab = 'overview';
    },
    closeWalkInDrawer: (state) => {
      state.drawerOpen = false;
      state.selectedLeadId = null;
      state.drawerTab = 'overview';
    },
    setWalkInDrawerTab: (state, { payload }) => { state.drawerTab = payload; },
    toggleWalkInFilters: (state) => { state.filtersOpen = !state.filtersOpen; },
    setWalkInActiveView: (state, { payload }) => { state.activeView = payload; },
    setWalkInSummaryFilter: (state, { payload }) => { state.activeSummaryFilter = payload; },
    setWalkInSelectedRowIds: (state, { payload }) => { state.selectedRowIds = payload; },
  },
});

export const {
  openWalkInDrawer,
  closeWalkInDrawer,
  setWalkInDrawerTab,
  toggleWalkInFilters,
  setWalkInActiveView,
  setWalkInSummaryFilter,
  setWalkInSelectedRowIds,
} = walkinUiSlice.actions;

export const selectWalkInUi = (state) => state.walkinUi;
export default walkinUiSlice.reducer;
