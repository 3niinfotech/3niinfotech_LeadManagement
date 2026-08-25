import { Toaster } from 'react-hot-toast';
import { toastTheme } from '../../theme/feedback';

export default function ToastProvider() {
  return (
    <Toaster
      position="top-right"
      gutter={10}
      containerStyle={{ top: 68, right: 14, zIndex: toastTheme.zIndex }}
      toastOptions={{
        duration: 4000,
        style: {
          background: 'transparent',
          boxShadow: 'none',
          padding: 0,
          maxWidth: 400,
        },
      }}
    />
  );
}
