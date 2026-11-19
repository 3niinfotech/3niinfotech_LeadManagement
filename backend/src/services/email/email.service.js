import nodemailer from 'nodemailer';
import config from '../../config/index.js';

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
  const { host, port, secure, user, fromName, fromEmail } = config.smtp || {};
  const isConfigured = Boolean(host && user);

  return {
    configured: isConfigured,
    mode: isConfigured ? 'LIVE_SMTP' : 'DEVELOPMENT_PREVIEW',
    host: host || 'smtp.ethereal.email (mock)',
    port: port || 587,
    secure: Boolean(secure),
    fromName: fromName || '3NI INFOTECH Overseas',
    fromEmail: fromEmail || 'accounts@3ni.io',
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
    const client = await getTransporter();
    const fromAddress = `"${config.smtp?.fromName || '3NI INFOTECH'}" <${config.smtp?.fromEmail || config.smtp?.user || 'accounts@3ni.io'}>`;

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
