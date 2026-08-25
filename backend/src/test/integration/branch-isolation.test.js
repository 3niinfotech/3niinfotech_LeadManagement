/**
 * HTTP integration tests — branch isolation across Surat / Ahmedabad.
 * Run: npm run test:integration
 *
 * Requires: DATABASE_URL, seeded RBAC (npm run db:seed)
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import { createApp } from '../../app.js';
import {
  seedBranchIsolationFixtures,
  cleanupBranchIsolationFixtures,
} from '../helpers/branch-isolation-fixtures.js';
import {
  login,
  withAuth,
  expectStatus,
  collectIds,
  assertNoCrossBranchLeak,
  DEFAULT_PASSWORD,
} from '../helpers/http.js';

process.env.NODE_ENV = 'test';

let app;
let fx;
let tokens = {};

function ahmedabadIds() {
  return [
    fx.records.ahmedabadLead.id,
    fx.records.ahmedabadStudent.id,
    fx.records.ahmedabadApplication.id,
    fx.records.ahmedabadVisa.id,
    fx.records.ahmedabadEnquiry.id,
  ];
}

function suratIds() {
  return [
    fx.records.suratLead.id,
    fx.records.suratStudent.id,
    fx.records.suratApplication.id,
    fx.records.suratVisa.id,
    fx.records.suratEnquiry.id,
  ];
}

describe('Branch isolation — HTTP integration', () => {
  before(async () => {
    app = createApp();
    fx = await seedBranchIsolationFixtures();

    const logins = await Promise.all([
      login(app, fx.emails.suratCounsellor),
      login(app, fx.emails.ahmedabadCounsellor),
      login(app, fx.emails.suratReceptionist),
      login(app, fx.emails.ahmedabadReceptionist),
      login(app, fx.emails.multiBranchManager),
      login(app, fx.emails.superAdmin, 'Admin@123'),
    ]);

    tokens = {
      suratCounsellor: logins[0].token,
      ahmedabadCounsellor: logins[1].token,
      suratReceptionist: logins[2].token,
      ahmedabadReceptionist: logins[3].token,
      multiBranchManager: logins[4].token,
      superAdmin: logins[5].token,
    };
  });

  after(async () => {
    await cleanupBranchIsolationFixtures();
  });

  describe('Authentication boundary', () => {
    it('GET /api/leads without token returns 401 and no lead payload', async () => {
      const res = await request(app).get('/api/leads');
      expectStatus(res, 401);
      assert.equal(res.body.success, false);
      assertNoCrossBranchLeak(res.body, [...suratIds(), ...ahmedabadIds()], 'unauthenticated leads');
    });

    it('GET /uploads without token returns 401', async () => {
      const res = await request(app).get(`/uploads/${fx.uploadRelPath}`);
      expectStatus(res, 401);
    });
  });

  describe('GET /api/leads', () => {
    it('Surat counsellor lists only own Surat leads', async () => {
      const res = await withAuth(app, tokens.suratCounsellor).get('/api/leads');
      expectStatus(res, 200);
      const ids = collectIds(res.body.data);
      assert.ok(ids.includes(fx.records.suratLead.id), 'should include own Surat lead');
      assert.ok(!ids.includes(fx.records.ahmedabadLead.id), 'must not list Ahmedabad lead');
    });

    it('Surat receptionist lists Surat branch leads only', async () => {
      const res = await withAuth(app, tokens.suratReceptionist).get('/api/leads');
      expectStatus(res, 200);
      const ids = collectIds(res.body.data);
      assert.ok(ids.includes(fx.records.suratLead.id));
      assert.ok(!ids.includes(fx.records.ahmedabadLead.id));
    });

    it('Multi-branch manager lists leads from both branches', async () => {
      const res = await withAuth(app, tokens.multiBranchManager).get('/api/leads');
      expectStatus(res, 200);
      const ids = collectIds(res.body.data);
      assert.ok(ids.includes(fx.records.suratLead.id));
      assert.ok(ids.includes(fx.records.ahmedabadLead.id));
    });

    it('Surat counsellor forbidden branchId filter returns 403', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .get(`/api/leads?branchId=${fx.branches.HQ.id}`);
      expectStatus(res, 403);
      assertNoCrossBranchLeak(res.body, ahmedabadIds(), 'branchId filter 403');
    });
  });

  describe('GET /api/leads/:id — cross-branch record IDs', () => {
    it('Surat counsellor GET Ahmedabad lead → 403 without record data', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .get(`/api/leads/${fx.records.ahmedabadLead.id}`);
      expectStatus(res, 403);
      assert.match(res.body.message, /outside your access/i);
      assert.equal(res.body.data, undefined);
      assertNoCrossBranchLeak(res.body, [fx.records.ahmedabadLead.id], 'cross-branch lead get');
    });

    it('Surat counsellor GET own Surat lead → 200', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .get(`/api/leads/${fx.records.suratLead.id}`);
      expectStatus(res, 200);
      assert.equal(res.body.data.id, fx.records.suratLead.id);
    });

    it('Non-existent lead → 404', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000099';
      const res = await withAuth(app, tokens.suratCounsellor).get(`/api/leads/${fakeId}`);
      expectStatus(res, 404);
      assert.match(res.body.message, /not found/i);
    });
  });

  describe('POST/PUT /api/leads — create & branchId manipulation', () => {
    it('Surat counsellor creates lead in own branch (default)', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .post('/api/leads')
        .send({
          firstName: 'New',
          lastName: 'SuratLead',
          phone: '+919000000901',
        });
      expectStatus(res, 201);
      assert.equal(res.body.data.branchId, fx.branches.SUR.id);
    });

    it('Surat counsellor create with Ahmedabad branchId → 403', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .post('/api/leads')
        .send({
          firstName: 'Hack',
          lastName: 'CrossBranch',
          phone: '+919000000902',
          branchId: fx.branches.HQ.id,
        });
      expectStatus(res, 403);
      assertNoCrossBranchLeak(res.body, ahmedabadIds(), 'create lead cross-branch');
    });

    it('Surat counsellor update Ahmedabad lead → 403', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .put(`/api/leads/${fx.records.ahmedabadLead.id}`)
        .send({ notes: 'attempted hijack' });
      expectStatus(res, 403);
      assertNoCrossBranchLeak(res.body, [fx.records.ahmedabadLead.id], 'update cross-branch lead');
    });

    it('Surat counsellor cannot reassign lead to Ahmedabad branch', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .put(`/api/leads/${fx.records.suratLead.id}`)
        .send({ branchId: fx.branches.HQ.id });
      expectStatus(res, 403);
    });
  });

  describe('GET /api/applications', () => {
    it('Surat counsellor sees only Surat applications', async () => {
      const res = await withAuth(app, tokens.suratCounsellor).get('/api/applications');
      expectStatus(res, 200);
      const ids = collectIds(res.body.data);
      assert.ok(ids.includes(fx.records.suratApplication.id));
      assert.ok(!ids.includes(fx.records.ahmedabadApplication.id));
    });

    it('Cross-branch application by id → 403', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .get(`/api/applications/${fx.records.ahmedabadApplication.id}`);
      expectStatus(res, 403);
      assert.equal(res.body.data, undefined);
    });
  });

  describe('POST /api/applications — cross-branch studentId', () => {
    it('Surat counsellor cannot create application for Ahmedabad student', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .post('/api/applications')
        .send({
          studentId: fx.records.ahmedabadStudent.id,
          university: 'Hack Uni',
          course: 'MBA',
        });
      expectStatus(res, 403);
      assertNoCrossBranchLeak(res.body, [fx.records.ahmedabadStudent.id], 'create app cross-branch');
    });
  });

  describe('GET /api/visas', () => {
    it('Surat counsellor sees only Surat visas', async () => {
      const res = await withAuth(app, tokens.suratCounsellor).get('/api/visas');
      expectStatus(res, 200);
      const ids = collectIds(res.body.data);
      assert.ok(ids.includes(fx.records.suratVisa.id));
      assert.ok(!ids.includes(fx.records.ahmedabadVisa.id));
    });

    it('Cross-branch visa by id → 403', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .get(`/api/visas/${fx.records.ahmedabadVisa.id}`);
      expectStatus(res, 403);
      assert.equal(res.body.data, undefined);
    });
  });

  describe('GET /api/search', () => {
    it('Surat counsellor search does not return Ahmedabad records', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .get('/api/search?q=Iso');
      expectStatus(res, 200);
      assertNoCrossBranchLeak(res.body, [
        fx.records.ahmedabadLead.id,
        fx.records.ahmedabadStudent.id,
        fx.records.ahmedabadApplication.id,
        fx.records.ahmedabadVisa.id,
        fx.records.ahmedabadEnquiry.id,
      ], 'search cross-branch');
    });

    it('Multi-branch manager search includes both branches', async () => {
      const res = await withAuth(app, tokens.multiBranchManager)
        .get('/api/search?q=LeadIso');
      expectStatus(res, 200);
      const text = JSON.stringify(res.body.data);
      assert.ok(text.includes(fx.records.suratLead.id) || text.includes('Surat'));
      assert.ok(text.includes(fx.records.ahmedabadLead.id) || text.includes('Ahmedabad'));
    });
  });

  describe('GET /api/reports', () => {
    it('Surat counsellor forbidden branchId on reports → 403', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .get(`/api/reports/enquiries?branchId=${fx.branches.HQ.id}`);
      expectStatus(res, 403);
    });

    it('Surat receptionist cannot access reports (insufficient permissions)', async () => {
      const res = await withAuth(app, tokens.suratReceptionist).get('/api/reports/enquiries');
      expectStatus(res, 403, 'receptionist reports');
      assert.match(res.body.message, /insufficient permissions/i);
    });

    it('Surat receptionist cannot list users, invoices, or visas', async () => {
      expectStatus(await withAuth(app, tokens.suratReceptionist).get('/api/users'), 403, 'receptionist users');
      expectStatus(await withAuth(app, tokens.suratReceptionist).get('/api/invoices'), 403, 'receptionist invoices');
      expectStatus(await withAuth(app, tokens.suratReceptionist).get('/api/visas'), 403, 'receptionist visas');
    });

    it('Surat counsellor cannot list invoices', async () => {
      expectStatus(await withAuth(app, tokens.suratCounsellor).get('/api/invoices'), 403, 'counsellor invoices');
    });
  });

  describe('Unauthorized exports', () => {
    it('Surat receptionist export → 403', async () => {
      const res = await withAuth(app, tokens.suratReceptionist)
        .get('/api/reports/export/enquiry');
      expectStatus(res, 403);
      assert.match(res.body.message, /insufficient permissions/i);
    });

    it('Surat counsellor export → 403', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .get('/api/reports/export/enquiry');
      expectStatus(res, 403);
    });

    it('Multi-branch manager export excludes cross-branch apps for scoped counsellor scenario', async () => {
      // Operational head (company scope) may export all — verify Surat counsellor cannot export apps
      const res = await withAuth(app, tokens.suratCounsellor)
        .get('/api/reports/export/application');
      expectStatus(res, 403);
    });
  });

  describe('POST /api/enquiries/import/confirm — branchId manipulation', () => {
    it('Surat counsellor import to Ahmedabad branch → 403', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .post('/api/enquiries/import/confirm')
        .send({
          branchId: fx.branches.HQ.id,
          fileName: 'test.xlsx',
          rows: [{
            firstName: 'Import',
            lastName: 'Test',
            email: 'import.cross@test.local',
            mobile: '+919000000801',
          }],
        });
      expectStatus(res, 403);
    });

    it('Surat receptionist lacks import permission → 403', async () => {
      const res = await withAuth(app, tokens.suratReceptionist)
        .post('/api/enquiries/import/confirm')
        .send({
          branchId: fx.branches.SUR.id,
          fileName: 'test.xlsx',
          rows: [{
            firstName: 'Import',
            lastName: 'Reception',
            email: 'import.reception@test.local',
            mobile: '+919000000802',
          }],
        });
      expectStatus(res, 403);
      assert.match(res.body.message, /insufficient permissions/i);
    });
  });

  describe('GET /uploads — secure file access', () => {
    it('Surat counsellor can access own-branch enquiry upload', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .get(`/uploads/${fx.uploadRelPath}`);
      expectStatus(res, 200);
    });

    it('Ahmedabad counsellor denied Surat enquiry upload → 403', async () => {
      const res = await withAuth(app, tokens.ahmedabadCounsellor)
        .get(`/uploads/${fx.uploadRelPath}`);
      expectStatus(res, 403);
      assert.match(res.body.message, /outside your access|access denied/i);
    });

    it('Unauthenticated upload access → 401 before file served', async () => {
      const res = await request(app).get(`/uploads/${fx.uploadRelPath}`);
      expectStatus(res, 401);
    });
  });

  describe('Super Admin — full access', () => {
    it('Super Admin lists both branch leads', async () => {
      const res = await withAuth(app, tokens.superAdmin).get('/api/leads');
      expectStatus(res, 200);
      const ids = collectIds(res.body.data);
      assert.ok(ids.includes(fx.records.suratLead.id));
      assert.ok(ids.includes(fx.records.ahmedabadLead.id));
    });

    it('Super Admin GET cross-branch lead by id → 200', async () => {
      const res = await withAuth(app, tokens.superAdmin)
        .get(`/api/leads/${fx.records.ahmedabadLead.id}`);
      expectStatus(res, 200);
      assert.equal(res.body.data.id, fx.records.ahmedabadLead.id);
    });
  });

  describe('Receptionist branch boundary', () => {
    it('Ahmedabad receptionist cannot GET Surat lead → 403', async () => {
      const res = await withAuth(app, tokens.ahmedabadReceptionist)
        .get(`/api/leads/${fx.records.suratLead.id}`);
      expectStatus(res, 403);
      assert.equal(res.body.data, undefined);
    });

    it('Surat receptionist create with Ahmedabad branchId → 403', async () => {
      const res = await withAuth(app, tokens.suratReceptionist)
        .post('/api/leads')
        .send({
          firstName: 'Reception',
          lastName: 'CrossBranch',
          phone: '+919000000903',
          branchId: fx.branches.HQ.id,
        });
      expectStatus(res, 403);
    });
  });

  describe('Partner search isolation', () => {
    it('Surat counsellor search excludes Ahmedabad partner', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .get('/api/search?q=BranchIso Partner');
      expectStatus(res, 200);
      const text = JSON.stringify(res.body.data || res.body);
      assert.ok(text.includes('BranchIso Partner Surat') || text.includes(fx.records.suratPartner.id));
      assert.ok(!text.includes(fx.records.ahmedabadPartner.id));
    });
  });

  describe('Active branch switcher API', () => {
    it('Surat counsellor cannot switch viewing branch → 403', async () => {
      const res = await withAuth(app, tokens.suratCounsellor)
        .patch('/api/organization/viewing-branch')
        .send({ branchId: fx.branches.HQ.id });
      expectStatus(res, 403);
    });

    it('Receptionist cannot switch viewing branch → 403', async () => {
      const res = await withAuth(app, tokens.suratReceptionist)
        .patch('/api/organization/viewing-branch')
        .send({ branchId: fx.branches.HQ.id });
      expectStatus(res, 403);
    });

    it('Multi-branch manager can switch to Surat', async () => {
      const res = await withAuth(app, tokens.multiBranchManager)
        .patch('/api/organization/viewing-branch')
        .send({ branchId: fx.branches.SUR.id });
      expectStatus(res, 200);
      assert.equal(res.body.data.viewingBranchId, fx.branches.SUR.id);
    });

    it('After switching, Surat-only leads visible to manager', async () => {
      await withAuth(app, tokens.multiBranchManager)
        .patch('/api/organization/viewing-branch')
        .send({ branchId: fx.branches.SUR.id });
      const res = await withAuth(app, tokens.multiBranchManager).get('/api/leads');
      expectStatus(res, 200);
      const ids = collectIds(res.body.data);
      assert.ok(ids.includes(fx.records.suratLead.id));
      assert.ok(!ids.includes(fx.records.ahmedabadLead.id));
    });

    it('Super Admin can reset to all branches', async () => {
      const res = await withAuth(app, tokens.superAdmin)
        .patch('/api/organization/viewing-branch')
        .send({ branchId: 'ALL' });
      expectStatus(res, 200);
      assert.equal(res.body.data.viewingBranchId, null);
    });
  });

  describe('Removed visitor queue API', () => {
    it('GET /assignment/my-queue is no longer exposed', async () => {
      const res = await withAuth(app, tokens.suratCounsellor).get('/api/assignment/my-queue');
      expectStatus(res, 404);
    });
  });
});
