import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

try {
  const count = await prisma.assignmentOffer.count();
  console.log('assignment_offers table OK, count:', count);
} catch (e) {
  console.error('DB error:', e.message);
}

await prisma.$disconnect();
