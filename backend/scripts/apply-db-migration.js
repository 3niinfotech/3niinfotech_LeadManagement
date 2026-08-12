/**
 * Safe MySQL migration when prisma db push fails on NOT NULL JSON columns.
 * Run: node scripts/apply-db-migration.js
 * Stop backend server first if prisma generate hits EPERM.
 */
import prisma from '../src/config/database.js';

async function columnExists(table, column) {
  const rows = await prisma.$queryRawUnsafe(
    `SHOW COLUMNS FROM \`${table}\` LIKE '${column}'`,
  );
  return rows.length > 0;
}

async function tableExists(table) {
  const rows = await prisma.$queryRawUnsafe(`SHOW TABLES LIKE '${table}'`);
  return rows.length > 0;
}

async function run(sql) {
  try {
    await prisma.$executeRawUnsafe(sql);
    console.log('OK:', sql.split('\n')[0].slice(0, 80));
  } catch (e) {
    if (e.message?.includes('Duplicate column') || e.message?.includes('already exists')) {
      console.log('SKIP (exists):', sql.split('\n')[0].slice(0, 60));
    } else {
      throw e;
    }
  }
}

try {
  // enquiries
  if (!(await columnExists('enquiries', 'tags'))) {
    await run(`ALTER TABLE enquiries ADD COLUMN tags JSON NULL`);
    await run(`UPDATE enquiries SET tags = JSON_ARRAY() WHERE tags IS NULL`);
    await run(`ALTER TABLE enquiries MODIFY tags JSON NOT NULL`);
  }
  if (!(await columnExists('enquiries', 'passportNo'))) {
    await run(`ALTER TABLE enquiries ADD COLUMN passportNo VARCHAR(191) NULL`);
  }
  if (!(await columnExists('enquiries', 'studentId'))) {
    await run(`ALTER TABLE enquiries ADD COLUMN studentId VARCHAR(191) NULL`);
  }
  if (!(await columnExists('enquiries', 'leadId'))) {
    await run(`ALTER TABLE enquiries ADD COLUMN leadId VARCHAR(191) NULL`);
  }

  // enquiry_notes — add nullable first, backfill, then NOT NULL
  if (!(await columnExists('enquiry_notes', 'checklist'))) {
    await run(`ALTER TABLE enquiry_notes ADD COLUMN checklist JSON NULL`);
    await run(`UPDATE enquiry_notes SET checklist = JSON_ARRAY() WHERE checklist IS NULL`);
    await run(`ALTER TABLE enquiry_notes MODIFY checklist JSON NOT NULL`);
  }
  if (!(await columnExists('enquiry_notes', 'mentions'))) {
    await run(`ALTER TABLE enquiry_notes ADD COLUMN mentions JSON NULL`);
    await run(`UPDATE enquiry_notes SET mentions = JSON_ARRAY() WHERE mentions IS NULL`);
    await run(`ALTER TABLE enquiry_notes MODIFY mentions JSON NOT NULL`);
  }
  if (!(await columnExists('enquiry_notes', 'contentHtml'))) {
    await run(`ALTER TABLE enquiry_notes ADD COLUMN contentHtml TEXT NULL`);
  }
  if (!(await columnExists('enquiry_notes', 'isPinned'))) {
    await run(`ALTER TABLE enquiry_notes ADD COLUMN isPinned BOOLEAN NOT NULL DEFAULT false`);
  }
  if (!(await columnExists('enquiry_notes', 'updatedAt'))) {
    await run(`ALTER TABLE enquiry_notes ADD COLUMN updatedAt DATETIME(3) NULL`);
    await run(`UPDATE enquiry_notes SET updatedAt = createdAt WHERE updatedAt IS NULL`);
    await run(`ALTER TABLE enquiry_notes MODIFY updatedAt DATETIME(3) NOT NULL`);
  }

  if (!(await columnExists('enquiry_audit_logs', 'ipAddress'))) {
    await run(`ALTER TABLE enquiry_audit_logs ADD COLUMN ipAddress VARCHAR(191) NULL`);
  }

  if (!(await tableExists('enquiry_demos'))) {
    console.log('Run: npx prisma db push --accept-data-loss (for remaining tables)');
  }

  console.log('\nCore columns applied. Now run:');
  console.log('  npx prisma db push --accept-data-loss');
  console.log('  npx prisma generate   (stop backend first if EPERM)');
} catch (e) {
  console.error('Migration step failed:', e.message);
  process.exitCode = 1;
} finally {
  await prisma.$disconnect();
}
