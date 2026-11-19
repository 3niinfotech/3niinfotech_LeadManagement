import bcrypt from 'bcryptjs';
import prisma from '../src/config/database.js';
import { taskService } from '../src/modules/task/task.service.js';
import { notificationService } from '../src/modules/notification/notification.service.js';
import {
  notifyAgentReferredStudent,
  notifyCounsellorAssignment,
  notifyApplicationEvent,
  notifyDocumentEvent,
  notifyVisaEvent,
  notifyFinancialEvent,
  notifyAppointmentEvent,
} from '../src/modules/notification/notification.dispatcher.js';
import { processReminderBatch } from '../src/modules/reminder/reminder.scheduler.js';

let passedTests = 0;
let failedTests = 0;

function assert(condition, testName, details = '') {
  if (condition) {
    passedTests++;
    console.log(`  ✓ PASS: ${testName}`);
  } else {
    failedTests++;
    console.error(`  ✗ FAIL: ${testName} ${details ? `(${details})` : ''}`);
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   VISA CONSULTANCY SMART NOTIFICATION & TASK SUITE   ');
  console.log('======================================================\n');

  // Load test fixtures: Company, Branch, Counsellor, Agent, Student, etc.
  const company = await prisma.company.findFirst();
  const branch = await prisma.branch.findFirst({ where: { companyId: company.id } });
  
  const defaultPassword = await bcrypt.hash('TestPass@123', 10);

  // Find or create Counsellor 1
  let counsellor1 = await prisma.user.findFirst({
    where: { companyId: company.id, role: { slug: 'counsellor' }, status: 'ACTIVE' },
  });
  if (!counsellor1) {
    const cRole = await prisma.role.findFirst({ where: { slug: 'counsellor' } });
    counsellor1 = await prisma.user.create({
      data: {
        email: `test.counsellor1.${Date.now()}@crm.com`,
        firstName: 'Aakash',
        lastName: 'Counsellor',
        password: defaultPassword,
        roleId: cRole.id,
        companyId: company.id,
        branchId: branch.id,
        status: 'ACTIVE',
      },
    });
  }

  // Find or create Counsellor 2 (for reassignment and isolation testing)
  let counsellor2 = await prisma.user.findFirst({
    where: { companyId: company.id, role: { slug: 'counsellor' }, id: { not: counsellor1.id }, status: 'ACTIVE' },
  });
  if (!counsellor2) {
    const cRole = await prisma.role.findFirst({ where: { slug: 'counsellor' } });
    counsellor2 = await prisma.user.create({
      data: {
        email: `test.counsellor2.${Date.now()}@crm.com`,
        firstName: 'Meera',
        lastName: 'Counsellor',
        password: defaultPassword,
        roleId: cRole.id,
        companyId: company.id,
        branchId: branch.id,
        status: 'ACTIVE',
      },
    });
  }

  // Find or create Agent User & Partner
  let agentUser = await prisma.user.findFirst({
    where: { companyId: company.id, role: { slug: 'agent' }, status: 'ACTIVE' },
  });
  let partner = await prisma.partner.findFirst({ where: { companyId: company.id } });
  if (!agentUser) {
    const aRole = await prisma.role.findFirst({ where: { slug: 'agent' } });
    agentUser = await prisma.user.create({
      data: {
        email: `test.agent.${Date.now()}@agency.com`,
        firstName: 'Dev',
        lastName: 'Patel',
        password: defaultPassword,
        roleId: aRole.id,
        companyId: company.id,
        branchId: branch.id,
        status: 'ACTIVE',
      },
    });
  }
  if (!partner) {
    partner = await prisma.partner.create({
      data: {
        companyId: company.id,
        userId: agentUser.id,
        agencyName: '3ni InfoTech Worldwide',
        contactPerson: 'Dev Patel',
        email: agentUser.email,
        phone: '9898001122',
        status: 'ACTIVE',
      },
    });
  }

  // Create fresh Student Portal User for isolated test run
  const sRole = await prisma.role.findFirst({ where: { slug: 'student_portal' } });
  const studentUser = await prisma.user.create({
    data: {
      email: `test.student.${Date.now()}@student.crm.com`,
      firstName: 'Aarav',
      lastName: 'Shah',
      password: defaultPassword,
      roleId: sRole.id,
      companyId: company.id,
      branchId: branch.id,
      status: 'ACTIVE',
    },
  });

  const testStudent = await prisma.student.create({
    data: {
      studentCode: `STU-TEST-${Date.now().toString().slice(-4)}`,
      firstName: 'Aarav',
      lastName: 'Shah',
      email: studentUser.email,
      phone: '9876543210',
      branchId: branch.id,
      userId: studentUser.id,
      assignedToId: counsellor1.id,
      partnerId: partner.id,
      status: 'ENQUIRY',
    },
    include: { branch: true },
  });

  // Track initial notification counts
  const initialC1Notifs = await prisma.notification.count({ where: { userId: counsellor1.id } });
  const initialC2Notifs = await prisma.notification.count({ where: { userId: counsellor2.id } });
  const initialAgentNotifs = await prisma.notification.count({ where: { userId: agentUser.id } });
  const initialStudentNotifs = await prisma.notification.count({ where: { userId: studentUser.id } });

  // -----------------------------------------------------------
  // SCENARIO 1 & 2: Agent Referral Dispatch & Role-based Isolation
  // -----------------------------------------------------------
  console.log('\n[Scenario 1 & 2] Agent Referred Student Notification & Role Isolation:');
  await notifyAgentReferredStudent({
    student: testStudent,
    partnerUserId: agentUser.id,
    assignedCounsellorId: counsellor1.id,
    branchId: branch.id,
    companyId: company.id,
  });

  const c1NotifsAfterRef = await prisma.notification.findFirst({
    where: { userId: counsellor1.id, title: { contains: 'Partner Referral' } },
  });
  const c2NotifsAfterRef = await prisma.notification.count({ where: { userId: counsellor2.id } });
  const agentNotifsAfterRef = await prisma.notification.findFirst({
    where: { userId: agentUser.id, title: { contains: 'Referral Lodged' } },
  });

  assert(
    Boolean(c1NotifsAfterRef),
    'Assigned Counsellor (C1) received referral notification',
    c1NotifsAfterRef?.title
  );
  assert(
    Boolean(agentNotifsAfterRef),
    'Referring Agent confirmed in portal with success notification',
    agentNotifsAfterRef?.title
  );
  assert(
    c2NotifsAfterRef === initialC2Notifs,
    'Unrelated Counsellor (C2) received ZERO notifications (strict role isolation)'
  );

  // Verify auto-created Task for Counsellor 1
  const referralTask = await prisma.task.findFirst({
    where: {
      studentId: testStudent.id,
      assignedToId: counsellor1.id,
      category: 'COUNSELLING',
      deletedAt: null,
    },
  });
  assert(
    Boolean(referralTask && referralTask.dedupKey === `AGENT_REFERRAL_${testStudent.id}`),
    'Auto-created Counsellor review Task with idempotency dedupKey',
    referralTask?.title
  );

  // -----------------------------------------------------------
  // SCENARIO 3: Counsellor Reassignment & Handover
  // -----------------------------------------------------------
  console.log('\n[Scenario 3] Counsellor Reassignment & Handover:');
  await notifyCounsellorAssignment({
    student: testStudent,
    counsellorId: counsellor2.id,
    previousCounsellorId: counsellor1.id,
    actorId: agentUser.id,
    companyId: company.id,
    branchId: branch.id,
  });

  const c2NotifsAfterReassign = await prisma.notification.findFirst({
    where: { userId: counsellor2.id, title: { contains: 'Reassigned to You' } },
  });
  const c1NotifsAfterReassign = await prisma.notification.findFirst({
    where: { userId: counsellor1.id, title: { contains: 'Handover Reassigned' } },
  });

  assert(Boolean(c2NotifsAfterReassign), 'New Counsellor (C2) received Reassigned notification');
  assert(Boolean(c1NotifsAfterReassign), 'Previous Counsellor (C1) notified of handover');

  const reassignTask = await prisma.task.findFirst({
    where: {
      studentId: testStudent.id,
      assignedToId: counsellor2.id,
      category: 'COUNSELLING',
      dedupKey: `COUNSELLOR_FOLLOWUP_${testStudent.id}`,
    },
  });
  assert(Boolean(reassignTask), 'New Counsellor received consultation task');

  // -----------------------------------------------------------
  // SCENARIO 4, 5, 6: Document Lifecycle (Upload -> Reject -> Approve)
  // -----------------------------------------------------------
  console.log('\n[Scenario 4, 5, 6] Document Lifecycle (Upload, Reject, Approve):');
  const testDoc = await prisma.document.create({
    data: {
      studentId: testStudent.id,
      name: 'Passport_Copy.pdf',
      fileName: 'passport_scan.pdf',
      filePath: '/uploads/documents/passport_scan.pdf',
      fileSize: 1024,
      mimeType: 'application/pdf',
      category: 'PASSPORT',
    },
  });

  // Upload
  await notifyDocumentEvent({
    document: testDoc,
    student: testStudent,
    eventType: 'UPLOADED',
    companyId: company.id,
  });

  const docVerifyTask = await prisma.task.findFirst({
    where: { dedupKey: `DOC_VERIFY_${testDoc.id}`, status: 'PENDING' },
  });
  assert(Boolean(docVerifyTask), 'Document upload auto-created verification task for reviewer');

  // Rejection
  await notifyDocumentEvent({
    document: testDoc,
    student: testStudent,
    eventType: 'REJECTED',
    rejectionReason: 'Passport expiration date unclear on scan',
    companyId: company.id,
  });

  const studentRejectNotif = await prisma.notification.findFirst({
    where: { userId: studentUser.id, title: { contains: 'Document Rejected' } },
  });
  assert(
    Boolean(studentRejectNotif && studentRejectNotif.message?.includes('unclear')),
    'Student Portal received rejection notification with exact feedback reason'
  );

  // Approval
  await notifyDocumentEvent({
    document: testDoc,
    student: testStudent,
    eventType: 'APPROVED',
    reviewerUser: counsellor1,
    companyId: company.id,
  });

  const studentApproveNotif = await prisma.notification.findFirst({
    where: { userId: studentUser.id, title: { contains: 'Document Verified' } },
  });
  assert(Boolean(studentApproveNotif), 'Student Portal received verification approval notification');

  const docVerifyTaskCompleted = await prisma.task.findFirst({
    where: { dedupKey: `DOC_VERIFY_${testDoc.id}` },
  });
  assert(
    docVerifyTaskCompleted?.status === 'COMPLETED',
    'Verification task automatically marked COMPLETED upon document approval'
  );

  // -----------------------------------------------------------
  // SCENARIO 7 & 8: University Application Lifecycle
  // -----------------------------------------------------------
  console.log('\n[Scenario 7 & 8] University Application Creation & Status Updates:');
  const testApp = await prisma.application.create({
    data: {
      studentId: testStudent.id,
      university: 'University of Toronto',
      course: 'Master of Computer Science',
      applicationNo: `APP-${Date.now().toString().slice(-4)}`,
      status: 'SUBMITTED',
    },
  });

  await notifyApplicationEvent({
    application: testApp,
    student: testStudent,
    eventType: 'CREATED',
    actorId: counsellor1.id,
    companyId: company.id,
  });

  const appPendingTask = await prisma.task.findFirst({
    where: { dedupKey: `APP_PENDING_${testApp.id}` },
  });
  assert(Boolean(appPendingTask), 'Application creation auto-created University submission task');

  await notifyApplicationEvent({
    application: testApp,
    student: testStudent,
    eventType: 'STATUS_CHANGED',
    newStatus: 'CONDITIONAL_OFFER',
    companyId: company.id,
  });

  const studentAppStatusNotif = await prisma.notification.findFirst({
    where: { userId: studentUser.id, title: { contains: 'Application Update' } },
  });
  assert(
    Boolean(studentAppStatusNotif && studentAppStatusNotif.message?.includes('CONDITIONAL_OFFER')),
    'Student Portal received real-time university offer status change notification'
  );

  // -----------------------------------------------------------
  // SCENARIO 9 & 10: Visa Process & Multi-party Decision Alert
  // -----------------------------------------------------------
  console.log('\n[Scenario 9 & 10] Visa Process File Lodgement & Multi-party Decision Alert:');
  const testVisa = await prisma.visa.create({
    data: {
      studentId: testStudent.id,
      country: 'Canada',
      visaType: 'Study Permit',
      applicationNo: `VISA-${Date.now().toString().slice(-4)}`,
      status: 'NOT_STARTED',
    },
  });

  await notifyVisaEvent({
    visa: testVisa,
    student: testStudent,
    eventType: 'FILE_READY',
    companyId: company.id,
    actorId: counsellor1.id,
  });

  const visaLodgingTask = await prisma.task.findFirst({
    where: { dedupKey: `VISA_PROCESS_${testVisa.id}` },
  });
  assert(Boolean(visaLodgingTask), 'Visa file ready auto-created visa lodgement task');

  await notifyVisaEvent({
    visa: testVisa,
    student: testStudent,
    eventType: 'DECISION',
    newStatus: 'VISA_GRANTED',
    companyId: company.id,
    actorId: counsellor1.id,
  });

  const studentVisaNotif = await prisma.notification.findFirst({
    where: { userId: studentUser.id, title: { contains: 'Visa Granted' } },
  });
  const agentVisaNotif = await prisma.notification.findFirst({
    where: { userId: agentUser.id, title: { contains: 'Referral Visa' } },
  });
  const counsellorVisaNotif = await prisma.notification.findFirst({
    where: { userId: counsellor1.id, title: { contains: 'Visa' } },
  });

  assert(Boolean(studentVisaNotif), 'Student Portal received Visa Granted celebration alert');
  assert(Boolean(agentVisaNotif), 'Referring Agent received Visa Approval alert for referred student');
  assert(Boolean(counsellorVisaNotif), 'Assigned Counsellor received Visa Granted alert');

  // -----------------------------------------------------------
  // SCENARIO 11, 12, 13: Payment Proof Verification & Auto-completion
  // -----------------------------------------------------------
  console.log('\n[Scenario 11, 12, 13] Payment Proof Verification, Receipt & Rejection:');
  const testProof = await prisma.paymentProof.create({
    data: {
      studentId: testStudent.id,
      amount: 1500,
      paymentMode: 'BANK_TRANSFER',
      transactionRef: `TXN-${Date.now()}`,
      notes: `REF-TEST-${Date.now().toString().slice(-4)}`,
      proofDocumentUrl: '/uploads/receipts/test_receipt.pdf',
      status: 'PENDING',
    },
  });

  await notifyFinancialEvent({
    eventType: 'PAYMENT_PROOF_SUBMITTED',
    proof: testProof,
    student: testStudent,
    companyId: company.id,
    branchId: branch.id,
  });

  const proofTask = await prisma.task.findFirst({
    where: { dedupKey: `PROOF_VERIFY_${testProof.id}`, status: 'PENDING' },
  });
  assert(Boolean(proofTask), 'Payment proof upload auto-created Accountant verification task');

  await notifyFinancialEvent({
    eventType: 'PAYMENT_PROOF_APPROVED',
    proof: testProof,
    student: testStudent,
    reviewerUser: counsellor1,
    companyId: company.id,
    branchId: branch.id,
  });

  const studentReceiptNotif = await prisma.notification.findFirst({
    where: { userId: studentUser.id, title: { contains: 'Receipt Generated' } },
  });
  assert(Boolean(studentReceiptNotif), 'Student Portal notified of verified payment with receipt link');

  const proofTaskCompleted = await prisma.task.findFirst({
    where: { dedupKey: `PROOF_VERIFY_${testProof.id}` },
  });
  assert(proofTaskCompleted?.status === 'COMPLETED', 'Accountant task completed upon payment approval');

  // -----------------------------------------------------------
  // SCENARIO 14: Refund Authorization Task & Alerts
  // -----------------------------------------------------------
  console.log('\n[Scenario 14] Refund Request Authorization Task & Alerts:');
  const testRefund = await prisma.refund.create({
    data: {
      refundNo: `REF-TEST-${Date.now().toString().slice(-4)}`,
      studentId: testStudent.id,
      branchId: branch.id,
      amount: 500,
      reason: 'Course withdrawal',
      status: 'PENDING',
      requestedById: agentUser.id,
    },
  });

  await notifyFinancialEvent({
    eventType: 'REFUND_REQUESTED',
    refund: testRefund,
    student: testStudent,
    companyId: company.id,
    branchId: branch.id,
  });

  const refundTask = await prisma.task.findFirst({
    where: { dedupKey: `REFUND_APPROVE_${testRefund.id}` },
  });
  assert(Boolean(refundTask), 'Refund request auto-created Manager/Accountant authorization task');

  // -----------------------------------------------------------
  // SCENARIO 15: Scheduled Automatic Reminders Batch Processor
  // -----------------------------------------------------------
  console.log('\n[Scenario 15] Scheduled Automatic Reminders Batch Processor:');
  // Create an overdue task
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000);
  const overdueTask = await prisma.task.create({
    data: {
      title: 'Urgent Overdue Task Check',
      description: 'Test overdue batch processor detection',
      category: 'GENERAL',
      priority: 'URGENT',
      dueDate: yesterday,
      assignedToId: counsellor1.id,
      companyId: company.id,
      branchId: branch.id,
      status: 'PENDING',
    },
  });

  // Run the batch scheduler
  await processReminderBatch();

  const overdueAlertNotif = await prisma.notification.findFirst({
    where: {
      userId: counsellor1.id,
      title: { contains: 'Overdue Task' },
    },
  });
  assert(Boolean(overdueAlertNotif), 'Batch scheduler detected overdue task and alerted assignee');

  const updatedOverdueTask = await prisma.task.findUnique({ where: { id: overdueTask.id } });
  assert(
    Boolean(updatedOverdueTask?.metadata?.overdueAlertSentAt),
    'Overdue task metadata stamped with alert timestamp to prevent duplicate spam'
  );

  // Clean up test records
  console.log('\n--- Cleaning up test records ---');
  await prisma.task.deleteMany({ where: { studentId: testStudent.id } });
  await prisma.task.deleteMany({ where: { id: overdueTask.id } });
  await prisma.document.deleteMany({ where: { id: testDoc.id } });
  await prisma.application.deleteMany({ where: { id: testApp.id } });
  await prisma.visa.deleteMany({ where: { id: testVisa.id } });
  await prisma.paymentProof.deleteMany({ where: { id: testProof.id } });
  await prisma.refund.deleteMany({ where: { id: testRefund.id } });
  await prisma.student.delete({ where: { id: testStudent.id } });
  await prisma.user.delete({ where: { id: studentUser.id } });

  console.log('\n======================================================');
  console.log(`   TEST RESULTS: ${passedTests} PASSED, ${failedTests} FAILED   `);
  console.log('======================================================\n');

  if (failedTests > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTestSuite().catch((err) => {
  console.error('Test suite failed with unexpected error:', err);
  process.exit(1);
});
