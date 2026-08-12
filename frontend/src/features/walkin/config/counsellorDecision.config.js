import {
  FiThumbsUp, FiThumbsDown, FiClock, FiCalendar, FiMonitor, FiUserCheck,
} from 'react-icons/fi';

export const COUNSELLOR_DECISIONS = [
  {
    id: 'INTERESTED',
    label: 'Interested',
    description: 'Create qualified enquiry & open workspace',
    icon: FiThumbsUp,
    tone: 'success',
    createsEnquiry: true,
  },
  {
    id: 'FOLLOW_UP',
    label: 'Follow-up Required',
    description: 'Schedule reminder — no enquiry yet',
    icon: FiClock,
    tone: 'warning',
    needsFollowUpDate: true,
  },
  {
    id: 'APPOINTMENT',
    label: 'Appointment',
    description: 'Book counselling session — no enquiry yet',
    icon: FiCalendar,
    tone: 'info',
  },
  {
    id: 'DEMO',
    label: 'Demo Required',
    description: 'Register for demo batch — no enquiry yet',
    icon: FiMonitor,
    tone: 'brand',
  },
  {
    id: 'NOT_INTERESTED',
    label: 'Not Interested',
    description: 'Close visit with reason — no enquiry',
    icon: FiThumbsDown,
    tone: 'danger',
    needsReason: true,
  },
  {
    id: 'EXISTING_STUDENT',
    label: 'Existing Student',
    description: 'Link to existing student record',
    icon: FiUserCheck,
    tone: 'secondary',
    needsReason: true,
  },
];

export function getCounsellorDecision(id) {
  return COUNSELLOR_DECISIONS.find((d) => d.id === id);
}
