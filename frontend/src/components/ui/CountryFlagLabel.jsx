import ReactCountryFlag from 'react-country-flag';
import * as FlagIcons from 'country-flag-icons/react/3x2';
import { normalizeCountryIso, resolveCountryMeta } from '../../utils/countryFlag.util';

const SIZE = {
  xs: { w: 14, h: 10, gap: '0.3rem', text: 'text-[11px]' },
  sm: { w: 18, h: 13, gap: '0.35rem', text: 'text-xs' },
  md: { w: 22, h: 16, gap: '0.4rem', text: 'text-sm' },
  lg: { w: 28, h: 20, gap: '0.45rem', text: 'text-base' },
};

/** SVG flag from country-flag-icons, fallback to react-country-flag */
export function CountryFlag({ country, iso, size = 'sm', className = '', title }) {
  const code = normalizeCountryIso(iso || country);
  if (!code) return null;

  const dim = SIZE[size] || SIZE.sm;
  const Icon = FlagIcons[code];
  const tip = title || code;

  if (typeof Icon === 'function') {
    return (
      <Icon
        title={tip}
        className={`crm-country-flag ${className}`.trim()}
        style={{ width: dim.w, height: dim.h, borderRadius: 2, flexShrink: 0 }}
      />
    );
  }

  return (
    <ReactCountryFlag
      countryCode={code}
      svg
      title={tip}
      aria-label={tip}
      className={`crm-country-flag ${className}`.trim()}
      style={{
        width: dim.w,
        height: dim.h,
        borderRadius: 2,
        objectFit: 'cover',
        flexShrink: 0,
        lineHeight: 1,
      }}
    />
  );
}

/** Flag + country name — use everywhere country text is shown */
export default function CountryFlagLabel({
  country,
  iso,
  name,
  size = 'sm',
  showName = true,
  className = '',
  nameClassName = '',
  empty = '—',
}) {
  const meta = resolveCountryMeta(country ?? { name, isoCode: iso });
  const label = name || meta.label;
  const dim = SIZE[size] || SIZE.sm;

  if (!meta.iso && !label) {
    return <span className={`text-text-muted ${dim.text} ${className}`.trim()}>{empty}</span>;
  }

  return (
    <span
      className={`inline-flex items-center min-w-0 ${className}`.trim()}
      style={{ gap: dim.gap }}
      title={label || meta.iso || ''}
    >
      <CountryFlag country={label} iso={meta.iso || iso} size={size} title={label} />
      {showName && (
        <span className={`truncate text-text-secondary ${dim.text} ${nameClassName}`.trim()}>
          {label || meta.iso || empty}
        </span>
      )}
    </span>
  );
}
