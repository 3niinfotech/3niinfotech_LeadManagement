import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from 'recharts';
import ChartCard from '../../../components/ui/ChartCard';
import StatCard from '../../../components/ui/StatCard';
import { getEnquiryStatusLabel } from '../../../config/constants';
import { useChartTheme } from '../../../hooks/useChartTheme';

export function ReportBarChart({ data, xKey, yKey = 'count', height = 280 }) {
  const { theme } = useChartTheme();
  if (!data?.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke={theme.grid} />
        <XAxis dataKey={xKey} tick={{ fontSize: 11, fill: theme.axis }} />
        <YAxis tick={{ fontSize: 11, fill: theme.axis }} />
        <Tooltip />
        <Bar dataKey={yKey} fill={theme.bar} radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

export function ReportPieChart({ data, nameKey, valueKey = 'count', height = 280 }) {
  const { colors, theme } = useChartTheme();
  if (!data?.length) return <EmptyChart />;

  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie data={data} dataKey={valueKey} nameKey={nameKey} cx="50%" cy="50%" outerRadius={100} label>
          {data.map((_, i) => (
            <Cell key={i} fill={colors[i % colors.length]} />
          ))}
        </Pie>
        <Tooltip />
      </PieChart>
    </ResponsiveContainer>
  );
}

function EmptyChart() {
  return (
    <p className="text-sm text-text-muted text-center py-16 border border-dashed border-border rounded-lg">
      No data for this period.
    </p>
  );
}

export function ReportTable({ columns, rows }) {
  if (!rows?.length) {
    return (
      <p className="text-sm text-text-muted text-center py-8 border border-dashed border-border rounded-lg">
        No records found.
      </p>
    );
  }

  return (
    <div className="rounded-lg border border-border overflow-x-auto">
      <table className="w-full text-sm">
        <thead className="bg-row-hover text-left text-text-secondary">
          <tr>
            {columns.map((col) => (
              <th key={col.key} className="px-3 py-2.5 font-semibold whitespace-nowrap">{col.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={row.id || index} className="border-t border-border hover:bg-row-hover/50">
              {columns.map((col) => (
                <td key={col.key} className="px-3 py-2.5 text-text-secondary whitespace-nowrap">
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function ConversionReport({ data }) {
  const funnel = (data?.funnel || []).map((row) => ({
    ...row,
    label: getEnquiryStatusLabel(row.status),
  }));

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Total Enquiries" value={data?.total || 0} color="primary" />
        <StatCard title="Converted" value={data?.converted || 0} color="success" />
        <StatCard title="Conversion Rate" value={`${data?.rate || 0}%`} color="info" />
      </div>
      <ChartCard title="Conversion Funnel">
        <ReportBarChart data={funnel} xKey="label" />
      </ChartCard>
    </div>
  );
}

export function SourceReport({ data = [] }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartCard title="Enquiries by Source">
        <ReportPieChart data={data} nameKey="source" />
      </ChartCard>
      <ChartCard title="Source Performance">
        <ReportTable
          columns={[
            { key: 'source', label: 'Source' },
            { key: 'count', label: 'Enquiries' },
            { key: 'converted', label: 'Converted' },
            { key: 'rate', label: 'Rate', render: (row) => `${row.rate}%` },
          ]}
          rows={data}
        />
      </ChartCard>
    </div>
  );
}

export function CountryReport({ data = [] }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartCard title="Enquiries by Country">
        <ReportBarChart data={data} xKey="country" />
      </ChartCard>
      <ChartCard title="Country Conversion">
        <ReportTable
          columns={[
            { key: 'country', label: 'Country' },
            { key: 'count', label: 'Enquiries' },
            { key: 'converted', label: 'Converted' },
            { key: 'rate', label: 'Rate', render: (row) => `${row.rate}%` },
          ]}
          rows={data}
        />
      </ChartCard>
    </div>
  );
}

export function CounsellorReport({ data = [] }) {
  return (
    <ChartCard title="Counsellor Pipeline">
      <ReportTable
        columns={[
          { key: 'name', label: 'Counsellor' },
          { key: 'assigned', label: 'Assigned' },
          { key: 'converted', label: 'Converted' },
          { key: 'rate', label: 'Rate', render: (row) => `${row.rate}%` },
          { key: 'followups', label: 'Follow-ups' },
          { key: 'demos', label: 'Demos' },
        ]}
        rows={data}
      />
    </ChartCard>
  );
}

export function PerformanceReport({ data }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard title="Active Counsellors" value={data?.activeCounsellors || 0} color="primary" />
        <StatCard title="Follow-ups (Month)" value={data?.totalFollowupsThisMonth || 0} color="info" />
        <StatCard title="Demos Logged" value={data?.totalDemos || 0} color="warning" />
        <StatCard title="Avg Conversion" value={`${data?.avgConversionRate || 0}%`} color="success" />
      </div>
      {data?.topCounsellor && (
        <div className="p-4 rounded-lg border border-border bg-brand-soft/30">
          <p className="text-sm font-semibold text-text">Top Performer</p>
          <p className="text-lg font-bold text-brand mt-1">{data.topCounsellor.name}</p>
          <p className="text-sm text-text-muted mt-0.5">
            {data.topCounsellor.converted} conversions · {data.topCounsellor.rate}% rate
          </p>
        </div>
      )}
      <ChartCard title="Leaderboard">
        <ReportBarChart
          data={(data?.leaderboard || []).map((row) => ({ ...row, label: row.name }))}
          xKey="label"
          yKey="converted"
        />
      </ChartCard>
    </div>
  );
}

export function FollowUpReport({ data }) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard title="Due Today" value={data?.dueToday || 0} color="warning" />
        <StatCard title="Overdue" value={data?.overdue || 0} color="danger" />
        <StatCard title="Logged This Month" value={data?.loggedThisMonth || 0} color="info" />
      </div>
      <ChartCard title="Follow-ups by Channel">
        <ReportBarChart data={data?.byStage || []} xKey="stage" />
      </ChartCard>
    </div>
  );
}

export function DemoReport({ data }) {
  return (
    <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
      <ChartCard title="Demo Attendance">
        <ReportPieChart data={data?.byAttendance || []} nameKey="attendance" />
      </ChartCard>
      <ChartCard title="Demo Results">
        <ReportBarChart data={data?.byResult || []} xKey="result" />
      </ChartCard>
      {data?.bySessionStatus?.length > 0 && (
        <ChartCard title="Demo Session Status">
          <ReportBarChart data={data.bySessionStatus} xKey="status" />
        </ChartCard>
      )}
    </div>
  );
}

export function AttendanceReport({ data }) {
  const students = data?.class?.students || [];
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatCard title="Records" value={data?.class?.totals?.records || 0} color="info" />
        <StatCard title="Present" value={data?.class?.totals?.present || 0} color="success" />
        <StatCard title="Absent" value={data?.class?.totals?.absent || 0} color="danger" />
        <StatCard title="Late" value={data?.class?.totals?.late || 0} color="warning" />
      </div>
      <ChartCard title="Student attendance %">
        <div className="overflow-auto">
          <table className="w-full text-sm">
            <thead className="text-left text-text-muted">
              <tr><th className="py-2">Student</th><th>Batch</th><th>Present</th><th>Absent</th><th>%</th></tr>
            </thead>
            <tbody>
              {students.slice(0, 50).map((row) => (
                <tr key={row.student?.id} className="border-t border-border">
                  <td className="py-2">{row.student?.firstName} {row.student?.lastName}</td>
                  <td>{row.batch || '—'}</td>
                  <td>{row.present}</td>
                  <td>{row.absent}</td>
                  <td>{row.percent}%{row.low ? ' · At risk' : ''}</td>
                </tr>
              ))}
              {students.length === 0 && (
                <tr><td className="py-4 text-text-muted" colSpan={5}>No class attendance in this range.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>
      <DemoReport data={data?.demo} />
    </div>
  );
}

export function LostReasonReport({ data = [] }) {
  return (
    <ChartCard title="Lost Reason Breakdown">
      <ReportBarChart data={data} xKey="reason" />
    </ChartCard>
  );
}
