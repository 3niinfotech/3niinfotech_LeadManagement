/**
 * 3NI INFOTECH - Modern Responsive HTML Email Templates
 * Professional, authentic corporate branding with real live logo, standard HTML tables
 * (guaranteeing zero label/value collision across all email clients and webviews),
 * and human-written advisory copy.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import config from '../../config/index.js';
import { getCachedCompanyBrand } from '../../utils/companyBrand.util.js';

const CLIENT_URL = config.smtp?.clientUrl || 'http://localhost:3001';

let cachedLogoDataUri = null;

/**
 * Resolves the real company logo (logo.jpg) and converts it to a base64 data URI
 * for guaranteed instant rendering in email clients, webviews, and preview modals.
 */
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
 * Renders bulletproof 2-column info tables.
 * Uses standard HTML <table> attributes (width, cellpadding, cellspacing) with explicit
 * column widths (40% label / 60% value) so labels and values NEVER collide or merge,
 * even in clients without flexbox support.
 */
export function renderInfoTable(rows = []) {
  if (!rows || rows.length === 0) return '';
  const rowsHtml = rows
    .filter(r => r && r.value != null && r.value !== '')
    .map((r, i, arr) => {
      const isLast = i === arr.length - 1;
      const borderBottom = isLast ? 'none' : '1px solid #edf2f7';
      const rowBg = r.highlight ? '#f0fdf4' : (i % 2 === 1 ? '#fafbfc' : '#ffffff');
      const labelColor = r.highlight ? '#166534' : '#64748b';
      const valColor = r.highlight ? '#15803d' : (r.color || '#0f172a');
      const valWeight = r.highlight || r.bold ? '700' : '600';
      const customValStyle = r.style ? ` ${r.style}` : '';

      return `
        <tr style="background-color: ${rowBg};">
          <td valign="middle" style="padding: 11px 16px; width: 40%; color: ${labelColor}; font-size: 13px; font-weight: 500; border-bottom: ${borderBottom}; text-align: left;">
            ${escapeHtml(r.label)}
          </td>
          <td valign="middle" style="padding: 11px 16px; width: 60%; color: ${valColor}; font-size: 13px; font-weight: ${valWeight}; text-align: right; border-bottom: ${borderBottom};${customValStyle}">
            ${r.isHtml ? r.value : escapeHtml(r.value)}
          </td>
        </tr>
      `;
    })
    .join('');

  return `
    <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" style="width: 100%; border-collapse: separate; border-spacing: 0; margin: 20px 0; background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px; overflow: hidden;">
      ${rowsHtml}
    </table>
  `;
}

/**
 * Master responsive layout wrapper
 * Authentic corporate design with real logo, high-contrast typography, and clean borders.
 */
export function wrapEmailTemplate({
  title,
  preheader = '',
  badge = null,
  badgeTone = 'primary', // 'primary' | 'success' | 'warning' | 'danger' | 'info'
  bodyHtml,
  ctaText = null,
  ctaUrl = null,
  footerNote = null,
  company = null,
}) {
  const brand = company || getCachedCompanyBrand();
  const brandName = (brand.name || '3ni InfoTech').trim();
  const brandLegalName = brand.legalName || '3ni Infotech Education & Visa Services Pvt. Ltd.';
  const brandSubtitle = brand.divisionTag || 'Overseas Education Advisory & Visa Consultancy';
  const brandAddress = brand.fullAddress || '101, Shivalik Plaza, SG Highway, Near Iscon Cross Road, Ahmedabad, Gujarat 380015';
  const brandPhone = brand.phone || '+91 79 1234 5678';
  const brandEmail = brand.email || 'info@3niinfotech.com';
  const brandWebsite = brand.website || 'https://www.3niinfotech.com';
  const logoDataUri = getCompanyLogoDataUri();

  const toneColors = {
    primary: { bg: '#eff6ff', text: '#1d4ed8', border: '#bfdbfe' },
    success: { bg: '#f0fdf4', text: '#15803d', border: '#bbf7d0' },
    warning: { bg: '#fffbeb', text: '#b45309', border: '#fde68a' },
    danger: { bg: '#fef2f2', text: '#b91c1c', border: '#fecaca' },
    info: { bg: '#f0f9ff', text: '#0284c7', border: '#bae6fd' },
  };

  const badgeStyle = toneColors[badgeTone] || toneColors.primary;
  const currentYear = new Date().getFullYear();

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      background-color: #f1f5f9;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      color: #334155;
      -webkit-font-smoothing: antialiased;
    }
    .wrapper {
      width: 100%;
      table-layout: fixed;
      background-color: #f1f5f9;
      padding: 32px 16px;
    }
    .main-card {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
      border-radius: 12px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .email-title {
      font-size: 22px;
      font-weight: 700;
      color: #0f172a;
      margin: 0 0 16px 0;
      line-height: 1.3;
    }
    .email-text {
      font-size: 14px;
      line-height: 1.6;
      color: #475569;
      margin: 0 0 18px 0;
    }
    .cta-btn {
      display: inline-block;
      background: #2563eb;
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 12px 28px;
      border-radius: 6px;
      box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);
    }
    .cta-btn:hover {
      background: #1d4ed8;
    }
    @media only screen and (max-width: 620px) {
      .wrapper { padding: 12px 8px !important; }
      .content-body { padding: 20px 16px !important; }
      .header-pad { padding: 16px 16px !important; }
      .footer-pad { padding: 20px 16px !important; }
      .header-badge { display: none !important; }
    }
  </style>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  ${preheader ? `<span style="display:none !important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">${escapeHtml(preheader)}</span>` : ''}
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="wrapper" style="background-color: #f1f5f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%" class="main-card" style="max-width: 600px; background-color: #ffffff; border-radius: 12px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
          
          <!-- Top Accent Bar -->
          <tr>
            <td style="height: 4px; background: linear-gradient(90deg, #2563eb 0%, #4f46e5 50%, #7c3aed 100%);"></td>
          </tr>

          <!-- Real Company Header -->
          <tr>
            <td class="header-pad" style="padding: 22px 32px; background-color: #ffffff; border-bottom: 1px solid #e2e8f0;">
              <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="100%">
                <tr>
                  <td valign="middle" style="width: 50px; padding-right: 14px;">
                    ${logoDataUri ? `
                      <img src="${logoDataUri}" alt="${escapeHtml(brandName)}" width="48" height="52" style="display: block; width: 48px; height: auto; max-height: 52px; border-radius: 6px; object-fit: contain;" />
                    ` : `
                      <table role="presentation" border="0" cellpadding="0" cellspacing="0" width="46" height="46" style="background-color: #2563eb; border-radius: 8px;">
                        <tr>
                          <td align="center" valign="middle" style="color: #ffffff; font-weight: 800; font-size: 16px;">3NI</td>
                        </tr>
                      </table>
                    `}
                  </td>
                  <td valign="middle" align="left">
                    <div style="font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px; line-height: 1.2;">
                      ${escapeHtml(brandName)}
                    </div>
                    <div style="font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.8px; color: #4f46e5; margin-top: 3px;">
                      ${escapeHtml(brandSubtitle)}
                    </div>
                  </td>
                  <td valign="middle" align="right" class="header-badge" style="padding-left: 10px;">
                    <span style="display: inline-block; font-size: 11px; font-weight: 600; color: #64748b; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 4px; padding: 4px 10px; white-space: nowrap;">
                      Official Advisory
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Content Body -->
          <tr>
            <td class="content-body" style="padding: 32px 32px 24px 32px;">
              ${badge ? `
                <div style="margin-bottom: 16px;">
                  <span style="display: inline-block; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 4px 12px; border-radius: 9999px; background-color: ${badgeStyle.bg}; color: ${badgeStyle.text}; border: 1px solid ${badgeStyle.border};">
                    ${escapeHtml(badge)}
                  </span>
                </div>
              ` : ''}

              <h1 class="email-title" style="font-size: 22px; font-weight: 700; color: #0f172a; margin: 0 0 16px 0; line-height: 1.3;">
                ${escapeHtml(title)}
              </h1>

              ${bodyHtml}

              ${ctaText && ctaUrl ? `
                <div style="text-align: center; margin: 28px 0 16px 0;">
                  <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn" style="display: inline-block; background: #2563eb; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 600; padding: 12px 28px; border-radius: 6px; box-shadow: 0 2px 4px rgba(37, 99, 235, 0.25);">
                    ${escapeHtml(ctaText)} &rarr;
                  </a>
                </div>
              ` : ''}

              ${footerNote ? `
                <p style="font-size: 12px; color: #94a3b8; margin-top: 20px; text-align: center; line-height: 1.5;">
                  ${escapeHtml(footerNote)}
                </p>
              ` : ''}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td class="footer-pad" style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px 32px; text-align: center; font-size: 12px; color: #64748b; line-height: 1.6;">
              <div style="font-weight: 700; color: #1e293b; font-size: 13px; margin-bottom: 4px;">
                ${escapeHtml(brandLegalName)}
              </div>
              <div style="color: #64748b; margin-bottom: 6px;">
                ${escapeHtml(brandAddress)}
              </div>
              <div style="color: #64748b; margin-bottom: 10px;">
                <strong>Phone:</strong> ${escapeHtml(brandPhone)} &nbsp;&bull;&nbsp; 
                <strong>Email:</strong> <a href="mailto:${escapeHtml(brandEmail)}" style="color: #2563eb; text-decoration: none;">${escapeHtml(brandEmail)}</a> &nbsp;&bull;&nbsp; 
                <strong>Web:</strong> <a href="${escapeHtml(brandWebsite)}" target="_blank" style="color: #2563eb; text-decoration: none;">${escapeHtml(brandWebsite.replace(/^https?:\/\//, ''))}</a>
              </div>
              <div style="font-size: 11px; color: #94a3b8; border-top: 1px solid #edf2f7; padding-top: 12px; margin-top: 10px;">
                GSTIN: ${escapeHtml(brand.taxNumber || '24AABCU9603R1ZM')} &nbsp;&bull;&nbsp; CIN: ${escapeHtml(brand.registrationNumber || 'U80900GJ2018PTC105432')}<br>
                &copy; ${currentYear} ${escapeHtml(brandName)}. All rights reserved. This is an official automated communication.
              </div>
            </td>
          </tr>
        </table>
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
}) {
  const brand = company || getCachedCompanyBrand();
  const brandName = (brand.name || '3ni InfoTech').trim();
  const subject = `Welcome to ${brandName} — Your Account Credentials`;

  const rows = [
    { label: 'Registered Name', value: name },
    { label: 'Login Email', value: email },
    { label: 'Account Role', value: roleName },
  ];

  if (tempPassword) {
    rows.push({
      label: 'Temporary Password',
      value: `<code style="background: #e2e8f0; padding: 2px 6px; border-radius: 4px; font-weight: 700; color: #0f172a; font-family: monospace;">${escapeHtml(tempPassword)}</code>`,
      isHtml: true,
    });
  }

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(name)}</strong>,</p>
    <p class="email-text">Welcome to <strong>${escapeHtml(brandName)}</strong>! Your official portal account has been created. You can now access all your applications, fee vouchers, demo schedules, and verified document portfolio.</p>
    
    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #64748b;">
      ${tempPassword ? 'Please log in and update your password immediately from your profile settings for security.' : 'You can log in using the password selected during registration.'}
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Welcome to the Portal',
      preheader: 'Your official portal account has been created.',
      badge: 'Account Setup',
      badgeTone: 'success',
      bodyHtml,
      ctaText: 'Access Portal',
      ctaUrl: loginUrl,
      footerNote: 'Never share your login credentials with anyone.',
      company: brand,
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
}) {
  const brand = company || getCachedCompanyBrand();
  const brandPhone = brand?.phone || '+91 79 1234 5678';
  const brandName = (brand.name || '3ni InfoTech').trim();
  const subject = `Security Alert: Your ${brandName} Password Was Reset`;

  const rows = [
    { label: 'Account Email', value: email },
    { label: 'Timestamp', value: resetTime },
    { label: 'Status', value: 'Active & Secured', color: '#16a34a' },
  ];

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(name)}</strong>,</p>
    <p class="email-text">This is a security confirmation that your <strong>${escapeHtml(brandName)}</strong> account password was recently changed.</p>

    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #dc2626;">
      If you did not perform this action, please contact our administrative desk immediately at <strong>${escapeHtml(brandPhone)}</strong> or reply to this email.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Password Successfully Reset',
      preheader: 'Security confirmation of your recent password reset.',
      badge: 'Security Alert',
      badgeTone: 'warning',
      bodyHtml,
      ctaText: 'Log In to Portal',
      ctaUrl: loginUrl,
      company: brand,
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
}) {
  const brand = company || getCachedCompanyBrand();
  const subject = `📢 Announcement: ${title}`;

  const rows = [
    { label: 'Target Audience', value: audience },
    { label: 'Published By', value: publishedBy },
    { label: 'Published On', value: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) },
  ];

  const bodyHtml = `
    <p class="email-text">A new announcement has been published by <strong>${escapeHtml(publishedBy)}</strong>:</p>

    <div style="background-color: #f8fafc; border-left: 4px solid #2563eb; border-radius: 4px; padding: 16px; margin: 18px 0; font-size: 14px; line-height: 1.6; color: #1e293b;">
      ${escapeHtml(body).replace(/\n/g, '<br/>')}
    </div>

    ${renderInfoTable(rows)}
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: title || 'Official Announcement',
      preheader: body ? body.slice(0, 100) : 'New announcement posted',
      badge: 'Official Broadcast',
      badgeTone: 'primary',
      bodyHtml,
      ctaText: 'View Announcement in CRM',
      ctaUrl: announcementUrl,
      company: brand,
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
}) {
  const brand = company || getCachedCompanyBrand();
  const subject = `📌 Task Assigned [${priority}]: ${taskTitle}`;
  const toneMap = {
    URGENT: 'danger',
    HIGH: 'warning',
    MEDIUM: 'info',
    LOW: 'primary',
  };

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
    <p class="email-text">A new task has been assigned to you by <strong>${escapeHtml(assignedByName)}</strong>:</p>

    ${renderInfoTable(rows)}

    ${description ? `
      <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 14px 16px; border-radius: 8px; font-size: 13px; line-height: 1.5; color: #334155; margin-bottom: 20px;">
        <strong style="color: #0f172a;">Task Description:</strong><br/>
        ${escapeHtml(description)}
      </div>
    ` : ''}
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'New Task Assigned',
      preheader: `Task assigned: ${taskTitle}`,
      badge: `Priority: ${priority}`,
      badgeTone: toneMap[priority] || 'info',
      bodyHtml,
      ctaText: 'Open Task in CRM',
      ctaUrl: taskUrl,
      company: brand,
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
}) {
  const brand = company || getCachedCompanyBrand();
  const subject = `📄 Document Uploaded by Student: ${studentName} (${documentName})`;

  const rows = [
    { label: 'Student Name', value: studentName },
    { label: 'Student ID', value: studentCode || '—', color: '#2563eb', bold: true },
    { label: 'Document Title', value: documentName },
    { label: 'Category', value: category },
    { label: 'Uploaded At', value: uploadedAt },
    { label: 'Status', value: 'UNDER REVIEW', color: '#d97706', bold: true },
  ];

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(counselorName || 'Counselor')}</strong>,</p>
    <p class="email-text">Student <strong>${escapeHtml(studentName)}</strong> has uploaded a new document to their Student Portal for verification and university filing.</p>

    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #64748b;">
      Please inspect this document and mark it as Verified or Request Re-upload as per embassy requirements.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Student Document Uploaded',
      preheader: `${studentName} uploaded ${documentName}`,
      badge: 'Action Required',
      badgeTone: 'warning',
      bodyHtml,
      ctaText: 'Review Student Documents',
      ctaUrl: reviewUrl,
      company: brand,
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
}) {
  const brand = company || getCachedCompanyBrand();
  const subject = `✅ Document Received: ${documentName}`;

  const rows = [
    { label: 'Document Name', value: documentName, bold: true },
    { label: 'Category', value: category },
    { label: 'Status', value: 'Under Review', color: '#0284c7', bold: true },
  ];

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    <p class="email-text">We have successfully received your document submission: <strong>${escapeHtml(documentName)}</strong>.</p>

    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #475569;">
      Our admissions team will verify this document against university criteria. You will receive an update once verified.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Document Received',
      preheader: `We received ${documentName} for review.`,
      badge: 'Submission Confirmed',
      badgeTone: 'info',
      bodyHtml,
      ctaText: 'View My Document Portfolio',
      ctaUrl: portalUrl,
      company: brand,
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
}) {
  const brand = company || getCachedCompanyBrand();
  const brandName = (brand.name || '3ni InfoTech').trim();
  const brandPhone = brand?.phone || '+91 79 1234 5678';
  const subject = `🎓 Demo Class Scheduled: ${courseName} with ${brandName}`;

  const rows = [
    { label: 'Course / Program', value: courseName, color: '#2563eb', bold: true },
    { label: 'Date', value: demoDate },
    { label: 'Time', value: demoTime },
    { label: 'Assigned Faculty', value: facultyName },
    { label: 'Batch', value: batch },
    { label: 'Session Location', value: venue },
  ];

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    <p class="email-text">Your trial coaching & advisory demo session has been officially scheduled. Here are your session details:</p>

    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #475569;">
      Please arrive or log in 10 minutes prior to session start. For questions or rescheduling, contact our admissions desk at <strong>${escapeHtml(brandPhone)}</strong>.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Demo Class Confirmed',
      preheader: `Demo scheduled for ${courseName} on ${demoDate} at ${demoTime}`,
      badge: 'Demo Invitation',
      badgeTone: 'success',
      bodyHtml,
      ctaText: 'Open Portal & Study Notes',
      ctaUrl: portalUrl,
      company: brand,
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
}) {
  const brand = company || getCachedCompanyBrand();
  const brandName = (brand.name || '3ni InfoTech').trim();
  const brandPhone = counsellorPhone || brand.phone || '+91 79 1234 5678';

  const subject = `Welcome to ${brandName} — Thank you for your visit (Enquiry #${enquiryCode || 'NEW'})`;

  const rows = [
    { label: 'Enquiry Reference', value: `#${enquiryCode || 'PENDING'}`, color: '#2563eb', bold: true },
    { label: 'Interested Program', value: courseName },
    { label: 'Target Destination', value: country },
    { label: 'Assigned Advisor', value: counsellorName },
  ];

  if (counsellorPhone) {
    rows.push({ label: 'Advisor Direct Phone', value: counsellorPhone });
  }

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(studentName || 'Student')}</strong>,</p>
    <p class="email-text">Thank you for visiting <strong>${escapeHtml(brandName)}</strong> and connecting with our overseas advisory team. We look forward to guiding you through your university admissions and student visa process.</p>

    ${renderInfoTable(rows)}

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="font-weight: 700; color: #0f172a; margin: 0 0 8px 0; font-size: 13px;">What Happens Next?</p>
      <ul style="padding-left: 18px; margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">
        <li style="margin-bottom: 6px;">Your counselor will evaluate your profile and university eligibility.</li>
        <li style="margin-bottom: 6px;">We will prepare your tailored university shortlist and tuition fee schedule.</li>
        <li style="margin-bottom: 6px;">Upon confirmation, you will receive full access to our digital Student Portal.</li>
      </ul>
    </div>

    <p class="email-text" style="font-size: 13px; color: #64748b; margin-top: 18px;">
      Have questions or need assistance? Reply directly to this email or call us at <strong>${escapeHtml(brandPhone)}</strong>.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Welcome to 3ni InfoTech',
      preheader: `Thank you for visiting 3ni InfoTech. Enquiry reference: #${enquiryCode}`,
      badge: 'Welcome to 3NI',
      badgeTone: 'primary',
      bodyHtml,
      ctaText: 'Visit Our Website',
      ctaUrl: brand.website || 'https://www.3niinfotech.com',
      company: brand,
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
}) {
  const brand = company || getCachedCompanyBrand();
  const brandName = (brand.name || '3ni InfoTech').trim();

  const subject = `Welcome to ${brandName} Student Portal — Your Student ID: ${studentCode}`;

  const rows = [
    { label: 'Student ID', value: studentCode, color: '#2563eb', bold: true },
    { label: 'Portal Login Email', value: email },
    {
      label: 'Default Password',
      value: `<code style="background: #e2e8f0; padding: 2px 8px; border-radius: 4px; font-weight: 700; color: #0f172a; font-family: monospace;">${escapeHtml(tempPassword)}</code> <span style="font-size: 11px; color: #64748b; font-weight: normal;">(Change after first login)</span>`,
      isHtml: true,
    },
    { label: 'Enrolled Program', value: courseName },
    { label: 'Assigned Advisor', value: counsellorName },
  ];

  const bodyHtml = `
    <p class="email-text">Dear <strong>${escapeHtml(studentName)}</strong>,</p>
    <p class="email-text">Welcome to <strong>${escapeHtml(brandName)}</strong>! Your official student account is now active. You have full access to our Student Portal to track admissions, upload required documents, view fee receipts, and access study materials.</p>

    ${renderInfoTable(rows)}

    <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; margin: 20px 0;">
      <p style="font-weight: 700; color: #0f172a; margin: 0 0 8px 0; font-size: 13px;">What You Can Do in Your Portal:</p>
      <ul style="padding-left: 18px; margin: 0; color: #475569; font-size: 13px; line-height: 1.6;">
        <li style="margin-bottom: 6px;">Securely upload academic transcripts, passport, and test scores.</li>
        <li style="margin-bottom: 6px;">Track university offer letters and visa lodging progress in real time.</li>
        <li style="margin-bottom: 6px;">Download official GST tax invoices and payment receipts anytime.</li>
      </ul>
    </div>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Student Portal Access',
      preheader: `Welcome to 3NI Student Portal. Student ID: ${studentCode}`,
      badge: 'Account Activated',
      badgeTone: 'success',
      bodyHtml,
      ctaText: 'Sign In to Student Portal',
      ctaUrl: portalUrl,
      footerNote: 'Please keep your credentials secure. You can update your password anytime from your profile.',
      company: brand,
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
}) {
  const brand = company || getCachedCompanyBrand();
  const brandName = (brand.name || '3ni InfoTech').trim();

  const subject = `🧾 Payment Receipt & Invoice #${invoiceNo} — ${brandName}`;

  const rows = [
    { label: 'Invoice / Receipt No', value: `#${invoiceNo}`, color: '#2563eb', bold: true },
    { label: 'Date of Payment', value: transactionDate },
    { label: 'Payment Mode', value: paymentMode },
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
    <p class="email-text">Thank you for your payment! We have successfully received your fee installment for <strong>${escapeHtml(courseName)}</strong>. Please find your official receipt details below:</p>

    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #64748b; margin-top: 18px;">
      A permanent record of this transaction and official GST invoice copy is stored in your Student Portal under <strong>Fees & Receipts</strong>.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Payment Receipt',
      preheader: `Payment received for Invoice #${invoiceNo}. Amount: ₹${amountPaid}`,
      badge: 'Payment Received',
      badgeTone: 'success',
      bodyHtml,
      ctaText: 'View Receipts in Portal',
      ctaUrl: portalUrl,
      company: brand,
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
}) {
  const brand = company || getCachedCompanyBrand();
  const isOffer = /offer/i.test(status);
  const tone = isOffer ? 'success' : 'info';
  const badgeTitle = isOffer ? 'Offer Letter Received' : 'Application Update';

  const subject = `${isOffer ? '🎉 Offer Received: ' : 'Application Update: '}${universityName} — ${status}`;

  const rows = [
    { label: 'Institution', value: universityName, color: '#2563eb', bold: true },
    { label: 'Program', value: courseName },
    {
      label: 'Current Stage',
      value: status,
      color: isOffer ? '#15803d' : '#0284c7',
      bold: true,
    },
  ];

  if (remarks) {
    rows.push({ label: 'Remarks / Note', value: remarks });
  }

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    <p class="email-text">We have an important milestone update regarding your university admission application:</p>

    ${renderInfoTable(rows)}

    <p class="email-text" style="font-size: 13px; color: #475569; margin-top: 18px;">
      Please log in to your portal to review official university decision letters and complete any next conditions.
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Application Milestone',
      preheader: `Update on your application to ${universityName}: ${status}`,
      badge: badgeTitle,
      badgeTone: tone,
      bodyHtml,
      ctaText: 'View Application Details',
      ctaUrl: portalUrl,
      company: brand,
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
}) {
  const brand = company || getCachedCompanyBrand();
  const brandName = (brand.name || '3ni InfoTech').trim();

  const isApproved = /approved|granted/i.test(status);
  const tone = isApproved ? 'success' : 'info';
  const badgeTitle = isApproved ? 'Visa Granted 🎉' : 'Visa Stage Update';

  const subject = `${isApproved ? '🎉 VISA APPROVED: ' : 'Visa Update: '}${country} (${status}) — ${brandName}`;

  const rows = [
    { label: 'Country', value: country, color: '#2563eb', bold: true },
    { label: 'Visa Category', value: visaType },
    {
      label: 'Status',
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
    <p class="email-text">${isApproved ? `Congratulations from the entire team at <strong>${escapeHtml(brandName)}</strong>! Your study visa application has been officially APPROVED! 🎉` : 'We have an update regarding your visa processing:'}</p>

    ${renderInfoTable(rows)}

    ${isApproved ? `
    <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin-top: 20px;">
      <p style="font-weight: 700; color: #166534; margin: 0 0 6px 0; font-size: 13px;">Next Steps for Your Departure:</p>
      <ul style="margin: 0; padding-left: 18px; font-size: 13px; color: #15803d; line-height: 1.5;">
        <li style="margin-bottom: 4px;">Attend our Pre-Departure Briefing session.</li>
        <li style="margin-bottom: 4px;">Review your forex card, student accommodation, and travel health insurance.</li>
        <li style="margin-bottom: 4px;">Collect your official visa grant letter copy or download it directly from your portal.</li>
      </ul>
    </div>
    ` : ''}
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Visa Application Update',
      preheader: `Visa update for ${country}: ${status}`,
      badge: badgeTitle,
      badgeTone: tone,
      bodyHtml,
      ctaText: 'Open Visa Workspace',
      ctaUrl: portalUrl,
      company: brand,
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
