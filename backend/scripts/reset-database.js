/**
 * Wipe all data and re-seed from scratch (clean enquiry → student flow).
 * Usage: node scripts/reset-database.js
 */
import { execSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

const run = (command) => {
  execSync(command, { cwd: backendRoot, stdio: 'inherit', shell: true });
};

console.log('\n⚠️  Resetting database — all enquiries, students, and users will be removed.\n');

console.log('[1/3] Dropping & recreating schema (Prisma force reset)...');
try {
  run('npx prisma db push --force-reset --accept-data-loss --skip-generate');
} catch {
  console.warn('Schema reset may have partially completed — continuing...');
}

console.log('\n[2/3] Generating Prisma client (stop backend if this fails)...');
try {
  run('npx prisma generate');
} catch {
  console.warn('⚠️  prisma generate skipped (backend may be running). Restart API after reset.');
}

console.log('\n[3/3] Seeding fresh baseline (admin + RBAC + menus only)...');
run('node prisma/seed.js');

console.log('\n✅ Fresh database ready!\n');
console.log('Flow: Login → Manage Enquiry → Add/Register visitor → Convert tab → Student profile\n');
console.log('Login credentials:');
console.log('  Email   : admin@crm.com');
console.log('  Password: Admin@123\n');
console.log('Restart backend: npm run dev\n');
