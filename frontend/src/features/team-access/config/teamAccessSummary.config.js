import { FiShield, FiUsers, FiUserCheck, FiAlertCircle } from 'react-icons/fi';

export function buildTeamAccessSummaryItems({
  teamTotal = 0,
  activeCount = 0,
  rolesInUse = 0,
  unassignedEnquiries = 0,
}) {
  return [
    {
      key: 'team',
      label: 'Team members',
      icon: FiUsers,
      tone: 'primary',
      filterValue: null,
      value: teamTotal,
    },
    {
      key: 'active',
      label: 'Active users',
      icon: FiUserCheck,
      tone: 'success',
      filterValue: 'ACTIVE',
      value: activeCount,
    },
    {
      key: 'roles',
      label: 'Roles in use',
      icon: FiShield,
      tone: 'info',
      filterValue: '__roles__',
      value: rolesInUse,
    },
    {
      key: 'unassigned',
      label: 'Unassigned enquiries',
      icon: FiAlertCircle,
      tone: 'danger',
      filterValue: '__unassigned__',
      value: unassignedEnquiries,
    },
  ];
}
