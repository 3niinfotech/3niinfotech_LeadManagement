import ReportPageShell from '../components/ReportPageShell';
import ExportReport from '../components/ExportReport';
import '../styles/reports.css';

export default function ReportsExportPage() {
  return (
    <ReportPageShell
      title="Backup / Export"
      subtitle="Tenant-safe CSV exports for enquiry, student, application and visa records"
      breadcrumbs={[{ label: 'Export' }]}
    >
      <ExportReport />
    </ReportPageShell>
  );
}
