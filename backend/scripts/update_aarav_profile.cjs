const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateAarav() {
  const stu = await prisma.student.findFirst({
    where: { firstName: { contains: 'Aarav' } },
  });

  if (!stu) {
    console.error('Aarav not found!');
    return;
  }

  const existingMeta = (stu.metadata && typeof stu.metadata === 'object') ? stu.metadata : {};

  const updated = await prisma.student.update({
    where: { id: stu.id },
    data: {
      passportNo: 'Z9821045',
      course: 'Master of Science in Applied Computing (MScAC)',
      university: 'University of Toronto',
      country: 'Canada',
      intake: 'Fall 2027',
      address: 'A/120, Tirupati Society, Near Balaji Bungalows, Savaliya Circle, Yogi Chowk, Surat, Gujarat 395010',
      metadata: {
        ...existingMeta,
        emergencyContact: '+91 98250 11111',
        alternateNo: '+91 98250 11111',
        highestQual: 'B.Tech in Computer Engineering (8.8 CGPA)',
        applyLevel: 'POSTGRADUATE',
        targetCountry: 'Canada',
        targetCourse: 'Master of Science in Applied Computing (MScAC)',
        targetUniversity: 'University of Toronto',
        testsGiven: [
          {
            name: 'IELTS Academic',
            score: 'Band 8.0 (L: 8.5, R: 8.5, W: 7.5, S: 7.5)',
            date: '2026-09-12',
          },
        ],
        tags: ['IELTS', 'CANADA', 'TOP_UNIVERSITY', 'SCHOLARSHIP_AWARDED', 'SDS_ELIGIBLE'],
        priority: 'HIGH',
        source: 'Walk-in Direct Consultation',
      },
    },
  });

  console.log('Updated Aarav Patel:', {
    id: updated.id,
    studentCode: updated.studentCode,
    name: `${updated.firstName} ${updated.lastName}`,
    passportNo: updated.passportNo,
    course: updated.course,
    university: updated.university,
    country: updated.country,
    intake: updated.intake,
    address: updated.address,
  });
}

updateAarav().catch(console.error).finally(() => prisma.$disconnect());

