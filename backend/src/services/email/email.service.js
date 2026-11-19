import nodemailer from 'nodemailer';
import config from '../../config/index.js';
import { getCachedCompanyBrand } from '../../utils/companyBrand.util.js';

let transporter = null;
let etherealAccount = null;

/**
 * Initialize or return existing Nodemailer transporter
 */
async function getTransporter() {
  if (transporter) return transporter;

  const { host, port, secure, user, pass } = config.smtp || {};

  // If real SMTP host and credentials are provided, use live SMTP
  if (host && user && pass) {
    transporter = nodemailer.createTransport({
      host,
      port: Number(port) || 587,
      secure: Boolean(secure),
      auth: {
        user,
        pass,
      },
      tls: {
        rejectUnauthorized: false,
      },
    });
    console.log(`[emailService] Live SMTP transporter initialized for host ${host}:${port}`);
    return transporter;
  }

  // Fallback: in development or when unconfigured, use Ethereal test transporter
  try {
    if (!etherealAccount) {
      etherealAccount = await nodemailer.createTestAccount();
      console.log(`[emailService] Created Ethereal test account: ${etherealAccount.user}`);
    }

    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: etherealAccount.user,
        pass: etherealAccount.pass,
      },
    });
    return transporter;
  } catch (err) {
    console.warn(`[emailService] Ethereal fallback failed (${err.message}), using console logger transport`);
    transporter = {
      sendMail: async (mailOptions) => {
        console.log('[emailService:MOCK_SEND]', {
          to: mailOptions.to,
          subject: mailOptions.subject,
          from: mailOptions.from,
        });
        return { messageId: `mock-${Date.now()}` };
      },
    };
    return transporter;
  }
}

/**
 * Returns current SMTP configuration status
 */
export function getSmtpStatus() {
  const brand = getCachedCompanyBrand();
  const { host, port, secure, user, fromName, fromEmail } = config.smtp || {};
  const isConfigured = Boolean(host && user);

  return {
    configured: isConfigured,
    mode: isConfigured ? 'LIVE_SMTP' : 'DEVELOPMENT_PREVIEW',
    host: host || 'smtp.ethereal.email (mock)',
    port: port || 587,
    secure: Boolean(secure),
    fromName: fromName || brand.name || '3ni Infotech',
    fromEmail: fromEmail || brand.email || 'info@3niinfotech.com',
    username: user ? `${user.slice(0, 3)}***@${user.split('@')[1] || ''}` : 'dev-preview',
  };
}

/**
 * Core safe send function: never throws uncaught errors that disrupt business operations
 */
export async function safeSendEmail({
  to,
  subject,
  html,
  text = null,
  attachments = [],
}) {
  if (!to) {
    console.warn('[emailService] No recipient email specified');
    return { success: false, error: 'Recipient email required' };
  }

  try {
    const brand = getCachedCompanyBrand();
    const client = await getTransporter();
    const defaultFromName = brand.name || '3ni Infotech';
    const defaultFromEmail = brand.email || config.smtp?.user || 'info@3niinfotech.com';
    const fromAddress = `"${config.smtp?.fromName || defaultFromName}" <${config.smtp?.fromEmail || defaultFromEmail}>`;

    const mailOptions = {
      from: fromAddress,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(),
      attachments,
    };

    const info = await client.sendMail(mailOptions);
    const previewUrl = nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null;

    console.log(`[emailService] Email sent successfully to "${to}" [MsgID: ${info.messageId}]`);
    if (previewUrl) {
      console.log(`[emailService] Preview Email at: ${previewUrl}`);
    }

    return {
      success: true,
      messageId: info.messageId,
      previewUrl,
    };
  } catch (err) {
    console.error(`[emailService] Failed to send email to "${to}":`, err.message);
    return {
      success: false,
      error: err.message,
    };
  }
}

/**
 * Send test email for verification
 */
export async function sendTestEmail({ to }) {
  const targetEmail = to || config.smtp?.fromEmail || 'test@3ni.io';
  const { buildWelcomeEmail } = await import('./emailTemplates.js');

  const { subject, html } = buildWelcomeEmail({
    name: '3NI System Administrator',
    email: targetEmail,
    roleName: 'System Administrator',
  });

  return safeSendEmail({
    to: targetEmail,
    subject: `[TEST] ${subject}`,
    html,
  });
}

export default {
  safeSendEmail,
  sendTestEmail,
  getSmtpStatus,
};
