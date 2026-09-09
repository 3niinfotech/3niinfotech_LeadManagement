import { useId, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  AreaChart,
  Area,
  RadialBarChart,
  RadialBar,
  PolarAngleAxis,
  FunnelChart,
  Funnel,
  LabelList,
} from 'recharts';
import { useChartTheme } from '../../../hooks/useChartTheme';
import { normalizeCountryIso } from '../../../utils/countryFlag.util';

function EmptyChart({ height = 280 }) {
  return (
    <div className="crm-report-chart-empty" style={{ minHeight: height }}>
      No data for this period.
    </div>
  );
}

function isoToFlagEmoji(iso) {
  if (!iso || iso.length !== 2) return '';
  const A = 0x1F1E6;
  return String.fromCodePoint(
    ...[...iso.toUpperCase()].map((c) => A + c.charCodeAt(0) - 65),
  );
}

function withCountryFlagLabel(raw, keyHint) {
  const text = String(raw ?? '—');
  if (!text || text === '—') return text;
  const looksCountry = /country/i.test(String(keyHint || ''));
  if (!looksCountry) return text;
  const iso = normalizeCountryIso(text);
  const emoji = isoToFlagEmoji(iso);
  return emoji ? `${emoji} ${text}` : text;
}

function useTooltipStyle() {
  const { theme } = useChartTheme();
  return useMemo(() => ({
    contentStyle: {
      background: theme.tooltip?.bg || 'var(--bg-card)',
      border: `1px solid ${theme.grid || 'var(--border)'}`,
      borderRadius: 10,
      boxShadow: '0 8px 24px rgba(15, 23, 42, 0.08)',
      fontSize: 12,
      color: theme.tooltip?.text || 'var(--text-primary)',
    },
    itemStyle: { color: theme.tooltip?.text || 'var(--text-primary)' },
    labelStyle: { color: theme.axis || 'var(--text-muted)', fontWeight: 650 },
    cursor: { fill: 'color-mix(in srgb, var(--brand) 6%, transparent)' },
  }), [theme]);
}

function ChartFrame({ height, children }) {
  return (
    <div className="crm-recharts" style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

function mapSeriesRows(data, nameKey, valueKey) {
  return (Array.isArray(data) ? data : [])
    .map((row, i) => ({
      id: row.id ?? i,
      label: withCountryFlagLabel(row[nameKey], nameKey),
      value: Number(row[valueKey]) || 0,
      raw: row,
    }))
    .filter((row) => row.value > 0);
}

/** Vertical / horizontal bar — colorful by default */
export function ReportBarChart({
  data,
  xKey,
  yKey = 'count',
  height = 280,
  layout = 'vertical',
  color,
  colors: seriesColors,
  seriesLabel = 'Count',
  colorful = true,
}) {
  const { theme, colors } = useChartTheme();
  const tip = useTooltipStyle();
  const rows = (Array.isArray(data) ? data : []).map((r) => ({
    ...r,
    [xKey]: withCountryFlagLabel(r[xKey], xKey),
    [yKey]: Number(r[yKey]) || 0,
  }));
  if (!rows.length) return <EmptyChart height={height} />;

  const palette = seriesColors?.length ? seriesColors : colors;
  const fill = color || theme.bar || palette[0];
  const horizontal = layout === 'horizontal';
  const chartH = horizontal ? Math.max(height, rows.length * 36 + 48) : height;
  const barRadius = horizontal ? [0, 6, 6, 0] : [6, 6, 4, 4];

  return (
    <ChartFrame height={chartH}>
      <BarChart
        data={rows}
        layout={horizontal ? 'vertical' : 'horizontal'}
        margin={{ top: 12, right: 12, left: horizontal ? 8 : 0, bottom: 4 }}
        barCategoryGap="18%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke={theme.grid}
          vertical={!horizontal}
          horizontal
        />
        {horizontal ? (
          <>
            <XAxis type="number" tick={{ fill: theme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis
              type="category"
              dataKey={xKey}
              width={110}
              tick={{ fill: theme.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
          </>
        ) : (
          <>
            <XAxis
              dataKey={xKey}
              tick={{ fill: theme.axis, fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              interval={0}
              height={48}
            />
            <YAxis tick={{ fill: theme.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          </>
        )}
        <Tooltip {...tip} />
        <Bar
          dataKey={yKey}
          name={seriesLabel}
          radius={barRadius}
          maxBarSize={42}
          fill={fill}
        >
          {colorful && !color
            ? rows.map((_, i) => <Cell key={`bar-${i}`} fill={palette[i % palette.length]} />)
            : null}
        </Bar>
      </BarChart>
    </ChartFrame>
  );
}

/** Grouped / multi-series bar */
export function ReportMultiBarChart({ data, xKey, series = [], height = 300 }) {
  const { colors, theme } = useChartTheme();
  const tip = useTooltipStyle();
  const rows = Array.isArray(data) ? data : [];
  if (!rows.length || !series.length) return <EmptyChart height={height} />;

  const seriesColors = [colors[0], colors[2], colors[3], colors[1], colors[4], colors[5]];

  return (
    <ChartFrame height={height}>
      <BarChart data={rows} margin={{ top: 28, right: 12, left: 0, bottom: 4 }} barCategoryGap="22%">
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: theme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: theme.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
        <Tooltip {...tip} />
        <Legend verticalAlign="top" align="right" height={24} wrapperStyle={{ fontSize: 12 }} />
        {series.map((s, i) => (
          <Bar
            key={s.key}
            dataKey={s.key}
            name={s.label}
            fill={s.color || seriesColors[i % seriesColors.length]}
            radius={[5, 5, 0, 0]}
            maxBarSize={28}
          />
        ))}
      </BarChart>
    </ChartFrame>
  );
}

/** Pie (solid) */
export function ReportPieChart({
  data,
  nameKey,
  valueKey = 'count',
  height = 300,
  hideLegend = false,
}) {
  return (
    <ReportDonutChart
      data={data}
      nameKey={nameKey}
      valueKey={valueKey}
      height={height}
      hideLegend={hideLegend}
      innerRadius={0}
      outerRadius={Math.min(110, Math.round(height * 0.36))}
    />
  );
}

/** Donut */
export function ReportDonutChart({
  data,
  nameKey,
  valueKey = 'count',
  height = 300,
  innerRadius = 58,
  outerRadius = 100,
  hideLegend = false,
  centerLabel,
  centerValue,
  colors: seriesColors,
}) {
  const { colors, theme } = useChartTheme();
  const tip = useTooltipStyle();
  const rows = mapSeriesRows(data, nameKey, valueKey);
  if (!rows.length) return <EmptyChart height={height} />;

  const palette = seriesColors?.length ? seriesColors : colors;
  const pieData = rows.map((row, i) => ({
    name: row.label,
    value: row.value,
    fill: palette[i % palette.length],
  }));
  const ir = typeof innerRadius === 'number' ? innerRadius : 58;
  const or = typeof outerRadius === 'number' ? outerRadius : 100;

  return (
    <div className="crm-report-donut-wrap" style={{ position: 'relative', height }}>
      <ChartFrame height={height}>
        <PieChart margin={{ top: 8, right: 8, bottom: hideLegend ? 8 : 8, left: 8 }}>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy={hideLegend ? '50%' : '46%'}
            innerRadius={ir}
            outerRadius={or}
            paddingAngle={2}
            cornerRadius={3}
            stroke={theme.tooltip?.bg || 'var(--bg-card)'}
            strokeWidth={2}
          >
            {pieData.map((entry, i) => (
              <Cell key={`slice-${i}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip {...tip} />
          {!hideLegend && (
            <Legend
              verticalAlign="bottom"
              height={36}
              wrapperStyle={{ fontSize: 12 }}
              iconType="circle"
            />
          )}
        </PieChart>
      </ChartFrame>
      {(centerLabel != null || centerValue != null) && ir > 0 && (
        <div className="crm-report-donut-center" aria-hidden>
          {centerValue != null && <strong>{centerValue}</strong>}
          {centerLabel != null && <span>{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

/** Line / area trend */
export function ReportLineChart({
  data,
  xKey,
  yKey = 'count',
  height = 280,
  area = true,
  color,
  seriesLabel = 'Trend',
}) {
  const { theme, colors } = useChartTheme();
  const tip = useTooltipStyle();
  const gradId = useId().replace(/:/g, '');
  const rows = Array.isArray(data) ? data : [];
  if (!rows.length) return <EmptyChart height={height} />;

  const stroke = color || colors[1] || theme.bar;

  if (area) {
    return (
      <ChartFrame height={height}>
        <AreaChart data={rows} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={`area-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.35} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
          <XAxis dataKey={xKey} tick={{ fill: theme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
          <YAxis tick={{ fill: theme.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
          <Tooltip {...tip} />
          <Area
            type="monotone"
            dataKey={yKey}
            name={seriesLabel}
            stroke={stroke}
            strokeWidth={2.4}
            fill={`url(#area-${gradId})`}
            dot={{ r: 3.2, strokeWidth: 0, fill: stroke }}
            activeDot={{ r: 5 }}
          />
        </AreaChart>
      </ChartFrame>
    );
  }

  return (
    <ChartFrame height={height}>
      <LineChart data={rows} margin={{ top: 12, right: 12, left: 0, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} vertical={false} />
        <XAxis dataKey={xKey} tick={{ fill: theme.axis, fontSize: 11 }} axisLine={false} tickLine={false} />
        <YAxis tick={{ fill: theme.axis, fontSize: 11 }} axisLine={false} tickLine={false} width={36} />
        <Tooltip {...tip} />
        <Line
          type="monotone"
          dataKey={yKey}
          name={seriesLabel}
          stroke={stroke}
          strokeWidth={2.4}
          dot={{ r: 3.2, strokeWidth: 0, fill: stroke }}
          activeDot={{ r: 5 }}
        />
      </LineChart>
    </ChartFrame>
  );
}

/** Half-donut / payment progress */
export function ReportSemiDonutChart({
  data,
  nameKey = 'label',
  valueKey = 'count',
  height = 200,
  colors: seriesColors,
  centerLabel,
  centerValue,
}) {
  const { colors, theme } = useChartTheme();
  const tip = useTooltipStyle();
  const rows = (Array.isArray(data) ? data : [])
    .map((row, i) => ({
      name: String(row[nameKey] ?? '—'),
      value: Number(row[valueKey]) || 0,
      fill: (seriesColors?.[i]) || colors[i % colors.length],
    }))
    .filter((r) => r.value > 0);

  if (!rows.length) return <EmptyChart height={height} />;

  return (
    <div className="crm-report-donut-wrap crm-report-donut-wrap--semi" style={{ position: 'relative', height }}>
      <ChartFrame height={height}>
        <PieChart margin={{ top: 0, right: 8, bottom: -12, left: 8 }}>
          <Pie
            data={rows}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="78%"
            startAngle={180}
            endAngle={0}
            innerRadius={58}
            outerRadius={88}
            paddingAngle={2}
            stroke={theme.tooltip?.bg || 'var(--bg-card)'}
            strokeWidth={2}
          >
            {rows.map((entry, i) => (
              <Cell key={`semi-${i}`} fill={entry.fill} />
            ))}
          </Pie>
          <Tooltip {...tip} />
        </PieChart>
      </ChartFrame>
      {(centerLabel != null || centerValue != null) && (
        <div className="crm-report-donut-center crm-report-donut-center--semi" aria-hidden>
          {centerValue != null && <strong>{centerValue}</strong>}
          {centerLabel != null && <span>{centerLabel}</span>}
        </div>
      )}
    </div>
  );
}

/** Radial gauge for rate KPIs */
export function ReportGaugeChart({
  value = 0,
  max = 100,
  height = 220,
  label = '',
  color,
}) {
  const { colors, theme } = useChartTheme();
  const n = Math.max(0, Number(value) || 0);
  const ceiling = Math.max(max, 1);
  const fill = color || (n >= 40 ? colors[2] : n >= 20 ? colors[1] : colors[0]);
  const data = [{ name: label || 'value', value: n, fill }];

  return (
    <div className="crm-report-gauge">
      <ChartFrame height={height}>
        <RadialBarChart
          cx="50%"
          cy="62%"
          innerRadius="62%"
          outerRadius="100%"
          startAngle={210}
          endAngle={-30}
          data={data}
          margin={{ top: 0, right: 0, bottom: 0, left: 0 }}
        >
          <PolarAngleAxis type="number" domain={[0, ceiling]} tick={false} />
          <RadialBar
            background={{ fill: 'color-mix(in srgb, var(--border) 70%, var(--bg-page))' }}
            dataKey="value"
            cornerRadius={10}
          >
            <Cell fill={fill} />
          </RadialBar>
          <text
            x="50%"
            y="58%"
            textAnchor="middle"
            dominantBaseline="middle"
            style={{
              fontSize: 26,
              fontWeight: 750,
              fill: theme.tooltip?.text || 'var(--text-primary)',
            }}
          >
            {`${Math.round(n)}%`}
          </text>
        </RadialBarChart>
      </ChartFrame>
      {label ? <p className="crm-report-gauge__label">{label}</p> : null}
    </div>
  );
}

/** Funnel stages */
export function ReportFunnelChart({
  data,
  nameKey = 'label',
  valueKey = 'count',
  height = 300,
}) {
  const { colors, theme } = useChartTheme();
  const tip = useTooltipStyle();
  const rows = (Array.isArray(data) ? data : []).map((row, i) => ({
    name: String(row[nameKey] ?? '—'),
    value: Number(row[valueKey]) || 0,
    fill: colors[i % colors.length],
  })).filter((r) => r.value > 0);

  if (!rows.length) return <EmptyChart height={height} />;

  return (
    <div className="crm-report-funnel">
      <ChartFrame height={Math.max(height - 72, 180)}>
        <FunnelChart margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
          <Tooltip {...tip} />
          <Funnel dataKey="value" data={rows} isAnimationActive>
            <LabelList
              position="center"
              fill="#fff"
              stroke="none"
              dataKey="value"
              style={{ fontSize: 12, fontWeight: 700 }}
            />
            {rows.map((entry, i) => (
              <Cell key={`funnel-${i}`} fill={entry.fill} stroke={theme.grid} />
            ))}
          </Funnel>
        </FunnelChart>
      </ChartFrame>
      <ul className="crm-report-funnel__legend">
        {rows.map((s) => (
          <li key={s.name}>
            <span className="crm-report-funnel__swatch" style={{ background: s.fill }} />
            <span className="crm-report-funnel__name">{s.name}</span>
            <span className="crm-report-funnel__val">{s.value}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Mini sparkline for KPI accents */
export function ReportSparkline({ values = [], color, height = 36, width = 88 }) {
  const { theme, colors } = useChartTheme();
  const data = (values || []).map((v, i) => ({ i, v: Number(v) || 0 }));
  if (data.length < 2) return null;
  const stroke = color || theme.bar || colors[0];
  const gradId = useId().replace(/:/g, '');

  return (
    <div style={{ width, height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 4, right: 0, left: 0, bottom: 4 }}>
          <defs>
            <linearGradient id={`spark-${gradId}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={stroke} stopOpacity={0.3} />
              <stop offset="100%" stopColor={stroke} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke={stroke}
            strokeWidth={1.8}
            fill={`url(#spark-${gradId})`}
            dot={false}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
