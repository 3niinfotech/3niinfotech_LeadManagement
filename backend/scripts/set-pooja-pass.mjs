import bcrypt from 'bcryptjs';
import prisma from '../src/config/database.js';

async function setPass() {
  const hash = await bcrypt.hash('Student@123', 10);
  await prisma.user.update({
    where: { email: 'pooja.qa@testmail.com' },
    data: { password: hash }
  });
  console.log('Password for pooja.qa@testmail.com successfully set to Student@123');
  process.exit(0);
}

setPass();
