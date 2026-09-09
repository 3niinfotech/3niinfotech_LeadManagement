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

  findManyMasterItems: async (companyId, category, { search, status, page, limit, skip }) => {
    const where = {
      companyId,
      category,
      ...softDeleteWhere,
      ...(search?.trim() && { label: { contains: search.trim() } }),
      ...(status === 'active' && { isActive: true }),
      ...(status === 'inactive' && { isActive: false }),
    };

    const [data, total] = await Promise.all([
      prisma.masterItem.findMany({
        where,
        skip,
        take: limit,
        orderBy: [{ sortOrder: 'asc' }, { label: 'asc' }],
      }),
      prisma.masterItem.count({ where }),
    ]);

    return { data, pagination: buildPagination(page, limit, total) };
  },

  findMasterItemById: (companyId, category, id) =>
    prisma.masterItem.findFirst({
      where: { id, companyId, category, ...softDeleteWhere },
    }),

  updateMasterItem: (id, data) =>
    prisma.masterItem.update({ where: { id }, data }),

  softDeleteMasterItem: (id, userId) =>
    prisma.masterItem.update({
      where: { id },
      data: { deletedAt: new Date(), isActive: false, updatedBy: userId },
    }),

  clearDefaultApplicationStatus: (companyId, countryId, excludeId = null) =>
    prisma.applicationStatusMaster.updateMany({
      where: {
        companyId,
        countryId,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { defaultStatus: false },
    }),

  clearDefaultLeadStatus: (companyId, excludeId = null) =>
    prisma.crmLeadStatus.updateMany({
      where: {
        companyId,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { defaultStatus: false },
    }),

  findDefaultLeadStatus: (companyId) =>
    prisma.crmLeadStatus.findFirst({
      where: {
        companyId,
        defaultStatus: true,
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),

  findLeadStatusWorkflow: (companyId) =>
    prisma.crmLeadStatus.findMany({
      where: {
        companyId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),

  findDefaultApplicationStatus: (companyId, countryId) =>
    prisma.applicationStatusMaster.findFirst({
      where: {
        companyId,
        countryId,
        defaultStatus: true,
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    }),

  findApplicationStatusById: (companyId, id) =>
    prisma.applicationStatusMaster.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { country: { select: { id: true, code: true, name: true } } },
    }),

  findApplicationStatusWorkflow: (companyId, countryId) =>
    prisma.applicationStatusMaster.findMany({
      where: {
        companyId,
        countryId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    }),

  findApplicationChecklistByCountry: (companyId, countryId) =>
    prisma.applicationChecklist.findMany({
      where: {
        companyId,
        countryId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),

  clearDefaultVisaStatus: (companyId, countryId, excludeId = null) =>
    prisma.visaStatusMaster.updateMany({
      where: {
        companyId,
        countryId,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { defaultStatus: false },
    }),

  findDefaultVisaStatus: (companyId, countryId) =>
    prisma.visaStatusMaster.findFirst({
      where: {
        companyId,
        countryId,
        defaultStatus: true,
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    }),

  findVisaStatusById: (companyId, id) =>
    prisma.visaStatusMaster.findFirst({
      where: { id, companyId, deletedAt: null },
      include: { country: { select: { id: true, code: true, name: true } } },
    }),

  findVisaStatusWorkflow: (companyId, countryId) =>
    prisma.visaStatusMaster.findMany({
      where: {
        companyId,
        countryId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ position: 'asc' }, { name: 'asc' }],
    }),

  findVisaChecklistByCountry: (companyId, countryId) =>
    prisma.visaChecklist.findMany({
      where: {
        companyId,
        countryId,
        isActive: true,
        deletedAt: null,
      },
      include: {
        documentTypeRel: { select: { id: true, code: true, name: true } },
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),

  clearDefaultStudentStatus: (companyId, excludeId = null) =>
    prisma.studentStatusMaster.updateMany({
      where: {
        companyId,
        deletedAt: null,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
      data: { defaultStatus: false },
    }),

  findDefaultStudentStatus: (companyId) =>
    prisma.studentStatusMaster.findFirst({
      where: {
        companyId,
        defaultStatus: true,
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),

  findStudentStatusWorkflow: (companyId) =>
    prisma.studentStatusMaster.findMany({
      where: {
        companyId,
        isActive: true,
        deletedAt: null,
      },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
    }),

  visaStatusCountrySummary: async (companyId) => {
    const [countries, statuses] = await Promise.all([
      prisma.country.findMany({
        where: { companyId, deletedAt: null, isActive: true },
        select: { id: true, code: true, name: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.visaStatusMaster.findMany({
        where: { companyId, deletedAt: null, countryId: { not: null } },
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const byCountry = new Map();
    for (const s of statuses) {
      if (!s.countryId) continue;
      if (!byCountry.has(s.countryId)) byCountry.set(s.countryId, []);
      byCountry.get(s.countryId).push(s);
    }

    return countries.map((c) => ({
      countryId: c.id,
      countryName: c.name,
      countryCode: c.code,
      statusCount: byCountry.get(c.id)?.length || 0,
      statuses: byCountry.get(c.id) || [],
    }));
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

  findManyByIdsRelational: async (slug, companyId, ids = []) => {
    const config = resolveConfig(slug);
    const delegate = getDelegate(config.prismaModel);
    if (!ids.length) return [];
    return delegate.findMany({
      where: {
        id: { in: ids },
        companyId,
        ...(config.softDelete ? softDeleteWhere : {}),
      },
    });
  },

  findByCodeRelational: async (slug, companyId, code, excludeId = null) => {
    const config = resolveConfig(slug);
    if (!(config.createFields || []).includes('code')) return null;
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

  findDuplicateName: async (slug, companyId, payload, excludeId = null) => {
    const config = resolveConfig(slug);
    if (!config.uniqueName || !payload?.name) return null;
    const delegate = getDelegate(config.prismaModel);
    const where = {
      companyId,
      name: payload.name,
      ...(config.softDelete ? softDeleteWhere : {}),
      ...(excludeId ? { id: { not: excludeId } } : {}),
    };
    for (const field of config.uniqueNameScope || []) {
      if (payload[field] === undefined) continue;
      where[field] = payload[field];
    }
    return delegate.findFirst({ where });
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

    const search = String(filters.search || '').trim();
    const searchWhere = search && (config.searchableFields || []).length
      ? {
          OR: config.searchableFields.map((field) => ({
            [field]: { contains: search },
          })),
        }
      : {};

    const parsedLimit = Number.parseInt(filters.limit, 10);
    const take = Number.isFinite(parsedLimit)
      ? Math.min(Math.max(parsedLimit, 1), 100)
      : (['course', 'university'].includes(slug) ? 40 : 80);

    const hasCode = (config.createFields || []).includes('code');
    const sortField = config.defaultSort
      || ((config.createFields || []).includes('sortOrder') ? 'sortOrder' : 'name');
    const orderBy = sortField === 'name'
      ? [{ name: 'asc' }]
      : [{ [sortField]: 'asc' }, { name: 'asc' }];

    const select = {
      id: true,
      name: true,
    };
    if (hasCode) select.code = true;
    if (slug === 'course') {
      select.university = { select: { name: true } };
    }
    if ((config.createFields || []).includes('sortOrder')) select.sortOrder = true;
    if ((config.createFields || []).includes('position')) select.position = true;
    if ((config.createFields || []).includes('colorCode')) select.colorCode = true;
    if ((config.createFields || []).includes('phoneCode')) select.phoneCode = true;
    if ((config.createFields || []).includes('isoCode')) select.isoCode = true;
    if ((config.createFields || []).includes('taxPercentage')) select.taxPercentage = true;

    return delegate.findMany({
      where: {
        companyId,
        isActive: true,
        ...(config.softDelete ? softDeleteWhere : {}),
        ...whereExtra,
        ...searchWhere,
      },
      orderBy,
      take,
      select,
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

  countDependencies: async (config, record, companyId) => {
    const recordId = typeof record === 'string' ? record : record?.id;
    const results = [];
    for (const dep of config.dependencies || []) {
      const delegate = getDelegate(dep.prismaModel);
      const where = {
        [dep.foreignKey]: recordId,
        deletedAt: null,
      };

      if (dep.prismaModel === 'company') {
        where.id = companyId;
      } else {
        where.companyId = companyId;
      }

      const count = await delegate.count({ where });
      if (count > 0) {
        results.push({ label: dep.label, count });
      }
    }

    const values = [record?.name, record?.code].filter(Boolean);
    if (values.length && (config.usage || []).length) {
      for (const usage of config.usage) {
        const where = {
          deletedAt: null,
          [usage.field]: { in: values },
        };
        if (usage.via === 'branch') {
          where.branch = { companyId };
        } else if (usage.via === 'student.branch') {
          where.student = { branch: { companyId }, deletedAt: null };
        }
        try {
          const count = await prisma[usage.model].count({ where });
          if (count > 0) results.push({ label: usage.label, count });
        } catch {
          // Skip usage counts if the operational model/field is unavailable.
        }
      }
    }

    if (recordId && (config.jsonUsage || []).length) {
      for (const usage of config.jsonUsage) {
        const where = {
          deletedAt: null,
          metadata: {
            path: usage.jsonPath,
            equals: recordId,
          },
        };
        if (usage.via === 'student.branch') {
          where.student = { branch: { companyId }, deletedAt: null };
        }
        try {
          const count = await prisma[usage.model].count({ where });
          if (count > 0) results.push({ label: usage.label, count });
        } catch {
          // Skip JSON usage counts if unavailable for this database/provider.
        }
      }
    }
    return results;
  },

  /** Attach per-record usage totals for list grids (admin masters). */
  attachUsageCounts: async (config, companyId, rows = []) => {
    if (!rows.length) return rows;
    if (!(config.dependencies?.length || config.usage?.length || config.jsonUsage?.length)) {
      return rows;
    }
    return Promise.all(rows.map(async (row) => {
      const dependencies = await masterRepository.countDependencies(config, row, companyId);
      const usageCount = dependencies.reduce((sum, dep) => sum + dep.count, 0);
      return { ...row, usageCount, usageDetails: dependencies };
    }));
  },

  applicationStatusCountrySummary: async (companyId) => {
    const [countries, statuses] = await Promise.all([
      prisma.country.findMany({
        where: { companyId, deletedAt: null, isActive: true },
        select: { id: true, code: true, name: true },
        orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      }),
      prisma.applicationStatusMaster.findMany({
        where: { companyId, deletedAt: null, countryId: { not: null } },
        orderBy: [{ position: 'asc' }, { name: 'asc' }],
      }),
    ]);

    const byCountry = new Map();
    for (const s of statuses) {
      if (!s.countryId) continue;
      if (!byCountry.has(s.countryId)) byCountry.set(s.countryId, []);
      byCountry.get(s.countryId).push(s);
    }

    return countries.map((c) => ({
      countryId: c.id,
      countryName: c.name,
      countryCode: c.code,
      statusCount: byCountry.get(c.id)?.length || 0,
      statuses: byCountry.get(c.id) || [],
    }));
  },

  hubSummary: async (companyId) => {
    const { RELATIONAL_MASTER_SLUGS, MASTER_ENTITY_REGISTRY } = await import('./master.registry.js');
    const summary = {};

    await Promise.all(
      RELATIONAL_MASTER_SLUGS.map(async (slug) => {
        try {
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
        } catch {
          // Table may not exist until db push (e.g. learning_resources)
          summary[slug] = null;
        }
      }),
    );

    return summary;
  },
};
