import { FiBarChart2, FiPieChart, FiGlobe, FiUsers } from 'react-icons/fi';
import {
  ReportBarChart,
  ReportPieChart,
  ReportLineChart,
} from '../../../reports/components/MuiReportCharts';

const CHART_HEIGHT = 128;

function ChartCard({ title, icon: Icon, meta, children }) {
  return (
    <div className="crm-reception-chart-card">
      <div className="crm-reception-chart-card__head">
        <Icon className="w-3.5 h-3.5 text-teal-700" />
        <span className="truncate">{title}</span>
        {meta && <span className="crm-reception-chart-card__meta">{meta}</span>}
      </div>
      <div className="crm-reception-chart-card__body">{children}</div>
    </div>
  );
}

function peakOf(rows, labelKey, valueKey) {
  const top = rows.reduce(
    (best, row) => (Number(row[valueKey]) > Number(best?.[valueKey] ?? -1) ? row : best),
    null,
  );
  if (!top || !Number(top[valueKey])) return null;
  return `${top[labelKey]} · ${top[valueKey]}`;
}

function totalOf(rows, valueKey) {
  const total = rows.reduce((sum, row) => sum + Number(row[valueKey] || 0), 0);
  return total ? `${total} total` : null;
}

/** Reception dashboard charts — Material UI X Charts */
export default function ReceptionChartsRow({ metrics = {} }) {
  const { byHour = [], bySource = [], byCountry = [], counsellorWorkload = [] } = metrics;
  const hasHour = byHour.some((r) => Number(r.count) > 0);
  const hasSource = bySource.some((r) => Number(r.value) > 0);
  const hasCountry = byCountry.some((r) => Number(r.value) > 0);
  const hasWorkload = counsellorWorkload.some((r) => Number(r.value) > 0);

  if (!hasHour && !hasSource && !hasCountry && !hasWorkload) return null;

  return (
    <div className="crm-reception-charts">
      {hasHour && (
        <ChartCard title="Walk-ins by hour" icon={FiBarChart2} meta={peakOf(byHour, 'hour', 'count')}>
          <ReportLineChart
            data={byHour}
            xKey="hour"
            yKey="count"
            height={CHART_HEIGHT}
            seriesLabel="Walk-ins"
            color="#0d9488"
            area
          />
        </ChartCard>
      )}

      {hasSource && (
        <ChartCard title="Lead sources" icon={FiPieChart} meta={totalOf(bySource, 'value')}>
          <ReportPieChart
            data={bySource}
            nameKey="name"
            valueKey="value"
            height={CHART_HEIGHT}
            innerRadius={28}
            outerRadius={46}
            hideLegend
          />
        </ChartCard>
      )}

      {hasCountry && (
        <ChartCard title="By country" icon={FiGlobe} meta={peakOf(byCountry, 'name', 'value')}>
          <ReportBarChart
            data={byCountry}
            xKey="name"
            yKey="value"
            height={CHART_HEIGHT}
            color="#0284c7"
            seriesLabel="Walk-ins"
          />
        </ChartCard>
      )}

      {hasWorkload && (
        <ChartCard title="Counsellor load" icon={FiUsers} meta={peakOf(counsellorWorkload, 'name', 'value')}>
          <ReportBarChart
            data={counsellorWorkload}
            xKey="name"
            yKey="value"
            height={CHART_HEIGHT}
            color="#059669"
            seriesLabel="Assigned"
          />
        </ChartCard>
      )}
    </div>
  );
}
