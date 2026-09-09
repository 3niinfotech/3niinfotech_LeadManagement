import { FiTarget, FiUsers, FiPercent, FiDollarSign, FiSettings } from 'react-icons/fi';
import { Link } from 'react-router-dom';
import ReportPageShell from '../components/ReportPageShell';
import {
  ReportSectionCard,
  ReportTargetCard,
  ReportPageNote,
  ReportSimpleTable,
  ReportMetricGrid,
} from '../components/ReportCleanUi';
import { ReportGaugeChart } from '../components/MuiReportCharts';
import { ROUTES } from '../../../config/routes';
import '../styles/reports.css';

/** Targets module not configured — advanced empty state, no fabricated goals. */
export default function ReportsTargetsPage() {
  return (
    <ReportPageShell
      title="Targets"
      subtitle="Target vs achievement analysis"
      breadcrumbs={[{ label: 'Targets' }]}
      showExport
    >
      <div className="crm-report-stack">
        <div className="crm-report-hero-banner">
          <div>
            <h3 className="crm-report-hero-banner__title">Targets not configured</h3>
            <p className="crm-report-hero-banner__sub">
              Set lead, student, conversion and revenue targets to unlock colourful achievement
              gauges, counsellor scorecards and period comparisons.
            </p>
          </div>
          <Link to={ROUTES.SETTINGS} className="crm-report-hero-banner__cta">
            <FiSettings className="h-4 w-4" />
            Open settings
          </Link>
        </div>

        <ReportMetricGrid cols={4}>
          <ReportSectionCard title="Lead target" subtitle="Awaiting config">
            <ReportGaugeChart value={0} max={100} height={160} label="0% achieved" color="#2563eb" />
          </ReportSectionCard>
          <ReportSectionCard title="Student target" subtitle="Awaiting config">
            <ReportGaugeChart value={0} max={100} height={160} label="0% achieved" color="#0d9488" />
          </ReportSectionCard>
          <ReportSectionCard title="Conversion target" subtitle="Awaiting config">
            <ReportGaugeChart value={0} max={100} height={160} label="0% achieved" color="#d97706" />
          </ReportSectionCard>
          <ReportSectionCard title="Revenue target" subtitle="Awaiting config">
            <ReportGaugeChart value={0} max={100} height={160} label="0% achieved" color="#7c3aed" />
          </ReportSectionCard>
        </ReportMetricGrid>

        <div className="crm-report-grid-2">
          <div className="crm-report-stack">
            <ReportTargetCard
              label="Lead Target"
              icon={FiTarget}
              tone="success"
              target="—"
              achieved="—"
              percent={0}
            />
            <ReportTargetCard
              label="Student Target"
              icon={FiUsers}
              tone="warning"
              target="—"
              achieved="—"
              percent={0}
            />
          </div>
          <div className="crm-report-stack">
            <ReportTargetCard
              label="Conversion Target"
              icon={FiPercent}
              tone="warning"
              target="—"
              achieved="—"
              percent={0}
            />
            <ReportTargetCard
              label="Revenue Target"
              icon={FiDollarSign}
              tone="info"
              target="—"
              achieved="—"
              percent={0}
            />
          </div>
        </div>

        <ReportSectionCard title="Counsellor target achievement" subtitle="Scorecard">
          <ReportSimpleTable
            columns={[
              { key: 'name', label: 'Counsellor' },
              { key: 'leadTarget', label: 'Lead target', align: 'right' },
              { key: 'leads', label: 'Leads', align: 'right' },
              { key: 'leadPct', label: 'Achievement %', align: 'right' },
              { key: 'studentTarget', label: 'Student target', align: 'right' },
              { key: 'students', label: 'Students', align: 'right' },
              { key: 'studentPct', label: 'Achievement %', align: 'right' },
            ]}
            rows={[]}
            empty="No counsellor targets configured for this period."
          />
        </ReportSectionCard>

        <ReportPageNote>
          Note: Targets are not configured in this tenant yet. Configure lead / student / revenue
          targets before achievement reporting is available. No fabricated goals are shown.
        </ReportPageNote>
      </div>
    </ReportPageShell>
  );
}
