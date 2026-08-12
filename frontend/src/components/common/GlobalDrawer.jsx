import { useDispatch, useSelector } from 'react-redux';
import Drawer from '../ui/Drawer';
import { closeDrawer, selectDrawer } from '../../redux/slices/uiSlice';

export default function GlobalDrawer() {
  const dispatch = useDispatch();
  const drawer = useSelector(selectDrawer);

  return (
    <Drawer
      open={drawer.open}
      onClose={() => dispatch(closeDrawer())}
      title={drawer.title}
      width={drawer.width}
    >
      {drawer.content}
    </Drawer>
  );
}
