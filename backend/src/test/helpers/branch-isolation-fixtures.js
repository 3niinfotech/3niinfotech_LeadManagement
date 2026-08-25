/**
 * Idempotent fixtures for branch-isolation HTTP integration tests.
 * Marker prefix: BR-ISO-
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import bcrypt from 'bcryptjs';
import prisma from '../../config/database.js';
import { DEFAULT_PASSWORD } from './http.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const MARKER = 'BR-ISO-';

const TEST_USERS = [
  { key: 'suratCounsellor', email: 'branch.iso.surat.counsellor@test.local', roleSlug: 'counsellor', branchCode: 'SUR' },
  { key: 'ahmedabadCounsellor', email: 'branch.iso.ahmedabad.counsellor@test.local', roleSlug: 'counsellor', branchCode: 'HQ' },
  { key: 'suratReceptionist', email: 'branch.iso.surat.receptionist@test.local', roleSlug: 'receptionist', branchCode: 'SUR' },
  { key: 'ahmedabadReceptionist', email: 'branch.iso.ahmedabad.receptionist@test.local', roleSlug: 'receptionist', branchCode: 'HQ' },
  { key: 'multiBranchManager', email: 'branch.iso.manager@test.local', roleSlug: 'operational_head', branchCode: 'HQ' },
];

const BRANCHES = [
  { code: 'HQ', name: 'Head Office — Ahmedabad', city: 'Ahmedabad' },
  { code: 'SUR', name: 'Surat Branch', city: 'Surat' },
];

async function upsertBranch(companyId, def) {
  return prisma.branch.upsert({
    where: { companyId_code: { companyId, code: def.code } },
    update: { name: def.name, city: def.city, isActive: true, deletedAt: null },
    create: {
      companyId,
      code: def.code,
      name: def.name,
      city: def.city,
      email: `${def.code.toLowerCase()}@branch-iso.test`,
      isActive: true,
    },
  });
}

async function upsertTestUser(companyId, branchId, roleId, row, hashedPassword) {
  const existing = await prisma.user.findUnique({ where: { email: row.email } });
  const data = {
    companyId,
    branchId,
    roleId,
    firstName: row.key,
    lastName: 'BranchIsoTest',
    phone: `+9199${String(Math.random()).slice(2, 10)}`,
    status: 'ACTIVE',
    deletedAt: null,
    password: hashedPassword,
  };

  if (existing) {
    return prisma.user.update({ where: { id: existing.id }, data });
  }
  return prisma.user.create({ data: { ...data, email: row.email } });
}

export async function seedBranchIsolationFixtures() {
  const company = await prisma.company.findFirst({
    where: { deletedAt: null },
    orderBy: { createdAt: 'asc' },
  });
  if (!company) {
    throw new Error('No company in DB — run npm run db:seed first');
  }

  const branchMap = {};
  for (const def of BRANCHES) {
    branchMap[def.code] = await upsertBranch(company.id, def);
  }

  const roles = await prisma.role.findMany({
    where: { slug: { in: [...new Set(TEST_USERS.map((u) => u.roleSlug)), 'super_admin'] } },
  });
  const roleBySlug = Object.fromEntries(roles.map((r) => [r.slug, r]));

  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const users = {};

  for (const row of TEST_USERS) {
    const branch = branchMap[row.branchCode];
    const role = roleBySlug[row.roleSlug];
    if (!branch || !role) {
      throw new Error(`Missing branch/role for ${row.key}`);
    }
    users[row.key] = await upsertTestUser(company.id, branch.id, role.id, row, hashedPassword);
  }

  const superAdmin = await prisma.user.findFirst({
    where: { role: { slug: 'super_admin' }, deletedAt: null },
  });
  if (!superAdmin) throw new Error('super_admin user missing — run npm run db:seed');

  users.superAdmin = superAdmin;

  const visaViewPerm = await prisma.permission.findUnique({ where: { key: 'visa.view' } });
  if (visaViewPerm) {
    for (const key of ['suratCounsellor', 'ahmedabadCounsellor']) {
      await prisma.userPermissionOverride.upsert({
        where: {
          userId_permissionId: { userId: users[key].id, permissionId: visaViewPerm.id },
        },
        update: { granted: true },
        create: {
          userId: users[key].id,
          permissionId: visaViewPerm.id,
          granted: true,
          reason: 'branch-isolation integration test',
        },
      });
    }
  }

  const suratCounsellorId = users.suratCounsellor.id;
  const ahmedabadCounsellorId = users.ahmedabadCounsellor.id;

  const records = {
    suratLead: await prisma.lead.upsert({
      where: { leadCode: `${MARKER}LEAD-SUR` },
      update: {
        branchId: branchMap.SUR.id,
        assignedToId: suratCounsellorId,
        firstName: 'Surat',
        lastName: 'LeadIso',
        phone: '+919000000101',
        status: 'WALK_IN',
        deletedAt: null,
      },
      create: {
        leadCode: `${MARKER}LEAD-SUR`,
        tokenNumber: `REF-${MARKER}LEAD-SUR`,
        branchId: branchMap.SUR.id,
        assignedToId: suratCounsellorId,
        firstName: 'Surat',
        lastName: 'LeadIso',
        phone: '+919000000101',
        status: 'WALK_IN',
      },
    }),
    ahmedabadLead: await prisma.lead.upsert({
      where: { leadCode: `${MARKER}LEAD-AHM` },
      update: {
        branchId: branchMap.HQ.id,
        assignedToId: ahmedabadCounsellorId,
        firstName: 'Ahmedabad',
        lastName: 'LeadIso',
        phone: '+919000000102',
        status: 'WALK_IN',
        deletedAt: null,
      },
      create: {
        leadCode: `${MARKER}LEAD-AHM`,
        tokenNumber: `REF-${MARKER}LEAD-AHM`,
        branchId: branchMap.HQ.id,
        assignedToId: ahmedabadCounsellorId,
        firstName: 'Ahmedabad',
        lastName: 'LeadIso',
        phone: '+919000000102',
        status: 'WALK_IN',
      },
    }),
    suratStudent: await prisma.student.upsert({
      where: { studentCode: `${MARKER}STU-SUR` },
      update: {
        branchId: branchMap.SUR.id,
        assignedToId: suratCounsellorId,
        firstName: 'Surat',
        lastName: 'StudentIso',
        phone: '+919000000201',
        deletedAt: null,
      },
      create: {
        studentCode: `${MARKER}STU-SUR`,
        branchId: branchMap.SUR.id,
        assignedToId: suratCounsellorId,
        firstName: 'Surat',
        lastName: 'StudentIso',
        phone: '+919000000201',
        status: 'ENQUIRY',
      },
    }),
    ahmedabadStudent: await prisma.student.upsert({
      where: { studentCode: `${MARKER}STU-AHM` },
      update: {
        branchId: branchMap.HQ.id,
        assignedToId: ahmedabadCounsellorId,
        firstName: 'Ahmedabad',
        lastName: 'StudentIso',
        phone: '+919000000202',
        deletedAt: null,
      },
      create: {
        studentCode: `${MARKER}STU-AHM`,
        branchId: branchMap.HQ.id,
        assignedToId: ahmedabadCounsellorId,
        firstName: 'Ahmedabad',
        lastName: 'StudentIso',
        phone: '+919000000202',
        status: 'ENQUIRY',
      },
    }),
  };

  async function findOrCreateApplication(studentId, university) {
    const existing = await prisma.application.findFirst({
      where: { studentId, university, deletedAt: null },
    });
    if (existing) return existing;
    return prisma.application.create({
      data: { studentId, university, course: 'MBA', country: 'Canada', status: 'DRAFT' },
    });
  }

  async function findOrCreateVisa(studentId, country) {
    const existing = await prisma.visa.findFirst({
      where: { studentId, country, deletedAt: null },
    });
    if (existing) return existing;
    return prisma.visa.create({
      data: { studentId, country, visaType: 'Study', status: 'NOT_STARTED' },
    });
  }

  records.suratApplication = await findOrCreateApplication(records.suratStudent.id, `${MARKER}UNI-SUR`);
  records.ahmedabadApplication = await findOrCreateApplication(records.ahmedabadStudent.id, `${MARKER}UNI-AHM`);
  records.suratVisa = await findOrCreateVisa(records.suratStudent.id, `${MARKER}COUNTRY-SUR`);
  records.ahmedabadVisa = await findOrCreateVisa(records.ahmedabadStudent.id, `${MARKER}COUNTRY-AHM`);

  records.suratPartner = await prisma.partner.upsert({
    where: { code: `${MARKER}PTR-SUR` },
    update: { name: 'BranchIso Partner Surat', deletedAt: null },
    create: { code: `${MARKER}PTR-SUR`, name: 'BranchIso Partner Surat' },
  });
  records.ahmedabadPartner = await prisma.partner.upsert({
    where: { code: `${MARKER}PTR-AHM` },
    update: { name: 'BranchIso Partner Ahmedabad', deletedAt: null },
    create: { code: `${MARKER}PTR-AHM`, name: 'BranchIso Partner Ahmedabad' },
  });
  await prisma.student.update({
    where: { id: records.suratStudent.id },
    data: { partnerId: records.suratPartner.id },
  });
  await prisma.student.update({
    where: { id: records.ahmedabadStudent.id },
    data: { partnerId: records.ahmedabadPartner.id },
  });

  records.suratEnquiry = await prisma.enquiry.upsert({
    where: { enquiryCode: `${MARKER}ENQ-SUR` },
    update: {
      branchId: branchMap.SUR.id,
      assignedToId: suratCounsellorId,
      firstName: 'Surat',
      lastName: 'EnquiryIso',
      email: 'surat.enquiry.iso@test.local',
      mobile: '+919000000301',
      deletedAt: null,
    },
    create: {
      enquiryCode: `${MARKER}ENQ-SUR`,
      branchId: branchMap.SUR.id,
      assignedToId: suratCounsellorId,
      firstName: 'Surat',
      lastName: 'EnquiryIso',
      email: 'surat.enquiry.iso@test.local',
      mobile: '+919000000301',
      status: 'NEW',
    },
  });

  records.ahmedabadEnquiry = await prisma.enquiry.upsert({
    where: { enquiryCode: `${MARKER}ENQ-AHM` },
    update: {
      branchId: branchMap.HQ.id,
      assignedToId: ahmedabadCounsellorId,
      firstName: 'Ahmedabad',
      lastName: 'EnquiryIso',
      email: 'ahmedabad.enquiry.iso@test.local',
      mobile: '+919000000302',
      deletedAt: null,
    },
    create: {
      enquiryCode: `${MARKER}ENQ-AHM`,
      branchId: branchMap.HQ.id,
      assignedToId: ahmedabadCounsellorId,
      firstName: 'Ahmedabad',
      lastName: 'EnquiryIso',
      email: 'ahmedabad.enquiry.iso@test.local',
      mobile: '+919000000302',
      status: 'NEW',
    },
  });

  const uploadsDir = path.resolve(__dirname, '../../../uploads/enquiries');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const uploadFileName = `${MARKER}doc.txt`;
  const uploadAbsPath = path.join(uploadsDir, uploadFileName);
  fs.writeFileSync(uploadAbsPath, 'branch isolation test document');
  const uploadRelPath = `enquiries/${uploadFileName}`;

  const existingDoc = await prisma.enquiryDocument.findFirst({
    where: { enquiryId: records.suratEnquiry.id, fileName: uploadFileName },
  });
  records.uploadDoc = existingDoc || await prisma.enquiryDocument.create({
    data: {
      enquiryId: records.suratEnquiry.id,
      name: 'Branch ISO Test Doc',
      fileName: uploadFileName,
      filePath: uploadRelPath,
      fileSize: 32,
      mimeType: 'text/plain',
      createdBy: suratCounsellorId,
    },
  });

  return {
    company,
    branches: branchMap,
    users,
    records,
    uploadRelPath,
    emails: {
      suratCounsellor: TEST_USERS.find((u) => u.key === 'suratCounsellor').email,
      ahmedabadCounsellor: TEST_USERS.find((u) => u.key === 'ahmedabadCounsellor').email,
      suratReceptionist: TEST_USERS.find((u) => u.key === 'suratReceptionist').email,
      ahmedabadReceptionist: TEST_USERS.find((u) => u.key === 'ahmedabadReceptionist').email,
      multiBranchManager: TEST_USERS.find((u) => u.key === 'multiBranchManager').email,
      superAdmin: superAdmin.email,
    },
  };
}

export async function cleanupBranchIsolationFixtures() {
  await prisma.partner.deleteMany({ where: { code: { startsWith: MARKER } } });
  await prisma.enquiryDocument.deleteMany({
    where: { fileName: { contains: MARKER } },
  });
  await prisma.enquiry.deleteMany({ where: { enquiryCode: { startsWith: MARKER } } });
  await prisma.visa.deleteMany({ where: { country: { startsWith: MARKER } } });
  await prisma.application.deleteMany({ where: { university: { startsWith: MARKER } } });
  await prisma.student.deleteMany({ where: { studentCode: { startsWith: MARKER } } });
  await prisma.lead.deleteMany({ where: { leadCode: { startsWith: MARKER } } });

  for (const row of TEST_USERS) {
    await prisma.user.deleteMany({ where: { email: row.email } });
  }
  await prisma.userPermissionOverride.deleteMany({
    where: { reason: 'branch-isolation integration test' },
  });
}
