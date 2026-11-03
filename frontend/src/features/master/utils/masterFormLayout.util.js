/**
 * Adaptive layout for master Add/Edit drawers — width, columns, sections.
 * UI-only; does not affect payloads or validation.
 */

const SECTION_META = {
  general: { title: 'General Information', order: 0 },
  relations: { title: 'Relations & Links', order: 1 },
  contact: { title: 'Contact Information', order: 2 },
  content: { title: 'Content & Details', order: 3 },
  settings: { title: 'Configuration', order: 4 },
};

const CONTACT_FIELDS = new Set([
  'email', 'phone', 'website', 'url', 'fileUrl',
  'addressLine1', 'addressLine2', 'city', 'state', 'postalCode',
]);

const CONTENT_FIELDS = new Set([
  'description', 'variables', 'subject', 'body', 'content', 'template', 'htmlBody', 'smsBody',
]);

/** Entities that benefit from a wider drawer regardless of field count */
const WIDE_ENTITIES = new Set([
  'course', 'university', 'application-checklist', 'visa-checklist',
  'document-requirement', 'partner-agreement', 'partner-agreement-email',
  'email-template', 'sms-template', 'email-automation', 'invoice-config',
]);

function inferSectionId(field) {
  if (field.section && SECTION_META[field.section]) return field.section;
  if (field.type === 'options' || field.type === 'branch') return 'relations';
  if (field.type === 'textarea' || CONTENT_FIELDS.has(field.name)) return 'content';
  if (CONTACT_FIELDS.has(field.name)) return 'contact';
  if (field.type === 'switch' || field.name === 'sortOrder' || field.name === 'position') return 'settings';
  return 'general';
}

/**
 * @param {import('../../../config/master-entities.config').MASTER_ENTITY_CONFIGS[string]} entityConfig
 */
export function resolveMasterFormLayout(entityConfig) {
  const fields = entityConfig?.fields || [];
  const entity = entityConfig?.entity;

  if (entityConfig?.formLayout) {
    return {
      size: entityConfig.formLayout.size || 'md',
      columns: entityConfig.formLayout.columns ?? 2,
      sections: groupFieldsIntoSections(fields),
    };
  }

  const fieldCount = fields.length;
  const switchCount = fields.filter((f) => f.type === 'switch').length;
  const hasTextarea = fields.some((f) => f.type === 'textarea');
  const hasRelations = fields.some((f) => f.type === 'options' || f.type === 'branch');

  let tier = 'simple';
  if (fieldCount > 5 || hasTextarea || hasRelations || switchCount > 2) tier = 'medium';
  if (fieldCount > 10 || switchCount > 4) tier = 'complex';
  if (WIDE_ENTITIES.has(entity)) tier = 'complex';

  const size = tier === 'simple' ? 'sm' : tier === 'medium' ? 'md' : fieldCount > 14 ? 'xl' : 'lg';
  const columns = tier === 'simple' ? 1 : 2;

  return {
    tier,
    size,
    columns,
    sections: groupFieldsIntoSections(fields, tier !== 'simple'),
  };
}

/** Modal presentation derived from layout tier */
export function resolveModalProps(layout = {}) {
  const tier = layout.tier
    || (layout.size === 'sm' ? 'simple' : (layout.size === 'xl' || layout.size === 'lg' ? 'complex' : 'medium'));

  if (tier === 'simple') {
    return { size: 'sm', variant: 'default', compact: true };
  }
  if (tier === 'complex') {
    return { size: layout.size === 'xl' ? 'xl' : 'lg', variant: 'default', compact: false };
  }
  return { size: layout.size === 'lg' ? 'lg' : 'md', variant: 'default', compact: false };
}

function groupFieldsIntoSections(fields, useSections = true) {
  if (!fields.length) return [];

  // For compact forms with 6 or fewer fields, keep in a clean unified group without arbitrary headers
  if (!useSections || fields.length <= 6) {
    return [{ id: 'all', title: null, fields }];
  }

  const buckets = {};
  fields.forEach((field) => {
    const id = inferSectionId(field);
    if (!buckets[id]) buckets[id] = [];
    buckets[id].push(field);
  });

  const sections = Object.entries(buckets)
    .map(([id, sectionFields]) => ({
      id,
      title: SECTION_META[id]?.title || null,
      order: SECTION_META[id]?.order ?? 99,
      fields: sectionFields,
    }))
    .filter((s) => s.fields.length)
    .sort((a, b) => a.order - b.order);

  if (sections.length <= 1) {
    return [{ id: 'all', title: null, fields }];
  }

  return sections;
}

export function masterFormSubtitle(mode, singular) {
  const name = singular || 'record';
  const lower = name.toLowerCase();
  if (mode === 'add') return `Create a new ${lower}`;
  if (mode === 'edit') return `Update ${lower} details`;
  return 'Read-only view';
}

/** @deprecated use masterFormSubtitle */
export function masterDrawerSubtitle(mode, singular) {
  return masterFormSubtitle(mode, singular);
}

export function masterSubmitLabel(mode, singular, busy) {
  const name = singular || 'Record';
  if (busy) return 'Saving…';
  if (mode === 'add') return `Create ${name}`;
  if (mode === 'edit') return 'Save changes';
  return 'Close';
}
