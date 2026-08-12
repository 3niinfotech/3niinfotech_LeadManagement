import { useMemo } from 'react';
import SummaryStatBar from '../../../components/ui/SummaryStatBar';
import { buildEnquirySummaryItems } from '../config/enquirySummary.config';

/** Enquiry page adapter — uses global SummaryStatBar */
export default function EnquirySummaryCards({ summary, activeStatus, onSelect, loading }) {
  const items = useMemo(() => buildEnquirySummaryItems(summary), [summary]);

  return (
    <SummaryStatBar
      items={items}
      activeFilter={activeStatus}
      onSelect={onSelect}
      loading={loading}
      ariaLabel="Enquiry status filters"
    />
  );
}
