import { Link } from 'react-router-dom';
import { FiChevronRight } from 'react-icons/fi';

export default function Breadcrumb({ items = [], className = '' }) {
  if (!items.length) return null;

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1 min-w-0">
        {items.map((item, index) => {
          const isLast = index === items.length - 1;

          return (
            <li key={`${item.label}-${index}`} className="flex items-center gap-1 min-w-0">
              {index > 0 && (
                <FiChevronRight
                  className="w-3 h-3 shrink-0 text-text-muted/50"
                  aria-hidden
                />
              )}

              {isLast ? (
                <span
                  className="text-[11px] font-medium text-text-secondary truncate"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : item.path ? (
                <Link
                  to={item.path}
                  className="text-[11px] font-normal text-text-muted hover:text-primary-600 transition-colors truncate"
                >
                  {item.label}
                </Link>
              ) : (
                <span className="text-[11px] font-normal text-text-muted truncate">
                  {item.label}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
