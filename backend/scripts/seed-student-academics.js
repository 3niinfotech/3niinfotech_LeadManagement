import { PrismaClient } from '@prisma/client';
import { randomUUID } from 'crypto';

const prisma = new PrismaClient();

async function seedStudentAcademics() {
  console.log('--- Seeding full student academic records for Aarav Patel ---');

  const student = await prisma.student.findFirst({
    where: { email: 'aarav.patel@gmail.com' },
  });

  if (!student) {
    throw new Error('Student aarav.patel@gmail.com not found!');
  }

  const batch = await prisma.academicBatch.findFirst({
    where: { courseName: 'IELTS', deletedAt: null },
  });

  if (!batch) {
    throw new Error('IELTS Academic Batch not found!');
  }

  const teacher = await prisma.user.findFirst({
    where: { email: 'teacher.ielts@3niinfotech.com' },
  });

  const allEnrollments = await prisma.batchEnrollment.findMany({
    where: { batchId: batch.id, isActive: true },
    select: { studentId: true },
  });
  const studentIds = allEnrollments.map((e) => e.studentId);
  if (!studentIds.includes(student.id)) studentIds.push(student.id);

  console.log(`Found ${studentIds.length} students enrolled in batch: ${batch.name}`);

  // 1. Create 5 past completed sessions with attendance
  const now = new Date();
  for (let i = 5; i >= 1; i--) {
    const sessionDate = new Date(now);
    sessionDate.setDate(now.getDate() - i);
    sessionDate.setHours(10, 0, 0, 0);

    const startAt = new Date(sessionDate);
    const endAt = new Date(sessionDate);
    endAt.setHours(11, 30, 0, 0);

    let session = await prisma.classSession.findFirst({
      where: { batchId: batch.id, startAt },
    });

    if (!session) {
      session = await prisma.classSession.create({
        data: {
          id: randomUUID(),
          batchId: batch.id,
          branchId: batch.branchId,
          instructorId: teacher?.id || null,
          sessionDate,
          startAt,
          endAt,
          room: 'Room 2 · Audio-Visual Lab',
          topic: i === 1 ? 'Reading True/False/Not Given Mastery' : i === 2 ? 'Academic Vocabulary Expansion' : i === 3 ? 'Writing Task 2 Structure' : i === 4 ? 'Listening Section 1 & 2 Strategies' : 'Orientation & Diagnostic Assessment',
          status: 'COMPLETED',
          attendanceLockedAt: endAt,
        },
      });
    }

    // Mark attendance for all enrolled students
    for (const sid of studentIds) {
      const isAarav = sid === student.id;
      // Make Aarav present most days, late 1 day -> ~90% attendance
      const status = (isAarav && i === 2) ? 'LATE' : 'PRESENT';

      await prisma.classAttendance.upsert({
        where: {
          sessionId_studentId: {
            sessionId: session.id,
            studentId: sid,
          },
        },
        update: {
          status,
          markedById: teacher?.id || 'system',
          markedAt: endAt,
        },
        create: {
          id: randomUUID(),
          sessionId: session.id,
          studentId: sid,
          branchId: batch.branchId,
          status,
          markedById: teacher?.id || 'system',
          markedAt: endAt,
          remarks: isAarav ? (status === 'LATE' ? 'Joined 10 mins late' : 'Attended full session') : 'Present',
        },
      });
    }
  }
  console.log('  -> 5 past sessions and student attendances created/updated');

  // 1b. Create 4 upcoming future sessions
  const upcomingTopics = [
    { offsetDays: 1, topic: 'IELTS Speaking Part 2 & 3 Cue Card Strategies', room: 'Room 2 · Audio-Visual Lab' },
    { offsetDays: 3, topic: 'Writing Task 1 - Academic Graphs & Diagrams Analysis', room: 'Room 2 · Main Hall' },
    { offsetDays: 5, topic: 'Listening Lab - Mock Section 3 & 4 Audio Drills', room: 'Room 2 · Audio Lab' },
    { offsetDays: 7, topic: 'Reading Masterclass - Speed Skimming & Scanning', room: 'Room 2 · Main Hall' },
  ];

  for (const item of upcomingTopics) {
    const sessionDate = new Date(now);
    sessionDate.setDate(now.getDate() + item.offsetDays);
    sessionDate.setHours(10, 0, 0, 0);

    const startAt = new Date(sessionDate);
    const endAt = new Date(sessionDate);
    endAt.setHours(11, 30, 0, 0);

    let session = await prisma.classSession.findFirst({
      where: { batchId: batch.id, startAt },
    });

    if (!session) {
      await prisma.classSession.create({
        data: {
          id: randomUUID(),
          batchId: batch.id,
          branchId: batch.branchId,
          instructorId: teacher?.id || null,
          sessionDate,
          startAt,
          endAt,
          room: item.room,
          status: 'SCHEDULED',
          metadata: {
            topic: item.topic,
            meetingLink: 'https://meet.google.com/xyz-ielts-live',
          },
        },
      });
    }
  }
  console.log('  -> 4 upcoming future sessions created');

  // 2. Create 2 published assignments with Aarav submissions
  const assign1DueDate = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000);
  let assign1 = await prisma.classAssignment.findFirst({
    where: { batchId: batch.id, title: 'IELTS Writing Task 2 - Opinion Essay' },
  });
  if (!assign1) {
    assign1 = await prisma.classAssignment.create({
      data: {
        id: randomUUID(),
        companyId: batch.companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: teacher?.id || 'system',
        title: 'IELTS Writing Task 2 - Opinion Essay',
        description: 'Write a 250-word essay on technological advancement and its impact on modern education.',
        dueDate: assign1DueDate,
        maxMarks: 100,
        status: 'PUBLISHED',
        publishedAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Submission for assign1 (Graded 88/100)
  await prisma.classAssignmentSubmission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: assign1.id,
        studentId: student.id,
      },
    },
    update: {
      status: 'REVIEWED',
      marks: 88,
      feedback: 'Excellent vocabulary, well structured arguments, and great cohesive devices.',
      submittedAt: new Date(assign1DueDate.getTime() - 4 * 60 * 60 * 1000),
      reviewedAt: new Date(),
      reviewedById: teacher?.id || null,
    },
    create: {
      id: randomUUID(),
      assignmentId: assign1.id,
      studentId: student.id,
      status: 'REVIEWED',
      marks: 88,
      feedback: 'Excellent vocabulary, well structured arguments, and great cohesive devices.',
      content: 'Here is my completed essay addressing both views...',
      submittedAt: new Date(assign1DueDate.getTime() - 4 * 60 * 60 * 1000),
      reviewedAt: new Date(),
      reviewedById: teacher?.id || null,
    },
  });

  const assign2DueDate = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
  let assign2 = await prisma.classAssignment.findFirst({
    where: { batchId: batch.id, title: 'IELTS Reading - Academic Passage Analysis' },
  });
  if (!assign2) {
    assign2 = await prisma.classAssignment.create({
      data: {
        id: randomUUID(),
        companyId: batch.companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: teacher?.id || 'system',
        title: 'IELTS Reading - Academic Passage Analysis',
        description: 'Complete passage 1-3 True/False/Not Given questions and submit your answers.',
        dueDate: assign2DueDate,
        maxMarks: 50,
        status: 'PUBLISHED',
        publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
    });
  }

  // Submission for assign2 (Submitted, pending review)
  await prisma.classAssignmentSubmission.upsert({
    where: {
      assignmentId_studentId: {
        assignmentId: assign2.id,
        studentId: student.id,
      },
    },
    update: {
      status: 'SUBMITTED',
      submittedAt: new Date(),
    },
    create: {
      id: randomUUID(),
      assignmentId: assign2.id,
      studentId: student.id,
      status: 'SUBMITTED',
      content: 'Submitted passage questions 1-20.',
      submittedAt: new Date(),
    },
  });
  console.log('  -> 2 assignments and submissions created');

  // 3. Create 2 class tests with Aarav test results
  const test1Date = new Date(now.getTime() - 4 * 24 * 60 * 60 * 1000);
  let test1 = await prisma.classTest.findFirst({
    where: { batchId: batch.id, name: 'IELTS Sectional Test - Listening & Speaking' },
  });
  if (!test1) {
    test1 = await prisma.classTest.create({
      data: {
        id: randomUUID(),
        companyId: batch.companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: teacher?.id || 'system',
        name: 'IELTS Sectional Test - Listening & Speaking',
        type: 'TEST',
        testDate: test1Date,
        totalMarks: 100,
        passingMarks: 60,
        durationMinutes: 60,
        status: 'COMPLETED',
        resultsPublished: true,
      },
    });
  }

  await prisma.classTestResult.upsert({
    where: {
      testId_studentId: {
        testId: test1.id,
        studentId: student.id,
      },
    },
    update: {
      marks: 86,
      percentage: 86,
      grade: 'Band 7.5',
      remarks: 'Strong listening accuracy, fluent speaking delivery.',
      published: true,
    },
    create: {
      id: randomUUID(),
      testId: test1.id,
      studentId: student.id,
      marks: 86,
      percentage: 86,
      grade: 'Band 7.5',
      remarks: 'Strong listening accuracy, fluent speaking delivery.',
      published: true,
    },
  });

  const test2Date = new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000);
  let test2 = await prisma.classTest.findFirst({
    where: { batchId: batch.id, name: 'IELTS Comprehensive Mock Exam' },
  });
  if (!test2) {
    test2 = await prisma.classTest.create({
      data: {
        id: randomUUID(),
        companyId: batch.companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: teacher?.id || 'system',
        name: 'IELTS Comprehensive Mock Exam',
        type: 'MOCK_TEST',
        testDate: test2Date,
        totalMarks: 100,
        passingMarks: 60,
        durationMinutes: 120,
        status: 'COMPLETED',
        resultsPublished: true,
      },
    });
  }

  await prisma.classTestResult.upsert({
    where: {
      testId_studentId: {
        testId: test2.id,
        studentId: student.id,
      },
    },
    update: {
      marks: 92,
      percentage: 92,
      grade: 'Band 8.0',
      remarks: 'Outstanding performance across all 4 modules.',
      published: true,
    },
    create: {
      id: randomUUID(),
      testId: test2.id,
      studentId: student.id,
      marks: 92,
      percentage: 92,
      grade: 'Band 8.0',
      remarks: 'Outstanding performance across all 4 modules.',
      published: true,
    },
  });

  // Upcoming Test for next week
  const upcomingDate = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);
  let upcomingTest = await prisma.classTest.findFirst({
    where: { batchId: batch.id, name: 'IELTS Final Full-Length Mock Examination' },
  });
  if (!upcomingTest) {
    upcomingTest = await prisma.classTest.create({
      data: {
        id: randomUUID(),
        companyId: batch.companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: teacher?.id || 'system',
        name: 'IELTS Final Full-Length Mock Examination',
        type: 'MOCK_TEST',
        testDate: upcomingDate,
        totalMarks: 100,
        passingMarks: 60,
        durationMinutes: 180,
        status: 'PUBLISHED',
        resultsPublished: false,
        instructions: 'Comprehensive 4-module exam replicating official test conditions. Headsets provided in Lab 2.',
      },
    });
  }
  console.log('  -> 3 class tests (2 published results, 1 upcoming) created');

  // 4. Create comprehensive study materials
  await prisma.studyMaterial.deleteMany({ where: { batchId: batch.id } });
  await prisma.studyMaterial.createMany({
    data: [
      {
        id: randomUUID(),
        companyId: batch.companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: teacher?.id || 'system',
        title: 'IELTS Academic Vocabulary & Collocations Guide',
        category: 'VOCABULARY',
        fileUrl: '/uploads/materials/ielts-vocab-guide.pdf',
        materialType: 'PDF',
        status: 'PUBLISHED',
        publishedAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        companyId: batch.companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: teacher?.id || 'system',
        title: 'Writing Task 2 Band 9 Sample Essays & Examiners Commentary',
        category: 'WRITING',
        fileUrl: '/uploads/materials/writing-task-2-samples.pdf',
        materialType: 'PDF',
        status: 'PUBLISHED',
        publishedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        companyId: batch.companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: teacher?.id || 'system',
        title: 'IELTS Listening Section 1-4 Practice Audio & Transcripts',
        category: 'LISTENING',
        fileUrl: '/uploads/materials/ielts-listening-audio.mp3',
        materialType: 'AUDIO',
        status: 'PUBLISHED',
        publishedAt: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        companyId: batch.companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: teacher?.id || 'system',
        title: 'Speaking Part 2 Cue Cards & Band 8.5 Model Answers 2026',
        category: 'SPEAKING',
        fileUrl: '/uploads/materials/speaking-cue-cards.pdf',
        materialType: 'PDF',
        status: 'PUBLISHED',
        publishedAt: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000),
      },
      {
        id: randomUUID(),
        companyId: batch.companyId,
        branchId: batch.branchId,
        batchId: batch.id,
        createdById: teacher?.id || 'system',
        title: 'Official Cambridge IELTS Academic Reading Strategies & Answer Keys',
        category: 'READING',
        fileUrl: '/uploads/materials/reading-strategies.pdf',
        materialType: 'PDF',
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    ],
  });
  console.log('  -> 5 IELTS Study Materials seeded');

  // 5. Seed University Applications & Visa for Aarav
  await prisma.application.deleteMany({ where: { studentId: student.id } });
  await prisma.application.createMany({
    data: [
      {
        id: randomUUID(),
        studentId: student.id,
        university: 'University of Toronto',
        course: 'Master of Science in Applied Computing (MScAC)',
        country: 'Canada',
        intake: 'Fall 2027',
        status: 'UNCONDITIONAL_OFFER',
        applicationNo: 'UFT-2026-CA-98124',
        submittedAt: new Date(now.getTime() - 45 * 24 * 60 * 60 * 1000),
        offerDate: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000),
        metadata: {
          offerStatus: 'Unconditional Acceptance Letter Issued',
          depositPaid: true,
          depositAmount: '$5,000 CAD',
          scholarship: '$7,500 CAD Dean International Excellence Award',
          admissionsPortal: 'https://join.utoronto.ca',
        },
      },
      {
        id: randomUUID(),
        studentId: student.id,
        university: 'University of British Columbia (UBC)',
        course: 'Master of Data Science & Big Data Systems',
        country: 'Canada',
        intake: 'Fall 2027',
        status: 'UNDER_REVIEW',
        applicationNo: 'UBC-2026-CA-55102',
        submittedAt: new Date(now.getTime() - 15 * 24 * 60 * 60 * 1000),
        metadata: {
          offerStatus: 'Academic Committee Review In Progress',
          admissionsPortal: 'https://cwl.ubc.ca',
          transcriptsVerified: true,
        },
      },
      {
        id: randomUUID(),
        studentId: student.id,
        university: 'McGill University',
        course: 'Master of Science in Computer Science',
        country: 'Canada',
        intake: 'Fall 2027',
        status: 'SUBMITTED',
        applicationNo: 'MCG-2026-CA-33891',
        submittedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
        metadata: {
          offerStatus: 'Application Lodged — Awaiting Document Verification',
          admissionsPortal: 'https://mcgill.ca/minerva',
        },
      },
    ],
  });

  await prisma.visa.deleteMany({ where: { studentId: student.id } });
  await prisma.visa.create({
    data: {
      id: randomUUID(),
      studentId: student.id,
      country: 'Canada',
      visaType: 'Study Permit (SDS Fast-Track Stream)',
      status: 'DOCUMENTS_COLLECTED',
      applicationNo: 'IRCC-CAN-2026-9812',
      metadata: {
        gicStatus: 'Scotiabank GIC Account Initiated ($20,635 CAD)',
        medicalStatus: 'Upfront Medical Examination Cleared',
        policeClearance: 'Verified & Uploaded',
      },
    },
  });
  console.log('  -> 3 University Applications & 1 Visa seeded');

  // 7. Seed Assigned Counselor (Priya Shah)
  const counsellorUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: 'priya.shah@3niinfotech.com' },
        { role: { slug: 'counsellor' } },
      ],
    },
  });

  if (counsellorUser) {
    await prisma.student.update({
      where: { id: student.id },
      data: { assignedToId: counsellorUser.id },
    });
    await prisma.enquiry.updateMany({
      where: { studentId: student.id },
      data: { assignedToId: counsellorUser.id },
    });
    console.log(`  -> Assigned counsellor: ${counsellorUser.firstName} ${counsellorUser.lastName}`);
  }

  // 8. Seed Documents
  await prisma.document.deleteMany({ where: { studentId: student.id } });
  const docList = [
    {
      name: 'Passport (Current Valid)',
      fileName: 'aarav_patel_passport_2026.pdf',
      category: 'PASSPORT',
      status: 'VERIFIED',
      filePath: '/uploads/documents/aarav_passport.pdf',
      fileSize: 2450000,
      mimeType: 'application/pdf',
      verifiedBy: counsellorUser?.id || teacher?.id || 'admin',
    },
    {
      name: '10th Secondary Marksheet',
      fileName: 'aarav_patel_10th_marksheet.pdf',
      category: 'ACADEMIC',
      status: 'VERIFIED',
      filePath: '/uploads/documents/aarav_10th.pdf',
      fileSize: 1820000,
      mimeType: 'application/pdf',
      verifiedBy: counsellorUser?.id || teacher?.id || 'admin',
    },
    {
      name: '12th Higher Secondary Certificate',
      fileName: 'aarav_patel_12th_marksheet.pdf',
      category: 'ACADEMIC',
      status: 'VERIFIED',
      filePath: '/uploads/documents/aarav_12th.pdf',
      fileSize: 1950000,
      mimeType: 'application/pdf',
      verifiedBy: counsellorUser?.id || teacher?.id || 'admin',
    },
    {
      name: 'IELTS Official Test Report Form (TRF)',
      fileName: 'aarav_ielts_scorecard_trf.pdf',
      category: 'LANGUAGE_TEST',
      status: 'VERIFIED',
      filePath: '/uploads/documents/aarav_ielts.pdf',
      fileSize: 1100000,
      mimeType: 'application/pdf',
      verifiedBy: counsellorUser?.id || teacher?.id || 'admin',
    },
    {
      name: 'Financial Proof & Bank Solvency Certificate',
      fileName: 'bank_statement_6_months.pdf',
      category: 'FINANCIAL',
      status: 'UNDER_REVIEW',
      filePath: '/uploads/documents/financial_proof.pdf',
      fileSize: 4200000,
      mimeType: 'application/pdf',
      verifiedBy: null,
    },
    {
      name: 'Passport Photograph & Signature Specimen',
      fileName: 'aarav_patel_photo_signature.png',
      category: 'PHOTO',
      status: 'UNDER_REVIEW',
      filePath: '/uploads/documents/photo_sign.png',
      fileSize: 650000,
      mimeType: 'image/png',
      verifiedBy: null,
    },
  ];

  for (const d of docList) {
    await prisma.document.create({
      data: {
        id: randomUUID(),
        studentId: student.id,
        name: d.name,
        fileName: d.fileName,
        filePath: d.filePath,
        fileSize: d.fileSize,
        mimeType: d.mimeType,
        category: d.category,
        metadata: {
          status: d.status,
          verifiedAt: d.status === 'VERIFIED' ? new Date(now.getTime() - 2 * 86400000).toISOString() : null,
          verifiedBy: d.verifiedBy,
          studentRemarks: 'Uploaded official scanned original document',
        },
      },
    });
  }
  console.log(`  -> Seeded ${docList.length} student documents (4 Verified, 2 Under Review)`);

  // 9. Seed Appointments / Counseling Sessions
  await prisma.appointment.deleteMany({ where: { studentId: student.id } });
  const tomorrow2pm = new Date(now);
  tomorrow2pm.setDate(now.getDate() + 1);
  tomorrow2pm.setHours(14, 0, 0, 0);

  const past10days = new Date(now);
  past10days.setDate(now.getDate() - 10);
  past10days.setHours(11, 0, 0, 0);

  const past25days = new Date(now);
  past25days.setDate(now.getDate() - 25);
  past25days.setHours(15, 30, 0, 0);

  await prisma.appointment.createMany({
    data: [
      {
        id: randomUUID(),
        studentId: student.id,
        title: 'SOP & Visa Documentation Strategy Review',
        description: 'Comprehensive review of Statement of Purpose and SDS financial documentation compliance.',
        startAt: tomorrow2pm,
        endAt: new Date(tomorrow2pm.getTime() + 45 * 60 * 1000),
        location: 'Branch Office · Executive Cabin 2 / Google Meet',
        isCompleted: false,
        createdBy: counsellorUser?.id || student.id,
        metadata: { status: 'SCHEDULED' },
      },
      {
        id: randomUUID(),
        studentId: student.id,
        title: 'University Shortlisting & Program Fit Session',
        description: 'Evaluated course options at U of T, UBC, and McGill based on IELTS Band 8.0 profile.',
        startAt: past10days,
        endAt: new Date(past10days.getTime() + 60 * 60 * 1000),
        location: 'Branch Office · Counselling Suite 1',
        isCompleted: true,
        createdBy: counsellorUser?.id || student.id,
        metadata: { status: 'COMPLETED' },
      },
      {
        id: randomUUID(),
        studentId: student.id,
        title: 'Initial Intake & Career Diagnostic Assessment',
        description: 'Diagnostic assessment of academic transcripts, target countries, and intake timeline.',
        startAt: past25days,
        endAt: new Date(past25days.getTime() + 45 * 60 * 1000),
        location: 'Branch Office · Main Boardroom',
        isCompleted: true,
        createdBy: counsellorUser?.id || student.id,
        metadata: { status: 'COMPLETED' },
      },
    ],
  });
  console.log('  -> Seeded 3 counseling appointments (1 Upcoming, 2 Completed)');

  // 10. Seed Invoices, FeePlan, Installments, Payments, Receipts
  await prisma.invoice.deleteMany({ where: { studentId: student.id } });
  const inv1 = await prisma.invoice.create({
    data: {
      id: randomUUID(),
      studentId: student.id,
      invoiceNo: 'INV-2026-0001',
      amount: 40000,
      tax: 0,
      total: 40000,
      currency: 'INR',
      status: 'PAID',
      dueDate: new Date(now.getTime() - 40 * 86400000),
      paidAt: new Date(now.getTime() - 38 * 86400000),
      notes: 'First Semester Tuition & Admission Commitment Fee',
    },
  });

  const inv2 = await prisma.invoice.create({
    data: {
      id: randomUUID(),
      studentId: student.id,
      invoiceNo: 'INV-2026-0002',
      amount: 40000,
      tax: 0,
      total: 40000,
      currency: 'INR',
      status: 'PAID',
      dueDate: new Date(now.getTime() - 15 * 86400000),
      paidAt: new Date(now.getTime() - 12 * 86400000),
      notes: 'Second Installment · Coaching & University Processing Fee',
    },
  });

  const inv3 = await prisma.invoice.create({
    data: {
      id: randomUUID(),
      studentId: student.id,
      invoiceNo: 'INV-2026-0003',
      amount: 40000,
      tax: 0,
      total: 40000,
      currency: 'INR',
      status: 'SENT',
      dueDate: new Date(now.getTime() + 60 * 86400000),
      notes: 'Third & Final Installment · Visa Filing & Embassy Assistance',
    },
  });

  // Seed or update FeePlan
  let feePlan = await prisma.feePlan.findFirst({ where: { studentId: student.id } });
  if (feePlan) {
    await prisma.feeInstallment.deleteMany({ where: { feePlanId: feePlan.id } });
    await prisma.admissionPayment.deleteMany({ where: { feePlanId: feePlan.id } });
    feePlan = await prisma.feePlan.update({
      where: { id: feePlan.id },
      data: {
        totalAmount: 120000,
        netAmount: 120000,
        currency: 'INR',
        status: 'ACTIVE',
      },
    });
  } else {
    feePlan = await prisma.feePlan.create({
      data: {
        id: randomUUID(),
        studentId: student.id,
        totalAmount: 120000,
        netAmount: 120000,
        currency: 'INR',
        status: 'ACTIVE',
      },
    });
  }

  const inst1 = await prisma.feeInstallment.create({
    data: {
      id: randomUUID(),
      feePlanId: feePlan.id,
      title: 'Installment 1 (Admission & Tuition)',
      amount: 40000,
      amountPaid: 40000,
      dueDate: new Date(now.getTime() - 40 * 86400000),
      paidAt: new Date(now.getTime() - 38 * 86400000),
      status: 'PAID',
    },
  });

  const inst2 = await prisma.feeInstallment.create({
    data: {
      id: randomUUID(),
      feePlanId: feePlan.id,
      title: 'Installment 2 (Coaching & Materials)',
      amount: 40000,
      amountPaid: 40000,
      dueDate: new Date(now.getTime() - 15 * 86400000),
      paidAt: new Date(now.getTime() - 12 * 86400000),
      status: 'PAID',
    },
  });

  const inst3 = await prisma.feeInstallment.create({
    data: {
      id: randomUUID(),
      feePlanId: feePlan.id,
      title: 'Installment 3 (Visa Filing & Support)',
      amount: 40000,
      amountPaid: 0,
      dueDate: new Date(now.getTime() + 60 * 86400000),
      status: 'PENDING',
    },
  });

  // Create Admission Payments with receipts
  const pay1 = await prisma.admissionPayment.create({
    data: {
      id: randomUUID(),
      studentId: student.id,
      feePlanId: feePlan.id,
      installmentId: inst1.id,
      amount: 40000,
      mode: 'ONLINE_NETBANKING',
      referenceNo: 'TXN-HDFC-9918237',
      receiptNo: 'REC-2026-00001',
      status: 'SUCCESS',
      idempotencyKey: `seed-pay1-${Date.now()}`,
      createdBy: counsellorUser?.id || student.id,
      paidAt: new Date(now.getTime() - 38 * 86400000),
    },
  });

  await prisma.admissionReceipt.create({
    data: {
      id: randomUUID(),
      paymentId: pay1.id,
      receiptNo: 'REC-2026-00001',
      amount: 40000,
      details: JSON.stringify({
        studentName: 'Aarav Patel',
        installment: 'Installment 1',
        paymentMode: 'Net Banking',
        status: 'PAID',
      }),
    },
  });

  const pay2 = await prisma.admissionPayment.create({
    data: {
      id: randomUUID(),
      studentId: student.id,
      feePlanId: feePlan.id,
      installmentId: inst2.id,
      amount: 40000,
      mode: 'UPI',
      referenceNo: 'UPI-9837192837',
      receiptNo: 'REC-2026-00002',
      status: 'SUCCESS',
      idempotencyKey: `seed-pay2-${Date.now()}`,
      createdBy: counsellorUser?.id || student.id,
      paidAt: new Date(now.getTime() - 12 * 86400000),
    },
  });

  await prisma.admissionReceipt.create({
    data: {
      id: randomUUID(),
      paymentId: pay2.id,
      receiptNo: 'REC-2026-00002',
      amount: 40000,
      details: JSON.stringify({
        studentName: 'Aarav Patel',
        installment: 'Installment 2',
        paymentMode: 'UPI',
        status: 'PAID',
      }),
    },
  });

  // Update student metadata fees for instant sync
  await prisma.student.update({
    where: { id: student.id },
    data: {
      metadata: {
        ...(student.metadata && typeof student.metadata === 'object' ? student.metadata : {}),
        fees: {
          totalFees: 120000,
          paid: 80000,
          pending: 40000,
          currency: 'INR',
        },
      },
    },
  });
  console.log('  -> Seeded 3 Invoices, FeePlan, 3 Installments, 2 Payments with Receipts');

  // 11. Seed Notifications for Aarav
  const aaravUser = await prisma.user.findFirst({
    where: { email: 'aarav.patel@gmail.com' },
  });

  if (aaravUser) {
    await prisma.notification.deleteMany({ where: { userId: aaravUser.id } });
    await prisma.notification.createMany({
      data: [
        {
          id: randomUUID(),
          userId: aaravUser.id,
          type: 'SUCCESS',
          title: 'Official Offer Letter Issued',
          message: 'University of Toronto has granted an Unconditional Offer of Admission for MScAC with $7,500 CAD Scholarship.',
          link: '/student/applications',
          isRead: false,
          createdAt: new Date(now.getTime() - 2 * 3600000),
          metadata: { event: 'APPLICATION_OFFER' },
        },
        {
          id: randomUUID(),
          userId: aaravUser.id,
          type: 'INFO',
          title: 'Counseling Session Scheduled',
          message: 'Your SOP & Visa Documentation Strategy Review with Kavita Shah is confirmed for tomorrow at 2:00 PM.',
          link: '/student/counseling',
          isRead: false,
          createdAt: new Date(now.getTime() - 5 * 3600000),
          metadata: { event: 'APPOINTMENT_SCHEDULED' },
        },
        {
          id: randomUUID(),
          userId: aaravUser.id,
          type: 'SUCCESS',
          title: 'Document Verified by Admissions',
          message: 'Your 10th Secondary School Certificate has been reviewed and marked as VERIFIED.',
          link: '/student/documents',
          isRead: true,
          createdAt: new Date(now.getTime() - 24 * 3600000),
          metadata: { event: 'DOCUMENT_VERIFIED' },
        },
        {
          id: randomUUID(),
          userId: aaravUser.id,
          type: 'INFO',
          title: 'Class Session Reminder',
          message: 'Upcoming live lecture: "Task 2 Opinion Essay Structure & Band 9 Models" tomorrow at 10:00 AM.',
          link: '/student/courses',
          isRead: true,
          createdAt: new Date(now.getTime() - 36 * 3600000),
          metadata: { event: 'CLASS_REMINDER' },
        },
        {
          id: randomUUID(),
          userId: aaravUser.id,
          type: 'INFO',
          title: 'Mock Test Evaluation Published',
          message: 'Your IELTS Full-Length Assessment test results have been graded. Overall Band: 8.0 (Distinction).',
          link: '/student/tests',
          isRead: true,
          createdAt: new Date(now.getTime() - 48 * 3600000),
          metadata: { event: 'TEST_EVALUATED' },
        },
      ],
    });
    console.log('  -> Seeded 5 notifications for Aarav Patel');
  }

  console.log('--- Successfully seeded student academic records! ---');
}

seedStudentAcademics()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
