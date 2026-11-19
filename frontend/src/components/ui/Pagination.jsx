import { useMemo } from 'react';
import {
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
} from 'react-icons/fi';
import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '../../config/constants';
import Select from './Select';
import '../table/grid.theme.css';

export default function Pagination({
  page,
  limit = DEFAULT_PAGE_SIZE,
  total = 0,
  totalPages,
  onPageChange,
  onPageSizeChange,
  showPageSize = true,
  pageSizeOptions = PAGE_SIZES,
  className = '',
}) {
  const safeTotal = typeof total === 'number' && !isNaN(total) ? Math.max(0, total) : 0;
  const safeLimit = typeof limit === 'number' && limit > 0 ? limit : DEFAULT_PAGE_SIZE;
  const safePage = typeof page === 'number' && page > 0 ? page : 1;
  const calculatedTotalPages = totalPages || (safeTotal > 0 ? Math.ceil(safeTotal / safeLimit) : 1);
  const safeTotalPages = Math.max(1, calculatedTotalPages);

  const from = safeTotal === 0 ? 0 : (safePage - 1) * safeLimit + 1;
  const to = Math.min(safePage * safeLimit, safeTotal);

  const atStart = safePage <= 1;
  const atEnd = safePage >= safeTotalPages;

  const sizeOptions = useMemo(
    () => pageSizeOptions.map((n) => ({ value: n, label: String(n) })),
    [pageSizeOptions],
  );

  return (
    <footer className={`crm-grid-footer shrink-0 ${className}`}>
      <div className="crm-grid-footer__left">
        {showPageSize && (
          <>
            <span className="crm-grid-footer__label">Rows per page</span>
            <div className="crm-grid-footer__page-size">
              <Select
                size="sm"
                value={safeLimit}
                onChange={(e) => onPageSizeChange?.(Number(e.target.value))}
                options={sizeOptions}
                searchable={false}
                allowClear={false}
                placement="topLeft"
                classNames={{ popup: { root: 'crm-grid-footer__page-size-dropdown' } }}
                className="crm-grid-footer__page-size-control"
                aria-label="Rows per page"
              />
            </div>
          </>
        )}
        <span className="crm-grid-footer__range">
          <strong>{from}–{to}</strong>
          <span className="text-text-muted"> of </span>
          <strong>{safeTotal}</strong>
          <span className="text-text-muted"> records</span>
        </span>
      </div>

      <div className="crm-grid-footer__right">
        <span className="crm-grid-footer__page-info">
          Page <strong>{safeTotal === 0 ? 0 : safePage}</strong> of <strong>{safeTotalPages}</strong>
        </span>
        <div className="crm-grid-footer__nav" role="navigation" aria-label="Table pagination">
          <button
            type="button"
            className="crm-grid-footer__btn"
            disabled={atStart}
            onClick={() => onPageChange?.(1)}
            aria-label="First page"
            title="First page"
          >
            <FiChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="crm-grid-footer__btn"
            disabled={atStart}
            onClick={() => onPageChange?.(safePage - 1)}
            aria-label="Previous page"
            title="Previous page"
          >
            <FiChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="crm-grid-footer__btn"
            disabled={atEnd}
            onClick={() => onPageChange?.(safePage + 1)}
            aria-label="Next page"
            title="Next page"
          >
            <FiChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="crm-grid-footer__btn"
            disabled={atEnd}
            onClick={() => onPageChange?.(safeTotalPages)}
            aria-label="Last page"
            title="Last page"
          >
            <FiChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
