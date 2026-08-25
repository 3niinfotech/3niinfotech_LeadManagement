import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid,
} from 'recharts';
import { FiBarChart2, FiPieChart, FiGlobe, FiUsers } from 'react-icons/fi';

/** Theme-aligned palette — avoid default purple AI look */
const COLORS = ['#0d9488', '#0284c7', '#059669', '#d97706', '#e11d48', '#475569'];
const CHART_HEIGHT = 116;

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

/** Head meta keeps the chart readable at a glance without opening a report */
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

function tipStyle() {
  return {
    borderRadius: 8,
    border: '1px solid var(--border)',
    fontSize: 12,
    boxShadow: '0 8px 24px rgb(15 23 42 / 0.08)',
  };
}

/** Empty charts only add noise — a card renders once it has real data. */
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
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <AreaChart data={byHour} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="walkinHourFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0d9488" stopOpacity={0.35} />
                  <stop offset="100%" stopColor="#0d9488" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="hour" tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} interval="preserveStartEnd" />
              <YAxis hide allowDecimals={false} />
              <Tooltip contentStyle={tipStyle()} />
              <Area type="monotone" dataKey="count" name="Walk-ins" stroke="#0d9488" fill="url(#walkinHourFill)" strokeWidth={2.25} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {hasSource && (
        <ChartCard title="Lead sources" icon={FiPieChart} meta={totalOf(bySource, 'value')}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <PieChart>
              <Pie
                data={bySource}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={32}
                outerRadius={48}
                paddingAngle={3}
              >
                {bySource.map((_, i) => (
                  <Cell key={i} fill={COLORS[i % COLORS.length]} stroke="var(--bg-card)" strokeWidth={2} />
                ))}
              </Pie>
              <Tooltip contentStyle={tipStyle()} />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {hasCountry && (
        <ChartCard title="Country interest" icon={FiGlobe} meta={peakOf(byCountry, 'name', 'value')}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={byCountry} layout="vertical" margin={{ left: 8, right: 12, top: 4, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--border)" />
              <XAxis type="number" hide />
              <YAxis type="category" dataKey="name" width={64} tick={{ fontSize: 10, fill: '#64748b' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tipStyle()} />
              <Bar dataKey="value" name="Visitors" fill="#0284c7" radius={[0, 6, 6, 0]} barSize={12} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}

      {hasWorkload && (
        <ChartCard title="Counsellor workload" icon={FiUsers} meta={totalOf(counsellorWorkload, 'value')}>
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={counsellorWorkload} margin={{ left: 4, right: 8, top: 8, bottom: 4 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
              <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} interval={0} axisLine={false} tickLine={false} />
              <YAxis hide allowDecimals={false} />
              <Tooltip contentStyle={tipStyle()} />
              <Bar dataKey="value" name="Active" fill="#059669" radius={[6, 6, 0, 0]} barSize={24} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      )}
    </div>
  );
}
