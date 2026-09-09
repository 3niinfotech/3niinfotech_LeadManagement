import {
  FiBell,
  FiBriefcase,
  FiDatabase,
  FiShield,
  FiToggleLeft,
} from 'react-icons/fi';
import { PERMISSIONS } from './permissions';

/** Settings console — all sections render inline (no redirect portals). */
export const SETTINGS_CONSOLE_GROUPS = [
  {
    id: 'workspace',
    label: 'Workspace',
    sections: [
      {
        id: 'notifications',
        label: 'Notifications',
        description: 'Sound, mute, browser alerts, and in-app toasts.',
        icon: FiBell,
        type: 'panel',
        permissions: [],
      },
      {
        id: 'company',
        label: 'Company',
        description: 'Branding, defaults, mandatory fields, access window, and invoice.',
        icon: FiBriefcase,
        type: 'panel',
        permissions: [PERMISSIONS.SETTINGS_UPDATE, PERMISSIONS.MASTERS_MANAGE, PERMISSIONS.MASTERS_VIEW],
      },
    ],
  },
  {
    id: 'access',
    label: 'Access',
    sections: [
      {
        id: 'team-access',
        label: 'Team & Access',
        description: 'Team members, roles, and permission matrix — all in one place.',
        icon: FiShield,
        type: 'panel',
        permissions: [PERMISSIONS.USERS_VIEW, PERMISSIONS.ROLES_VIEW],
      },
    ],
  },
  {
    id: 'system',
    label: 'System',
    sections: [
      {
        id: 'features',
        label: 'Feature toggles',
        description: 'Enable or disable enterprise modules per company.',
        icon: FiToggleLeft,
        type: 'panel',
        permissions: [PERMISSIONS.SETTINGS_UPDATE],
      },
      {
        id: 'masters',
        label: 'Master data',
        description: 'Browse and manage reference data — academic, visa, CRM, finance.',
        icon: FiDatabase,
        type: 'panel',
        permissions: [PERMISSIONS.MASTERS_VIEW, PERMISSIONS.MASTERS_MANAGE],
      },
    ],
  },
];

export const SETTINGS_DEFAULT_SECTION = 'notifications';

export function flattenSettingsSections() {
  return SETTINGS_CONSOLE_GROUPS.flatMap((g) => g.sections);
}

export function getSettingsSection(id) {
  return flattenSettingsSections().find((s) => s.id === id) || null;
}
