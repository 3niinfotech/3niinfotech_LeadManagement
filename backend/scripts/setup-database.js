import mysql from 'mysql2/promise';
import { execSync } from 'child_process';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { parseDatabaseUrl } from './parseDbUrl.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const backendRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(backendRoot, '.env') });

const run = (command) => {
  execSync(command, { cwd: backendRoot, stdio: 'inherit', shell: true });
};

async function createDatabase() {
  const config = parseDatabaseUrl(process.env.DATABASE_URL);

  console.log('\n[1/4] Connecting to MySQL...');
  console.log(`      Host: ${config.host}:${config.port}`);
  console.log(`      User: ${config.user}`);
  console.log(`      Database: ${config.database}`);

  let connection;

  try {
    connection = await mysql.createConnection({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      multipleStatements: true,
    });
  } catch (error) {
    console.error('\n❌ MySQL connection failed.\n');
    console.error('Make sure MySQL is running. On Windows you can use:');
    console.error('  - XAMPP → Start MySQL');
    console.error('  - WAMP → Start MySQL service');
    console.error('  - MySQL Workbench / MySQL80 service in Services.msc\n');
    console.error(`Error: ${error.message}\n`);
    process.exit(1);
  }

  console.log('\n[2/4] Creating database (if not exists)...');
  await connection.query(
    `CREATE DATABASE IF NOT EXISTS \`${config.database}\`
     CHARACTER SET utf8mb4
     COLLATE utf8mb4_unicode_ci`
  );
  await connection.end();
  console.log(`      ✓ Database "${config.database}" is ready`);

  console.log('\n[3/4] Creating tables via Prisma...');
  run('npx prisma generate');
  run('npx prisma db push');

  console.log('\n[4/4] Seeding default data...');
  run('node prisma/seed.js');

  console.log('\n✅ Database setup complete!\n');
  console.log('Default login:');
  console.log('  Email   : admin@crm.com');
  console.log('  Password: Admin@123\n');
  console.log('Start API: npm run dev\n');
}

createDatabase().catch((error) => {
  console.error('\n❌ Setup failed:', error.message);
  process.exit(1);
});
