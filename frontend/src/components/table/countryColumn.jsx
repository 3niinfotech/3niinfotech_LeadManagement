import CountryFlagLabel from '../ui/CountryFlagLabel';

const centerCell = 'crm-grid-cell crm-grid-cell--center';
const centerHeader = 'crm-grid-header-cell crm-grid-header-cell--center';

/**
 * Shared AG Grid country column — flag + name.
 * @param {object} opts
 * @param {string} opts.field
 * @param {string} [opts.headerName]
 * @param {(row)=>any} [opts.valueGetter] — raw country value from row
 * @param {number} [opts.width]
 */
export function createCountryColumn({
  field = 'country',
  headerName = 'Country',
  valueGetter,
  width = 140,
  minWidth = 120,
  flex,
  ...overrides
} = {}) {
  return {
    field,
    headerName,
    width,
    minWidth,
    ...(flex != null ? { flex } : {}),
    cellClass: `crm-grid-cell--truncate ${centerCell}`,
    headerClass: centerHeader,
    valueGetter: (p) => {
      if (valueGetter) return valueGetter(p.data) ?? '';
      const row = p.data || {};
      return (
        row[field]
        || row.interestedCountry
        || row.countryName
        || row.metadata?.countryName
        || row.country?.name
        || ''
      );
    },
    cellRenderer: (p) => {
      const value = p.value;
      if (value == null || value === '' || value === '—') {
        return <span className="text-text-muted">—</span>;
      }
      return <CountryFlagLabel country={value} size="sm" />;
    },
    ...overrides,
  };
}
