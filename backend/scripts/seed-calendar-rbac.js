import prisma from '../src/config/database.js';
import { seedRbac } from '../prisma/seed-rbac.js';

await seedRbac(prisma);
console.log('RBAC seed complete (calendar permissions included)');
await prisma.$disconnect();
