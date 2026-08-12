import { FiDollarSign } from 'react-icons/fi';
import ModulePageCard from '../../../components/layout/ModulePageLayout';
import Card from '../../../components/ui/Card';
import EmptyState from '../../../components/ui/EmptyState';
import { ROUTES } from '../../../config/routes';

/** Phase 1 Fees module shell — plans, installments, payments, ledger */
export default function FeesPage() {
  return (
    <ModulePageCard
      title="Fees"
      subtitle="Fee plans, installments, payments, receipts, ledger, and outstanding balance"
      icon={FiDollarSign}
      breadcrumbs={[
        { label: 'Dashboard', path: ROUTES.DASHBOARD },
        { label: 'Fees' },
      ]}
    >
      <div className="flex-1 min-h-0 overflow-auto p-4">
        <Card className="min-h-[280px] flex flex-col">
          <EmptyState
            title="Fees module ready"
            description="Fee plans, payment recording, and ledger views will be built here using the existing AG Grid, filters, and form components."
          />
        </Card>
      </div>
    </ModulePageCard>
  );
}
