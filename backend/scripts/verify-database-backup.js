/**
 * Verify latest_database.sql by importing into a temporary database.
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { parseDatabaseUrl } from './parseDbUrl.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const backendRoot = path.resolve(__dirname, '..');
const backupFile = path.join(projectRoot, 'database', 'backups', 'latest_database.sql');

dotenv.config({ path: path.join(backendRoot, '.env') });

async function main() {
  if (!fs.existsSync(backupFile)) {
    throw new Error(`Backup not found: ${backupFile}`);
  }

  const config = parseDatabaseUrl(process.env.DATABASE_URL);
  const testDb = `${config.database}_restore_test_${Date.now()}`;
  const sql = fs.readFileSync(backupFile, 'utf8');

  const conn = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: config.user,
    password: config.password,
    multipleStatements: true,
  });

  console.log(`Creating temporary database: ${testDb}`);
  await conn.query(`CREATE DATABASE \`${testDb}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.query(`USE \`${testDb}\``);
  await conn.query(sql);

  const [tables] = await conn.query('SHOW TABLES');
  const [users] = await conn.query('SELECT COUNT(*) AS count FROM users');
  const [companies] = await conn.query('SELECT COUNT(*) AS count FROM companies');

  console.log('✓ Restore verification passed');
  console.log(`  Tables imported: ${tables.length}`);
  console.log(`  Users rows: ${users[0]?.count ?? 0}`);
  console.log(`  Companies rows: ${companies[0]?.count ?? 0}`);

  await conn.query(`DROP DATABASE \`${testDb}\``);
  await conn.end();
}

main().catch((err) => {
  console.error('Restore verification failed:', err.message);
  process.exit(1);
});
