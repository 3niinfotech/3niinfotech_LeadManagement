/**
 * 3NI INFOTECH - Clean Responsive HTML Email Templates
 * Standard corporate email layout:
 * - Real live logo (CID inline attachment for Gmail/Outlook/Apple Mail, data URI for browser preview)
 * - Clean full-width responsive design (no awkward card shadows, no grey outer padding)
 * - Clean left-aligned tables for reference data
 * - Human, non-repetitive copy (company name mentioned naturally, not 5 times in 5 lines)
 * - Single unified clean footer with real address, phone, email, and GSTIN/CIN
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../../config/index.js';
import { getCachedCompanyBrand } from '../../utils/companyBrand.util.js';

const CLIENT_URL = config.smtp?.clientUrl || 'http://localhost:3001';

let cachedLogoDataUri = null;

export function getCompanyLogoDataUri() {
  if (cachedLogoDataUri) return cachedLogoDataUri;
  try {
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const candidatePaths = [
      path.resolve(__dirname, '../../../../frontend/public/assets/images/brand/logo.jpg'),
      path.resolve(__dirname, '../../../uploads/company/a7c7c0df-60c6-4a73-88d0-92b2fa521655/logo.jpg'),
      path.resolve(process.cwd(), 'frontend/public/assets/images/brand/logo.jpg'),
      path.resolve(process.cwd(), '../frontend/public/assets/images/brand/logo.jpg'),
      path.resolve(process.cwd(), 'backend/uploads/company/a7c7c0df-60c6-4a73-88d0-92b2fa521655/logo.jpg'),
    ];

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        const buf = fs.readFileSync(p);
        cachedLogoDataUri = `data:image/jpeg;base64,${buf.toString('base64')}`;
        return cachedLogoDataUri;
      }
    }
  } catch (err) {
    console.warn('[emailTemplates] Logo loading note:', err.message);
  }
  return null;
}

/**
 * Replaces CID logo references with base64 data URI for browser iframe preview
 */
export function renderForPreview(html) {
  if (!html) return '';
  const dataUri = getCompanyLogoDataUri();
  if (dataUri && html.includes('cid:company-logo@3niinfotech.com')) {
    return html.replace(/cid:company-logo@3niinfotech\.com/g, dataUri);
  }
  return html;
}

export function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Clean reference table: Left-aligned labels and values, clean borders, responsive
 */
export function renderInfoTable(rows = []) {
  if (!rows || rows.length === 0) return '';
  const rowsHtml = rows
    .filter(r => r && r.value != null && r.value !== '')
    .map((r, i, arr) => {
      const isLast = i === arr.length - 1;
      const borderBottom = isLast ? 'none' : '1px solid #f1f5f9';
      const rowBg = r.highlight ? '#f0fdf4' : (i % 2 === 1 ? '#fafafa' : '#ffffff');
      const labelColor = r.highlight ? '#166534' : '#64748b';
      const valColor = r.highlight ? '#15803d' : (r.color || '#0f172a');
      const valWeight = r.highlight || r.bold ? '700' : '600';
      const customValStyle = r.style ? ` ${r.style}` : '';

      return `
        <tr style="background-color: ${rowBg};">
          <td valign="top" style="padding: 10px 14px; width: 36%; color: ${labelColor}; font-size: 13px; font-weight: 500; border-bottom: ${borderBottom}; text-align: left;">
            ${escapeHtml(r.label)}
          </td>
          <td valign="top" style="padding: 10px 14px; width: 64%; color: ${valColor}; font-size: 13px; font-weight: ${valWeight}; border-bottom: ${borderBottom}; text-align: left;${customValStyle}">
            ${r.isHtml ? r.value : escapeHtml(r.value)}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; border-collapse: collapse; margin: 18px 0 22px 0; border: 1px solid #e2e8f0; border-radius: 6px; overflow: hidden;">
      ${rowsHtml}
    </table>
  `;
}

/**
 * Master responsive layout wrapper
 * Full-width, clean, non-repetitive, authentic corporate design.
 */
export function wrapEmailTemplate({
  title,
  preheader = '',
  bodyHtml,
  ctaText = null,
  ctaUrl = null,
  footerNote = null,
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();
  const brandName = (brand.name || '3ni InfoTech').trim();
  const brandLegalName = brand.legalName || '3ni Infotech Education & Visa Services Pvt. Ltd.';
  const brandAddress = brand.fullAddress || '101, Shivalik Plaza, SG Highway, Near Iscon Cross Road, Ahmedabad, Gujarat 380015';
  const brandPhone = brand.phone || '+91 79 1234 5678';
  const brandEmail = brand.email || 'info@3niinfotech.com';
  const brandWebsite = brand.website || 'https://www.3niinfotech.com';
  const currentYear = new Date().getFullYear();

  // If rendering for browser preview, use base64 data URI; otherwise use CID attachment for live emails
  const logoSrc = forPreview
    ? (getCompanyLogoDataUri() || 'cid:company-logo@3niinfotech.com')
    : 'cid:company-logo@3niinfotech.com';

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #ffffff;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    table { border-collapse: collapse; }
    img { border: 0; outline: none; text-decoration: none; display: block; }
    .email-container {
      width: 100%;
      max-width: 620px;
      margin: 0 auto;
      background-color: #ffffff;
      padding: 24px 20px 36px 20px;
      box-sizing: border-box;
    }
    .email-title {
      font-size: 20px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.35;
      text-align: left;
    }
    .email-text {
      font-size: 14px;
      line-height: 1.6;
      color: #334155;
      margin: 0 0 16px 0;
      text-align: left;
    }
    .cta-btn {
      display: inline-block;
      background-color: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 11px 24px;
      border-radius: 6px;
    }
    @media only screen and (max-width: 600px) {
      .email-container { padding: 16px 14px !important; }
      .email-title { font-size: 18px !important; }
      .email-text { font-size: 13.5px !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #ffffff; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  ${preheader ? `<span style="display:none !important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">${escapeHtml(preheader)}</span>` : ''}
  
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; width: 100%;">
    <tr>
      <td align="center">
        <div class="email-container" style="max-width: 620px; margin: 0 auto; text-align: left; padding: 24px 20px 36px 20px;">
          
          <!-- Clean Header (Logo + Brand Name once) -->
          <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="border-bottom: 1px solid #e2e8f0; padding-bottom: 16px; margin-bottom: 24px;">
            <tr>
              <td valign="middle" style="width: 44px;">
                <img src="${logoSrc}" alt="${escapeHtml(brandName)}" width="40" height="44" style="display: block; width: 40px; height: auto; max-height: 44px; border-radius: 4px; object-fit: contain;" />
              </td>
              <td valign="middle" style="padding-left: 12px; text-align: left;">
                <span style="font-size: 18px; font-weight: 800; color: #0f172a; letter-spacing: -0.2px; line-height: 1.2;">
                  ${escapeHtml(brandName)}
                </span>
                <span style="display: block; font-size: 11px; font-weight: 500; color: #64748b; margin-top: 2px;">
                  Overseas Education Advisory &amp; Visa Consultancy
                </span>
              </td>
            </tr>
          </table>

          <!-- Main Content Body -->
          <h1 class="email-title" style="font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; line-height: 1.35; text-align: left;">
            ${escapeHtml(title)}
          </h1>

          ${bodyHtml}

          ${ctaText && ctaUrl ? `
            <div style="margin: 24px 0 18px 0; text-align: left;">
              <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn" style="display: inline-block; background-color: #2563eb; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 11px 24px; border-radius: 6px;">
                ${escapeHtml(ctaText)} &rarr;
              </a>
            </div>
          ` : ''}

          ${footerNote ? `
            <p style="font-size: 12px; color: #94a3b8; margin-top: 16px; line-height: 1.5; text-align: left;">
              ${escapeHtml(footerNote)}
            </p>
          ` : ''}

          <!-- Single Clean Unified Footer -->
          <div style="border-top: 1px solid #e2e8f0; margin-top: 32px; padding-top: 18px; font-size: 12px; color: #64748b; line-height: 1.6; text-align: left;">
            <div style="font-weight: 600; color: #334155; margin-bottom: 3px;">
              ${escapeHtml(brandLegalName)}
            </div>
            <div style="color: #64748b; margin-bottom: 4px;">
              ${escapeHtml(brandAddress)}
            </div>
            <div style="color: #64748b; margin-bottom: 6px;">
              Phone: ${escapeHtml(brandPhone)} &nbsp;|&nbsp; 
              Email: <a href="mailto:${escapeHtml(brandEmail)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(brandEmail)}</a> &nbsp;|&nbsp; 
              Web: <a href="${escapeHtml(brandWebsite)}" target="_blank" style="color: #2563eb; text-decoration: none;">${escapeHtml(brandWebsite.replace(/^https?:\/\//, ''))}</a>
            </div>
            <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #f1f5f9; padding-top: 8px; margin-top: 6px;">
              GSTIN: ${escapeHtml(brand.taxNumber || '24AABCU9603R1ZM')} &bull; CIN: ${escapeHtml(brand.registrationNumber || 'U80900GJ2018PTC105432')} &bull; &copy; ${currentYear} ${escapeHtml(brandName)}
            </div>
          </div>

        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/* ==========================================================================
   SPECIFIC EMAIL BUILDERS
   ========================================================================== */

/**
 * 1. Welcome Email (New Student / Staff Portal Account)
 */
export function buildWelcomeEmail({
  name,
  email,
  tempPassword = null,
  roleName = 'Student',
  loginUrl = `${CLIENT_URL}/login`,
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();
  const subject = `Your Account Credentials — Portal Access`;

  const rows = [
    { label: 'Registered Name', value: name },
    { label: 'Login Email', value: email },
    { label: 'Account Role', value: roleName },
  ];

  if (tempPassword) {
    rows.push({
      label: 'Temporary Password',
      value: `<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #0f172a; font-family: monospace;">${escapeHtml(tempPassword)}</code>`,
      isHtml: true,
    });
  }

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(name)}</strong>,</p>
    <p class="email-text">Your portal account has been set up. You can log in using the credentials below to view your applications, documents, and fee details.</p>
    
    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #64748b;">
      ${tempPassword ? 'Please log in and update your password from your profile settings.' : 'You can log in using the password set during registration.'}
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Portal Account Details',
      preheader: 'Your official portal account has been created.',
      bodyHtml,
      ctaText: 'Access Portal',
      ctaUrl: loginUrl,
      company: brand,
      forPreview,
    }),
  };
}

/**
 * 2. Password Reset / Recovery Email
 */
export function buildPasswordResetEmail({
  name,
  email,
  resetTime = new Date().toLocaleString('en-IN'),
  loginUrl = `${CLIENT_URL}/login`,
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();
  const brandPhone = brand?.phone || '+91 79 1234 5678';
  const subject = `Security Notice: Password Reset Confirmation`;

  const rows = [
    { label: 'Account Email', value: email },
    { label: 'Timestamp', value: resetTime },
    { label: 'Status', value: 'Active & Secured', color: '#16a34a' },
  ];

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(name)}</strong>,</p>
    <p class="email-text">This is a security confirmation that your account password was changed successfully.</p>

    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #dc2626;">
      If you did not perform this action, please contact our administrative desk immediately at <strong>${escapeHtml(brandPhone)}</strong>.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Password Reset Confirmation',
      preheader: 'Security confirmation of your recent password reset.',
      bodyHtml,
      ctaText: 'Log In to Portal',
      ctaUrl: loginUrl,
      company: brand,
      forPreview,
    }),
  };
}

/**
 * 3. Announcement Broadcast Email
 */
export function buildAnnouncementEmail({
  title,
  body,
  audience = 'All Staff & Students',
  publishedBy = 'Administration',
  announcementUrl = `${CLIENT_URL}/admin/master/announcements`,
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();
  const subject = `Notice: ${title}`;

  const rows = [
    { label: 'Target Audience', value: audience },
    { label: 'Published By', value: publishedBy },
    { label: 'Date', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
  ];

  const bodyHtml = `
    <div style="background-color: #f8fafc; border-left: 3px solid #2563eb; padding: 14px 16px; margin: 16px 0; font-size: 14px; line-height: 1.6; color: #1e293b;">
      ${escapeHtml(body).replace(/\n/g, '<br/>')}
    </div>

    ${renderInfoTable(rows)}
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: title || 'Official Notice',
      preheader: body ? body.slice(0, 100) : 'New announcement posted',
      bodyHtml,
      ctaText: 'View Notice in CRM',
      ctaUrl: announcementUrl,
      company: brand,
      forPreview,
    }),
  };
}

/**
 * 4. Task Assigned Email
 */
export function buildTaskAssignedEmail({
  taskTitle,
  description = '',
  priority = 'MEDIUM',
  dueDate = null,
  assigneeName,
  assignedByName = 'CRM System',
  taskUrl = `${CLIENT_URL}/admin/tasks`,
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();
  const subject = `Task Assigned [${priority}]: ${taskTitle}`;

  const priorityColors = {
    URGENT: '#dc2626',
    HIGH: '#d97706',
    MEDIUM: '#2563eb',
    LOW: '#64748b',
  };

  const rows = [
    { label: 'Task Title', value: taskTitle, bold: true },
    { label: 'Assigned To', value: assigneeName },
    {
      label: 'Priority',
      value: `<span style="color: ${priorityColors[priority] || '#2563eb'}; font-weight: 700;">${escapeHtml(priority)}</span>`,
      isHtml: true,
    },
    {
      label: 'Due Date',
      value: dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No strict deadline',
    },
    { label: 'Assigned By', value: assignedByName },
  ];

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(assigneeName)}</strong>,</p>
    <p class="email-text">A new task has been assigned to you:</p>

    ${renderInfoTable(rows)}

    ${description ? `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 12px 14px; border-radius: 6px; font-size: 13px; line-height: 1.5; color: #334155; margin-bottom: 18px;">
        <strong style="color: #0f172a;">Task Notes:</strong><br/>
        ${escapeHtml(description)}
      </div>
    ` : ''}
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'New Task Assigned',
      preheader: `Task assigned: ${taskTitle}`,
      bodyHtml,
      ctaText: 'Open Task in CRM',
      ctaUrl: taskUrl,
      company: brand,
      forPreview,
    }),
  };
}

/**
 * 5. Student Document Upload Alert (Sent to Counselor / Staff)
 */
export function buildStudentDocUploadStaffEmail({
  counselorName,
  studentName,
  studentCode,
  documentName,
  category = 'GENERAL',
  uploadedAt = new Date().toLocaleString('en-IN'),
  reviewUrl = `${CLIENT_URL}/admin/students`,
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();
  const subject = `Document Uploaded: ${studentName} (${documentName})`;

  const rows = [
    { label: 'Student Name', value: studentName },
    { label: 'Student ID', value: studentCode || '—', color: '#2563eb', bold: true },
    { label: 'Document', value: documentName },
    { label: 'Category', value: category },
    { label: 'Uploaded At', value: uploadedAt },
  ];

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(counselorName || 'Counselor')}</strong>,</p>
    <p class="email-text">Student <strong>${escapeHtml(studentName)}</strong> has uploaded a new document for verification:</p>

    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #64748b;">
      Please inspect this document and mark it as Verified or request a re-upload.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Document Uploaded for Verification',
      preheader: `${studentName} uploaded ${documentName}`,
      bodyHtml,
      ctaText: 'Review Documents',
      ctaUrl: reviewUrl,
      company: brand,
      forPreview,
    }),
  };
}

/**
 * 6. Student Document Upload Acknowledgment (Sent to Student)
 */
export function buildStudentDocUploadAckEmail({
  studentName,
  documentName,
  category = 'GENERAL',
  portalUrl = `${CLIENT_URL}/student/documents`,
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();
  const subject = `Document Received: ${documentName}`;

  const rows = [
    { label: 'Document Name', value: documentName, bold: true },
    { label: 'Category', value: category },
    { label: 'Status', value: 'Under Review', color: '#0284c7', bold: true },
  ];

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    <p class="email-text">We have received your document submission: <strong>${escapeHtml(documentName)}</strong>.</p>

    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #475569;">
      Our team will review this document against university criteria and notify you once verified.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Document Received',
      preheader: `We received ${documentName} for review.`,
      bodyHtml,
      ctaText: 'View Documents',
      ctaUrl: portalUrl,
      company: brand,
      forPreview,
    }),
  };
}

/**
 * 7. Demo Class Scheduled Email (Sent to Student)
 */
export function buildDemoScheduledEmail({
  studentName,
  courseName,
  demoDate,
  demoTime,
  facultyName = 'Senior Faculty',
  batch = 'Morning Batch',
  venue = 'Surat Head Office / Online Classroom',
  portalUrl = `${CLIENT_URL}/login`,
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();
  const brandPhone = brand?.phone || '+91 79 1234 5678';
  const subject = `Demo Class Scheduled: ${courseName}`;

  const rows = [
    { label: 'Course', value: courseName, color: '#2563eb', bold: true },
    { label: 'Date', value: demoDate },
    { label: 'Time', value: demoTime },
    { label: 'Faculty', value: facultyName },
    { label: 'Batch', value: batch },
    { label: 'Venue', value: venue },
  ];

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    <p class="email-text">Your trial coaching & advisory demo session has been scheduled. Details are below:</p>

    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #475569;">
      Please join 10 minutes prior to session start. For rescheduling, contact our admissions desk at <strong>${escapeHtml(brandPhone)}</strong>.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Demo Class Scheduled',
      preheader: `Demo scheduled for ${courseName} on ${demoDate} at ${demoTime}`,
      bodyHtml,
      ctaText: 'Open Portal',
      ctaUrl: portalUrl,
      company: brand,
      forPreview,
    }),
  };
}

/**
 * 8. Enquiry & Visitor Welcome Email
 */
export function buildEnquiryWelcomeEmail({
  studentName,
  enquiryCode,
  courseName = 'Overseas Education & Coaching',
  country = 'Global',
  counsellorName = 'Senior Education Advisor',
  counsellorPhone = '',
  counsellorEmail = '',
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();
  const brandPhone = counsellorPhone || brand.phone || '+91 79 1234 5678';

  const subject = `Thank you for your visit (Enquiry #${enquiryCode || 'NEW'})`;

  const rows = [
    { label: 'Enquiry Reference', value: `#${enquiryCode || 'PENDING'}`, color: '#2563eb', bold: true },
    { label: 'Interested Program', value: courseName },
    { label: 'Destination', value: country },
    { label: 'Assigned Advisor', value: counsellorName },
  ];

  if (counsellorPhone) {
    rows.push({ label: 'Advisor Phone', value: counsellorPhone });
  }

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(studentName || 'Student')}</strong>,</p>
    <p class="email-text">Thank you for visiting us and connecting with our overseas advisory team. Below is a summary of your enquiry details and what happens next:</p>

    ${renderInfoTable(rows)}

    <div style="background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin: 18px 0;">
      <p style="font-weight: 700; color: #0f172a; margin: 0 0 6px 0; font-size: 13px;">Next Steps:</p>
      <ul style="padding-left: 18px; margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">
        <li style="margin-bottom: 4px;">Your counselor will evaluate your profile and university eligibility.</li>
        <li style="margin-bottom: 4px;">We will prepare your tailored university shortlist and tuition fee schedule.</li>
        <li style="margin-bottom: 4px;">Upon enrollment, you will receive full credentials for the Student Portal.</li>
      </ul>
    </div>

    <p class="email-text" style="font-size: 13px; color: #64748b;">
      Have questions or need assistance? Reply directly to this email or call us at <strong>${escapeHtml(brandPhone)}</strong>.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: `Thank you for your visit, ${studentName || 'Student'}`,
      preheader: `Thank you for connecting with us. Enquiry reference: #${enquiryCode}`,
      bodyHtml,
      ctaText: 'Visit Our Website',
      ctaUrl: brand.website || 'https://www.3niinfotech.com',
      company: brand,
      forPreview,
    }),
  };
}

/**
 * 9. Student Portal Welcome & Onboarding Email
 */
export function buildStudentPortalWelcomeEmail({
  studentName,
  studentCode,
  email,
  tempPassword = '123',
  courseName = 'Overseas Education',
  counsellorName = 'Dedicated Advisor',
  portalUrl = `${CLIENT_URL}/login/student`,
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();

  const subject = `Your Student Portal Account is Ready (ID: ${studentCode})`;

  const rows = [
    { label: 'Student ID', value: studentCode, color: '#2563eb', bold: true },
    { label: 'Portal Login Email', value: email },
    {
      label: 'Default Password',
      value: `<code style="background: #f1f5f9; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #0f172a; font-family: monospace;">${escapeHtml(tempPassword)}</code> <span style="font-size: 11px; color: #64748b; font-weight: normal;">(Change after first login)</span>`,
      isHtml: true,
    },
    { label: 'Enrolled Program', value: courseName },
    { label: 'Assigned Advisor', value: counsellorName },
  ];

  const bodyHtml = `
    <p class="email-text">Dear <strong>${escapeHtml(studentName)}</strong>,</p>
    <p class="email-text">Your student account has been created. You can now log in to the Student Portal to track applications, upload required documents, and access fee receipts.</p>

    ${renderInfoTable(rows)}

    <div style="background-color: #fafafa; border: 1px solid #e2e8f0; border-radius: 6px; padding: 14px 16px; margin: 18px 0;">
      <p style="font-weight: 700; color: #0f172a; margin: 0 0 6px 0; font-size: 13px;">Inside Your Portal, You Can:</p>
      <ul style="padding-left: 18px; margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">
        <li style="margin-bottom: 4px;">Upload academic transcripts, passport, and test scorecards securely.</li>
        <li style="margin-bottom: 4px;">Track university offer letters and visa application progress in real time.</li>
        <li style="margin-bottom: 4px;">Download official GST tax invoices and payment receipts anytime.</li>
      </ul>
    </div>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Your Student Portal is Ready',
      preheader: `Welcome to the Student Portal. Student ID: ${studentCode}`,
      bodyHtml,
      ctaText: 'Sign In to Student Portal',
      ctaUrl: portalUrl,
      footerNote: 'Please keep your credentials secure. You can update your password anytime from your profile.',
      company: brand,
      forPreview,
    }),
  };
}

/**
 * 10. Fee Payment Receipt & Invoice Email
 */
export function buildFeeReceiptInvoiceEmail({
  studentName,
  studentCode = '',
  invoiceNo,
  amountPaid,
  totalAmount,
  balanceDue = 0,
  paymentMode = 'Online',
  transactionDate = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
  courseName = 'Consultancy & Tuition Fees',
  portalUrl = `${CLIENT_URL}/student/fees`,
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();

  const subject = `Receipt & Tax Invoice #${invoiceNo}`;

  const rows = [
    { label: 'Invoice Number', value: `#${invoiceNo}`, color: '#2563eb', bold: true },
    { label: 'Payment Date', value: transactionDate },
    { label: 'Payment Method', value: paymentMode },
    {
      label: 'Amount Paid',
      value: `₹${Number(amountPaid || 0).toLocaleString('en-IN')}`,
      highlight: true,
      bold: true,
    },
  ];

  if (balanceDue > 0) {
    rows.push({
      label: 'Remaining Balance',
      value: `₹${Number(balanceDue).toLocaleString('en-IN')}`,
      color: '#b45309',
      bold: true,
    });
  } else {
    rows.push({
      label: 'Payment Status',
      value: 'Fully Paid ✓',
      color: '#15803d',
      bold: true,
    });
  }

  const bodyHtml = `
    <p class="email-text">Dear <strong>${escapeHtml(studentName)}</strong>,</p>
    <p class="email-text">Thank you for your payment. We have received your fee installment for <strong>${escapeHtml(courseName)}</strong>. Details are summarized below:</p>

    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #64748b;">
      A permanent record of this transaction and official GST invoice copy is stored in your Student Portal under <strong>Fees & Receipts</strong>.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: `Payment Receipt &amp; Invoice #${invoiceNo}`,
      preheader: `Payment received for Invoice #${invoiceNo}. Amount: ₹${amountPaid}`,
      bodyHtml,
      ctaText: 'View Receipts in Portal',
      ctaUrl: portalUrl,
      company: brand,
      forPreview,
    }),
  };
}

/**
 * 11. Application Milestone Update Email
 */
export function buildApplicationMilestoneEmail({
  studentName,
  universityName,
  courseName,
  status,
  remarks = '',
  portalUrl = `${CLIENT_URL}/student/applications`,
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();
  const isOffer = /offer/i.test(status);

  const subject = `${isOffer ? 'Offer Received: ' : 'Application Update: '}${universityName} (${status})`;

  const rows = [
    { label: 'Institution', value: universityName, color: '#2563eb', bold: true },
    { label: 'Program', value: courseName },
    {
      label: 'Status',
      value: status,
      color: isOffer ? '#15803d' : '#0284c7',
      bold: true,
    },
  ];

  if (remarks) {
    rows.push({ label: 'Remarks', value: remarks });
  }

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    <p class="email-text">Here is the latest update regarding your university admission application:</p>

    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #475569;">
      Please log in to your portal to review decision documents and complete any next conditions.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: `Application Status: ${universityName}`,
      preheader: `Update on your application to ${universityName}: ${status}`,
      bodyHtml,
      ctaText: 'View Application Details',
      ctaUrl: portalUrl,
      company: brand,
      forPreview,
    }),
  };
}

/**
 * 12. Visa Milestone & Approval Email
 */
export function buildVisaMilestoneEmail({
  studentName,
  country,
  status,
  visaType = 'Student Visa (Subclass / Study Permit)',
  remarks = '',
  portalUrl = `${CLIENT_URL}/student/visa`,
  company = null,
  forPreview = false,
}) {
  const brand = company || getCachedCompanyBrand();
  const isApproved = /approved|granted/i.test(status);

  const subject = `${isApproved ? 'Visa Approved: ' : 'Visa Update: '}${country} (${status})`;

  const rows = [
    { label: 'Country', value: country, color: '#2563eb', bold: true },
    { label: 'Visa Category', value: visaType },
    {
      label: 'Current Status',
      value: status,
      color: isApproved ? '#15803d' : '#0284c7',
      bold: true,
    },
  ];

  if (remarks) {
    rows.push({ label: 'Counselor Notes', value: remarks });
  }

  const bodyHtml = `
    <p class="email-text">Dear <strong>${escapeHtml(studentName)}</strong>,</p>
    <p class="email-text">${isApproved ? 'Congratulations! Your study visa application has been officially APPROVED.' : 'Here is an update regarding your student visa processing:'}</p>

    ${renderInfoTable(rows)}

    ${isApproved ? `
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 6px; padding: 14px 16px; margin-top: 18px;">
      <p style="font-weight: 700; color: #166534; margin: 0 0 6px 0; font-size: 13px;">Next Steps for Your Departure:</p>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #15803d; line-height: 1.6;">
        <li style="margin-bottom: 4px;">Attend our Pre-Departure Briefing session.</li>
        <li style="margin-bottom: 4px;">Review student accommodation, forex, and health insurance guidelines.</li>
        <li style="margin-bottom: 4px;">Download your official visa grant letter copy from the portal.</li>
      </ul>
    </div>
    ` : ''}
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: `Visa Application Update: ${country}`,
      preheader: `Visa update for ${country}: ${status}`,
      bodyHtml,
      ctaText: 'Open Visa Workspace',
      ctaUrl: portalUrl,
      company: brand,
      forPreview,
    }),
  };
}

/**
 * 13. Dynamic Template Variable Substitution
 */
export function renderDynamicTemplate(templateText, variables = {}) {
  if (!templateText) return '';
  return templateText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key) => {
    return variables[key] != null ? String(variables[key]) : `{{${key}}}`;
  });
}
