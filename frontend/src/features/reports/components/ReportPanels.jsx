import {
  FiInbox,
  FiCheckCircle,
  FiPercent,
  FiUsers,
  FiPhone,
  FiMonitor,
  FiAlertTriangle,
} from 'react-icons/fi';
import { getEnquiryStatusLabel } from '../../../config/constants';
import {
  ReportBarChart,
  ReportPieChart,
  ReportDonutChart,
  ReportLineChart,
  ReportMultiBarChart,
  ReportFunnelChart,
  ReportGaugeChart,
} from './MuiReportCharts';
import {
  ReportMetricCard,
  ReportMetricGrid,
  ReportSectionCard,
  ReportSimpleTable,
} from './ReportCleanUi';

export {
  ReportBarChart,
  ReportPieChart,
  ReportDonutChart,
  ReportLineChart,
  ReportMultiBarChart,
  ReportFunnelChart,
  ReportGaugeChart,
} from './MuiReportCharts';

function rateBadge(row) {
  const r = Number(row.rate) || 0;
  if (r >= 20) return 'success';
  if (r > 0) return 'warning';
  return 'danger';
}

export function ReportTable({ columns, rows }) {
  return <ReportSimpleTable columns={columns} rows={rows || []} />;
}

export function ConversionReport({ data }) {
  const funnel = (data?.funnel || []).map((row) => ({
    ...row,
    label: getEnquiryStatusLabel(row.status),
  }));

  return (
    <div className="crm-report-stack">
      <ReportMetricGrid cols={3}>
        <ReportMetricCard label="Total Enquiries" value={data?.total ?? 0} icon={FiInbox} tone="primary" />
        <ReportMetricCard label="Converted" value={data?.converted ?? 0} icon={FiCheckCircle} tone="success" />
        <ReportMetricCard label="Conversion Rate" value={`${data?.rate ?? 0}%`} icon={FiPercent} tone="info" />
      </ReportMetricGrid>
      <div className="crm-report-grid-2">
        <ReportSectionCard title="Cone funnel" subtitle="Color stages by pipeline">
          <ReportFunnelChart data={funnel} nameKey="label" valueKey="count" height={280} />
        </ReportSectionCard>
        <ReportSectionCard title="Radial gauge" subtitle="Conversion rate">
          <ReportGaugeChart value={data?.rate ?? 0} label="Enquiry → converted" height={240} />
        </ReportSectionCard>
      </div>
      <div className="crm-report-grid-2">
        <ReportSectionCard title="Bar · stages" subtitle="Multi-color volume">
          <ReportBarChart data={funnel} xKey="label" yKey="count" height={260} />
        </ReportSectionCard>
        <ReportSectionCard title="Line · progression" subtitle="Stage curve">
          <ReportLineChart data={funnel} xKey="label" yKey="count" height={260} color="#0d9488" />
        </ReportSectionCard>
      </div>
    </div>
  );
}

export function SourceReport({ data = [] }) {
  const total = data.reduce((s, r) => s + (Number(r.count) || 0), 0);
  return (
    <div className="crm-report-stack">
      <ReportMetricGrid cols={3}>
        <ReportMetricCard label="Sources" value={data.length} icon={FiInbox} tone="primary" />
        <ReportMetricCard label="Enquiries" value={total} icon={FiUsers} tone="info" />
        <ReportMetricCard
          label="Converted"
          value={data.reduce((s, r) => s + (Number(r.converted) || 0), 0)}
          icon={FiCheckCircle}
          tone="success"
        />
      </ReportMetricGrid>
      <div className="crm-report-grid-2">
        <ReportSectionCard title="Donut · source mix" subtitle="Colorful share">
          <ReportDonutChart
            data={data}
            nameKey="source"
            valueKey="count"
            height={300}
            centerValue={total}
            centerLabel="Total"
          />
        </ReportSectionCard>
        <ReportSectionCard title="Pie · source" subtitle="Alternate mix">
          <ReportPieChart data={data} nameKey="source" valueKey="count" height={300} />
        </ReportSectionCard>
      </div>
      <ReportSectionCard title="Source conversion" subtitle="Enquiries vs converted">
        <ReportMultiBarChart
          data={data}
          xKey="source"
          series={[
            { key: 'count', label: 'Enquiries' },
            { key: 'converted', label: 'Converted' },
          ]}
          height={280}
        />
      </ReportSectionCard>
      <ReportSectionCard title="Source detail">
        <ReportSimpleTable
          columns={[
            { key: 'source', label: 'Source', swatchIndex: 0 },
            { key: 'count', label: 'Enquiries', align: 'right' },
            { key: 'converted', label: 'Converted', align: 'right' },
            {
              key: 'rate',
              label: 'Rate',
              align: 'right',
              render: (row) => `${row.rate}%`,
              badge: rateBadge,
            },
          ]}
          rows={data}
        />
      </ReportSectionCard>
    </div>
  );
}

export function CountryReport({ data = [] }) {
  return (
    <div className="crm-report-stack">
      <ReportMetricGrid cols={3}>
        <ReportMetricCard label="Countries" value={data.length} icon={FiInbox} tone="primary" />
        <ReportMetricCard
          label="Enquiries"
          value={data.reduce((s, r) => s + (Number(r.count) || 0), 0)}
          icon={FiUsers}
          tone="info"
        />
        <ReportMetricCard
          label="Converted"
          value={data.reduce((s, r) => s + (Number(r.converted) || 0), 0)}
          icon={FiCheckCircle}
          tone="success"
        />
      </ReportMetricGrid>
      <div className="crm-report-grid-2">
        <ReportSectionCard title="Bar · country" subtitle="Multi-color volume">
          <ReportBarChart data={data} xKey="country" yKey="count" height={300} />
        </ReportSectionCard>
        <ReportSectionCard title="Donut · country mix" subtitle="Share by destination">
          <ReportDonutChart data={data} nameKey="country" valueKey="count" height={300} />
        </ReportSectionCard>
      </div>
      <ReportSectionCard title="Country table">
        <ReportSimpleTable
          columns={[
            { key: 'country', label: 'Country', swatchIndex: 0 },
            { key: 'count', label: 'Enquiries', align: 'right' },
            { key: 'converted', label: 'Converted', align: 'right' },
            {
              key: 'rate',
              label: 'Rate',
              align: 'right',
              render: (row) => `${row.rate}%`,
              badge: rateBadge,
            },
          ]}
          rows={data}
        />
      </ReportSectionCard>
    </div>
  );
}

export function CounsellorReport({ data = [] }) {
  return (
    <div className="crm-report-stack">
      <ReportMetricGrid cols={4}>
        <ReportMetricCard label="Counsellors" value={data.length} icon={FiUsers} tone="primary" />
        <ReportMetricCard
          label="Assigned"
          value={data.reduce((s, r) => s + (Number(r.assigned) || 0), 0)}
          icon={FiInbox}
          tone="info"
        />
        <ReportMetricCard
          label="Converted"
          value={data.reduce((s, r) => s + (Number(r.converted) || 0), 0)}
          icon={FiCheckCircle}
          tone="success"
        />
        <ReportMetricCard
          label="Demos"
          value={data.reduce((s, r) => s + (Number(r.demos) || 0), 0)}
          icon={FiMonitor}
          tone="warning"
        />
      </ReportMetricGrid>
      <div className="crm-report-grid-2">
        <ReportSectionCard title="Counsellor pipeline" subtitle="Assigned vs converted">
          <ReportMultiBarChart
            data={data}
            xKey="name"
            series={[
              { key: 'assigned', label: 'Assigned' },
              { key: 'converted', label: 'Converted' },
            ]}
            height={300}
          />
        </ReportSectionCard>
        <ReportSectionCard title="Follow-ups & demos" subtitle="Activity bars">
          <ReportMultiBarChart
            data={data}
            xKey="name"
            series={[
              { key: 'followups', label: 'Follow-ups' },
              { key: 'demos', label: 'Demos' },
            ]}
            height={300}
          />
        </ReportSectionCard>
      </div>
      <ReportSectionCard title="Counsellor detail">
        <ReportSimpleTable
          columns={[
            { key: 'name', label: 'Counsellor', swatchIndex: 0 },
            { key: 'assigned', label: 'Assigned', align: 'right' },
            { key: 'converted', label: 'Converted', align: 'right' },
            {
              key: 'rate',
              label: 'Rate',
              align: 'right',
              render: (row) => `${row.rate}%`,
              badge: rateBadge,
            },
            { key: 'followups', label: 'Follow-ups', align: 'right' },
            { key: 'demos', label: 'Demos', align: 'right' },
          ]}
          rows={data}
        />
      </ReportSectionCard>
    </div>
  );
}

export function PerformanceReport({ data }) {
  const board = (data?.leaderboard || []).map((row) => ({ ...row, label: row.name }));
  const hasConverted = board.some((r) => Number(r.converted) > 0);
  const hasRate = board.some((r) => Number(r.rate) > 0);

  return (
    <div className="crm-report-stack">
      <ReportMetricGrid cols={4}>
        <ReportMetricCard label="Active Counsellors" value={data?.activeCounsellors ?? 0} icon={FiUsers} tone="primary" />
        <ReportMetricCard label="Follow-ups (Month)" value={data?.totalFollowupsThisMonth ?? 0} icon={FiPhone} tone="info" />
        <ReportMetricCard label="Demos Logged" value={data?.totalDemos ?? 0} icon={FiMonitor} tone="warning" />
        <ReportMetricCard label="Avg Conversion" value={`${data?.avgConversionRate ?? 0}%`} icon={FiPercent} tone="success" />
      </ReportMetricGrid>
      <div className="crm-report-grid-2">
        <ReportSectionCard title="Leaderboard" subtitle="Converted count (multi-color)">
          {hasConverted
            ? <ReportBarChart data={board} xKey="label" yKey="converted" height={280} seriesLabel="Converted" />
            : (
              <ReportBarChart
                data={board.map((r) => ({ ...r, assigned: r.assigned ?? r.leads ?? 0 }))}
                xKey="label"
                yKey="assigned"
                height={280}
                seriesLabel="Assigned"
              />
            )}
        </ReportSectionCard>
        <ReportSectionCard title="Rate / activity" subtitle={hasRate ? 'Conversion rate curve' : 'Follow-ups by counsellor'}>
          {hasRate
            ? <ReportLineChart data={board} xKey="label" yKey="rate" height={280} seriesLabel="Rate %" color="#7c3aed" />
            : (
              <ReportDonutChart
                data={board.map((r) => ({
                  name: r.label,
                  count: Number(r.followups || r.demos || r.assigned || 1),
                }))}
                nameKey="name"
                valueKey="count"
                height={280}
                centerLabel="Team"
                centerValue={board.length}
              />
            )}
        </ReportSectionCard>
      </div>
    </div>
  );
}

export function FollowUpReport({ data }) {
  return (
    <div className="crm-report-stack">
      <ReportMetricGrid cols={3}>
        <ReportMetricCard label="Due Today" value={data?.dueToday ?? 0} icon={FiPhone} tone="warning" />
        <ReportMetricCard label="Overdue" value={data?.overdue ?? 0} icon={FiAlertTriangle} tone="danger" />
        <ReportMetricCard label="Logged This Month" value={data?.loggedThisMonth ?? 0} icon={FiCheckCircle} tone="info" />
      </ReportMetricGrid>
      <ReportSectionCard title="Follow-ups by channel">
        <ReportBarChart data={data?.byStage || []} xKey="stage" height={280} />
      </ReportSectionCard>
    </div>
  );
}

export function DemoReport({ data }) {
  return (
    <div className="crm-report-stack">
      <div className="crm-report-grid-2">
        <ReportSectionCard title="Demo attendance">
          <ReportDonutChart data={data?.byAttendance || []} nameKey="attendance" height={280} />
        </ReportSectionCard>
        <ReportSectionCard title="Demo results">
          <ReportBarChart data={data?.byResult || []} xKey="result" height={280} />
        </ReportSectionCard>
      </div>
    </div>
  );
}

export function AttendanceReport({ data }) {
  const students = data?.class?.students || [];
  return (
    <div className="crm-report-stack">
      <ReportMetricGrid cols={4}>
        <ReportMetricCard label="Records" value={data?.class?.totals?.records ?? 0} icon={FiInbox} tone="info" />
        <ReportMetricCard label="Present" value={data?.class?.totals?.present ?? 0} icon={FiCheckCircle} tone="success" />
        <ReportMetricCard label="Absent" value={data?.class?.totals?.absent ?? 0} icon={FiAlertTriangle} tone="danger" />
        <ReportMetricCard label="Late" value={data?.class?.totals?.late ?? 0} icon={FiPhone} tone="warning" />
      </ReportMetricGrid>
      <ReportSectionCard title="Student attendance">
        <ReportSimpleTable
          columns={[
            {
              key: 'name',
              label: 'Student',
              render: (row) => `${row.student?.firstName || ''} ${row.student?.lastName || ''}`.trim(),
            },
            { key: 'batch', label: 'Batch', render: (row) => row.batch || '—' },
            { key: 'present', label: 'Present', align: 'right' },
            { key: 'absent', label: 'Absent', align: 'right' },
            { key: 'percent', label: '%', align: 'right', render: (row) => `${row.percent}%` },
          ]}
          rows={students.slice(0, 50)}
        />
      </ReportSectionCard>
      <DemoReport data={data?.demo} />
    </div>
  );
}

export function LostReasonReport({ data = [] }) {
  const total = data.reduce((s, r) => s + (Number(r.count) || 0), 0);
  return (
    <div className="crm-report-stack">
      <ReportMetricGrid cols={2}>
        <ReportMetricCard label="Lost reasons" value={data.length} icon={FiAlertTriangle} tone="warning" />
        <ReportMetricCard label="Lost volume" value={total} icon={FiInbox} tone="danger" />
      </ReportMetricGrid>
      <div className="crm-report-grid-2">
        <ReportSectionCard title="Lost reasons" subtitle="Multi-color horizontal bars">
          {data.length
            ? <ReportBarChart data={data} xKey="reason" yKey="count" layout="horizontal" height={300} />
            : <p className="crm-report-chart-empty">No lost reasons in this period.</p>}
        </ReportSectionCard>
        <ReportSectionCard title="Lost mix" subtitle="Donut series">
          {data.length
            ? (
              <ReportDonutChart
                data={data}
                nameKey="reason"
                valueKey="count"
                height={300}
                centerValue={total}
                centerLabel="Lost"
              />
            )
            : <p className="crm-report-chart-empty">No lost reasons in this period.</p>}
        </ReportSectionCard>
      </div>
    </div>
  );
}
