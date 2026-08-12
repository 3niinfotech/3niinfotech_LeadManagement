import mysql from 'mysql2/promise';
import dotenv from 'dotenv';
dotenv.config();

function parseDbUrl(databaseUrl) {
  const withoutProtocol = databaseUrl.replace(/^mysql:\/\//, '');
  const at = withoutProtocol.lastIndexOf('@');
  const creds = withoutProtocol.slice(0, at);
  const hostPart = withoutProtocol.slice(at + 1);
  const [user, ...passParts] = creds.split(':');
  const password = passParts.join(':');
  const [hostPort, database] = hostPart.split('/');
  const [host, port] = hostPort.split(':');
  return {
    host,
    port: Number(port || 3306),
    user: decodeURIComponent(user),
    password: decodeURIComponent(password || ''),
    database: database?.split('?')[0],
  };
}

const cfg = parseDbUrl(process.env.DATABASE_URL);
const conn = await mysql.createConnection(cfg);
const tables = [
  'admissions',
  'admission_documents',
  'admission_payments',
  'admission_receipts',
  'fee_plans',
  'fee_installments',
];

for (const t of tables) {
  console.log(`\n==== ${t} ====`);
  const [cols] = await conn.query('SHOW FULL COLUMNS FROM ??', [t]);
  for (const c of cols) {
    console.log(`${c.Field} | ${c.Type} | Null=${c.Null} | Key=${c.Key} | Default=${c.Default} | Extra=${c.Extra}`);
  }
  const [idx] = await conn.query('SHOW INDEX FROM ??', [t]);
  console.log('-- INDEXES --');
  for (const i of idx) {
    console.log(`${i.Key_name} | nonUnique=${i.Non_unique} | col=${i.Column_name} | seq=${i.Seq_in_index}`);
  }
  const [fks] = await conn.query(`
    SELECT CONSTRAINT_NAME, COLUMN_NAME, REFERENCED_TABLE_NAME, REFERENCED_COLUMN_NAME
    FROM information_schema.KEY_COLUMN_USAGE
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ?
      AND REFERENCED_TABLE_NAME IS NOT NULL
  `, [t]);
  console.log('-- FKS --');
  for (const f of fks) {
    console.log(`${f.CONSTRAINT_NAME}: ${f.COLUMN_NAME} -> ${f.REFERENCED_TABLE_NAME}.${f.REFERENCED_COLUMN_NAME}`);
  }
}

await conn.end();
