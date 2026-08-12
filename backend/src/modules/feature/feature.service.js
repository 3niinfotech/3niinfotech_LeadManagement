import { auditLog } from '../../middleware/audit.middleware.js';
import { FEATURE_REGISTRY } from '../../config/feature-registry.config.js';
import { featureRepository } from './feature.repository.js';

function buildCatalogMap(catalog) {
  return Object.fromEntries(catalog.map((f) => [f.key, f]));
}

/** Resolve effective flags with dependency cascade */
function resolveEffective(catalog, overrides) {
  const overrideMap = Object.fromEntries(overrides.map((o) => [o.featureKey, o.enabled]));
  const catalogMap = buildCatalogMap(catalog);
  const raw = {};

  for (const flag of catalog) {
    raw[flag.key] = overrideMap[flag.key] ?? flag.defaultEnabled;
  }

  let changed = true;
  while (changed) {
    changed = false;
    for (const flag of catalog) {
      const deps = flag.dependsOn || [];
      if (deps.some((dep) => !raw[dep]) && raw[flag.key]) {
        raw[flag.key] = false;
        changed = true;
      }
    }
  }

  const modes = {
    receptionMode: raw['reception.live_queue'] ? 'ENTERPRISE' : 'SIMPLE',
    assignmentMode: raw['reception.auto_counsellor_assignment'] ? 'AUTO' : 'MANUAL',
  };

  return { flags: raw, modes, catalog: catalog.map((f) => ({
    ...f,
    effective: raw[f.key],
    overridden: overrideMap[f.key] !== undefined,
  })) };
}

export const featureService = {
  seedCatalog: () => featureRepository.upsertCatalog(),

  seedCompanyDefaults: (companyId, userId) =>
    featureRepository.seedCompanyDefaults(companyId, userId),

  getEffective: async (companyId) => {
    if (!companyId) {
      const catalog = await featureRepository.listCatalog();
      const flags = Object.fromEntries(catalog.map((f) => [f.key, f.defaultEnabled]));
      return resolveEffective(catalog, []);
    }

    const [catalog, overrides] = await Promise.all([
      featureRepository.listCatalog(),
      featureRepository.getOverridesForCompany(companyId),
    ]);

    if (!overrides.length) {
      await featureRepository.seedCompanyDefaults(companyId);
      const seeded = await featureRepository.getOverridesForCompany(companyId);
      return resolveEffective(catalog, seeded);
    }

    return resolveEffective(catalog, overrides);
  },

  isEnabled: async (key, { companyId }) => {
    const { flags } = await featureService.getEffective(companyId);
    return Boolean(flags[key]);
  },

  getAdminView: async (companyId) => {
    const effective = await featureService.getEffective(companyId);
    const grouped = FEATURE_REGISTRY.reduce((acc, def) => {
      if (!acc[def.module]) acc[def.module] = [];
      acc[def.module].push({
        ...def,
        effective: effective.flags[def.key],
        overridden: effective.catalog.find((c) => c.key === def.key)?.overridden,
      });
      return acc;
    }, {});
    return { ...effective, grouped };
  },

  updateBulk: async (companyId, updates, userId, req) => {
    const catalog = await featureRepository.listCatalog();
    const catalogKeys = new Set(catalog.map((f) => f.key));

    for (const { key, enabled } of updates) {
      if (!catalogKeys.has(key)) continue;
      await featureRepository.upsertOverride(companyId, key, Boolean(enabled), userId);
    }

    await auditLog({
      userId,
      action: 'UPDATE',
      entityType: 'FeatureToggle',
      entityId: companyId,
      newData: { updates },
      req,
    });

    return featureService.getEffective(companyId);
  },
};
