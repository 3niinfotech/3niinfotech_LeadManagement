import prisma from '../src/config/database.js';

const STUDENT_CODE = process.argv[2] || 'MAIN-STU000007';

async function main() {
  const student = await prisma.student.findFirst({
    where: { studentCode: STUDENT_CODE },
    select: { id: true, studentCode: true, firstName: true, deletedAt: true },
  });

  if (!student) {
    console.error('Student not found:', STUDENT_CODE);
    process.exit(1);
  }

  if (!student.deletedAt) {
    console.log('Already active:', student.studentCode, student.firstName);
    return;
  }

  await prisma.student.update({
    where: { id: student.id },
    data: { deletedAt: null },
  });

  console.log('Restored student:', student.studentCode, student.firstName);
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
