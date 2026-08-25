/**
 * Unit tests for branch access policy (Phase 1 security).
 * Run: node --test src/utils/__tests__/branch-access.test.js
 */
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveBranchAccessPolicy,
  isBranchIdAllowedByPolicy,
} from '../branch-access.policy.js';
import { canSwitchViewingBranch } from '../tenant.util.js';

const SURAT = 'branch-surat-uuid';
const AHMEDABAD = 'branch-ahm-uuid';

describe('resolveBranchAccessPolicy', () => {
  it('counsellor (OWN + home branch) only lists home branch', () => {
    const policy = resolveBranchAccessPolicy({
      id: 'u1',
      companyId: 'co1',
      branchId: SURAT,
      dataScope: 'OWN',
      permissions: ['lead.view'],
      role: { slug: 'counsellor', dataScope: 'OWN' },
    });
    assert.equal(policy.mode, 'LIST');
    assert.deepEqual(policy.branchIds, [SURAT]);
    assert.equal(isBranchIdAllowedByPolicy(policy, SURAT), true);
    assert.equal(isBranchIdAllowedByPolicy(policy, AHMEDABAD), false);
  });

  it('BRANCH scope without branch.switch cannot use other branch', () => {
    const policy = resolveBranchAccessPolicy({
      companyId: 'co1',
      branchId: SURAT,
      dataScope: 'BRANCH',
      permissions: ['enquiry.view'],
      role: { slug: 'receptionist' },
    });
    assert.equal(isBranchIdAllowedByPolicy(policy, AHMEDABAD), false);
  });

  it('COMPANY scope can access any company branch (policy mode COMPANY)', () => {
    const policy = resolveBranchAccessPolicy({
      companyId: 'co1',
      branchId: SURAT,
      dataScope: 'COMPANY',
      permissions: [],
      role: { slug: 'company_admin' },
    });
    assert.equal(policy.mode, 'COMPANY');
    assert.equal(isBranchIdAllowedByPolicy(policy, AHMEDABAD), true);
  });

  it('branch.switch grants multi-branch policy without COMPANY scope', () => {
    const policy = resolveBranchAccessPolicy({
      companyId: 'co1',
      branchId: SURAT,
      dataScope: 'BRANCH',
      permissions: ['branch.switch'],
      role: { slug: 'operational_head' },
    });
    assert.equal(policy.mode, 'COMPANY');
    assert.equal(isBranchIdAllowedByPolicy(policy, AHMEDABAD), true);
  });

  it('branch.view_multiple grants multi-branch policy', () => {
    const policy = resolveBranchAccessPolicy({
      companyId: 'co1',
      branchId: SURAT,
      dataScope: 'OWN',
      permissions: ['branch.view_multiple'],
      role: { slug: 'manager' },
    });
    assert.equal(policy.mode, 'COMPANY');
  });

  it('modifying branchId in request is denied by policy for field user', () => {
    const policy = resolveBranchAccessPolicy({
      companyId: 'co1',
      branchId: SURAT,
      dataScope: 'BRANCH',
      permissions: ['reception.walkin.create'],
      role: { slug: 'receptionist' },
    });
    // Spoofed Ahmedabad branchId must fail
    assert.equal(isBranchIdAllowedByPolicy(policy, AHMEDABAD), false);
  });

  it('allowedBranchIds extends LIST for multi-branch manager without switch perm', () => {
    const policy = resolveBranchAccessPolicy({
      companyId: 'co1',
      branchId: SURAT,
      allowedBranchIds: [SURAT, AHMEDABAD],
      dataScope: 'BRANCH',
      permissions: [],
      role: { slug: 'branch_manager' },
    });
    assert.equal(policy.mode, 'LIST');
    assert.equal(isBranchIdAllowedByPolicy(policy, AHMEDABAD), true);
  });
});

describe('canSwitchViewingBranch', () => {
  it('requires both branch.switch and branch.view_multiple', () => {
    assert.equal(canSwitchViewingBranch({
      permissions: ['branch.switch', 'branch.view_multiple'],
    }), true);
    assert.equal(canSwitchViewingBranch({ permissions: ['branch.switch'] }), false);
    assert.equal(canSwitchViewingBranch({ permissions: ['branch.view_multiple'] }), false);
    assert.equal(canSwitchViewingBranch({ permissions: [] }), false);
  });

  it('field roles without branch keys cannot switch', () => {
    for (const slug of ['receptionist', 'counsellor', 'teacher', 'student_portal']) {
      assert.equal(canSwitchViewingBranch({
        permissions: ['lead.view', 'dashboard.view'],
        role: { slug },
      }), false);
    }
  });
});
