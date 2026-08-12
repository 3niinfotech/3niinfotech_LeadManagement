import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  FiChevronLeft, FiChevronRight, FiChevronsLeft, FiChevronsRight,
} from 'react-icons/fi';
import Select from '../ui/Select';

const PAGE_SIZES = [10, 25, 50, 100];

export default function GridPagination({ api, totalRows = 0, pageSizeOptions = PAGE_SIZES }) {
  const [meta, setMeta] = useState({
    page: 0, totalPages: 0, pageSize: 25, from: 0, to: 0,
  });

  const sizeOptions = useMemo(
    () => pageSizeOptions.map((n) => ({ value: n, label: String(n) })),
    [pageSizeOptions],
  );

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
        <span className="crm-grid-footer__range">
          <strong>{from}–{to}</strong>
          <span className="text-text-muted"> of </span>
          <strong>{total}</strong>
          <span className="text-text-muted"> records</span>
        </span>
      </div>

      <div className="crm-grid-footer__right">
        <span className="crm-grid-footer__page-info">
          Page <strong>{totalPages === 0 ? 0 : page + 1}</strong> of <strong>{totalPages || 1}</strong>
        </span>
        <div className="crm-grid-footer__nav" role="navigation" aria-label="Table pagination">
          <button type="button" className="crm-grid-footer__btn" disabled={atStart} onClick={() => go(0)} aria-label="First page">
            <FiChevronsLeft className="w-3.5 h-3.5" />
          </button>
          <button type="button" className="crm-grid-footer__btn" disabled={atStart} onClick={() => go(page - 1)} aria-label="Previous page">
            <FiChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button type="button" className="crm-grid-footer__btn" disabled={atEnd} onClick={() => go(page + 1)} aria-label="Next page">
            <FiChevronRight className="w-3.5 h-3.5" />
          </button>
          <button type="button" className="crm-grid-footer__btn" disabled={atEnd} onClick={() => go(totalPages - 1)} aria-label="Last page">
            <FiChevronsRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
