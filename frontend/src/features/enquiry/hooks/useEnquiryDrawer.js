import { useEnquiryNav } from './useEnquiryNav';

/** @deprecated Use useEnquiryNav — drawer replaced by full pages */
export function useEnquiryDrawer() {
  const nav = useEnquiryNav();
  return {
    drawerOpen: false,
    drawerTab: 'overview',
    selectedEnquiryId: null,
    isEditMode: true,
    followupSubTab: null,
    openDrawer: nav.openEnquiry,
    openCreate: nav.openCreate,
    closeDrawer: nav.backToList,
    setTab: () => {},
  };
}
