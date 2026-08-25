import { DEFAULT_PAGE_SIZE, PAGE_SIZES } from '../../config/constants';
import Select from './Select';

export default function Pagination({
  page, limit = DEFAULT_PAGE_SIZE, total, totalPages,
  onPageChange, onPageSizeChange, showPageSize = true,
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card-bg">
      <div className="flex items-center gap-4 text-sm text-text-muted">
        <span>{total} records</span>
        {showPageSize && (
          <Select
            value={limit}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            searchable={false}
            allowClear={false}
            size="sm"
            className="!w-[108px]"
            options={PAGE_SIZES.map((s) => ({ value: s, label: `${s} / page` }))}
          />
        )}
      </div>
      <div className="flex items-center gap-1">
        <PaginationButton onClick={() => onPageChange(1)} disabled={page <= 1}>First</PaginationButton>
        <PaginationButton onClick={() => onPageChange(page - 1)} disabled={page <= 1}>Prev</PaginationButton>
        <span className="px-3 text-sm text-text">Page {page} of {totalPages || 1}</span>
        <PaginationButton onClick={() => onPageChange(page + 1)} disabled={page >= totalPages}>Next</PaginationButton>
        <PaginationButton onClick={() => onPageChange(totalPages)} disabled={page >= totalPages}>Last</PaginationButton>
      </div>
    </div>
  );
}

function PaginationButton({ children, disabled, onClick }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="px-3 py-1.5 text-sm rounded-lg border border-border bg-card-bg text-text hover:bg-row-hover disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
    >
      {children}
    </button>
  );
}
