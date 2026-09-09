import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowUpRight, FiArrowDownRight } from 'react-icons/fi';
import CountryFlagLabel from '../../../components/ui/CountryFlagLabel';
import DataGrid from '../../../components/table/DataGrid';

const COUNTRY_COL_KEYS = new Set(['country', 'countryName', 'interestedCountry', 'destinationCountry']);

function isCountryColumn(col) {
  if (col.flag === true) return true;
  if (col.flag === false) return false;
  return COUNTRY_COL_KEYS.has(String(col.key || '').toLowerCase())
    || /country/i.test(String(col.label || ''));
}

function renderCellValue(col, row, raw, rowIndex) {
  const countryNode = isCountryColumn(col) && raw != null && raw !== '' && raw !== '—'
    ? <CountryFlagLabel country={raw} size="sm" />
    : null;
  const content = countryNode ?? (raw == null || raw === '' ? '—' : raw);

  if (col.swatchIndex != null) {
    return (
      <span className="crm-rtable__swatch-cell">
        <span
          className="crm-rtable__swatch"
          style={{ background: `var(--crm-chart-${(rowIndex + (col.swatchIndex || 0)) % 8})` }}
        />
        {content}
      </span>
    );
  }
  if (col.badge) {
    return <span className={`crm-rtable__badge crm-rtable__badge--${col.badge(row)}`}>{content}</span>;
  }
  return content;
}

function toAgColumns(columns) {
  return (columns || []).map((col, index) => {
    const numeric = col.align === 'right';
    return {
      colId: String(col.key || `col-${index}`),
      field: col.key,
      headerName: col.label,
      flex: numeric ? 0 : 1,
      minWidth: numeric ? 72 : 110,
      width: numeric ? 96 : undefined,
      sortable: true,
      cellClass: numeric
        ? 'crm-grid-cell crm-grid-cell--center tabular-nums'
        : 'crm-grid-cell crm-grid-cell--center',
      headerClass: 'crm-grid-header-cell crm-grid-header-cell--center',
      valueGetter: (p) => {
        if (!p.data) return '';
        if (col.render) {
          const rendered = col.render(p.data);
          if (typeof rendered === 'string' || typeof rendered === 'number') return rendered;
        }
        return p.data[col.key];
      },
      cellRenderer: (p) => {
        if (!p.data) return null;
        const raw = col.render ? col.render(p.data) : p.data[col.key];
        return renderCellValue(col, p.data, raw, p.node?.rowIndex ?? 0);
      },
    };
  });
}

/** Clean metric card — icon, label, value, optional real delta */
export function ReportMetricCard({
  label,
  value,
  icon: Icon,
  tone = 'primary',
  delta,
  hint,
  to,
}) {
  const body = (
    <>
      <div className="crm-rcard__row">
        {Icon ? (
          <span className={`crm-rcard__icon crm-rcard__icon--${tone}`}>
            <Icon strokeWidth={1.75} />
          </span>
        ) : null}
        <div className="crm-rcard__copy">
          <p className="crm-rcard__label">{label}</p>
          <div className="crm-rcard__value-row">
            <p className={`crm-rcard__value${tone === 'danger' || tone === 'warning' ? ` crm-rcard__value--${tone}` : ''}`}>
              {value ?? '—'}
            </p>
            {delta != null && Number.isFinite(Number(delta)) && (
              <span
                className={`crm-rcard__delta ${
                  Number(delta) > 0
                    ? 'crm-rcard__delta--up'
                    : Number(delta) < 0
                      ? 'crm-rcard__delta--down'
                      : ''
                }`}
              >
                {Number(delta) > 0 ? <FiArrowUpRight /> : Number(delta) < 0 ? <FiArrowDownRight /> : null}
                {Number(delta) > 0 ? '+' : ''}
                {Number(delta).toFixed(1)}%
              </span>
            )}
          </div>
          {hint ? <p className="crm-rcard__hint">{hint}</p> : null}
        </div>
      </div>
    </>
  );

  if (to) {
    return (
      <Link to={to} className={`crm-rcard crm-rcard--pro crm-rcard--${tone} crm-rcard--link`}>
        {body}
      </Link>
    );
  }
  return <div className={`crm-rcard crm-rcard--pro crm-rcard--${tone}`}>{body}</div>;
}

export function ReportMetricGrid({ children, cols = 5 }) {
  return (
    <div className={`crm-rmetrics crm-rmetrics--${cols}`}>
      {children}
    </div>
  );
}

/** White section card with title + optional right action */
export function ReportSectionCard({
  title,
  subtitle,
  action,
  children,
  className = '',
  bodyClassName = '',
}) {
  return (
    <section className={`crm-rsection ${className}`.trim()}>
      {(title || action) && (
        <header className="crm-rsection__head">
          <div className="min-w-0">
            {title ? <h3 className="crm-rsection__title">{title}</h3> : null}
            {subtitle ? <p className="crm-rsection__sub">{subtitle}</p> : null}
          </div>
          {action ? <div className="crm-rsection__action">{action}</div> : null}
        </header>
      )}
      <div className={`crm-rsection__body ${bodyClassName}`.trim()}>{children}</div>
    </section>
  );
}

export function ReportViewLink({ to, children = 'View' }) {
  return (
    <Link to={to} className="crm-rlink">
      {children}
    </Link>
  );
}

export function ReportViewAll({ to, label = 'View all' }) {
  return (
    <div className="crm-rviewall">
      <Link to={to}>{label}</Link>
    </div>
  );
}

/** Needs attention / Action required tiles */
export function ReportAttentionGrid({ items = [], emptyMessage = 'All clear — nothing pending.' }) {
  if (!items.length) {
    return <p className="crm-rattention__empty">{emptyMessage}</p>;
  }

  return (
    <div className="crm-rattention">
      {items.map((item) => {
        const Icon = item.icon;
        return (
          <div key={item.id} className={`crm-rattention__item crm-rattention__item--${item.tone || 'warning'}`}>
            <span className="crm-rattention__icon">
              {Icon ? <Icon strokeWidth={1.75} /> : null}
            </span>
            <div className="crm-rattention__copy">
              <strong>{item.label}</strong>
              {item.description ? <span>{item.description}</span> : null}
            </div>
            {item.count != null && (
              <span className="crm-rattention__badge">{item.count}</span>
            )}
            {item.href ? (
              <Link to={item.href} className="crm-rattention__view">View</Link>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

/** Compact KPI strip for grouped summaries (Operations follow-up / demo) */
export function ReportMiniMetrics({ items = [] }) {
  return (
    <div className="crm-rmini">
      {items.map((item) => (
        <div key={item.key} className="crm-rmini__item">
          <p className="crm-rmini__label">{item.label}</p>
          <p className={`crm-rmini__value${item.tone ? ` crm-rmini__value--${item.tone}` : ''}`}>
            {item.value ?? '—'}
          </p>
        </div>
      ))}
    </div>
  );
}

/** Forces shared CRM DataGrid theme (ag-theme-crm) for every report table */
export function ReportSimpleTable({ columns = [], rows = [], empty = 'No records found.' }) {
  const agColumns = useMemo(() => toAgColumns(columns), [columns]);
  const rowData = useMemo(
    () => (rows || []).map((row, i) => ({
      ...row,
      __reportRowId: row?.id != null ? String(row.id) : `report-row-${i}`,
    })),
    [rows],
  );

  return (
    <div className="crm-report-datagrid">
      <DataGrid
        columns={agColumns}
        rowData={rowData}
        fitContent
        maxVisibleRows={Math.min(Math.max(rowData.length, 4), 12)}
        pagination={rowData.length > 25}
        paginationPageSize={25}
        hideSinglePagePagination
        emptyTitle={empty}
        getRowId={(p) => p.data.__reportRowId}
        className="crm-report-datagrid__shell"
      />
    </div>
  );
}

export function ReportPageNote({ children }) {
  return <p className="crm-rnote">{children}</p>;
}

export function ReportTargetCard({
  label,
  icon: Icon,
  tone = 'success',
  target,
  achieved,
  percent,
}) {
  const pct = Math.max(0, Math.min(100, Number(percent) || 0));
  const barTone = pct >= 100 ? 'success' : pct >= 80 ? 'warning' : 'danger';

  return (
    <div className="crm-rtarget">
      <div className="crm-rtarget__top">
        <span className={`crm-rtarget__icon crm-rtarget__icon--${tone}`}>
          {Icon ? <Icon strokeWidth={1.75} /> : null}
        </span>
        <strong className="crm-rtarget__name">{label}</strong>
        <div className="crm-rtarget__cols">
          <div>
            <span>Target</span>
            <b>{target}</b>
          </div>
          <div>
            <span>Achieved</span>
            <b className={barTone === 'danger' ? 'text-danger' : ''}>{achieved}</b>
          </div>
          <div>
            <span>Achievement %</span>
            <b>{pct.toFixed(1)}%</b>
          </div>
        </div>
      </div>
      <div className="crm-rtarget__bar">
        <span className={`crm-rtarget__fill crm-rtarget__fill--${barTone}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
