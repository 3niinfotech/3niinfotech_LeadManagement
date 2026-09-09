import prisma from '../src/config/database.js';

const demos = await prisma.enquiryDemo.findMany({
  include: { enquiry: { select: { enquiryCode: true, firstName: true, lastName: true } } },
  orderBy: { demoDate: 'asc' },
});
console.log('DEMOS:', JSON.stringify(demos.map((d) => ({
  id: d.id,
  code: d.enquiry.enquiryCode,
  name: `${d.enquiry.firstName} ${d.enquiry.lastName}`,
  date: d.demoDate,
  status: d.sessionStatus,
  rescheduledFromId: d.rescheduledFromId,
})), null, 2));

const students = await prisma.student.findMany({
  where: { firstName: { contains: 'Convert' } },
  select: { id: true, studentCode: true, firstName: true, lastName: true, phone: true, deletedAt: true },
});
console.log('STUDENTS:', JSON.stringify(students, null, 2));

await prisma.$disconnect();
