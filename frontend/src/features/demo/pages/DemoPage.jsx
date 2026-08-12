import { FiMonitor } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import { ROUTES } from '../../../config/routes';

/** Phase 1 Demo module shell — scheduling, faculty, attendance, feedback (to be wired) */
export default function DemoPage() {
  return (
    <ModulePageCard
      title="Demo"
      subtitle="Demo scheduling, faculty assignment, attendance, feedback, and evaluation"
      icon={FiMonitor}
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Demo' },
      ]}
    >
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <Card className="min-h-[280px] flex flex-col">
          <EmptyState
            title="Demo module ready"
            description="Use Enquiry workspace for per-lead demos. This page will list all scheduled demos with AG Grid, filters, and bulk actions."
          />
        </Card>
      </div>
    </ModulePageCard>
  );
}
