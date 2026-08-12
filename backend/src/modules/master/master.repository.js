/**
 * Master repository — MasterItem (legacy) + registry-driven relational access.
 * No business delete rules here — only data access + dependency counts.
 */
import prisma from '../../config/database.js';
import { softDeleteWhere, buildPagination } from '../../utils/response.util.js';
import { getMasterEntityConfig } from './master.registry.js';
import { AppError } from '../../utils/response.util.js';

function getDelegate(prismaModel) {
  const delegate = prisma[prismaModel];
  if (!delegate) {
    throw new AppError(`Prisma model not available: ${prismaModel}`, 500);
  }
  return delegate;
}

function resolveConfig(slug) {
  const config = getMasterEntityConfig(slug);
  if (!config) throw new AppError('Unknown master entity', 404);
  return config;
}

function buildSearchOr(search, fields) {
  if (!search || !String(search).trim()) return {};
  const q = String(search).trim();
  return {
    OR: fields.map((field) => ({
      [field]: { contains: q },
    })),
  };
}

function buildStatusFilter(status) {
  if (!status || status === 'all') return {};
  const s = String(status).toLowerCase();
  if (s === 'active' || s === 'true' || s === '1') return { isActive: true };
  if (s === 'inactive' || s === 'false' || s === '0') return { isActive: false };
  return {};
}

function buildEntityFilters(query, filterFields) {
  const where = {};
  for (const field of filterFields) {
    if (field === 'isActive') continue; // handled via status
    if (query[field] === undefined || query[field] === null || query[field] === '') continue;
    if (field === 'isMandatory') {
      const v = String(query[field]).toLowerCase();
      where.isMandatory = v === 'true' || v === '1';
      continue;
    }
    where[field] = query[field];
  }
  return where;
}

// ─── Legacy MasterItem ───────────────────────────────────────────────────────

export const masterRepository = {
  findByCategory: (companyId, category) =>
    prisma.masterItem.findMany({
      where: {
        companyId,
        category,
        ...softDeleteWhere,
        isActive: true,
      },
      orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
    }),

  findByLabel: (companyId, category, label) =>
    prisma.masterItem.findFirst({
      where: {
        companyId,
        category,
        label,
        ...softDeleteWhere,
      },
    }),

  create: (data) => prisma.masterItem.create({ data }),

  upsertByLabel: async (companyId, category, label, userId) => {
    const existing = await masterRepository.findByLabel(companyId, category, label);
    if (existing) {
      if (!existing.isActive) {
        return prisma.masterItem.update({
          where: { id: existing.id },
          data: { isActive: true, updatedBy: userId },
        });
      }
      return existing;
    }

    const count = await prisma.masterItem.count({
      where: { companyId, category, ...softDeleteWhere },
    });

    return masterRepository.create({
      companyId,
      category,
      label,
      sortOrder: count + 1,
      createdBy: userId,
      updatedBy: userId,
    });
  },

  seedDefaults: async (companyId, category, labels, userId) => {
    let created = 0;
    for (let i = 0; i < labels.length; i += 1) {
      const label = labels[i];
      const exists = await masterRepository.findByLabel(companyId, category, label);
      if (!exists) {
        await masterRepository.create({
          companyId,
          category,
          label,
          sortOrder: i + 1,
          createdBy: userId,
          updatedBy: userId,
        });
        created += 1;
      }
    }
    return created;
  },

  // ─── Relational masters ────────────────────────────────────────────────────

  getDelegate,

  findManyRelational: async (slug, companyId, { search, status, page, limit, skip, orderBy, query }) => {
    const config = resolveConfig(slug);
    const delegate = getDelegate(config.prismaModel);

    const where = {
      companyId,
      ...(config.softDelete ? softDeleteWhere : {}),
      ...buildStatusFilter(status),
      ...buildEntityFilters(query || {}, config.filterFields || []),
      ...buildSearchOr(search, config.searchableFields || ['name', 'code']),
    };

    const [data, total] = await Promise.all([
      delegate.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        ...(config.listInclude ? { include: config.listInclude } : {}),
        ...(config.listSelect ? { select: config.listSelect } : {}),
      }),
      delegate.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  findByIdRelational: async (slug, companyId, id) => {
    const config = resolveConfig(slug);
    const delegate = getDelegate(config.prismaModel);
    return delegate.findFirst({
      where: {
        id,
        companyId,
        ...(config.softDelete ? softDeleteWhere : {}),
      },
      ...(config.detailInclude ? { include: config.detailInclude } : {}),
    });
  },

  findByCodeRelational: async (slug, companyId, code, excludeId = null) => {
    const config = resolveConfig(slug);
    const delegate = getDelegate(config.prismaModel);
    return delegate.findFirst({
      where: {
        companyId,
        code,
        ...(config.softDelete ? softDeleteWhere : {}),
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
  },

  createRelational: async (slug, data) => {
    const config = resolveConfig(slug);
    const delegate = getDelegate(config.prismaModel);
    return delegate.create({
      data,
      ...(config.detailInclude ? { include: config.detailInclude } : {}),
    });
  },

  updateRelational: async (slug, id, data) => {
    const config = resolveConfig(slug);
    const delegate = getDelegate(config.prismaModel);
    return delegate.update({
      where: { id },
      data,
      ...(config.detailInclude ? { include: config.detailInclude } : {}),
    });
  },

  softDeleteRelational: async (slug, id, userId) => {
    const config = resolveConfig(slug);
    const delegate = getDelegate(config.prismaModel);
    return delegate.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        isActive: false,
        updatedBy: userId,
      },
    });
  },

  findOptionsRelational: async (slug, companyId, filters = {}) => {
    const config = resolveConfig(slug);
    const delegate = getDelegate(config.prismaModel);
    const allowedFilterKeys = config.filterFields || [];
    const whereExtra = {};
    for (const key of allowedFilterKeys) {
      if (key === 'isActive') continue;
      if (filters[key] !== undefined && filters[key] !== null && filters[key] !== '') {
        whereExtra[key] = filters[key];
      }
    }

    return delegate.findMany({
      where: {
        companyId,
        isActive: true,
        ...(config.softDelete ? softDeleteWhere : {}),
        ...whereExtra,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: {
        id: true,
        code: true,
        name: true,
        sortOrder: true,
      },
    });
  },

  /**
   * Verify a related record exists in the same company.
   * Branch/Company are special (not all have softDelete the same way for company).
   */
  assertRelatedInCompany: async (prismaModel, relatedId, companyId) => {
    if (!relatedId) return null;
    const delegate = getDelegate(prismaModel);

    if (prismaModel === 'company') {
      return delegate.findFirst({ where: { id: relatedId, deletedAt: null } });
    }

    if (prismaModel === 'branch') {
      return delegate.findFirst({
        where: { id: relatedId, companyId, deletedAt: null },
      });
    }

    return delegate.findFirst({
      where: {
        id: relatedId,
        companyId,
        deletedAt: null,
      },
    });
  },

  countDependencies: async (config, recordId, companyId) => {
    const results = [];
    for (const dep of config.dependencies || []) {
      const delegate = getDelegate(dep.prismaModel);
      const where = {
        [dep.foreignKey]: recordId,
        deletedAt: null,
      };

      if (dep.prismaModel === 'company') {
        // Only care if the current tenant company references this master
        where.id = companyId;
      } else {
        where.companyId = companyId;
      }

      const count = await delegate.count({ where });
      if (count > 0) {
        results.push({ label: dep.label, count });
      }
    }
    return results;
  },

  hubSummary: async (companyId) => {
    const { RELATIONAL_MASTER_SLUGS, MASTER_ENTITY_REGISTRY } = await import('./master.registry.js');
    const summary = {};

    await Promise.all(
      RELATIONAL_MASTER_SLUGS.map(async (slug) => {
        const config = MASTER_ENTITY_REGISTRY[slug];
        const delegate = getDelegate(config.prismaModel);
        const baseWhere = { companyId, ...(config.softDelete ? softDeleteWhere : {}) };
        const [total, active] = await Promise.all([
          delegate.count({ where: baseWhere }),
          delegate.count({ where: { ...baseWhere, isActive: true } }),
        ]);
        summary[slug] = {
          total,
          active,
          inactive: total - active,
        };
      }),
    );

    return summary;
  },
};
