import prisma from '../src/config/database.js';
import { enquiryService } from '../src/modules/enquiry/enquiry.service.js';
import { generateAccessToken } from '../src/utils/jwt.util.js';

const user = await prisma.user.findFirst({
  where: { email: 'admin@crm.com' },
  include: { role: true },
});
const branch = await prisma.branch.findFirst({
  where: { companyId: user.companyId, deletedAt: null },
});
const reqUser = { ...user, dataScope: 'GLOBAL', role: user.role };
const req = { user: reqUser };
const token = generateAccessToken({ userId: user.id, email: user.email, role: user.role.slug });

// Service-level getById
const enq = await prisma.enquiry.findFirst({ where: { deletedAt: null } });
if (enq) {
  try {
    const row = await enquiryService.getById(enq.id, reqUser);
    console.log('getById service OK:', row.enquiryCode);
  } catch (e) {
    console.error('getById service FAIL:', e.message);
    console.error(e.stack);
  }
}

// HTTP create enquiry
const mobile = `7${String(Date.now()).slice(-9)}`;
const body = {
  branchId: branch.id,
  firstName: 'Probe',
  lastName: 'Test',
  email: `probe-${Date.now()}@test.local`,
  mobile,
  source: 'Test',
};
try {
  const res = await fetch('http://localhost:5000/api/enquiries', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  console.log('POST /enquiries', res.status, text.slice(0, 300));
  if (res.ok) {
    const parsed = JSON.parse(text);
    const id = parsed?.data?.id || parsed?.id;
    if (id) {
      await prisma.enquiry.update({ where: { id }, data: { deletedAt: new Date() } });
    }
  }
} catch (e) {
  console.error('POST /enquiries FAIL:', e.message);
}

await prisma.$disconnect();
