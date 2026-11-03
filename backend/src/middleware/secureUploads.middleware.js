import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { authenticate } from './auth.middleware.js';
import { AppError } from '../utils/response.util.js';
import { softDeleteWhere } from '../utils/response.util.js';
import {
  mergeScope,
  isPlatformGlobalUser,
  requireTenantCompany,
} from '../utils/tenant.util.js';
import prisma from '../config/database.js';
import config from '../config/index.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsRoot = path.resolve(__dirname, '..', '..', config.upload.dir);

function safeResolveUpload(relPath) {
  const normalized = path.normalize(relPath).replace(/^(\.\.(\/|\\|$))+/, '');
  const absolute = path.resolve(uploadsRoot, normalized);
  if (!absolute.startsWith(uploadsRoot)) {
    throw new AppError('Forbidden', 403);
  }
  return absolute;
}

/**
 * Authorize access to an uploaded file path under /uploads/*.
 * Company logos: same company. Enquiry docs: mergeScope. Else: deny.
 */
async function assertUploadAccess(user, relativePath) {
  const rel = relativePath.replace(/\\/g, '/').replace(/^\/+/, '');

  if (isPlatformGlobalUser(user)) return;

  const companyId = requireTenantCompany(user);

  // /uploads/company/{companyId}/...
  const companyMatch = rel.match(/^company\/([^/]+)\//);
  if (companyMatch) {
    if (companyMatch[1] !== companyId) {
      throw new AppError('Forbidden: file is outside your company', 403);
    }
    return;
  }

  if (user.role?.slug === 'student' || user.role?.slug === 'STUDENT' || user.role?.slug?.includes('student')) {
    const student = await prisma.student.findFirst({
      where: { OR: [{ userId: user.id }, { email: user.email }], deletedAt: null },
      select: { id: true },
    });
    if (student) {
      const fileName = path.basename(rel);
      const isStudentDoc = await prisma.document.findFirst({
        where: {
          studentId: student.id,
          deletedAt: null,
          OR: [{ filePath: rel }, { filePath: { endsWith: fileName } }],
        },
      });
      if (isStudentDoc) return;

      const enquiry = await prisma.enquiry.findFirst({
        where: { studentId: student.id, deletedAt: null },
        select: { id: true },
      });
      if (enquiry) {
        const isEnquiryDoc = await prisma.enquiryDocument.findFirst({
          where: {
            enquiryId: enquiry.id,
            OR: [{ filePath: rel }, { filePath: { endsWith: fileName } }],
          },
        });
        if (isEnquiryDoc) return;
      }
    }
  }

  // Enquiry / note attachments
  if (rel.startsWith('enquiries/')) {
    const fileName = path.basename(rel);
    const doc = await prisma.enquiryDocument.findFirst({
      where: {
        OR: [
          { filePath: rel },
          { filePath: { endsWith: fileName } },
        ],
      },
      select: { enquiryId: true },
    });
    if (doc?.enquiryId) {
      const scopeWhere = mergeScope(user, { entity: 'enquiry' });
      const enquiry = await prisma.enquiry.findFirst({
        where: { id: doc.enquiryId, ...softDeleteWhere, ...scopeWhere },
        select: { id: true },
      });
      if (enquiry) return;
    }

    // Fallback: generic Document table
    const generic = await prisma.document.findFirst({
      where: {
        ...softDeleteWhere,
        OR: [{ filePath: rel }, { filePath: { endsWith: fileName } }],
      },
      select: { studentId: true, entityType: true, entityId: true },
    });
    if (generic?.studentId) {
      const scopeWhere = mergeScope(user, { entity: 'student' });
      const student = await prisma.student.findFirst({
        where: { id: generic.studentId, ...softDeleteWhere, ...scopeWhere },
        select: { id: true },
      });
      if (student) return;
    }

    return;
  }

  // Allow student photo documents and generic student uploads
  if (rel.startsWith('students/')) {
    return;
  }

  // Default deny for other paths
  throw new AppError('Forbidden: file access denied', 403);
}

export function mountSecureUploads(app) {
  app.use('/uploads', async (req, res, next) => {
    try {
      if (req.method !== 'GET' && req.method !== 'HEAD') {
        return next(new AppError('Method not allowed', 405));
      }

      const relativePath = decodeURIComponent((req.path || '').replace(/^\/+/, ''));
      if (!relativePath || relativePath.includes('\0')) {
        return next(new AppError('Not found', 404));
      }

      // Allow public access for company public assets (logo, favicon, public branding)
      if (relativePath.startsWith('company/') || relativePath.startsWith('public/')) {
        const absolute = safeResolveUpload(relativePath);
        if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
          return next(new AppError('Not found', 404));
        }
        return res.sendFile(absolute);
      }

      // For secure documents (enquiries, notes, student documents, visas), enforce authentication
      return authenticate(req, res, async (authErr) => {
        if (authErr) return next(authErr);
        try {
          await assertUploadAccess(req.user, relativePath);
          const absolute = safeResolveUpload(relativePath);
          if (!fs.existsSync(absolute) || !fs.statSync(absolute).isFile()) {
            return next(new AppError('Not found', 404));
          }
          return res.sendFile(absolute);
        } catch (err) {
          return next(err);
        }
      });
    } catch (err) {
      return next(err);
    }
  });
}
