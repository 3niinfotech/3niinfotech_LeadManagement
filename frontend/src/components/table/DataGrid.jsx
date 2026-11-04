import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ModuleRegistry, AllCommunityModule } from 'ag-grid-community';
import EmptyState from '../ui/EmptyState';
import TableLoader, { TableFetchOverlay } from '../ui/TableLoader';
import { useSelector } from 'react-redux';
import { selectTableDensity } from '../../redux/slices/uiSlice';
import { TABLE_DENSITY } from '../../config/constants';
import GridPagination from './GridPagination';
import { SELECTION_COLUMN_DEF } from './grid.columns';
import './grid.theme.css';

ModuleRegistry.registerModules([AllCommunityModule]);

export default function DataGrid({
  columns,
  rowData = [],
  loading = false,
  fetching = false,
  onRowClick,
  onSelectionChanged,
  rowSelection = false,
  pagination = true,
  paginationPageSize = 25,
  paginationPageSizeOptions = [10, 25, 50, 100],
  onGridReady,
  height = '100%',
  emptyTitle = 'No records found',
  emptyDescription,
  emptyActionLabel,
  onEmptyAction,
  className = '',
  density: densityProp,
  getRowId,
  /** Extra AG Grid rowClassRules merged with defaults */
  rowClassRules: extraRowClassRules,
  /** Height follows the row count instead of stretching to the container */
  fitContent = false,
  /** Row cap before the grid starts scrolling (only with fitContent) */
  maxVisibleRows = 12,
  /** Footer is noise when everything already fits on one page */
  hideSinglePagePagination = false,
}) {
  const containerRef = useRef(null);
  const gridRef = useRef(null);
  const [gridApi, setGridApi] = useState(null);
  const globalDensity = useSelector(selectTableDensity);
  const density = densityProp || globalDensity;
  const rowHeight = density === TABLE_DENSITY.COMPACT ? 34 : 40;
  const headerHeight = density === TABLE_DENSITY.COMPACT ? 34 : 38;

  const defaultColDef = useMemo(() => ({
    sortable: true,
    resizable: true,
    filter: false,
    suppressMovable: false,
    minWidth: 88,
    wrapText: false,
    autoHeight: false,
    cellClass: 'crm-grid-cell crm-grid-cell--center',
    headerClass: 'crm-grid-header-cell crm-grid-header-cell--center',
    tooltipValueGetter: (p) => {
      const v = p.valueFormatted ?? p.value;
      if (v == null || v === '') return null;
      if (typeof v === 'object') {
        if (typeof v.name === 'string') return v.name;
        if (v.firstName || v.lastName) return `${v.firstName || ''} ${v.lastName || ''}`.trim();
        if (typeof v.title === 'string') return v.title;
        if (typeof v.label === 'string') return v.label;
        return null;
      }
      return String(v);
    },
  }), []);

  const rowClassRules = useMemo(() => ({
    'crm-grid-row--selected': (params) => params.node.isSelected(),
    ...(extraRowClassRules || {}),
  }), [extraRowClassRules]);

  const handleSelectionChanged = useCallback(() => {
    if (onSelectionChanged && gridRef.current) {
      onSelectionChanged(gridRef.current.api.getSelectedRows());
    }
  }, [onSelectionChanged]);

  const handleRowClicked = useCallback((e) => {
    if (e.event?.target?.closest?.('button, a, input, select, [role="button"], .ag-checkbox-input-wrapper')) return;
    onRowClick?.(e.data);
  }, [onRowClick]);

  const handleGridReady = useCallback((params) => {
    setGridApi(params.api);
    onGridReady?.(params);
  }, [onGridReady]);

  const handleRowDataUpdated = useCallback(() => {
    // Let AG Grid reconcile rows naturally without forcing redraw
  }, []);

  const resolvedRowSelection = useMemo(() => {
    if (!rowSelection) return undefined;
    const base = {
      mode: 'multiRow',
      checkboxes: true,
      headerCheckbox: true,
      selectAll: 'currentPage',
      enableClickSelection: false,
    };
    if (typeof rowSelection === 'object') return { ...base, ...rowSelection };
    return base;
  }, [rowSelection]);

  const pageRowCount = pagination ? Math.min(rowData.length, paginationPageSize) : rowData.length;
  // +10px keeps the last row clear of the horizontal scrollbar when columns overflow
  const fittedHeight = headerHeight
    + Math.max(Math.min(pageRowCount, maxVisibleRows), 1) * rowHeight
    + 10;
  const showPagination = pagination
    && (!hideSinglePagePagination || rowData.length > paginationPageSize);

  return (
    <div
      ref={containerRef}
      className={`crm-grid-shell relative flex flex-col w-full overflow-hidden ${fitContent ? '' : 'flex-1 min-h-0'} ${className}`}
      style={fitContent ? undefined : { flex: '1 1 0%', minHeight: 0, height: '100%' }}
    >
      {/* Seamless loading overlay prevents destroying the grid DOM on fetch */}
      {loading && !rowData.length && (
        <div className="absolute inset-0 z-30 bg-card-bg">
          <TableLoader
            rows={fitContent ? Math.min(maxVisibleRows, 6) : 10}
            columns={Math.min(columns?.length || 7, 8)}
            height="100%"
          />
        </div>
      )}

      {fetching && <TableFetchOverlay />}

      {!rowData.length && !loading && !fetching ? (
        <div className={`flex items-center justify-center border-t border-border bg-card-bg ${fitContent ? 'min-h-[220px]' : 'flex-1 min-h-[320px]'}`}>
          <EmptyState
            title={emptyTitle}
            description={emptyDescription}
            actionLabel={emptyActionLabel}
            onAction={onEmptyAction}
          />
        </div>
      ) : (
        <div
          className={`ag-theme-crm w-full h-full ${fitContent ? '' : 'flex-1 min-h-0'}`}
          style={fitContent ? { height: fittedHeight } : { width: '100%', height: '100%' }}
        >
          <AgGridReact
            ref={gridRef}
            theme="legacy"
            containerStyle={{ width: '100%', height: '100%' }}
            columnDefs={columns}
            rowData={rowData}
            defaultColDef={defaultColDef}
            rowHeight={rowHeight}
            headerHeight={headerHeight}
            getRowClass={() => 'crm-grid-row'}
            rowClassRules={rowClassRules}
            animateRows={false}
            suppressCellFocus
            rowSelection={resolvedRowSelection}
            selectionColumnDef={resolvedRowSelection ? SELECTION_COLUMN_DEF : undefined}
            onRowClicked={handleRowClicked}
            onSelectionChanged={handleSelectionChanged}
            pagination={pagination}
            paginationPageSize={paginationPageSize}
            suppressPaginationPanel
            onGridReady={handleGridReady}
            onRowDataUpdated={handleRowDataUpdated}
            domLayout="normal"
            suppressDragLeaveHidesColumns
            enableCellTextSelection
            tooltipShowDelay={300}
            tooltipShowMode="whenTruncated"
            getRowId={getRowId}
            suppressColumnMoveAnimation
            alwaysShowHorizontalScroll={false}
            suppressHorizontalScroll={false}
            rowBuffer={25}
          />
        </div>
      )}

      {showPagination && !loading && rowData.length > 0 && (
        <GridPagination
          api={gridApi}
          totalRows={rowData.length}
          pageSizeOptions={paginationPageSizeOptions}
        />
      )}
    </div>
  );
}
