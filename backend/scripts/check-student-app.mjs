import prisma from '../src/config/database.js';

async function checkDetails() {
  const student = await prisma.student.findUnique({
    where: { studentCode: 'MAIN-STU000026' },
    include: {
      enquiry: true,
      user: true,
      visas: true,
      invoices: true,
    }
  });
  console.log('STUDENT FULL:', JSON.stringify(student, null, 2));

  // Check all applications in DB
  const recentApps = await prisma.application.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      student: { select: { studentCode: true, firstName: true, lastName: true, email: true } }
    }
  });
  console.log('RECENT APPLICATIONS IN SYSTEM:', JSON.stringify(recentApps, null, 2));

  process.exit(0);
}

checkDetails().catch(e => {
  console.error(e);
  process.exit(1);
});
