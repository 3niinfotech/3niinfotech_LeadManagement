import prisma from './src/config/database.js';

async function main() {
  const users = await prisma.user.findMany({
    where: {
      OR: [
        { firstName: { contains: 'Meera' } },
        { lastName: { contains: 'Meera' } },
        { email: { contains: 'meera' } },
        { email: { contains: 'counsel' } }
      ]
    },
    include: { role: true }
  });
  console.log('Matching users in DB:');
  for (const u of users) {
    console.log({
      id: u.id,
      email: u.email,
      name: `${u.firstName} ${u.lastName}`,
      role: u.role?.name,
      slug: u.role?.slug,
      branchId: u.branchId,
      status: u.status,
      deletedAt: u.deletedAt
    });
  }
}

main().finally(() => prisma.$disconnect());
