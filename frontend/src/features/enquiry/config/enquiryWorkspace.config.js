import {
  FiLayout, FiClock, FiMessageSquare, FiEdit3, FiMonitor, FiCheckSquare,
  FiFileText, FiCalendar, FiTrendingUp, FiBarChart2,
} from 'react-icons/fi';

/**
 * Complete Lead Workspace — counsellor manages the full enquiry journey here.
 * No separate pages for follow-up, conversion, calls, or analytics.
 */
export const ENQUIRY_WORKSPACE_AREAS = [
  { id: 'overview', label: 'Lead Details', icon: FiLayout, tab: 'overview' },
  { id: 'timeline', label: 'Timeline', icon: FiClock, tab: 'timeline' },
  { id: 'communication', label: 'Calls & WhatsApp', icon: FiMessageSquare, tab: 'communication' },
  { id: 'notes', label: 'Notes', icon: FiEdit3, tab: 'notes' },
  { id: 'demo', label: 'Demo', icon: FiMonitor, tab: 'demo' },
  { id: 'tasks', label: 'Tasks', icon: FiCheckSquare, tab: 'tasks' },
  { id: 'documents', label: 'Documents', icon: FiFileText, tab: 'documents' },
  { id: 'followup', label: 'Follow-up', icon: FiCalendar, tab: 'followup' },
  { id: 'conversion', label: 'Conversion', icon: FiTrendingUp, tab: 'conversion' },
  { id: 'analytics', label: 'Analytics', icon: FiBarChart2, action: 'analytics' },
];
