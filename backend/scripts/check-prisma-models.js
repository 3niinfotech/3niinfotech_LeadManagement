import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

console.log('assignmentOffer:', typeof prisma.assignmentOffer);
console.log('counsellingSession:', typeof prisma.counsellingSession);
console.log('counsellorPresence:', typeof prisma.counsellorPresence);

await prisma.$disconnect();
