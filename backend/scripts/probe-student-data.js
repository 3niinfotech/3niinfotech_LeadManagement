import prisma from '../src/config/database.js';

const CODE = process.argv[2] || 'MAIN-STU000007';

async function main() {
  const student = await prisma.student.findFirst({
    where: { studentCode: CODE },
    include: {
      documents: { where: { deletedAt: null } },
      notes: { where: { deletedAt: null } },
      enquiry: {
        include: {
          demos: true,
          documents: true,
          notes: true,
          followups: true,
        },
      },
    },
  });
  if (!student) {
    console.log('Not found');
    return;
  }
  console.log(JSON.stringify({
    code: student.studentCode,
    name: student.firstName,
    course: student.course,
    country: student.country,
    email: student.email,
    phone: student.phone,
    studentDocs: student.documents.length,
    studentNotes: student.notes.length,
    enquiry: student.enquiry ? {
      code: student.enquiry.enquiryCode,
      status: student.enquiry.status,
      demos: student.enquiry.demos.length,
      enquiryDocs: student.enquiry.documents.length,
      enquiryNotes: student.enquiry.notes.length,
      followups: student.enquiry.followups.length,
    } : null,
  }, null, 2));
}

main().finally(() => prisma.$disconnect());
