/**
 * Master service — legacy MasterItem + relational engine business logic.
 */
import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { isValidMasterCategory, MASTER_DEFAULTS, resolveMasterCategory, isMigratedMasterCategory, resolveRelationalSlug } from '../../config/master-defaults.config.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import { masterRepository } from './master.repository.js';
import { getMasterEntityConfig, isRelationalMasterEntity } from './master.registry.js';
import { maybeDispatchAnnouncement } from '../announcement/announcement.service.js';
import {
  parseMasterCreate,
  parseMasterUpdate,
  parseMasterPagination,
  parseMasterSort,
  masterStatusSchema,
  masterItemUpdateSchema,
  bulkChecklistSchema,
  bulkVisaChecklistSchema,
  masterBulkStatusSchema,
  masterBulkDeleteSchema,
} from './master.validators.js';

function requireCompany(user) {
  const companyId = user?.companyId;
  if (!companyId) throw new AppError('Company context required', 403);
  return companyId;
}

function defaultsAsOptions(category) {
  return (MASTER_DEFAULTS[category] || []).map((label) => ({
    value: label,
    label,
  }));
}

function mapPrismaUniqueError(err, label = 'Record') {
  if (err?.code === 'P2002') {
    const target = err.meta?.target;
    const fields = Array.isArray(target) ? target.join(' ') : String(target || 'code');
    if (/\bname\b/i.test(fields)) {
      throw new AppError(`${label} with this name already exists`, 409);
    }
    throw new AppError(`${label} with this code already exists`, 409);
  }
  throw err;
}

async function assertUniqueName(slug, config, companyId, data, excludeId = null) {
  if (!config.uniqueName || !data.name) return;
  const dup = await masterRepository.findDuplicateName(slug, companyId, data, excludeId);
  if (dup) {
    const scope = (config.uniqueNameScope || []).length
      ? ` for the same ${(config.uniqueNameScope || []).join(' / ')}`
      : '';
    throw new AppError(`${config.label} "${data.name}" already exists${scope}.`, 409);
  }
}

function pickAllowedFields(data, allowed) {
  const out = {};
  for (const key of allowed) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      out[key] = data[key];
    }
  }
  return out;
}

async function validateRelations(config, companyId, payload) {
  for (const rel of config.relations || []) {
    const value = payload[rel.field];
    if (value == null || value === '') {
      if (rel.required) {
        throw new AppError(`${rel.label || rel.field} is required`, 422);
      }
      continue;
    }
    const related = await masterRepository.assertRelatedInCompany(rel.prismaModel, value, companyId);
    if (!related) {
      throw new AppError(`${rel.label || rel.field} not found in your company`, 422);
    }
  }
}

function formatDependencyMessage(entityLabel, deps) {
  const parts = deps.map((d) => `${d.count} ${d.label}`);
  return `${entityLabel} cannot be deleted because it is referenced by ${parts.join(' and ')}. Deactivate it instead.`;
}

async function attachAnnouncementNotificationResult(record, dispatchOptions) {
  if (String(record?.channel || '').toUpperCase() !== 'ANNOUNCEMENT') return record;
  try {
    const result = await maybeDispatchAnnouncement(dispatchOptions);
    return {
      ...record,
      notificationRecipients: result.recipientCount || 0,
      notificationDispatched: Boolean(result.dispatched),
      ...(result.reason === 'no_recipients' ? { notificationWarning: 'No active users found for the selected audience' } : {}),
      ...(result.reason && result.reason !== 'no_recipients' && !result.dispatched
        ? { notificationWarning: `Notifications not sent (${result.reason})` }
        : {}),
    };
  } catch (err) {
    console.error('[announcement] notification dispatch failed', err?.message || err);
    return {
      ...record,
      notificationRecipients: 0,
      notificationDispatched: false,
      notificationWarning: 'Notification dispatch failed — check server logs',
    };
  }
}

export const upsertOptionSchema = z.object({
  label: z.string().min(1).max(150).trim(),
});

export const masterService = {
  // ─── Legacy MasterItem ─────────────────────────────────────────────────────

  getOptions: async (category, user) => {
    category = resolveMasterCategory(category);
    if (!isValidMasterCategory(category)) {
      throw new AppError('Unknown master category', 404);
    }
    const companyId = requireCompany(user);

    const relationalSlug = resolveRelationalSlug(category);
    if (isRelationalMasterEntity(relationalSlug)) {
      const rows = await masterService.getRelationalOptions(relationalSlug, {}, user);
      return rows.map((row) => ({
        value: row.label,
        label: row.label,
        id: row.value,
        code: row.code,
      }));
    }

    try {
      let items = await masterRepository.findByCategory(companyId, category);
      if (items.length === 0 && MASTER_DEFAULTS[category]?.length && !isMigratedMasterCategory(category)) {
        await masterRepository.seedDefaults(
          companyId,
          category,
          MASTER_DEFAULTS[category],
          user.id,
        );
        items = await masterRepository.findByCategory(companyId, category);
      }
      if (items.length === 0) return defaultsAsOptions(category);
      return items.map((item) => ({ value: item.label, label: item.label, id: item.id }));
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[master] getOptions error:', err.message);
      throw new AppError('Failed to load master options', 500);
    }
  },

  upsertOption: async (category, label, user) => {
    category = resolveMasterCategory(category);
    if (!isValidMasterCategory(category)) {
      throw new AppError('Unknown master category', 404);
    }
    const companyId = requireCompany(user);
    const trimmed = label.trim();

    try {
      const item = await masterRepository.upsertByLabel(companyId, category, trimmed, user.id);
      return { value: item.label, label: item.label, id: item.id };
    } catch (err) {
      if (err instanceof AppError) throw err;
      console.error('[master] upsertOption error:', err.message);
      throw new AppError('Failed to save master option', 500);
    }
  },

  listMasterItems: async (category, query, user) => {
    category = resolveMasterCategory(category);
    if (!isValidMasterCategory(category)) {
      throw new AppError('Unknown master category', 404);
    }
    const companyId = requireCompany(user);
    const { page, limit, skip } = parseMasterPagination(query);
    const status = query.status || 'all';
    return masterRepository.findManyMasterItems(companyId, category, {
      search: query.search,
      status,
      page,
      limit,
      skip,
    });
  },

  updateMasterItem: async (category, id, body, user, req) => {
    category = resolveMasterCategory(category);
    if (!isValidMasterCategory(category)) {
      throw new AppError('Unknown master category', 404);
    }
    const companyId = requireCompany(user);
    const existing = await masterRepository.findMasterItemById(companyId, category, id);
    if (!existing) throw new AppError('Master item not found', 404);

    const parsed = masterItemUpdateSchema.parse(body);
    const dup = await masterRepository.findByLabel(companyId, category, parsed.label);
    if (dup && dup.id !== id) {
      throw new AppError('An item with this label already exists', 409);
    }

    const record = await masterRepository.updateMasterItem(id, {
      label: parsed.label,
      ...(parsed.sortOrder !== undefined ? { sortOrder: parsed.sortOrder } : {}),
      updatedBy: user.id,
    });

    await auditLog({
      userId: user.id,
      action: 'UPDATE',
      entityType: `MasterItem:${category}`,
      entityId: id,
      oldData: existing,
      newData: record,
      req,
    });

    return record;
  },

  updateMasterItemStatus: async (category, id, body, user, req) => {
    category = resolveMasterCategory(category);
    if (!isValidMasterCategory(category)) {
      throw new AppError('Unknown master category', 404);
    }
    const companyId = requireCompany(user);
    const { isActive } = masterStatusSchema.parse(body);
    const existing = await masterRepository.findMasterItemById(companyId, category, id);
    if (!existing) throw new AppError('Master item not found', 404);

    const record = await masterRepository.updateMasterItem(id, {
      isActive,
      updatedBy: user.id,
    });

    await auditLog({
      userId: user.id,
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      entityType: `MasterItem:${category}`,
      entityId: id,
      oldData: { isActive: existing.isActive },
      newData: { isActive: record.isActive },
      req,
    });

    return record;
  },

  removeMasterItem: async (category, id, user, req) => {
    category = resolveMasterCategory(category);
    if (!isValidMasterCategory(category)) {
      throw new AppError('Unknown master category', 404);
    }
    const companyId = requireCompany(user);
    const existing = await masterRepository.findMasterItemById(companyId, category, id);
    if (!existing) throw new AppError('Master item not found', 404);

    await masterRepository.softDeleteMasterItem(id, user.id);
    await auditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: `MasterItem:${category}`,
      entityId: id,
      oldData: existing,
      req,
    });

    return { id, deleted: true };
  },

  seedCompanyDefaults: async (companyId, userId) => {
    let total = 0;
    for (const [category, labels] of Object.entries(MASTER_DEFAULTS)) {
      if (isMigratedMasterCategory(category)) continue;
      total += await masterRepository.seedDefaults(companyId, category, labels, userId);
    }
    return total;
  },

  // ─── Relational engine ─────────────────────────────────────────────────────

  list: async (slug, query, user) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const config = getMasterEntityConfig(slug);
    const companyId = requireCompany(user);
    const { page, limit, skip } = parseMasterPagination(query);
    const orderBy = parseMasterSort(query, config.sortableFields, config.defaultSort || 'sortOrder');

    const result = await masterRepository.findManyRelational(slug, companyId, {
      search: query.search,
      status: query.status,
      page,
      limit,
      skip,
      orderBy,
      query,
    });

    const includeUsage = query.includeUsage !== 'false';
    if (includeUsage && result.data?.length) {
      result.data = await masterRepository.attachUsageCounts(config, companyId, result.data);
    }

    return result;
  },

  getById: async (slug, id, user) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const companyId = requireCompany(user);
    const record = await masterRepository.findByIdRelational(slug, companyId, id);
    if (!record) throw new AppError('Master record not found', 404);
    return record;
  },

  getRecordUsage: async (slug, id, user) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const config = getMasterEntityConfig(slug);
    const companyId = requireCompany(user);
    const record = await masterRepository.findByIdRelational(slug, companyId, id);
    if (!record) throw new AppError('Master record not found', 404);
    const dependencies = await masterRepository.countDependencies(config, record, companyId);
    const total = dependencies.reduce((sum, d) => sum + d.count, 0);
    return { id, dependencies, total, canDelete: total === 0 };
  },

  create: async (slug, body, user, req) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const config = getMasterEntityConfig(slug);
    const companyId = requireCompany(user);
    const parsed = parseMasterCreate(slug, body);
    const data = pickAllowedFields(parsed, config.createFields);

    await validateRelations(config, companyId, data);

    if (slug === 'application-status-master' && data.defaultStatus) {
      await masterRepository.clearDefaultApplicationStatus(companyId, data.countryId);
    }

    if (slug === 'lead-status' && data.defaultStatus) {
      await masterRepository.clearDefaultLeadStatus(companyId);
    }

    if (slug === 'visa-status-master' && data.defaultStatus) {
      await masterRepository.clearDefaultVisaStatus(companyId, data.countryId);
    }

    if (slug === 'student-status-master' && data.defaultStatus) {
      await masterRepository.clearDefaultStudentStatus(companyId);
    }

    // Inherit course.countryId from university when omitted
    if (slug === 'course' && data.universityId && !data.countryId) {
      const univ = await masterRepository.assertRelatedInCompany('university', data.universityId, companyId);
      if (univ?.countryId) data.countryId = univ.countryId;
    }

    if (data.code) {
      const dup = await masterRepository.findByCodeRelational(slug, companyId, data.code);
      if (dup) throw new AppError(`${config.label} code ${data.code} already exists.`, 409);
    }
    await assertUniqueName(slug, config, companyId, data);

    try {
      const record = await masterRepository.createRelational(slug, {
        ...data,
        companyId,
        createdBy: user.id,
        updatedBy: user.id,
      });
      await auditLog({
        userId: user.id,
        action: 'CREATE',
        entityType: `Master:${config.label}`,
        entityId: record.id,
        newData: record,
        req,
      });
      if (slug === 'communication-template') {
        return attachAnnouncementNotificationResult(record, {
          record,
          actorId: user.id,
          companyId,
        });
      }
      return record;
    } catch (err) {
      mapPrismaUniqueError(err, config.label);
    }
  },

  update: async (slug, id, body, user, req) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const config = getMasterEntityConfig(slug);
    const companyId = requireCompany(user);
    const existing = await masterRepository.findByIdRelational(slug, companyId, id);
    if (!existing) throw new AppError('Master record not found', 404);

    const parsed = parseMasterUpdate(slug, body);
    const data = pickAllowedFields(parsed, config.updateFields);

    // Strip immutable if client sent them
    for (const field of config.immutableFields) {
      delete data[field];
    }

    await validateRelations(config, companyId, { ...existing, ...data });

    if (slug === 'application-status-master' && data.defaultStatus) {
      await masterRepository.clearDefaultApplicationStatus(
        companyId,
        data.countryId ?? existing.countryId,
        id,
      );
    }

    if (slug === 'lead-status' && data.defaultStatus) {
      await masterRepository.clearDefaultLeadStatus(companyId, id);
    }

    if (slug === 'visa-status-master' && data.defaultStatus) {
      await masterRepository.clearDefaultVisaStatus(
        companyId,
        data.countryId ?? existing.countryId,
        id,
      );
    }

    if (slug === 'student-status-master' && data.defaultStatus) {
      await masterRepository.clearDefaultStudentStatus(companyId, id);
    }

    if (data.code && data.code !== existing.code) {
      const dup = await masterRepository.findByCodeRelational(slug, companyId, data.code, id);
      if (dup) throw new AppError(`${config.label} code ${data.code} already exists.`, 409);
    }
    await assertUniqueName(slug, config, companyId, { ...existing, ...data }, id);

    try {
      const record = await masterRepository.updateRelational(slug, id, {
        ...data,
        updatedBy: user.id,
      });
      await auditLog({
        userId: user.id,
        action: 'UPDATE',
        entityType: `Master:${config.label}`,
        entityId: id,
        oldData: existing,
        newData: record,
        req,
      });
      if (slug === 'communication-template') {
        return attachAnnouncementNotificationResult(record, {
          existing,
          record,
          actorId: user.id,
          companyId,
        });
      }
      return record;
    } catch (err) {
      mapPrismaUniqueError(err, config.label);
    }
  },

  updateStatus: async (slug, id, body, user, req) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const config = getMasterEntityConfig(slug);
    const companyId = requireCompany(user);
    const { isActive } = masterStatusSchema.parse(body);

    const existing = await masterRepository.findByIdRelational(slug, companyId, id);
    if (!existing) throw new AppError('Master record not found', 404);

    const record = await masterRepository.updateRelational(slug, id, {
      isActive,
      updatedBy: user.id,
    });

    await auditLog({
      userId: user.id,
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      entityType: `Master:${config.label}`,
      entityId: id,
      oldData: { isActive: existing.isActive },
      newData: { isActive: record.isActive },
      req,
    });

    if (slug === 'communication-template') {
      return attachAnnouncementNotificationResult(record, {
        existing,
        record,
        actorId: user.id,
        companyId,
      });
    }

    return record;
  },

  remove: async (slug, id, user, req) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const config = getMasterEntityConfig(slug);
    const companyId = requireCompany(user);

    const existing = await masterRepository.findByIdRelational(slug, companyId, id);
    if (!existing) throw new AppError('Master record not found', 404);

    const deps = await masterRepository.countDependencies(config, existing, companyId);
    if (deps.length) {
      throw new AppError(formatDependencyMessage(config.label, deps), 409, { dependencies: deps });
    }

    await masterRepository.softDeleteRelational(slug, id, user.id);
    await auditLog({
      userId: user.id,
      action: 'DELETE',
      entityType: `Master:${config.label}`,
      entityId: id,
      oldData: existing,
      req,
    });

    return { id, deleted: true };
  },

  getRelationalOptions: async (slug, query, user) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const config = getMasterEntityConfig(slug);
    const companyId = requireCompany(user);

    // Validate parent filter IDs belong to same company
    const filters = {};
    for (const field of config.filterFields || []) {
      if (field === 'isActive' || field === 'isMandatory' || field === 'level' || field === 'channel' || field === 'showOnMain' || field === 'applicableFor') {
        if (query[field] !== undefined && query[field] !== '') filters[field] = query[field];
        continue;
      }
      if (query[field]) {
        const rel = (config.relations || []).find((r) => r.field === field);
        if (rel) {
          const parent = await masterRepository.assertRelatedInCompany(rel.prismaModel, query[field], companyId);
          if (!parent) throw new AppError(`Invalid ${rel.label || field} for options filter`, 422);
        }
        filters[field] = query[field];
      }
    }

    const rows = await masterRepository.findOptionsRelational(slug, companyId, {
      ...filters,
      search: query.search,
      limit: query.limit,
    });
    const valueField = config.optionValueField || 'id';
    const labelField = config.optionLabelField || 'name';

    return rows.map((row) => {
      let label = row[labelField];
      if (slug === 'course' && row.university?.name && row.name) {
        label = `${row.name} · ${row.university.name}`;
      }
      return {
        value: row[valueField],
        label,
        code: row.code,
        name: row.name,
        ...(row.university?.name ? { universityName: row.university.name } : {}),
        ...(row.isoCode != null && row.isoCode !== '' ? { isoCode: String(row.isoCode).toUpperCase() } : {}),
        ...(row.phoneCode != null && row.phoneCode !== '' ? { phoneCode: row.phoneCode } : {}),
        ...(row.taxPercentage != null ? { taxPercentage: Number(row.taxPercentage) } : {}),
      };
    });
  },

  hubSummary: async (user) => {
    const companyId = requireCompany(user);
    return masterRepository.hubSummary(companyId);
  },

  applicationStatusCountrySummary: async (user) => {
    const companyId = requireCompany(user);
    return masterRepository.applicationStatusCountrySummary(companyId);
  },

  applicationStatusWorkflow: async (user, countryId) => {
    if (!countryId) throw new AppError('countryId is required', 422);
    const companyId = requireCompany(user);
    const country = await masterRepository.assertRelatedInCompany('country', countryId, companyId);
    if (!country) throw new AppError('Country not found in your company', 422);
    const rows = await masterRepository.findApplicationStatusWorkflow(companyId, countryId);
    return rows.map((row) => ({
      value: row.id,
      label: row.name,
      mailSend: row.mailSend,
      defaultStatus: row.defaultStatus,
      setOfferLetter: row.setOfferLetter,
      position: row.position,
    }));
  },

  bulkCreateApplicationChecklist: async (body, user, req) => {
    const companyId = requireCompany(user);
    const parsed = bulkChecklistSchema.parse(body);
    const config = getMasterEntityConfig('application-checklist');

    await validateRelations(config, companyId, { countryId: parsed.countryId });

    const created = [];
    for (let i = 0; i < parsed.items.length; i += 1) {
      const item = parsed.items[i];
      const rowData = parseMasterCreate('application-checklist', {
        countryId: parsed.countryId,
        documentType: item.documentType,
        name: item.name,
        enquiryForm: item.enquiryForm ?? false,
        isMandatory: item.isMandatory ?? true,
        sortOrder: item.sortOrder ?? i + 1,
      });
      const record = await masterRepository.createRelational('application-checklist', {
        ...pickAllowedFields(rowData, config.createFields),
        companyId,
        createdBy: user.id,
        updatedBy: user.id,
      });
      created.push(record);
    }

    await auditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Master:Application Checklist (bulk)',
      entityId: parsed.countryId,
      newData: { count: created.length },
      req,
    });

    return created;
  },

  getApplicationChecklistByCountry: async (user, countryId) => {
    if (!countryId) throw new AppError('countryId is required', 422);
    const companyId = requireCompany(user);
    const country = await masterRepository.assertRelatedInCompany('country', countryId, companyId);
    if (!country) throw new AppError('Country not found in your company', 422);
    return masterRepository.findApplicationChecklistByCountry(companyId, countryId);
  },

  leadStatusWorkflow: async (user) => {
    const companyId = requireCompany(user);
    const rows = await masterRepository.findLeadStatusWorkflow(companyId);
    return rows.map((row) => ({
      value: row.code,
      label: row.name,
      defaultStatus: row.defaultStatus,
      colorCode: row.colorCode,
      position: row.sortOrder,
    }));
  },

  visaStatusCountrySummary: async (user) => {
    const companyId = requireCompany(user);
    return masterRepository.visaStatusCountrySummary(companyId);
  },

  visaStatusWorkflow: async (user, countryId) => {
    if (!countryId) throw new AppError('countryId is required', 422);
    const companyId = requireCompany(user);
    const country = await masterRepository.assertRelatedInCompany('country', countryId, companyId);
    if (!country) throw new AppError('Country not found in your company', 422);
    const rows = await masterRepository.findVisaStatusWorkflow(companyId, countryId);
    return rows.map((row) => ({
      value: row.id,
      label: row.name,
      visaApproved: row.visaApproved,
      visaWithdraw: row.visaWithdraw,
      visaRejected: row.visaRejected,
      mailSend: row.mailSend,
      defaultStatus: row.defaultStatus,
      position: row.position,
      colorCode: row.colorCode,
    }));
  },

  getVisaChecklistByCountry: async (user, countryId) => {
    if (!countryId) throw new AppError('countryId is required', 422);
    const companyId = requireCompany(user);
    const country = await masterRepository.assertRelatedInCompany('country', countryId, companyId);
    if (!country) throw new AppError('Country not found in your company', 422);
    return masterRepository.findVisaChecklistByCountry(companyId, countryId);
  },

  bulkCreateVisaChecklist: async (body, user, req) => {
    const companyId = requireCompany(user);
    const parsed = bulkVisaChecklistSchema.parse(body);
    const config = getMasterEntityConfig('visa-checklist');
    await validateRelations(config, companyId, { countryId: parsed.countryId });

    const created = [];
    for (let i = 0; i < parsed.items.length; i += 1) {
      const item = parsed.items[i];
      const rowData = parseMasterCreate('visa-checklist', {
        countryId: parsed.countryId,
        documentTypeId: item.documentTypeId,
        documentType: item.documentType,
        name: item.name,
        isMandatory: item.isMandatory ?? true,
        sortOrder: item.sortOrder ?? i + 1,
      });
      const record = await masterRepository.createRelational('visa-checklist', {
        ...pickAllowedFields(rowData, config.createFields),
        companyId,
        createdBy: user.id,
        updatedBy: user.id,
      });
      created.push(record);
    }

    await auditLog({
      userId: user.id,
      action: 'CREATE',
      entityType: 'Master:Visa Checklist (bulk)',
      entityId: parsed.countryId,
      newData: { count: created.length },
      req,
    });

    return created;
  },

  bulkUpdateStatus: async (slug, body, user, req) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const config = getMasterEntityConfig(slug);
    const companyId = requireCompany(user);
    const { ids, isActive } = masterBulkStatusSchema.parse(body);
    const records = await masterRepository.findManyByIdsRelational(slug, companyId, ids);
    const foundIds = new Set(records.map((row) => row.id));
    const missing = ids.filter((id) => !foundIds.has(id));
    if (missing.length) {
      throw new AppError('One or more records were not found in your company', 404);
    }

    const updated = [];
    for (const row of records) {
      const record = await masterRepository.updateRelational(slug, row.id, {
        isActive,
        updatedBy: user.id,
      });
      updated.push(record);
    }

    await auditLog({
      userId: user.id,
      action: isActive ? 'ACTIVATE' : 'DEACTIVATE',
      entityType: `Master:${config.label} (bulk)`,
      entityId: companyId,
      newData: { count: updated.length, isActive },
      req,
    });

    return { updated: updated.length, isActive };
  },

  bulkRemove: async (slug, body, user, req) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const config = getMasterEntityConfig(slug);
    const companyId = requireCompany(user);
    const { ids } = masterBulkDeleteSchema.parse(body);
    const records = await masterRepository.findManyByIdsRelational(slug, companyId, ids);
    const foundIds = new Set(records.map((row) => row.id));
    const missing = ids.filter((id) => !foundIds.has(id));

    const deleted = [];
    const blocked = [];
    for (const row of records) {
      const deps = await masterRepository.countDependencies(config, row, companyId);
      if (deps.length) {
        blocked.push({
          id: row.id,
          name: row.name || row.code || row.id,
          reason: formatDependencyMessage(config.label, deps),
          dependencies: deps,
        });
        continue;
      }
      await masterRepository.softDeleteRelational(slug, row.id, user.id);
      deleted.push({ id: row.id, name: row.name || row.code || row.id });
    }

    if (deleted.length) {
      await auditLog({
        userId: user.id,
        action: 'DELETE',
        entityType: `Master:${config.label} (bulk)`,
        entityId: companyId,
        newData: { deleted: deleted.length, blocked: blocked.length },
        req,
      });
    }

    return {
      deleted: deleted.length,
      blocked,
      missing,
    };
  },

  exportList: async (slug, query, user) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const config = getMasterEntityConfig(slug);
    const companyId = requireCompany(user);
    const orderBy = parseMasterSort(query, config.sortableFields, config.defaultSort || 'sortOrder');
    const result = await masterRepository.findManyRelational(slug, companyId, {
      search: query.search,
      status: query.status,
      page: 1,
      limit: 5000,
      skip: 0,
      orderBy,
      query,
    });
    return {
      entity: slug,
      label: config.label,
      rows: result.data,
      total: result.pagination?.total ?? result.data.length,
    };
  },

  studentStatusWorkflow: async (user) => {
    const companyId = requireCompany(user);
    const rows = await masterRepository.findStudentStatusWorkflow(companyId);
    return rows.map((row) => ({
      value: row.code,
      label: row.name,
      defaultStatus: row.defaultStatus,
      colorCode: row.colorCode,
      position: row.sortOrder,
    }));
  },
};
