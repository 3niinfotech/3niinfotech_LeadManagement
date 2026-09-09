import prisma from '../src/config/database.js';

/** Remove superseded rescheduled demo + duplicate test student */
async function main() {
  const oldDemoId = '89d86e46-a969-4828-8cdc-5d692aa3b58b';
  const activeDemoId = '34b7c3b4-77b8-4403-9c53-5680d75f3e6c';
  const dupStudentId = 'ccde2722-67e9-4365-b515-8794e8924804';

  await prisma.enquiryDemo.update({
    where: { id: activeDemoId },
    data: { rescheduledFromId: null },
  });

  await prisma.enquiryDemo.delete({ where: { id: oldDemoId } });
  console.log('Deleted superseded demo', oldDemoId);

  await prisma.student.update({
    where: { id: dupStudentId },
    data: { deletedAt: new Date() },
  });
  console.log('Soft-deleted duplicate student', dupStudentId);

  const demos = await prisma.enquiryDemo.count({
    where: { sessionStatus: { not: 'RESCHEDULED' } },
  });
  const students = await prisma.student.count({ where: { deletedAt: null } });
  console.log('Active demos:', demos, '| Active students:', students);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
