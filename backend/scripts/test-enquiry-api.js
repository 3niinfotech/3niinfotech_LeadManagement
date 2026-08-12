import prisma from '../src/config/database.js';
import { enquiryService } from '../src/modules/enquiry/enquiry.service.js';
import { generateAccessToken } from '../src/utils/jwt.util.js';

const user = await prisma.user.findFirst({
  where: { email: 'admin@crm.com' },
  include: { role: true },
});

if (!user) {
  console.error('No admin user');
  process.exit(1);
}

const reqUser = {
  id: user.id,
  companyId: user.companyId,
  branchId: user.branchId,
  dataScope: 'GLOBAL',
  role: user.role,
};

try {
  const result = await enquiryService.getAll({ page: 1, limit: 25 }, reqUser);
  console.log('getAll OK:', result.data?.length, 'rows');
} catch (e) {
  console.error('getAll FAIL:', e.message);
  console.error(e.stack);
}

const token = generateAccessToken({ userId: user.id, email: user.email, role: user.role.slug });
console.log('Token generated, testing HTTP...');

try {
  const res = await fetch('http://localhost:5000/api/enquiries?page=1&limit=25', {
    headers: { Authorization: `Bearer ${token}` },
  });
  const body = await res.json();
  console.log('HTTP', res.status, JSON.stringify(body).slice(0, 200));
} catch (e) {
  console.error('HTTP fail (is backend running on 5000?):', e.message);
}

await prisma.$disconnect();
