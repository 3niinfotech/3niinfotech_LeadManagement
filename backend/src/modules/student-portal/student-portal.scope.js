import { AppError } from '../../utils/response.util.js';
import { STUDENT_ROLE_SLUGS } from '../../config/portal.config.js';
import prisma from '../../config/database.js';

export function assertStudentPortal(user) {
  if (!STUDENT_ROLE_SLUGS.includes(user?.role?.slug)) {
    throw new AppError('Student portal access only', 403);
  }
}

/** Always resolve from auth user — never trust client studentId. */
export async function resolveOwnStudent(user) {
  assertStudentPortal(user);
  const includeOpts = {
    branch: {
      select: {
        id: true,
        name: true,
        code: true,
        company: { select: { id: true, name: true, code: true } },
      },
    },
    assignedTo: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
    user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true } },
    documents: {
      where: { deletedAt: null, category: 'PHOTO' },
      orderBy: { createdAt: 'desc' },
      take: 1,
      select: { id: true, filePath: true, mimeType: true, fileName: true, category: true },
    },
    enquiry: {
      select: {
        id: true,
        alternateNo: true,
        mobile: true,
        address: true,
        metadata: true,
        documents: {
          where: { category: 'PHOTO' },
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: { id: true, filePath: true, mimeType: true, fileName: true, category: true },
        },
      },
    },
  };

  let student = await prisma.student.findFirst({
    where: { userId: user.id, deletedAt: null },
    include: includeOpts,
  });

  if (!student && user.email) {
    student = await prisma.student.findFirst({
      where: { email: user.email, deletedAt: null },
      include: includeOpts,
    });
    if (student && !student.userId) {
      await prisma.student.update({
        where: { id: student.id },
        data: { userId: user.id },
      }).catch(() => {});
    }
  }

  if (!student) throw new AppError('Student profile not linked to this account', 404);
  return student;
}

export function sanitizeDocumentForStudent(doc) {
  if (!doc) return doc;
  const meta = (doc.metadata && typeof doc.metadata === 'object') ? { ...doc.metadata } : {};
  delete meta.internalNotes;
  delete meta.staffNotes;
  delete meta.riskFlags;
  return {
    id: doc.id,
    name: doc.name,
    fileName: doc.fileName,
    filePath: doc.filePath,
    fileSize: doc.fileSize,
    mimeType: doc.mimeType,
    category: doc.category,
    createdAt: doc.createdAt,
    updatedAt: doc.updatedAt,
    status: meta.status || (doc.filePath ? 'UPLOADED' : 'REQUIRED'),
    studentRemarks: meta.studentRemarks || null,
    rejectionReason: meta.rejectionReason || null,
    verifiedAt: meta.verifiedAt || null,
  };
}

export function sanitizeVisaForStudent(visa) {
  if (!visa) return visa;
  const meta = (visa.metadata && typeof visa.metadata === 'object') ? { ...visa.metadata } : {};
  delete meta.internalNotes;
  delete meta.staffNotes;
  delete meta.riskFlags;
  delete meta.riskScore;
  return {
    id: visa.id,
    country: visa.country,
    visaType: visa.visaType,
    status: visa.status,
    applicationNo: visa.applicationNo,
    submittedAt: visa.submittedAt,
    decisionAt: visa.decisionAt,
    expiryDate: visa.expiryDate,
    createdAt: visa.createdAt,
    updatedAt: visa.updatedAt,
    studentSafeRemark: meta.studentRemark || meta.studentSafeRemark || null,
    importantDates: meta.importantDates || null,
  };
}

export function sanitizeApplicationForStudent(app) {
  if (!app) return app;
  const meta = (app.metadata && typeof app.metadata === 'object') ? { ...app.metadata } : {};
  delete meta.internalNotes;
  delete meta.staffNotes;
  delete meta.riskFlags;
  return {
    id: app.id,
    university: app.university,
    course: app.course,
    intake: app.intake,
    country: app.country,
    status: app.status,
    applicationNo: app.applicationNo,
    submittedAt: app.submittedAt,
    offerDate: app.offerDate,
    createdAt: app.createdAt,
    updatedAt: app.updatedAt,
    offerStatus: meta.offerStatus || null,
    importantDates: meta.importantDates || null,
  };
}
