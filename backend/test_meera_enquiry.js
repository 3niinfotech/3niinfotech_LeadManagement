import prisma from './src/config/database.js';
import { enquiryService } from './src/modules/enquiry/enquiry.service.js';

async function main() {
  const user = await prisma.user.findFirst({
    where: { email: { contains: 'counsel' } },
    include: { role: true }
  });
  const reqUser = {
    ...user,
    role: { ...user.role, dataScope: 'OWN' },
    dataScope: 'OWN',
    companyId: user.companyId,
    branchId: user.branchId,
    permissions: ['enquiry.view', 'enquiry.create', 'enquiry.update']
  };
  const enquiry = await enquiryService.getById('fe5d2878-9223-4285-b031-4129b618fa0e', reqUser);
  console.log('Enquiry fetched from service:');
  console.log({
    id: enquiry.id,
    firstName: enquiry.firstName,
    lastName: enquiry.lastName,
    email: enquiry.email,
    mobile: enquiry.mobile,
    interestedCourse: enquiry.interestedCourse,
    interestedCountry: enquiry.interestedCountry,
    assignedToId: enquiry.assignedToId,
    assignedTo: enquiry.assignedTo ? enquiry.assignedTo.firstName : null
  });
}

main().finally(() => prisma.$disconnect());
