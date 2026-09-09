import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import studentReducer from '../modules/student/redux/studentSlice';
import notificationReducer from '../modules/notification/redux/notificationSlice';
import reminderReducer from '../modules/reminder/redux/reminderSlice';
import enquiryUiReducer from '../features/enquiry/redux/enquiryUiSlice';
import demoUiReducer from '../features/demo/redux/demoUiSlice';
import walkinUiReducer from '../features/walkin/redux/walkinUiSlice';
import { enquiryApi } from '../features/enquiry/redux/enquiryApiSlice';
import { walkinApi } from '../features/walkin/redux/walkinApiSlice';
import { assignmentApi } from '../features/assignment/redux/assignmentApiSlice';
import { featureApi } from '../features/feature/redux/featureApiSlice';
import { organizationApi } from '../features/organization/redux/organizationApiSlice';
import { attendanceApi } from '../features/attendance/redux/attendanceApiSlice';
import { applicationApi } from '../features/applications/redux/applicationApiSlice';
import { visaApi } from '../features/visas/redux/visaApiSlice';
import { automationApi } from '../features/automation/redux/automationApiSlice';
import { roleApplicationApi } from '../features/role-applications/redux/roleApplicationApiSlice';
import { feesApi } from '../features/fees/redux/feesApiSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    student: studentReducer,
    notification: notificationReducer,
    reminder: reminderReducer,
    enquiryUi: enquiryUiReducer,
    demoUi: demoUiReducer,
    walkinUi: walkinUiReducer,
    [enquiryApi.reducerPath]: enquiryApi.reducer,
    [walkinApi.reducerPath]: walkinApi.reducer,
    [assignmentApi.reducerPath]: assignmentApi.reducer,
    [featureApi.reducerPath]: featureApi.reducer,
    [organizationApi.reducerPath]: organizationApi.reducer,
    [attendanceApi.reducerPath]: attendanceApi.reducer,
    [applicationApi.reducerPath]: applicationApi.reducer,
    [visaApi.reducerPath]: visaApi.reducer,
    [feesApi.reducerPath]: feesApi.reducer,
    [automationApi.reducerPath]: automationApi.reducer,
    [roleApplicationApi.reducerPath]: roleApplicationApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ serializableCheck: false })
      .concat(
        enquiryApi.middleware,
        walkinApi.middleware,
        assignmentApi.middleware,
        featureApi.middleware,
        organizationApi.middleware,
        attendanceApi.middleware,
        applicationApi.middleware,
        visaApi.middleware,
        feesApi.middleware,
        automationApi.middleware,
        roleApplicationApi.middleware,
      ),
});
