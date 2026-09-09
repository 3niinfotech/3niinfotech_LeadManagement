import prisma from '../src/config/database.js';
import { generateAccessToken } from '../src/utils/jwt.util.js';

const user = await prisma.user.findFirst({
  where: { email: 'admin@crm.com' },
  include: { role: true },
});
if (!user) {
  console.error('No admin user');
  process.exit(1);
}

const token = generateAccessToken({ userId: user.id, email: user.email, role: user.role.slug });
const base = process.env.API_BASE || 'http://localhost:5000';

const endpoints = [
  '/api/health',
  '/api/auth/profile',
  '/api/rbac/roles',
  '/api/rbac/permissions',
  '/api/organization/company',
  '/api/organization/branches',
  '/api/masters/country?page=1&limit=5',
  '/api/dashboard/stats',
  '/api/automation',
  '/api/assignment/sla/my',
  '/api/assignment/sla/overview',
];

for (const path of endpoints) {
  try {
    const res = await fetch(`${base}${path}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const text = await res.text();
    console.log(`${res.status} ${path}`);
    if (res.status >= 500) {
      console.log('  BODY:', text.slice(0, 500));
    }
  } catch (e) {
    console.log(`FAIL ${path}:`, e.message);
  }
}

await prisma.$disconnect();
