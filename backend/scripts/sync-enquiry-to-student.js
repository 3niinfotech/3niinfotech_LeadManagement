import prisma from '../src/config/database.js';
import { enquiryConversionService } from '../src/modules/enquiry/enquiryConversion.service.js';

const CODE = process.argv[2] || 'MAIN-STU000007';

async function main() {
  const student = await prisma.student.findFirst({
    where: { studentCode: CODE, deletedAt: null },
    include: { enquiry: { select: { id: true, enquiryCode: true } } },
  });
  if (!student?.enquiry?.id) {
    console.error('No linked enquiry for', CODE);
    process.exit(1);
  }

  const admin = await prisma.user.findFirst({
    where: { deletedAt: null, role: { slug: 'super_admin' } },
    include: { role: true, company: true },
  });
  if (!admin) {
    console.error('No admin user');
    process.exit(1);
  }

  const result = await enquiryConversionService.syncEnquiryDataToStudent(
    student.enquiry.id,
    student.id,
    admin.id,
    { user: admin },
  );
  console.log('Sync result:', result);

  const after = await prisma.student.findFirst({
    where: { id: student.id },
    include: {
      documents: { where: { deletedAt: null } },
      notes: { where: { deletedAt: null } },
    },
  });
  console.log('After sync — docs:', after.documents.length, 'notes:', after.notes.length);
}

main().finally(() => prisma.$disconnect());
