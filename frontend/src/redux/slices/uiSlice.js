import { createSlice } from '@reduxjs/toolkit';
import { STORAGE_KEYS } from '../../config/storageKeys';
import { THEMES, TABLE_DENSITY } from '../../config/constants';

const uiSlice = createSlice({
  name: 'ui',
  initialState: {
    theme: localStorage.getItem(STORAGE_KEYS.THEME) || THEMES.LIGHT,
    sidebarCollapsed: localStorage.getItem(STORAGE_KEYS.SIDEBAR_COLLAPSED) === 'true',
    tableDensity: localStorage.getItem(STORAGE_KEYS.TABLE_DENSITY) || TABLE_DENSITY.COMFORTABLE,
    globalLoading: false,
    commandPaletteOpen: false,
    commandPaletteQuery: '',
    drawer: { open: false, content: null, title: '' },
  },
  reducers: {
    setTheme: (state, action) => {
      state.theme = action.payload;
      localStorage.setItem(STORAGE_KEYS.THEME, action.payload);
    },
    toggleSidebar: (state) => {
      state.sidebarCollapsed = !state.sidebarCollapsed;
      localStorage.setItem(STORAGE_KEYS.SIDEBAR_COLLAPSED, String(state.sidebarCollapsed));
    },
    setTableDensity: (state, action) => {
      state.tableDensity = action.payload;
      localStorage.setItem(STORAGE_KEYS.TABLE_DENSITY, action.payload);
    },
    setGlobalLoading: (state, action) => { state.globalLoading = action.payload; },
    toggleCommandPalette: (state) => {
      state.commandPaletteOpen = !state.commandPaletteOpen;
      if (!state.commandPaletteOpen) state.commandPaletteQuery = '';
    },
    openCommandPalette: (state, action) => {
      state.commandPaletteOpen = true;
      if (typeof action.payload === 'string') state.commandPaletteQuery = action.payload;
    },
    closeCommandPalette: (state) => {
      state.commandPaletteOpen = false;
      state.commandPaletteQuery = '';
    },
    setCommandPaletteQuery: (state, action) => {
      state.commandPaletteQuery = action.payload;
    },
    openDrawer: (state, action) => {
      state.drawer = { open: true, ...action.payload };
    },
    closeDrawer: (state) => {
      state.drawer = { open: false, content: null, title: '' };
    },
  },
});

export const {
  setTheme, toggleSidebar, setTableDensity, setGlobalLoading,
  toggleCommandPalette, openCommandPalette, closeCommandPalette, setCommandPaletteQuery,
  openDrawer, closeDrawer,
} = uiSlice.actions;

export default uiSlice.reducer;

export const selectTheme = (state) => state.ui.theme;
export const selectSidebarCollapsed = (state) => state.ui.sidebarCollapsed;
export const selectGlobalLoading = (state) => state.ui.globalLoading;
export const selectCommandPaletteOpen = (state) => state.ui.commandPaletteOpen;
export const selectCommandPaletteQuery = (state) => state.ui.commandPaletteQuery;
export const selectTableDensity = (state) => state.ui.tableDensity;
export const selectDrawer = (state) => state.ui.drawer;
