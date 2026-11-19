import prisma from '../src/config/database.js';
import { applicationRepository } from '../src/modules/application/application.repository.js';
import { studentPortalService } from '../src/modules/student-portal/student-portal.service.js';

async function testFix() {
  const student = await prisma.student.findUnique({
    where: { studentCode: 'MAIN-STU000026' },
    include: {
      branch: true,
      user: true,
      assignedTo: true,
    }
  });

  console.log('Testing student:', student.studentCode, student.firstName, student.lastName);
  console.log('Course in profile:', student.course);
  console.log('Country in profile:', student.country);

  // Parse course and university
  const rawCourse = String(student.course || '').trim();
  let university = student.university || '';
  let course = rawCourse;
  if (rawCourse.includes('·')) {
    const parts = rawCourse.split('·').map(p => p.trim());
    course = parts[0];
    if (!university && parts[1]) university = parts[1];
  }

  const appNo = await applicationRepository.generateCode();
  console.log('Generated App Code:', appNo);
  console.log('Extracted University:', university);
  console.log('Extracted Course:', course);

  const germanyCountry = await prisma.country.findFirst({
    where: { name: 'Germany' }
  });

  const app = await applicationRepository.create({
    studentId: student.id,
    university: university || 'Technical University of Munich',
    course: course || 'MSc Computer Science',
    country: student.country || 'Germany',
    intake: student.intake || 'Sep 2026',
    status: 'DRAFT',
    applicationNo: appNo,
    metadata: {
      autoInitialized: true,
      countryId: germanyCountry?.id || null,
      countryName: 'Germany',
      applicationStatusName: 'Application Started',
      defaultStatus: true,
      position: 1,
    },
    createdBy: student.assignedToId || student.userId,
  });

  console.log('Created Application:', {
    id: app.id,
    applicationNo: app.applicationNo,
    university: app.university,
    course: app.course,
    country: app.country,
    status: app.status
  });

  // Now test portal applications response
  const portalApps = await studentPortalService.applications(student.user);
  console.log('Portal Apps response count:', portalApps.length);
  console.log('First App:', portalApps[0]);

  process.exit(0);
}

testFix().catch(e => {
  console.error(e);
  process.exit(1);
});
