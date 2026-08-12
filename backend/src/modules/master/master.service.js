/**
 * Master service — legacy MasterItem + relational engine business logic.
 */
import { z } from 'zod';
import { AppError } from '../../utils/response.util.js';
import { isValidMasterCategory, MASTER_DEFAULTS } from '../../config/master-defaults.config.js';
import { auditLog } from '../../middleware/audit.middleware.js';
import { masterRepository } from './master.repository.js';
import { getMasterEntityConfig, isRelationalMasterEntity } from './master.registry.js';
import {
  parseMasterCreate,
  parseMasterUpdate,
  parseMasterPagination,
  parseMasterSort,
  masterStatusSchema,
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
    throw new AppError(`${label} with this code already exists`, 409);
  }
  throw err;
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

export const upsertOptionSchema = z.object({
  label: z.string().min(1).max(150).trim(),
});

export const masterService = {
  // ─── Legacy MasterItem ─────────────────────────────────────────────────────

  getOptions: async (category, user) => {
    if (!isValidMasterCategory(category)) {
      throw new AppError('Unknown master category', 404);
    }
    const companyId = requireCompany(user);

    try {
      let items = await masterRepository.findByCategory(companyId, category);
      if (items.length === 0 && MASTER_DEFAULTS[category]?.length) {
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
      console.error('[master] getOptions fallback:', err.message);
      return defaultsAsOptions(category);
    }
  },

  upsertOption: async (category, label, user) => {
    if (!isValidMasterCategory(category)) {
      throw new AppError('Unknown master category', 404);
    }
    const companyId = requireCompany(user);
    const trimmed = label.trim();

    try {
      const item = await masterRepository.upsertByLabel(companyId, category, trimmed, user.id);
      return { value: item.label, label: item.label, id: item.id };
    } catch (err) {
      console.error('[master] upsertOption fallback:', err.message);
      return { value: trimmed, label: trimmed };
    }
  },

  seedCompanyDefaults: async (companyId, userId) => {
    let total = 0;
    for (const [category, labels] of Object.entries(MASTER_DEFAULTS)) {
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
    const orderBy = parseMasterSort(query, config.sortableFields);

    return masterRepository.findManyRelational(slug, companyId, {
      search: query.search,
      status: query.status,
      page,
      limit,
      skip,
      orderBy,
      query,
    });
  },

  getById: async (slug, id, user) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const companyId = requireCompany(user);
    const record = await masterRepository.findByIdRelational(slug, companyId, id);
    if (!record) throw new AppError('Master record not found', 404);
    return record;
  },

  create: async (slug, body, user, req) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const config = getMasterEntityConfig(slug);
    const companyId = requireCompany(user);
    const parsed = parseMasterCreate(slug, body);
    const data = pickAllowedFields(parsed, config.createFields);

    await validateRelations(config, companyId, data);

    // Inherit course.countryId from university when omitted
    if (slug === 'course' && data.universityId && !data.countryId) {
      const univ = await masterRepository.assertRelatedInCompany('university', data.universityId, companyId);
      if (univ?.countryId) data.countryId = univ.countryId;
    }

    if (data.code) {
      const dup = await masterRepository.findByCodeRelational(slug, companyId, data.code);
      if (dup) throw new AppError(`${config.label} with this code already exists`, 409);
    }

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

    if (data.code && data.code !== existing.code) {
      const dup = await masterRepository.findByCodeRelational(slug, companyId, data.code, id);
      if (dup) throw new AppError(`${config.label} with this code already exists`, 409);
    }

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

    return record;
  },

  remove: async (slug, id, user, req) => {
    if (!isRelationalMasterEntity(slug)) throw new AppError('Unknown master entity', 404);
    const config = getMasterEntityConfig(slug);
    const companyId = requireCompany(user);

    const existing = await masterRepository.findByIdRelational(slug, companyId, id);
    if (!existing) throw new AppError('Master record not found', 404);

    const deps = await masterRepository.countDependencies(config, id, companyId);
    if (deps.length) {
      throw new AppError(formatDependencyMessage(config.label, deps), 409);
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
      if (field === 'isActive' || field === 'isMandatory' || field === 'level' || field === 'channel') {
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

    const rows = await masterRepository.findOptionsRelational(slug, companyId, filters);
    const valueField = config.optionValueField || 'id';
    const labelField = config.optionLabelField || 'name';

    return rows.map((row) => ({
      value: row[valueField],
      label: row[labelField],
      code: row.code,
    }));
  },

  hubSummary: async (user) => {
    const companyId = requireCompany(user);
    return masterRepository.hubSummary(companyId);
  },
};
