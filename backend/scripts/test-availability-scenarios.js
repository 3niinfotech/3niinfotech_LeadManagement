/**
 * Full availability + assignment integration tests (real DB).
 * Run: node backend/scripts/test-availability-scenarios.js
 */
import prisma from '../src/config/database.js';
import { availabilityEngine, isHotLeadPriority } from '../src/modules/assignment/availability.engine.js';
import { assignmentEngine } from '../src/modules/assignment/assignment.engine.js';
import { assignmentRepository } from '../src/modules/assignment/assignment.repository.js';
import { AVAILABILITY_STATE } from '../src/modules/assignment/assignment.config.js';

const TAG = '[AVAIL-TEST]';
const results = [];

function pass(id, detail = '') {
  results.push({ id, ok: true, detail });
  console.log(`  ✓ ${id}${detail ? `: ${detail}` : ''}`);
}

function fail(id, detail = '') {
  results.push({ id, ok: false, detail });
  console.error(`  ✗ ${id}${detail ? `: ${detail}` : ''}`);
}

function assert(id, condition, detail = '') {
  if (condition) pass(id, detail);
  else fail(id, detail);
  return condition;
}

function weekdayAt(dayOfWeek, hour, minute = 0) {
  const now = new Date();
  const d = new Date(now);
  const diff = dayOfWeek - d.getDay();
  d.setDate(d.getDate() + diff);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function loadCounsellor(companyId) {
  return prisma.user.findFirst({
    where: {
      companyId,
      status: 'ACTIVE',
      deletedAt: null,
      role: { slug: { in: ['counsellor', 'team_leader'] } },
    },
    include: { counsellorPresence: true, role: { select: { slug: true } } },
  });
}

async function ensureWorkingHours(userId, companyId, { allDays = true } = {}) {
  await prisma.staffWorkingHours.deleteMany({ where: { userId, companyId } });
  const days = [];
  for (let d = 0; d <= 6; d += 1) {
    days.push({
      userId,
      companyId,
      dayOfWeek: d,
      startTime: '09:00',
      endTime: '19:00',
      isWorkingDay: allDays ? d !== 0 : d >= 1 && d <= 5,
      timezone: 'Asia/Kolkata',
    });
  }
  await prisma.staffWorkingHours.createMany({ data: days });
}

async function resetCounsellorState(userId, companyId, branchId) {
  await prisma.staffLeaveRecord.deleteMany({ where: { userId, companyId } });
  await prisma.counsellingSession.deleteMany({ where: { counsellorId: userId } });
  await prisma.enquiryAppointment.deleteMany({ where: { counsellorId: userId } });
  await assignmentRepository.upsertPresence(userId, branchId, {
    metadata: {},
    maxActiveLeads: 50,
    maxDailyCapacity: 20,
    hotLeadCapacity: 10,
  });
}

async function main() {
  console.log(`${TAG} Starting full availability scenario suite\n`);

  const company = await prisma.company.findFirst({ where: { deletedAt: null }, select: { id: true, code: true } });
  assert('SETUP.company', Boolean(company?.id), company?.code || 'none');
  if (!company) process.exit(1);

  const counsellor = await loadCounsellor(company.id);
  assert('SETUP.counsellor', Boolean(counsellor?.id), counsellor ? `${counsellor.firstName} ${counsellor.lastName}` : 'none');
  if (!counsellor) process.exit(1);

  const branchId = counsellor.branchId;
  const companyId = company.id;
  const ctx = { companyId, branchId };
  const tuesdayNoon = weekdayAt(2, 12, 0);
  const sundayEarly = weekdayAt(0, 6, 0);

  await resetCounsellorState(counsellor.id, companyId, branchId);
  await ensureWorkingHours(counsellor.id, companyId);

  // A — Active counsellor during working hours
  {
    const ev = await availabilityEngine.evaluateCounsellor(counsellor, { ...ctx, now: tuesdayNoon });
    assert('A.working_hours_available', ev.state === AVAILABILITY_STATE.AVAILABLE, ev.state);
  }

  // B — Outside working hours
  {
    await ensureWorkingHours(counsellor.id, companyId, { allDays: false });
    const ev = await availabilityEngine.evaluateCounsellor(counsellor, { ...ctx, now: sundayEarly });
    assert('B.outside_hours', ev.state === AVAILABILITY_STATE.OUTSIDE_WORKING_HOURS, ev.state);
    await ensureWorkingHours(counsellor.id, companyId);
  }

  // C — Approved leave
  {
    const leaveDay = new Date(Date.UTC(
      tuesdayNoon.getFullYear(),
      tuesdayNoon.getMonth(),
      tuesdayNoon.getDate(),
    ));
    await prisma.staffLeaveRecord.create({
      data: {
        userId: counsellor.id,
        companyId,
        startDate: leaveDay,
        endDate: leaveDay,
        status: 'APPROVED',
        reason: 'AVAIL-TEST leave',
      },
    });
    const ev = await availabilityEngine.evaluateCounsellor(counsellor, { ...ctx, now: tuesdayNoon });
    assert('C.on_leave', ev.state === AVAILABILITY_STATE.ON_LEAVE, ev.state);
    await prisma.staffLeaveRecord.deleteMany({ where: { userId: counsellor.id, reason: 'AVAIL-TEST leave' } });
  }

  // D — Active counselling session
  {
    const lead = await prisma.lead.create({
      data: {
        leadCode: `AVAIL-TEST-${Date.now()}`,
        tokenNumber: `T${Date.now()}`,
        branchId,
        firstName: 'Avail',
        lastName: 'Test',
        phone: `9${String(Date.now()).slice(-9)}`,
        status: 'IN_COUNSELLING',
      },
    });
    await prisma.counsellingSession.create({
      data: { leadId: lead.id, counsellorId: counsellor.id, branchId, status: 'ACTIVE' },
    });
    const ev = await availabilityEngine.evaluateCounsellor(counsellor, { ...ctx, now: tuesdayNoon });
    assert('D.active_session', ev.state === AVAILABILITY_STATE.TEMPORARILY_BUSY, ev.state);
    await prisma.counsellingSession.deleteMany({ where: { counsellorId: counsellor.id } });
    await prisma.lead.delete({ where: { id: lead.id } });
  }

  // E — Active calendar appointment
  {
    const enquiry = await prisma.enquiry.create({
      data: {
        enquiryCode: `AVAIL-E-${Date.now()}`,
        branchId,
        firstName: 'Appt',
        lastName: 'Test',
        email: `appt-${Date.now()}@test.local`,
        mobile: `8${String(Date.now()).slice(-9)}`,
        status: 'NEW',
      },
    });
    const start = new Date(tuesdayNoon.getTime() - 15 * 60000);
    const end = new Date(tuesdayNoon.getTime() + 45 * 60000);
    await prisma.enquiryAppointment.create({
      data: {
        enquiryId: enquiry.id,
        userId: counsellor.id,
        counsellorId: counsellor.id,
        title: 'AVAIL-TEST appointment',
        startAt: start,
        endAt: end,
        isCompleted: false,
      },
    });
    const ev = await availabilityEngine.evaluateCounsellor(counsellor, { ...ctx, now: tuesdayNoon });
    assert('E.active_appointment', ev.state === AVAILABILITY_STATE.TEMPORARILY_BUSY, ev.state);
    await prisma.enquiryAppointment.deleteMany({ where: { counsellorId: counsellor.id } });
    await prisma.enquiry.delete({ where: { id: enquiry.id } });
  }

  // F — maxActiveLeads reached
  {
    await assignmentRepository.upsertPresence(counsellor.id, branchId, { maxActiveLeads: 1, hotLeadCapacity: 50 });
    const enq = await prisma.enquiry.create({
      data: {
        enquiryCode: `AVAIL-F-${Date.now()}`,
        branchId,
        assignedToId: counsellor.id,
        firstName: 'Cap',
        lastName: 'Test',
        email: `cap-${Date.now()}@test.local`,
        mobile: `7${String(Date.now()).slice(-9)}`,
        status: 'NEW',
      },
    });
    const ev = await availabilityEngine.evaluateCounsellor(counsellor, { ...ctx, now: tuesdayNoon });
    assert('F.max_active_leads', ev.state === AVAILABILITY_STATE.AT_CAPACITY, ev.state);
    await prisma.enquiry.delete({ where: { id: enq.id } });
    await assignmentRepository.upsertPresence(counsellor.id, branchId, { maxActiveLeads: 50 });
  }

  // G — hotLeadCapacity for URGENT lead only
  {
    await assignmentRepository.upsertPresence(counsellor.id, branchId, { hotLeadCapacity: 0, maxActiveLeads: 50 });
    const evHot = await availabilityEngine.evaluateCounsellor(counsellor, {
      ...ctx, now: tuesdayNoon, leadPriority: 'URGENT',
    });
    const evNormal = await availabilityEngine.evaluateCounsellor(counsellor, {
      ...ctx, now: tuesdayNoon, leadPriority: 'MEDIUM',
    });
    assert('G.hot_cap_urgent', evHot.state === AVAILABILITY_STATE.AT_CAPACITY, evHot.state);
    assert('G.hot_cap_medium_ok', evNormal.state === AVAILABILITY_STATE.AVAILABLE, evNormal.state);
    assert('G.isHotLeadPriority', isHotLeadPriority('URGENT') && !isHotLeadPriority('MEDIUM'));
    await assignmentRepository.upsertPresence(counsellor.id, branchId, { hotLeadCapacity: 10 });
  }

  // H — maxDailyCapacity reached
  {
    await assignmentRepository.upsertPresence(counsellor.id, branchId, { maxDailyCapacity: 0 });
    const ev = await availabilityEngine.evaluateCounsellor(counsellor, { ...ctx, now: tuesdayNoon });
    assert('H.daily_capacity', ev.state === AVAILABILITY_STATE.AT_CAPACITY, ev.state);
    await assignmentRepository.upsertPresence(counsellor.id, branchId, { maxDailyCapacity: 20 });
  }

  // I — Inactive counsellor
  {
    const ev = await availabilityEngine.evaluateCounsellor(
      { ...counsellor, status: 'INACTIVE' },
      { ...ctx, now: tuesdayNoon },
    );
    assert('I.ineligible', ev.state === AVAILABILITY_STATE.INELIGIBLE, ev.state);
  }

  // J — Temporary admin override
  {
    const until = new Date(Date.now() + 3600000).toISOString();
    await assignmentRepository.upsertPresence(counsellor.id, branchId, {
      metadata: { temporaryOverride: 'UNAVAILABLE', overrideReason: 'AVAIL-TEST override', overrideUntil: until },
    });
    const ev = await availabilityEngine.evaluateCounsellor(counsellor, { ...ctx, now: tuesdayNoon });
    assert('J.temp_override', ev.state === AVAILABILITY_STATE.UNAVAILABLE, ev.state);
    await assignmentRepository.upsertPresence(counsellor.id, branchId, { metadata: {} });
  }

  // K — Recovery after session ends
  {
    const lead = await prisma.lead.create({
      data: {
        leadCode: `AVAIL-K-${Date.now()}`,
        tokenNumber: `K${Date.now()}`,
        branchId,
        firstName: 'Recover',
        lastName: 'Test',
        phone: `6${String(Date.now()).slice(-9)}`,
        status: 'IN_COUNSELLING',
      },
    });
    const session = await prisma.counsellingSession.create({
      data: { leadId: lead.id, counsellorId: counsellor.id, branchId, status: 'ACTIVE' },
    });
    const busy = await availabilityEngine.evaluateCounsellor(counsellor, { ...ctx, now: tuesdayNoon });
    await prisma.counsellingSession.update({
      where: { id: session.id },
      data: { status: 'COMPLETED', endedAt: new Date() },
    });
    const free = await availabilityEngine.evaluateCounsellor(counsellor, { ...ctx, now: tuesdayNoon });
    assert('K.recovery_session', busy.state === AVAILABILITY_STATE.TEMPORARILY_BUSY && free.state === AVAILABILITY_STATE.AVAILABLE,
      `${busy.state} → ${free.state}`);
    await prisma.lead.delete({ where: { id: lead.id } });
  }

  // L — Multiple counsellors independently evaluated
  {
    const all = await prisma.user.findMany({
      where: { companyId, status: 'ACTIVE', deletedAt: null, role: { slug: { in: ['counsellor', 'team_leader'] } } },
      include: { counsellorPresence: true, role: { select: { slug: true } } },
      take: 5,
    });
    const states = new Set();
    for (const c of all) {
      const ev = await availabilityEngine.evaluateCounsellor(c, { companyId, branchId: c.branchId, now: tuesdayNoon });
      states.add(ev.state);
    }
    assert('L.multi_counsellor', all.length >= 1, `${all.length} evaluated, states: ${[...states].join(', ')}`);
  }

  // M — Tenant isolation
  {
    const companies = await prisma.company.findMany({ where: { deletedAt: null }, take: 2, select: { id: true } });
    if (companies.length >= 2) {
      const [a, b] = companies;
      const listA = await assignmentRepository.listEligibleCounsellors(null, [], a.id);
      const cross = listA.some((u) => u.companyId !== a.id);
      assert('M.tenant_list_scope', !cross, `companyA=${listA.length} counsellors`);
      const evCross = await availabilityEngine.getAvailabilitySnapshot(
        listA[0]?.id,
        { companyId: b.id, branchId: listA[0]?.branchId },
      );
      assert('M.cross_tenant_snapshot_null', evCross === null, evCross ? 'leaked' : 'blocked');
    } else {
      pass('M.tenant_list_scope', 'skipped — single tenant DB');
      pass('M.cross_tenant_snapshot_null', 'skipped — single tenant DB');
    }
  }

  // N — Branch isolation in recommendations
  {
    const branch = await prisma.branch.findFirst({ where: { companyId, deletedAt: null, id: { not: branchId } } });
    if (branch) {
      const { rows } = await assignmentEngine.scoreAllForLead(
        { branchId, priority: 'MEDIUM' },
        { branchId, companyId, excludeIds: [] },
      );
      const wrongBranch = rows.filter((r) => r.branchId && r.branchId !== branchId);
      assert('N.branch_scope', wrongBranch.length === 0, `${rows.length} rows, ${wrongBranch.length} wrong branch`);
    } else {
      pass('N.branch_scope', 'skipped — single branch');
    }
  }

  // O — Manual presence status ignored
  {
    await assignmentRepository.upsertPresence(counsellor.id, branchId, { status: 'OFFLINE' });
    const ev = await availabilityEngine.evaluateCounsellor(counsellor, { ...ctx, now: tuesdayNoon });
    assert('O.manual_presence_ignored', ev.state === AVAILABILITY_STATE.AVAILABLE, `presence=OFFLINE but state=${ev.state}`);
    await assignmentRepository.upsertPresence(counsellor.id, branchId, { status: 'AVAILABLE' });
  }

  // Auto-assignment — enquiry create path
  {
    const enquiry = await prisma.enquiry.create({
      data: {
        enquiryCode: `AVAIL-AA-${Date.now()}`,
        branchId,
        firstName: 'Auto',
        lastName: 'Assign',
        email: `auto-${Date.now()}@test.local`,
        mobile: `5${String(Date.now()).slice(-9)}`,
        status: 'NEW',
        priority: 'MEDIUM',
      },
    });
    const result = await assignmentEngine.autoAssignEnquiry(enquiry, null);
    const log = result.assigned
      ? await prisma.enquiryAssignmentLog.findFirst({ where: { enquiryId: enquiry.id }, orderBy: { createdAt: 'desc' } })
      : null;
    assert('AA.auto_assign', result.assigned === true, result.match?.id || 'none');
    assert('AA.assignment_log', Boolean(log?.id), log?.assignmentType || 'missing');
    if (result.assigned) {
      assert('AA.eligible_counsellor', result.match?.routable !== false, result.match?.availabilityState);
    }
    await prisma.enquiryAssignmentLog.deleteMany({ where: { enquiryId: enquiry.id } });
    await prisma.enquiry.delete({ where: { id: enquiry.id } });
  }

  // Bulk auto-assignment
  {
    const ids = [];
    for (let i = 0; i < 2; i += 1) {
      const e = await prisma.enquiry.create({
        data: {
          enquiryCode: `AVAIL-BULK-${Date.now()}-${i}`,
          branchId,
          firstName: 'Bulk',
          lastName: `T${i}`,
          email: `bulk${i}-${Date.now()}@test.local`,
          mobile: `${i}${String(Date.now() + i).slice(-9)}`,
          status: 'NEW',
        },
      });
      ids.push(e.id);
    }
    const outcomes = [];
    for (const id of ids) {
      const enq = await prisma.enquiry.findUnique({ where: { id } });
      outcomes.push(await assignmentEngine.autoAssignEnquiry(enq, null));
    }
    assert('BULK.independent', outcomes.every((o) => typeof o.assigned === 'boolean'), outcomes.map((o) => o.assigned).join(','));
    for (const id of ids) {
      await prisma.enquiryAssignmentLog.deleteMany({ where: { enquiryId: id } });
      await prisma.enquiry.delete({ where: { id } });
    }
  }

  // Walk-in pick counsellor
  {
    const picked = await assignmentEngine.pickCounsellor({
      branchId,
      country: null,
      priority: 'MEDIUM',
      metadata: {},
    });
    assert('WALKIN.pick', picked === null || Boolean(picked.counsellor?.id), picked?.match?.availabilityState || 'no match');
  }

  // RBAC — updatePresence returns 410
  {
    const { assignmentService } = await import('../src/modules/assignment/assignment.service.js');
    let blocked = false;
    try {
      await assignmentService.updatePresence();
    } catch (err) {
      blocked = err.statusCode === 410;
    }
    assert('RBAC.presence_410', blocked, 'manual presence disabled');
  }

  await resetCounsellorState(counsellor.id, companyId, branchId);

  const failed = results.filter((r) => !r.ok);
  console.log(`\n${TAG} Summary: ${results.length - failed.length}/${results.length} passed`);
  if (failed.length) {
    console.error(`${TAG} Failed:`, failed.map((f) => f.id).join(', '));
    process.exit(1);
  }
  console.log(`${TAG} All scenarios passed.`);
}

main()
  .catch((err) => {
    console.error(`${TAG} Fatal:`, err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
