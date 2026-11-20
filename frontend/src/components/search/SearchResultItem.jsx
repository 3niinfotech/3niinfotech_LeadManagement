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
          <mark key={i} className="bg-primary-500/20 text-primary-600 dark:text-primary-300 font-bold rounded px-0.5 not-italic">
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
  return (
    <div className={`relative flex items-stretch gap-0 rounded-xl transition-all duration-150 group ${active ? 'z-[1]' : ''}`}>
      <button
        type="button"
        onClick={onClick}
        className={`
          flex-1 flex items-center gap-3.5 px-3.5 py-2.5 rounded-xl text-left border transition-all duration-150 cursor-pointer
          ${active
            ? 'bg-primary-50/90 dark:bg-primary-950/45 border-primary-500/40 shadow-xs'
            : 'border-transparent hover:bg-slate-100/70 dark:hover:bg-slate-800/45 hover:border-border/60'}
        `}
      >
        <div
          className={`shrink-0 w-9 h-9 rounded-lg flex items-center justify-center transition-all
            ${active
              ? 'bg-primary-600 text-white shadow-xs'
              : variant === 'history'
                ? 'bg-slate-100 dark:bg-slate-800/80 border border-border/80 text-text-muted'
                : 'bg-slate-100 dark:bg-slate-800/80 border border-border/80 text-text-muted group-hover:text-primary-600 dark:group-hover:text-primary-400 group-hover:border-primary-500/30'}`}
        >
          <Icon className={iconSize.md} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 min-w-0">
            <p className="text-[13px] font-semibold text-text truncate">
              <HighlightText text={title} query={query} />
            </p>
            {badge && (
              <Badge color={badgeColor} className="hidden sm:inline-flex shrink-0 text-[10px] py-0 px-1.5 font-bold">
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
            <p className={`text-[11px] mt-0.5 truncate ${variant === 'suggestion' ? 'text-text-muted' : 'text-primary-600 dark:text-primary-400 font-medium'}`}>
              {hint || meta}
            </p>
          )}
        </div>

        <FiArrowRight
          className={`${iconSize.sm} shrink-0 transition-all duration-150
            ${active ? 'text-primary-600 dark:text-primary-400 opacity-100 translate-x-0' : 'text-text-muted opacity-0 -translate-x-1 group-hover:opacity-60'}`}
        />
      </button>

      {onRemove && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          title="Remove from history"
          className="self-center mr-1 p-1.5 rounded-lg text-text-muted hover:text-danger hover:bg-danger-soft opacity-0 group-hover:opacity-100 transition-all shrink-0 cursor-pointer"
        >
          <FiX className={iconSize.sm} />
        </button>
      )}
    </div>
  );
}
