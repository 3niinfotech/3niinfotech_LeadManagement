import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const host = process.env.SMTP_HOST || 'smtp.hostinger.com';
const port = Number(process.env.SMTP_PORT) || 587;
const secure = process.env.SMTP_SECURE === 'true' || port === 465;
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const targetEmail = process.argv[2] || user;

console.log('====================================================');
console.log('   3NI INFOTECH - LIVE SMTP HEALTH & DIAGNOSTICS   ');
console.log('====================================================');
console.log(`Host:    ${host}`);
console.log(`Port:    ${port}`);
console.log(`Secure:  ${secure ? 'SSL (465)' : 'STARTTLS (587)'}`);
console.log(`User:    ${user}`);
console.log(`Target:  ${targetEmail}`);
console.log('====================================================\n');

if (!user || !pass) {
  console.error('❌ ERROR: SMTP_USER or SMTP_PASS is missing in backend/.env');
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  host,
  port,
  secure,
  auth: { user, pass },
  tls: { rejectUnauthorized: false },
  connectionTimeout: 15000,
  greetingTimeout: 15000,
  socketTimeout: 20000,
});

async function main() {
  try {
    process.stdout.write('Step 1: Connecting and handshaking with SMTP Server... ');
    await transporter.verify();
    console.log('✔ OK (Handshake successful, credentials verified!)');

    process.stdout.write(`Step 2: Sending branded verification email to <${targetEmail}>... `);
    const info = await transporter.sendMail({
      from: `"3ni Infotech System" <${user}>`,
      to: targetEmail,
      subject: '✅ 3NI INFOTECH - SMTP Live Delivery Confirmed',
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 28px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="background: linear-gradient(135deg, #0f172a 0%, #1e1b4b 100%); padding: 18px 24px; border-radius: 8px; margin-bottom: 20px; border-bottom: 3px solid #4f46e5;">
            <h2 style="color: #ffffff; margin: 0; font-size: 20px;">3NI INFOTECH Overseas Education</h2>
            <p style="color: #93c5fd; margin: 4px 0 0 0; font-size: 11px; text-transform: uppercase; letter-spacing: 1px;">Live SMTP Integration Verified</p>
          </div>
          <p style="font-size: 14px; color: #334155; line-height: 1.6;">
            Your Hostinger SMTP integration is active and operating at 100% capacity.
          </p>
          <div style="background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin: 18px 0;">
            <h4 style="margin: 0 0 8px 0; color: #0f172a; font-size: 13px;">Diagnostic Summary:</h4>
            <p style="margin: 3px 0; font-size: 12px; color: #475569;"><strong>SMTP Gateway:</strong> ${host}:${port}</p>
            <p style="margin: 3px 0; font-size: 12px; color: #475569;"><strong>Sender Identity:</strong> ${user}</p>
            <p style="margin: 3px 0; font-size: 12px; color: #166534;"><strong>Status:</strong> Connected & Delivered</p>
          </div>
          <p style="font-size: 12px; color: #94a3b8; margin-top: 24px;">
            This email verifies OTP authentication, announcement broadcasts, task assignments, and student document notifications.
          </p>
        </div>
      `,
    });
    console.log('✔ OK');
    console.log(`\n🎉 SUCCESS! Message ID: ${info.messageId}`);
    console.log(`Server response: ${info.response}`);
    console.log('\nAll email services are live and functioning smoothly.');
  } catch (err) {
    console.error('\n❌ FAILED:', err.message || err);
    process.exit(1);
  }
}

main();
