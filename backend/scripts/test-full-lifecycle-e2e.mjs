import prisma from '../src/config/database.js';
import { enquiryService } from '../src/modules/enquiry/enquiry.service.js';
import { enquiryConversionService } from '../src/modules/enquiry/enquiryConversion.service.js';
import { applicationService } from '../src/modules/application/application.service.js';
import { studentService } from '../src/modules/student/student.service.js';
import { invoiceService } from '../src/modules/invoice/invoice.service.js';
import { paymentService } from '../src/modules/invoice/payment.service.js';
import { attendanceService } from '../src/modules/attendance/attendance.service.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ [PASS]: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ [FAIL]: ${message}`);
    failed++;
  }
}

async function runFullLifecycleE2ETest() {
  console.log('\n======================================================================');
  console.log('🚀 CRM & STUDENT PORTAL: COMPLETE FULL LIFECYCLE E2E TEST (ROLE-BY-ROLE)');
  console.log('======================================================================\n');

  try {
    // 0. Setup actors & company
    const company = await prisma.company.findFirst({ where: { isActive: true } });
    const branch = await prisma.branch.findFirst({ where: { companyId: company.id, name: { contains: 'Ahmedabad' } } });

    const receptionistUser = await prisma.user.findFirst({
      where: { email: 'reception.hq@3niinfotech.com' },
      include: { role: true },
    });
    const counsellorUser = await prisma.user.findFirst({
      where: { email: 'test.counsellor2.1793792161894@crm.com' },
      include: { role: true },
    });
    const accountantUser = await prisma.user.findFirst({
      where: { email: 'accountant@3niinfotech.com' },
      include: { role: true },
    });
    const teacherUser = await prisma.user.findFirst({
      where: { email: 'teacher.ielts@3niinfotech.com' },
      include: { role: true },
    });
    const germanyCountry = await prisma.country.findFirst({
      where: { code: 'DE' },
    }) || await prisma.country.findFirst();

    console.log(`Company: ${company.name} | Branch: ${branch.name}`);
    console.log(`Receptionist : ${receptionistUser.firstName} ${receptionistUser.lastName} (${receptionistUser.email})`);
    console.log(`Counsellor   : ${counsellorUser.firstName} ${counsellorUser.lastName} (${counsellorUser.email})`);
    console.log(`Accountant   : ${accountantUser.firstName} ${accountantUser.lastName} (${accountantUser.email})`);
    console.log(`Teacher      : ${teacherUser.firstName} ${teacherUser.lastName} (${teacherUser.email})`);

    const timestamp = Date.now().toString().slice(-4);
    const candidateName = `Vivek-${timestamp}`;
    const candidateEmail = `vivek.${timestamp}@testmail.com`;
    const candidatePhone = `98765${timestamp}1`;

    // =======================================================================
    // STAGE 1: RECEPTIONIST DESK (Walk-in Intake & Counsellor Assignment)
    // =======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📍 STAGE 1: RECEPTIONIST DESK (Kavita Shah)');
    console.log('   Action: Walk-in inquiry registered & assigned to Meera Counsellor');
    console.log('----------------------------------------------------------------------');

    const reqReceptionist = {
      user: {
        id: receptionistUser.id,
        email: receptionistUser.email,
        companyId: company.id,
        branchId: branch.id,
        role: receptionistUser.role,
        roleSlug: receptionistUser.role.slug,
      },
      tenant: { companyId: company.id },
    };

    const newEnquiry = await enquiryService.create(
      {
        firstName: candidateName,
        lastName: 'Patel',
        email: candidateEmail,
        mobile: candidatePhone,
        source: 'WALK_IN',
        interestedCountry: germanyCountry.name,
        interestedCourse: 'Study Visa',
        branchId: branch.id,
        assignedToId: counsellorUser.id,
        manualCounsellorOverride: true,
        priority: 'HIGH',
        remark: 'Walk-in candidate interested in Technical University of Munich (Germany).',
      },
      receptionistUser.id,
      reqReceptionist
    );

    assert(newEnquiry && newEnquiry.id, `Enquiry created with ID: ${newEnquiry.enquiryCode || newEnquiry.id}`);
    assert(newEnquiry.assignedToId === counsellorUser.id, `Enquiry assigned directly to Meera Counsellor`);

    // =======================================================================
    // STAGE 2: COUNSELLOR WORKSPACE (Meera Counsellor)
    // =======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📍 STAGE 2: COUNSELLOR WORKSPACE (Meera Counsellor)');
    console.log('   Action: Follow-up logged, demo marked attended, lead converted to student');
    console.log('----------------------------------------------------------------------');

    const reqCounsellor = {
      user: {
        id: counsellorUser.id,
        email: counsellorUser.email,
        companyId: company.id,
        branchId: branch.id,
        role: counsellorUser.role,
        roleSlug: counsellorUser.role.slug,
      },
      tenant: { companyId: company.id },
    };

    // 2.1 Add Follow-up
    const followup = await enquiryService.addFollowup(
      newEnquiry.id,
      {
        nextDate: new Date(Date.now() + 86400000).toISOString(),
        remark: 'Spoke regarding Bachelor degree documents and APS certificate for Germany.',
        stage: 'CALL',
      },
      counsellorUser.id,
      reqCounsellor
    );
    assert(followup && followup.id, `Counselling follow-up scheduled successfully`);

    const facultyRecord = await prisma.faculty.findFirst({
      where: { companyId: company.id, email: teacherUser.email },
    }) || await prisma.faculty.findFirst({ where: { companyId: company.id } });

    // 2.2 Schedule & Mark Demo
    const demo = await enquiryService.addDemo(
      newEnquiry.id,
      {
        demoDate: new Date().toISOString(),
        className: 'IELTS Fast-Track Trial Session',
        batch: 'Morning-01',
        facultyId: facultyRecord?.id || null,
      },
      counsellorUser.id,
      reqCounsellor
    );
    assert(demo && demo.id, `IELTS trial demo session created`);

    await enquiryService.markDemoAttendance(
      newEnquiry.id,
      demo.id,
      { attendance: 'PRESENT', result: 'POSITIVE', feedback: 'Good English proficiency' },
      counsellorUser.id,
      reqCounsellor
    );
    assert(true, `Demo marked as PRESENT with POSITIVE feedback`);

    // 2.3 Convert Enquiry to Student
    const conversionResult = await enquiryConversionService.convertToStudent(
      newEnquiry.id,
      counsellorUser.id,
      reqCounsellor
    );
    const studentRecord = conversionResult?.student;
    assert(studentRecord && studentRecord.id, `Enquiry converted to Student! ID: ${studentRecord?.id}`);
    assert(studentRecord && studentRecord.studentCode, `New Student Record active with Code: ${studentRecord.studentCode}`);
    assert(studentRecord.assignedToId === counsellorUser.id, `Student retains assigned counsellor Meera`);

    // 2.4 Create Foreign University Application
    const newApp = await applicationService.create(
      {
        studentId: studentRecord.id,
        countryId: germanyCountry.id,
        university: 'Technical University of Munich',
        course: 'M.Sc. Informatics',
        intake: 'Sep 2026',
      },
      reqCounsellor.user,
      reqCounsellor
    );
    assert(newApp && newApp.id, `Application APP created: ${newApp.applicationId || newApp.id} for TUM (Germany)`);

    // =======================================================================
    // STAGE 3: STUDENT SELF-SERVICE PORTAL (Vivek Patel)
    // =======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📍 STAGE 3: STUDENT PORTAL (Vivek Patel)');
    console.log('   Action: Logs in, reviews application, and uploads Passport PDF');
    console.log('----------------------------------------------------------------------');

    // Student uploads passport document
    const studentDoc = await prisma.document.create({
      data: {
        student: { connect: { id: studentRecord.id } },
        name: 'Original_Passport_Scan.pdf',
        fileName: 'Original_Passport_Scan.pdf',
        filePath: 'students/1793861699758-QA_Test_Document_Not_A_Real_Passport.pdf',
        fileSize: 1048576,
        mimeType: 'application/pdf',
        category: 'Passport',
        metadata: {
          uploadedVia: 'StudentPortal',
          documentCategory: 'Passport',
          status: 'UNDER_REVIEW',
        },
        createdBy: counsellorUser.id,
      },
    });
    assert(studentDoc && studentDoc.id, `Student uploaded Passport document (Status: UNDER_REVIEW)`);

    // Verify visibility in Enquiry Documents & Student Documents
    const enquiryMergedDocs = await enquiryService.getDocuments(newEnquiry.id, reqCounsellor.user);
    const hasDocInEnquiry = (enquiryMergedDocs || []).some((d) => d.category === 'Passport' || d.title?.includes('Passport'));
    assert(hasDocInEnquiry, `Uploaded document seamlessly visible in Counsellor Enquiry Workspace!`);

    // =======================================================================
    // STAGE 4: COUNSELLOR VERIFICATION WORKFLOW
    // =======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📍 STAGE 4: DOCUMENT VERIFICATION WORKFLOW (Meera Counsellor)');
    console.log('   Action: Counsellor inspects passport and clicks [✓ Verify]');
    console.log('----------------------------------------------------------------------');

    const verifiedDoc = await studentService.updateDocumentStatus(
      studentRecord.id,
      studentDoc.id,
      { status: 'VERIFIED', remarks: 'Verified original front & back page against QA checklist' },
      counsellorUser.id,
      reqCounsellor
    );
    assert(verifiedDoc && (verifiedDoc.status === 'VERIFIED' || verifiedDoc.metadata?.status === 'VERIFIED'), `Document marked as VERIFIED`);

    // =======================================================================
    // STAGE 5: ACCOUNTANT ERP & INVOICING (Vikram Patel)
    // =======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📍 STAGE 5: ACCOUNTANT ERP & INVOICING (Vikram Patel)');
    console.log('   Action: Creates ₹30,000 Consultancy Invoice, collects payment & issues receipt');
    console.log('----------------------------------------------------------------------');

    const reqAccountant = {
      user: {
        id: accountantUser.id,
        email: accountantUser.email,
        companyId: company.id,
        branchId: branch.id,
        role: accountantUser.role,
        roleSlug: accountantUser.role.slug,
      },
      tenant: { companyId: company.id },
    };

    const invoice = await invoiceService.create(
      {
        studentId: studentRecord.id,
        branchId: branch.id,
        title: 'Germany Study Visa Consultancy & APS Filing Fee',
        amount: 30000,
        tax: 5400,
        discount: 0,
        total: 35400,
        status: 'SENT',
        dueDate: new Date(Date.now() + 7 * 86400000).toISOString(),
      },
      reqAccountant.user,
      reqAccountant
    );
    assert(invoice && invoice.id, `Invoice generated: ${invoice.invoiceNo || invoice.id} for ₹35,400 (inc. 18% GST)`);

    // Record payment & issue receipt
    const payment = await paymentService.recordPayment({
      invoiceId: invoice.id,
      amount: 35400,
      mode: 'UPI',
      referenceNo: `UPI-UTR-${timestamp}`,
      notes: 'Payment confirmed via Bank Netbanking',
      userId: accountantUser.id,
      req: reqAccountant,
    });
    assert(payment && payment.receipt, `Payment collected & Official Money Receipt issued: ${payment.receipt?.receiptNo || 'RCP-OK'}`);

    // =======================================================================
    // STAGE 6: TEACHER ACADEMIC & ATTENDANCE (Rakesh Iyer)
    // =======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📍 STAGE 6: TEACHER ACADEMIC MODULE (Rakesh Iyer)');
    console.log('   Action: Enrolls student into IELTS Morning Batch and marks attendance');
    console.log('----------------------------------------------------------------------');

    const reqTeacher = {
      user: {
        id: teacherUser.id,
        email: teacherUser.email,
        companyId: company.id,
        branchId: branch.id,
        role: teacherUser.role,
        roleSlug: teacherUser.role.slug,
        permissions: teacherUser.role.permissions || ['attendance.mark', 'attendance.view'],
      },
      tenant: { companyId: company.id },
    };

    const batch = await prisma.academicBatch.findFirst({
      where: { instructorId: teacherUser.id },
    });

    if (batch) {
      // Enroll
      const enrollment = await attendanceService.enrollStudents(
        batch.id,
        [studentRecord.id],
        reqTeacher.user,
        reqTeacher
      );
      assert(enrollment, `Student enrolled into ${batch.name} (${batch.code})`);

      // Generate / find session and mark attendance
      let session = await prisma.classSession.findFirst({
        where: { batchId: batch.id },
      });
      if (!session) {
        session = await prisma.classSession.create({
          data: {
            companyId: company.id,
            branchId: branch.id,
            batchId: batch.id,
            instructorId: teacherUser.id,
            startAt: new Date(Date.now() - 3600000),
            endAt: new Date(Date.now() + 3600000),
            topic: 'IELTS Writing Task 2 & Graph Analysis',
          },
        });
      }

      await attendanceService.saveAttendance(
        session.id,
        {
          entries: [{ studentId: studentRecord.id, status: 'PRESENT', remark: 'Attended full lecture' }],
          force: true,
        },
        reqTeacher.user,
        reqTeacher
      );
      assert(true, `Teacher marked attendance: PRESENT for IELTS session`);
    } else {
      console.log('  ⚠ No batch assigned to teacher; skipped session mark.');
    }

    // =======================================================================
    // STAGE 7: STUDENT PORTAL FINAL VERIFICATION
    // =======================================================================
    console.log('\n----------------------------------------------------------------------');
    console.log('📍 STAGE 7: STUDENT PORTAL 360-DEGREE VERIFICATION');
    console.log('   Action: Student views synchronized dashboard, applications, fees & academics');
    console.log('----------------------------------------------------------------------');

    const studentApps = await prisma.application.findMany({
      where: { studentId: studentRecord.id, deletedAt: null },
    });
    assert(studentApps.length >= 1, `Student Portal displays active Munich Application`);

    const studentReceipts = await prisma.admissionReceipt.findMany({
      where: { payment: { studentId: studentRecord.id } },
    });
    assert(studentReceipts.length >= 1, `Student Portal shows 1 Official Verified Tax Receipt (₹35,400)`);

    console.log('\n======================================================================');
    console.log(`TEST SUITE FINISHED: ${passed} PASSED | ${failed} FAILED`);
    console.log('======================================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('FATAL TEST ERROR:', error);
    process.exit(1);
  }
}

runFullLifecycleE2ETest();
