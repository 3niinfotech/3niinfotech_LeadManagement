import CountryGroupedStatusPage from './CountryGroupedStatusPage';
import { API } from '../../../config/api';

export default function ApplicationStatusPage() {
  return (
    <CountryGroupedStatusPage
      entitySlug="application-status-master"
      title="Application Status"
      subtitle="Country-specific workflow statuses"
      breadcrumbLabel="Application Status"
      countrySummaryPath={API.APPLICATION_STATUS_COUNTRY_SUMMARY}
      addButtonLabel="Add Application Status"
    />
  );
}
