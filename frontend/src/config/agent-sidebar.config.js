import {
  FiLayout,
  FiInbox,
  FiBookOpen,
  FiFileText,
  FiGlobe,
  FiDollarSign,
  FiCalendar,
  FiBarChart2,
  FiUser,
} from 'react-icons/fi';
import { ROUTES } from './routes';
import { PERMISSIONS } from './permissions';

export const agentSidebarMenuStructure = [
  {
    id: 'agent-dashboard',
    label: 'Dashboard',
    description: 'Overview, pipeline & admissions',
    icon: FiLayout,
    path: ROUTES.AGENT_DASHBOARD,
  },
  {
    id: 'agent-enquiries',
    label: 'My Referrals',
    description: 'Candidate enquiries & status',
    icon: FiInbox,
    path: ROUTES.AGENT_ENQUIRIES,
    permissions: [PERMISSIONS.ENQUIRIES_VIEW, PERMISSIONS.LEADS_VIEW],
  },
  {
    id: 'agent-students',
    label: 'My Students',
    description: 'Enrolled students roster',
    icon: FiBookOpen,
    path: ROUTES.AGENT_STUDENTS,
    permission: PERMISSIONS.STUDENTS_VIEW,
  },
  {
    id: 'agent-applications',
    label: 'Applications',
    description: 'University applications & offers',
    icon: FiFileText,
    path: ROUTES.AGENT_APPLICATIONS,
    permissions: [PERMISSIONS.APPLICATIONS_VIEW, PERMISSIONS.STUDENTS_VIEW],
  },
  {
    id: 'agent-visas',
    label: 'Visa Tracking',
    description: 'Visa cases & decisions',
    icon: FiGlobe,
    path: ROUTES.AGENT_VISAS,
    permissions: [PERMISSIONS.VISAS_VIEW, PERMISSIONS.STUDENTS_VIEW],
  },
  {
    id: 'agent-commissions',
    label: 'Commissions',
    description: 'Commissions & payouts',
    icon: FiDollarSign,
    path: ROUTES.AGENT_COMMISSIONS,
  },
  {
    id: 'agent-calendar',
    label: 'Calendar',
    description: 'Appointments & schedules',
    icon: FiCalendar,
    path: ROUTES.AGENT_CALENDAR,
    permission: PERMISSIONS.CALENDAR_VIEW,
  },
  {
    id: 'agent-reports',
    label: 'Reports',
    description: 'Referrals & performance',
    icon: FiBarChart2,
    path: ROUTES.AGENT_REPORTS,
  },
  {
    id: 'agent-profile',
    label: 'Agency Profile',
    description: 'Agency account details',
    icon: FiUser,
    path: ROUTES.AGENT_PROFILE,
  },
];

