import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { getDefaultRoute, ADMIN_ROLE_SLUGS } from '../../../config/portal.config.js';
import { DEFAULT_ROLES } from '../../../config/default-roles.js';
import { academicBranchScope } from '../../attendance/attendance.scope.js';
import { mergeScope } from '../../../utils/tenant.util.js';
import { sanitizePermissionKeysForRole } from '../../../config/access-policy.js';
import {
  dashboardVisibleFlags,
  pickDashboardCards,
} from '../../dashboard/dashboard.visibility.js';

describe('role workspace defaults', () => {
  it('includes Teacher in default roles and admin portal', () => {
    const teacher = DEFAULT_ROLES.find((r) => r.slug === 'teacher');
    assert.ok(teacher);
    assert.equal(teacher.dataScope, 'BRANCH');
    assert.ok(teacher.permissions.includes('attendance.mark'));
    assert.ok(!teacher.permissions.includes('attendance.correct'));
    assert.ok(!teacher.permissions.includes('branch.switch'));
    assert.ok(ADMIN_ROLE_SLUGS.includes('teacher'));
  });

  it('sends each major role to its workspace, not a shared dashboard when they have a home', () => {
    const cases = [
      ['receptionist', '/admin/reception'],
      ['counsellor', '/admin/enquiries'],
      ['teacher', '/admin/dashboard'],
      ['application_officer', '/admin/applications'],
      ['visa_officer', '/admin/visas'],
      ['finance_manager', '/admin/fees'],
      ['student_portal', '/student/dashboard'],
      ['partner', '/agent/dashboard'],
    ];
    for (const [slug, route] of cases) {
      const portal = slug === 'student_portal' ? 'student' : slug === 'partner' ? 'agent' : 'admin';
      assert.equal(getDefaultRoute(portal, { role: { slug } }), route, slug);
    }
  });

  it('receptionist and teacher never receive branch switch keys in the default grant', () => {
    for (const slug of ['receptionist', 'teacher', 'counsellor']) {
      const role = DEFAULT_ROLES.find((r) => r.slug === slug);
      assert.ok(!role.permissions.includes('branch.switch'));
      assert.ok(!role.permissions.includes('branch.view_multiple'));
    }
  });
});

describe('academicBranchScope teacher / student', () => {
  const base = {
    id: 'u-teacher',
    companyId: 'co1',
    branchId: 'br-surat',
    dataScope: 'BRANCH',
    permissions: ['attendance.view', 'attendance.mark'],
  };

  it('clamps teacher lists to instructorId', () => {
    const where = academicBranchScope({
      ...base,
      role: { slug: 'teacher', dataScope: 'BRANCH' },
    });
    const parts = where.AND || [where];
    assert.ok(parts.some((p) => p.instructorId === 'u-teacher'));
  });

  it('clamps student portal batches to own enrollments', () => {
    const where = academicBranchScope({
      id: 'u-student',
      companyId: 'co1',
      branchId: 'br-surat',
      dataScope: 'OWN',
      permissions: ['attendance.view'],
      role: { slug: 'student_portal', dataScope: 'OWN' },
    }, 'batch');
    const parts = where.AND || [where];
    assert.ok(parts.some((p) => p.enrollments?.some?.student || p.enrollments));
  });
});

describe('role permission defaults', () => {
  it('calendar is available to operational, finance, document, compliance, and portal roles', () => {
    const slugs = [
      'receptionist',
      'counsellor',
      'teacher',
      'application_officer',
      'visa_officer',
      'finance_manager',
      'finance_executive',
      'marketing_manager',
      'marketing_executive',
      'telecaller',
      'document_executive',
      'compliance_officer',
      'student_portal',
      'partner',
    ];
    for (const slug of slugs) {
      const role = DEFAULT_ROLES.find((item) => item.slug === slug);
      assert.ok(role?.permissions.includes('calendar.view'), `${slug} calendar.view`);
    }
  });

  it('receptionist is limited to reception and calendar workspace permissions', () => {
    const role = DEFAULT_ROLES.find((r) => r.slug === 'receptionist');
    assert.ok(role.permissions.includes('reception.walkin.view'));
    assert.ok(role.permissions.includes('calendar.view'));
    assert.ok(role.permissions.includes('calendar.reschedule'));
    assert.ok(!role.permissions.includes('enquiry.view'));
    assert.ok(!role.permissions.includes('lead.view'));
    assert.ok(!role.permissions.includes('student.view'));
    assert.ok(!role.permissions.includes('accounts.invoice.view'));
    assert.ok(!role.permissions.includes('roles.view'));
    assert.ok(!role.permissions.includes('attendance.mark'));
  });

  it('teacher has class attendance mark but no CRM enquiry or teacher-admin keys', () => {
    const role = DEFAULT_ROLES.find((r) => r.slug === 'teacher');
    assert.ok(role.permissions.includes('attendance.mark'));
    assert.ok(!role.permissions.includes('enquiry.view'));
    assert.ok(!role.permissions.includes('accounts.invoice.view'));
    assert.ok(!role.permissions.includes('application.view'));
  });

  it('partner default grant is own-portal only', () => {
    const role = DEFAULT_ROLES.find((r) => r.slug === 'partner');
    assert.ok(role.permissions.includes('calendar.view'));
    assert.ok(role.permissions.includes('calendar.create'));
    assert.ok(!role.permissions.includes('users.view'));
    assert.ok(!role.permissions.includes('settings.view'));
    assert.equal(role.dataScope, 'OWN');
  });
});

describe('mergeScope ownership', () => {
  it('clamps teacher student lists to instructed batch enrollments', () => {
    const where = mergeScope({
      id: 'u-teacher',
      companyId: 'co1',
      branchId: 'br-surat',
      dataScope: 'BRANCH',
      permissions: ['student.view'],
      role: { slug: 'teacher', dataScope: 'BRANCH' },
    }, { entity: 'student' });
    const parts = where.AND || [where];
    assert.ok(parts.some((p) => p.batchEnrollments?.some?.batch));
  });

  it('does not apply teacher enrollment clamp to lead lists', () => {
    const where = mergeScope({
      id: 'u-teacher',
      companyId: 'co1',
      branchId: 'br-surat',
      dataScope: 'BRANCH',
      permissions: ['lead.view'],
      role: { slug: 'teacher', dataScope: 'BRANCH' },
    });
    const blob = JSON.stringify(where);
    assert.equal(blob.includes('batchEnrollments'), false);
  });

  it('clamps partner students to own partner userId', () => {
    const where = mergeScope({
      id: 'u-partner',
      companyId: 'co1',
      branchId: 'br-surat',
      dataScope: 'OWN',
      permissions: ['student.view'],
      role: { slug: 'partner', dataScope: 'OWN' },
    }, { entity: 'student' });
    const parts = where.AND || [where];
    assert.ok(parts.some((p) => p.partner?.userId === 'u-partner'));
  });

  it('clamps student portal to own userId', () => {
    const where = mergeScope({
      id: 'u-student',
      companyId: 'co1',
      branchId: 'br-surat',
      dataScope: 'OWN',
      permissions: ['student.view'],
      role: { slug: 'student_portal', dataScope: 'OWN' },
    }, { entity: 'student' });
    const parts = where.AND || [where];
    assert.ok(parts.some((p) => p.userId === 'u-student'));
  });
});

function userFromRole(slug, extraPermissions = []) {
  const role = DEFAULT_ROLES.find((r) => r.slug === slug);
  return {
    id: `u-${slug}`,
    dataScope: role.dataScope,
    permissions: [...role.permissions, ...extraPermissions],
    role: { slug, dataScope: role.dataScope },
  };
}

describe('dashboard payload does not leak unauthorized widgets', () => {
  it('receptionist receives walk-ins, never CRM, finance or class widgets', () => {
    const visible = dashboardVisibleFlags(userFromRole('receptionist'));
    assert.equal(visible.finance, false);
    assert.equal(visible.classes, false);
    assert.equal(visible.demos, false);
    assert.equal(visible.walkins, true);
    assert.equal(visible.visas, false);
    assert.equal(visible.applications, false);
    const cards = pickDashboardCards({
      revenueThisMonth: { _sum: { total: 99999 } },
      todayWalkIns: 3,
      totalStudents: 10,
    }, visible);
    assert.equal('revenueThisMonth' in cards, false);
    assert.equal(cards.todayWalkIns, 3);
    assert.equal('totalStudents' in cards, false);
  });

  it('teacher receives class widgets and assigned students, never finance or CRM demos', () => {
    const visible = dashboardVisibleFlags(userFromRole('teacher'));
    assert.equal(visible.finance, false);
    assert.equal(visible.classes, true);
    assert.equal(visible.demos, false);
    assert.equal(visible.enquiries, false);
    assert.equal(visible.students, true);
    const cards = pickDashboardCards({
      revenueThisMonth: 500,
      totalStudents: 4,
      totalEnquiries: 80,
    }, visible);
    assert.equal('revenueThisMonth' in cards, false);
    assert.equal('totalEnquiries' in cards, false);
    assert.equal(cards.totalStudents, 4);
  });

  it('finance manager receives revenue, not class or demo widgets', () => {
    const visible = dashboardVisibleFlags(userFromRole('finance_manager'));
    assert.equal(visible.finance, true);
    assert.equal(visible.classes, false);
    assert.equal(visible.demos, false);
    assert.equal(visible.students, true);
    const cards = pickDashboardCards({ revenueThisMonth: { _sum: { total: 1200 } } }, visible);
    assert.equal(cards.revenueThisMonth, 1200);
  });

  it('counsellor has no reception keys in the default grant', () => {
    const role = DEFAULT_ROLES.find((r) => r.slug === 'counsellor');
    assert.ok(role.permissions.includes('enquiry.view'));
    assert.ok(!role.permissions.some((k) => String(k).startsWith('reception.')));
  });

  it('counsellor does not receive unassigned-lead pool stats', () => {
    const visible = dashboardVisibleFlags(userFromRole('counsellor'));
    assert.equal(visible.unassignedLeads, false);
    assert.equal(visible.walkins, false);
    assert.equal(visible.leads, true);
    assert.equal(visible.demos, true);
    const cards = pickDashboardCards({ unassignedLeads: 40, totalLeads: 2 }, visible);
    assert.equal('unassignedLeads' in cards, false);
    assert.equal(cards.totalLeads, 2);
  });
});

describe('runtime permission deny list', () => {
    it('strips all non-workspace keys from receptionist even if granted in DB', () => {
    const teacher = sanitizePermissionKeysForRole('teacher', [
      'attendance.mark', 'accounts.invoice.view', 'application.view', 'visa.view',
    ]);
    assert.deepEqual(teacher, ['attendance.mark']);
    const receptionist = sanitizePermissionKeysForRole('receptionist', [
      'dashboard.view', 'reception.walkin.view', 'calendar.view',
      'enquiry.view', 'accounts.invoice.view', 'application.view', 'roles.view',
    ]);
    assert.deepEqual(receptionist, ['dashboard.view', 'reception.walkin.view', 'calendar.view']);
    const counsellor = sanitizePermissionKeysForRole('counsellor', [
      'enquiry.view', 'accounts.invoice.view', 'application.view', 'reception.walkin.view',
    ]);
    assert.deepEqual(counsellor, ['enquiry.view', 'application.view']);
  });
});

