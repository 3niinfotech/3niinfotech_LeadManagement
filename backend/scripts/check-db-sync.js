import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const checks = [
  ['enquiries', 'SHOW COLUMNS FROM enquiries'],
  ['enquiry_notes', 'SHOW COLUMNS FROM enquiry_notes'],
  ['enquiry_communications', 'SHOW COLUMNS FROM enquiry_communications'],
  ['enquiry_appointments', 'SHOW COLUMNS FROM enquiry_appointments'],
  ['enquiry_audit_logs', 'SHOW COLUMNS FROM enquiry_audit_logs'],
];

const required = {
  enquiries: ['passportNo', 'studentId', 'tags', 'priority'],
  enquiry_notes: ['checklist', 'contentHtml', 'isPinned', 'mentions', 'updatedAt'],
  enquiry_communications: ['direction', 'durationSec', 'fileName', 'filePath', 'userId'],
  enquiry_appointments: ['counsellorId', 'meetingLink', 'mode', 'platform', 'room'],
  enquiry_audit_logs: ['ipAddress'],
};

const requiredTables = ['enquiry_demos', 'enquiry_note_attachments'];

try {
  for (const [name, sql] of checks) {
    const cols = await prisma.$queryRawUnsafe(sql);
    const fields = cols.map((c) => c.Field);
    const missing = (required[name] || []).filter((f) => !fields.includes(f));
    console.log(`${name}: ${missing.length ? `MISSING → ${missing.join(', ')}` : 'OK'}`);
  }

  for (const table of requiredTables) {
    const rows = await prisma.$queryRawUnsafe(`SHOW TABLES LIKE '${table}'`);
    console.log(`${table}: ${rows.length ? 'OK' : 'MISSING TABLE'}`);
  }

  const emptyStatus = await prisma.$queryRaw`SELECT COUNT(*) as c FROM enquiries WHERE status = '' OR status IS NULL`;
  console.log('Empty status rows:', Number(emptyStatus[0]?.c || 0));
} catch (e) {
  console.error('Error:', e.message);
} finally {
  await prisma.$disconnect();
}
