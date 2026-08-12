/** Predefined enquiry tags — labels match MasterItem category `tags` */
import {
  ENQUIRY_TAG_SEED_LABELS,
  LEGACY_ENQUIRY_TAG_MAP,
  mapLegacyEnquiryTag,
} from '../../config/enquiry-tags.seed.config.js';

export const ENQUIRY_TAGS = ENQUIRY_TAG_SEED_LABELS.map((label) => ({
  value: label,
  label,
}));

export const ENQUIRY_TAG_VALUES = [...ENQUIRY_TAG_SEED_LABELS];

export function normalizeEnquiryTags(tags) {
  if (!Array.isArray(tags)) return [];
  const allowed = new Set(ENQUIRY_TAG_VALUES);
  const normalized = tags
    .map(mapLegacyEnquiryTag)
    .filter((t) => t && allowed.has(t));
  return [...new Set(normalized)];
}

export { LEGACY_ENQUIRY_TAG_MAP, mapLegacyEnquiryTag };
