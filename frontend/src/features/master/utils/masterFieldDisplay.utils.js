/**
 * Map relational master API rows to select { value, label } pairs.
 * Always stores human-readable labels in string columns — never codes or UUIDs.
 */
export function pairMasterOption(row, { disambiguate = false } = {}) {
  if (!row) return null;

  const name = row.name || '';
  const code = row.code || '';
  const id = row.value || row.id || '';
  const apiLabel = row.label || '';

  let label = apiLabel || name || code || id;
  if (!apiLabel && disambiguate && row.universityName && name) {
    label = `${name} · ${row.universityName}`;
  } else if (!apiLabel && disambiguate && row.countryName && name) {
    label = `${name} · ${row.countryName}`;
  }

  const value = apiLabel || name || label;
  if (!value) return null;

  return {
    value: String(value),
    label: String(label),
    code: code || undefined,
    id: id || undefined,
  };
}

export function pairMasterOptions(rows = [], options = {}) {
  return rows.map((row) => pairMasterOption(row, options)).filter(Boolean);
}

/** Looks like a relational master code (COURSE_*, UNIV_*, etc.) */
export function looksLikeMasterCode(value) {
  if (!value || typeof value !== 'string') return false;
  return /^(COURSE|UNIV|INTAKE|COUNTRY|QUAL)_/i.test(value.trim());
}

/** Resolve a stored value to display label using loaded options. */
export function resolveMasterLabelFromOptions(value, options = []) {
  if (!value) return value || '—';
  const raw = String(value).trim();
  if (!raw) return '—';

  const hit = options.find((opt) => {
    const candidates = [opt.value, opt.label, opt.code, opt.id, opt.name].filter(Boolean).map(String);
    return candidates.includes(raw);
  });

  if (hit) return hit.label || hit.name || hit.value || raw;
  if (looksLikeMasterCode(raw)) return raw.replace(/_/g, ' ').replace(/^(COURSE|UNIV|INTAKE|COUNTRY|QUAL)\s/i, '').trim() || raw;
  return raw;
}

export function formatCourseDisplay(value, options = []) {
  return resolveMasterLabelFromOptions(value, options);
}

export function formatUniversityDisplay(value, options = []) {
  return resolveMasterLabelFromOptions(value, options);
}
