import prisma from '../src/config/database.js';
import { attachStudentPhotoUrl } from '../src/utils/studentPhoto.util.js';

const CODE = process.argv[2] || 'MAIN-STU000007';

async function main() {
  const student = await prisma.student.findFirst({
    where: { studentCode: CODE, deletedAt: null },
    include: {
      documents: { where: { deletedAt: null } },
      enquiry: { include: { documents: true } },
    },
  });
  if (!student) {
    console.log('Not found');
    return;
  }
  const withPhoto = attachStudentPhotoUrl(student);
  console.log(JSON.stringify({
    metadataPhoto: student.metadata?.photoUrl,
    attachedPhoto: withPhoto.photoUrl,
    metadataKeys: Object.keys(student.metadata || {}),
    photoDocs: student.documents.filter((d) => d.category === 'PHOTO').map((d) => d.fileName),
  }, null, 2));
}

main().finally(() => prisma.$disconnect());
