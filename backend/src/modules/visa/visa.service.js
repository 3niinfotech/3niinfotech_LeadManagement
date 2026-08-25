import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { parseSort } from '../../utils/response.util.js';
import { visaRepository, VISA_SORT_FIELDS } from './visa.repository.js';
import prisma from '../../config/database.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import { masterRepository } from '../master/master.repository.js';
import {
  assertVisaInTenant,
  assertStudentInTenant,
  mergeStudentRelationScope,
} from '../../utils/tenant.util.js';

const dateInput = z.string().optional().nullable();

export const createVisaSchema = z.object({
  studentId: z.string().min(1),
  country: z.string().optional().nullable(),
  countryId: z.string().uuid().optional().nullable(),
  visaType: z.string().optional().nullable(),
  visaStatusMasterId: z.string().uuid().optional().nullable(),
  status: z.enum(['NOT_STARTED', 'DOCUMENTS_COLLECTED', 'APPLICATION_SUBMITTED', 'BIOMETRICS_DONE', 'INTERVIEW_SCHEDULED', 'APPROVED', 'REJECTED', 'APPEAL']).optional(),
  applicationNo: z.string().optional().nullable(),
  submittedAt: dateInput,
  decisionAt: dateInput,
  expiryDate: dateInput,
  metadata: z.record(z.unknown()).optional(),
});

export const updateVisaSchema = createVisaSchema.partial();

const parseDate = (value) => (value ? new Date(value) : null);

function requireCompany(user) {
  const companyId = user?.companyId;
  if (!companyId) throw new AppError('Company context required', 403);
  return companyId;
}

function mapMasterToEnum(statusRecord) {
  if (!statusRecord) return undefined;
  if (statusRecord.visaApproved) return 'APPROVED';
  if (statusRecord.visaRejected) return 'REJECTED';
  if (statusRecord.visaWithdraw) return 'APPEAL';
  return undefined;
}

async function resolveStatusMetadata(companyId, { countryId, visaStatusMasterId }) {
  if (!countryId) return {};

  const country = await masterRepository.assertRelatedInCompany('country', countryId, companyId);
  if (!country) throw new AppError('Country not found in your company', 422);

  let statusRecord = null;
  if (visaStatusMasterId) {
    statusRecord = await masterRepository.findVisaStatusById(companyId, visaStatusMasterId);
    if (!statusRecord || statusRecord.countryId !== countryId) {
      throw new AppError('Visa status not found for this country', 422);
    }
  } else {
    statusRecord = await masterRepository.findDefaultVisaStatus(companyId, countryId);
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
    visaStatusMasterId: statusRecord.id,
    visaStatusName: statusRecord.name,
    visaApproved: statusRecord.visaApproved,
    visaWithdraw: statusRecord.visaWithdraw,
    visaRejected: statusRecord.visaRejected,
    mailSend: statusRecord.mailSend,
    defaultStatus: statusRecord.defaultStatus,
    position: statusRecord.position,
    mappedEnumStatus: mapMasterToEnum(statusRecord),
  };
}

function mergeMetadata(existing = {}, patch = {}) {
  const base = typeof existing === 'object' && existing !== null ? existing : {};
  return { ...base, ...patch };
}

export const visaService = {
  getAll: async (query, user) => {
    const sort = parseSort(query, VISA_SORT_FIELDS);
    const scopeWhere = mergeStudentRelationScope(user);
    if (query.studentId) await assertStudentInTenant(query.studentId, user);
    return visaRepository.findMany({ ...query, sort, scopeWhere });
  },

  getById: async (id, user) => assertVisaInTenant(id, user),

  create: async (data, user, req) => {
    const userId = user?.id;
    const companyId = requireCompany(user);
    await assertStudentInTenant(data.studentId, user);

    const {
      countryId,
      visaStatusMasterId,
      metadata: inputMetadata,
      status: inputStatus,
      ...rest
    } = data;

    const statusMeta = await resolveStatusMetadata(companyId, { countryId, visaStatusMasterId });
    const metadata = mergeMetadata(inputMetadata, statusMeta);
    const resolvedStatus = inputStatus || statusMeta.mappedEnumStatus || 'NOT_STARTED';

    const applicationNo = rest.applicationNo || await visaRepository.generateCode();
    const record = await visaRepository.create({
      ...rest,
      country: rest.country || statusMeta.countryName || '',
      status: resolvedStatus,
      applicationNo,
      submittedAt: parseDate(rest.submittedAt),
      decisionAt: parseDate(rest.decisionAt),
      expiryDate: parseDate(rest.expiryDate),
      metadata,
      createdBy: userId,
    });

    await prisma.activity.create({
      data: {
        userId,
        action: 'CREATE',
        entityType: 'Visa',
        entityId: record.id,
        description: `Visa case ${applicationNo} created${statusMeta.visaStatusName ? ` — ${statusMeta.visaStatusName}` : ''}`,
      },
    });
    await auditLog({
      userId,
      action: 'CREATE',
      entityType: 'Visa',
      entityId: record.id,
      newData: { id: record.id, applicationNo, studentId: record.studentId },
      req,
    });
    return record;
  },

  update: async (id, data, user, req) => {
    const userId = user?.id;
    const companyId = requireCompany(user);
    const existing = await assertVisaInTenant(id, user);
    if (data.studentId) await assertStudentInTenant(data.studentId, user);

    const {
      countryId,
      visaStatusMasterId,
      metadata: inputMetadata,
      status: inputStatus,
      ...rest
    } = data;

    let metadata = existing.metadata;
    let resolvedStatus = inputStatus;

    if (countryId !== undefined || visaStatusMasterId !== undefined) {
      const effectiveCountryId = countryId ?? existing.metadata?.countryId;
      const statusMeta = await resolveStatusMetadata(companyId, {
        countryId: effectiveCountryId,
        visaStatusMasterId,
      });
      metadata = mergeMetadata(metadata, mergeMetadata(inputMetadata, statusMeta));
      if (!resolvedStatus && statusMeta.mappedEnumStatus) {
        resolvedStatus = statusMeta.mappedEnumStatus;
      }
    } else if (inputMetadata) {
      metadata = mergeMetadata(metadata, inputMetadata);
    }

    const record = await visaRepository.update(id, {
      ...rest,
      ...(resolvedStatus !== undefined ? { status: resolvedStatus } : {}),
      ...(rest.country !== undefined || metadata?.countryName
        ? { country: rest.country ?? metadata?.countryName ?? existing.country }
        : {}),
      metadata,
      updatedBy: userId,
      submittedAt: rest.submittedAt !== undefined ? parseDate(rest.submittedAt) : undefined,
      decisionAt: rest.decisionAt !== undefined ? parseDate(rest.decisionAt) : undefined,
      expiryDate: rest.expiryDate !== undefined ? parseDate(rest.expiryDate) : undefined,
    });

    await prisma.activity.create({ data: { userId, action: 'UPDATE', entityType: 'Visa', entityId: id, description: 'Visa case updated' } });
    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'Visa',
      entityId: id,
      oldData: { id: existing.id, status: existing.status },
      newData: { id: record.id, status: record.status },
      req,
    });
    return record;
  },

  delete: async (id, user, req) => {
    const userId = user.id;
    const existing = await assertVisaInTenant(id, user);
    await visaRepository.softDelete(id, userId);
    await auditLog({
      userId,
      action: 'DELETE',
      entityType: 'Visa',
      entityId: id,
      oldData: { id: existing.id },
      req,
    });
  },
};
