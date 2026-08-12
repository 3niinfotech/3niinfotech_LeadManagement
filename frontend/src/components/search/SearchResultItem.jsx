import { FiArrowRight, FiX } from 'react-icons/fi';
import { iconSize } from '../../theme/icons';
import Badge from '../ui/Badge';
import { highlightParts } from '../../utils/globalSearch';

function HighlightText({ text, query }) {
  const parts = highlightParts(text, query);
  return (
    <>
      {parts.map((part, i) =>
        part.match ? (
          <mark key={i} className="bg-brand/15 text-brand font-semibold rounded px-0.5 not-italic">
            {part.text}
          </mark>
        ) : (
          <span key={i}>{part.text}</span>
        ),
      )}
    </>
  );
}

export default function SearchResultItem({
  icon: Icon,
  title,
  subtitle,
  hint,
  meta,
  badge,
  badgeColor = 'primary',
  active = false,
  onClick,
  onRemove,
  query = '',
  variant = 'default',
}) {
  const variantStyles = {
    history: active ? 'bg-row-hover border-border' : 'hover:bg-row-hover/80',
    suggestion: active ? 'bg-brand-soft/70 border-brand/20' : 'hover:bg-brand-soft/40',
    default: active ? 'bg-brand-soft border-brand/25 shadow-sm' : 'hover:bg-row-hover',
  };

  return (
    <div className={`relative flex items-stretch gap-0 rounded-xl transition-all duration-150 group ${active ? 'z-[1]' : ''}`}>
      <button
        type="button"
        onClick={onClick}
        className={`
          flex-1 flex items-center gap-3 px-3 py-2.5 rounded-xl text-left border transition-all duration-150
          ${variantStyles[variant] || variantStyles.default}
          ${active ? 'border-brand/25 shadow-sm' : 'border-transparent'}
        `}
      >
        <div
          className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-colors
            ${active
              ? 'bg-brand text-white shadow-sm'
              : variant === 'history'
                ? 'bg-page border border-border text-text-muted'
                : 'bg-page border border-border text-text-muted group-hover:text-brand group-hover:border-brand/20'}`}
        >
          <Icon className={iconSize.md} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-sm font-semibold text-text truncate">
              <HighlightText text={title} query={query} />
            </p>
            {badge && (
              <Badge color={badgeColor} className="hidden sm:inline-flex shrink-0 text-[10px]">
                {badge}
              </Badge>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-text-secondary truncate mt-0.5">
              <HighlightText text={subtitle} query={query} />
            </p>
          )}
          {(hint || meta) && (
            <p className={`text-[11px] mt-1 truncate ${variant === 'suggestion' ? 'text-text-muted' : 'text-brand'}`}>
              {hint || meta}
            </p>
          )}
        </div>

        <FiArrowRight
          className={`${iconSize.sm} shrink-0 transition-all duration-150
            ${active ? 'text-brand opacity-100 translate-x-0' : 'text-text-muted opacity-0 -translate-x-1 group-hover:opacity-60'}`}
        />
      </button>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Remove from history"
          className="self-center mr-1 p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft opacity-0 group-hover:opacity-100 transition-all shrink-0"
        >
          <FiX className={iconSize.sm} />
        </button>
      )}
    </div>
  );
}
