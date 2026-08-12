import { useDispatch, useSelector } from 'react-redux';
import {
  openWalkInDrawer, closeWalkInDrawer, setWalkInDrawerTab,
} from '../redux/walkinUiSlice';
import { selectWalkInUi } from '../redux/walkinUiSlice';

export function useWalkInDrawer() {
  const dispatch = useDispatch();
  const { drawerOpen, drawerTab, selectedLeadId, isEditMode } = useSelector(selectWalkInUi);

  return {
    drawerOpen,
    drawerTab,
    selectedLeadId,
    isEditMode,
    openDrawer: (id) => dispatch(openWalkInDrawer({ id })),
    openCreate: () => dispatch(openWalkInDrawer({})),
    closeDrawer: () => dispatch(closeWalkInDrawer()),
    setTab: (tab) => dispatch(setWalkInDrawerTab(tab)),
  };
}
