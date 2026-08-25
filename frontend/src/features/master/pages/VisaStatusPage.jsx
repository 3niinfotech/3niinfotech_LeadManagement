import CountryGroupedStatusPage from './CountryGroupedStatusPage';
import { API } from '../../../config/api';

export default function VisaStatusPage() {
  return (
    <CountryGroupedStatusPage
      entitySlug="visa-status-master"
      title="Visa Status"
      subtitle="Country-specific visa workflow statuses"
      breadcrumbLabel="Visa Status"
      countrySummaryPath={API.VISA_STATUS_COUNTRY_SUMMARY}
      addButtonLabel="Add Visa Status"
    />
  );
}
