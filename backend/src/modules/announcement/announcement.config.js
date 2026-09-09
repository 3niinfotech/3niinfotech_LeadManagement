/** Audience presets for announcements — maps to role slugs in tenant. */
export const ANNOUNCEMENT_AUDIENCES = {
  student_portal: {
    label: 'Students',
    roleSlugs: ['student_portal'],
    linkPrefix: '/student',
  },
  counsellor: {
    label: 'Counsellors',
    roleSlugs: ['counsellor'],
    linkPrefix: '/admin',
  },
  reception: {
    label: 'Reception',
    roleSlugs: ['reception', 'receptionist'],
    linkPrefix: '/admin',
  },
  all_staff: {
    label: 'All staff',
    roleSlugs: [
      'super_admin',
      'company_admin',
      'operational_head',
      'branch_manager',
      'team_leader',
      'counsellor',
      'reception',
      'receptionist',
      'faculty',
      'teacher',
      'accounts',
      'finance_manager',
      'finance_executive',
      'marketing_manager',
      'marketing_executive',
      'visa_officer',
      'application_officer',
      'partner_manager',
      'telecaller',
      'document_executive',
      'compliance_officer',
      'viewer',
      'custom_role',
    ],
    linkPrefix: '/admin',
  },
  everyone: {
    label: 'Everyone',
    roleSlugs: null, // all active users in company
    linkPrefix: '/admin',
  },
};

export const ANNOUNCEMENT_AUDIENCE_KEYS = Object.keys(ANNOUNCEMENT_AUDIENCES);

export function resolveAnnouncementAudience(key) {
  if (!key) return ANNOUNCEMENT_AUDIENCES.all_staff;
  const normalized = String(key).trim().toLowerCase();
  return ANNOUNCEMENT_AUDIENCES[normalized] || ANNOUNCEMENT_AUDIENCES.all_staff;
}
