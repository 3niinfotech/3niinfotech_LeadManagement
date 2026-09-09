import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { parseSort } from '../../utils/response.util.js';
import { applicationRepository, APPLICATION_SORT_FIELDS } from './application.repository.js';
import prisma from '../../config/database.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import { masterRepository } from '../master/master.repository.js';
import {
  assertApplicationInTenant,
  assertStudentInTenant,
  mergeStudentRelationScope,
} from '../../utils/tenant.util.js';

const dateInput = z.string().optional().nullable();

export const createApplicationSchema = z.object({
  studentId: z.string().min(1),
  university: z.string().min(1),
  course: z.string().min(1),
  intake: z.string().optional().nullable(),
  country: z.string().optional().nullable(),
  countryId: z.string().uuid().optional().nullable(),
  applicationStatusMasterId: z.string().uuid().optional().nullable(),
  status: z.enum(['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'CONDITIONAL_OFFER', 'UNCONDITIONAL_OFFER', 'REJECTED', 'WITHDRAWN']).optional(),
  applicationNo: z.string().optional().nullable(),
  submittedAt: dateInput,
  offerDate: dateInput,
  metadata: z.record(z.unknown()).optional(),
});

export const updateApplicationSchema = createApplicationSchema.partial();

const parseDate = (value) => (value ? new Date(value) : null);

function requireCompany(user) {
  const companyId = user?.companyId;
  if (!companyId) throw new AppError('Company context required', 403);
  return companyId;
}

async function resolveStatusMetadata(companyId, { countryId, applicationStatusMasterId }) {
  if (!countryId) return {};

  const country = await masterRepository.assertRelatedInCompany('country', countryId, companyId);
  if (!country) throw new AppError('Country not found in your company', 422);

  let statusRecord = null;
  if (applicationStatusMasterId) {
    statusRecord = await masterRepository.findApplicationStatusById(companyId, applicationStatusMasterId);
    if (!statusRecord || statusRecord.countryId !== countryId) {
      throw new AppError('Application status not found for this country', 422);
    }
  } else {
    statusRecord = await masterRepository.findDefaultApplicationStatus(companyId, countryId);
  }

  if (!statusRecord) {
    return {
      countryId,
      countryName: country.name,
    };
  }

  return {
    countryId,
    countryName: country.name,
    applicationStatusMasterId: statusRecord.id,
    applicationStatusName: statusRecord.name,
    mailSend: statusRecord.mailSend,
    setOfferLetter: statusRecord.setOfferLetter,
    defaultStatus: statusRecord.defaultStatus,
    position: statusRecord.position,
  };
}

function mergeMetadata(existing = {}, patch = {}) {
  const base = typeof existing === 'object' && existing !== null ? existing : {};
  return { ...base, ...patch };
}

export const applicationService = {
  getAll: async (query, user) => {
    const sort = parseSort(query, APPLICATION_SORT_FIELDS);
    const scopeWhere = mergeStudentRelationScope(user);
    if (query.studentId) await assertStudentInTenant(query.studentId, user);
    return applicationRepository.findMany({ ...query, sort, scopeWhere });
  },

  getSummary: async (query, user) => {
    const scopeWhere = mergeStudentRelationScope(user);
    if (query.studentId) await assertStudentInTenant(query.studentId, user);
    return applicationRepository.getSummary({ ...query, scopeWhere });
  },

  getById: async (id, user) => assertApplicationInTenant(id, user),

  exportApplications: async (query, user, userId, req) => {
    const { ids: requestedIds, ...filters } = query || {};
    const selected = Array.isArray(requestedIds) && requestedIds.length > 0;
    const scopeWhere = mergeStudentRelationScope(user);
    if (filters.studentId) await assertStudentInTenant(filters.studentId, user);

    const sort = parseSort(filters, APPLICATION_SORT_FIELDS);
    const result = await applicationRepository.findMany({
      ...filters,
      ...(selected ? { ids: requestedIds } : {}),
      sort,
      scopeWhere,
      page: 1,
      limit: selected ? Math.max(requestedIds.length, 1) : 5000,
    });

    const { buildApplicationExportWorkbook, buildApplicationExportFilename } = await import(
      './application.export.service.js'
    );
    const buffer = await buildApplicationExportWorkbook(result.data, { selected });
    const filename = buildApplicationExportFilename({ selected });

    await auditLog({
      userId,
      action: 'EXPORT',
      entityType: 'Application',
      newData: { count: result.data.length, selected },
      req,
    });

    return { buffer, filename, count: result.data.length, selected };
  },

  create: async (data, user, req) => {
    const userId = user?.id;
    const companyId = requireCompany(user);
    await assertStudentInTenant(data.studentId, user);

    const {
      countryId,
      applicationStatusMasterId,
      metadata: inputMetadata,
      ...rest
    } = data;

    const statusMeta = await resolveStatusMetadata(companyId, { countryId, applicationStatusMasterId });
    const metadata = mergeMetadata(inputMetadata, statusMeta);

    const applicationNo = rest.applicationNo || await applicationRepository.generateCode();
    const record = await applicationRepository.create({
      ...rest,
      country: rest.country || statusMeta.countryName || null,
      applicationNo,
      submittedAt: parseDate(rest.submittedAt),
      offerDate: parseDate(rest.offerDate),
      metadata,
      createdBy: userId,
    });

    await prisma.activity.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'Application',
        entityId: record.id,
        description: `Application ${applicationNo} created${statusMeta.applicationStatusName ? ` — ${statusMeta.applicationStatusName}` : ''}`,
      },
    });
    await auditLog({
      userId,
      action: 'CREATE',
      entityType: 'Application',
      entityId: record.id,
      newData: { id: record.id, applicationNo, studentId: record.studentId },
      req,
    });
    return record;
  },

  update: async (id, data, user, req) => {
    const userId = user?.id;
    const companyId = requireCompany(user);
    const existing = await assertApplicationInTenant(id, user);
    if (data.studentId) await assertStudentInTenant(data.studentId, user);

    const {
      countryId,
      applicationStatusMasterId,
      metadata: inputMetadata,
      ...rest
    } = data;

    let metadata = existing.metadata;
    if (countryId !== undefined || applicationStatusMasterId !== undefined) {
      const resolvedCountryId = countryId ?? existing.metadata?.countryId;
      const resolvedStatusId = applicationStatusMasterId ?? (
        countryId !== undefined ? undefined : existing.metadata?.applicationStatusMasterId
      );
      const statusMeta = await resolveStatusMetadata(companyId, {
        countryId: resolvedCountryId,
        applicationStatusMasterId: resolvedStatusId,
      });
      metadata = mergeMetadata(existing.metadata, mergeMetadata(inputMetadata, statusMeta));
    } else if (inputMetadata) {
      metadata = mergeMetadata(existing.metadata, inputMetadata);
    }

    const record = await applicationRepository.update(id, {
      ...rest,
      ...(rest.country === undefined && metadata?.countryName ? { country: metadata.countryName } : {}),
      updatedBy: userId,
      submittedAt: rest.submittedAt !== undefined ? parseDate(rest.submittedAt) : undefined,
      offerDate: rest.offerDate !== undefined ? parseDate(rest.offerDate) : undefined,
      metadata,
    });

    await prisma.activity.create({ data: { userId, action: 'UPDATE', entityType: 'Application', entityId: id, description: 'Application updated' } });
    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'Application',
      entityId: id,
      oldData: { id: existing.id, status: existing.status },
      newData: { id: record.id, status: record.status },
      req,
    });
    return record;
  },

  delete: async (id, user, req) => {
    const userId = user.id;
    const existing = await assertApplicationInTenant(id, user);
    await applicationRepository.softDelete(id, userId);
    await auditLog({
      userId,
      action: 'DELETE',
      entityType: 'Application',
      entityId: id,
      oldData: { id: existing.id },
      req,
    });
  },
};
