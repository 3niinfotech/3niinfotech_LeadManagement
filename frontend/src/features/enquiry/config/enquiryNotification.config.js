import {
  FiCalendar, FiClock, FiMonitor, FiFileText, FiDollarSign,
} from 'react-icons/fi';

export const ENQUIRY_NOTIFICATION_TYPES = {
  TODAY_FOLLOWUP: {
    id: 'today_followup',
    label: "Today's Follow-up",
    icon: FiCalendar,
    tone: 'danger',
    tab: 'followup',
  },
  APPOINTMENT: {
    id: 'appointment',
    label: 'Appointment',
    icon: FiClock,
    tone: 'primary',
    tab: 'followup',
  },
  DEMO: {
    id: 'demo',
    label: 'Demo',
    icon: FiMonitor,
    tone: 'success',
    tab: 'demo',
  },
  DOCUMENT_MISSING: {
    id: 'document_missing',
    label: 'Document Missing',
    icon: FiFileText,
    tone: 'warning',
    tab: 'documents',
  },
  PAYMENT_PENDING: {
    id: 'payment_pending',
    label: 'Payment Pending',
    icon: FiDollarSign,
    tone: 'warning',
    tab: 'fees',
  },
};

/** Base documents expected once the enquiry moves past initial contact */
export const REQUIRED_ENQUIRY_DOCUMENTS = {
  default: ['PASSPORT', 'PHOTO'],
  journey: ['PASSPORT', 'PHOTO', 'TENTH', 'TWELFTH'],
};

export const JOURNEY_DOCUMENT_STATUSES = new Set([
  'DEMO_SCHEDULED',
  'DEMO_ATTENDED',
  'DOCUMENTS_PENDING',
  'APPLICATION_SUBMITTED',
  'COUNSELLING',
  'CONVERTED',
]);

export const PAYMENT_WATCH_STATUSES = new Set([
  'DEMO_ATTENDED',
  'DOCUMENTS_PENDING',
  'COUNSELLING',
  'HIGHLY_INTERESTED',
  'APPLICATION_SUBMITTED',
]);
