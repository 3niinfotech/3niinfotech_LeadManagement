/** Staff roles open for public apply — excludes portal-only & system admin roles */
export const PUBLIC_APPLY_ROLE_SLUGS = [
  'counsellor',
  'teacher',
  'receptionist',
  'telecaller',
  'application_officer',
  'visa_officer',
  'document_executive',
  'team_leader',
  'marketing_executive',
  'finance_executive',
  'compliance_officer',
  'operational_head',
  'branch_manager',
];

export const BLOCKED_APPLY_ROLE_SLUGS = new Set([
  'super_admin',
  'company_admin',
  'student_portal',
  'partner',
  'viewer',
  'custom_role',
]);

export const ROLE_APPLY_LABELS = {
  counsellor: 'Counsellor',
  teacher: 'Teacher',
  receptionist: 'Receptionist',
  telecaller: 'Telecaller',
  application_officer: 'Application Officer',
  visa_officer: 'Visa Officer',
  document_executive: 'Document Executive',
  team_leader: 'Team Leader',
  marketing_executive: 'Marketing Executive',
  finance_executive: 'Finance Executive',
  compliance_officer: 'Compliance Officer',
  operational_head: 'Operational Head',
  branch_manager: 'Branch Manager',
};
