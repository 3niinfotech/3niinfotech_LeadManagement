/**
 * Seed realistic QA users + sample operational data for end-to-end testing.
 * Does NOT touch masters. Safe to re-run after purge (idempotent by email/code).
 *
 * Usage: node scripts/seed-qa-testing.js
 *
 * Login portals:
 *   Staff/Admin → /login/admin
 *   Student     → /login/student
 *   Dev bypass password (non-prod): 123
 */
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import { PrismaClient } from '@prisma/client';

dotenv.config();
const prisma = new PrismaClient();

const PASS = {
  admin: 'Admin@123',
  staff: 'Staff@123',
  student: 'Student@123',
};

const STAFF = [
  {
    key: 'superAdmin',
    email: 'admin@crm.com',
    firstName: 'Darshil',
    lastName: 'Admin',
    phone: '+91 98765 00001',
    roleSlug: 'super_admin',
    branchCode: 'HQ',
    password: PASS.admin,
  },
  {
    key: 'companyAdmin',
    email: 'ops.admin@3niinfotech.com',
    firstName: 'Mehul',
    lastName: 'Trivedi',
    phone: '+91 98765 00002',
    roleSlug: 'company_admin',
    branchCode: 'HQ',
    password: PASS.staff,
  },
  {
    key: 'receptionist',
    email: 'reception.hq@3niinfotech.com',
    firstName: 'Kavita',
    lastName: 'Shah',
    phone: '+91 98765 00010',
    roleSlug: 'receptionist',
    branchCode: 'HQ',
    password: PASS.staff,
  },
  {
    key: 'counsellor',
    email: 'priya.shah@3niinfotech.com',
    firstName: 'Priya',
    lastName: 'Shah',
    phone: '+91 98765 43210',
    roleSlug: 'counsellor',
    branchCode: 'HQ',
    password: PASS.staff,
  },
  {
    key: 'teacher',
    email: 'teacher.ielts@3niinfotech.com',
    firstName: 'Rakesh',
    lastName: 'Iyer',
    phone: '+91 98765 00020',
    roleSlug: 'teacher',
    branchCode: 'HQ',
    password: PASS.staff,
  },
];

function startOfToday() {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

function atTime(hours, minutes = 0) {
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

async function upsertUser(company, branchByCode, roleBySlug, row, passwordHashByKey) {
  const branch = branchByCode.get(row.branchCode);
  const roleId = roleBySlug.get(row.roleSlug);
  if (!branch || !roleId) {
    throw new Error(`Missing branch ${row.branchCode} or role ${row.roleSlug}`);
  }
  const password = passwordHashByKey[row.key];
  const existing = await prisma.user.findUnique({ where: { email: row.email } });
  if (existing) {
    return prisma.user.update({
      where: { id: existing.id },
      data: {
        companyId: company.id,
        branchId: branch.id,
        roleId,
        firstName: row.firstName,
        lastName: row.lastName,
        phone: row.phone,
        password,
        status: 'ACTIVE',
        deletedAt: null,
      },
    });
  }
  return prisma.user.create({
    data: {
      companyId: company.id,
      branchId: branch.id,
      roleId,
      firstName: row.firstName,
      lastName: row.lastName,
      email: row.email,
      phone: row.phone,
      password,
      status: 'ACTIVE',
    },
  });
}

async function main() {
  console.log('\nSeeding QA testing users + sample journey data…\n');

  const company = await prisma.company.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  if (!company) throw new Error('No company found. Run npm run db:seed first.');

  const branches = await prisma.branch.findMany({
    where: { companyId: company.id, deletedAt: null },
  });
  const branchByCode = new Map(branches.map((b) => [b.code, b]));
  const hq = branchByCode.get('HQ') || branches[0];
  if (!hq) throw new Error('No branch found. Run npm run db:seed-organization');

  const roles = await prisma.role.findMany({
    where: { deletedAt: null, isActive: true },
    select: { id: true, slug: true },
  });
  const roleBySlug = new Map(roles.map((r) => [r.slug, r.id]));
  for (const need of ['super_admin', 'company_admin', 'receptionist', 'counsellor', 'teacher', 'student_portal']) {
    if (!roleBySlug.has(need)) throw new Error(`Role missing: ${need}. Run npm run db:seed`);
  }

  const passwordHashByKey = {
    superAdmin: await bcrypt.hash(PASS.admin, 12),
    companyAdmin: await bcrypt.hash(PASS.staff, 12),
    receptionist: await bcrypt.hash(PASS.staff, 12),
    counsellor: await bcrypt.hash(PASS.staff, 12),
    teacher: await bcrypt.hash(PASS.staff, 12),
    student: await bcrypt.hash(PASS.student, 12),
  };

  const users = {};
  for (const row of STAFF) {
    users[row.key] = await upsertUser(company, branchByCode, roleBySlug, row, passwordHashByKey);
    console.log(`  user  ${row.email} (${row.roleSlug})`);
  }

  let faculty = await prisma.faculty.findFirst({
    where: { companyId: company.id, deletedAt: null, isActive: true },
    orderBy: { sortOrder: 'asc' },
  });
  if (!faculty) {
    faculty = await prisma.faculty.create({
      data: {
        companyId: company.id,
        branchId: hq.id,
        code: 'IELTS',
        name: 'IELTS Faculty',
        description: 'IELTS coaching demos',
        isActive: true,
        sortOrder: 1,
        createdBy: users.superAdmin.id,
      },
    });
    console.log('  faculty IELTS created');
  }

  // ── Student portal account (linked Student row) ──────────────────────────
  const studentEmail = 'aarav.patel@gmail.com';
  let studentUser = await prisma.user.findUnique({ where: { email: studentEmail } });
  if (!studentUser) {
    studentUser = await prisma.user.create({
      data: {
        companyId: company.id,
        branchId: hq.id,
        roleId: roleBySlug.get('student_portal'),
        firstName: 'Aarav',
        lastName: 'Patel',
        email: studentEmail,
        phone: '+91 98250 11111',
        password: passwordHashByKey.student,
        status: 'ACTIVE',
      },
    });
  } else {
    studentUser = await prisma.user.update({
      where: { id: studentUser.id },
      data: {
        roleId: roleBySlug.get('student_portal'),
        password: passwordHashByKey.student,
        status: 'ACTIVE',
        deletedAt: null,
        companyId: company.id,
        branchId: hq.id,
      },
    });
  }
  console.log(`  user  ${studentEmail} (student_portal)`);

  const studentCode = `${company.code}-STU-2026-000001`;
  let student = await prisma.student.findFirst({
    where: { OR: [{ studentCode }, { email: studentEmail }], deletedAt: null },
  });
  if (!student) {
    student = await prisma.student.create({
      data: {
        userId: studentUser.id,
        branchId: hq.id,
        assignedToId: users.counsellor.id,
        studentCode,
        firstName: 'Aarav',
        lastName: 'Patel',
        email: studentEmail,
        phone: '+91 98250 11111',
        nationality: 'Indian',
        gender: 'Male',
        status: 'ENROLLED',
        course: 'IELTS',
        country: 'Canada',
        intake: 'Sep 2026',
        createdBy: users.counsellor.id,
      },
    });
  } else {
    student = await prisma.student.update({
      where: { id: student.id },
      data: {
        userId: studentUser.id,
        assignedToId: users.counsellor.id,
        status: 'ENROLLED',
        deletedAt: null,
      },
    });
  }
  console.log(`  student ${student.studentCode}`);

  // ── Walk-in lead (completed → linked enquiry path already done) ──────────
  const leadCode = `${company.code}-LEAD-2026-000001`;
  let lead = await prisma.lead.findFirst({ where: { leadCode } });
  if (!lead) {
    lead = await prisma.lead.create({
      data: {
        leadCode,
        tokenNumber: 'H-001',
        branchId: hq.id,
        assignedToId: users.counsellor.id,
        receptionUserId: users.receptionist.id,
        firstName: 'Aarav',
        lastName: 'Patel',
        email: studentEmail,
        phone: '9825011111',
        country: 'Canada',
        interestedCourse: 'IELTS',
        source: 'Walk-in',
        status: 'COMPLETED',
        priority: 'HIGH',
        notes: 'QA sample walk-in — interested in IELTS coaching',
        walkInAt: new Date(),
        convertedAt: new Date(),
        studentId: student.id,
        createdBy: users.receptionist.id,
      },
    });
  }
  console.log(`  lead   ${lead.leadCode}`);

  // ── Second fresh walk-in (WAITING) for reception/counsellor testing ─────
  const lead2Code = `${company.code}-LEAD-2026-000002`;
  let lead2 = await prisma.lead.findFirst({ where: { leadCode: lead2Code } });
  if (!lead2) {
    lead2 = await prisma.lead.create({
      data: {
        leadCode: lead2Code,
        tokenNumber: 'H-002',
        branchId: hq.id,
        assignedToId: users.counsellor.id,
        receptionUserId: users.receptionist.id,
        firstName: 'Neha',
        lastName: 'Mehta',
        email: 'neha.mehta.qa@gmail.com',
        phone: '9825022222',
        country: 'UK',
        interestedCourse: 'PTE',
        source: 'Walk-in',
        status: 'WAITING',
        priority: 'NORMAL',
        notes: 'QA — register → start counselling → Interested',
        walkInAt: new Date(),
        createdBy: users.receptionist.id,
      },
    });
  }
  console.log(`  lead   ${lead2.leadCode} (WAITING)`);

  // ── Enquiry with demo scheduled ─────────────────────────────────────────
  const enquiryCode = `${company.code}-ENQ000001`;
  let enquiry = await prisma.enquiry.findFirst({ where: { enquiryCode } });
  if (!enquiry) {
    enquiry = await prisma.enquiry.create({
      data: {
        enquiryCode,
        branchId: hq.id,
        assignedToId: users.counsellor.id,
        assignedById: users.receptionist.id,
        firstName: 'Aarav',
        lastName: 'Patel',
        email: studentEmail,
        mobile: '9825011111',
        mobileCountry: '+91',
        nationality: 'Indian',
        gender: 'Male',
        interestedCourse: 'IELTS',
        interestedCountry: 'Canada',
        intake: 'Sep 2026',
        source: 'Walk-in',
        status: 'DEMO_SCHEDULED',
        priority: 'HIGH',
        remark: 'QA enquiry — demo + convert + attendance path',
        studentId: student.id,
        leadId: lead.id,
        lastTouchedAt: new Date(),
        convertedAt: new Date(),
        createdBy: users.counsellor.id,
      },
    });
  } else {
    enquiry = await prisma.enquiry.update({
      where: { id: enquiry.id },
      data: {
        assignedToId: users.counsellor.id,
        studentId: student.id,
        leadId: lead.id,
        status: 'DEMO_SCHEDULED',
        deletedAt: null,
      },
    });
  }
  console.log(`  enquiry ${enquiry.enquiryCode}`);

  const demoCount = await prisma.enquiryDemo.count({ where: { enquiryId: enquiry.id } });
  if (demoCount === 0) {
    await prisma.enquiryDemo.create({
      data: {
        enquiryId: enquiry.id,
        userId: users.counsellor.id,
        facultyId: faculty.id,
        demoDate: atTime(11, 0),
        endAt: atTime(12, 0),
        className: 'IELTS Foundation',
        batch: 'Morning A',
        sessionStatus: 'SCHEDULED',
        attendance: 'NOT_MARKED',
        result: 'PENDING',
        remark: 'QA demo session — mark attendance from Demo tab',
      },
    });
    console.log('  demo   scheduled today 11:00');
  }

  // Open enquiry (not converted) for status / demo testing
  const enquiry2Code = `${company.code}-ENQ000002`;
  let enquiry2 = await prisma.enquiry.findFirst({ where: { enquiryCode: enquiry2Code } });
  if (!enquiry2) {
    enquiry2 = await prisma.enquiry.create({
      data: {
        enquiryCode: enquiry2Code,
        branchId: hq.id,
        assignedToId: users.counsellor.id,
        assignedById: users.superAdmin.id,
        firstName: 'Riya',
        lastName: 'Desai',
        email: 'riya.desai.qa@gmail.com',
        mobile: '9825033333',
        mobileCountry: '+91',
        nationality: 'Indian',
        gender: 'Female',
        interestedCourse: 'Spoken English',
        interestedCountry: 'Australia',
        source: 'Website',
        status: 'INTERESTED',
        priority: 'MEDIUM',
        remark: 'QA — schedule demo from Demo tab, change statuses',
        lastTouchedAt: new Date(),
        createdBy: users.counsellor.id,
      },
    });
    console.log(`  enquiry ${enquiry2.enquiryCode} (INTERESTED)`);
  }

  // ── Batch + timetable + today's session for teacher attendance ──────────
  const batchCode = `${company.code}-BAT-0001`;
  let batch = await prisma.academicBatch.findFirst({
    where: { companyId: company.id, code: batchCode },
  });
  if (!batch) {
    batch = await prisma.academicBatch.create({
      data: {
        companyId: company.id,
        branchId: hq.id,
        code: batchCode,
        name: 'IELTS Batch A — Morning',
        courseName: 'IELTS',
        instructorId: users.teacher.id,
        room: 'Room 2',
        startDate: startOfToday(),
        isActive: true,
        createdBy: users.superAdmin.id,
      },
    });
  } else {
    batch = await prisma.academicBatch.update({
      where: { id: batch.id },
      data: {
        instructorId: users.teacher.id,
        isActive: true,
        deletedAt: null,
      },
    });
  }
  console.log(`  batch  ${batch.code} → teacher ${users.teacher.email}`);

  await prisma.batchEnrollment.upsert({
    where: { batchId_studentId: { batchId: batch.id, studentId: student.id } },
    update: { isActive: true },
    create: {
      batchId: batch.id,
      studentId: student.id,
      isActive: true,
      createdBy: users.superAdmin.id,
    },
  });

  let slot = await prisma.classTimetableSlot.findFirst({
    where: { batchId: batch.id, deletedAt: null },
  });
  if (!slot) {
    slot = await prisma.classTimetableSlot.create({
      data: {
        batchId: batch.id,
        dayOfWeek: new Date().getDay(),
        startTime: '10:00',
        endTime: '11:00',
        room: 'Room 2',
        instructorId: users.teacher.id,
        isActive: true,
      },
    });
  }

  const sessionStart = atTime(10, 0);
  const sessionEnd = atTime(11, 0);
  let session = await prisma.classSession.findFirst({
    where: { batchId: batch.id, startAt: sessionStart, deletedAt: null },
  });
  if (!session) {
    session = await prisma.classSession.create({
      data: {
        id: randomUUID(),
        batchId: batch.id,
        branchId: hq.id,
        timetableSlotId: slot.id,
        instructorId: users.teacher.id,
        sessionDate: startOfToday(),
        startAt: sessionStart,
        endAt: sessionEnd,
        room: 'Room 2',
        status: 'SCHEDULED',
        createdBy: users.superAdmin.id,
      },
    });
  } else {
    session = await prisma.classSession.update({
      where: { id: session.id },
      data: { instructorId: users.teacher.id, status: 'SCHEDULED', deletedAt: null },
    });
  }
  console.log(`  session today 10:00–11:00 (id ${session.id.slice(0, 8)}…)`);

  console.log('\n════════════════════════════════════════════════════════');
  console.log('QA LOGIN CHEAT-SHEET  (or use DEV password: 123)');
  console.log('════════════════════════════════════════════════════════');
  console.log('Portal: /login/admin');
  console.log(`  Super Admin   ${STAFF[0].email}     / ${PASS.admin}`);
  console.log(`  Company Admin ${STAFF[1].email} / ${PASS.staff}`);
  console.log(`  Reception     ${STAFF[2].email} / ${PASS.staff}`);
  console.log(`  Counsellor    ${STAFF[3].email}  / ${PASS.staff}`);
  console.log(`  Teacher       ${STAFF[4].email} / ${PASS.staff}`);
  console.log('Portal: /login/student');
  console.log(`  Student       ${studentEmail}      / ${PASS.student}`);
  console.log('\nQuick test order:');
  console.log('  1. Reception → Walk-ins → see Neha Mehta (WAITING) / register new');
  console.log('  2. Counsellor → Enquiries → Riya (demo tab) / Aarav (demo + converted)');
  console.log('  3. Teacher → Batches → IELTS Batch A → Take attendance on today session');
  console.log('  4. Student → Attendance tab (own records)');
  console.log('  5. Admin → Masters still populated (Faculty, Countries, …)\n');
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
