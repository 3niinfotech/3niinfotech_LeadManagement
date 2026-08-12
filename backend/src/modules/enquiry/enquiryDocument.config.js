export const DOCUMENT_CATEGORY_VALUES = [
  'PASSPORT',
  'TENTH',
  'TWELFTH',
  'DEGREE',
  'RESUME',
  'IELTS',
  'PTE',
  'SOP',
  'LOR',
  'PHOTO',
  'OTHERS',
];

export function normalizeDocumentCategory(value) {
  const raw = String(value || '').trim().toUpperCase();
  return DOCUMENT_CATEGORY_VALUES.includes(raw) ? raw : 'OTHERS';
}
