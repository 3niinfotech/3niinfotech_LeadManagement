import prisma from '../src/config/database.js';

try {
  const r = await prisma.enquiry.findMany({
    take: 2,
    include: {
      branch: { select: { id: true, name: true, code: true } },
      assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
      assignedBy: { select: { id: true, firstName: true, lastName: true, email: true } },
    },
  });
  console.log('OK', r.length, r[0]?.enquiryCode, r[0]?.status, r[0]?.tags);
} catch (e) {
  console.error('ERR:', e.message);
  console.error(e);
} finally {
  await prisma.$disconnect();
}
