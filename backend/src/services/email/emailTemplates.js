/**
 * 3NI INFOTECH - Modern Responsive HTML Email Templates
 * Standardized brand styling for Auth, Announcements, Tasks, Document Uploads, Demos & System Alerts.
 */

import config from '../../config/index.js';
import { getCachedCompanyBrand } from '../../utils/companyBrand.util.js';

const CLIENT_URL = config.smtp?.clientUrl || 'http://localhost:3001';

/**
 * Master responsive layout wrapper
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
  const brandName = brand.name || '3ni Infotech';
  const brandLegalName = brand.legalName || brand.name || '3ni Infotech Education & Visa Services Pvt. Ltd.';
  const brandSubtitle = brand.divisionTag || 'Overseas Education Advisory & Visa Consultancy';
  const brandAddress = brand.fullAddress || '101, Shivalik Plaza, SG Highway, Ahmedabad, Gujarat 380015';
  const brandPhone = brand.phone || '+91 79 1234 5678';
  const brandEmail = brand.email || 'info@3niinfotech.com';
  const brandWebsite = brand.website || 'https://www.3niinfotech.com';
  const toneColors = {
    primary: { bg: '#e0e7ff', text: '#3730a3', border: '#c7d2fe' },
    success: { bg: '#dcfce7', text: '#166534', border: '#bbf7d0' },
    warning: { bg: '#fef3c7', text: '#92400e', border: '#fde68a' },
    danger: { bg: '#fee2e2', text: '#991b1b', border: '#fecaca' },
    info: { bg: '#e0f2fe', text: '#0369a1', border: '#bae6fd' },
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
      border-radius: 14px;
      overflow: hidden;
      border: 1px solid #e2e8f0;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
    }
    .brand-header {
      background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%);
      padding: 24px 32px;
      text-align: left;
      border-bottom: 3px solid #4f46e5;
    }
    .brand-title {
      font-size: 20px;
      font-weight: 800;
      color: #ffffff;
      letter-spacing: 0.5px;
      margin: 0;
      line-height: 1.2;
    }
    .brand-sub {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: #93c5fd;
      margin-top: 4px;
      margin-bottom: 0;
    }
    .content-body {
      padding: 32px;
    }
    .badge-pill {
      display: inline-block;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 4px 12px;
      border-radius: 9999px;
      margin-bottom: 16px;
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
      margin: 0 0 20px 0;
    }
    .details-box {
      background-color: #f8fafc;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      padding: 16px 20px;
      margin: 20px 0;
    }
    .details-row {
      display: flex;
      justify-content: space-between;
      padding: 6px 0;
      border-bottom: 1px dashed #e2e8f0;
      font-size: 13px;
    }
    .details-row:last-child {
      border-bottom: none;
    }
    .details-label {
      color: #64748b;
      font-weight: 500;
    }
    .details-val {
      color: #0f172a;
      font-weight: 600;
      text-align: right;
    }
    .cta-container {
      text-align: center;
      margin: 28px 0 12px 0;
    }
    .cta-btn {
      display: inline-block;
      background: linear-gradient(135deg, #4f46e5 0%, #4338ca 100%);
      color: #ffffff !important;
      text-decoration: none;
      font-size: 14px;
      font-weight: 600;
      padding: 12px 30px;
      border-radius: 8px;
      box-shadow: 0 2px 4px rgba(79, 70, 229, 0.25);
    }
    .footer-bar {
      background-color: #f8fafc;
      border-top: 1px solid #e2e8f0;
      padding: 24px 32px;
      text-align: center;
      font-size: 12px;
      color: #64748b;
      line-height: 1.6;
    }
    .footer-bar a {
      color: #4f46e5;
      text-decoration: none;
    }
  </style>
</head>
<body>
  ${preheader ? `<span style="display:none !important; visibility:hidden; mso-hide:all; font-size:1px; line-height:1px; max-height:0px; max-width:0px; opacity:0; overflow:hidden;">${escapeHtml(preheader)}</span>` : ''}
  <table role="presentation" border="0" cellpadding="0" cellspacing="0" class="wrapper">
    <tr>
      <td align="center">
        <div class="main-card">
          <!-- Header -->
          <div class="brand-header">
            <h1 class="brand-title">${escapeHtml(brandName.toUpperCase())}</h1>
            <p class="brand-sub">${escapeHtml(brandSubtitle)}</p>
          </div>

          <!-- Content -->
          <div class="content-body">
            ${badge ? `<div class="badge-pill" style="background-color: ${badgeStyle.bg}; color: ${badgeStyle.text}; border: 1px solid ${badgeStyle.border};">${escapeHtml(badge)}</div>` : ''}
            <h2 class="email-title">${escapeHtml(title)}</h2>
            ${bodyHtml}

            ${ctaText && ctaUrl ? `
              <div class="cta-container">
                <a href="${ctaUrl}" target="_blank" rel="noopener noreferrer" class="cta-btn">${escapeHtml(ctaText)} &rarr;</a>
              </div>
            ` : ''}

            ${footerNote ? `
              <p style="font-size: 12px; color: #94a3b8; margin-top: 24px; text-align: center;">${escapeHtml(footerNote)}</p>
            ` : ''}
          </div>

          <!-- Footer -->
          <div class="footer-bar">
            <strong>${escapeHtml(brandLegalName)}</strong><br>
            ${escapeHtml(brandAddress)}<br>
            Phone: ${escapeHtml(brandPhone)} &bull; Email: <a href="mailto:${escapeHtml(brandEmail)}">${escapeHtml(brandEmail)}</a><br>
            ${brandWebsite ? `<a href="${escapeHtml(brandWebsite)}" target="_blank" style="color: #4f46e5; text-decoration: none; font-size: 11px;">${escapeHtml(brandWebsite)}</a><br>` : ''}
            <span style="display:inline-block; margin-top: 6px; font-size: 11px; color: #94a3b8;">
              &copy; ${currentYear} ${escapeHtml(brandName)} CRM. This is an automated notification.
            </span>
          </div>
        </div>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
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
}) {
  const subject = `Welcome to 3NI Infotech Portal — Your Account Details`;
  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(name)}</strong>,</p>
    <p class="email-text">Welcome to <strong>3NI Infotech</strong>! Your official portal account has been created successfully. You can now access all your applications, fee vouchers, demo schedules, and verified document portfolio.</p>
    
    <div class="details-box">
      <div class="details-row">
        <span class="details-label">Registered Name</span>
        <span class="details-val">${escapeHtml(name)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Login Email</span>
        <span class="details-val">${escapeHtml(email)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Account Role</span>
        <span class="details-val">${escapeHtml(roleName)}</span>
      </div>
      ${tempPassword ? `
      <div class="details-row">
        <span class="details-label">Temporary Password</span>
        <span class="details-val" style="color: #4f46e5; font-family: monospace;">${escapeHtml(tempPassword)}</span>
      </div>` : ''}
    </div>

    <p class="email-text" style="font-size: 13px; color: #64748b;">
      ${tempPassword ? 'Please log in and update your password immediately from your profile settings.' : 'You can log in using the password chosen during registration.'}
    </p>
  `;

  return {
    subject,
    html: wrapEmailTemplate({
      title: 'Welcome to 3NI Infotech!',
      preheader: 'Your official portal account has been created.',
      badge: 'Account Setup',
      badgeTone: 'success',
      bodyHtml,
      ctaText: 'Access Student Portal',
      ctaUrl: loginUrl,
      footerNote: 'Never share your login credentials with anyone.',
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
}) {
  const subject = `Security Alert: Your 3NI Portal Password Was Reset`;
  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(name)}</strong>,</p>
    <p class="email-text">This is a security confirmation that your 3NI Infotech portal account password was successfully reset.</p>

    <div class="details-box">
      <div class="details-row">
        <span class="details-label">Account Email</span>
        <span class="details-val">${escapeHtml(email)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Timestamp</span>
        <span class="details-val">${escapeHtml(resetTime)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Status</span>
        <span class="details-val" style="color: #166534;">Active & Secured</span>
      </div>
    </div>

    <p class="email-text" style="font-size: 13px; color: #dc2626;">
      If you did not perform this action, please contact our administrative desk immediately at <strong>${BRAND_PHONE}</strong> or reply to this email.
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
}) {
  const subject = `📢 Announcement: ${title}`;
  const bodyHtml = `
    <p class="email-text">A new announcement has been published by <strong>${escapeHtml(publishedBy)}</strong>:</p>

    <div style="background-color: #f8fafc; border-left: 4px solid #4f46e5; border-radius: 4px; padding: 16px; margin: 18px 0; font-size: 14px; line-height: 1.6; color: #1e293b;">
      ${escapeHtml(body).replace(/\n/g, '<br/>')}
    </div>

    <div class="details-box">
      <div class="details-row">
        <span class="details-label">Target Audience</span>
        <span class="details-val">${escapeHtml(audience)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Published On</span>
        <span class="details-val">${new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
      </div>
    </div>
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
}) {
  const subject = `📌 Task Assigned [${priority}]: ${taskTitle}`;
  const toneMap = {
    URGENT: 'danger',
    HIGH: 'warning',
    MEDIUM: 'info',
    LOW: 'primary',
  };

  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(assigneeName)}</strong>,</p>
    <p class="email-text">A new task has been assigned to you by <strong>${escapeHtml(assignedByName)}</strong>:</p>

    <div class="details-box">
      <div class="details-row">
        <span class="details-label">Task Title</span>
        <span class="details-val">${escapeHtml(taskTitle)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Priority</span>
        <span class="details-val" style="font-weight: 700;">${escapeHtml(priority)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Due Date</span>
        <span class="details-val">${dueDate ? new Date(dueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'No strict deadline'}</span>
      </div>
    </div>

    ${description ? `
      <div style="background-color: #f1f5f9; padding: 14px 16px; border-radius: 8px; font-size: 13px; line-height: 1.5; color: #334155; margin-bottom: 20px;">
        <strong>Task Description:</strong><br/>
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
}) {
  const subject = `📄 Document Uploaded by Student: ${studentName} (${documentName})`;
  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(counselorName || 'Counselor')}</strong>,</p>
    <p class="email-text">Student <strong>${escapeHtml(studentName)}</strong> has uploaded a new document to their Student Portal for your verification and university filing.</p>

    <div class="details-box">
      <div class="details-row">
        <span class="details-label">Student Name</span>
        <span class="details-val">${escapeHtml(studentName)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Student Code</span>
        <span class="details-val" style="font-family: monospace;">${escapeHtml(studentCode || '—')}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Document Title</span>
        <span class="details-val">${escapeHtml(documentName)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Category</span>
        <span class="details-val">${escapeHtml(category)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Uploaded At</span>
        <span class="details-val">${escapeHtml(uploadedAt)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Status</span>
        <span class="details-val" style="color: #b45309; font-weight: 700;">UNDER REVIEW</span>
      </div>
    </div>

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
}) {
  const subject = `✅ Document Received: ${documentName}`;
  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    <p class="email-text">We have successfully received your document submission <strong>${escapeHtml(documentName)}</strong>.</p>

    <div class="details-box">
      <div class="details-row">
        <span class="details-label">Document Name</span>
        <span class="details-val">${escapeHtml(documentName)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Category</span>
        <span class="details-val">${escapeHtml(category)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Status</span>
        <span class="details-val" style="color: #0369a1; font-weight: 700;">UNDER REVIEW</span>
      </div>
    </div>

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
}) {
  const subject = `🎓 Demo Class Scheduled: ${courseName} with 3NI Infotech`;
  const bodyHtml = `
    <p class="email-text">Hello <strong>${escapeHtml(studentName)}</strong>,</p>
    <p class="email-text">Your trial coaching & advisory demo session has been officially scheduled. Here are your session details:</p>

    <div class="details-box">
      <div class="details-row">
        <span class="details-label">Course / Program</span>
        <span class="details-val" style="color: #4f46e5;">${escapeHtml(courseName)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Date</span>
        <span class="details-val">${escapeHtml(demoDate)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Time</span>
        <span class="details-val">${escapeHtml(demoTime)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Assigned Faculty</span>
        <span class="details-val">${escapeHtml(facultyName)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Batch</span>
        <span class="details-val">${escapeHtml(batch)}</span>
      </div>
      <div class="details-row">
        <span class="details-label">Session Location</span>
        <span class="details-val">${escapeHtml(venue)}</span>
      </div>
    </div>

    <p class="email-text" style="font-size: 13px; color: #475569;">
      Please arrive or log in 10 minutes prior to session start. For questions or rescheduling, contact our admissions desk at <strong>${BRAND_PHONE}</strong>.
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
    }),
  };
}
