import emailService from './email.service.js';
import * as templates from './emailTemplates.js';
import prisma from '../../config/database.js';
import { getCachedCompanyBrand } from '../../utils/companyBrand.util.js';

// Anti-spam & intelligent cooldown cache (in-memory)
// Prevents students from being bombarded with 10-15 emails at once
const lastSentMap = new Map();
const COOLDOWN_SAME_EVENT_MS = 5 * 60 * 1000; // 5 minutes cooldown for same event type
const COOLDOWN_ANY_EVENT_MS = 45 * 1000;      // 45 seconds between consecutive emails to same recipient

function shouldThrottle(email, eventType) {
  if (!email) return true;
  const now = Date.now();
  const normalizedEmail = String(email).trim().toLowerCase();

  // Financial receipts are transactional & never throttled
  if (eventType === 'FEE_RECEIPT' || eventType === 'PAYMENT_RECEIPT') {
    lastSentMap.set(`${normalizedEmail}:GLOBAL`, now);
    lastSentMap.set(`${normalizedEmail}:${eventType}`, now);
    return false;
  }

  // Check same event cooldown
  const lastSameEvent = lastSentMap.get(`${normalizedEmail}:${eventType}`) || 0;
  if (now - lastSameEvent < COOLDOWN_SAME_EVENT_MS) {
    console.log(`[lifecycleEmail] Throttled ${eventType} to ${normalizedEmail} (sent ${Math.round((now - lastSameEvent) / 1000)}s ago)`);
    return true;
  }

  // Check rapid burst cooldown
  const lastAnyEvent = lastSentMap.get(`${normalizedEmail}:GLOBAL`) || 0;
  if (now - lastAnyEvent < COOLDOWN_ANY_EVENT_MS) {
    console.log(`[lifecycleEmail] Throttled burst email to ${normalizedEmail} (${Math.round((now - lastAnyEvent) / 1000)}s since last email)`);
    return true;
  }

  lastSentMap.set(`${normalizedEmail}:GLOBAL`, now);
  lastSentMap.set(`${normalizedEmail}:${eventType}`, now);
  return false;
}

/**
 * 1. Enquiry Welcome Email (When a lead or visitor registers)
 */
export async function triggerEnquiryWelcome({ enquiry, counsellor = null, company = null }) {
  if (!enquiry || !enquiry.email) return { skipped: true, reason: 'No enquiry email' };

  if (shouldThrottle(enquiry.email, 'ENQUIRY_CREATED')) {
    return { skipped: true, reason: 'Throttled to avoid rapid email spam' };
  }

  const brand = company || getCachedCompanyBrand();
  const studentName = `${enquiry.firstName || ''} ${enquiry.lastName || ''}`.trim() || 'Student';
  const enquiryCode = enquiry.enquiryCode || enquiry.code || 'PENDING';

  // Check if custom active template exists in DB
  const customTpl = await prisma.communicationTemplate.findFirst({
    where: {
      code: 'ENQUIRY_WELCOME',
      channel: 'EMAIL',
      isActive: true,
      deletedAt: null,
    },
  }).catch(() => null);

  let emailContent;
  if (customTpl && customTpl.body) {
    const vars = {
      studentName,
      enquiryCode,
      courseName: enquiry.interestedCourse || enquiry.course || 'Global Higher Education',
      country: enquiry.interestedCountry || enquiry.country || 'Global',
      counsellorName: counsellor?.name || 'Assigned Senior Counselor',
      counsellorPhone: counsellor?.phone || brand?.phone || '',
      companyName: brand?.name || '3ni Infotech',
    };
    const renderedBody = templates.renderDynamicTemplate(customTpl.body, vars);
    const renderedSubject = templates.renderDynamicTemplate(customTpl.subject || `Welcome to ${brand.name} (Enquiry #${enquiryCode})`, vars);
    emailContent = {
      subject: renderedSubject,
      html: templates.wrapEmailTemplate({
        title: 'Thank you for your enquiry',
        bodyHtml: renderedBody,
        ctaText: 'Explore Programs',
        ctaUrl: brand.website || 'https://www.3niinfotech.com',
        company: brand,
      }),
    };
  } else {
    emailContent = templates.buildEnquiryWelcomeEmail({
      studentName,
      enquiryCode,
      courseName: enquiry.interestedCourse || enquiry.course || 'Global Higher Education',
      country: enquiry.interestedCountry || enquiry.country || 'Global',
      counsellorName: counsellor?.name || 'Assigned Senior Counselor',
      counsellorPhone: counsellor?.phone || brand?.phone || '',
      counsellorEmail: counsellor?.email || brand?.email || '',
      company: brand,
    });
  }

  return emailService.safeSendEmail({
    to: enquiry.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });
}

/**
 * 2. Student Portal Access & Onboarding (When an enquiry converts or student is enrolled)
 */
export async function triggerStudentWelcome({ student, plainPassword = '123', counsellor = null, company = null }) {
  if (!student || !student.email) return { skipped: true, reason: 'No student email' };

  if (shouldThrottle(student.email, 'STUDENT_CREATED')) {
    return { skipped: true, reason: 'Throttled to avoid rapid email spam' };
  }

  const brand = company || getCachedCompanyBrand();
  const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';
  const studentCode = student.studentCode || 'STU-NEW';

  const emailContent = templates.buildStudentPortalWelcomeEmail({
    studentName,
    studentCode,
    email: student.email,
    tempPassword: plainPassword,
    courseName: student.course || student.interestedCourse || 'Higher Education & Visa',
    counsellorName: counsellor?.name || 'Personal Education Advisor',
    company: brand,
  });

  return emailService.safeSendEmail({
    to: student.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });
}

/**
 * 3. Fee Payment Receipt & Invoice Email (Sent immediately on payment)
 */
export async function triggerFeeReceipt({ invoice, payment = null, student = null, company = null }) {
  const recipientEmail = student?.email || invoice?.student?.email || invoice?.metadata?.email;
  if (!recipientEmail) return { skipped: true, reason: 'No recipient email for invoice' };

  const brand = company || getCachedCompanyBrand();
  const studentName = student
    ? `${student.firstName || ''} ${student.lastName || ''}`.trim()
    : invoice?.student
      ? `${invoice.student.firstName || ''} ${invoice.student.lastName || ''}`.trim()
      : 'Valued Student';

  const amountPaid = payment?.amount != null ? Number(payment.amount) : Number(invoice.amount || 0);
  const totalAmount = Number(invoice.total || invoice.amount || 0);
  const balanceDue = Math.max(0, totalAmount - amountPaid);

  const emailContent = templates.buildFeeReceiptInvoiceEmail({
    studentName,
    studentCode: student?.studentCode || invoice?.student?.studentCode || '',
    invoiceNo: invoice.invoiceNo || 'INV-REC',
    amountPaid,
    totalAmount,
    balanceDue,
    paymentMode: payment?.paymentMode || invoice?.metadata?.paymentMode || 'Digital Banking / UPI',
    transactionDate: payment?.paymentDate ? new Date(payment.paymentDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : undefined,
    courseName: student?.course || invoice?.notes || 'Tuition & Consultancy Services',
    company: brand,
  });

  return emailService.safeSendEmail({
    to: recipientEmail,
    subject: emailContent.subject,
    html: emailContent.html,
  });
}

/**
 * 4. Application Milestone Update Email
 */
export async function triggerApplicationMilestone({ application, student, status, remarks = '', company = null }) {
  if (!student?.email) return { skipped: true, reason: 'No student email' };

  if (shouldThrottle(student.email, `APP_${status}`)) {
    return { skipped: true, reason: 'Throttled application milestone update' };
  }

  const brand = company || getCachedCompanyBrand();
  const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';

  const emailContent = templates.buildApplicationMilestoneEmail({
    studentName,
    universityName: application?.universityName || application?.university || 'Partner University',
    courseName: application?.courseName || application?.course || 'Academic Program',
    status: status || application?.status || 'In Review',
    remarks,
    company: brand,
  });

  return emailService.safeSendEmail({
    to: student.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });
}

/**
 * 5. Visa Milestone & Grant Email
 */
export async function triggerVisaMilestone({ visa, student, status, remarks = '', company = null }) {
  if (!student?.email) return { skipped: true, reason: 'No student email' };

  if (shouldThrottle(student.email, `VISA_${status}`)) {
    return { skipped: true, reason: 'Throttled visa milestone update' };
  }

  const brand = company || getCachedCompanyBrand();
  const studentName = `${student.firstName || ''} ${student.lastName || ''}`.trim() || 'Student';

  const emailContent = templates.buildVisaMilestoneEmail({
    studentName,
    country: visa?.country || student?.country || 'Study Destination',
    status: status || visa?.status || 'Processing',
    visaType: visa?.visaType || 'Student Visa',
    remarks,
    company: brand,
  });

  return emailService.safeSendEmail({
    to: student.email,
    subject: emailContent.subject,
    html: emailContent.html,
  });
}

export default {
  triggerEnquiryWelcome,
  triggerStudentWelcome,
  triggerFeeReceipt,
  triggerApplicationMilestone,
  triggerVisaMilestone,
};
