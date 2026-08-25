/**
 * Master permission registry — single source for seeding DB.
 * Format: module.action (dot notation)
 */
export const PERMISSION_REGISTRY = [
  // Dashboard
  { key: 'dashboard.view', module: 'dashboard', action: 'view', name: 'View Dashboard', groupName: 'Dashboard' },
  { key: 'dashboard.analytics', module: 'dashboard', action: 'analytics', name: 'Dashboard Analytics', groupName: 'Dashboard' },
  { key: 'dashboard.export', module: 'dashboard', action: 'export', name: 'Export Dashboard', groupName: 'Dashboard' },

  // Enquiry
  { key: 'enquiry.view', module: 'enquiry', action: 'view', name: 'View Enquiries', groupName: 'Enquiry' },
  { key: 'enquiry.create', module: 'enquiry', action: 'create', name: 'Create Enquiry', groupName: 'Enquiry' },
  { key: 'enquiry.update', module: 'enquiry', action: 'update', name: 'Update Enquiry', groupName: 'Enquiry' },
  { key: 'enquiry.delete', module: 'enquiry', action: 'delete', name: 'Delete Enquiry', groupName: 'Enquiry' },
  { key: 'enquiry.assign', module: 'enquiry', action: 'assign', name: 'Assign Enquiry', groupName: 'Enquiry' },
  { key: 'enquiry.import', module: 'enquiry', action: 'import', name: 'Import Enquiries', groupName: 'Enquiry' },
  { key: 'enquiry.export', module: 'enquiry', action: 'export', name: 'Export Enquiries', groupName: 'Enquiry' },
  { key: 'enquiry.approve', module: 'enquiry', action: 'approve', name: 'Approve Enquiry', groupName: 'Enquiry' },
  { key: 'enquiry.bulk', module: 'enquiry', action: 'bulk', name: 'Bulk Enquiry Actions', groupName: 'Enquiry' },

  // Lead
  { key: 'lead.view', module: 'lead', action: 'view', name: 'View Leads', groupName: 'Lead' },
  { key: 'lead.create', module: 'lead', action: 'create', name: 'Create Lead', groupName: 'Lead' },
  { key: 'lead.update', module: 'lead', action: 'update', name: 'Update Lead', groupName: 'Lead' },
  { key: 'lead.delete', module: 'lead', action: 'delete', name: 'Delete Lead', groupName: 'Lead' },
  { key: 'lead.assign', module: 'lead', action: 'assign', name: 'Assign Lead', groupName: 'Lead' },
  { key: 'lead.export', module: 'lead', action: 'export', name: 'Export Leads', groupName: 'Lead' },

  // Walk-in Reception
  { key: 'reception.walkin.view', module: 'reception', action: 'walkin.view', name: 'View Walk-ins', groupName: 'Reception' },
  { key: 'reception.walkin.create', module: 'reception', action: 'walkin.create', name: 'Register Walk-in', groupName: 'Reception' },
  { key: 'reception.walkin.update', module: 'reception', action: 'walkin.update', name: 'Update Walk-in', groupName: 'Reception' },
  { key: 'reception.walkin.delete', module: 'reception', action: 'walkin.delete', name: 'Delete Walk-in', groupName: 'Reception' },
  { key: 'reception.walkin.assign', module: 'reception', action: 'walkin.assign', name: 'Assign Walk-in Counsellor', groupName: 'Reception' },

  // Student
  { key: 'student.view', module: 'student', action: 'view', name: 'View Students', groupName: 'Student' },
  { key: 'student.create', module: 'student', action: 'create', name: 'Create Student', groupName: 'Student' },
  { key: 'student.update', module: 'student', action: 'update', name: 'Update Student', groupName: 'Student' },
  { key: 'student.delete', module: 'student', action: 'delete', name: 'Delete Student', groupName: 'Student' },
  { key: 'student.assign', module: 'student', action: 'assign', name: 'Assign Student', groupName: 'Student' },
  { key: 'student.export', module: 'student', action: 'export', name: 'Export Students', groupName: 'Student' },

  // Application
  { key: 'application.view', module: 'application', action: 'view', name: 'View Applications', groupName: 'Application' },
  { key: 'application.create', module: 'application', action: 'create', name: 'Create Application', groupName: 'Application' },
  { key: 'application.update', module: 'application', action: 'update', name: 'Update Application', groupName: 'Application' },
  { key: 'application.delete', module: 'application', action: 'delete', name: 'Delete Application', groupName: 'Application' },
  { key: 'application.assign', module: 'application', action: 'assign', name: 'Assign Application', groupName: 'Application' },
  { key: 'application.submit', module: 'application', action: 'submit', name: 'Submit Application', groupName: 'Application' },
  { key: 'application.finalize', module: 'application', action: 'finalize', name: 'Finalize Application', groupName: 'Application' },

  // Visa
  { key: 'visa.view', module: 'visa', action: 'view', name: 'View Visas', groupName: 'Visa' },
  { key: 'visa.create', module: 'visa', action: 'create', name: 'Create Visa', groupName: 'Visa' },
  { key: 'visa.update', module: 'visa', action: 'update', name: 'Update Visa', groupName: 'Visa' },
  { key: 'visa.delete', module: 'visa', action: 'delete', name: 'Delete Visa', groupName: 'Visa' },
  { key: 'visa.approve', module: 'visa', action: 'approve', name: 'Approve Visa', groupName: 'Visa' },
  { key: 'visa.reject', module: 'visa', action: 'reject', name: 'Reject Visa', groupName: 'Visa' },

  // Accounts / Finance
  { key: 'accounts.invoice.view', module: 'accounts', action: 'invoice.view', name: 'View Invoices', groupName: 'Finance' },
  { key: 'accounts.invoice.create', module: 'accounts', action: 'invoice.create', name: 'Create Invoice', groupName: 'Finance' },
  { key: 'accounts.invoice.edit', module: 'accounts', action: 'invoice.edit', name: 'Edit Invoice', groupName: 'Finance' },
  { key: 'accounts.invoice.delete', module: 'accounts', action: 'invoice.delete', name: 'Delete Invoice', groupName: 'Finance' },
  { key: 'accounts.payment.collect', module: 'accounts', action: 'payment.collect', name: 'Collect Payment', groupName: 'Finance' },

  // Partner
  { key: 'partner.view', module: 'partner', action: 'view', name: 'View Partners', groupName: 'Partner' },
  { key: 'partner.create', module: 'partner', action: 'create', name: 'Create Partner', groupName: 'Partner' },
  { key: 'partner.update', module: 'partner', action: 'update', name: 'Update Partner', groupName: 'Partner' },
  { key: 'partner.delete', module: 'partner', action: 'delete', name: 'Delete Partner', groupName: 'Partner' },

  // Document
  { key: 'document.view', module: 'document', action: 'view', name: 'View Documents', groupName: 'Document' },
  { key: 'document.upload', module: 'document', action: 'upload', name: 'Upload Documents', groupName: 'Document' },
  { key: 'document.delete', module: 'document', action: 'delete', name: 'Delete Documents', groupName: 'Document' },

  // Reports
  { key: 'reports.view', module: 'reports', action: 'view', name: 'View Reports', groupName: 'Reports' },
  { key: 'reports.export', module: 'reports', action: 'export', name: 'Export Reports', groupName: 'Reports' },

  // Users & RBAC
  { key: 'users.view', module: 'users', action: 'view', name: 'View Users', groupName: 'Administration' },
  { key: 'users.create', module: 'users', action: 'create', name: 'Create Users', groupName: 'Administration' },
  { key: 'users.update', module: 'users', action: 'update', name: 'Update Users', groupName: 'Administration' },
  { key: 'users.delete', module: 'users', action: 'delete', name: 'Delete Users', groupName: 'Administration' },
  { key: 'roles.view', module: 'roles', action: 'view', name: 'View Roles', groupName: 'Administration' },
  { key: 'roles.create', module: 'roles', action: 'create', name: 'Create Roles', groupName: 'Administration' },
  { key: 'roles.update', module: 'roles', action: 'update', name: 'Update Roles', groupName: 'Administration' },
  { key: 'roles.delete', module: 'roles', action: 'delete', name: 'Delete Roles', groupName: 'Administration' },
  { key: 'roles.assign', module: 'roles', action: 'assign', name: 'Assign Users to Role', groupName: 'Administration' },
  { key: 'roles.export', module: 'roles', action: 'export', name: 'Export Roles', groupName: 'Administration' },
  { key: 'roles.clone', module: 'roles', action: 'clone', name: 'Clone Roles', groupName: 'Administration' },

  // Settings & Masters
  { key: 'settings.view', module: 'settings', action: 'view', name: 'View Settings', groupName: 'Settings' },
  { key: 'settings.manage', module: 'settings', action: 'manage', name: 'Manage Settings', groupName: 'Settings' },
  { key: 'masters.view', module: 'masters', action: 'view', name: 'View Masters', groupName: 'Settings' },
  { key: 'masters.manage', module: 'masters', action: 'manage', name: 'Manage Masters', groupName: 'Settings' },
  { key: 'audit.view', module: 'audit', action: 'view', name: 'View Audit Logs', groupName: 'Settings' },

  // Branch access (Active Branch switcher — prepare now, UI later)
  { key: 'branch.switch', module: 'branch', action: 'switch', name: 'Switch Active Branch', groupName: 'Branch' },
  { key: 'branch.view_multiple', module: 'branch', action: 'view_multiple', name: 'View Multiple Branches', groupName: 'Branch' },

  // Calendar
  { key: 'calendar.view', module: 'calendar', action: 'view', name: 'View Calendar', groupName: 'Calendar' },
  { key: 'calendar.create', module: 'calendar', action: 'create', name: 'Create Calendar Events', groupName: 'Calendar' },
  { key: 'calendar.update', module: 'calendar', action: 'update', name: 'Edit Calendar Events', groupName: 'Calendar' },
  { key: 'calendar.delete', module: 'calendar', action: 'delete', name: 'Delete Calendar Events', groupName: 'Calendar' },
  { key: 'calendar.assign', module: 'calendar', action: 'assign', name: 'Assign Calendar Events', groupName: 'Calendar' },
  { key: 'calendar.complete', module: 'calendar', action: 'complete', name: 'Complete Calendar Events', groupName: 'Calendar' },
  { key: 'calendar.reschedule', module: 'calendar', action: 'reschedule', name: 'Reschedule Calendar Events', groupName: 'Calendar' },

  // Student + Demo attendance (not teacher attendance)
  { key: 'attendance.view', module: 'attendance', action: 'view', name: 'View Attendance', groupName: 'Attendance' },
  { key: 'attendance.mark', module: 'attendance', action: 'mark', name: 'Mark Attendance', groupName: 'Attendance' },
  { key: 'attendance.edit', module: 'attendance', action: 'edit', name: 'Edit Attendance', groupName: 'Attendance' },
  { key: 'attendance.correct', module: 'attendance', action: 'correct', name: 'Correct Locked Attendance', groupName: 'Attendance' },
  { key: 'attendance.report', module: 'attendance', action: 'report', name: 'Attendance Reports', groupName: 'Attendance' },
];

/** Legacy colon keys → dot keys for backward compatibility */
export const LEGACY_PERMISSION_ALIASES = {
  'dashboard:view': 'dashboard.view',
  'enquiries:view': 'enquiry.view',
  'enquiries:create': 'enquiry.create',
  'enquiries:update': 'enquiry.update',
  'enquiries:delete': 'enquiry.delete',
  'enquiries:export': 'enquiry.export',
  'leads:view': 'lead.view',
  'leads:create': 'lead.create',
  'leads:update': 'lead.update',
  'leads:delete': 'lead.delete',
  'leads:assign': 'lead.assign',
  'leads:export': 'lead.export',
  'students:view': 'student.view',
  'students:create': 'student.create',
  'students:update': 'student.update',
  'students:delete': 'student.delete',
  'students:assign': 'student.assign',
  'students:export': 'student.export',
  'applications:view': 'application.view',
  'applications:create': 'application.create',
  'applications:update': 'application.update',
  'applications:delete': 'application.delete',
  'visas:view': 'visa.view',
  'visas:create': 'visa.create',
  'visas:update': 'visa.update',
  'visas:delete': 'visa.delete',
  'invoices:view': 'accounts.invoice.view',
  'invoices:create': 'accounts.invoice.create',
  'invoices:update': 'accounts.invoice.edit',
  'invoices:delete': 'accounts.invoice.delete',
  'partners:view': 'partner.view',
  'partners:create': 'partner.create',
  'partners:update': 'partner.update',
  'partners:delete': 'partner.delete',
  'documents:view': 'document.view',
  'documents:upload': 'document.upload',
  'documents:delete': 'document.delete',
  'reports:view': 'reports.view',
  'reports:export': 'reports.export',
  'users:view': 'users.view',
  'users:create': 'users.create',
  'users:update': 'users.update',
  'users:delete': 'users.delete',
  'settings:view': 'settings.view',
  'settings:update': 'settings.manage',
  'audit:view': 'audit.view',
};

export const ALL_PERMISSION_KEYS = PERMISSION_REGISTRY.map((p) => p.key);
