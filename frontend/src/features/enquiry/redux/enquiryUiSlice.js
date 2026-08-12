import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  drawerOpen: false,
  drawerTab: 'overview',
  followupSubTab: 'followups',
  selectedEnquiryId: null,
  isEditMode: false,
  importModalOpen: false,
  importStep: 1,
  filtersOpen: false,
  activeView: 'all',
  activeSummaryFilter: null,
  selectedRowIds: [],
  columnDensity: 'comfortable',
};

const enquiryUiSlice = createSlice({
  name: 'enquiryUi',
  initialState,
  reducers: {
    openEnquiryDrawer: (state, { payload }) => {
      if (!payload?.id) return;
      state.drawerOpen = true;
      state.selectedEnquiryId = payload.id;
      state.isEditMode = true;
      state.drawerTab = 'overview';
    },
    closeEnquiryDrawer: (state) => {
      state.drawerOpen = false;
      state.selectedEnquiryId = null;
      state.isEditMode = false;
      state.drawerTab = 'overview';
    },
    setDrawerTab: (state, { payload }) => { state.drawerTab = payload; },
    setFollowupSubTab: (state, { payload }) => { state.followupSubTab = payload; },
    openImportModal: (state) => { state.importModalOpen = true; state.importStep = 1; },
    closeImportModal: (state) => { state.importModalOpen = false; state.importStep = 1; },
    setImportStep: (state, { payload }) => { state.importStep = payload; },
    toggleFilters: (state) => { state.filtersOpen = !state.filtersOpen; },
    setActiveView: (state, { payload }) => { state.activeView = payload; },
    setSummaryFilter: (state, { payload }) => { state.activeSummaryFilter = payload; },
    setSelectedRowIds: (state, { payload }) => { state.selectedRowIds = payload; },
    setColumnDensity: (state, { payload }) => { state.columnDensity = payload; },
  },
});

export const {
  openEnquiryDrawer, closeEnquiryDrawer, setDrawerTab, setFollowupSubTab,
  openImportModal, closeImportModal, setImportStep, toggleFilters,
  setActiveView, setSummaryFilter, setSelectedRowIds, setColumnDensity,
} = enquiryUiSlice.actions;

export const selectEnquiryUi = (state) => state.enquiryUi;
export default enquiryUiSlice.reducer;
