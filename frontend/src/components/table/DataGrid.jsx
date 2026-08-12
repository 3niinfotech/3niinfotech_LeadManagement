import { useMemo, useCallback, useRef, useState } from 'react';
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
}) {
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
      return v != null && v !== '' ? String(v) : null;
    },
  }), []);

  const rowClassRules = useMemo(() => ({
    'crm-grid-row--selected': (params) => params.node.isSelected(),
  }), []);

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

  if (loading && !rowData.length) {
    return (
      <div className="relative flex-1 min-h-[280px] w-full overflow-hidden border-t border-border">
        <TableLoader rows={10} columns={Math.min(columns?.length || 7, 8)} height="100%" />
      </div>
    );
  }

  if (!rowData.length && !fetching) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[320px] border-t border-border bg-card-bg">
        <EmptyState
          title={emptyTitle}
          description={emptyDescription}
          actionLabel={emptyActionLabel}
          onAction={onEmptyAction}
        />
      </div>
    );
  }

  return (
    <div className={`crm-grid-shell relative flex flex-col flex-1 min-h-[280px] w-full overflow-hidden ${className}`} style={{ height }}>
      {fetching && <TableFetchOverlay />}
      <div className="ag-theme-crm flex-1 min-h-0 w-full overflow-hidden">
        <AgGridReact
          ref={gridRef}
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
          domLayout="normal"
          suppressDragLeaveHidesColumns
          enableCellTextSelection
          tooltipShowDelay={300}
          tooltipShowMode="whenTruncated"
          getRowId={getRowId}
          suppressColumnMoveAnimation
          alwaysShowHorizontalScroll={false}
          suppressHorizontalScroll={false}
        />
      </div>
      {pagination && (
        <GridPagination
          api={gridApi}
          totalRows={rowData.length}
          pageSizeOptions={paginationPageSizeOptions}
        />
      )}
    </div>
  );
}
