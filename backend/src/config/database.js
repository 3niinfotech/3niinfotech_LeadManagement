import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;

function createPrismaClient() {
  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });
}

/** Models that must exist after recent schema pushes — expand when adding masters */
const REQUIRED_DELEGATES = ['assignmentOffer', 'masterItem', 'faculty'];

/** Dev hot-reload can keep a stale client after `prisma generate` — recreate if delegates missing */
function getPrismaClient() {
  const cached = globalForPrisma.prisma;
  const stale = cached && REQUIRED_DELEGATES.some((key) => !cached[key]);
  if (cached && !stale) return cached;
  const client = createPrismaClient();
  if (process.env.NODE_ENV !== 'production') {
    globalForPrisma.prisma = client;
  }
  return client;
}

const prisma = getPrismaClient();

export default prisma;
