import prisma from './config/database.js';
import { paymentService } from './modules/invoice/payment.service.js';
import { feePlanService } from './modules/fee-plan/fee-plan.service.js';
import { paymentProofService } from './modules/payment-proof/payment-proof.service.js';
import { refundService } from './modules/refund/refund.service.js';
import { ledgerService } from './modules/ledger/ledger.service.js';
import { expenseService } from './modules/expense/expense.service.js';
import { invoiceService } from './modules/invoice/invoice.service.js';
import { studentService } from './modules/student/student.service.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runSuite() {
  console.log('\n======================================================');
  console.log('BEGIN INTEGRATION TEST SUITE: AGENT ASSIGNMENT & ACCOUNTANT ERP');
  console.log('======================================================\n');

  // Find or create test environment data
  const company = await prisma.company.findFirst({ where: { isActive: true } });
  const branch = await prisma.branch.findFirst({ where: { companyId: company.id } });
  const devAgentUser = await prisma.user.findFirst({
    where: { role: { slug: { in: ['agent', 'partner', 'partner_agent'] } } },
    include: { role: true },
  });
  let partner = await prisma.partner.findFirst({ where: { userId: devAgentUser.id } });
  if (!partner) {
    partner = await prisma.partner.create({
      data: {
        companyId: company.id,
        userId: devAgentUser.id,
        name: 'Dev Partner Agency',
        code: `PRT-${Date.now().toString().slice(-4)}`,
        type: 'AGENT',
        email: devAgentUser.email,
        phone: '+919988776655',
      },
    });
  }
  const counsellor = await prisma.user.findFirst({
    where: { role: { slug: 'counsellor' } },
  });
  const adminUser = await prisma.user.findFirst({ where: { role: { slug: 'super_admin' } } });

  console.log('1. TEST PART A: AGENT STUDENT REGISTRATION & AUTO-ASSIGNMENT');
  console.log('------------------------------------------------------');

  const testStudentReq = {
    user: {
      id: devAgentUser.id,
      email: devAgentUser.email,
      role: { slug: 'agent', name: 'Agent' },
      companyId: company.id,
      branchId: branch.id,
    },
  };

  const timestamp = Date.now().toString().slice(-5);
  const newStudent = await studentService.create(
    {
      branchId: branch.id,
      firstName: 'Kabir',
      lastName: `Sharma-${timestamp}`,
      email: `kabir.${timestamp}@example.com`,
      phone: `+9198765${timestamp}`,
      course: 'IELTS Coaching',
      country: 'Canada',
    },
    devAgentUser.id,
    testStudentReq
  );

  assert(Boolean(newStudent?.id), `Student created with ID ${newStudent?.id}`);
  assert(newStudent.partnerId === partner?.id, `Student partnerId correctly bound to agent (${partner?.id})`);
  assert(Boolean(newStudent.assignedToId), `Student auto-assigned to counsellor (${newStudent.assignedToId})`);

  // Verify Agent update protection
  const updateReq = { ...testStudentReq };
  const updatedStudent = await studentService.update(
    newStudent.id,
    {
      firstName: 'Kabir-Updated',
      assignedToId: '00000000-0000-0000-0000-000000000000', // attempt to change counsellor
      partnerId: '00000000-0000-0000-0000-000000000000', // attempt to change partner
    },
    devAgentUser.id,
    updateReq
  );

  assert(updatedStudent.assignedToId === newStudent.assignedToId, 'Security: Agent cannot modify assignedToId on student');
  assert(updatedStudent.partnerId === newStudent.partnerId, 'Security: Agent cannot modify partnerId on student');

  console.log('\n2. TEST PART B: PRIORITY 1 — PAYMENT COLLECTION & RECEIPTS');
  console.log('------------------------------------------------------');

  const invoiceNo = `INV-TEST-${Date.now().toString().slice(-6)}`;
  const invoice = await prisma.invoice.create({
    data: {
      invoiceNo,
      studentId: newStudent.id,
      amount: 1000,
      tax: 0,
      total: 1000,
      amountPaid: 0,
      currency: 'USD',
      status: 'SENT',
      createdBy: adminUser.id,
    },
  });

  // Attempt overpayment
  let overpayBlocked = false;
  try {
    await paymentService.recordPayment({
      invoiceId: invoice.id,
      amount: 1500,
      mode: 'CASH',
      userId: adminUser.id,
    });
  } catch (err) {
    overpayBlocked = true;
  }
  assert(overpayBlocked, 'Atomic Safety: Payment exceeding remaining invoice balance is blocked');

  // Collect partial payment
  const pay1 = await paymentService.recordPayment({
    invoiceId: invoice.id,
    amount: 400,
    mode: 'CASH',
    userId: adminUser.id,
  });

  assert(Number(pay1.invoice.amountPaid) === 400, 'Invoice amountPaid updated to 400');
  assert(pay1.invoice.status === 'PARTIAL', 'Invoice status updated to PARTIAL');
  assert(Boolean(pay1.receipt?.receiptNo), `Official AdmissionReceipt created (${pay1.receipt?.receiptNo})`);

  // Collect remaining payment
  const pay2 = await paymentService.recordPayment({
    invoiceId: invoice.id,
    amount: 600,
    mode: 'BANK_TRANSFER',
    referenceNo: 'UTR-TEST-8899',
    userId: adminUser.id,
  });

  assert(Number(pay2.invoice.amountPaid) === 1000, 'Invoice amountPaid updated to 1000');
  assert(pay2.invoice.status === 'PAID', 'Invoice status updated to PAID');

  // Fetch receipt
  const receipt = await paymentService.getReceiptByNo(pay2.receipt.receiptNo);
  assert(receipt.receiptNo === pay2.receipt.receiptNo, 'Printable receipt fetched successfully with parsed details');

  console.log('\n3. TEST PART B: PRIORITY 2 — FEE PLANS & INSTALLMENTS');
  console.log('------------------------------------------------------');

  const feePlan = await feePlanService.create(
    {
      studentId: newStudent.id,
      title: 'Global University Tuition Plan',
      totalAmount: 1200,
      installments: [
        { title: 'Semester 1 Deposit', amount: 600, dueDate: new Date(Date.now() + 864000000) },
        { title: 'Semester 2 Final', amount: 600, dueDate: new Date(Date.now() + 1728000000) },
      ],
    },
    adminUser.id
  );

  assert(Boolean(feePlan.id), `Fee plan created with ID ${feePlan.id}`);
  assert(feePlan.installments?.length === 2, 'Fee plan initialized with 2 installments');

  const extraInst = await feePlanService.addInstallment(
    feePlan.id,
    { title: 'Lab & Campus Fee', amount: 300, dueDate: new Date(Date.now() + 2500000000) },
    adminUser.id
  );
  assert(Boolean(extraInst.id), `Added 3rd installment to plan (${extraInst.id})`);

  console.log('\n4. TEST PART B: PRIORITY 3 — OFFLINE PAYMENT PROOF VERIFICATION');
  console.log('------------------------------------------------------');

  // Create another invoice for proof
  const invoice2 = await prisma.invoice.create({
    data: {
      invoiceNo: `INV-PROOF-${Date.now().toString().slice(-6)}`,
      studentId: newStudent.id,
      amount: 350,
      tax: 0,
      total: 350,
      amountPaid: 0,
      currency: 'USD',
      status: 'SENT',
      createdBy: adminUser.id,
    },
  });

  const proof = await paymentProofService.create(
    {
      studentId: newStudent.id,
      invoiceId: invoice2.id,
      amount: 350,
      paymentMode: 'BANK_TRANSFER',
      transactionRef: 'SBI-UTR-9918237',
      proofDocumentUrl: 'https://example.com/slips/slip-01.jpg',
      notes: 'Fee transfer via net banking',
    },
    devAgentUser.id
  );

  assert(proof.status === 'PENDING', 'Payment proof submitted and queued in PENDING status');

  const reviewResult = await paymentProofService.review(
    proof.id,
    { status: 'APPROVED', reviewNotes: 'Verified against bank statement' },
    adminUser.id
  );

  assert(reviewResult.proof.status === 'APPROVED', 'Payment proof successfully APPROVED');
  assert(Boolean(reviewResult.payment?.id), 'Approval automatically recorded AdmissionPayment in database');
  assert(Boolean(reviewResult.receipt?.receiptNo), 'Approval automatically generated AdmissionReceipt');

  const reloadedInv2 = await prisma.invoice.findUnique({ where: { id: invoice2.id } });
  assert(Number(reloadedInv2.amountPaid) === 350 && reloadedInv2.status === 'PAID', 'Invoice automatically updated to PAID on proof approval');

  console.log('\n5. TEST PART B: PRIORITY 4 — REFUND MANAGEMENT');
  console.log('------------------------------------------------------');

  const refund = await refundService.requestRefund(
    {
      studentId: newStudent.id,
      invoiceId: invoice.id,
      amount: 200,
      reason: 'Visa processing discount / scholarship adjustment',
      refundMethod: 'BANK_TRANSFER',
    },
    adminUser.id
  );

  assert(refund.status === 'PENDING', `Refund request created (${refund.refundNo})`);

  const approvedRefund = await refundService.approveRefund(refund.id, adminUser.id);
  assert(approvedRefund.status === 'APPROVED', 'Refund status updated to APPROVED');

  const disbursedRefund = await refundService.disburseRefund(
    refund.id,
    { refundTxRef: 'REF-TX-882190', refundMethod: 'BANK_TRANSFER' },
    adminUser.id
  );

  assert(disbursedRefund.status === 'PAID', 'Refund disbursed and marked PAID');
  const reloadedInv = await prisma.invoice.findUnique({ where: { id: invoice.id } });
  assert(Number(reloadedInv.amountPaid) === 800, `Invoice amountPaid adjusted down to 800 after refund of 200`);

  console.log('\n6. TEST PART B: PRIORITY 5 & 6 — EXPENSES & GENERAL LEDGER');
  console.log('------------------------------------------------------');

  const category = await expenseService.createCategory(
    { name: `Marketing-${timestamp}`, code: `MKTG-${timestamp}`, description: 'Digital Ads' },
    company.id
  );

  assert(Boolean(category.id), `Expense category created (${category.name})`);

  const expense = await expenseService.create(
    {
      branchId: branch.id,
      categoryId: category.id,
      title: 'Google Search Ads Campaign',
      amount: 150,
      paymentMethod: 'CARD',
      vendorName: 'Google LLC',
    },
    adminUser.id
  );

  assert(expense.status === 'PENDING', 'Expense created with PENDING status');

  const approvedExp = await expenseService.approve(expense.id, adminUser.id);
  assert(approvedExp.status === 'APPROVED', 'Expense approved');

  const paidExp = await expenseService.pay(expense.id, adminUser.id);
  assert(paidExp.status === 'PAID', 'Expense paid and marked settled');

  // Verify Ledger Entries
  const ledgerList = await ledgerService.getAll({ branchId: branch.id, limit: 10 });
  assert(ledgerList.data.length > 0, `General Ledger has ${ledgerList.data.length} chronological entries`);

  const ledgerSummary = await ledgerService.getSummary({ branchId: branch.id });
  assert(ledgerSummary.totalCredits > 0, `Ledger total credits recorded: $${ledgerSummary.totalCredits}`);
  assert(ledgerSummary.totalDebits > 0, `Ledger total debits recorded: $${ledgerSummary.totalDebits}`);

  console.log('\n7. TEST PART B: PRIORITY 7 — ACCOUNTANT DASHBOARD AGGREGATION');
  console.log('------------------------------------------------------');

  const dashboard = await invoiceService.getAccountantDashboard({ branchId: branch.id }, adminUser);
  assert(dashboard.kpis.totalBilled > 0, `Dashboard aggregated totalBilled: $${dashboard.kpis.totalBilled}`);
  assert(dashboard.kpis.totalCollected > 0, `Dashboard aggregated totalCollected: $${dashboard.kpis.totalCollected}`);
  assert(dashboard.kpis.todayCollected >= 0, `Dashboard todayCollected: $${dashboard.kpis.todayCollected}`);
  assert(Array.isArray(dashboard.recentPayments), 'Dashboard recentPayments array populated');

  console.log('\n======================================================');
  console.log(`TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSuite().catch((err) => {
  console.error('Test Suite Error:', err);
  process.exit(1);
}).finally(() => prisma.$disconnect());
