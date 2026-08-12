import prisma from '../../config/database.js';
import { FEATURE_REGISTRY } from '../../config/feature-registry.config.js';

export const featureRepository = {
  upsertCatalog: async () => {
    for (const def of FEATURE_REGISTRY) {
      await prisma.featureFlag.upsert({
        where: { key: def.key },
        update: {
          module: def.module,
          name: def.name,
          description: def.description || null,
          defaultEnabled: def.defaultEnabled,
          dependsOn: def.dependsOn || [],
          sortOrder: def.sortOrder ?? 0,
          isActive: true,
        },
        create: {
          key: def.key,
          module: def.module,
          name: def.name,
          description: def.description || null,
          defaultEnabled: def.defaultEnabled,
          dependsOn: def.dependsOn || [],
          sortOrder: def.sortOrder ?? 0,
        },
      });
    }
  },

  listCatalog: () => prisma.featureFlag.findMany({
    where: { isActive: true },
    orderBy: [{ module: 'asc' }, { sortOrder: 'asc' }],
  }),

  getOverridesForCompany: (companyId) => prisma.tenantFeatureOverride.findMany({
    where: { companyId },
  }),

  upsertOverride: (companyId, featureKey, enabled, userId) => prisma.tenantFeatureOverride.upsert({
    where: { companyId_featureKey: { companyId, featureKey } },
    create: { companyId, featureKey, enabled, updatedBy: userId },
    update: { enabled, updatedBy: userId },
  }),

  seedCompanyDefaults: async (companyId, userId = null) => {
    for (const def of FEATURE_REGISTRY) {
      await prisma.tenantFeatureOverride.upsert({
        where: { companyId_featureKey: { companyId, featureKey: def.key } },
        create: {
          companyId,
          featureKey: def.key,
          enabled: def.defaultEnabled,
          updatedBy: userId,
        },
        update: {},
      });
    }
  },
};
