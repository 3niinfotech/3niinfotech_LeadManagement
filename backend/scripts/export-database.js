/**
 * Export the current MySQL database to database/backups/latest_database.sql
 * Uses mysqldump when available, otherwise falls back to a Node-based export.
 */
import { execSync, spawnSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';
import { parseDatabaseUrl } from './parseDbUrl.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const backendRoot = path.resolve(__dirname, '..');
const backupDir = path.join(projectRoot, 'database', 'backups');
const backupFile = path.join(backupDir, 'latest_database.sql');

dotenv.config({ path: path.join(backendRoot, '.env') });

const MYSQLDUMP_PATHS = [
  process.env.MYSQLDUMP_PATH,
  'C:\\xampp\\mysql\\bin\\mysqldump.exe',
  'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin\\mysqldump.exe',
  'mysqldump',
].filter(Boolean);

function findMysqldump() {
  for (const candidate of MYSQLDUMP_PATHS) {
    if (candidate === 'mysqldump') return candidate;
    if (fs.existsSync(candidate)) return candidate;
  }
  return null;
}

function exportWithMysqldump(config, mysqldumpPath) {
  const args = [
    '-h', config.host,
    '-P', String(config.port),
    '-u', config.user,
    '--single-transaction',
    '--routines',
    '--triggers',
    '--default-character-set=utf8mb4',
    config.database,
  ];

  if (config.password) {
    args.unshift(`--password=${config.password}`);
  } else {
    args.unshift('--password=');
  }

  const result = spawnSync(mysqldumpPath, args, {
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 256,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(result.stderr || 'mysqldump failed');
  }

  return result.stdout;
}

async function exportWithNode(config) {
  const conn = await mysql.createConnection({
    ...config,
    multipleStatements: true,
  });

  const lines = [
    '-- Lead Management CRM database export',
    `-- Generated: ${new Date().toISOString()}`,
    `-- Database: ${config.database}`,
    'SET NAMES utf8mb4;',
    'SET FOREIGN_KEY_CHECKS=0;',
  ];

  const [tables] = await conn.query('SHOW FULL TABLES WHERE Table_type = \"BASE TABLE\"');
  const tableKey = Object.keys(tables[0] || {}).find((k) => k.startsWith('Tables_in_')) || 'Tables_in_db';

  for (const row of tables) {
    const table = row[tableKey];
    const [[createRow]] = await conn.query(`SHOW CREATE TABLE \`${table}\``);
    lines.push('', `-- Table: ${table}`, `DROP TABLE IF EXISTS \`${table}\`;`, `${createRow['Create Table']};`);

    const [rows] = await conn.query(`SELECT * FROM \`${table}\``);
    if (!rows.length) continue;

    const columns = Object.keys(rows[0]);
    const chunkSize = 100;
    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);
      const values = chunk.map((record) => {
        const vals = columns.map((col) => conn.escape(record[col]));
        return `(${vals.join(', ')})`;
      });
      lines.push(`INSERT INTO \`${table}\` (\`${columns.join('`, `')}\`) VALUES\n${values.join(',\n')};`);
    }
  }

  lines.push('SET FOREIGN_KEY_CHECKS=1;', '');
  await conn.end();
  return lines.join('\n');
}

async function main() {
  const config = parseDatabaseUrl(process.env.DATABASE_URL);
  fs.mkdirSync(backupDir, { recursive: true });

  const mysqldumpPath = findMysqldump();
  let sql;

  console.log(`Exporting database "${config.database}"...`);

  if (mysqldumpPath) {
    console.log(`Using mysqldump: ${mysqldumpPath}`);
    sql = exportWithMysqldump(config, mysqldumpPath);
  } else {
    console.log('mysqldump not found — using Node fallback export');
    sql = await exportWithNode(config);
  }

  if (!sql || sql.trim().length < 100) {
    throw new Error('Export produced empty or invalid SQL');
  }

  fs.writeFileSync(backupFile, sql, 'utf8');
  const sizeMb = (fs.statSync(backupFile).size / (1024 * 1024)).toFixed(2);
  console.log(`✓ Backup written: ${backupFile} (${sizeMb} MB)`);
}

main().catch((err) => {
  console.error('Export failed:', err.message);
  process.exit(1);
});
