import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
} from 'react-icons/fi';
import Select from '../ui/Select';

const PAGE_SIZES = [10, 25, 50, 100];

function getPageList(currentPage, totalPages) {
  if (totalPages <= 1) return [1];
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = [1];
  if (currentPage > 3) {
    pages.push('...');
  }
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (currentPage < totalPages - 2) {
    pages.push('...');
  }
  pages.push(totalPages);
  return pages;
}

export default function GridPagination({ api, totalRows = 0, pageSizeOptions = PAGE_SIZES }) {
  const [meta, setMeta] = useState({
    page: 0, totalPages: 0, pageSize: 25, from: 0, to: 0,
  });

  const sizeOptions = useMemo(() => {
    const activeSize = meta.pageSize || 25;
    const list = Array.from(new Set([activeSize, ...(pageSizeOptions || [])])).sort((a, b) => a - b);
    return list.map((n) => ({ value: n, label: String(n) }));
  }, [meta.pageSize, pageSizeOptions]);

  const refresh = useCallback(() => {
    if (!api) return;
    const page = api.paginationGetCurrentPage();
    const totalPages = api.paginationGetTotalPages();
    const pageSize = api.paginationGetPageSize();
    const total = totalRows || api.getDisplayedRowCount();
    const from = total === 0 ? 0 : page * pageSize + 1;
    const to = Math.min((page + 1) * pageSize, total);
    setMeta({ page, totalPages, pageSize, from, to });
  }, [api, totalRows]);

  useEffect(() => {
    if (!api) return undefined;
    refresh();
    const events = ['paginationChanged', 'modelUpdated', 'filterChanged'];
    events.forEach((e) => api.addEventListener(e, refresh));
    return () => events.forEach((e) => api.removeEventListener(e, refresh));
  }, [api, refresh]);

  if (!api) return null;

  const { page, totalPages, pageSize, from, to } = meta;
  const total = totalRows || api.getDisplayedRowCount();
  const atStart = page <= 0;
  const atEnd = page >= totalPages - 1;
  const currentPageNum = totalPages === 0 ? 0 : page + 1;
  const pageList = useMemo(() => getPageList(currentPageNum, totalPages), [currentPageNum, totalPages]);

  const go = (p) => api.paginationGoToPage(p);
  const setSize = (e) => api.setGridOption('paginationPageSize', Number(e.target.value));

  return (
    <footer className="crm-grid-footer shrink-0">
      <div className="crm-grid-footer__left">
        <span className="crm-grid-footer__label">Rows per page</span>
        <div className="crm-grid-footer__page-size">
          <Select
            size="sm"
            value={pageSize}
            onChange={setSize}
            options={sizeOptions}
            searchable={false}
            allowClear={false}
            placement="topLeft"
            classNames={{ popup: { root: 'crm-grid-footer__page-size-dropdown' } }}
            className="crm-grid-footer__page-size-control"
            aria-label="Rows per page"
          />
        </div>
        <span className="crm-grid-footer__divider" aria-hidden />
        <span className="crm-grid-footer__range">
          Showing <strong>{from}–{to}</strong> of <strong>{total}</strong> records
        </span>
      </div>

      <div className="crm-grid-footer__right">
        <span className="crm-grid-footer__page-info">
          Page <strong>{currentPageNum}</strong> of <strong>{totalPages || 1}</strong>
        </span>
        <div className="crm-grid-footer__nav" role="navigation" aria-label="Table pagination">
          <button
            type="button"
            className="crm-grid-footer__btn"
            disabled={atStart}
            onClick={() => go(0)}
            aria-label="First page"
            title="First page"
          >
            <FiChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="crm-grid-footer__btn"
            disabled={atStart}
            onClick={() => go(page - 1)}
            aria-label="Previous page"
            title="Previous page"
          >
            <FiChevronLeft className="w-3.5 h-3.5" />
          </button>

          {totalPages > 1 && pageList.map((p, idx) => (
            p === '...' ? (
              <span key={`ellipsis-${idx}`} className="crm-grid-footer__ellipsis" aria-hidden>
                …
              </span>
            ) : (
              <button
                key={p}
                type="button"
                className={`crm-grid-footer__btn ${p === currentPageNum ? 'crm-grid-footer__btn--active' : ''}`}
                onClick={() => go(p - 1)}
                aria-label={`Page ${p}`}
                aria-current={p === currentPageNum ? 'page' : undefined}
              >
                {p}
              </button>
            )
          ))}

          <button
            type="button"
            className="crm-grid-footer__btn"
            disabled={atEnd}
            onClick={() => go(page + 1)}
            aria-label="Next page"
            title="Next page"
          >
            <FiChevronRight className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="crm-grid-footer__btn"
            disabled={atEnd}
            onClick={() => go(totalPages - 1)}
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
