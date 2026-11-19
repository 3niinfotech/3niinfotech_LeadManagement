import { enquiryRepository } from './src/modules/enquiry/enquiry.repository.js';
import prisma from './src/config/database.js';

async function main() {
  const timeline = await enquiryRepository.getTimeline('fe5d2878-9223-4285-b031-4129b618fa0e');
  console.log('Timeline count:', timeline.length);
  console.log('Timeline entries:', JSON.stringify(timeline, null, 2));
}

main().finally(() => prisma.$disconnect());
