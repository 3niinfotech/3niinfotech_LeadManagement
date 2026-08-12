/**
 * Create enquiries for walk-in leads that have no linked enquiry yet.
 * Run: node scripts/backfill-enquiries-from-leads.js
 */
import prisma from '../src/config/database.js';
import { enquiryService } from '../src/modules/enquiry/enquiry.service.js';

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@crm.com', deletedAt: null },
    select: { id: true },
  });
  if (!admin) throw new Error('admin@crm.com not found');

  const leads = await prisma.lead.findMany({
    where: {
      deletedAt: null,
      enquiry: null,
    },
    orderBy: { createdAt: 'asc' },
  });

  if (!leads.length) {
    console.log('No leads without enquiry — nothing to do.');
    return;
  }

  let created = 0;
  for (const lead of leads) {
    const enquiry = await enquiryService.createFromLead(
      lead,
      admin.id,
      { user: { id: admin.id } },
      { status: 'NEW', priority: 'MEDIUM' },
    );
    created += 1;
    console.log(`  ${lead.leadCode} → ${enquiry.enquiryCode} (${enquiry.status})`);
  }

  console.log(`\nBackfill complete: ${created} enquiry record(s) created.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
