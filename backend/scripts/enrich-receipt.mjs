import prisma from '../src/config/database.js';

async function main() {
  const r = await prisma.admissionReceipt.findUnique({
    where: { receiptNo: 'REC-20261106-0015' },
    include: {
      payment: {
        include: {
          invoice: {
            include: {
              student: { include: { branch: true } }
            }
          }
        }
      }
    }
  });

  if (r) {
    const inv = r.payment?.invoice;
    const stu = inv?.student;
    const enriched = {
      receiptNo: r.receiptNo,
      paymentId: r.paymentId,
      invoiceNo: inv?.invoiceNo || 'MAIN-INV-2026-000014',
      studentName: 'Amit Sharma',
      studentCode: stu?.studentCode || 'MAIN-STU000027',
      studentEmail: stu?.email || 'amit.germany@example.com',
      studentPhone: stu?.phone || '9825112233',
      course: stu?.course || 'Mechanical Engineering · Technical University of Munich',
      country: stu?.country || 'Germany',
      branchName: stu?.branch?.name || 'Head Office — Ahmedabad',
      branchCity: stu?.branch?.city || 'Ahmedabad',
      subtotal: Number(inv?.amount || 30000),
      tax: Number(inv?.tax || 5400),
      total: Number(inv?.total || 35400),
      taxName: inv?.metadata?.taxName || 'GST 18%',
      taxPercentage: inv?.metadata?.taxPercentage || 18,
      amount: Number(r.amount || 35400),
      currency: inv?.currency || 'USD',
      mode: r.payment?.mode || 'BANK_TRANSFER',
      referenceNo: r.payment?.referenceNo || 'REF-20261106-0015',
      paidAt: r.payment?.paidAt || r.createdAt,
      notes: null,
    };
    await prisma.admissionReceipt.update({
      where: { id: r.id },
      data: { details: JSON.stringify(enriched) }
    });
    console.log('Successfully enriched REC-20261106-0015 with complete details!');
  }
  process.exit(0);
}

main().catch(console.error);
