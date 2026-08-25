/**
 * Attendance + demo session HTTP tests (branch isolation, lock, duplicates).
 */
import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { createApp } from '../../app.js';
import {
  seedBranchIsolationFixtures,
  cleanupBranchIsolationFixtures,
} from '../helpers/branch-isolation-fixtures.js';
import { login, withAuth, expectStatus } from '../helpers/http.js';
import prisma from '../../config/database.js';

async function ensureAttendancePermissions() {
  const keys = ['attendance.view', 'attendance.mark', 'attendance.edit', 'attendance.correct', 'attendance.report'];
  const perms = [];
  for (const key of keys) {
    const perm = await prisma.permission.upsert({
      where: { key },
      update: { isActive: true },
      create: { key, module: 'attendance', action: key.split('.')[1], name: key, groupName: 'Attendance' },
    });
    perms.push(perm);
  }
  const grants = {
    counsellor: ['attendance.view', 'attendance.mark'],
    operational_head: keys,
    branch_manager: keys,
    team_leader: ['attendance.view', 'attendance.mark', 'attendance.edit', 'attendance.report'],
    super_admin: keys,
    company_admin: keys,
  };
  for (const [slug, grantKeys] of Object.entries(grants)) {
    const role = await prisma.role.findUnique({ where: { slug } });
    if (!role) continue;
    for (const key of grantKeys) {
      const perm = perms.find((p) => p.key === key);
      if (!perm) continue;
      await prisma.rolePermission.upsert({
        where: { roleId_permissionId: { roleId: role.id, permissionId: perm.id } },
        update: { granted: true },
        create: { roleId: role.id, permissionId: perm.id, granted: true },
      });
    }
  }
}

function hhmm(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

let app;
let fx;
let tokens = {};
let createdBatchId;

describe('Attendance isolation & demo sessions', () => {
  before(async () => {
    app = createApp();
    fx = await seedBranchIsolationFixtures();
    await ensureAttendancePermissions();
    tokens.suratCounsellor = (await login(app, fx.users.suratCounsellor.email)).token;
    tokens.ahmedabadCounsellor = (await login(app, fx.users.ahmedabadCounsellor.email)).token;
    tokens.suratReceptionist = (await login(app, fx.users.suratReceptionist.email)).token;
    tokens.manager = (await login(app, fx.users.multiBranchManager.email)).token;
  });

  after(async () => {
    if (createdBatchId) {
      await prisma.classAttendance.deleteMany({ where: { session: { batchId: createdBatchId } } });
      await prisma.classSession.deleteMany({ where: { batchId: createdBatchId } });
      await prisma.classTimetableSlot.deleteMany({ where: { batchId: createdBatchId } });
      await prisma.batchEnrollment.deleteMany({ where: { batchId: createdBatchId } });
      await prisma.academicBatch.deleteMany({ where: { id: createdBatchId } });
    }
    await cleanupBranchIsolationFixtures();
  });

  it('receptionist cannot create a batch', async () => {
    const res = await withAuth(app, tokens.suratReceptionist)
      .post('/api/academic/batches')
      .send({ name: 'Blocked', courseName: 'IELTS' });
    expectStatus(res, 403, 'receptionist create batch');
  });

  it('manager creates Surat batch, timetable, session and enrolls Surat student', async () => {
    const created = await withAuth(app, tokens.manager)
      .post('/api/academic/batches')
      .send({
        name: 'BR-ISO IELTS A',
        courseName: 'IELTS',
        branchId: fx.branches.SUR.id,
      });
    expectStatus(created, 201, 'create batch');
    createdBatchId = created.body.data.id;

    const now = new Date();
    const start = new Date(now.getTime() - 5 * 60 * 1000);
    const end = new Date(now.getTime() + 60 * 60 * 1000);
    const slot = await withAuth(app, tokens.manager)
      .post(`/api/academic/batches/${createdBatchId}/timetable`)
      .send({
        dayOfWeek: now.getDay(),
        startTime: hhmm(start),
        endTime: hhmm(end),
      });
    expectStatus(slot, 201, 'timetable');

    const from = now.toISOString().slice(0, 10);
    const gen = await withAuth(app, tokens.manager)
      .post(`/api/academic/batches/${createdBatchId}/sessions/generate`)
      .send({ from, to: from });
    expectStatus(gen, 200, 'generate');
    assert.ok((gen.body.data.created || 0) >= 1);

    const enroll = await withAuth(app, tokens.manager)
      .post(`/api/academic/batches/${createdBatchId}/enroll`)
      .send({ studentIds: [fx.records.suratStudent.id] });
    expectStatus(enroll, 200, 'enroll surat');
  });

  it('cannot enroll Ahmedabad student into Surat batch', async () => {
    const res = await withAuth(app, tokens.manager)
      .post(`/api/academic/batches/${createdBatchId}/enroll`)
      .send({ studentIds: [fx.records.ahmedabadStudent.id] });
    expectStatus(res, 403, 'cross-branch enroll');
  });

  it('Ahmedabad counsellor cannot read Surat batch', async () => {
    const res = await withAuth(app, tokens.ahmedabadCounsellor)
      .get(`/api/academic/batches/${createdBatchId}`);
    expectStatus(res, 403, 'cross-branch batch get');
  });

  it('Surat counsellor can bulk-mark, and a second save is idempotent', async () => {
    const list = await withAuth(app, tokens.suratCounsellor)
      .get(`/api/academic/sessions?batchId=${createdBatchId}`);
    expectStatus(list, 200);
    const session = (list.body.data || [])[0];
    assert.ok(session?.id, 'session exists');

    const payload = {
      entries: [{ studentId: fx.records.suratStudent.id, status: 'PRESENT' }],
    };
    const first = await withAuth(app, tokens.suratCounsellor)
      .put(`/api/academic/sessions/${session.id}/attendance`)
      .send(payload);
    expectStatus(first, 200, 'first save');

    const second = await withAuth(app, tokens.suratCounsellor)
      .put(`/api/academic/sessions/${session.id}/attendance`)
      .send(payload);
    expectStatus(second, 200, 'duplicate save');

    const roster = await withAuth(app, tokens.suratCounsellor)
      .get(`/api/academic/sessions/${session.id}/attendance`);
    expectStatus(roster, 200);
    const row = (roster.body.data.roster || []).find((r) => r.studentId === fx.records.suratStudent.id);
    assert.equal(row.status, 'PRESENT');
  });

  it('Ahmedabad counsellor cannot mark Surat session attendance', async () => {
    const list = await withAuth(app, tokens.manager)
      .get(`/api/academic/sessions?batchId=${createdBatchId}`);
    const session = (list.body.data || [])[0];
    const res = await withAuth(app, tokens.ahmedabadCounsellor)
      .put(`/api/academic/sessions/${session.id}/attendance`)
      .send({ entries: [{ studentId: fx.records.suratStudent.id, status: 'ABSENT' }] });
    expectStatus(res, 403, 'cross-branch mark');
  });

  it('receptionist cannot mark attendance', async () => {
    const list = await withAuth(app, tokens.manager)
      .get(`/api/academic/sessions?batchId=${createdBatchId}`);
    const session = (list.body.data || [])[0];
    const res = await withAuth(app, tokens.suratReceptionist)
      .put(`/api/academic/sessions/${session.id}/attendance`)
      .send({ entries: [{ studentId: fx.records.suratStudent.id, status: 'ABSENT' }] });
    expectStatus(res, 403, 'receptionist mark');
  });

  it('demo attendance is separate from session status; reschedule keeps history', async () => {
    const start = new Date();
    const created = await withAuth(app, tokens.suratCounsellor)
      .post(`/api/enquiries/${fx.records.suratEnquiry.id}/demos`)
      .send({
        demoDate: start.toISOString(),
        endAt: new Date(start.getTime() + 60 * 60 * 1000).toISOString(),
        className: 'IELTS',
        attendance: 'NOT_MARKED',
      });
    expectStatus(created, 201, 'create demo');
    const demoId = created.body.data.id;
    assert.equal(created.body.data.sessionStatus, 'SCHEDULED');
    assert.equal(created.body.data.attendance, 'NOT_MARKED');

    const marked = await withAuth(app, tokens.suratCounsellor)
      .patch(`/api/enquiries/${fx.records.suratEnquiry.id}/demos/${demoId}/attendance`)
      .send({ attendance: 'ATTENDED' });
    expectStatus(marked, 200, 'mark demo');
    assert.equal(marked.body.data.attendance, 'ATTENDED');
    assert.equal(marked.body.data.sessionStatus, 'SCHEDULED');

    const nextDate = new Date(start.getTime() + 2 * 24 * 60 * 60 * 1000);
    const rescheduled = await withAuth(app, tokens.suratCounsellor)
      .post(`/api/enquiries/${fx.records.suratEnquiry.id}/demos/${demoId}/reschedule`)
      .send({ demoDate: nextDate.toISOString() });
    expectStatus(rescheduled, 200, 'reschedule');
    assert.equal(rescheduled.body.data.current.sessionStatus, 'SCHEDULED');
    assert.equal(rescheduled.body.data.current.attendance, 'NOT_MARKED');

    const blocked = await withAuth(app, tokens.suratCounsellor)
      .patch(`/api/enquiries/${fx.records.suratEnquiry.id}/demos/${demoId}/attendance`)
      .send({ attendance: 'NO_SHOW' });
    expectStatus(blocked, 409, 'historical session cannot be marked');
  });
});
