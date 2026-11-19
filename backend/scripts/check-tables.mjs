import prisma from '../src/config/database.js';

async function main() {
  const tables = await prisma.$queryRawUnsafe('SHOW TABLES');
  console.log('Tables:', tables.map(t => Object.values(t)[0]).filter(t => t.includes('session') || t.includes('task')));
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

