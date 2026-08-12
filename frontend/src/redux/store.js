import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import studentReducer from '../modules/student/redux/studentSlice';
import notificationReducer from '../modules/notification/redux/notificationSlice';
import enquiryUiReducer from '../features/enquiry/redux/enquiryUiSlice';
import walkinUiReducer from '../features/walkin/redux/walkinUiSlice';
import { enquiryApi } from '../features/enquiry/redux/enquiryApiSlice';
import { walkinApi } from '../features/walkin/redux/walkinApiSlice';
import { assignmentApi } from '../features/assignment/redux/assignmentApiSlice';
import { featureApi } from '../features/feature/redux/featureApiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    student: studentReducer,
    notification: notificationReducer,
    enquiryUi: enquiryUiReducer,
    walkinUi: walkinUiReducer,
    [enquiryApi.reducerPath]: enquiryApi.reducer,
    [walkinApi.reducerPath]: walkinApi.reducer,
    [assignmentApi.reducerPath]: assignmentApi.reducer,
    [featureApi.reducerPath]: featureApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(enquiryApi.middleware, walkinApi.middleware, assignmentApi.middleware, featureApi.middleware),
});
