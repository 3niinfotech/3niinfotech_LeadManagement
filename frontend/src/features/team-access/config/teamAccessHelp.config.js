/** Plain-language help — no technical codes shown to end users */

export const TEAM_TAB_GUIDE = {
  title: 'Managing your team',
  subtitle: 'Add staff, assign roles, and control who can log in.',
  steps: [
    {
      title: '1. Add a team member',
      text: 'Click Add member, fill in name and email, then choose their role and home branch. New users need a password to log in.',
    },
    {
      title: '2. Role decides what they see',
      text: 'Each person gets one role (Counsellor, Receptionist, etc.). The role controls menus, buttons, and pages — not individual settings per person.',
    },
    {
      title: '3. Branch controls their data',
      text: 'Home branch is where the person belongs. They usually see records from that branch. Multi-branch access is set in the role.',
    },
    {
      title: '4. Deactivate or remove',
      text: 'Deactivate blocks login but keeps their work history. Remove takes them off the staff list without deleting past records.',
    },
  ],
  tips: [
    'Use filters above the list to find people by role, branch, or status.',
    'To change permissions, go to Roles & permissions tab — not from the member profile.',
    'Edit updates contact details, role, or password. Email cannot change after create.',
  ],
};

export const ROLES_TAB_GUIDE = {
  title: 'Roles & permissions',
  subtitle: 'Define what each job role can do in the system.',
  steps: [
    {
      title: '1. Pick a role',
      text: 'Select Counsellor, Receptionist, Branch Manager, or any role from the left list.',
    },
    {
      title: '2. Turn permissions on or off',
      text: 'Tick a box to allow an action (view, add, edit, export). Untick to hide it. Changes save automatically.',
    },
    {
      title: '3. Set data access',
      text: 'Choose how much data they see: only their own work, whole branch, or entire company.',
    },
    {
      title: '4. Assign role to staff',
      text: 'Go to Team members → edit a person → change their Role. Everyone with that role gets the same access.',
    },
  ],
  tips: [
    'Copy permissions from another role to save time when creating a new one.',
    'Some permissions are locked for certain roles — this is normal and keeps the system safe.',
    'Clone creates a copy of a role so you can customise without affecting the original.',
  ],
};

/** Friendly module names for permission summary chips */
export const MODULE_FRIENDLY_NAMES = {
  enquiry: 'Enquiries',
  lead: 'Leads',
  student: 'Students',
  application: 'Applications',
  visa: 'Visa',
  reception: 'Reception',
  calendar: 'Calendar',
  document: 'Documents',
  accounts: 'Accounts',
  partner: 'Partners',
  users: 'Users',
  roles: 'Roles',
  dashboard: 'Dashboard',
  reports: 'Reports',
  attendance: 'Attendance',
  masters: 'Masters',
  settings: 'Settings',
  branch: 'Branches',
  invoice: 'Fees',
  demo: 'Demo',
  walkin: 'Walk-in',
  other: 'Other',
};

export function getModuleFriendlyName(key = '') {
  const module = String(key).split('.')[0] || 'other';
  return MODULE_FRIENDLY_NAMES[module] || module.charAt(0).toUpperCase() + module.slice(1);
}

/** Group permission keys by friendly module label for summary chips. */
export function groupPermissionsByModule(permissions = []) {
  const groups = {};
  permissions.forEach((key) => {
    const label = getModuleFriendlyName(key);
    groups[label] = (groups[label] || 0) + 1;
  });
  return Object.entries(groups).sort((a, b) => b[1] - a[1]);
}
