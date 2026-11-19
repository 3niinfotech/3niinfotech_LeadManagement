import prisma from './src/config/database.js';

async function main() {
  const followups = await prisma.enquiryFollowup.findMany({
    where: { enquiryId: 'fe5d2878-9223-4285-b031-4129b618fa0e' },
    orderBy: { createdAt: 'desc' }
  });
  console.log('Followups for Rahul Patel:', followups);

  // Also check tasks table
  const tasks = await prisma.task.findMany({
    where: { OR: [
      { title: { contains: 'Rahul' } },
      { description: { contains: 'Rahul' } }
    ] }
  });
  console.log('Tasks for Rahul Patel:', tasks);
}

main().finally(() => prisma.$disconnect());

